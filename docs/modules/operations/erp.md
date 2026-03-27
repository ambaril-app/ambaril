# Mini-ERP + Fiscal — Module Spec

> **Module:** Mini-ERP + Fiscal
> **Schema:** `erp`
> **Route prefix:** `/api/v1/erp`
> **Admin UI route group:** `(admin)/erp/*`
> **Version:** 1.0
> **Date:** March 2026
> **Status:** Approved
> **Replaces:** Bling (R$ 0-50/mes savings + massive efficiency gain)
> **Sub-modules:** Margin Calculator, DRE (Income Statement)
> **References:** [DATABASE.md](../../architecture/DATABASE.md), [API.md](../../architecture/API.md), [AUTH.md](../../architecture/AUTH.md), [NOTIFICATIONS.md](../../platform/NOTIFICATIONS.md), [GLOSSARY.md](../../dev/GLOSSARY.md)

---

## 1. Purpose & Scope

The Mini-ERP + Fiscal module is the **operational backbone** of Ambaril. It owns the entire order fulfillment lifecycle — from the moment a checkout converts into a paid order through inventory allocation, fiscal document emission (NF-e), shipping label generation, delivery tracking, and financial reconciliation. It replaces Bling entirely, eliminating a third-party dependency that added friction and cost to every single order processed.

**Core responsibilities:**

| Capability | Description |
|-----------|-------------|
| **Order Pipeline** | Kanban-style order management with FSM: Pendente -> Pago -> Separacao -> Enviado -> Entregue. Ana Clara processes orders exclusively on mobile. |
| **Product & SKU Catalog** | Product hierarchy with multi-variant SKUs (size x color). Prices, costs, barcodes, weights, dimensions. |
| **Inventory Management** | Real-time stock tracking per SKU: available, reserved, in production, in transit. Depletion velocity and days-to-zero forecasting. |
| **Fiscal (NF-e)** | Brazilian electronic invoice emission via Focus NFe API. Auto-emit on separation, retry on failure, return NF-e from Trocas module. |
| **Shipping** | Label generation and tracking via Melhor Envio. Carrier selection, cost tracking, delivery status updates. |
| **Financial Reconciliation** | Transaction tracking per order. Mercado Pago webhook ingestion. Sale/refund/chargeback/fee recording. |
| **Margin Calculator** (sub-module) | Per-SKU margin breakdown: production cost + shipping + gateway fees + taxes = total cost vs. price. Price simulation. |
| **DRE / Income Statement** (sub-module) | Monthly P&L report: gross revenue, discounts, returns, net revenue, COGS, gross margin, operational expenses, net income. |

**Primary users:**

| User | Role | Usage Pattern |
|------|------|---------------|
| **Ana Clara** | `operations` | Processes orders, enters stock, generates labels. **Uses EXCLUSIVELY on mobile** — all screens must be mobile-first for her. |
| **Tavares** | `operations` | Monitors inventory, depletion velocity, production entry. Desktop and mobile. |
| **Pedro** | `finance` | Reviews DRE, uses margin calculator, monitors financial transactions. Read-only on operational views. |
| **Marcus** | `admin` | Full access. Financial overview and strategic decisions. |

**Out of scope:** This module does NOT handle the public checkout flow (owned by Checkout module), production planning (owned by PCP module), or exchange/return workflows (owned by Trocas module). ERP receives orders from Checkout, receives production entries from PCP, and receives return/restock events from Trocas.

---

## 2. User Stories

### 2.1 Ana Clara (Operations — Mobile)

| # | Story | Acceptance Criteria |
|---|-------|-------------------|
| US-01 | As Ana Clara, I want to see all pending orders as cards on my phone so I can process them one by one during the day. | Mobile order list with large cards, status badges, swipe gestures. Loads in under 2s on 4G. |
| US-02 | As Ana Clara, I want to tap an order card and see all details (customer, items, payment status) on a single scrollable mobile screen. | Order detail page with all info visible without horizontal scrolling. |
| US-03 | As Ana Clara, I want to mark an order as "Separando" with a single big button so I can start picking items. | Action button at least 44px tall. Tap triggers status transition + inventory reservation. |
| US-04 | As Ana Clara, I want to emit the NF-e for an order with one tap, and see immediate feedback on success or failure. | Button triggers NF-e emission via Focus NFe. Loading spinner. Success shows NF-e number. Failure shows error + retry button. |
| US-05 | As Ana Clara, I want to generate a shipping label with one tap and see the tracking code immediately. | Button triggers Melhor Envio label generation. Success shows tracking code and label PDF link. |
| US-06 | As Ana Clara, I want to mark an order as "Enviado" after I hand it to the carrier, with the tracking code already filled. | Confirm button. Status transitions to shipped. Customer notification triggered automatically. |
| US-07 | As Ana Clara, I want to enter new stock when a production batch arrives, by selecting the SKU and typing the quantity. | Mobile stock entry form: SKU dropdown (searchable), quantity numeric input, confirm button. All touch targets >= 44px. |
| US-08 | As Ana Clara, I want the full order processing flow (Separar -> NF-e -> Etiqueta -> Enviar) to be sequential big buttons so I never lose my place. | Step-by-step action flow on mobile with disabled/enabled states based on current order status. |

### 2.2 Tavares (Operations — Desktop & Mobile)

| # | Story | Acceptance Criteria |
|---|-------|-------------------|
| US-09 | As Tavares, I want to see the inventory dashboard with all SKUs, their available quantities, and depletion velocity so I can anticipate stockouts. | Table with columns: SKU, Product, Size, Color, Available, Reserved, InProd, Velocity, DaysToZero, Badge. Sortable columns. |
| US-10 | As Tavares, I want to receive an alert when a SKU's estimated days-to-zero drops below 14 days so I can reorder. | Alert appears in notification bell + Discord #alertas. Badge shows "Alerta" on inventory row. |
| US-11 | As Tavares, I want to see the order pipeline as a Kanban board so I can see how many orders are in each stage. | Kanban with columns: Pendente, Pago, Separacao, Enviado, Entregue. Card counts per column. |
| US-12 | As Tavares, I want to filter the inventory by category, low-stock only, or search by SKU code so I can find what I need quickly. | Filter bar with category dropdown, "Low Stock" toggle, search input. Results update in real-time. |
| US-13 | As Tavares, I want to view the full movement log for any SKU so I can trace every entry, exit, and adjustment. | Chronological list: date, type (sale/return/adjustment/etc.), quantity (+/-), reference, user. Filterable by date range and type. |
| US-14 | As Tavares, I want to register inventory adjustments (loss, damage, manual correction) with a reason note. | Adjustment form: SKU selector, quantity, movement type (loss/adjustment), notes field. Logged with user ID. |

### 2.3 Pedro (Finance)

| # | Story | Acceptance Criteria |
|---|-------|-------------------|
| US-15 | As Pedro, I want to use the Margin Calculator to see the exact margin for each SKU, broken down by cost component. | Card showing: production cost, avg shipping, gateway fee, tax, total cost, price, margin R$, margin %. |
| US-16 | As Pedro, I want to simulate a different price in the Margin Calculator and see how the margin changes before we commit. | "Simular" input field. Typing a new price instantly recalculates margin below. Does not save until confirmed. |
| US-17 | As Pedro, I want to see a ranking of SKUs by margin percentage so I can identify our most and least profitable items. | Table sorted by margin% descending. Columns: SKU, Product, Price, Cost, Margin R$, Margin %. Color-coded (green > 50%, yellow 30-50%, red < 30%). |
| US-18 | As Pedro, I want to generate and review the monthly DRE (Income Statement) so I can understand our financial position. | DRE report with all line items: Receita Bruta, (-) Descontos, (-) Devoluções, = Receita Líquida, (-) CMV, = Margem Bruta, (-) Despesas Operacionais, = Lucro Líquido. Period selector (month/year). |
| US-19 | As Pedro, I want to approve a DRE once I've reviewed it, locking it from further edits. | "Aprovar" button. Changes status from draft to final. Records approved_by. Final DRE cannot be edited. |
| US-20 | As Pedro, I want to see the financial reconciliation screen comparing Mercado Pago records with our internal transactions. | Side-by-side comparison: MP transaction vs. ERP transaction. Highlight discrepancies. Totals per period. |

### 2.4 Marcus (Admin)

| # | Story | Acceptance Criteria |
|---|-------|-------------------|
| US-21 | As Marcus, I want a high-level overview of the ERP: orders today, revenue, pending orders, inventory alerts, so I can assess operations at a glance. | Summary cards on ERP home: Orders Today, Revenue Today, Pending Orders, Low Stock Alerts, NF-e Failures. |
| US-22 | As Marcus, I want full access to every ERP feature including deleting products, cancelling orders, and managing NF-e. | Admin role has all permissions. Delete and admin actions visible. |

### 2.5 System

| # | Story | Acceptance Criteria |
|---|-------|-------------------|
| US-23 | As the system, I want to automatically reserve inventory when an order is paid so two orders can't claim the same stock. | On `order.paid`: decrement `quantity_available`, increment `quantity_reserved` for each SKU in the order. |
| US-24 | As the system, I want to calculate depletion velocity daily (30-day rolling average of exits) so forecasting is always current. | Daily job computes `depletion_velocity` per SKU from `inventory_movements` where type in (sale, loss) in last 30 days. |
| US-25 | As the system, I want to alert operations when a SKU hits its reorder point or when days-to-zero < 14. | Flare event: `stock.low` at reorder point, `stock.critical` when days-to-zero < 7. |
| US-26 | As the system, I want to auto-emit NF-e when an order transitions to "Separando" so Ana Clara doesn't have to remember. | On status transition to `separating`: queue NF-e emission job. If emission fails, show retry button and alert Discord. |
| US-27 | As the system, I want to record Mercado Pago webhook events as financial transactions so reconciliation is automatic. | Webhook handler creates `erp.financial_transactions` row on payment.approved, refund, chargeback events. |

### 2.6 Pandora96 — Tier Classification & Revenue Leak

| # | Story | Acceptance Criteria |
|---|-------|-------------------|
| US-28 | As Tavares, I want to see SKUs classified into tiers (Ouro/Prata/Bronze) based on depletion velocity and sales volume so I can prioritize restocking decisions. | Tier badge on inventory table (gold/silver/bronze color-coded). Sortable by tier column. Filterable by tier via dropdown. SKUs with < 30 days of data show "Sem classificacao". |
| US-29 | As Marcus, I want to see estimated revenue leak per out-of-stock SKU so I can quantify the cost of stockouts. | Revenue Leak card on inventory dashboard: R$ lost per SKU = visits x conversion rate x avg ticket. Top 10 SKUs by loss. Weekly trend sparkline. Data sourced from `erp.revenue_leak_daily`. |
| US-30 | As Tavares, I want to be alerted when a Gold-tier SKU has fewer than 7 days of coverage so I can trigger restocking urgently. | Flare event `inventory.coverage_critical` fires. Discord #alertas notification with SKU details. In-app notification to `operations` role. Badge "OURO CRITICO" on inventory row. |

---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```mermaid
erDiagram
    erp_products ||--o{ erp_skus : "has variants"
    erp_skus ||--o| erp_inventory : "stock level"
    erp_skus ||--o{ erp_inventory_movements : "movement log"
    erp_skus ||--o{ erp_margin_calculations : "margin analysis"

    checkout_orders ||--o| erp_nfe_documents : "fiscal doc"
    checkout_orders ||--o| erp_shipping_labels : "shipping"
    checkout_orders ||--o{ erp_financial_transactions : "payments"

    erp_products {
        uuid id PK
        varchar name
        varchar slug
        text description
        varchar category
        jsonb images
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    erp_skus {
        uuid id PK
        uuid product_id FK
        varchar sku_code UK
        varchar size
        varchar color
        numeric price
        numeric compare_at_price
        numeric cost_price
        int weight_grams
        jsonb dimensions
        varchar barcode
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    erp_inventory {
        uuid id PK
        uuid sku_id FK_UK
        int quantity_available
        int quantity_reserved
        int quantity_in_production
        int quantity_in_transit
        int reorder_point
        numeric depletion_velocity
        timestamptz last_entry_at
        timestamptz last_exit_at
        timestamptz updated_at
    }

    erp_inventory_movements {
        uuid id PK
        uuid sku_id FK
        enum movement_type
        int quantity
        varchar reference_type
        uuid reference_id
        text notes
        uuid user_id FK
        timestamptz created_at
    }

    erp_nfe_documents {
        uuid id PK
        uuid order_id FK
        enum type
        int nfe_number
        varchar nfe_key
        int series
        enum status
        text xml_url
        text pdf_url
        varchar api_provider
        jsonb api_request
        jsonb api_response
        text error_message
        int retry_count
        timestamptz emitted_at
        timestamptz cancelled_at
        timestamptz created_at
        timestamptz updated_at
    }

    erp_financial_transactions {
        uuid id PK
        uuid order_id FK
        enum type
        numeric amount
        enum payment_method
        varchar payment_provider
        varchar provider_transaction_id
        enum status
        jsonb metadata
        timestamptz settled_at
        timestamptz created_at
    }

    erp_margin_calculations {
        uuid id PK
        uuid sku_id FK
        numeric production_cost
        numeric avg_shipping_cost
        numeric gateway_fee_rate
        numeric tax_rate
        numeric total_cost
        numeric price
        numeric margin_amount
        numeric margin_percent
        numeric simulated_price
        numeric simulated_margin_percent
        timestamptz calculated_at
        uuid calculated_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    erp_income_statements {
        uuid id PK
        int period_month
        int period_year
        numeric gross_revenue
        numeric discounts
        numeric returns
        numeric net_revenue
        numeric cogs
        numeric gross_margin
        jsonb operational_expenses
        numeric net_income
        enum status
        text notes
        timestamptz generated_at
        uuid approved_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    erp_shipping_labels {
        uuid id PK
        uuid order_id FK
        varchar provider
        varchar service_name
        varchar tracking_code
        text label_url
        numeric cost
        int estimated_delivery_days
        enum status
        timestamptz shipped_at
        timestamptz delivered_at
        timestamptz created_at
        timestamptz updated_at
    }
```

**Cross-schema references:**

```
checkout.orders.id        --> erp.nfe_documents.order_id
checkout.orders.id        --> erp.shipping_labels.order_id
checkout.orders.id        --> erp.financial_transactions.order_id
pcp.production_orders     --> erp.inventory_movements (production_entry)
pcp.cost_analyses         --> erp.margin_calculations.production_cost
trocas.exchange_requests  --> erp.nfe_documents (type = return)
trocas.exchange_requests  --> erp.inventory_movements (type = return)
crm.contacts              <-- checkout.orders.contact_id (order -> contact LTV)
creators.sales_attributions <-- erp.financial_transactions (coupon -> commission)
global.users.id           --> erp.inventory_movements.user_id
global.users.id           --> erp.margin_calculations.calculated_by
global.users.id           --> erp.income_statements.approved_by
```

### 3.2 Enums

```sql
CREATE TYPE erp.movement_type AS ENUM (
    'sale', 'return', 'adjustment', 'production_entry', 'purchase', 'loss'
);
CREATE TYPE erp.nfe_type AS ENUM ('sale', 'return');
CREATE TYPE erp.nfe_status AS ENUM (
    'pending', 'processing', 'authorized', 'cancelled', 'rejected', 'denied'
);
CREATE TYPE erp.transaction_type AS ENUM (
    'sale', 'refund', 'chargeback', 'fee'
);
CREATE TYPE erp.payment_method AS ENUM (
    'credit_card', 'pix', 'bank_slip'
);
CREATE TYPE erp.transaction_status AS ENUM (
    'pending', 'settled', 'failed'
);
CREATE TYPE erp.shipping_label_status AS ENUM (
    'pending', 'generated', 'shipped', 'in_transit', 'delivered', 'returned'
);
CREATE TYPE erp.income_statement_status AS ENUM ('draft', 'final');
```

### 3.3 erp.products

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | UUID v7 |
| name | VARCHAR(255) | NOT NULL | Product display name (e.g., "Camiseta Preta Basic") |
| slug | VARCHAR(255) | NOT NULL, UNIQUE | URL-friendly identifier (e.g., "camiseta-preta-basic") |
| description | TEXT | NULL | Product description for internal use |
| category | VARCHAR(100) | NOT NULL | Product category (e.g., "camiseta", "moletom", "calca", "acessorio") |
| images | JSONB | NOT NULL DEFAULT '[]' | Array of image objects: `[{ "url": "...", "alt": "...", "position": 1 }]` |
| is_active | BOOLEAN | NOT NULL DEFAULT TRUE | Soft-toggle for catalog visibility |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete |

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_products_slug ON erp.products (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON erp.products (category);
CREATE INDEX idx_products_is_active ON erp.products (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_not_deleted ON erp.products (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_name_search ON erp.products USING GIN (to_tsvector('portuguese', name));
```

### 3.4 erp.skus

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | UUID v7 |
| product_id | UUID | NOT NULL, FK erp.products(id) | Parent product |
| sku_code | VARCHAR(50) | NOT NULL, UNIQUE | Human-readable SKU code (e.g., "SKU-0412-P-PRETA") |
| size | VARCHAR(10) | NOT NULL | Size variant (e.g., "PP", "P", "M", "G", "GG", "XGG") |
| color | VARCHAR(50) | NOT NULL | Color variant (e.g., "Preto", "Branco", "Off-White") |
| price | NUMERIC(12,2) | NOT NULL | Current selling price in BRL |
| compare_at_price | NUMERIC(12,2) | NULL | Original/strike-through price (for showing discounts) |
| cost_price | NUMERIC(12,2) | NOT NULL | Unit production/purchase cost. Fed by PCP cost_analyses. |
| weight_grams | INTEGER | NOT NULL | Weight in grams (for shipping calculation) |
| dimensions | JSONB | NULL | `{ "length_cm": 30, "width_cm": 20, "height_cm": 5 }` |
| barcode | VARCHAR(50) | NULL | EAN-13 or internal barcode |
| is_active | BOOLEAN | NOT NULL DEFAULT TRUE | Whether this variant is available for sale |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_skus_code ON erp.skus (sku_code);
CREATE INDEX idx_skus_product ON erp.skus (product_id);
CREATE INDEX idx_skus_size ON erp.skus (size);
CREATE INDEX idx_skus_color ON erp.skus (color);
CREATE INDEX idx_skus_is_active ON erp.skus (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_skus_barcode ON erp.skus (barcode) WHERE barcode IS NOT NULL;
```

### 3.5 erp.inventory

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | UUID v7 |
| sku_id | UUID | NOT NULL, FK erp.skus(id), UNIQUE | One inventory record per SKU |
| quantity_available | INTEGER | NOT NULL DEFAULT 0 | Units available for sale |
| quantity_reserved | INTEGER | NOT NULL DEFAULT 0 | Units reserved by paid orders not yet shipped |
| quantity_in_production | INTEGER | NOT NULL DEFAULT 0 | Units currently being produced (from PCP) |
| quantity_in_transit | INTEGER | NOT NULL DEFAULT 0 | Units shipped to warehouse but not yet received |
| reorder_point | INTEGER | NOT NULL DEFAULT 10 | Alert threshold: notify when available <= reorder_point |
| depletion_velocity | NUMERIC(8,2) | NOT NULL DEFAULT 0 | Average units sold per day (30-day rolling window) |
| last_entry_at | TIMESTAMPTZ | NULL | Timestamp of last stock increase (production_entry, purchase, return) |
| last_exit_at | TIMESTAMPTZ | NULL | Timestamp of last stock decrease (sale, loss) |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_inventory_sku ON erp.inventory (sku_id);
CREATE INDEX idx_inventory_low_stock ON erp.inventory (quantity_available)
    WHERE quantity_available > 0;
CREATE INDEX idx_inventory_velocity ON erp.inventory (depletion_velocity DESC);
```

### 3.6 erp.inventory_movements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | UUID v7 |
| sku_id | UUID | NOT NULL, FK erp.skus(id) | Which SKU was affected |
| movement_type | erp.movement_type | NOT NULL | sale, return, adjustment, production_entry, purchase, loss |
| quantity | INTEGER | NOT NULL | Positive = entry, negative = exit. Always stored with sign. |
| reference_type | VARCHAR(50) | NULL | Source entity type: 'order', 'exchange_request', 'production_order', 'manual' |
| reference_id | UUID | NULL | ID of the source entity |
| notes | TEXT | NULL | Free-text note (required for adjustments and losses) |
| user_id | UUID | NOT NULL, FK global.users(id) | Who performed or triggered this movement |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Immutable — append-only log |

> **Immutability:** This table is append-only. Movements are never updated or deleted. To correct a mistake, insert a compensating movement (e.g., a positive adjustment to reverse a loss).

**Indexes:**

```sql
CREATE INDEX idx_movements_sku ON erp.inventory_movements (sku_id);
CREATE INDEX idx_movements_type ON erp.inventory_movements (movement_type);
CREATE INDEX idx_movements_created ON erp.inventory_movements (created_at DESC);
CREATE INDEX idx_movements_reference ON erp.inventory_movements (reference_type, reference_id)
    WHERE reference_id IS NOT NULL;
CREATE INDEX idx_movements_user ON erp.inventory_movements (user_id);
CREATE INDEX idx_movements_sku_30d ON erp.inventory_movements (sku_id, created_at DESC)
    WHERE movement_type IN ('sale', 'loss');
```

### 3.7 erp.nfe_documents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | UUID v7 |
| order_id | UUID | NOT NULL, FK checkout.orders(id) | Which order this NF-e belongs to |
| type | erp.nfe_type | NOT NULL | sale (normal invoice) or return (Trocas return invoice) |
| nfe_number | INTEGER | NULL | NF-e number assigned by SEFAZ (NULL until authorized) |
| nfe_key | VARCHAR(44) | NULL | 44-digit NF-e access key (NULL until authorized) |
| series | INTEGER | NOT NULL DEFAULT 1 | NF-e series number |
| status | erp.nfe_status | NOT NULL DEFAULT 'pending' | pending -> processing -> authorized / rejected / denied / cancelled |
| xml_url | TEXT | NULL | S3 URL to the signed XML file |
| pdf_url | TEXT | NULL | S3 URL to the DANFE PDF |
| api_provider | VARCHAR(50) | NOT NULL DEFAULT 'focus_nfe' | Which NF-e API provider was used |
| api_request | JSONB | NULL | Full request payload sent to the NF-e API (for debugging) |
| api_response | JSONB | NULL | Full response payload from the NF-e API (for debugging) |
| error_message | TEXT | NULL | Human-readable error message if rejected/denied |
| retry_count | INTEGER | NOT NULL DEFAULT 0 | Number of emission attempts |
| emitted_at | TIMESTAMPTZ | NULL | When the NF-e was authorized by SEFAZ |
| cancelled_at | TIMESTAMPTZ | NULL | When the NF-e was cancelled (within 24h window) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

**Indexes:**

```sql
CREATE INDEX idx_nfe_order ON erp.nfe_documents (order_id);
CREATE INDEX idx_nfe_status ON erp.nfe_documents (status);
CREATE UNIQUE INDEX idx_nfe_key ON erp.nfe_documents (nfe_key) WHERE nfe_key IS NOT NULL;
CREATE INDEX idx_nfe_number ON erp.nfe_documents (nfe_number) WHERE nfe_number IS NOT NULL;
CREATE INDEX idx_nfe_type ON erp.nfe_documents (type);
CREATE INDEX idx_nfe_pending_retry ON erp.nfe_documents (retry_count)
    WHERE status IN ('rejected', 'denied') AND retry_count < 3;
```

### 3.8 erp.financial_transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | UUID v7 |
| order_id | UUID | NOT NULL, FK checkout.orders(id) | Which order this transaction belongs to |
| type | erp.transaction_type | NOT NULL | sale, refund, chargeback, fee |
| amount | NUMERIC(12,2) | NOT NULL | Transaction amount in BRL. Positive for sale, negative for refund/chargeback. |
| payment_method | erp.payment_method | NOT NULL | credit_card, pix, bank_slip |
| payment_provider | VARCHAR(50) | NOT NULL DEFAULT 'mercado_pago' | Payment gateway identifier |
| provider_transaction_id | VARCHAR(255) | NULL | External transaction ID from the payment provider |
| status | erp.transaction_status | NOT NULL DEFAULT 'pending' | pending -> settled / failed |
| metadata | JSONB | NULL | Provider-specific data: installments, card brand, PIX end-to-end ID, etc. |
| settled_at | TIMESTAMPTZ | NULL | When the funds were confirmed/settled |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

> **Immutability:** Financial transactions are append-only. A refund is a new row with `type=refund` and negative amount, not an update to the original sale row.

**Indexes:**

```sql
CREATE INDEX idx_ft_order ON erp.financial_transactions (order_id);
CREATE INDEX idx_ft_type ON erp.financial_transactions (type);
CREATE INDEX idx_ft_status ON erp.financial_transactions (status);
CREATE INDEX idx_ft_provider_txn ON erp.financial_transactions (provider_transaction_id)
    WHERE provider_transaction_id IS NOT NULL;
CREATE INDEX idx_ft_settled ON erp.financial_transactions (settled_at DESC)
    WHERE settled_at IS NOT NULL;
CREATE INDEX idx_ft_created ON erp.financial_transactions (created_at DESC);
```

### 3.9 erp.margin_calculations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | UUID v7 |
| sku_id | UUID | NOT NULL, FK erp.skus(id) | Which SKU this calculation is for |
| production_cost | NUMERIC(10,2) | NOT NULL | Unit production cost (from PCP cost_analyses or manual entry) |
| avg_shipping_cost | NUMERIC(10,2) | NOT NULL | Average shipping cost per unit (calculated from recent labels) |
| gateway_fee_rate | NUMERIC(5,4) | NOT NULL | Payment gateway fee as decimal (e.g., 0.0499 = 4.99%) |
| tax_rate | NUMERIC(5,4) | NOT NULL | Tax rate as decimal (e.g., 0.0400 = 4.00% Simples Nacional) |
| total_cost | NUMERIC(10,2) | NOT NULL | Computed: production_cost + avg_shipping_cost + (price * gateway_fee_rate) + (price * tax_rate) |
| price | NUMERIC(10,2) | NOT NULL | Current selling price (snapshot at calculation time) |
| margin_amount | NUMERIC(10,2) | NOT NULL | price - total_cost |
| margin_percent | NUMERIC(5,2) | NOT NULL | (margin_amount / price) * 100 |
| simulated_price | NUMERIC(10,2) | NULL | Optional: hypothetical price for "what-if" simulation |
| simulated_margin_percent | NUMERIC(5,2) | NULL | Margin % at the simulated price |
| calculated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | When this calculation was performed |
| calculated_by | UUID | NOT NULL, FK global.users(id) | Who triggered the calculation |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

**Indexes:**

```sql
CREATE INDEX idx_margin_sku ON erp.margin_calculations (sku_id);
CREATE INDEX idx_margin_calculated ON erp.margin_calculations (calculated_at DESC);
CREATE INDEX idx_margin_percent ON erp.margin_calculations (margin_percent DESC);
```

### 3.10 erp.income_statements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | UUID v7 |
| period_month | INTEGER | NOT NULL, CHECK (period_month BETWEEN 1 AND 12) | Month (1-12) |
| period_year | INTEGER | NOT NULL, CHECK (period_year >= 2024) | Year (e.g., 2026) |
| gross_revenue | NUMERIC(14,2) | NOT NULL | Sum of all sale transactions in the period |
| discounts | NUMERIC(12,2) | NOT NULL DEFAULT 0 | Sum of all discount amounts applied |
| returns | NUMERIC(12,2) | NOT NULL DEFAULT 0 | Sum of all refund/return amounts |
| net_revenue | NUMERIC(14,2) | NOT NULL | gross_revenue - discounts - returns |
| cogs | NUMERIC(12,2) | NOT NULL | Cost of Goods Sold: sum of (cost_price * quantity) for all items sold |
| gross_margin | NUMERIC(14,2) | NOT NULL | net_revenue - cogs |
| operational_expenses | JSONB | NOT NULL DEFAULT '{}' | Breakdown: `{ "marketing": 1500.00, "shipping": 3200.00, "platform_fees": 800.00, "personnel": 5000.00, "other": 200.00 }` |
| net_income | NUMERIC(14,2) | NOT NULL | gross_margin - SUM(operational_expenses values) |
| status | erp.income_statement_status | NOT NULL DEFAULT 'draft' | draft = editable, final = locked (approved by Pedro) |
| notes | TEXT | NULL | Internal notes about the period |
| generated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | When the report was generated |
| approved_by | UUID | NULL, FK global.users(id) | Who approved (sets status to final). NULL if draft. |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_dre_period ON erp.income_statements (period_year, period_month);
CREATE INDEX idx_dre_status ON erp.income_statements (status);
```

### 3.11 erp.shipping_labels

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | UUID v7 |
| order_id | UUID | NOT NULL, FK checkout.orders(id) | Which order this label is for |
| provider | VARCHAR(50) | NOT NULL DEFAULT 'melhor_envio' | Shipping provider API |
| service_name | VARCHAR(100) | NOT NULL | Carrier and service (e.g., "Correios PAC", "Correios SEDEX", "Jadlog Package") |
| tracking_code | VARCHAR(50) | NULL | Tracking code (populated after label generation) |
| label_url | TEXT | NULL | URL to the label PDF |
| cost | NUMERIC(8,2) | NOT NULL | Shipping cost in BRL |
| estimated_delivery_days | INTEGER | NOT NULL | Business days for delivery |
| status | erp.shipping_label_status | NOT NULL DEFAULT 'pending' | pending -> generated -> shipped -> in_transit -> delivered / returned |
| shipped_at | TIMESTAMPTZ | NULL | When the package was handed to the carrier |
| delivered_at | TIMESTAMPTZ | NULL | When the package was delivered to the customer |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

**Indexes:**

```sql
CREATE INDEX idx_labels_order ON erp.shipping_labels (order_id);
CREATE INDEX idx_labels_tracking ON erp.shipping_labels (tracking_code) WHERE tracking_code IS NOT NULL;
CREATE INDEX idx_labels_status ON erp.shipping_labels (status);
```

---

## 4. Screens & Wireframes

### 4.1 Order Pipeline (Kanban) — Desktop

```
+-----------------------------------------------------------------------------+
|  ERP > Pedidos                                          [Filtros] [Q Buscar] |
+-----------------------------------------------------------------------------+
|                                                                               |
|  +-- Pendente (3) ---+  +--- Pago (5) ----+  +-- Separacao (2) --+          |
|  |                    |  |                  |  |                    |          |
|  | +--------------+   |  | +--------------+ |  | +--------------+  |          |
|  | | #4523        |   |  | | #4521        | |  | | #4519        |  |          |
|  | | Joao Silva   |   |  | | Maria Santos | |  | | Pedro Lima   |  |          |
|  | | 2 itens      |   |  | | 1 item       | |  | | 3 itens      |  |          |
|  | | R$ 289,90    |   |  | | R$ 189,90    | |  | | R$ 459,90    |  |          |
|  | | Pix          |   |  | | Cartao       | |  | | Pix          |  |          |
|  | | [Pendente]   |   |  | | [Pago]       | |  | | NF-e: OK     |  |          |
|  | +--------------+   |  | +--------------+ |  | | Etiq: Gerada |  |          |
|  |                    |  |                  |  | +--------------+  |          |
|  | +--------------+   |  | +--------------+ |  |                    |          |
|  | | #4522        |   |  | | #4520        | |  | +--------------+  |          |
|  | | Ana Costa    |   |  | | Lucas Reis   | |  | | #4518        |  |          |
|  | | 1 item       |   |  | | 2 itens      | |  | | Carol Dias   |  |          |
|  | | R$ 159,90    |   |  | | R$ 329,90    | |  | | 1 item       |  |          |
|  | | Boleto       |   |  | | Cartao       | |  | | R$ 199,90    |  |          |
|  | | [Pendente]   |   |  | | [Pago]       | |  | | NF-e: Pend.  |  |          |
|  | +--------------+   |  | +--------------+ |  | +--------------+  |          |
|  |                    |  |                  |  |                    |          |
|  | +--------------+   |  | +--------------+ |  +--------------------+          |
|  | | #4517        |   |  | | #4516        | |                                 |
|  | | Rita Souza   |   |  | | Marcos Alves | |  +--- Enviado (8) ---+          |
|  | | 1 item       |   |  | | 1 item       | |  |                    |          |
|  | | R$ 119,90    |   |  | | R$ 249,90    | |  | +--------------+  |          |
|  | | Pix          |   |  | | Pix          | |  | | #4510        |  |          |
|  | | [Pendente]   |   |  | | [Pago]       | |  | | Fabio Nunes  |  |          |
|  | +--------------+   |  | +--------------+ |  | | Rastreio:    |  |          |
|  |                    |  |                  |  | | BR1234567XX  |  |          |
|  +--------------------+  | +--------------+ |  | | [Enviado]    |  |          |
|                          | | #4515        | |  | +--------------+  |          |
|  +-- Entregue (42) --+  | | Julia Matos  | |  |       ...         |          |
|  |                    |  | | 4 itens      | |  +--------------------+          |
|  |  (colapsado -      |  | | R$ 589,90    | |                                 |
|  |   mostra total)    |  | | Cartao       | |                                 |
|  |                    |  | | [Pago]       | |                                 |
|  +--------------------+  | +--------------+ |                                 |
|                          |       ...         |                                 |
|                          +------------------+                                 |
|                                                                               |
|  Resumo: 60 pedidos | R$ 12.450,00 total | 5 aguardando acao                 |
+-----------------------------------------------------------------------------+
```

### 4.2 Order Detail — Desktop

```
+-----------------------------------------------------------------------------+
|  ERP > Pedidos > #4521                                [Cancelar] [Imprimir]  |
+-----------------------------------------------------------------------------+
|                                                                               |
|  +--- CLIENTE ----------------------+  +--- PAGAMENTO -------------------+   |
|  |                                   |  |                                 |   |
|  |  Maria Santos                     |  |  Metodo: Cartao de Credito      |   |
|  |  CPF: 987.654.321-09              |  |  Bandeira: Visa **** 4242       |   |
|  |  Email: maria@email.com           |  |  Parcelas: 3x R$ 63,30         |   |
|  |  Telefone: +55 11 98765-4321      |  |  Status: [Aprovado]             |   |
|  |  Endereco:                        |  |  Provider ID: MP-XXXX-YYYY      |   |
|  |    R. Oscar Freire 123, Apto 45   |  |                                 |   |
|  |    Pinheiros, SP - 05409-010      |  +----------------------------------+  |
|  |                                   |                                       |
|  +-----------------------------------+  +--- ENVIO ---------------------+   |
|                                         |                                 |   |
|  +--- ITENS -------------------------+ |  Transportadora: Correios PAC   |   |
|  |                                    | |  Custo: R$ 18,90               |   |
|  |  # | SKU           | Tam | Qtd | $ | |  Prazo estimado: 5 dias uteis  |   |
|  |  --+---------------+-----+-----+-- | |  Rastreio: BR9876543XX         |   |
|  |  1 | SKU-0412-P-PR | P   | 1   |189| |  Status: [Gerada]              |   |
|  |                                    | |  [Ver etiqueta PDF]            |   |
|  |  Subtotal:          R$ 189,90      | |                                 |   |
|  |  Frete:             R$  18,90      | +----------------------------------+  |
|  |  Desconto:         -R$   0,00      |                                       |
|  |  TOTAL:             R$ 208,80      | +--- NF-e -----------------------+   |
|  |                                    | |                                 |   |
|  +------------------------------------+ |  Tipo: Venda                    |   |
|                                         |  Numero: 001.234.567            |   |
|  +--- ACOES --------------------------+ |  Chave: 3526030112345600...     |   |
|  |                                     | |  Status: [Autorizada]          |   |
|  |  [Marcar Separando]  (azul, ativo)  | |  Emitida em: 12/03/2026 14:32 |   |
|  |  [Emitir NF-e]       (cinza, ja ok) | |  [Baixar XML] [Baixar PDF]     |   |
|  |  [Gerar Etiqueta]    (cinza, ja ok) | |                                 |   |
|  |  [Marcar Enviado]    (verde, ativo) | +----------------------------------+  |
|  |  [Marcar Entregue]   (cinza, bloq)  |                                       |
|  |                                     |                                       |
|  +-------------------------------------+                                       |
|                                                                               |
|  +--- TIMELINE -------------------------------------------------------+      |
|  |                                                                      |      |
|  |  17/03 14:35  [Etiqueta]   Etiqueta gerada - BR9876543XX            |      |
|  |  17/03 14:32  [NF-e]       NF-e #001.234.567 autorizada             |      |
|  |  17/03 14:30  [Status]     Status: Pago -> Separacao                |      |
|  |  17/03 14:28  [Pagamento]  Pagamento confirmado via Cartao          |      |
|  |  17/03 14:25  [Pedido]     Pedido criado via Checkout               |      |
|  |                                                                      |      |
|  +----------------------------------------------------------------------+      |
+-----------------------------------------------------------------------------+
```

### 4.3 Inventory Dashboard — Desktop

```
+-----------------------------------------------------------------------------+
|  ERP > Estoque                        [+ Entrada Manual] [Exportar] [Filtros]|
+-----------------------------------------------------------------------------+
|                                                                               |
|  +--- RESUMO ---------+  +--- ALERTAS --------+  +--- VELOCIDADE --------+  |
|  | Total SKUs: 142     |  | Estoque Baixo: 8   |  | Maior depletion:     |  |
|  | Total Pecas: 3.847  |  | Critico (< 7d): 3  |  | SKU-0412-P-PR: 4.2/d |  |
|  | Em producao: 500    |  | Em falta: 2        |  | SKU-0399-M-BR: 3.8/d |  |
|  +---------------------+  +--------------------+  +----------------------+  |
|                                                                               |
|  Buscar: [_______________]  Categoria: [Todas   v]  [x] Apenas baixo estoque |
|                                                                               |
|  +-------+------------------+-----+--------+------+-----+------+-----+-----+---------+
|  | SKU   | Produto          | Tam | Cor    | Disp | Res | Prod | Vel | Dias| Status  |
|  +-------+------------------+-----+--------+------+-----+------+-----+-----+---------+
|  | 0412  | Camiseta Preta   | P   | Preto  |   12 |   3 |   50 | 4.2 |   3 |[CRITICO]|
|  | 0412  | Camiseta Preta   | M   | Preto  |   28 |   5 |   50 | 3.1 |   9 |[CRITICO]|
|  | 0412  | Camiseta Preta   | G   | Preto  |   45 |   2 |   50 | 2.8 |  16 |[ALERTA] |
|  | 0399  | Moletom Drop 9   | M   | Branco |    8 |   1 |    0 | 3.8 |   2 |[CRITICO]|
|  | 0399  | Moletom Drop 9   | G   | Branco |   15 |   3 |    0 | 2.5 |   6 |[ALERTA] |
|  | 0388  | Calca Cargo      | M   | Verde  |   52 |   0 |    0 | 1.2 |  43 |[OK]     |
|  | 0388  | Calca Cargo      | G   | Verde  |   67 |   1 |    0 | 0.9 |  74 |[OK]     |
|  | 0401  | Camiseta Logo    | P   | Off-W  |   34 |   4 |  100 | 2.1 |  16 |[OK]     |
|  | ...   | ...              | ... | ...    |  ... | ... |  ... | ... | ... | ...     |
|  +-------+------------------+-----+--------+------+-----+------+-----+-----+---------+
|                                                                               |
|  Status: [CRITICO] = dias < 7  |  [ALERTA] = dias < 14  |  [OK] = dias >= 14|
|  Vel = unidades/dia (media 30 dias)  |  Dias = estoque disponivel / velocidade|
|                                                                               |
|  Mostrando 1-25 de 142 SKUs                           [< Anterior] [Proximo >]|
+-----------------------------------------------------------------------------+
```

### 4.4 Inventory Movement Log

```
+-----------------------------------------------------------------------------+
|  ERP > Estoque > SKU-0412-P-PR > Movimentacoes                              |
+-----------------------------------------------------------------------------+
|                                                                               |
|  Produto: Camiseta Preta Basic | Tamanho: P | Cor: Preto                    |
|  Estoque Atual: 12 disp | 3 reserv | 50 em prod | Vel: 4.2/dia             |
|                                                                               |
|  Periodo: [01/03/2026] a [17/03/2026]    Tipo: [Todos         v]            |
|                                                                               |
|  +----------+------------------+------+-------------------+--------+---------+
|  | Data     | Tipo             | Qtd  | Referencia        | Nota   | Usuario |
|  +----------+------------------+------+-------------------+--------+---------+
|  | 17/03 14 | Venda            |   -1 | Pedido #4521      |        | Sistema |
|  | 17/03 10 | Venda            |   -2 | Pedido #4519      |        | Sistema |
|  | 16/03 16 | Entrada Producao |  +50 | OP #0089          |        | Tavares |
|  | 16/03 09 | Venda            |   -1 | Pedido #4515      |        | Sistema |
|  | 15/03 14 | Devolucao        |   +1 | Troca #TR-0234    |        | Sistema |
|  | 15/03 11 | Venda            |   -3 | Pedido #4510      |        | Sistema |
|  | 14/03 09 | Perda            |   -2 |                   | QC rep | Tavares |
|  | 13/03 15 | Ajuste           |   +3 |                   | Recon  | Tavares |
|  | ...      | ...              |  ... | ...               | ...    | ...     |
|  +----------+------------------+------+-------------------+--------+---------+
|                                                                               |
|  Mostrando 1-25 de 87 movimentacoes             [< Anterior] [Proximo >]     |
+-----------------------------------------------------------------------------+
```

### 4.5 Product & SKU Management

```
+-----------------------------------------------------------------------------+
|  ERP > Produtos                                            [+ Novo Produto]  |
+-----------------------------------------------------------------------------+
|                                                                               |
|  Buscar: [_______________]    Categoria: [Todas   v]   Status: [Ativos   v]  |
|                                                                               |
|  +--------+------------------+----------+------+--------+--------+---------+ |
|  | Imagem | Nome             | Categoria| SKUs | Preco  | Estoque| Status  | |
|  +--------+------------------+----------+------+--------+--------+---------+ |
|  | [img]  | Camiseta Preta   | Camiseta |  6   | R$ 189 | 245    | Ativo   | |
|  | [img]  | Moletom Drop 9   | Moletom  |  4   | R$ 349 | 78     | Ativo   | |
|  | [img]  | Calca Cargo      | Calca    |  5   | R$ 279 | 312    | Ativo   | |
|  | [img]  | Camiseta Logo    | Camiseta |  6   | R$ 159 | 198    | Ativo   | |
|  | [img]  | Bone Drop 8      | Acessorio|  2   | R$  89 | 0      | Inativo | |
|  +--------+------------------+----------+------+--------+--------+---------+ |
|                                                                               |
+-----------------------------------------------------------------------------+

PRODUCT EDITOR (dialog/sheet):
+-----------------------------------------------------------------------------+
|  Editar Produto: Camiseta Preta Basic                                  [X]   |
+-----------------------------------------------------------------------------+
|                                                                               |
|  Nome: [Camiseta Preta Basic___________________________]                     |
|  Slug: [camiseta-preta-basic___________________________] (auto-generated)    |
|  Categoria: [Camiseta     v]                                                 |
|  Descricao: [_________________________________________________]             |
|  Imagens: [img1] [img2] [+ Adicionar]                                        |
|  Ativo: [x]                                                                  |
|                                                                               |
|  VARIANTES (SKUs)                                           [+ Nova Variante]|
|  +----------+------+--------+--------+--------+------+--------+-----------+  |
|  | Codigo   | Tam  | Cor    | Preco  | Custo  | Peso | Barcode| Ativo     |  |
|  +----------+------+--------+--------+--------+------+--------+-----------+  |
|  | 0412-PP  | PP   | Preto  | 189,90 |  42,00 | 180g | (auto) | [x]       |  |
|  | 0412-P   | P    | Preto  | 189,90 |  42,00 | 190g | (auto) | [x]       |  |
|  | 0412-M   | M    | Preto  | 189,90 |  42,00 | 200g | (auto) | [x]       |  |
|  | 0412-G   | G    | Preto  | 189,90 |  42,00 | 220g | (auto) | [x]       |  |
|  | 0412-GG  | GG   | Preto  | 199,90 |  45,00 | 240g | (auto) | [x]       |  |
|  | 0412-XGG | XGG  | Preto  | 199,90 |  45,00 | 260g | (auto) | [ ]       |  |
|  +----------+------+--------+--------+--------+------+--------+-----------+  |
|                                                                               |
|  [Cancelar]                                                       [Salvar]   |
+-----------------------------------------------------------------------------+
```

### 4.6 NF-e Management

```
+-----------------------------------------------------------------------------+
|  ERP > Notas Fiscais                                     [Filtros] [Exportar]|
+-----------------------------------------------------------------------------+
|                                                                               |
|  +--- RESUMO -------+  +--- PENDENTES ----+  +--- ERROS ---------+          |
|  | Total mes: 342    |  | Aguardando: 3    |  | Rejeitadas: 1     |          |
|  | Autorizadas: 338  |  | Processando: 1   |  | Negadas: 0        |          |
|  +-------------------+  +------------------+  +-------------------+          |
|                                                                               |
|  Periodo: [01/03/2026] a [17/03/2026]   Status: [Todos        v]            |
|  Tipo: [Todos   v]                                                           |
|                                                                               |
|  +--------+---------+---------+----------+---------------+--------+--------+ |
|  | Pedido | Numero  | Tipo    | Emissao  | Chave (12...) | Status | Acoes  | |
|  +--------+---------+---------+----------+---------------+--------+--------+ |
|  | #4521  | 1234567 | Venda   | 17/03 14 | 3526...8901   |[AUTORIZ]| [PDF] | |
|  | #4519  | 1234566 | Venda   | 17/03 10 | 3526...7890   |[AUTORIZ]| [PDF] | |
|  | #4515  | 1234565 | Venda   | 16/03 09 | 3526...6789   |[AUTORIZ]| [PDF] | |
|  | #TR234 |    --   | Devol   | 15/03 14 |      --       |[PENDENT]|[Retry]| |
|  | #4510  | 1234563 | Venda   | 15/03 11 | 3526...4567   |[AUTORIZ]| [PDF] | |
|  | #4505  |    --   | Venda   | 14/03 16 |      --       |[REJEITA]|[Retry]| |
|  | ...    | ...     | ...     | ...      | ...           | ...    | ...    | |
|  +--------+---------+---------+----------+---------------+--------+--------+ |
|                                                                               |
|  [AUTORIZ] = verde  |  [PENDENT] = amarelo  |  [REJEITA] = vermelho         |
|  [PROCESS] = azul   |  [CANCELAD] = cinza   |  [NEGADA] = vermelho escuro   |
|                                                                               |
|  Mostrando 1-25 de 342 NF-e                         [< Anterior] [Proximo >]|
+-----------------------------------------------------------------------------+
```

### 4.7 Margin Calculator

```
+-----------------------------------------------------------------------------+
|  ERP > Margem                                                                |
+-----------------------------------------------------------------------------+
|                                                                               |
|  Selecionar SKU: [SKU-0412-P-PR  Camiseta Preta P Preto            v]       |
|                                                                               |
|  +--- DECOMPOSICAO DE CUSTO ------------------+  +--- SIMULADOR ----------+ |
|  |                                              |  |                        | |
|  |  Custo de Producao        R$   42,00  (22%) |  |  Preco simulado:       | |
|  |  Frete Medio              R$   18,90  (10%) |  |  [____________] R$     | |
|  |  Taxa Gateway (4.99%)     R$    9,48   (5%) |  |                        | |
|  |  Impostos (4.00%)         R$    7,60   (4%) |  |  Se preco = R$ 219,90: | |
|  |  ────────────────────────────────────────── |  |  Custo total: R$ 87,46 | |
|  |  CUSTO TOTAL              R$   77,98  (41%) |  |  Margem: R$ 132,44     | |
|  |  ────────────────────────────────────────── |  |  Margem: 60.2%         | |
|  |                                              |  |                        | |
|  |  PRECO DE VENDA           R$  189,90        |  |  [Aplicar preco]       | |
|  |  ────────────────────────────────────────── |  +------------------------+ |
|  |  MARGEM                   R$  111,92  (59%) |                             |
|  |  ────────────────────────────────────────── |                             |
|  |                                              |                             |
|  |  [##### MARGEM 59% ################      ]  |                             |
|  |                                              |                             |
|  +----------------------------------------------+                             |
|                                                                               |
|  +--- RANKING POR MARGEM (todos os SKUs) --------------------------------+  |
|  |                                                                         |  |
|  |  +-------+------------------+--------+--------+----------+----------+  |  |
|  |  | SKU   | Produto          | Preco  | Custo  | Margem R$| Margem % |  |  |
|  |  +-------+------------------+--------+--------+----------+----------+  |  |
|  |  | 0388G | Calca Cargo G    | 279,90 |  65,30 |   214,60 |   76.7%  |  |  |
|  |  | 0388M | Calca Cargo M    | 279,90 |  65,30 |   214,60 |   76.7%  |  |  |
|  |  | 0401P | Camiseta Logo P  | 159,90 |  38,20 |   121,70 |   76.1%  |  |  |
|  |  | 0412P | Camiseta Preta P | 189,90 |  77,98 |   111,92 |   58.9%  |  |  |
|  |  | 0399M | Moletom Drop 9 M | 349,90 | 165,20 |   184,70 |   52.8%  |  |  |
|  |  | ...   | ...              | ...    | ...    |    ...   |   ...    |  |  |
|  |  +-------+------------------+--------+--------+----------+----------+  |  |
|  |                                                                         |  |
|  |  Cor: verde (> 50%) | amarelo (30-50%) | vermelho (< 30%)              |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
|  Taxas configuradas: Gateway = 4.99% | Impostos = 4.00%     [Configurar]    |
+-----------------------------------------------------------------------------+
```

### 4.8 DRE / Income Statement

```
+-----------------------------------------------------------------------------+
|  ERP > DRE (Demonstrativo de Resultado)                                      |
+-----------------------------------------------------------------------------+
|                                                                               |
|  Periodo: Mes [Marco    v]  Ano [2026  v]          [Gerar Relatorio]         |
|                                                                               |
|  +--- DRE - MARCO 2026 --------+------ FEVEREIRO 2026 -----+--- VAR % ---+ |
|  |                               |                           |              | |
|  |  RECEITA BRUTA                |                           |              | |
|  |    Vendas          45.230,00  |            38.450,00      |  +17.6%      | |
|  |                               |                           |              | |
|  |  (-) DEDUCOES                 |                           |              | |
|  |    Descontos       -2.340,00  |            -1.890,00      |  +23.8%      | |
|  |    Devolucoes      -1.560,00  |            -1.230,00      |  +26.8%      | |
|  |                               |                           |              | |
|  |  = RECEITA LIQUIDA 41.330,00  |            35.330,00      |  +17.0%      | |
|  |  ─────────────────────────── |  ─────────────────────── |              | |
|  |                               |                           |              | |
|  |  (-) CMV           18.245,00  |            15.890,00      |  +14.8%      | |
|  |                               |                           |              | |
|  |  = MARGEM BRUTA    23.085,00  |            19.440,00      |  +18.8%      | |
|  |  ─────────────────────────── |  ─────────────────────── |              | |
|  |                               |                           |              | |
|  |  (-) DESPESAS OPERACIONAIS    |                           |              | |
|  |    Marketing        3.500,00  |             3.200,00      |  +9.4%       | |
|  |    Frete            4.120,00  |             3.560,00      |  +15.7%      | |
|  |    Taxas plataforma 2.261,47  |             1.920,79      |  +17.7%      | |
|  |    Pessoal          5.000,00  |             5.000,00      |   0.0%       | |
|  |    Outros             450,00  |               380,00      |  +18.4%      | |
|  |    Total despesas  15.331,47  |            14.060,79      |  +9.0%       | |
|  |                               |                           |              | |
|  |  ═══════════════════════════ |  ═══════════════════════ |              | |
|  |  = LUCRO LIQUIDO    7.753,53  |             5.379,21      |  +44.1%      | |
|  |  ═══════════════════════════ |  ═══════════════════════ |              | |
|  |                               |                           |              | |
|  |  Margem Liquida:      18.8%   |                15.2%      |  +3.6pp      | |
|  |                               |                           |              | |
|  +-------------------------------+---------------------------+--------------+ |
|                                                                               |
|  Status: [RASCUNHO]                                                          |
|  Notas: [_______________________________________________________________]   |
|                                                                               |
|  [Exportar PDF]  [Exportar CSV]                          [Aprovar (Pedro)]   |
+-----------------------------------------------------------------------------+
```

### 4.8.1 Cost Composition Chart (Pandora96)

Stacked bar or donut chart within the DRE section showing percentage breakdown of operational costs by category. Monthly comparison with previous month.

```
+-----------------------------------------------------------------------------+
|  ERP > DRE > Composicao de Custos                                           |
+-----------------------------------------------------------------------------+
|                                                                               |
|  Periodo: [Marco 2026 v]  Comparar com: [Fevereiro 2026 v]                  |
|                                                                               |
|  +--- COMPOSICAO DE CUSTOS (MARCO 2026) ---+--- (FEV 2026) ---+--- VAR ---+ |
|  |                                           |                   |           | |
|  |  [====================] 100%              |                   |           | |
|  |  [========]            41.8% Produto      |  42.3% Produto   |  -0.5pp   | |
|  |  [======]              22.8% Marketing    |  22.7% Marketing |  +0.1pp   | |
|  |  [======]              14.7% Frete        |  15.1% Frete     |  -0.4pp   | |
|  |  [====]                 6.6% Infraestr.   |   6.5% Infraestr.|  +0.1pp   | |
|  |  [=====]               14.1% Pessoal      |  13.4% Pessoal   |  +0.7pp   | |
|  |                                           |                   |           | |
|  +-------------------------------------------+-------------------+-----------+ |
|                                                                               |
|  Legenda:                                                                    |
|  ■ Produto (CMV)  ■ Marketing  ■ Frete  ■ Infraestrutura  ■ Pessoal        |
|                                                                               |
|  Total Custos Marco: R$ 33.576,47    |  Total Fev: R$ 29.950,79             |
|  Variacao: +12.1%                                                            |
|                                                                               |
+-----------------------------------------------------------------------------+
```

**PT-BR labels:**
- Chart title: "Composicao de Custos"
- Categories: "Produto" (COGS), "Marketing", "Pessoal", "Infraestrutura", "Frete"
- Comparison column header: "Variacao"
- Implemented with Recharts `PieChart` or `BarChart` component (see DS.md for chart tokens)

### 4.9 Financial Reconciliation

```
+-----------------------------------------------------------------------------+
|  ERP > Conciliacao Financeira                                                |
+-----------------------------------------------------------------------------+
|                                                                               |
|  Periodo: [01/03/2026] a [17/03/2026]     Provedor: [Mercado Pago     v]    |
|                                                                               |
|  +--- RESUMO ----------------------------------------------------------------+
|  |  Vendas MP: R$ 45.230,00  |  Vendas ERP: R$ 45.230,00  |  Diff: R$ 0,00  |
|  |  Taxas MP:  R$ -2.261,47  |  Taxas ERP:  R$ -2.261,47  |  Diff: R$ 0,00  |
|  |  Estornos:  R$ -1.560,00  |  Estornos:   R$ -1.560,00  |  Diff: R$ 0,00  |
|  |  Chargebk:  R$      0,00  |  Chargebk:   R$      0,00  |  Diff: R$ 0,00  |
|  |  Liquido:   R$ 41.408,53  |  Liquido:    R$ 41.408,53  |  Diff: R$ 0,00  |
|  +----------------------------------------------------------------------------+
|                                                                               |
|  TRANSACOES COM DIVERGENCIA (0)                                              |
|  +--------+----------+----------+----------+----------+--------+             |
|  | Pedido | Tipo     | Valor MP | Valor ERP| Diff     | Status |             |
|  +--------+----------+----------+----------+----------+--------+             |
|  | (nenhuma divergencia neste periodo)                          |             |
|  +--------------------------------------------------------------+             |
|                                                                               |
|  TODAS AS TRANSACOES                                                         |
|  +--------+----------+----------+----------+---------+---------+--------+    |
|  | Pedido | Data     | Tipo     | Metodo   | Valor   | Status  | MP ID  |    |
|  +--------+----------+----------+----------+---------+---------+--------+    |
|  | #4521  | 17/03 14 | Venda    | Cartao   | 208,80  | Liquid. | MP-XX1 |    |
|  | #4519  | 17/03 10 | Venda    | Pix      | 459,90  | Liquid. | MP-XX2 |    |
|  | #4515  | 16/03 09 | Venda    | Cartao   | 189,90  | Pendent | MP-XX3 |    |
|  | #TR234 | 15/03 14 | Estorno  | Cartao   | -189,90 | Liquid. | MP-XX4 |    |
|  | ...    | ...      | ...      | ...      | ...     | ...     | ...    |    |
|  +--------+----------+----------+----------+---------+---------+--------+    |
|                                                                               |
|  [Exportar CSV]                                                              |
+-----------------------------------------------------------------------------+
```

### 4.10 MOBILE: Order List (Ana Clara)

```
+-----------------------------+
| ERP  Pedidos      [Q] [=]  |
+-----------------------------+
|                              |
| [Pago (5)] [Separ.] [Env.] |  <-- horizontal scroll tabs
|                              |
| +-------------------------+ |
| |  #4521                  | |
| |  Maria Santos           | |
| |  2 itens  R$ 208,80     | |
| |  Cartao  [PAGO]         | |
| |  17/03 14:28             | |
| +-------------------------+ |
|          swipe -> [Separar] |
|                              |
| +-------------------------+ |
| |  #4520                  | |
| |  Lucas Reis             | |
| |  1 item   R$ 329,90     | |
| |  Pix     [PAGO]         | |
| |  17/03 10:15             | |
| +-------------------------+ |
|          swipe -> [Separar] |
|                              |
| +-------------------------+ |
| |  #4516                  | |
| |  Marcos Alves           | |
| |  1 item   R$ 249,90     | |
| |  Pix     [PAGO]         | |
| |  16/03 16:45             | |
| +-------------------------+ |
|          swipe -> [Separar] |
|                              |
| +-------------------------+ |
| |  #4515                  | |
| |  Julia Matos            | |
| |  4 itens  R$ 589,90     | |
| |  Cartao  [PAGO]         | |
| |  16/03 09:30             | |
| +-------------------------+ |
|                              |
| 5 pedidos aguardando        |
+-----------------------------+
  Cards: 16px font, 44px min
  touch targets, dark bg,
  status badge colored.
  Swipe right = primary action.
```

### 4.11 MOBILE: Order Actions (Ana Clara)

```
+-----------------------------+
| < Pedido #4521              |
+-----------------------------+
|                              |
| Maria Santos                 |
| R$ 208,80  Cartao  [PAGO]  |
|                              |
| Itens:                       |
| 1x Camiseta Preta P         |
| SKU-0412-P-PR                |
|                              |
| Endereco:                    |
| R. Oscar Freire 123         |
| Pinheiros, SP 05409-010     |
|                              |
+-----------------------------+
|                              |
| ACOES:                       |
|                              |
| [=========================] |
| [    MARCAR SEPARANDO     ] |  <-- 56px tall, blue
| [=========================] |
|                              |
| [=========================] |
| [      EMITIR NF-e        ] |  <-- 56px tall, disabled
| [=========================] |
|                              |
| [=========================] |
| [    GERAR ETIQUETA       ] |  <-- 56px tall, disabled
| [=========================] |
|                              |
| [=========================] |
| [    MARCAR ENVIADO       ] |  <-- 56px tall, disabled
| [=========================] |
|                              |
+-----------------------------+

  After tapping "MARCAR SEPARANDO":
  - Button turns green with checkmark
  - "EMITIR NF-e" becomes active (blue)
  - NF-e auto-queued in background
  - If NF-e succeeds: button auto-checks
  - If NF-e fails: button turns red
    with [TENTAR NOVAMENTE] label

  Sequential flow: each button
  enables after the previous
  step completes successfully.
  All buttons >= 44px touch target.
```

### 4.12 MOBILE: Stock Entry (Ana Clara)

```
+-----------------------------+
| < Entrada de Estoque        |
+-----------------------------+
|                              |
| Selecionar SKU:              |
|                              |
| +-------------------------+ |
| | [Q Buscar SKU...]       | |  <-- 48px input
| +-------------------------+ |
|                              |
| +-------------------------+ |
| | SKU-0412-P-PR           | |
| | Camiseta Preta Basic P  | |
| | Estoque atual: 12       | |
| +-------------------------+ |  <-- tappable, 56px row
|                              |
| +-------------------------+ |
| | SKU-0412-M-PR           | |
| | Camiseta Preta Basic M  | |
| | Estoque atual: 28       | |
| +-------------------------+ |
|                              |
| +-------------------------+ |
| | SKU-0412-G-PR           | |
| | Camiseta Preta Basic G  | |
| | Estoque atual: 45       | |
| +-------------------------+ |
|                              |
| --- After selecting SKU: --- |
|                              |
| SKU Selecionado:             |
| SKU-0412-P-PR                |
| Camiseta Preta Basic P       |
| Estoque atual: 12            |
|                              |
| Quantidade a entrar:         |
| +-------------------------+ |
| |        [ 50 ]           | |  <-- 56px, numeric keyboard
| +-------------------------+ |
|                              |
| Referencia (opcional):       |
| +-------------------------+ |
| | OP #0089               | |  <-- 48px input
| +-------------------------+ |
|                              |
| +-------------------------+ |
| |      CONFIRMAR          | |  <-- 56px, green
| |    ENTRADA: +50         | |
| +-------------------------+ |
|                              |
+-----------------------------+

  All touch targets >= 44px.
  Numeric keyboard auto-opens
  for quantity field.
  Confirmation shows delta
  clearly (+50).
  Success: toast "Entrada
  registrada: +50 unidades"
```

---

## 5. API Endpoints

All endpoints follow the patterns defined in [API.md](../../architecture/API.md). Module prefix: `/api/v1/erp`.

### 5.1 Products

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/products` | Internal | List products (paginated) | `?cursor=&limit=25&search=&category=&isActive=&sort=-createdAt` | `{ data: Product[], meta: Pagination }` |
| GET | `/products/:id` | Internal | Get product detail with SKUs | `?include=skus,inventory` | `{ data: Product }` |
| POST | `/products` | Internal | Create product | `{ name, slug?, description?, category, images?, is_active? }` | `201 { data: Product }` |
| PATCH | `/products/:id` | Internal | Update product | `{ name?, slug?, description?, category?, images?, is_active? }` | `{ data: Product }` |
| DELETE | `/products/:id` | Internal | Soft-delete product | -- | `204` |

### 5.2 SKUs

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/products/:productId/skus` | Internal | List SKUs for a product | `?isActive=` | `{ data: Sku[] }` |
| GET | `/skus/:id` | Internal | Get single SKU detail | `?include=inventory,margin` | `{ data: Sku }` |
| POST | `/products/:productId/skus` | Internal | Create SKU for a product | `{ sku_code, size, color, price, compare_at_price?, cost_price, weight_grams, dimensions?, barcode?, is_active? }` | `201 { data: Sku }` |
| PATCH | `/skus/:id` | Internal | Update SKU | `{ price?, compare_at_price?, cost_price?, weight_grams?, dimensions?, barcode?, is_active? }` | `{ data: Sku }` |
| DELETE | `/skus/:id` | Internal | Deactivate SKU (soft) | -- | `204` |

### 5.3 Inventory

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/inventory` | Internal | List all inventory records | `?sort=-depletionVelocity&lowStockOnly=true&search=&category=&cursor=&limit=25` | `{ data: InventoryRow[], meta: Pagination }` |
| GET | `/inventory/:skuId` | Internal | Get inventory for a specific SKU | -- | `{ data: Inventory }` |
| PATCH | `/inventory/:skuId` | Internal | Update inventory settings | `{ reorder_point? }` | `{ data: Inventory }` |
| GET | `/inventory/:skuId/movements` | Internal | List movements for a SKU | `?type=&dateFrom=&dateTo=&cursor=&limit=25` | `{ data: Movement[], meta: Pagination }` |
| POST | `/inventory/:skuId/movements` | Internal | Record manual movement | `{ movement_type, quantity, reference_type?, reference_id?, notes? }` | `201 { data: Movement }` |

### 5.4 Orders (ERP Operations)

Orders are created by the Checkout module. ERP manages fulfillment state transitions.

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/orders` | Internal | List orders (paginated, filterable) | `?status=&cursor=&limit=25&search=&dateFrom=&dateTo=&sort=-createdAt` | `{ data: Order[], meta: Pagination }` |
| GET | `/orders/:id` | Internal | Get order detail (items, payment, shipping, NF-e, timeline) | `?include=items,nfe,shipping,transactions,timeline` | `{ data: Order }` |
| GET | `/orders/pipeline` | Internal | Get order counts by status (for Kanban) | -- | `{ data: { pending: N, paid: N, separating: N, shipped: N, delivered: N } }` |
| POST | `/orders/:id/actions/mark-separating` | Internal | Transition order to separating | -- | `{ data: Order }` |
| POST | `/orders/:id/actions/generate-nfe` | Internal | Emit NF-e for order | -- | `{ data: NfeDocument }` |
| POST | `/orders/:id/actions/generate-label` | Internal | Generate shipping label | `{ service_name? }` | `{ data: ShippingLabel }` |
| POST | `/orders/:id/actions/mark-shipped` | Internal | Mark order as shipped | -- | `{ data: Order }` |
| POST | `/orders/:id/actions/mark-delivered` | Internal | Mark order as delivered | -- | `{ data: Order }` |
| POST | `/orders/:id/actions/cancel` | Internal | Cancel order | `{ reason? }` | `{ data: Order }` |

### 5.5 NF-e Documents

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/nfe-documents` | Internal | List all NF-e documents | `?status=&type=&dateFrom=&dateTo=&cursor=&limit=25` | `{ data: NfeDocument[], meta: Pagination }` |
| GET | `/nfe-documents/:id` | Internal | Get NF-e detail | -- | `{ data: NfeDocument }` |
| POST | `/nfe-documents/:id/actions/emit` | Internal | (Re-)emit an NF-e | -- | `{ data: NfeDocument }` |
| POST | `/nfe-documents/:id/actions/cancel` | Internal | Cancel an authorized NF-e (within 24h) | `{ reason }` | `{ data: NfeDocument }` |
| POST | `/nfe-documents/:id/actions/retry` | Internal | Retry a failed NF-e emission | -- | `{ data: NfeDocument }` |

### 5.6 Shipping Labels

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/shipping-labels` | Internal | List shipping labels | `?status=&cursor=&limit=25` | `{ data: ShippingLabel[], meta: Pagination }` |
| GET | `/shipping-labels/:id` | Internal | Get shipping label detail | -- | `{ data: ShippingLabel }` |
| POST | `/shipping-labels/:id/actions/track` | Internal | Force tracking status refresh | -- | `{ data: ShippingLabel }` |

### 5.7 Financial Transactions

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/financial-transactions` | Internal | List transactions | `?type=&status=&paymentMethod=&dateFrom=&dateTo=&cursor=&limit=25` | `{ data: Transaction[], meta: Pagination }` |
| GET | `/financial-transactions/:id` | Internal | Get transaction detail | -- | `{ data: Transaction }` |
| GET | `/financial-transactions/reconciliation` | Internal | Get reconciliation summary | `?dateFrom=&dateTo=&provider=mercado_pago` | `{ data: ReconciliationSummary }` |

### 5.8 Margin Calculator

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/margin-calculations` | Internal | List latest margin calculations per SKU | `?sort=-marginPercent&cursor=&limit=25` | `{ data: MarginCalculation[], meta: Pagination }` |
| GET | `/margin-calculations/:skuId` | Internal | Get latest margin for a SKU | -- | `{ data: MarginCalculation }` |
| POST | `/margin-calculations/:skuId/actions/calculate` | Internal | Calculate margin for a SKU | `{ production_cost?, avg_shipping_cost?, gateway_fee_rate?, tax_rate? }` | `{ data: MarginCalculation }` |
| POST | `/margin-calculations/:skuId/actions/simulate` | Internal | Simulate margin at a given price | `{ simulated_price }` | `{ data: MarginCalculation }` |
| GET | `/margin-calculations/config` | Internal | Get default gateway and tax rates | -- | `{ data: { gateway_fee_rate, tax_rate } }` |
| PUT | `/margin-calculations/config` | Internal | Update default rates | `{ gateway_fee_rate?, tax_rate? }` | `{ data: { gateway_fee_rate, tax_rate } }` |

### 5.9 DRE / Income Statement

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/income-statements` | Internal | List all DRE reports | `?year=&status=&sort=-periodYear,-periodMonth` | `{ data: IncomeStatement[] }` |
| GET | `/income-statements/:id` | Internal | Get DRE detail | -- | `{ data: IncomeStatement }` |
| POST | `/income-statements/actions/generate` | Internal | Generate DRE for a period | `{ period_month, period_year }` | `201 { data: IncomeStatement }` |
| PATCH | `/income-statements/:id` | Internal | Update DRE (operational expenses, notes) | `{ operational_expenses?, notes? }` | `{ data: IncomeStatement }` |
| POST | `/income-statements/:id/actions/approve` | Internal | Approve and lock DRE | -- | `{ data: IncomeStatement }` |

### 5.10 Internal Event Receivers

These are internal endpoints called by other modules (not exposed to external clients):

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/internal/orders/create-from-checkout` | Service-to-service | Called by Checkout on order.paid. Creates order in ERP pipeline. |
| POST | `/internal/inventory/production-entry` | Service-to-service | Called by PCP when production_order completes stock_entry stage. |
| POST | `/internal/inventory/return-entry` | Service-to-service | Called by Trocas when exchange return is received and inspected. |
| POST | `/internal/nfe/emit-return` | Service-to-service | Called by Trocas to request return NF-e for a completed exchange. |

### 5.11 Webhook Receivers

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/webhooks/mercado-pago` | Signature verification | Mercado Pago payment/refund/chargeback webhook |
| POST | `/api/v1/webhooks/melhor-envio` | Signature verification | Melhor Envio tracking status updates |
| POST | `/api/v1/webhooks/focus-nfe` | Signature verification | Focus NFe NF-e status callbacks (authorized, rejected, denied) |

---

## 6. Business Rules

### 6.1 Order FSM (Finite State Machine)

| # | Rule | Detail |
|---|------|--------|
| R1 | **Valid state transitions** | `pending` -> `paid` -> `separating` -> `shipped` -> `delivered`. Also: any state -> `cancelled` (except `delivered`). Also: `shipped` -> `returned` (via Trocas). No skipping states. No backward transitions except cancel. |
| R2 | **pending -> paid** | Triggered automatically by Mercado Pago webhook (`payment.approved`). System creates `financial_transactions` row (type=sale). System decrements `inventory.quantity_available` and increments `inventory.quantity_reserved` for each line item. Emits `order.paid` Flare event. |
| R3 | **paid -> separating** | Triggered by Ana Clara tapping "Marcar Separando". Requires: payment confirmed (status = paid). On transition: queue NF-e emission job (auto-emit). Emits `order.separating` Flare event. |
| R4 | **separating -> shipped** | Triggered by Ana Clara tapping "Marcar Enviado". Requires: NF-e authorized AND shipping label generated. On transition: decrement `inventory.quantity_reserved`, create `inventory_movements` row (type=sale, negative quantity). Update `shipping_labels.shipped_at`. Emits `order.shipped` Flare event (triggers customer WhatsApp notification with tracking code). |
| R5 | **shipped -> delivered** | Triggered by Melhor Envio tracking webhook OR manual mark by operations. On transition: update `shipping_labels.delivered_at`. Emits `order.delivered` Flare event (triggers customer WhatsApp confirmation + CRM post-purchase review automation). |
| R6 | **Cancel from any pre-delivered state** | Requires: status in (pending, paid, separating, shipped). On cancel from `paid` or later: reverse inventory reservation (increment `quantity_available`, decrement `quantity_reserved`), create `inventory_movements` row (type=return, positive quantity). If NF-e was authorized: queue NF-e cancellation (within 24h) or flag for manual handling. If payment was made: queue refund via Mercado Pago API, create `financial_transactions` row (type=refund, negative amount). |
| R7 | **Delivered orders are immutable** | Once `delivered`, the order cannot be cancelled. Returns and exchanges go through the Trocas module, which creates a separate exchange_request referencing this order. |

### 6.2 Inventory Rules

| # | Rule | Detail |
|---|------|--------|
| R8 | **Depletion velocity calculation** | `depletion_velocity` = total units exited (sale + loss movements) in the last 30 days / 30. Recalculated daily at 04:00 BRT by the `erp:inventory-depletion` background job. Rounded to 2 decimal places. |
| R9 | **Days until zero** | Computed value (not stored): `days_until_zero = quantity_available / depletion_velocity`. If velocity is 0, days_until_zero = infinity (displayed as "--"). |
| R10 | **Reorder point alert** | When `quantity_available <= reorder_point` AND `quantity_available > 0`: emit Flare event `stock.low` (priority: high). Notification sent to operations via in-app and Discord #alertas. Alert fires once per SKU until restocked above reorder_point. |
| R11 | **Critical stock alert** | When `days_until_zero < 7` (and depletion_velocity > 0): emit Flare event `stock.critical` (priority: critical). Discord notification includes @operations mention. |
| R12 | **Zero stock alert** | When `quantity_available = 0` AND `quantity_in_production = 0`: emit Flare event `stock.critical` with `is_zero_stock = true` flag. SKU card in inventory dashboard shows red "SEM ESTOQUE" badge. |

### 6.3 NF-e (Fiscal) Rules

| # | Rule | Detail |
|---|------|--------|
| R13 | **Auto-emit on separating** | When an order transitions to `separating`, the system automatically queues an NF-e emission job. The job calls Focus NFe API with order data (customer CPF, items, values, taxes). If the API returns `authorized`, the NF-e row is updated with `nfe_number`, `nfe_key`, XML/PDF URLs, and `emitted_at`. |
| R14 | **Retry on failure** | If NF-e emission returns `rejected` or `denied`: increment `retry_count`, store `error_message`, emit `nfe.rejected` Flare event. Auto-retry up to 3 times with exponential backoff (1min, 5min, 15min). After 3 failures: stop retrying, alert Discord, require manual intervention via retry button. |
| R15 | **Return NF-e from Trocas** | When the Trocas module completes an exchange that requires a return NF-e, it calls `/internal/nfe/emit-return`. ERP creates an `nfe_documents` row with `type=return` referencing the original order. Return NF-e references the original NF-e key. |
| R16 | **NF-e immutability** | Once an NF-e is authorized, its data (number, key, XML) cannot be modified. Cancellation is only possible within 24 hours of authorization via SEFAZ cancellation protocol. After 24 hours, correction letters (CC-e) must be used (future enhancement). |

### 6.4 Margin Calculator Rules

| # | Rule | Detail |
|---|------|--------|
| R17 | **Margin formula** | `total_cost = production_cost + avg_shipping_cost + (price * gateway_fee_rate) + (price * tax_rate)`. `margin_amount = price - total_cost`. `margin_percent = (margin_amount / price) * 100`. |
| R18 | **Configurable rates** | `gateway_fee_rate` and `tax_rate` are stored as system-wide defaults (initially: gateway = 0.0499 for Mercado Pago, tax = 0.0400 for Simples Nacional). Can be overridden per calculation. Stored in `erp.margin_calculations` per-row for historical accuracy. |
| R19 | **Average shipping cost** | `avg_shipping_cost` is calculated from the last 30 shipping labels generated: `AVG(erp.shipping_labels.cost) WHERE created_at >= NOW() - INTERVAL '30 days'`. If fewer than 5 labels exist, use a manual default (configurable, initial: R$ 18.90). |
| R20 | **Price simulation** | When Pedro enters a `simulated_price`, the system recalculates: `simulated_total_cost = production_cost + avg_shipping_cost + (simulated_price * gateway_fee_rate) + (simulated_price * tax_rate)`, then `simulated_margin_percent = ((simulated_price - simulated_total_cost) / simulated_price) * 100`. Simulation is stored but does NOT update the actual SKU price until explicitly applied. |

### 6.5 DRE (Income Statement) Rules

| # | Rule | Detail |
|---|------|--------|
| R21 | **Gross revenue** | `gross_revenue = SUM(financial_transactions.amount) WHERE type = 'sale' AND status = 'settled' AND created_at WITHIN period`. Only settled (confirmed) sales count. |
| R22 | **Discounts** | `discounts = SUM(checkout.orders.discount_amount) WHERE paid_at WITHIN period`. Captures all coupon and promotional discounts applied at checkout. |
| R23 | **Returns** | `returns = ABS(SUM(financial_transactions.amount)) WHERE type = 'refund' AND created_at WITHIN period`. Always stored as positive in the DRE (subtracted from gross revenue). |
| R24 | **Net revenue** | `net_revenue = gross_revenue - discounts - returns`. |
| R25 | **COGS (Cost of Goods Sold)** | `cogs = SUM(erp.skus.cost_price * checkout.order_items.quantity) WHERE order.paid_at WITHIN period AND order.status NOT IN ('cancelled', 'returned')`. Uses cost_price at the time of sale (snapshot, not current). |
| R26 | **Gross margin** | `gross_margin = net_revenue - cogs`. |
| R27 | **Operational expenses** | Stored as JSONB with categories: `marketing` (ad spend), `shipping` (SUM of shipping_labels.cost for the period), `platform_fees` (SUM of financial_transactions where type = 'fee'), `personnel` (manual entry), `other` (manual entry). Marketing, personnel, and other are entered manually by Pedro. Shipping and platform_fees are auto-calculated. |
| R28 | **Net income** | `net_income = gross_margin - SUM(ALL operational_expenses values)`. |

### 6.6 Financial Rules

| # | Rule | Detail |
|---|------|--------|
| R29 | **Mercado Pago webhook -> transaction** | On `payment.approved`: create row (type=sale, status=pending). On `payment.money_released`: update status to settled, set settled_at. On `payment.refunded`: create new row (type=refund, negative amount). On `payment.chargeback`: create row (type=chargeback, negative amount), emit `chargeback.received` Flare event (critical priority). On `payment.fee`: create row (type=fee, negative amount). |
| R30 | **Chargeback handling** | On chargeback: (1) create financial_transaction (type=chargeback, negative amount). (2) Emit critical alert to Discord #alertas with order details. (3) Flag order in the UI with red "CHARGEBACK" badge. (4) Do NOT auto-reverse inventory — manual decision required. (5) Pedro and Marcus receive in-app notification. |

### 6.7 Product Tier Classification Rules (Pandora96)

| # | Rule | Detail |
|---|------|--------|
| R31 | **Composite score formula** | SKUs are classified into tiers based on a composite score: `composite_score = (normalized_depletion_velocity * 0.6) + (normalized_units_sold_90d * 0.4)`. Both values are min-max normalized across all active SKUs before weighting. |
| R32 | **Tier thresholds** | Gold (`gold`): top 20% by composite score. Silver (`silver`): next 30% (percentiles 50-80). Bronze (`bronze`): bottom 50%. `unranked`: SKUs with fewer than 30 days of sales data. Thresholds are recalculated dynamically based on the full active SKU population. |
| R33 | **Daily recalculation** | Tier recalculation runs daily via background job `sku_tier_recalculation` at 03:00 UTC. The job processes all active SKUs with `deleted_at IS NULL` and at least one `inventory_movement` record. |
| R34 | **Gold-tier restock alert** | Gold-tier SKUs trigger a restock alert when `days_to_zero < 7`. Emits Flare event `inventory.coverage_critical` (priority: critical). Discord #alertas notification includes @operations mention. In-app badge: "OURO CRITICO". |
| R35 | **Bronze discontinuation review** | Bronze-tier SKUs with 0 sales in the last 60 days are automatically flagged for review/discontinuation. Flag appears as "REVISAR" badge on inventory table. Operations receives weekly digest of flagged SKUs via Flare. |
| R36 | **Tier change audit log** | Every tier change is logged in `erp.inventory_movements` with `movement_type = 'tier_change'`. The `notes` field stores the transition (e.g., `"silver -> gold, score: 0.82"`). `reference_type = 'tier_recalculation'`. `user_id` is set to system user. |

### 6.8 Revenue Leak Calculation (Pandora96)

| # | Rule | Detail |
|---|------|--------|
| R37 | **Revenue leak formula** | Revenue leak per SKU per day = `daily_page_views * avg_conversion_rate * avg_order_value`. Calculated only for days where `quantity_available = 0` (out-of-stock). Accumulated across all out-of-stock days for cumulative leak. |
| R38 | **Page views source** | `daily_page_views` sourced from Shopify Analytics API (`/admin/api/2024-01/reports.json`) for the product page. When Ambaril internal analytics become available, prefer internal source. Fallback: 30-day average page views if API is unavailable for a specific day. |
| R39 | **Conversion rate calculation** | `avg_conversion_rate` = confirmed orders containing SKU in last 90 days / total product page views in last 90 days. Minimum sample: 10 orders. If fewer than 10 orders exist, use category-level average. Floor: 0.5%. Cap: 15%. |
| R40 | **Average order value** | `avg_order_value` = average total of confirmed orders containing the SKU in the last 90 days. Uses the SKU's own order data, not the global average. If fewer than 10 orders exist, fall back to category average. |
| R41 | **Daily aggregation** | Revenue leak is aggregated daily into `erp.revenue_leak_daily` table (or materialized view). Columns: `sku_id`, `date`, `page_views`, `conversion_rate`, `avg_order_value`, `estimated_leak`, `created_at`. Refresh runs as part of the `sku_tier_recalculation` job. |
| R42 | **Dashboard display** | Cumulative revenue leak is displayed on: (1) ERP Inventory Dashboard — "Perda de Receita" summary card with Top 10 SKUs by leak amount. (2) Dashboard module (Beacon) — weekly revenue leak trend chart. Both views link to detailed per-SKU breakdown. |

---

## 7. Integrations

### 7.1 Inbound (modules that feed data INTO ERP)

| Source Module | Event / Data | ERP Action |
|--------------|-------------|------------|
| **Checkout** | `order.paid` — full order with items, customer, payment | Create order in ERP pipeline (status=paid). Reserve inventory. Create financial transaction (type=sale). |
| **PCP** | `production_order.stock_entry` — SKU IDs + quantities | Create `inventory_movements` (type=production_entry). Increment `inventory.quantity_available`. Decrement `inventory.quantity_in_production`. Update `inventory.last_entry_at`. |
| **PCP** | `cost_analyses` — updated production costs | Update `erp.skus.cost_price`. Invalidate cached margin calculations. |
| **Trocas** | `exchange.received` — returned items inspected | Create `inventory_movements` (type=return). Increment `inventory.quantity_available`. |
| **Trocas** | `exchange.completed` — refund required | Create financial_transaction (type=refund). Request return NF-e if applicable. |

### 7.2 Outbound (ERP dispatches TO other modules)

| Target | Data / Action | Trigger |
|--------|--------------|---------|
| **CRM** | Order status updates -> contact timeline | On each order state transition, CRM receives event for contact timeline + LTV update |
| **CRM** | `order.delivered` -> post-purchase automation | Triggers CRM review request automation (7-day delay) |
| **Creators** | `financial_transactions` (sale with coupon) -> commission | If order used a creator coupon, Creators module reads transaction to calculate commission |
| **ClawdBot** (Discord) | Daily reports: orders processed, revenue, inventory alerts | Daily at 09:00 BRT, ClawdBot queries ERP analytics endpoints |
| **Dashboard** (Beacon) | Real-time metrics: orders, revenue, inventory health | Dashboard polls/SSE from ERP for operational and financial panels |

### 7.3 External Services

| Service | Purpose | Integration Pattern |
|---------|---------|-------------------|
| **Focus NFe** | NF-e emission, cancellation, status tracking | REST API. API key auth. Request: order data + items + customer CPF + tax info. Response: NF-e number, key, XML, PDF. Webhook callback for async status updates. Retry with exponential backoff. |
| **Melhor Envio** | Shipping label generation, carrier quotes, tracking | REST API. OAuth2 auth. Generate label -> get tracking code + PDF. Tracking webhook for status updates (shipped, in_transit, delivered, returned). |
| **Mercado Pago** | Payment processing, refunds, chargebacks | Webhook receiver (signature verification via `x-signature` header). Events: payment.approved, payment.money_released, payment.refunded, payment.chargeback. Outbound API calls for refund requests. |

### 7.4 Integration Diagram

```
                                    +----------------+
                                    |   Focus NFe    |
                                    | (NF-e API)     |
                                    +-------+--------+
                                            |
                 +----------------+         | REST + Webhook
                 |   Checkout     |         |
                 | (order.paid)   |    +----+-----+     +----------------+
                 +-------+--------+    |          |     |  Melhor Envio  |
                         |             |   ERP    |-----| (Shipping API) |
                         | event       |  Module  |     +----------------+
                         v             |          |
+----------+      +-----------+        |          |     +----------------+
|   PCP    |----->|           |------->|          |---->|  Mercado Pago  |
| (prod    |      | Inventory |        |          |     | (Payments)     |
|  entry)  |      |           |<-------|          |     +----------------+
+----------+      +-----------+        +----+-----+
                                            |
+----------+                                |
|  Trocas  |-----> (return entry) --------->|
| (returns)|                                |
+----------+                           +----+-----+
                                       |          |
                              +--------+  +-------+-------+  +----------+
                              |  CRM   |  |  Dashboard    |  | ClawdBot |
                              | (LTV)  |  |  (metrics)    |  | (reports)|
                              +--------+  +---------------+  +----------+
```

---

## 8. Background Jobs

All jobs run via PostgreSQL job queue (`FOR UPDATE SKIP LOCKED`) + Vercel Cron. No Redis/BullMQ.

| Job Name | Queue | Schedule | Priority | Description |
|----------|-------|----------|----------|-------------|
| `erp:inventory-depletion` | `erp` | Daily 04:00 BRT | Medium | Calculate depletion_velocity for all SKUs from 30-day rolling window of sale + loss movements. Update `erp.inventory.depletion_velocity`. |
| `erp:stock-alert-scan` | `erp` | Daily 04:30 BRT | Medium | Scan all SKUs: emit `stock.low` for those at reorder_point, emit `stock.critical` for days_until_zero < 7 or quantity = 0. |
| `erp:nfe-emit` | `erp` | On-demand (queued on order.separating) | High | Call Focus NFe API to emit NF-e. Handle success/failure. Retry with exponential backoff (1min, 5min, 15min). Max 3 retries. |
| `erp:nfe-status-check` | `erp` | Every 5 minutes | Medium | Poll Focus NFe for status of NF-e documents stuck in `processing` state for > 5 minutes. Update status accordingly. |
| `erp:shipping-tracking` | `erp` | Every 30 minutes | Low | Poll Melhor Envio for tracking updates on all labels with status `shipped` or `in_transit`. Update status and timestamps. |
| `erp:daily-report` | `erp` | Daily 08:30 BRT | Low | Compile daily ERP report: orders processed, revenue, pending orders, inventory alerts, NF-e failures. Data consumed by ClawdBot for Discord report at 09:00. |
| `erp:dre-auto-generate` | `erp` | Monthly 1st at 02:00 BRT | Medium | Auto-generate DRE for previous month with status=draft. Pedro reviews and approves. |
| `erp:mp-reconciliation` | `erp` | Daily 06:00 BRT | Medium | Fetch Mercado Pago settlement report via API. Compare with internal `financial_transactions`. Flag discrepancies. |
| `erp:sku-tier-recalculation` | `erp` | Daily 03:00 UTC | Medium | Recalculate tier classification (gold/silver/bronze) for all active SKUs with > 30 days sales data. Compute composite score from depletion velocity (0.6 weight) and units sold in 90 days (0.4 weight). Log tier changes in `erp.inventory_movements` (type=tier_change). Also refreshes `erp.revenue_leak_daily` aggregation. |
| `erp:monthly-cost-review` | `erp` | Monthly 1st at 03:00 BRT | Low | Generate cost category comparison report: Produto (CMV), Marketing, Pessoal, Infraestrutura, Frete vs previous month. Calculate delta % per category. Send summary to Pedro (`finance`) and Marcus (`admin`) via Flare notification (`cost_review.generated`). Data feeds the Cost Composition Chart in DRE. |

---

## 9. Permissions

From [AUTH.md](../../architecture/AUTH.md) section 3.4.4. Format: `{module}:{resource}:{action}`.

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b | creator |
|-----------|-------|-----|----------|-----------|---------|---------|-----------|-----|---------|
| `erp:orders:read` | Y | Y | -- | Y | Y | Y | -- | -- | -- |
| `erp:orders:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `erp:orders:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:orders:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:products:read` | Y | Y | -- | Y | -- | Y | -- | -- | -- |
| `erp:products:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `erp:products:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:products:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:skus:read` | Y | Y | -- | Y | -- | Y | -- | -- | -- |
| `erp:skus:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `erp:skus:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:skus:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:inventory:read` | Y | Y | -- | Y | -- | Y | -- | -- | -- |
| `erp:inventory:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `erp:inventory:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:nfe_documents:read` | Y | -- | -- | Y | -- | Y | -- | -- | -- |
| `erp:nfe_documents:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `erp:nfe_documents:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:financial_transactions:read` | Y | -- | -- | -- | -- | Y | -- | -- | -- |
| `erp:financial_transactions:write` | Y | -- | -- | -- | -- | Y | -- | -- | -- |
| `erp:financial_transactions:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:margin_calculations:read` | Y | Y | -- | -- | -- | Y | -- | -- | -- |
| `erp:margin_calculations:write` | Y | -- | -- | -- | -- | Y | -- | -- | -- |
| `erp:margin_calculations:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:income_statements:read` | Y | Y | -- | -- | -- | Y | -- | -- | -- |
| `erp:income_statements:write` | Y | -- | -- | -- | -- | Y | -- | -- | -- |
| `erp:income_statements:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:shipping_labels:read` | Y | -- | -- | Y | Y | -- | -- | -- | -- |
| `erp:shipping_labels:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `erp:shipping_labels:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

**Notes:**
- `admin` (Marcus) has full access to all ERP resources including delete and admin actions.
- `operations` (Tavares, Ana Clara) can read and write orders, products, SKUs, inventory, NF-e, and shipping labels. They cannot access financial views (transactions, margin, DRE).
- `finance` (Pedro) can read all operational data but can only **write** to financial-specific resources: financial_transactions, margin_calculations, income_statements. He cannot modify orders, products, or inventory.
- `pm` (Caio) has read access to operational data, margin, and DRE for strategic oversight. No write access.
- `support` (Slimgust) can read orders and shipping labels for customer support context. No write access.
- External roles (`b2b_retailer`, `creator`) have zero ERP access.

---

## 10. Notifications (Flare Events)

Events emitted by the ERP module to the Flare notification system. See [NOTIFICATIONS.md](../../platform/NOTIFICATIONS.md).

| Event Key | Trigger | Channels | Recipients | Priority |
|-----------|---------|----------|------------|----------|
| `order.separating` | Order transitions to separating | In-app | `operations` roles | Low |
| `order.shipped` | Order transitions to shipped | WhatsApp, Email | Customer (contact) — includes tracking code | High |
| `order.delivered` | Order transitions to delivered | WhatsApp | Customer (contact) — delivery confirmation | Medium |
| `stock.low` | SKU available <= reorder_point | In-app, Discord `#alertas` | In-app: `operations`; Discord: channel broadcast | High |
| `stock.critical` | SKU days_until_zero < 7 or quantity = 0 | In-app, Discord `#alertas` (with @mention) | In-app: `operations`; Discord: @operations role mention | Critical |
| `nfe.authorized` | NF-e authorized by SEFAZ | In-app | `operations` roles | Low |
| `nfe.rejected` | NF-e rejected or denied by SEFAZ | In-app, Discord `#alertas` | In-app: `operations`; Discord: channel broadcast | Critical |
| `chargeback.received` | Mercado Pago chargeback webhook | In-app, Discord `#alertas` | In-app: `admin`, `finance`; Discord: @marcus @pedro mention | Critical |
| `dre.generated` | Monthly DRE auto-generated (draft) | In-app | `finance` role | Medium |
| `reconciliation.discrepancy` | MP vs ERP discrepancy detected | In-app, Discord `#alertas` | `finance`, `admin` | High |
| `inventory.coverage_critical` | Gold-tier SKU has `days_to_zero < 7` | In-app, Discord `#alertas` | In-app: `operations`; Discord: @operations role mention | Critical |
| `cost_review.generated` | Monthly cost review report generated on 1st of month | In-app | `finance` (Pedro), `admin` (Marcus) | Medium |

**`inventory.coverage_critical` payload:**
```json
{
  "event": "inventory.coverage_critical",
  "payload": {
    "sku_id": "uuid",
    "product_name": "string",
    "sku_code": "string",
    "current_stock": "integer",
    "days_to_zero": "number",
    "tier": "gold",
    "daily_velocity": "number",
    "reorder_point": "integer"
  },
  "priority": "critical",
  "channels": ["in_app", "discord"],
  "discord_channel": "#alertas"
}
```

---

## 11. Error Handling

All errors follow the standard envelope from [API.md](../../architecture/API.md) and error codes from [ERROR-HANDLING.md](../../platform/ERROR-HANDLING.md).

| Error Code | HTTP | When | User-facing Message |
|-----------|------|------|-------------------|
| `ERP_ORDER_NOT_FOUND` | 404 | Order ID does not exist | "Pedido nao encontrado." |
| `ERP_INVALID_TRANSITION` | 422 | Order state transition not allowed | "Transicao de status invalida: {from} -> {to}." |
| `ERP_ORDER_ALREADY_DELIVERED` | 409 | Attempting to modify a delivered order | "Pedido ja entregue. Use o modulo de Trocas para devolucoes." |
| `ERP_PRODUCT_NOT_FOUND` | 404 | Product ID does not exist or is deleted | "Produto nao encontrado." |
| `ERP_SKU_NOT_FOUND` | 404 | SKU ID does not exist | "SKU nao encontrado." |
| `ERP_SKU_CODE_DUPLICATE` | 409 | SKU code already exists | "Ja existe um SKU com este codigo." |
| `ERP_INSUFFICIENT_STOCK` | 422 | Order paid but not enough stock to reserve | "Estoque insuficiente para SKU {sku_code}. Disponivel: {available}, Necessario: {required}." |
| `ERP_NFE_EMISSION_FAILED` | 502 | Focus NFe API returned error | "Falha na emissao da NF-e: {error_message}. Tentativa {retry_count}/3." |
| `ERP_NFE_CANCEL_EXPIRED` | 422 | Attempting to cancel NF-e after 24h | "NF-e so pode ser cancelada em ate 24 horas apos autorizacao." |
| `ERP_NFE_NOT_AUTHORIZED` | 422 | Attempting to cancel NF-e that is not authorized | "Apenas NF-e autorizadas podem ser canceladas." |
| `ERP_LABEL_GENERATION_FAILED` | 502 | Melhor Envio API returned error | "Falha na geracao da etiqueta: {error_message}." |
| `ERP_SHIPPING_REQUIRED` | 422 | Attempting to ship without label | "Gere a etiqueta de envio antes de marcar como enviado." |
| `ERP_NFE_REQUIRED` | 422 | Attempting to ship without authorized NF-e | "Emita a NF-e antes de marcar como enviado." |
| `ERP_DRE_ALREADY_APPROVED` | 409 | Attempting to edit an approved DRE | "DRE ja aprovado. Nao pode ser editado." |
| `ERP_DRE_PERIOD_EXISTS` | 409 | DRE for this month/year already exists | "Ja existe um DRE para {month}/{year}." |
| `ERP_MARGIN_NO_COST_DATA` | 422 | SKU has no cost_price set | "SKU nao possui custo de producao definido." |
| `ERP_MOVEMENT_NOTES_REQUIRED` | 422 | Adjustment/loss movement without notes | "Nota obrigatoria para movimentacoes de ajuste ou perda." |
| `ERP_MP_WEBHOOK_INVALID_SIGNATURE` | 401 | Mercado Pago webhook signature mismatch | _(not user-facing — logged and rejected)_ |
| `ERP_MP_WEBHOOK_DUPLICATE` | 200 | Duplicate webhook event (idempotency) | _(returns 200 OK, no action — idempotent)_ |

---

## 12. Testing Checklist

Following the testing strategy from [TESTING.md](../../platform/TESTING.md).

### 12.1 Unit Tests

- [ ] Order FSM: all valid transitions (pending->paid, paid->separating, separating->shipped, shipped->delivered)
- [ ] Order FSM: invalid transitions rejected (e.g., pending->shipped, delivered->cancelled)
- [ ] Order FSM: cancel from each pre-delivered state with correct inventory reversal
- [ ] Inventory: reservation on order.paid (available--, reserved++)
- [ ] Inventory: release on order.shipped (reserved--, movement created)
- [ ] Inventory: depletion velocity calculation (30-day rolling window)
- [ ] Inventory: days-to-zero computation (edge cases: velocity=0, available=0)
- [ ] NF-e: request payload construction (customer CPF, items, values, taxes)
- [ ] NF-e: retry logic with exponential backoff (1min, 5min, 15min, then stop)
- [ ] Margin: formula calculation (production_cost + shipping + price*gateway + price*tax)
- [ ] Margin: simulation (new price, recalculated cost and margin)
- [ ] Margin: edge cases (zero cost, 100% margin, negative margin)
- [ ] DRE: gross_revenue from settled sale transactions only
- [ ] DRE: net_revenue = gross - discounts - returns
- [ ] DRE: COGS calculation from order items * cost_price
- [ ] DRE: net_income = gross_margin - SUM(operational_expenses)
- [ ] Financial: webhook signature verification (valid, invalid, missing)
- [ ] Financial: idempotent webhook handling (duplicate event_id)
- [ ] SKU code uniqueness validation
- [ ] Movement notes required for adjustment and loss types

### 12.2 Integration Tests

- [ ] Create product with SKUs via API, verify database state
- [ ] Create duplicate SKU code, verify 409 response
- [ ] Order lifecycle: receive from Checkout -> reserve inventory -> verify inventory row
- [ ] Order mark-separating: verify NF-e job queued
- [ ] NF-e emission: mock Focus NFe API success -> verify nfe_documents row
- [ ] NF-e emission: mock Focus NFe API failure -> verify retry_count incremented
- [ ] Shipping label: mock Melhor Envio API -> verify shipping_labels row with tracking code
- [ ] Order mark-shipped: verify inventory movement created, shipping status updated
- [ ] Order cancel from paid: verify inventory reversed, refund transaction created
- [ ] Production entry via internal endpoint: verify inventory_movements and quantity_available updated
- [ ] Return entry via Trocas: verify restock and return NF-e created
- [ ] Mercado Pago webhook: payment.approved -> financial_transaction created
- [ ] Mercado Pago webhook: chargeback -> transaction + critical alert
- [ ] Margin calculation: calculate for SKU with known costs, verify exact values
- [ ] DRE generation: known month data, verify all line items correct
- [ ] DRE approve: verify status locked, approved_by set
- [ ] Reconciliation: inject known MP data and ERP data, verify match/discrepancy detection
- [ ] Stock alert: set SKU below reorder_point, run scan job, verify Flare event emitted
- [ ] Mobile order list: verify API returns correct data shape for mobile rendering

### 12.3 E2E Tests

- [ ] Full order lifecycle: Checkout -> paid -> separating (NF-e auto-emits) -> label generated -> shipped (customer notified) -> delivered
- [ ] Ana Clara mobile flow: open order list -> tap order -> Separar -> NF-e auto -> Gerar Etiqueta -> Marcar Enviado (all on mobile viewport)
- [ ] Stock entry flow: Ana Clara enters stock via mobile -> inventory updated -> movement log records entry
- [ ] Margin calculator: select SKU -> view breakdown -> simulate price -> verify recalculation
- [ ] DRE flow: generate report -> review -> edit expenses -> approve -> verify locked
- [ ] Inventory dashboard: filters work, sort works, low stock badge appears, click through to movement log
- [ ] NF-e management: list loads, status badges correct, retry button works for failed NF-e
- [ ] Financial reconciliation: period selector works, transactions list loads, discrepancies highlighted

### 12.4 Performance Tests

- [ ] Order list with 10,000+ orders: pagination under 200ms
- [ ] Inventory dashboard with 500+ SKUs: full render under 500ms
- [ ] Depletion velocity calculation for 500 SKUs: completes within 2 minutes
- [ ] DRE generation for a month with 1,000+ orders: completes within 30 seconds
- [ ] Margin calculation batch (all SKUs): completes within 1 minute
- [ ] Mobile order list: first contentful paint under 1.5s on 4G
- [ ] Kanban pipeline: real-time card counts update within 2 seconds of status change

### 12.5 Mobile-Specific Tests

- [ ] All touch targets >= 44px on order action buttons
- [ ] Swipe gesture on order cards works smoothly
- [ ] Stock entry numeric keyboard opens automatically on quantity field
- [ ] Order list cards render correctly at 375px width (iPhone SE)
- [ ] Dark mode renders correctly on all mobile screens
- [ ] Offline indicator shown when network is lost (graceful degradation)

---

## Appendix A: Migration from Bling

### A.1 Data Export from Bling

| Bling Entity | ERP Target Table | Migration Strategy |
|-------------|-----------------|-------------------|
| Products | `erp.products` + `erp.skus` | Export via Bling API. Map Bling product to product + SKU variants. |
| Orders (historical) | Not migrated to ERP | Historical orders remain in Bling archive. ERP starts with a clean pipeline. Historical financial data imported for DRE baseline. |
| NF-e (historical) | Not migrated | Historical NF-e remain in SEFAZ records. Only new NF-e go through ERP. |
| Inventory | `erp.inventory` | Full physical inventory count at cutover. Manual entry into ERP. No automated transfer. |
| Financial | DRE baseline | Export monthly revenue/cost summaries from Bling. Use as DRE comparison baseline for first 3 months. |

### A.2 Cutover Plan

1. **Week -2:** Export all products and SKUs from Bling. Import into ERP. Verify catalog completeness.
2. **Week -1:** Physical inventory count. Enter all stock levels into ERP. Set reorder points.
3. **Day 0:** Switch Checkout webhook from Bling to ERP. All new orders flow to ERP. Bling set to read-only.
4. **Week +1:** Process remaining Bling orders in Bling. No new orders enter Bling.
5. **Week +2:** Bling subscription cancelled. Full ERP operation confirmed.

---

## Appendix B: Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| OQ-1 | Should we support multiple NF-e series (for different product categories)? | Marcus | Open |
| OQ-2 | Do we need CC-e (Carta de Correcao Eletronica) support at launch, or is 24h cancellation window sufficient? | Pedro | Open |
| OQ-3 | Should the margin calculator support batch recalculation for all SKUs at once, or only per-SKU? | Pedro | Open — leaning toward batch for ranking table |
| OQ-4 | What is the exact Simples Nacional tax bracket for Ciena's current revenue? This affects `tax_rate` default. | Pedro | Open |
| OQ-5 | Should we auto-cancel pending orders after 48h without payment (boleto expiry)? | Marcus | Open |
| OQ-6 | Do we need multi-warehouse support in V1, or is a single warehouse assumption safe? | Tavares | Open — single warehouse for V1 |
| OQ-7 | Should Melhor Envio carrier selection be automatic (cheapest) or manual (Ana Clara picks)? | Ana Clara | Open — leaning toward auto with override |
| OQ-8 | How should we handle partial shipments (order with 3 items, only 2 in stock)? | Marcus | Open — defer to V2 |
| OQ-9 | Do we need a physical barcode scanner integration for stock entry, or is manual SKU selection sufficient for V1? | Ana Clara | Open — manual for V1, scanner V2 |
| OQ-10 | Should the DRE include tax breakdown (ICMS, PIS, COFINS) or just the aggregate tax rate? | Pedro | Open — aggregate for V1 |

---

*This module spec is the source of truth for ERP implementation. All development, review, and QA should reference this document. Changes require review from Marcus (admin) or Tavares (operations lead).*
