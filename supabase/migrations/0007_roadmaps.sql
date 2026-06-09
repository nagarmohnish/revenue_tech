-- 0007_roadmaps.sql
-- Tool 2: deep monetization roadmap intake. Companies with existing agents
-- + clients describe their stack/billing/integration surface; we produce
-- a roadmap + onboarding checklist (analysis pipeline shipped next iteration).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS monetization_roadmaps (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact
  name            text NOT NULL,
  email           text NOT NULL,
  company         text NOT NULL,
  role            text,

  -- Company surface
  website         text NOT NULL,
  agents_summary  text NOT NULL,            -- free-text: what the agents are, broadly
  agent_count     int  NOT NULL CHECK (agent_count BETWEEN 1 AND 999),
  client_count    text NOT NULL CHECK (client_count IN ('lt_5','5_25','25_100','gt_100')),

  -- Current billing
  pricing_now     text NOT NULL,            -- how they price today (free text)
  charging_method text NOT NULL CHECK (charging_method IN ('none', 'manual_invoice', 'stripe', 'paypal', 'razorpay', 'other', 'mixed')),
  charging_other  text,
  payout_method   text NOT NULL CHECK (payout_method IN ('not_setup', 'stripe', 'paypal', 'wire', 'razorpay', 'other')),
  payout_other    text,

  -- Tech surface (so we can scope integration plan)
  stack           text NOT NULL,
  ai_tools        text NOT NULL,            -- comma-separated list, free text
  integrations    text,                     -- their other integrations
  doc_links       text,                     -- newline-separated URLs/notes pointing at additional docs

  -- Concierge
  shareable_creds text,                     -- explicitly what they're willing to share access to (label only, never the secrets)
  timeline        text NOT NULL CHECK (timeline IN ('week','month','quarter','exploring')),
  notes           text,

  -- Pipeline
  status          text NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','scoping','contacted','building','live','declined')),
  internal_notes  text,

  -- Roadmap output (next iteration writes this)
  roadmap         jsonb,
  roadmap_status  text DEFAULT 'pending'
                  CHECK (roadmap_status IN ('pending', 'queued', 'ready', 'failed')),
  roadmap_at      timestamptz,

  -- Meta
  user_agent      text,
  referrer        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadmaps_status   ON monetization_roadmaps (status);
CREATE INDEX IF NOT EXISTS idx_roadmaps_created  ON monetization_roadmaps (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roadmaps_email    ON monetization_roadmaps (email);

ALTER TABLE monetization_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION roadmaps_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_roadmaps_updated_at ON monetization_roadmaps;
CREATE TRIGGER tr_roadmaps_updated_at
  BEFORE UPDATE ON monetization_roadmaps
  FOR EACH ROW EXECUTE FUNCTION roadmaps_set_updated_at();

NOTIFY pgrst, 'reload schema';
