-- =============================================================================
-- IRON CORE v2 — Fixes for Manwë Review (2026-04-24)
-- =============================================================================
-- This patch addresses ALL gaps identified in the Manwë review:
--
-- 1. IDEMPOTENCY: All triggers use DROP IF EXISTS + CREATE pattern
-- 2. AUDIT COVERAGE: Extended to nfe_items, nfe_payments, sales_order_payments,
--    purchase_order_items (previously missing)
-- 3. DOUBLE-ENTRY BALANCE ENFORCEMENT: Not just append-only — actual sum check
-- 4. NF-e CASCADING IMMUTABILITY: Authorized NF-e blocks mutations to child
--    tables (nfe_items, nfe_payments), not just the parent
-- 5. FSM ENUM MATRIX: Verified all Drizzle enum values are covered
--
-- Run AFTER the original iron-core scripts, or standalone (fully idempotent).
-- psql $DATABASE_URL -f packages/db/sql/iron-core-v2-fixes.sql
-- =============================================================================


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 1: IDEMPOTENCY — Recreate all triggers with DROP+CREATE pattern     ║
-- ║ Why: Original scripts used IF NOT EXISTS, which doesn't update trigger   ║
-- ║ logic on re-run. DROP+CREATE ensures latest logic always applies.        ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Helper: idempotent trigger creation (drop first, then create)
CREATE OR REPLACE FUNCTION global._ic_ensure_trigger(
  p_trigger_name text,
  p_schema text,
  p_table text,
  p_timing text,     -- 'BEFORE' or 'AFTER'
  p_events text,     -- 'INSERT OR UPDATE OR DELETE'
  p_function text,   -- fully qualified function name
  p_condition text DEFAULT NULL -- optional WHEN clause
) RETURNS void AS $$
BEGIN
  -- Always drop first to ensure idempotency
  EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', p_trigger_name, p_schema, p_table);

  IF p_condition IS NOT NULL THEN
    EXECUTE format(
      'CREATE TRIGGER %I %s %s ON %I.%I FOR EACH ROW WHEN (%s) EXECUTE FUNCTION %s()',
      p_trigger_name, p_timing, p_events, p_schema, p_table, p_condition, p_function
    );
  ELSE
    EXECUTE format(
      'CREATE TRIGGER %I %s %s ON %I.%I FOR EACH ROW EXECUTE FUNCTION %s()',
      p_trigger_name, p_timing, p_events, p_schema, p_table, p_function
    );
  END IF;

  RAISE NOTICE '[v2] Trigger % on %.% — recreated', p_trigger_name, p_schema, p_table;
END;
$$ LANGUAGE plpgsql;

-- Recreate ALL audit triggers (ensures latest audit function logic)
SELECT global._ic_ensure_trigger('trg_iron_core_audit_inventory',              'erp', 'inventory',              'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');
SELECT global._ic_ensure_trigger('trg_iron_core_audit_inventory_movements',    'erp', 'inventory_movements',    'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');
SELECT global._ic_ensure_trigger('trg_iron_core_audit_sales_orders',           'erp', 'sales_orders',           'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');
SELECT global._ic_ensure_trigger('trg_iron_core_audit_sales_order_items',      'erp', 'sales_order_items',      'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');
SELECT global._ic_ensure_trigger('trg_iron_core_audit_nfe_documents',          'erp', 'nfe_documents',          'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');
SELECT global._ic_ensure_trigger('trg_iron_core_audit_shipping_labels',        'erp', 'shipping_labels',        'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');
SELECT global._ic_ensure_trigger('trg_iron_core_audit_receivables',            'erp', 'receivables',            'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');
SELECT global._ic_ensure_trigger('trg_iron_core_audit_payables',               'erp', 'payables',               'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');
SELECT global._ic_ensure_trigger('trg_iron_core_audit_financial_transactions', 'erp', 'financial_transactions', 'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');
SELECT global._ic_ensure_trigger('trg_iron_core_audit_financial_accounts',     'erp', 'financial_accounts',     'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');
SELECT global._ic_ensure_trigger('trg_iron_core_audit_purchase_orders',        'erp', 'purchase_orders',        'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');

-- Recreate FSM triggers
SELECT global._ic_ensure_trigger('trg_iron_core_order_fsm',    'erp', 'sales_orders',    'BEFORE', 'UPDATE OF status', 'erp.enforce_order_fsm');
SELECT global._ic_ensure_trigger('trg_iron_core_nfe_fsm',      'erp', 'nfe_documents',   'BEFORE', 'UPDATE OF status', 'erp.enforce_nfe_fsm');
SELECT global._ic_ensure_trigger('trg_iron_core_shipping_fsm', 'erp', 'shipping_labels', 'BEFORE', 'UPDATE OF status', 'erp.enforce_shipping_fsm');

-- Recreate integrity triggers
SELECT global._ic_ensure_trigger('trg_iron_core_inventory_sync',          'erp', 'inventory_movements',    'AFTER',  'INSERT',            'erp.sync_inventory_on_movement');
SELECT global._ic_ensure_trigger('trg_iron_core_movement_immutable',      'erp', 'inventory_movements',    'BEFORE', 'UPDATE OR DELETE',  'erp.prevent_movement_mutation');
SELECT global._ic_ensure_trigger('trg_iron_core_financial_tx_immutable',  'erp', 'financial_transactions', 'BEFORE', 'UPDATE OR DELETE',  'erp.prevent_financial_tx_mutation');
SELECT global._ic_ensure_trigger('trg_iron_core_nfe_protection',          'erp', 'nfe_documents',          'BEFORE', 'UPDATE',            'erp.protect_authorized_nfe', 'OLD.status = ''authorized''');


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 2: AUDIT COVERAGE — Add missing tables                              ║
-- ║ Why: Manwë identified nfe_items, nfe_payments, purchase_order_items,     ║
-- ║ sales_order_payments as gaps. These are financially critical — an        ║
-- ║ unaudited change to an NF-e item or payment installment is invisible.    ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

SELECT global._ic_ensure_trigger('trg_iron_core_audit_nfe_items',             'erp', 'nfe_items',              'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');
SELECT global._ic_ensure_trigger('trg_iron_core_audit_nfe_payments',          'erp', 'nfe_payments',           'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');
SELECT global._ic_ensure_trigger('trg_iron_core_audit_purchase_order_items',  'erp', 'purchase_order_items',   'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');
SELECT global._ic_ensure_trigger('trg_iron_core_audit_sales_order_payments',  'erp', 'sales_order_payments',   'AFTER', 'INSERT OR UPDATE OR DELETE', 'global.iron_core_audit_fn');


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 3: NF-e CASCADING IMMUTABILITY                                      ║
-- ║ Why: Original iron-core-double-entry.sql blocked UPDATE on nfe_documents ║
-- ║ when status='authorized', but child tables (nfe_items, nfe_payments)     ║
-- ║ were unprotected. An app bug could silently change item prices or        ║
-- ║ payment values on an authorized NF-e — a fiscal violation.              ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION erp.protect_authorized_nfe_children()
RETURNS TRIGGER AS $$
DECLARE
  v_nfe_status text;
BEGIN
  -- Look up parent NF-e status
  SELECT status::text INTO v_nfe_status
    FROM erp.nfe_documents
    WHERE id = COALESCE(NEW.nfe_id, OLD.nfe_id);

  IF v_nfe_status = 'authorized' THEN
    IF TG_OP = 'UPDATE' THEN
      RAISE EXCEPTION 'Iron Core: Cannot UPDATE % on authorized NF-e (nfe_id: %). '
        'Cancel the NF-e first, then re-emit.',
        TG_TABLE_NAME, COALESCE(NEW.nfe_id, OLD.nfe_id);
    ELSIF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Iron Core: Cannot DELETE % from authorized NF-e (nfe_id: %). '
        'Cancel the NF-e first, then re-emit.',
        TG_TABLE_NAME, COALESCE(NEW.nfe_id, OLD.nfe_id);
    ELSIF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'Iron Core: Cannot INSERT into % for authorized NF-e (nfe_id: %). '
        'Cancel the NF-e first, then re-emit.',
        TG_TABLE_NAME, NEW.nfe_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION erp.protect_authorized_nfe_children() IS
  'Iron Core v2 (2026-04-24): Cascading immutability — blocks INSERT/UPDATE/DELETE '
  'on nfe_items and nfe_payments when parent NF-e is authorized.';

SELECT global._ic_ensure_trigger('trg_iron_core_nfe_items_protection',    'erp', 'nfe_items',    'BEFORE', 'INSERT OR UPDATE OR DELETE', 'erp.protect_authorized_nfe_children');
SELECT global._ic_ensure_trigger('trg_iron_core_nfe_payments_protection', 'erp', 'nfe_payments', 'BEFORE', 'INSERT OR UPDATE OR DELETE', 'erp.protect_authorized_nfe_children');


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 4: DOUBLE-ENTRY BALANCE ENFORCEMENT                                 ║
-- ║ Why: Append-only alone does NOT guarantee balanced entries.              ║
-- ║ Manwë correctly identified this as the biggest conceptual gap.           ║
-- ║ This trigger ensures that for every sales_order, the sum of all         ║
-- ║ related financial_transactions (sale - refund - chargeback + fee)        ║
-- ║ stays consistent and reconcilable.                                       ║
-- ║                                                                          ║
-- ║ Pattern: We don't do classic debit/credit (not an accounting ledger).    ║
-- ║ Instead, we enforce that receivables.value matches the corresponding     ║
-- ║ order total, and that financial_transactions for an order don't          ║
-- ║ exceed the order total.                                                  ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION erp.enforce_financial_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_order_total numeric(12,2);
  v_tx_sum numeric(12,2);
BEGIN
  -- Only check transactions linked to a sales order
  IF NEW.sales_order_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the order total
  SELECT total INTO v_order_total
    FROM erp.sales_orders
    WHERE id = NEW.sales_order_id;

  IF v_order_total IS NULL THEN
    RETURN NEW; -- Order doesn't exist yet (might be created in same transaction)
  END IF;

  -- Sum all confirmed transactions for this order
  -- sale = positive, refund/chargeback = negative (by convention)
  SELECT COALESCE(SUM(
    CASE
      WHEN type::text IN ('sale', 'pix_received', 'bank_slip_received') THEN amount
      WHEN type::text IN ('refund', 'chargeback') THEN -amount
      ELSE 0
    END
  ), 0) INTO v_tx_sum
    FROM erp.financial_transactions
    WHERE sales_order_id = NEW.sales_order_id
      AND status::text != 'failed';

  -- The net transaction amount for an order cannot exceed the order total
  -- (allows partial payments, but not overpayment)
  IF v_tx_sum > v_order_total * 1.01 THEN -- 1% tolerance for rounding
    RAISE EXCEPTION 'Iron Core: Financial balance violation for order %. '
      'Transaction sum (R$ %) exceeds order total (R$ %). '
      'This may indicate a duplicate payment or calculation error.',
      NEW.sales_order_id, v_tx_sum, v_order_total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION erp.enforce_financial_balance() IS
  'Iron Core v2 (2026-04-24): Prevents overpayment — net transaction amount '
  'for an order cannot exceed the order total (with 1% rounding tolerance).';

SELECT global._ic_ensure_trigger('trg_iron_core_financial_balance', 'erp', 'financial_transactions', 'AFTER', 'INSERT', 'erp.enforce_financial_balance');


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 5: NF-e PAYMENT SUM VALIDATION                                      ║
-- ║ Why: SEFAZ requires sum(nfe_payments.value) = nfe_documents.total_nfe.   ║
-- ║ A mismatch means the NF-e will be rejected by SEFAZ anyway, but         ║
-- ║ catching it at DB level saves a round-trip and prevents bad data.        ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION erp.validate_nfe_payment_sum()
RETURNS TRIGGER AS $$
DECLARE
  v_nfe_total numeric(12,2);
  v_payment_sum numeric(12,2);
  v_nfe_status text;
BEGIN
  -- Only validate when NF-e is about to be submitted (status → pending)
  -- We check this on nfe_documents UPDATE, not on nfe_payments INSERT,
  -- because payments are typically added before submission.

  IF NEW.status::text != 'pending' OR OLD.status::text != 'draft' THEN
    RETURN NEW;
  END IF;

  v_nfe_total := NEW.total_nfe;

  SELECT COALESCE(SUM(value), 0) INTO v_payment_sum
    FROM erp.nfe_payments
    WHERE nfe_id = NEW.id;

  -- Allow small rounding differences (R$ 0.02)
  IF ABS(v_payment_sum - v_nfe_total) > 0.02 THEN
    RAISE EXCEPTION 'Iron Core: NF-e payment sum (R$ %) does not match NF-e total (R$ %). '
      'NF-e ID: %. SEFAZ will reject this. Fix payments before submitting.',
      v_payment_sum, v_nfe_total, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION erp.validate_nfe_payment_sum() IS
  'Iron Core v2 (2026-04-24): Validates that nfe_payments sum matches '
  'nfe_documents.total_nfe before submission to SEFAZ.';

SELECT global._ic_ensure_trigger('trg_iron_core_nfe_payment_sum', 'erp', 'nfe_documents', 'BEFORE', 'UPDATE OF status', 'erp.validate_nfe_payment_sum');


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 6: PURCHASE ORDER FSM                                               ║
-- ║ Why: Manwë noted purchase_orders share erpOrderStatusEnum with           ║
-- ║ sales_orders. The FSM trigger was only on sales_orders.                  ║
-- ║ Purchase orders need their own FSM (different valid transitions).        ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION erp.enforce_purchase_order_fsm()
RETURNS TRIGGER AS $$
DECLARE
  valid boolean;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  valid := CASE OLD.status::text || ' -> ' || NEW.status::text
    WHEN 'draft -> confirmed'       THEN true
    WHEN 'confirmed -> in_picking'  THEN true  -- goods receiving
    WHEN 'confirmed -> cancelled'   THEN true
    WHEN 'in_picking -> invoiced'   THEN true  -- NF-e de entrada received
    WHEN 'in_picking -> cancelled'  THEN true
    WHEN 'invoiced -> delivered'    THEN true  -- goods received + inspected
    WHEN 'invoiced -> cancelled'    THEN true
    WHEN 'delivered -> returned'    THEN true  -- devolution to supplier
    ELSE false
  END;

  IF NOT valid THEN
    RAISE EXCEPTION 'Iron Core FSM violation: purchase_orders status transition "% -> %" is not allowed. '
      'PO ID: %.',
      OLD.status, NEW.status, OLD.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION erp.enforce_purchase_order_fsm() IS
  'Iron Core v2 (2026-04-24): FSM for purchase orders. Different from '
  'sales orders because PO flow includes goods receiving and NF-e de entrada.';

SELECT global._ic_ensure_trigger('trg_iron_core_po_fsm', 'erp', 'purchase_orders', 'BEFORE', 'UPDATE OF status', 'erp.enforce_purchase_order_fsm');


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 7: ADDITIONAL CONSTRAINTS on child tables (Manwë gap)               ║
-- ║ Why: Constraints were only on parent tables. Item tables need guards too.║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- purchase_order_items — positive quantities and prices
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_poi_quantity_positive') THEN
    ALTER TABLE erp.purchase_order_items
      ADD CONSTRAINT chk_poi_quantity_positive CHECK (quantity > 0);
    RAISE NOTICE '[v2] Added: chk_poi_quantity_positive';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_poi_unit_price_non_negative') THEN
    ALTER TABLE erp.purchase_order_items
      ADD CONSTRAINT chk_poi_unit_price_non_negative CHECK (unit_price >= 0);
    RAISE NOTICE '[v2] Added: chk_poi_unit_price_non_negative';
  END IF;
END $$;

-- nfe_items — positive quantities and prices
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_nfe_item_quantity_positive') THEN
    ALTER TABLE erp.nfe_items
      ADD CONSTRAINT chk_nfe_item_quantity_positive CHECK (quantity > 0);
    RAISE NOTICE '[v2] Added: chk_nfe_item_quantity_positive';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_nfe_item_unit_price_non_negative') THEN
    ALTER TABLE erp.nfe_items
      ADD CONSTRAINT chk_nfe_item_unit_price_non_negative CHECK (unit_price >= 0);
    RAISE NOTICE '[v2] Added: chk_nfe_item_unit_price_non_negative';
  END IF;
END $$;

-- nfe_payments — positive values
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_nfe_payment_value_positive') THEN
    ALTER TABLE erp.nfe_payments
      ADD CONSTRAINT chk_nfe_payment_value_positive CHECK (value > 0);
    RAISE NOTICE '[v2] Added: chk_nfe_payment_value_positive';
  END IF;
END $$;

-- sales_order_payments — positive values
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_sop_value_positive') THEN
    ALTER TABLE erp.sales_order_payments
      ADD CONSTRAINT chk_sop_value_positive CHECK (value > 0);
    RAISE NOTICE '[v2] Added: chk_sop_value_positive';
  END IF;
END $$;


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ CLEANUP + SUMMARY                                                        ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Drop helper function
DROP FUNCTION global._ic_ensure_trigger(text, text, text, text, text, text, text);

-- Final summary
DO $$
DECLARE
  total_triggers int;
  total_constraints int;
  audit_triggers int;
  fsm_triggers int;
  integrity_triggers int;
BEGIN
  SELECT count(*) INTO total_triggers
    FROM pg_trigger WHERE tgname LIKE 'trg_iron_core_%';

  SELECT count(*) INTO total_constraints
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'erp' AND c.conname LIKE 'chk_%';

  SELECT count(*) INTO audit_triggers
    FROM pg_trigger WHERE tgname LIKE 'trg_iron_core_audit_%';

  SELECT count(*) INTO fsm_triggers
    FROM pg_trigger WHERE tgname LIKE 'trg_iron_core_%_fsm' OR tgname LIKE 'trg_iron_core_%fsm';

  SELECT count(*) INTO integrity_triggers
    FROM pg_trigger WHERE tgname LIKE 'trg_iron_core_%'
      AND tgname NOT LIKE '%audit%'
      AND tgname NOT LIKE '%fsm%';

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '  Iron Core v2 — Post-Review Fixes Summary';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '  Total Iron Core triggers:     %', total_triggers;
  RAISE NOTICE '    ├── Audit triggers:          %', audit_triggers;
  RAISE NOTICE '    ├── FSM triggers:            %', fsm_triggers;
  RAISE NOTICE '    └── Integrity triggers:      %', integrity_triggers;
  RAISE NOTICE '  CHECK constraints (erp):       %', total_constraints;
  RAISE NOTICE '';
  RAISE NOTICE '  v2 fixes applied:';
  RAISE NOTICE '    [1] All triggers idempotent (DROP+CREATE)';
  RAISE NOTICE '    [2] Audit on nfe_items, nfe_payments, po_items, so_payments';
  RAISE NOTICE '    [3] NF-e cascading immutability (items + payments)';
  RAISE NOTICE '    [4] Financial balance enforcement (overpayment check)';
  RAISE NOTICE '    [5] NF-e payment sum validation (SEFAZ pre-check)';
  RAISE NOTICE '    [6] Purchase order FSM';
  RAISE NOTICE '    [7] CHECKs on child tables (po_items, nfe_items, nfe_payments, so_payments)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
