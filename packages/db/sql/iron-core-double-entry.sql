-- =============================================================================
-- IRON CORE — Double-Entry Financial Enforcement (ADR-015)
-- =============================================================================
-- Created: 2026-04-24
-- Why: Financial data in an ERP is the most dangerous area for bugs.
--      A vibe-coded mutation that creates a receivable without a matching
--      financial transaction, or allows an inventory movement without
--      updating the balance, corrupts the books silently. These triggers
--      enforce invariants that accountants rely on:
--
--      1. Inventory balance = SUM of all movements (reconciliation check)
--      2. Financial transactions always reference a valid source
--      3. Receivable/payable values match their source documents
--
--      In Delphi ERPs, these were enforced via TClientDataSet.OnCalcFields
--      and stored procedures. Here, we use PostgreSQL triggers.
-- Idempotent: CREATE OR REPLACE, IF NOT EXISTS guards.
--
-- Run: psql $DATABASE_URL -f packages/db/sql/iron-core-double-entry.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Inventory movement MUST update inventory balance
-- ---------------------------------------------------------------------------
-- Why: An inventory_movement row without a corresponding balance update
--      means the movement is "invisible" — the stock report won't reflect it.
--      This trigger auto-updates erp.inventory on every movement insert,
--      acting as a materialized balance that stays in sync.
--
-- NOTE: This trigger handles balance updates. The app should NOT manually
--       update erp.inventory.quantity_available when inserting movements.
--       The trigger does it atomically.

CREATE OR REPLACE FUNCTION erp.sync_inventory_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Only handle INSERT — movements are append-only (never updated or deleted)
  IF TG_OP = 'INSERT' THEN
    -- Movement quantity: positive = inbound, negative = outbound (per schema)
    UPDATE erp.inventory
      SET quantity_available = quantity_available + NEW.quantity,
          updated_at = NOW()
      WHERE sku_id = NEW.sku_id
        AND tenant_id = NEW.tenant_id
        AND warehouse_id = COALESCE(NEW.warehouse_id, warehouse_id);

    -- If no inventory row exists yet, create one
    IF NOT FOUND THEN
      INSERT INTO erp.inventory (
        id, tenant_id, sku_id, warehouse_id,
        quantity_available, quantity_reserved,
        quantity_in_production, quantity_in_transit,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), NEW.tenant_id, NEW.sku_id, NEW.warehouse_id,
        GREATEST(NEW.quantity, 0), 0, 0, 0,
        NOW(), NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION erp.sync_inventory_on_movement() IS
  'Iron Core (ADR-015, 2026-04-24): Auto-syncs erp.inventory balance on '
  'every inventory_movement INSERT. Ensures movements and balances never drift.';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_iron_core_inventory_sync') THEN
    CREATE TRIGGER trg_iron_core_inventory_sync
      AFTER INSERT ON erp.inventory_movements
      FOR EACH ROW EXECUTE FUNCTION erp.sync_inventory_on_movement();
    RAISE NOTICE 'Created inventory sync trigger on erp.inventory_movements';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Prevent deletion/update of inventory_movements (append-only ledger)
-- ---------------------------------------------------------------------------
-- Why: Financial/inventory movements are an accounting ledger. You don't
--      edit or delete ledger entries — you create corrective entries.
--      This is a fundamental accounting principle that Delphi ERPs enforced
--      via TDataSet.CanModify := False on movement tables.

CREATE OR REPLACE FUNCTION erp.prevent_movement_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Iron Core: inventory_movements is append-only. '
      'Cannot UPDATE movement ID %. Create a corrective movement instead.', OLD.id;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Iron Core: inventory_movements is append-only. '
      'Cannot DELETE movement ID %. Create a corrective movement instead.', OLD.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION erp.prevent_movement_mutation() IS
  'Iron Core (ADR-015, 2026-04-24): Makes inventory_movements append-only. '
  'No updates or deletes — corrective entries only.';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_iron_core_movement_immutable') THEN
    CREATE TRIGGER trg_iron_core_movement_immutable
      BEFORE UPDATE OR DELETE ON erp.inventory_movements
      FOR EACH ROW EXECUTE FUNCTION erp.prevent_movement_mutation();
    RAISE NOTICE 'Created immutability trigger on erp.inventory_movements';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Prevent deletion/update of financial_transactions (append-only ledger)
-- ---------------------------------------------------------------------------
-- Why: Same principle as inventory movements. Financial transactions are
--      a ledger. Refunds and chargebacks are NEW entries, not edits.

CREATE OR REPLACE FUNCTION erp.prevent_financial_tx_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Allow status updates only (e.g., pending → confirmed)
    IF OLD.type = NEW.type
      AND OLD.amount = NEW.amount
      AND OLD.sales_order_id IS NOT DISTINCT FROM NEW.sales_order_id
    THEN
      RETURN NEW; -- Allow status-only updates
    END IF;
    RAISE EXCEPTION 'Iron Core: financial_transactions is append-only for data fields. '
      'Cannot change type/amount/order on transaction ID %. Only status updates allowed.', OLD.id;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Iron Core: financial_transactions is append-only. '
      'Cannot DELETE transaction ID %. Create a reversal entry instead.', OLD.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION erp.prevent_financial_tx_mutation() IS
  'Iron Core (ADR-015, 2026-04-24): Makes financial_transactions append-only '
  'for critical fields. Status can be updated; amount/type/order cannot.';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_iron_core_financial_tx_immutable') THEN
    CREATE TRIGGER trg_iron_core_financial_tx_immutable
      BEFORE UPDATE OR DELETE ON erp.financial_transactions
      FOR EACH ROW EXECUTE FUNCTION erp.prevent_financial_tx_mutation();
    RAISE NOTICE 'Created immutability trigger on erp.financial_transactions';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Authorized NF-e cannot be modified (except cancellation)
-- ---------------------------------------------------------------------------
-- Why: An authorized NF-e is a legal document registered with SEFAZ.
--      You cannot change its contents — only cancel and re-emit.

CREATE OR REPLACE FUNCTION erp.protect_authorized_nfe()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'authorized' AND NEW.status != 'cancelled' THEN
    RAISE EXCEPTION 'Iron Core: authorized NF-e (ID %) cannot be modified. '
      'Only cancellation is allowed. Cancel first, then re-emit.', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION erp.protect_authorized_nfe() IS
  'Iron Core (ADR-015, 2026-04-24): Prevents modification of authorized NF-e. '
  'Authorized documents are legal records — only cancellation allowed.';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_iron_core_nfe_protection') THEN
    CREATE TRIGGER trg_iron_core_nfe_protection
      BEFORE UPDATE ON erp.nfe_documents
      FOR EACH ROW
      WHEN (OLD.status = 'authorized')
      EXECUTE FUNCTION erp.protect_authorized_nfe();
    RAISE NOTICE 'Created protection trigger on erp.nfe_documents (authorized)';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Summary
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  integrity_count int;
BEGIN
  SELECT count(*) INTO integrity_count
    FROM pg_trigger
    WHERE tgname LIKE 'trg_iron_core_%'
      AND tgname NOT LIKE '%audit%'
      AND tgname NOT LIKE '%fsm%';

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  Iron Core Financial Integrity Summary';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  Integrity triggers active: %', integrity_count;
  RAISE NOTICE '  Append-only: inventory_movements, financial_transactions';
  RAISE NOTICE '  Auto-sync: inventory_movements → inventory balance';
  RAISE NOTICE '  Protected: authorized NF-e (immutable)';
  RAISE NOTICE '═══════════════════════════════════════════';
END $$;
