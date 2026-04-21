-- =============================================================================
-- Seed: Plan Capabilities (fail-closed policy)
-- =============================================================================
-- Defines which capabilities each plan authorizes.
-- If a capability is NOT listed for a plan, it is DENIED. No exceptions.
--
-- Run after rls-bootstrap.sql:
--   psql $DATABASE_URL -f packages/db/sql/seed-plan-capabilities.sql
--
-- Plans: starter (default), pro, enterprise
-- Capabilities: ecommerce, checkout, messaging, storage, social, shipping, payments, fiscal
-- =============================================================================

INSERT INTO global.plan_capabilities (plan, capability, is_enabled)
VALUES
  -- Starter plan: basic commerce + messaging
  ('starter', 'ecommerce', true),
  ('starter', 'checkout', true),
  ('starter', 'messaging', true),
  ('starter', 'storage', true),

  -- Pro plan: starter + social + shipping + payments
  ('pro', 'ecommerce', true),
  ('pro', 'checkout', true),
  ('pro', 'messaging', true),
  ('pro', 'storage', true),
  ('pro', 'social', true),
  ('pro', 'shipping', true),
  ('pro', 'payments', true),

  -- Enterprise plan: everything
  ('enterprise', 'ecommerce', true),
  ('enterprise', 'checkout', true),
  ('enterprise', 'messaging', true),
  ('enterprise', 'storage', true),
  ('enterprise', 'social', true),
  ('enterprise', 'shipping', true),
  ('enterprise', 'payments', true),
  ('enterprise', 'fiscal', true)
ON CONFLICT (plan, capability) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

-- Summary
DO $$
DECLARE
  cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM global.plan_capabilities WHERE is_enabled = true;
  RAISE NOTICE 'Plan capabilities seeded: % active entries', cnt;
END $$;
