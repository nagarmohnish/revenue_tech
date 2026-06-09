-- 0005_application_plan.sql
-- Stores the AI-generated monetization plan alongside each application.
-- Plan generation runs synchronously during /api/apply so the submitter sees
-- a real artifact on the thanks page instead of a holding message.

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS plan         jsonb,
  ADD COLUMN IF NOT EXISTS plan_status  text DEFAULT 'pending'
                           CHECK (plan_status IN ('pending', 'ready', 'failed', 'template')),
  ADD COLUMN IF NOT EXISTS plan_at      timestamptz;

CREATE INDEX IF NOT EXISTS idx_applications_plan_status ON applications (plan_status);

NOTIFY pgrst, 'reload schema';
