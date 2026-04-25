-- =============================================================================
-- IRON CORE — Database Constraints (ADR-015)
-- =============================================================================
-- Created: 2026-04-24
-- Why: ERP gold-standard requires the database to enforce business invariants,
--      not just the application layer. Vibe-coded TypeScript can have subtle bugs;
--      PostgreSQL constraints are the last line of defense.
--      Inspired by Delphi-era ERPs where the DB was the brain.
-- Idempotent: safe to re-run. Uses IF NOT EXISTS / DO $$ guards.
--
-- Run: psql $DATABASE_URL -f packages/db/sql/iron-core-constraints.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Inventory — quantities can NEVER go negative
-- ---------------------------------------------------------------------------
-- Why: A negative available quantity means overselling. A negative reserved
-- quantity means a logic bug in order processing. The DB must reject both,
-- even if the app has a bug.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_inventory_qty_available_non_negative'
  ) THEN
    ALTER TABLE erp.inventory
      ADD CONSTRAINT chk_inventory_qty_available_non_negative
      CHECK (quantity_available >= 0);
    RAISE NOTICE 'Added: chk_inventory_qty_available_non_negative';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_inventory_qty_reserved_non_negative'
  ) THEN
    ALTER TABLE erp.inventory
      ADD CONSTRAINT chk_inventory_qty_reserved_non_negative
      CHECK (quantity_reserved >= 0);
    RAISE NOTICE 'Added: chk_inventory_qty_reserved_non_negative';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_inventory_qty_in_production_non_negative'
  ) THEN
    ALTER TABLE erp.inventory
      ADD CONSTRAINT chk_inventory_qty_in_production_non_negative
      CHECK (quantity_in_production >= 0);
    RAISE NOTICE 'Added: chk_inventory_qty_in_production_non_negative';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_inventory_qty_in_transit_non_negative'
  ) THEN
    ALTER TABLE erp.inventory
      ADD CONSTRAINT chk_inventory_qty_in_transit_non_negative
      CHECK (quantity_in_transit >= 0);
    RAISE NOTICE 'Added: chk_inventory_qty_in_transit_non_negative';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Monetary values — prices and costs must be non-negative
-- ---------------------------------------------------------------------------
-- Why: Negative prices/costs indicate data corruption. The only "negative money"
-- in the system should be through explicit refund/chargeback transaction types,
-- not through negative unit prices.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_sku_price_non_negative'
  ) THEN
    ALTER TABLE erp.skus
      ADD CONSTRAINT chk_sku_price_non_negative
      CHECK (price >= 0);
    RAISE NOTICE 'Added: chk_sku_price_non_negative';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_sku_cost_price_non_negative'
  ) THEN
    ALTER TABLE erp.skus
      ADD CONSTRAINT chk_sku_cost_price_non_negative
      CHECK (cost_price >= 0);
    RAISE NOTICE 'Added: chk_sku_cost_price_non_negative';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_sales_order_total_non_negative'
  ) THEN
    ALTER TABLE erp.sales_orders
      ADD CONSTRAINT chk_sales_order_total_non_negative
      CHECK (total >= 0);
    RAISE NOTICE 'Added: chk_sales_order_total_non_negative';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_sales_order_subtotal_non_negative'
  ) THEN
    ALTER TABLE erp.sales_orders
      ADD CONSTRAINT chk_sales_order_subtotal_non_negative
      CHECK (subtotal >= 0);
    RAISE NOTICE 'Added: chk_sales_order_subtotal_non_negative';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_item_unit_price_non_negative'
  ) THEN
    ALTER TABLE erp.sales_order_items
      ADD CONSTRAINT chk_order_item_unit_price_non_negative
      CHECK (unit_price >= 0);
    RAISE NOTICE 'Added: chk_order_item_unit_price_non_negative';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_item_total_price_non_negative'
  ) THEN
    ALTER TABLE erp.sales_order_items
      ADD CONSTRAINT chk_order_item_total_price_non_negative
      CHECK (total_price >= 0);
    RAISE NOTICE 'Added: chk_order_item_total_price_non_negative';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_item_quantity_positive'
  ) THEN
    ALTER TABLE erp.sales_order_items
      ADD CONSTRAINT chk_order_item_quantity_positive
      CHECK (quantity > 0);
    RAISE NOTICE 'Added: chk_order_item_quantity_positive';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Financial — receivables and payables must have positive amounts
-- ---------------------------------------------------------------------------
-- Why: The direction (receivable vs payable) determines the sign semantics.
-- The amount itself should always be positive. Refunds are separate entries.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_receivable_value_positive'
  ) THEN
    ALTER TABLE erp.receivables
      ADD CONSTRAINT chk_receivable_value_positive
      CHECK (value > 0);
    RAISE NOTICE 'Added: chk_receivable_value_positive';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_payable_value_positive'
  ) THEN
    ALTER TABLE erp.payables
      ADD CONSTRAINT chk_payable_value_positive
      CHECK (value > 0);
    RAISE NOTICE 'Added: chk_payable_value_positive';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Financial accounts — balance tracking integrity
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_financial_account_opening_balance'
  ) THEN
    ALTER TABLE erp.financial_accounts
      ADD CONSTRAINT chk_financial_account_opening_balance
      CHECK (opening_balance IS NOT NULL);
    RAISE NOTICE 'Added: chk_financial_account_opening_balance';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. NF-e — prevent duplicate active invoices per order
-- ---------------------------------------------------------------------------
-- Why: Two active NF-e documents for the same order+type is a fiscal violation.
-- Cancelled NF-e are excluded. Only one active (draft/pending/authorized) allowed.

CREATE UNIQUE INDEX IF NOT EXISTS idx_nfe_unique_active_per_order
  ON erp.nfe_documents (tenant_id, sales_order_id, type)
  WHERE status NOT IN ('cancelled', 'rejected', 'denied');

-- ---------------------------------------------------------------------------
-- 6. Shipping labels — one active label per order
-- ---------------------------------------------------------------------------
-- Why: Generating duplicate shipping labels wastes money and causes logistics
-- confusion. Only one non-cancelled label per order.

CREATE UNIQUE INDEX IF NOT EXISTS idx_shipping_label_unique_active_per_order
  ON erp.shipping_labels (tenant_id, sales_order_id)
  WHERE status NOT IN ('cancelled');

-- ---------------------------------------------------------------------------
-- 7. Purchase orders — amounts must be non-negative
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_purchase_order_total_non_negative'
  ) THEN
    ALTER TABLE erp.purchase_orders
      ADD CONSTRAINT chk_purchase_order_total_non_negative
      CHECK (total >= 0);
    RAISE NOTICE 'Added: chk_purchase_order_total_non_negative';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 8. Credit limit — must be non-negative
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_contact_credit_limit_non_negative'
  ) THEN
    ALTER TABLE erp.contacts
      ADD CONSTRAINT chk_contact_credit_limit_non_negative
      CHECK (credit_limit >= 0);
    RAISE NOTICE 'Added: chk_contact_credit_limit_non_negative';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Summary
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  constraint_count int;
  unique_idx_count int;
BEGIN
  SELECT count(*) INTO constraint_count
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'erp' AND c.conname LIKE 'chk_%';

  SELECT count(*) INTO unique_idx_count
    FROM pg_indexes
    WHERE schemaname = 'erp' AND indexname LIKE 'idx_%unique%';

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  Iron Core Constraints Summary';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  CHECK constraints in erp schema:  %', constraint_count;
  RAISE NOTICE '  Partial UNIQUE indexes in erp:     %', unique_idx_count;
  RAISE NOTICE '═══════════════════════════════════════════';
END $$;
