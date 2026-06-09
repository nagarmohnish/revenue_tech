-- 0006_audits.sql
-- Tool 1: free pricing-audit reports for any public domain. Anonymous, shareable.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS pricing_audits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain       text NOT NULL,
  url          text NOT NULL,
  score        int NOT NULL CHECK (score BETWEEN 0 AND 100),
  payload      jsonb NOT NULL,
  generated_by text NOT NULL CHECK (generated_by IN ('claude','template')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_audits_domain  ON pricing_audits (domain);
CREATE INDEX IF NOT EXISTS idx_pricing_audits_created ON pricing_audits (created_at DESC);

ALTER TABLE pricing_audits ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
