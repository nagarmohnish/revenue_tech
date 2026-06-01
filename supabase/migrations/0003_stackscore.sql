-- 0003_stackscore.sql
-- StackScore: subscription/payment-stack analysis reports.
-- Anonymous, public-shareable by opaque UUID. RLS on, service-role only.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS stackscore_reports (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  url         text,
  hostname    text,
  input_kind  text        NOT NULL CHECK (input_kind IN ('url', 'screenshot')),
  score       int         NOT NULL CHECK (score BETWEEN 0 AND 100),
  payload     jsonb       NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stackscore_reports_hostname ON stackscore_reports (hostname);
CREATE INDEX IF NOT EXISTS idx_stackscore_reports_created  ON stackscore_reports (created_at DESC);

ALTER TABLE stackscore_reports ENABLE ROW LEVEL SECURITY;
-- service-role bypasses RLS; no public policies — all access goes through the
-- /api/stackscore endpoints using the service-role key.
