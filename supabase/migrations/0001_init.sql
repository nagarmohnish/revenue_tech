-- AgentMint — MVP schema (full PRD §8)

-- ============================================================
-- 1. Identity
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text UNIQUE NOT NULL,
  name         text,
  avatar_url   text,
  created_at   timestamptz DEFAULT now()
);

-- ============================================================
-- 2. Workspace (billing unit — one per signup)
-- ============================================================
CREATE TABLE IF NOT EXISTS workspaces (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  name                 text NOT NULL,
  stripe_customer_id   text UNIQUE,
  plan                 text DEFAULT 'trial',
  status               text DEFAULT 'trialing',
  current_period_end   timestamptz,
  created_at           timestamptz DEFAULT now()
);

-- ============================================================
-- 3. Wallet (one per workspace)
-- ============================================================
CREATE TABLE IF NOT EXISTS wallets (
  workspace_id   uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  balance        integer NOT NULL DEFAULT 0,
  updated_at     timestamptz DEFAULT now()
);

-- ============================================================
-- 4. Wallet transactions (append-only ledger)
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id             bigserial PRIMARY KEY,
  workspace_id   uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  type           text CHECK (type IN ('GRANT','DEBIT','TOPUP','REFUND','EXPIRY','ADJUSTMENT')),
  amount         integer NOT NULL,
  balance_after  integer NOT NULL,
  product        text,
  action         text,
  resource_id    uuid,
  stripe_ref     text,
  admin_note     text,
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_ws_created ON wallet_transactions(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_resource ON wallet_transactions(workspace_id, resource_id, type);

-- ============================================================
-- 5. Usage events (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_events (
  id               bigserial PRIMARY KEY,
  workspace_id     uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id          uuid REFERENCES users(id) ON DELETE SET NULL,
  product          text NOT NULL,
  action           text NOT NULL,
  credits_charged  integer NOT NULL,
  resource_id      uuid,
  model            text,
  tokens           integer,
  latency_ms       integer,
  meta             jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_usage_ws_created ON usage_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_product_created ON usage_events(product, created_at DESC);

-- ============================================================
-- 6. Subscriptions (mirror of Stripe state)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  workspace_id            uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_subscription_id  text UNIQUE NOT NULL,
  plan                    text NOT NULL,
  status                  text NOT NULL,
  current_period_end      timestamptz,
  cancelled_at            timestamptz
);

-- ============================================================
-- 7. Tool registry (all 6 agents)
-- ============================================================
CREATE TABLE IF NOT EXISTS tool_registry (
  product_id      text PRIMARY KEY,
  company         text NOT NULL,
  display_name    text NOT NULL,
  available_on    text[] NOT NULL,
  actions         jsonb NOT NULL,
  is_active       boolean DEFAULT true,
  integrated      boolean DEFAULT false,
  available_phase text
);

-- ============================================================
-- 8. Stripe webhook dedup
-- ============================================================
CREATE TABLE IF NOT EXISTS stripe_events (
  stripe_event_id  text PRIMARY KEY,
  event_type       text NOT NULL,
  workspace_id     uuid,
  processed        boolean DEFAULT false,
  processed_at     timestamptz
);

-- ============================================================
-- 9. Funnel events (append-only — PostHog-compatible mirror)
-- ============================================================
CREATE TABLE IF NOT EXISTS funnel_events (
  id             bigserial PRIMARY KEY,
  workspace_id   uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  event_name     text NOT NULL,
  product        text,
  meta           jsonb DEFAULT '{}'::jsonb,
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_funnel_ws_event ON funnel_events(workspace_id, event_name, created_at DESC);

-- ============================================================
-- 10. Low-credit alert tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS low_credit_alerts (
  id             bigserial PRIMARY KEY,
  workspace_id   uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  sent_at        timestamptz DEFAULT now(),
  period_end     timestamptz
);
CREATE INDEX IF NOT EXISTS idx_lca_ws_period ON low_credit_alerts(workspace_id, period_end);

-- ============================================================
-- atomic_debit() — single-transaction debit with advisory lock
-- ============================================================
CREATE OR REPLACE FUNCTION atomic_debit(
  p_workspace_id uuid,
  p_cost         integer,
  p_product      text,
  p_action       text,
  p_resource_id  uuid,
  p_model        text DEFAULT NULL,
  p_tokens       integer DEFAULT NULL,
  p_latency_ms   integer DEFAULT NULL,
  p_user_id      uuid DEFAULT NULL
)
RETURNS TABLE(balance_after integer) AS $$
DECLARE
  v_new_balance integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_workspace_id::text));

  UPDATE wallets
     SET balance = balance - p_cost, updated_at = now()
   WHERE workspace_id = p_workspace_id
     AND balance >= p_cost
   RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO wallet_transactions
    (workspace_id, type, amount, balance_after, product, action, resource_id)
  VALUES
    (p_workspace_id, 'DEBIT', -p_cost, v_new_balance, p_product, p_action, p_resource_id);

  INSERT INTO usage_events
    (workspace_id, user_id, product, action, credits_charged, resource_id, model, tokens, latency_ms)
  VALUES
    (p_workspace_id, p_user_id, p_product, p_action, p_cost, p_resource_id, p_model, p_tokens, p_latency_ms);

  balance_after := v_new_balance;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- grant_credits() — used by webhook + signup trial grant
-- ============================================================
CREATE OR REPLACE FUNCTION grant_credits(
  p_workspace_id uuid,
  p_amount       integer,
  p_type         text,
  p_stripe_ref   text DEFAULT NULL,
  p_note         text DEFAULT NULL
)
RETURNS TABLE(balance_after integer) AS $$
DECLARE
  v_new_balance integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_workspace_id::text));

  INSERT INTO wallets (workspace_id, balance) VALUES (p_workspace_id, 0)
  ON CONFLICT (workspace_id) DO NOTHING;

  UPDATE wallets
     SET balance = balance + p_amount, updated_at = now()
   WHERE workspace_id = p_workspace_id
   RETURNING balance INTO v_new_balance;

  INSERT INTO wallet_transactions
    (workspace_id, type, amount, balance_after, stripe_ref, admin_note)
  VALUES
    (p_workspace_id, p_type, p_amount, v_new_balance, p_stripe_ref, p_note);

  balance_after := v_new_balance;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Seed tool registry
-- ============================================================
INSERT INTO tool_registry (product_id, company, display_name, available_on, actions, integrated, available_phase) VALUES
  ('scanner','sparrwo','AI Visibility Scanner', ARRAY['trial','starter','growth','scale'],
    '[{"action_id":"scan_domain","cost":50,"label":"Full domain scan"},
      {"action_id":"scan_query","cost":10,"label":"Single query check"}]'::jsonb, true, null),
  ('postflwo','sparrwo','PostFlwo Content Agent', ARRAY['growth','scale'],
    '[{"action_id":"write_article","cost":45,"label":"Research + write + format"},
      {"action_id":"reformat_existing","cost":15,"label":"Reformat for AI citation"}]'::jsonb, false, 'Phase 1'),
  ('bekbone','sparrwo','Bekbone LinkedIn Agent', ARRAY['growth','scale'],
    '[{"action_id":"draft_post","cost":8,"label":"Draft LinkedIn post"},
      {"action_id":"schedule_post","cost":3,"label":"Schedule post"}]'::jsonb, false, 'Phase 1'),
  ('blog_writer','boring_monkee','Blog Writer', ARRAY['trial','starter','growth','scale'],
    '[{"action_id":"generate_1500w","cost":20,"label":"Generate 1,500-word article"},
      {"action_id":"generate_500w","cost":8,"label":"Generate 500-word article"}]'::jsonb, true, null),
  ('aeo_optimizer','boring_monkee','AEO/GEO Optimizer', ARRAY['growth','scale'],
    '[{"action_id":"score_page","cost":30,"label":"Score single page"},
      {"action_id":"score_domain","cost":80,"label":"Full domain AEO audit"}]'::jsonb, false, 'Phase 1'),
  ('content_studio','boring_monkee','Content Studio', ARRAY['trial','starter','growth','scale'],
    '[{"action_id":"generate_post","cost":2,"label":"Generate social post"}]'::jsonb, true, null)
ON CONFLICT (product_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  available_on = EXCLUDED.available_on,
  actions      = EXCLUDED.actions,
  integrated   = EXCLUDED.integrated,
  available_phase = EXCLUDED.available_phase;

-- ============================================================
-- RLS (basic — service role bypasses; app uses service role
--      and enforces workspace scope in code via session)
-- ============================================================
ALTER TABLE wallets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions       ENABLE ROW LEVEL SECURITY;
