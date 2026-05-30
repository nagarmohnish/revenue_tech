-- AgentMint - Multi-tenant migration
-- Introduces the agency/tenant layer above workspaces, plus API keys.
-- Idempotent: safe to re-run.

-- ============================================================
-- 1. Tenants (the agency / agent company)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text UNIQUE NOT NULL,            -- e.g. "acme-agents"
  name                  text NOT NULL,                   -- "Acme Agents Co"
  mode                  text DEFAULT 'hosted'            -- hosted | api_only
                        CHECK (mode IN ('hosted','api_only')),
  brand_color           text DEFAULT '#10a868',
  stripe_account_id     text UNIQUE,                     -- Stripe Connect account
  stripe_account_status text,                            -- 'pending', 'active', etc.
  platform_fee_bps      integer DEFAULT 500,             -- basis points (500 = 5%)
  created_at            timestamptz DEFAULT now()
);

-- ============================================================
-- 2. Tenant members (agency staff with roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_users (
  tenant_id     uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES users(id)   ON DELETE CASCADE,
  role          text DEFAULT 'owner'
                CHECK (role IN ('owner','admin','member','viewer')),
  invited_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);

-- ============================================================
-- 3. API keys (hashed bearer tokens for SDK)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name          text NOT NULL,                          -- "production", "staging"
  prefix        text NOT NULL,                          -- visible prefix e.g. "am_live_a1b2"
  key_hash      text NOT NULL,                          -- sha256 hash of the full key
  scopes        text[] DEFAULT ARRAY['authorize','debit']::text[],
  last_used_at  timestamptz,
  revoked_at    timestamptz,
  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_apikeys_tenant ON tenant_api_keys(tenant_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_apikeys_prefix ON tenant_api_keys(prefix);

-- ============================================================
-- 4. Tenant plan configs (replaces hard-coded global plans)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_plan_configs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id        text NOT NULL,                          -- 'trial', 'starter', 'growth'
  display_name   text NOT NULL,
  price_usd      integer,                                -- null = free
  credits        integer NOT NULL,
  is_active      boolean DEFAULT true,
  stripe_price_id text,                                  -- Stripe price ID on tenant's Connect account
  sort_order     integer DEFAULT 100,
  UNIQUE (tenant_id, plan_id)
);
CREATE INDEX IF NOT EXISTS idx_plan_configs_tenant ON tenant_plan_configs(tenant_id, is_active);

-- ============================================================
-- 5. Add tenant_id to existing tables (backfill via default tenant)
-- ============================================================
ALTER TABLE workspaces           ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE tool_registry        ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE subscriptions        ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE wallet_transactions  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE usage_events         ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE funnel_events        ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE stripe_events        ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- ============================================================
-- 6. Default "system" tenant for any pre-existing data
-- ============================================================
INSERT INTO tenants (id, slug, name, mode)
VALUES ('00000000-0000-0000-0000-000000000001', 'system', 'AgentMint Demo', 'hosted')
ON CONFLICT (id) DO NOTHING;

UPDATE workspaces           SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE tool_registry        SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE subscriptions        SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE wallet_transactions  SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE usage_events         SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE funnel_events        SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- Seed default plan configs on system tenant (so existing demo workspaces keep working)
INSERT INTO tenant_plan_configs (tenant_id, plan_id, display_name, price_usd, credits, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'trial',   'Trial',   0,    100,   10),
  ('00000000-0000-0000-0000-000000000001', 'starter', 'Starter', 49,   500,   20),
  ('00000000-0000-0000-0000-000000000001', 'growth',  'Growth',  199,  2500,  30)
ON CONFLICT (tenant_id, plan_id) DO NOTHING;

-- ============================================================
-- 7. Tenant-scoped indexes for hot paths
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant       ON workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tool_registry_tenant   ON tool_registry(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant    ON usage_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_tenant       ON wallet_transactions(tenant_id, created_at DESC);

-- ============================================================
-- 8. Tool registry: product_id needs to be UNIQUE PER TENANT, not global
-- ============================================================
-- Drop the global PK on product_id (legacy from 0001) and replace it with a
-- composite (tenant_id, product_id) PK so two tenants can ship agents with the
-- same product_id without colliding.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'tool_registry'::regclass AND conname = 'tool_registry_pkey'
  ) THEN
    ALTER TABLE tool_registry DROP CONSTRAINT tool_registry_pkey;
  END IF;
END $$;

-- Ensure tenant_id is non-null for the composite PK (existing rows were backfilled above).
ALTER TABLE tool_registry ALTER COLUMN tenant_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tool_registry_tenant_product_pk'
  ) THEN
    ALTER TABLE tool_registry ADD CONSTRAINT tool_registry_tenant_product_pk PRIMARY KEY (tenant_id, product_id);
  END IF;
END $$;

-- ============================================================
-- 9. RPC: create_tenant_api_key
-- Returns the new key id + prefix. The caller computes and stores key_hash.
-- ============================================================
CREATE OR REPLACE FUNCTION register_api_key(
  p_tenant_id uuid,
  p_name      text,
  p_prefix    text,
  p_key_hash  text,
  p_scopes    text[],
  p_user_id   uuid
)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO tenant_api_keys (tenant_id, name, prefix, key_hash, scopes, created_by)
  VALUES (p_tenant_id, p_name, p_prefix, p_key_hash, p_scopes, p_user_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 10. RPC: resolve_api_key
-- Given a sha256 hash, return tenant + scopes + key_id, or null if revoked/missing.
-- ============================================================
CREATE OR REPLACE FUNCTION resolve_api_key(p_key_hash text)
RETURNS TABLE(tenant_id uuid, key_id uuid, scopes text[]) AS $$
BEGIN
  RETURN QUERY
  SELECT tk.tenant_id, tk.id, tk.scopes
    FROM tenant_api_keys tk
   WHERE tk.key_hash = p_key_hash
     AND tk.revoked_at IS NULL
   LIMIT 1;

  -- best-effort last_used_at update
  UPDATE tenant_api_keys
     SET last_used_at = now()
   WHERE key_hash = p_key_hash AND revoked_at IS NULL;
END;
$$ LANGUAGE plpgsql;
