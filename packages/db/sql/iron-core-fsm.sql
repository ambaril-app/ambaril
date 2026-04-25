-- =============================================================================
-- IRON CORE — FSM (Finite State Machine) Enforcement (ADR-015)
-- =============================================================================
-- Created: 2026-04-24
-- Why: Order status transitions must follow a strict FSM. Without DB enforcement,
--      vibe-coded app logic could skip steps (e.g., jump from 'draft' to 'shipped',
--      bypassing inventory reservation and NF-e emission). In Delphi ERPs,
--      the TDataSet.BeforePost event enforced valid state transitions.
--      PostgreSQL triggers serve the same purpose.
-- Idempotent: CREATE OR REPLACE on functions, IF NOT EXISTS on triggers.
--
-- Run: psql $DATABASE_URL -f packages/db/sql/iron-core-fsm.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Sales Order FSM
-- ---------------------------------------------------------------------------
-- Valid transitions for erp.sales_orders.status:
--
--   draft → confirmed
--   confirmed → in_picking | cancelled
--   in_picking → invoiced | cancelled
--   invoiced → shipped | cancelled
--   shipped → delivered | returned
--   delivered → returned
--   cancelled → (terminal)
--   returned → (terminal)

CREATE OR REPLACE FUNCTION erp.enforce_order_fsm()
RETURNS TRIGGER AS $$
DECLARE
  valid boolean;
BEGIN
  -- Allow same-status updates (e.g., updating other columns)
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  valid := CASE OLD.status::text || ' -> ' || NEW.status::text
    WHEN 'draft -> confirmed'       THEN true
    WHEN 'confirmed -> in_picking'  THEN true
    WHEN 'confirmed -> cancelled'   THEN true
    WHEN 'in_picking -> invoiced'   THEN true
    WHEN 'in_picking -> cancelled'  THEN true
    WHEN 'invoiced -> shipped'      THEN true
    WHEN 'invoiced -> cancelled'    THEN true
    WHEN 'shipped -> delivered'     THEN true
    WHEN 'shipped -> returned'      THEN true
    WHEN 'delivered -> returned'    THEN true
    ELSE false
  END;

  IF NOT valid THEN
    RAISE EXCEPTION 'Iron Core FSM violation: sales_order status transition "% -> %" is not allowed. '
      'Order ID: %. Valid transitions from "%" are: %',
      OLD.status, NEW.status, OLD.id, OLD.status,
      CASE OLD.status::text
        WHEN 'draft'      THEN 'confirmed'
        WHEN 'confirmed'  THEN 'in_picking, cancelled'
        WHEN 'in_picking' THEN 'invoiced, cancelled'
        WHEN 'invoiced'   THEN 'shipped, cancelled'
        WHEN 'shipped'    THEN 'delivered, returned'
        WHEN 'delivered'  THEN 'returned'
        WHEN 'cancelled'  THEN '(none — terminal state)'
        WHEN 'returned'   THEN '(none — terminal state)'
        ELSE '(unknown)'
      END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION erp.enforce_order_fsm() IS
  'Iron Core (ADR-015, 2026-04-24): Enforces valid state transitions on '
  'sales_orders. Prevents skipping steps in the order fulfillment pipeline.';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_iron_core_order_fsm') THEN
    CREATE TRIGGER trg_iron_core_order_fsm
      BEFORE UPDATE OF status ON erp.sales_orders
      FOR EACH ROW EXECUTE FUNCTION erp.enforce_order_fsm();
    RAISE NOTICE 'Created FSM trigger on erp.sales_orders';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. NF-e FSM
-- ---------------------------------------------------------------------------
-- Valid transitions for erp.nfe_documents.status:
--
--   draft → pending
--   pending → authorized | rejected | denied
--   authorized → cancelled
--   rejected → pending (retry)
--   denied → (terminal)
--   cancelled → (terminal)

CREATE OR REPLACE FUNCTION erp.enforce_nfe_fsm()
RETURNS TRIGGER AS $$
DECLARE
  valid boolean;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  valid := CASE OLD.status::text || ' -> ' || NEW.status::text
    WHEN 'draft -> pending'         THEN true
    WHEN 'pending -> authorized'    THEN true
    WHEN 'pending -> rejected'      THEN true
    WHEN 'pending -> denied'        THEN true
    WHEN 'authorized -> cancelled'  THEN true
    WHEN 'rejected -> pending'      THEN true  -- retry
    ELSE false
  END;

  IF NOT valid THEN
    RAISE EXCEPTION 'Iron Core FSM violation: nfe_documents status transition "% -> %" is not allowed. '
      'NF-e ID: %.',
      OLD.status, NEW.status, OLD.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION erp.enforce_nfe_fsm() IS
  'Iron Core (ADR-015, 2026-04-24): Enforces valid NF-e status transitions. '
  'Prevents fiscal documents from reaching invalid states.';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_iron_core_nfe_fsm') THEN
    CREATE TRIGGER trg_iron_core_nfe_fsm
      BEFORE UPDATE OF status ON erp.nfe_documents
      FOR EACH ROW EXECUTE FUNCTION erp.enforce_nfe_fsm();
    RAISE NOTICE 'Created FSM trigger on erp.nfe_documents';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Shipping Label FSM
-- ---------------------------------------------------------------------------
-- pending → generated → printed → in_transit → delivered
-- any non-terminal → cancelled

CREATE OR REPLACE FUNCTION erp.enforce_shipping_fsm()
RETURNS TRIGGER AS $$
DECLARE
  valid boolean;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  valid := CASE OLD.status::text || ' -> ' || NEW.status::text
    WHEN 'pending -> generated'     THEN true
    WHEN 'generated -> printed'     THEN true
    WHEN 'printed -> in_transit'    THEN true
    WHEN 'in_transit -> delivered'  THEN true
    -- Any non-terminal can be cancelled
    WHEN 'pending -> cancelled'     THEN true
    WHEN 'generated -> cancelled'   THEN true
    WHEN 'printed -> cancelled'     THEN true
    WHEN 'in_transit -> cancelled'  THEN true
    ELSE false
  END;

  IF NOT valid THEN
    RAISE EXCEPTION 'Iron Core FSM violation: shipping_labels status transition "% -> %" is not allowed. '
      'Label ID: %.',
      OLD.status, NEW.status, OLD.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION erp.enforce_shipping_fsm() IS
  'Iron Core (ADR-015, 2026-04-24): Enforces valid shipping label transitions.';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_iron_core_shipping_fsm') THEN
    CREATE TRIGGER trg_iron_core_shipping_fsm
      BEFORE UPDATE OF status ON erp.shipping_labels
      FOR EACH ROW EXECUTE FUNCTION erp.enforce_shipping_fsm();
    RAISE NOTICE 'Created FSM trigger on erp.shipping_labels';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Summary
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  fsm_count int;
BEGIN
  SELECT count(*) INTO fsm_count
    FROM pg_trigger
    WHERE tgname LIKE 'trg_iron_core_%_fsm';

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  Iron Core FSM Triggers Summary';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  FSM triggers active: %', fsm_count;
  RAISE NOTICE '  Protected entities: sales_orders, nfe_documents, shipping_labels';
  RAISE NOTICE '═══════════════════════════════════════════';
END $$;
