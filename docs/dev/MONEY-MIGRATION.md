# Money Column Migration: numeric(12,2) to Integer Cents

**Status:** Planned
**Date:** 2026-04-24
**Risk Level:** Low (pre-production, no live data)

## Summary

The Ambaril schema uses `numeric(12,2)` for ~120 columns across 8 schema files. This migration reclassifies each column and converts money/tax columns to `integer` (storing cents), quantity columns to `integer` (whole units), and keeps only true rate/percentage columns as `numeric`.

**Why integer cents?**

- No floating-point rounding errors in arithmetic
- Faster comparisons and indexing (integer vs. numeric)
- Simpler application code (no string-to-number conversion from Drizzle `numeric`)
- Industry standard (Stripe, Shopify, Mercado Pago all use integer cents)

---

## Classification Table

### Legend

| Category  | Target Type     | Description                                                                   |
| --------- | --------------- | ----------------------------------------------------------------------------- |
| MONEY     | `integer`       | Currency amounts stored as cents (BRL \* 100)                                 |
| TAX_VALUE | `integer`       | Tax amounts stored as cents (same as MONEY)                                   |
| QUANTITY  | `numeric(10,4)` | Keep as-is when fractional (meters, kg); change to `integer` when whole units |
| RATE      | `numeric(X,Y)`  | Percentages, rates, ratios -- keep decimal                                    |

---

### checkout.ts

| Table           | Column          | Current Type  | Target Type  | Category |
| --------------- | --------------- | ------------- | ------------ | -------- |
| carts           | subtotal        | numeric(12,2) | integer      | MONEY    |
| carts           | discount_amount | numeric(12,2) | integer      | MONEY    |
| carts           | shipping_cost   | numeric(12,2) | integer      | MONEY    |
| carts           | total           | numeric(12,2) | integer      | MONEY    |
| cart_items      | unit_price      | numeric(12,2) | integer      | MONEY    |
| cart_items      | total_price     | numeric(12,2) | integer      | MONEY    |
| orders          | subtotal        | numeric(12,2) | integer      | MONEY    |
| orders          | discount_amount | numeric(12,2) | integer      | MONEY    |
| orders          | shipping_cost   | numeric(12,2) | integer      | MONEY    |
| orders          | total           | numeric(12,2) | integer      | MONEY    |
| order_items     | unit_price      | numeric(12,2) | integer      | MONEY    |
| order_items     | total_price     | numeric(12,2) | integer      | MONEY    |
| abandoned_carts | total_value     | numeric(12,2) | integer      | MONEY    |
| ab_tests        | traffic_split   | numeric(3,2)  | numeric(3,2) | RATE     |

**Subtotal: 13 MONEY, 1 RATE = 14 columns**

---

### erp.ts

| Table                  | Column                 | Current Type   | Target Type    | Category  |
| ---------------------- | ---------------------- | -------------- | -------------- | --------- |
| contacts               | credit_limit           | numeric(12,2)  | integer        | MONEY     |
| financial_accounts     | opening_balance        | numeric(12,2)  | integer        | MONEY     |
| financial_accounts     | current_balance        | numeric(12,2)  | integer        | MONEY     |
| tax_groups             | icms_paliq             | numeric(5,2)   | numeric(5,2)   | RATE      |
| tax_groups             | icms_pred_bc           | numeric(5,2)   | numeric(5,2)   | RATE      |
| tax_groups             | ipi_paliq              | numeric(5,2)   | numeric(5,2)   | RATE      |
| tax_groups             | pis_paliq              | numeric(5,4)   | numeric(5,4)   | RATE      |
| tax_groups             | cofins_paliq           | numeric(5,4)   | numeric(5,4)   | RATE      |
| tax_groups             | percentual_tributos    | numeric(5,2)   | numeric(5,2)   | RATE      |
| products               | percentual_tributos    | numeric(5,2)   | numeric(5,2)   | RATE      |
| products               | price_base             | numeric(12,2)  | integer        | MONEY     |
| products               | price_list             | numeric(12,2)  | integer        | MONEY     |
| skus                   | price                  | numeric(12,2)  | integer        | MONEY     |
| skus                   | price_list             | numeric(12,2)  | integer        | MONEY     |
| skus                   | cost_price             | numeric(12,2)  | integer        | MONEY     |
| inventory              | depletion_velocity     | numeric(8,2)   | numeric(8,2)   | RATE      |
| inventory_movements    | cost_price             | numeric(12,2)  | integer        | MONEY     |
| sales_orders           | freight_value          | numeric(12,2)  | integer        | MONEY     |
| sales_orders           | subtotal               | numeric(12,2)  | integer        | MONEY     |
| sales_orders           | discount_value         | numeric(12,2)  | integer        | MONEY     |
| sales_orders           | total_products         | numeric(12,2)  | integer        | MONEY     |
| sales_orders           | total                  | numeric(12,2)  | integer        | MONEY     |
| sales_order_items      | quantity               | numeric(10,4)  | numeric(10,4)  | QUANTITY  |
| sales_order_items      | list_price             | numeric(12,2)  | integer        | MONEY     |
| sales_order_items      | unit_price             | numeric(12,2)  | integer        | MONEY     |
| sales_order_items      | discount_pct           | numeric(5,2)   | numeric(5,2)   | RATE      |
| sales_order_items      | total_price            | numeric(12,2)  | integer        | MONEY     |
| sales_order_items      | commission_rate        | numeric(5,2)   | numeric(5,2)   | RATE      |
| sales_order_items      | commission_value       | numeric(12,2)  | integer        | MONEY     |
| sales_order_payments   | value                  | numeric(12,2)  | integer        | MONEY     |
| purchase_orders        | subtotal               | numeric(12,2)  | integer        | MONEY     |
| purchase_orders        | total_ipi              | numeric(12,2)  | integer        | TAX_VALUE |
| purchase_orders        | total_icms_st          | numeric(12,2)  | integer        | TAX_VALUE |
| purchase_orders        | freight_value          | numeric(12,2)  | integer        | MONEY     |
| purchase_orders        | total                  | numeric(12,2)  | integer        | MONEY     |
| purchase_order_items   | quantity               | numeric(10,4)  | numeric(10,4)  | QUANTITY  |
| purchase_order_items   | unit_price             | numeric(12,2)  | integer        | MONEY     |
| purchase_order_items   | ipi_rate               | numeric(5,2)   | numeric(5,2)   | RATE      |
| purchase_order_items   | total_ipi              | numeric(12,2)  | integer        | TAX_VALUE |
| purchase_order_items   | total_price            | numeric(12,2)  | integer        | MONEY     |
| nfe_documents          | total_products         | numeric(12,2)  | integer        | MONEY     |
| nfe_documents          | freight_value          | numeric(12,2)  | integer        | MONEY     |
| nfe_documents          | insurance_value        | numeric(12,2)  | integer        | MONEY     |
| nfe_documents          | other_expenses         | numeric(12,2)  | integer        | MONEY     |
| nfe_documents          | discount_value         | numeric(12,2)  | integer        | MONEY     |
| nfe_documents          | total_icms             | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_documents          | total_icms_st          | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_documents          | total_fcp              | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_documents          | total_fcp_st           | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_documents          | total_ipi              | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_documents          | total_pis              | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_documents          | total_cofins           | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_documents          | total_nfe              | numeric(12,2)  | integer        | MONEY     |
| nfe_items              | quantity               | numeric(10,4)  | numeric(10,4)  | QUANTITY  |
| nfe_items              | unit_price             | numeric(12,10) | numeric(12,10) | RATE      |
| nfe_items              | total_gross            | numeric(12,2)  | integer        | MONEY     |
| nfe_items              | freight_item           | numeric(12,2)  | integer        | MONEY     |
| nfe_items              | other_expenses         | numeric(12,2)  | integer        | MONEY     |
| nfe_items              | discount_item          | numeric(12,2)  | integer        | MONEY     |
| nfe_items              | total_item             | numeric(12,2)  | integer        | MONEY     |
| nfe_items              | icms_pred_bc           | numeric(5,2)   | numeric(5,2)   | RATE      |
| nfe_items              | icms_vbc               | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | icms_paliq             | numeric(5,2)   | numeric(5,2)   | RATE      |
| nfe_items              | icms_vicms             | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | icms_pmvast            | numeric(5,2)   | numeric(5,2)   | RATE      |
| nfe_items              | icms_pred_bcst         | numeric(5,2)   | numeric(5,2)   | RATE      |
| nfe_items              | icms_vbcst             | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | icms_paliqst           | numeric(5,2)   | numeric(5,2)   | RATE      |
| nfe_items              | icms_vicmsst           | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | icms_vbcstret          | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | icms_vicmsstret        | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | icms_pst               | numeric(5,2)   | numeric(5,2)   | RATE      |
| nfe_items              | icms_vicms_substituto  | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | icms_pcred_sn          | numeric(5,2)   | numeric(5,2)   | RATE      |
| nfe_items              | icms_vcred_sn          | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | fcp_paliq              | numeric(5,2)   | numeric(5,2)   | RATE      |
| nfe_items              | fcp_vbc                | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | fcp_vfcp               | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | fcp_vbcst              | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | fcp_paliqst            | numeric(5,2)   | numeric(5,2)   | RATE      |
| nfe_items              | fcp_vfcpst             | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | icms_vbc_desop         | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | icms_vicms_deson       | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | difal_vbc              | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | difal_paliq_dest       | numeric(5,2)   | numeric(5,2)   | RATE      |
| nfe_items              | difal_paliq_inter      | numeric(5,2)   | numeric(5,2)   | RATE      |
| nfe_items              | difal_vicms_dest       | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | difal_vicms_remet      | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | difal_pfcp_dest        | numeric(5,2)   | numeric(5,2)   | RATE      |
| nfe_items              | difal_vfcp_dest        | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | ipi_vbc                | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | ipi_paliq              | numeric(5,2)   | numeric(5,2)   | RATE      |
| nfe_items              | ipi_vipi               | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | ipi_vunid              | numeric(12,4)  | numeric(12,4)  | RATE      |
| nfe_items              | pis_vbc                | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | pis_paliq              | numeric(5,4)   | numeric(5,4)   | RATE      |
| nfe_items              | pis_vpis               | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | pis_vbcst              | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | pis_paliqst            | numeric(5,4)   | numeric(5,4)   | RATE      |
| nfe_items              | pis_vpist              | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | cofins_vbc             | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | cofins_paliq           | numeric(5,4)   | numeric(5,4)   | RATE      |
| nfe_items              | cofins_vcofins         | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | cofins_vbcst           | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_items              | cofins_paliqst         | numeric(5,4)   | numeric(5,4)   | RATE      |
| nfe_items              | cofins_vcofinsst       | numeric(12,2)  | integer        | TAX_VALUE |
| nfe_payments           | value                  | numeric(12,2)  | integer        | MONEY     |
| receivables            | value                  | numeric(12,2)  | integer        | MONEY     |
| receivables            | paid_value             | numeric(12,2)  | integer        | MONEY     |
| receivables            | discount               | numeric(12,2)  | integer        | MONEY     |
| receivables            | fine                   | numeric(12,2)  | integer        | MONEY     |
| receivables            | interest               | numeric(12,2)  | integer        | MONEY     |
| payables               | value                  | numeric(12,2)  | integer        | MONEY     |
| payables               | paid_value             | numeric(12,2)  | integer        | MONEY     |
| payables               | discount               | numeric(12,2)  | integer        | MONEY     |
| payables               | fine                   | numeric(12,2)  | integer        | MONEY     |
| payables               | interest               | numeric(12,2)  | integer        | MONEY     |
| financial_transactions | gross_amount           | numeric(12,2)  | integer        | MONEY     |
| financial_transactions | fee_amount             | numeric(12,2)  | integer        | MONEY     |
| financial_transactions | net_amount             | numeric(12,2)  | integer        | MONEY     |
| margin_calculations    | selling_price          | numeric(12,2)  | integer        | MONEY     |
| margin_calculations    | production_cost        | numeric(12,2)  | integer        | MONEY     |
| margin_calculations    | avg_shipping_cost      | numeric(12,2)  | integer        | MONEY     |
| margin_calculations    | gateway_fee_rate       | numeric(5,4)   | numeric(5,4)   | RATE      |
| margin_calculations    | gateway_fee_amount     | numeric(12,2)  | integer        | MONEY     |
| margin_calculations    | tax_icms_rate          | numeric(5,4)   | numeric(5,4)   | RATE      |
| margin_calculations    | tax_pis_rate           | numeric(5,4)   | numeric(5,4)   | RATE      |
| margin_calculations    | tax_cofins_rate        | numeric(5,4)   | numeric(5,4)   | RATE      |
| margin_calculations    | tax_total_amount       | numeric(12,2)  | integer        | TAX_VALUE |
| margin_calculations    | gross_margin           | numeric(12,2)  | integer        | MONEY     |
| margin_calculations    | gross_margin_pct       | numeric(5,2)   | numeric(5,2)   | RATE      |
| margin_calculations    | net_margin             | numeric(12,2)  | integer        | MONEY     |
| margin_calculations    | net_margin_pct         | numeric(5,2)   | numeric(5,2)   | RATE      |
| shipping_labels        | cost                   | numeric(12,2)  | integer        | MONEY     |
| revenue_leak_daily     | avg_conversion_rate    | numeric(5,4)   | numeric(5,4)   | RATE      |
| revenue_leak_daily     | avg_order_value        | numeric(12,2)  | integer        | MONEY     |
| revenue_leak_daily     | estimated_lost_revenue | numeric(12,2)  | integer        | MONEY     |

**Subtotal: 63 MONEY, 38 TAX_VALUE, 3 QUANTITY (kept), 33 RATE (kept) = 137 columns**

---

### plm.ts

| Table                 | Column        | Current Type  | Target Type   | Category |
| --------------------- | ------------- | ------------- | ------------- | -------- |
| raw_materials         | unit_cost     | numeric(12,2) | integer       | MONEY    |
| raw_materials         | current_stock | numeric(12,2) | numeric(12,2) | QUANTITY |
| raw_materials         | min_stock     | numeric(12,2) | numeric(12,2) | QUANTITY |
| material_requirements | required_qty  | numeric(12,2) | numeric(12,2) | QUANTITY |
| material_requirements | allocated_qty | numeric(12,2) | numeric(12,2) | QUANTITY |

**Subtotal: 1 MONEY, 4 QUANTITY (kept) = 5 columns**

---

### crm.ts

| Table      | Column              | Current Type  | Target Type  | Category |
| ---------- | ------------------- | ------------- | ------------ | -------- |
| contacts   | total_spent         | numeric(12,2) | integer      | MONEY    |
| contacts   | average_order_value | numeric(12,2) | integer      | MONEY    |
| contacts   | ltv                 | numeric(12,2) | integer      | MONEY    |
| rfm_scores | monetary_total      | numeric(12,2) | integer      | MONEY    |
| cohorts    | avg_ltv             | numeric(12,2) | integer      | MONEY    |
| cohorts    | repurchase_rate     | numeric(5,2)  | numeric(5,2) | RATE     |
| cohorts    | churn_rate          | numeric(5,2)  | numeric(5,2) | RATE     |

**Subtotal: 5 MONEY, 2 RATE = 7 columns**

---

### creators.ts

| Table              | Column                     | Current Type  | Target Type  | Category  |
| ------------------ | -------------------------- | ------------- | ------------ | --------- |
| creator_tiers      | commission_rate            | numeric(5,2)  | numeric(5,2) | RATE      |
| coupons            | discount_percent           | numeric(5,2)  | numeric(5,2) | RATE      |
| coupons            | discount_amount            | numeric(12,2) | integer      | MONEY     |
| coupons            | total_revenue_generated    | numeric(12,2) | integer      | MONEY     |
| coupons            | min_order_value            | numeric(12,2) | integer      | MONEY     |
| creators           | commission_rate            | numeric(5,2)  | numeric(5,2) | RATE      |
| creators           | total_sales_amount         | numeric(12,2) | integer      | MONEY     |
| creators           | current_month_sales_amount | numeric(12,2) | integer      | MONEY     |
| creators           | monthly_cap                | numeric(12,2) | integer      | MONEY     |
| sales_attributions | order_total                | numeric(12,2) | integer      | MONEY     |
| sales_attributions | discount_amount            | numeric(12,2) | integer      | MONEY     |
| sales_attributions | net_revenue                | numeric(12,2) | integer      | MONEY     |
| sales_attributions | commission_rate            | numeric(5,2)  | numeric(5,2) | RATE      |
| sales_attributions | commission_amount          | numeric(12,2) | integer      | MONEY     |
| payouts            | gross_amount               | numeric(12,2) | integer      | MONEY     |
| payouts            | irrf_withheld              | numeric(12,2) | integer      | TAX_VALUE |
| payouts            | iss_withheld               | numeric(12,2) | integer      | TAX_VALUE |
| payouts            | net_amount                 | numeric(12,2) | integer      | MONEY     |
| payouts            | store_credit_amount        | numeric(12,2) | integer      | MONEY     |
| payouts            | product_total_cost         | numeric(12,2) | integer      | MONEY     |
| campaigns          | total_product_cost         | numeric(12,2) | integer      | MONEY     |
| campaigns          | total_shipping_cost        | numeric(12,2) | integer      | MONEY     |
| campaigns          | total_fee_cost             | numeric(12,2) | integer      | MONEY     |
| campaigns          | total_reward_cost          | numeric(12,2) | integer      | MONEY     |
| campaign_creators  | product_cost               | numeric(12,2) | integer      | MONEY     |
| campaign_creators  | shipping_cost              | numeric(12,2) | integer      | MONEY     |
| campaign_creators  | fee_amount                 | numeric(12,2) | integer      | MONEY     |
| gifting_log        | product_cost               | numeric(12,2) | integer      | MONEY     |
| gifting_log        | shipping_cost              | numeric(12,2) | integer      | MONEY     |
| tax_profiles       | iss_rate                   | numeric(5,2)  | numeric(5,2) | RATE      |

**Subtotal: 24 MONEY, 2 TAX_VALUE, 4 RATE = 30 columns**

---

### trocas.ts

| Table             | Column              | Current Type  | Target Type | Category |
| ----------------- | ------------------- | ------------- | ----------- | -------- |
| exchange_requests | refund_amount       | numeric(12,2) | integer     | MONEY    |
| exchange_requests | store_credit_amount | numeric(12,2) | integer     | MONEY    |

**Subtotal: 2 MONEY = 2 columns**

---

### b2b.ts

| Table            | Column           | Current Type  | Target Type  | Category |
| ---------------- | ---------------- | ------------- | ------------ | -------- |
| b2b_price_tables | markup_percent   | numeric(5,2)  | numeric(5,2) | RATE     |
| b2b_price_tables | min_order_amount | numeric(12,2) | integer      | MONEY    |
| b2b_orders       | subtotal         | numeric(12,2) | integer      | MONEY    |
| b2b_orders       | discount         | numeric(12,2) | integer      | MONEY    |
| b2b_orders       | total            | numeric(12,2) | integer      | MONEY    |
| b2b_order_items  | unit_price       | numeric(12,2) | integer      | MONEY    |
| b2b_order_items  | total            | numeric(12,2) | integer      | MONEY    |

**Subtotal: 6 MONEY, 1 RATE = 7 columns**

---

### dashboard.ts

| Table             | Column        | Current Type  | Target Type | Category |
| ----------------- | ------------- | ------------- | ----------- | -------- |
| war_room_sessions | total_revenue | numeric(12,2) | integer     | MONEY    |

**Subtotal: 1 MONEY = 1 column**

---

## Totals

| Category  | Count   | Action                                     |
| --------- | ------- | ------------------------------------------ |
| MONEY     | 115     | Change to `integer` (cents)                |
| TAX_VALUE | 40      | Change to `integer` (cents)                |
| QUANTITY  | 7       | Keep as `numeric(10,4)` or `numeric(12,2)` |
| RATE      | 41      | Keep as `numeric(5,2)` or `numeric(5,4)`   |
| **Total** | **203** |                                            |

**Columns changing to `integer`: 155**
**Columns staying as `numeric`: 48**

---

## Migration Approach

**Pre-production, no live data.** Change Drizzle schema files directly. Run `drizzle-kit push` to sync database.

### Steps

1. **Update Drizzle schema files** -- Replace `numeric("col", { precision: 12, scale: 2 })` with `integer("col")` for all MONEY and TAX_VALUE columns.

2. **Fix default values** -- All `.default("0")` on money columns must change to `.default(0)` (integer, not string).

3. **Run `drizzle-kit push`** -- Sync the database schema. Since there is no live data, destructive column type changes are safe.

4. **Update application code** -- All code reading/writing these columns must use integer cents.

### Schema Change Example

**Before:**

```typescript
subtotal: numeric("subtotal", { precision: 12, scale: 2 })
  .notNull()
  .default("0"),
```

**After:**

```typescript
subtotal: integer("subtotal")
  .notNull()
  .default(0),
```

---

## Code Impact

### Reading values

Drizzle returns `numeric` columns as strings. After migration to `integer`, values come back as JavaScript numbers (cents). No more `Number(val)` conversion needed for integer columns.

**Before (numeric):**

```typescript
const totalInReais = Number(order.total); // "12345.67" -> 12345.67
```

**After (integer cents):**

```typescript
const totalInReais = order.total / 100; // 1234567 -> 12345.67
```

### Writing values

**Before:**

```typescript
await db.insert(orders).values({ total: "12345.67" });
```

**After:**

```typescript
await db.insert(orders).values({ total: 1234567 }); // cents
```

### Display formatting

```typescript
function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
// formatBRL(1234567) -> "R$ 12.345,67"
```

### Rate columns (unchanged)

Rate columns remain as `numeric` and still return strings from Drizzle:

```typescript
const icmsRate = Number(item.icms_paliq); // "18.00" -> 18.00
```

### NF-e API integration

When sending to Focus NFe / Plugnotas, convert cents back to decimal strings:

```typescript
// NF-e XML expects decimal values like "123.45"
const vProd = (item.totalGross / 100).toFixed(2); // 12345 -> "123.45"
```

---

## Risk Assessment

| Risk                                      | Severity | Mitigation                                            |
| ----------------------------------------- | -------- | ----------------------------------------------------- |
| Default values using string `"0"` break   | Low      | Find-and-replace all `.default("0")` to `.default(0)` |
| Code passes string where integer expected | Low      | TypeScript will catch at compile time                 |
| NF-e unit_price has 10 decimal places     | None     | Kept as `numeric(12,10)` -- not changing              |
| Quantity columns with fractional values   | None     | Kept as `numeric(10,4)` -- not changing               |
| Existing seed data in wrong format        | Low      | Pre-production, wipe and re-seed                      |
| Rate columns mistakenly converted         | Medium   | Review this document before executing                 |

---

## Special Cases

### nfe_items.unit_price -- DO NOT CONVERT

This column uses `numeric(12,10)` (10 decimal places) per NF-e 4.0 XML spec (`vUnCom`). Storing as integer would require multiplying by 10^10, risking overflow. **Keep as numeric.**

### nfe_items.ipi_vunid -- DO NOT CONVERT

This column uses `numeric(12,4)` for fixed IPI value per unit. It is a rate-like value, not a money amount. **Keep as numeric.**

### Columns already using integer or bigint

- `crm.widgets.total_revenue_cents` -- already `bigint` (correct)
- `crm.widget_metrics_daily.revenue_cents` -- already `bigint` (correct)

These do not need changes.

### plm.raw_materials stock columns

`current_stock` and `min_stock` use `numeric(12,2)` but represent physical quantities (meters of fabric, kg of material). **Keep as `numeric(12,2)`** since fractional quantities are valid.

---

## Execution Order

1. Edit schema files (all 8 files listed above)
2. Run `pnpm drizzle-kit push` from `packages/db`
3. Update all service/API code that reads or writes money columns
4. Update seed scripts to use integer cents
5. Run full test suite
6. Update any Zod validation schemas (min/max values now in cents)
