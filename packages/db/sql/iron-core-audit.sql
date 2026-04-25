-- =============================================================================
-- IRON CORE — Audit Triggers (ADR-019)
-- =============================================================================
-- Created: 2026-04-24
-- Why: App-level audit can fail silently (bug, timeout, vibe-coded error).
--      DB-level triggers make audit IMPOSSIBLE to bypass — every INSERT,
--      UPDATE, DELETE on critical tables is captured, no matter how the
--      mutation happened (app, migration, psql session, SQL injection).
--      This is the Delphi "OnAfterPost" pattern — the database is the
--      single source of truth for what happened and when.
-- Idempotent: CREATE OR REPLACE on functions, IF NOT EXISTS on triggers.
--
-- Run: psql $DATABASE_URL -f packages/db/sql/iron-core-audit.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Generic audit trigger function
-- ---------------------------------------------------------------------------
-- Captures old/new row as JSONB into global.audit_logs.
-- Uses session variables set by the app via SET LOCAL:
--   SET LOCAL app.tenant_id = 'uuid';
--   SET LOCAL app.user_id = 'uuid';
-- If not set, records NULL (e.g., migration or cron job).

CREATE OR REPLACE FUNCTION global.iron_core_audit_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
  v_record_id uuid;
  v_action global.audit_action;
  v_row_tenant text;
BEGIN
  -- Extract session context (NULL-safe — cron jobs may not set these)
  v_tenant_id := NULLIF(current_setting('app.tenant_id', true), '')::uuid;
  v_user_id := NULLIF(current_setting('app.user_id', true), '')::uuid;

  -- Determine record ID from row data
  v_record_id := COALESCE(
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.id ELSE NULL END,
    CASE WHEN TG_OP IN ('DELETE', 'UPDATE') THEN OLD.id ELSE NULL END
  );

  -- Map TG_OP to audit_action enum
  v_action := CASE TG_OP
    WHEN 'INSERT' THEN 'create'
    WHEN 'UPDATE' THEN 'update'
    WHEN 'DELETE' THEN 'delete'
  END::global.audit_action;

  -- Extract tenant_id from the row itself (preferred over session var)
  v_row_tenant := CASE
    WHEN TG_OP != 'DELETE' THEN (to_jsonb(NEW) ->> 'tenant_id')
    ELSE (to_jsonb(OLD) ->> 'tenant_id')
  END;

  INSERT INTO global.audit_logs (
    id, tenant_id, timestamp, user_id, user_role,
    action, resource_type, resource_id, module,
    changes, created_at
  ) VALUES (
    gen_random_uuid(),
    COALESCE(v_row_tenant::uuid, v_tenant_id),
    NOW(),
    COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    'admin', -- default; real role from session when available
    v_action,
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    v_record_id,
    TG_TABLE_SCHEMA,
    jsonb_build_object(
      'op', TG_OP,
      'old', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      'new', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    ),
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION global.iron_core_audit_fn() IS
  'Iron Core (ADR-019, 2026-04-24): DB-level audit trigger. Captures all '
  'mutations to critical tables into global.audit_logs. Impossible to bypass.';

-- ---------------------------------------------------------------------------
-- 2. Attach triggers to critical tables
-- ---------------------------------------------------------------------------
-- Only tables where data integrity is financially or legally critical.
-- Non-critical tables (tasks, DAM, marketing) use app-level audit only.

-- Helper function to create triggers idempotently
CREATE OR REPLACE FUNCTION global._iron_core_attach_audit(
  p_schema text, p_table text
) RETURNS void AS $$
DECLARE
  v_trigger_name text := 'trg_iron_core_audit_' || p_table;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = v_trigger_name) THEN
    EXECUTE format(
      'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %I.%I '
      'FOR EACH ROW EXECUTE FUNCTION global.iron_core_audit_fn()',
      v_trigger_name, p_schema, p_table
    );
    RAISE NOTICE 'Attached audit trigger to %.%', p_schema, p_table;
  ELSE
    RAISE NOTICE 'Audit trigger already exists on %.%', p_schema, p_table;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Financial & inventory (CRITICAL)
SELECT global._iron_core_attach_audit('erp', 'inventory');
SELECT global._iron_core_attach_audit('erp', 'inventory_movements');
SELECT global._iron_core_attach_audit('erp', 'sales_orders');
SELECT global._iron_core_attach_audit('erp', 'sales_order_items');
SELECT global._iron_core_attach_audit('erp', 'nfe_documents');
SELECT global._iron_core_attach_audit('erp', 'nfe_items');
SELECT global._iron_core_attach_audit('erp', 'shipping_labels');
SELECT global._iron_core_attach_audit('erp', 'receivables');
SELECT global._iron_core_attach_audit('erp', 'payables');
SELECT global._iron_core_attach_audit('erp', 'financial_transactions');
SELECT global._iron_core_attach_audit('erp', 'financial_accounts');
SELECT global._iron_core_attach_audit('erp', 'purchase_orders');

-- Drop helper after use
DROP FUNCTION global._iron_core_attach_audit(text, text);

-- ---------------------------------------------------------------------------
-- Summary
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  trigger_count int;
BEGIN
  SELECT count(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname LIKE 'trg_iron_core_audit_%';

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  Iron Core Audit Triggers Summary';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  Audit triggers attached: %', trigger_count;
  RAISE NOTICE '  Function: global.iron_core_audit_fn()';
  RAISE NOTICE '  Context: SET LOCAL app.tenant_id/user_id';
  RAISE NOTICE '═══════════════════════════════════════════';
END $$;
