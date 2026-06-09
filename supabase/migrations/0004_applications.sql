-- 0004_applications.sql
-- Concierge MVP intake: builders describe their agent + monetization needs;
-- the AgentMint team builds the monetization layer for them.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS applications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact
  name              text NOT NULL,
  email             text NOT NULL,
  company           text,

  -- Agent
  agent_name        text NOT NULL,
  agent_desc        text NOT NULL,
  lifecycle         text NOT NULL CHECK (lifecycle IN ('idea', 'building', 'live_no_billing', 'live_with_billing')),
  volume_estimate   text NOT NULL CHECK (volume_estimate IN ('lt_100', '100_1k', '1k_10k', '10k_100k', 'gt_100k')),

  -- Monetization intent
  billing_pref      text NOT NULL CHECK (billing_pref IN ('prepaid', 'usage', 'both', 'not_sure')),
  geography         text NOT NULL CHECK (geography IN ('usd', 'inr', 'both', 'other')),
  geography_other   text,

  -- Stack + timing
  stack             text NOT NULL,
  timeline          text NOT NULL CHECK (timeline IN ('week', 'month', 'quarter', 'exploring')),
  notes             text,

  -- Internal pipeline
  status            text NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'contacted', 'scoping', 'building', 'live', 'declined')),
  internal_notes    text,

  -- Meta
  user_agent        text,
  referrer          text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  contacted_at      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_applications_status  ON applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_email   ON applications (email);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- service-role only; the /api/apply route is the sole writer, /admin reads via service-role too.

CREATE OR REPLACE FUNCTION applications_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_applications_updated_at ON applications;
CREATE TRIGGER tr_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION applications_set_updated_at();
