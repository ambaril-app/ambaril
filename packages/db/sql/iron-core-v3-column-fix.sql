-- =============================================================================
-- IRON CORE v3 — Column Name Fix + Trigger Event Expansion
-- =============================================================================
-- Created: 2026-04-24
-- Why: Manwë audit found FAIL — enforce_financial_balance() and
--      prevent_financial_tx_mutation() reference column 'amount' which
--      does NOT exist in the schema. Actual columns are:
--        gross_amount  — total before fees
--        fee_amount    — gateway/processing fee
--        net_amount    — gross - fees (what hits the bank)
--
--      Balance enforcement should use gross_amount (total the customer paid),
--      because order.total represents the full price before gateway fees.
--
--      Also fixes:
--      - WARN A: trigger only on INSERT → now INSERT OR UPDATE OF status
--      - WARN B: renamed section from "double-entry" to "financial balance"
--
-- Idempotent: uses CREATE OR REPLACE + DROP+CREATE for triggers.
-- Run: psql $DATABASE_URL -f packages/db/sql/iron-core-v3-column-fix.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- FIX 1: enforce_financial_balance() — use gross_amount, not amount
-- ---------------------------------------------------------------------------
-- Why gross_amount and not net_amount:
--   order.total = R$ 200.00 (what customer pays)
--   gross_amount = R$ 200.00 (what gateway received)
--   fee_amount = R$ 12.00 (gateway fee)
--   net_amount = R$ 188.00 (what hits our bank)
--   Comparing net_amount vs order.total would ALWAYS fail (fees missing).

CREATE OR REPLACE FUNCTION erp.enforce_financial_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_order_total numeric(12,2);
  v_tx_sum numeric(12,2);
  v_check_order_id uuid;
BEGIN
  -- Determine which order to check
  v_check_order_id := COALESCE(NEW.sales_order_id, OLD.sales_order_id);

  -- Only check transactions linked to a sales order
  IF v_check_order_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Get the order total
  SELECT total INTO v_order_total
    FROM erp.sales_orders
    WHERE id = v_check_order_id;

  IF v_order_total IS NULL THEN
    RETURN COALESCE(NEW, OLD); -- Order doesn't exist yet (same transaction)
  END IF;

  -- Sum all non-failed transactions for this order using gross_amount
  -- sale/pix/bank_slip = positive, refund/chargeback = negative
  SELECT COALESCE(SUM(
    CASE
      WHEN type::text IN ('sale', 'pix_received', 'bank_slip_received')
        THEN gross_amount
      WHEN type::text IN ('refund', 'chargeback')
        THEN -gross_amount
      ELSE 0
    END
  ), 0) INTO v_tx_sum
    FROM erp.financial_transactions
    WHERE sales_order_id = v_check_order_id
      AND status::text != 'failed';

  -- Net transaction amount cannot exceed order total (1% tolerance for rounding)
  IF v_tx_sum > v_order_total * 1.01 THEN
    RAISE EXCEPTION 'Iron Core: Financial balance violation for order %. '
      'Transaction sum (R$ %) exceeds order total (R$ %). '
      'This may indicate a duplicate payment or calculation error.',
      v_check_order_id, v_tx_sum, v_order_total;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION erp.enforce_financial_balance() IS
  'Iron Core v3 (2026-04-24): Financial balance enforcement using gross_amount. '
  'Prevents overpayment — net tx sum for an order cannot exceed order total.';

-- Expand trigger: INSERT + UPDATE OF status, gross_amount, sales_order_id
-- Why: a transaction that starts as 'pending' and becomes 'confirmed' should
-- be re-validated. Also catches corrections to gross_amount or order reassignment.
DROP TRIGGER IF EXISTS trg_iron_core_financial_balance ON erp.financial_transactions;
CREATE TRIGGER trg_iron_core_financial_balance
  AFTER INSERT OR UPDATE OF status, gross_amount, sales_order_id
  ON erp.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION erp.enforce_financial_balance();

RAISE NOTICE '[v3] Recreated trg_iron_core_financial_balance with correct columns';


-- ---------------------------------------------------------------------------
-- FIX 2: prevent_financial_tx_mutation() — use correct column names
-- ---------------------------------------------------------------------------
-- Original referenced OLD.amount / NEW.amount — doesn't exist.
-- Fix: use gross_amount + net_amount + fee_amount as the immutable fields.

CREATE OR REPLACE FUNCTION erp.prevent_financial_tx_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Allow status-only updates (e.g., pending → confirmed)
    -- and reconciliation flag updates
    IF OLD.type = NEW.type
      AND OLD.gross_amount = NEW.gross_amount
      AND OLD.net_amount = NEW.net_amount
      AND OLD.fee_amount = NEW.fee_amount
      AND OLD.sales_order_id IS NOT DISTINCT FROM NEW.sales_order_id
    THEN
      RETURN NEW; -- Allow status/reconciled updates only
    END IF;
    RAISE EXCEPTION 'Iron Core: financial_transactions is append-only for data fields. '
      'Cannot change type/amounts/order on transaction ID %. '
      'Only status and reconciliation updates allowed. '
      'Changed fields: type=%→%, gross=%→%, net=%→%, fee=%→%',
      OLD.id,
      OLD.type, NEW.type,
      OLD.gross_amount, NEW.gross_amount,
      OLD.net_amount, NEW.net_amount,
      OLD.fee_amount, NEW.fee_amount;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Iron Core: financial_transactions is append-only. '
      'Cannot DELETE transaction ID %. Create a reversal entry instead.', OLD.id;
  END IF;
  RETURN NULL; -- should never reach here
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION erp.prevent_financial_tx_mutation() IS
  'Iron Core v3 (2026-04-24): Append-only guard for financial_transactions. '
  'Protects gross_amount, net_amount, fee_amount, type, and sales_order_id. '
  'Only status and reconciled flag can be updated.';

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_iron_core_financial_tx_immutable ON erp.financial_transactions;
CREATE TRIGGER trg_iron_core_financial_tx_immutable
  BEFORE UPDATE OR DELETE ON erp.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION erp.prevent_financial_tx_mutation();

RAISE NOTICE '[v3] Recreated trg_iron_core_financial_tx_immutable with correct columns';


-- ---------------------------------------------------------------------------
-- Summary
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '  Iron Core v3 — Column Fix Summary';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '  [FIXED] enforce_financial_balance(): amount → gross_amount';
  RAISE NOTICE '  [FIXED] prevent_financial_tx_mutation(): amount → gross/net/fee_amount';
  RAISE NOTICE '  [FIXED] balance trigger: INSERT only → INSERT OR UPDATE OF status,gross_amount,sales_order_id';
  RAISE NOTICE '  [FIXED] immutable guard: now protects all 3 amount columns';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '  Manwë review status: FAIL → FIXED';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
