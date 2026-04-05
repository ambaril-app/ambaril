# PLM (Product Lifecycle Management) — Module Spec

> **Module:** PLM / Product Lifecycle Management
> **Schema:** `pcp`
> **Route prefix:** `/api/v1/pcp`
> **Admin UI route group:** `(admin)/pcp/*`
> **Version:** 1.0
> **Date:** March 2026
> **Status:** Approved
> **Priority:** HIGHEST — largest operational bottleneck at CIENA
> **Replaces:** Nothing (new capability — previously managed via spreadsheets and WhatsApp)
> **Inspiration:** Colecao.Moda PLM (adapted for streetwear drop model)
> **References:** [DATABASE.md](../../architecture/DATABASE.md), [API.md](../../architecture/API.md), [AUTH.md](../../architecture/AUTH.md), [NOTIFICATIONS.md](../../platform/NOTIFICATIONS.md), [GLOSSARY.md](../../dev/GLOSSARY.md)

---

## 1. Overview

The PLM module is the **production nerve center** of Ambaril. It manages the entire production lifecycle for CIENA's streetwear collections and drops — from initial concept through pattern-making, sampling, approval, material sourcing, cutting, sewing, finishing, quality control, and final stock entry. Every garment that reaches a customer passes through this pipeline.

CIENA operates on a **collection/drop model**: seasonal collections contain multiple drops, each drop contains multiple production orders (OPs), and each OP tracks the manufacturing of a specific SKU through 11 sequential stages. The PLM module provides full visibility into where every piece is in the pipeline, which suppliers are performing, what materials are needed, and what everything costs.

**This is the highest-priority module** because production is CIENA's biggest operational bottleneck. Before Ambaril, Tavares managed production via spreadsheets and WhatsApp messages to suppliers, with no systematic tracking of deadlines, costs, or supplier reliability. Missed deadlines cascaded into delayed drops, lost revenue, and frustrated customers.

**5 Sub-modules:**

| Sub-module                  | Description                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Production Orders (OPs)** | Create, track, and manage production orders through 11 sequential stages with deadline monitoring and escalation alerts                                                         |
| **Supplier Management**     | Track all suppliers (factories, weaving mills, print shops, dyeing mills, trim suppliers, packaging), rate their performance, log contact history, calculate reliability scores |
| **Raw Materials**           | Manage raw material inventory (fabrics, trims, labels, packaging, thread), track stock levels, plan purchases per collection, alert on shortages                                |
| **Cost Analysis**           | Break down production costs per SKU (materials, labor, overhead), calculate cost-per-piece, feed data to ERP margin calculator                                                  |
| **Rework**                  | Track defective batches sent back to suppliers for rework, monitor return timelines, log rework costs                                                                           |

**Primary users:**

| User          | Role       | Device  | Primary actions                                                                            |
| ------------- | ---------- | ------- | ------------------------------------------------------------------------------------------ |
| **Tavares**   | Operations | Desktop | Create OPs, advance stages, manage suppliers, plan materials, analyze costs, handle rework |
| **Ana Clara** | Logistics  | Mobile  | Enter finished stock (stock_entry stage), verify quantities, scan/confirm deliveries       |
| **Caio**      | PM         | Desktop | View production dashboard, monitor collection timelines, review bottlenecks (read-only)    |
| **Marcus**    | Admin      | Desktop | Full access, review supplier costs, approve high-cost decisions (read-only day-to-day)     |

**Out of scope:** This module does NOT manage finished goods inventory (that is the ERP module). PLM tracks production until the stock_entry stage completes, at which point it hands off to `erp.inventory`. PLM also does NOT manage sales orders, shipping, or customer-facing logistics.

---

## 2. User Stories

### 2.1 Production Orders

| #    | As a...              | I want to...                                                                         | So that...                                                                         |
| ---- | -------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| US01 | Tavares (operations) | create a new production order for a specific SKU within a collection                 | I can track the manufacturing process from concept to stock entry                  |
| US02 | Tavares              | see all production orders for a collection on a single screen with status indicators | I can quickly assess overall collection progress                                   |
| US03 | Tavares              | advance a production stage to "completed" with notes and optional supplier rating    | each stage is documented and supplier performance is tracked                       |
| US04 | Tavares              | see a simplified Gantt-style timeline showing all 11 stages for an OP                | I can visualize where the OP is in the pipeline and which stages are delayed       |
| US05 | Tavares              | set planned start and end dates for each stage when creating an OP                   | the system can calculate deadlines and trigger alerts                              |
| US06 | Tavares              | pause an OP and add a reason                                                         | I can handle interruptions (supplier issue, design change) without losing tracking |
| US07 | Tavares              | skip a stage with a mandatory reason                                                 | non-applicable stages (e.g., no size grading needed) don't block the pipeline      |
| US08 | Tavares              | assign a supplier to a specific production stage                                     | I know who is responsible for each part of manufacturing                           |
| US09 | Tavares              | set priority (low/medium/high/critical) on an OP                                     | critical drops get attention first                                                 |
| US10 | System               | automatically create 11 production stages when a new OP is created                   | Tavares doesn't have to manually set up each stage every time                      |

### 2.2 Alerts and Monitoring

| #    | As a...        | I want to...                                                                                    | So that...                                                       |
| ---- | -------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| US11 | Tavares        | receive an in-app alert when a stage consumes its safety margin                                 | I know a stage is running late before it becomes critical        |
| US12 | Tavares        | receive a Discord @mention when a stage deadline is tomorrow and the stage is not complete      | I can take urgent action on at-risk stages                       |
| US13 | Caio (PM)      | receive a Discord @mention when a stage is overdue (deadline passed)                            | I'm aware of critical production delays affecting drop timelines |
| US14 | Marcus (admin) | see production bottlenecks on the main dashboard                                                | I can identify systemic issues without digging into PLM details  |
| US15 | Caio           | view a collection overview showing all OPs, their stages, and a summary of on-track vs. delayed | I can report production status in team meetings                  |

### 2.3 Suppliers

| #    | As a... | I want to...                                                                                           | So that...                                                |
| ---- | ------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| US16 | Tavares | add a new supplier with contact info, type, and CNPJ                                                   | our supplier database is complete and organized           |
| US17 | Tavares | rate a supplier after completing a stage they were assigned to (quality, communication, cost, on-time) | supplier reliability scores are based on real data        |
| US18 | Tavares | see a supplier's reliability score, average delay, and rating history                                  | I can make informed decisions about which supplier to use |
| US19 | Tavares | log a contact interaction with a supplier (call, email, visit) with notes                              | we have a record of all supplier communications           |
| US20 | System  | automatically recalculate supplier reliability scores daily                                            | scores always reflect the latest performance data         |
| US21 | System  | alert when a supplier has been late on 3 of the last 5 deliveries                                      | I'm warned about declining supplier performance           |

### 2.4 Raw Materials

| #    | As a...               | I want to...                                                                                        | So that...                                                      |
| ---- | --------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| US22 | Tavares               | see all raw materials with current stock levels and alert badges for low stock                      | I know what needs to be reordered                               |
| US23 | Tavares               | generate a requirements list for a collection showing what materials are needed vs. what's in stock | I can plan material purchases efficiently                       |
| US24 | Tavares               | set the purchase deadline for materials based on collection launch date and lead times              | I order materials in time for production to start               |
| US25 | Ana Clara (logistics) | enter raw material stock received from a supplier on her mobile phone                               | stock levels stay accurate as materials arrive at the warehouse |

### 2.5 Cost Analysis

| #    | As a... | I want to...                                                                   | So that...                                        |
| ---- | ------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| US26 | Tavares | enter material, labor, and overhead costs for an OP and see the cost-per-piece | I know the true production cost of each SKU       |
| US27 | Tavares | compare production costs between different suppliers for the same service      | I can negotiate better prices or switch suppliers |
| US28 | Marcus  | see production cost data feeding into the ERP margin calculator                | pricing decisions are based on accurate cost data |

### 2.6 Rework

| #    | As a... | I want to...                                                                  | So that...                                                      |
| ---- | ------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| US29 | Tavares | create a rework order when QC identifies defective pieces                     | defective batches are tracked from detection through resolution |
| US30 | Tavares | track the status of rework (sent to supplier, in rework, returned, completed) | I know where rework batches are and when to expect them back    |
| US31 | Tavares | log rework costs against the original OP                                      | true production costs include rework expenses                   |

### 2.7 Mobile

| #    | As a...   | I want to...                                                                           | So that...                                                                   |
| ---- | --------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| US32 | Ana Clara | complete the stock_entry stage on mobile with large touch-friendly buttons             | I can confirm production deliveries on the warehouse floor without a desktop |
| US33 | Ana Clara | select a production order, confirm the SKU and quantity, and mark stock entry complete | the system knows exactly what entered inventory and when                     |

### 2.8 Pilot Production & Validation

| #    | As a...              | I want to...                                                                                                      | So that...                                                                                                                                                   |
| ---- | -------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| US34 | Tavares (operations) | create a pilot production order (50-100 units) to test market response before committing to full-scale production | I can minimize waste on unvalidated designs. OP type `pilot` with fixed qty. Linked to sales data for go/no-go decision in 48h.                              |
| US35 | Tavares              | the system to suggest a full-scale OP when a pilot SKU sells X% in Y days                                         | I can capitalize on champion products quickly. Auto-trigger notification with pre-calculated BOM and suggested quantity.                                     |
| US36 | CIENA team           | vote on whether I would buy a product during the approval stage                                                   | we have internal validation data before production. Simple poll: sim/nao/talvez + optional comment. Results visible on OP detail.                            |
| US37 | Caio (PM)            | a Product Development Pipeline dashboard showing all concepts in different validation stages                      | I can track the funnel from idea to production. Kanban view: Conceito → Votacao Interna → Preview Social → Piloto → Dados de Venda → Escala / Descontinuado. |

---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```mermaid
erDiagram
    COLLECTIONS ||--o{ DROPS : contains
    COLLECTIONS ||--o{ PRODUCTION_ORDERS : has
    COLLECTIONS ||--o{ RAW_MATERIAL_REQUIREMENTS : needs
    DROPS ||--o{ PRODUCTION_ORDERS : includes

    PRODUCTION_ORDERS ||--|{ PRODUCTION_STAGES : "has 11"
    PRODUCTION_ORDERS ||--o{ COST_ANALYSES : analyzed_by
    PRODUCTION_ORDERS ||--o{ REWORK_ORDERS : may_have
    PRODUCTION_ORDERS ||--o{ INTERNAL_VOTES : voted_on
    PRODUCTION_ORDERS }o--|| ERP_SKUS : produces

    PRODUCTION_STAGES }o--o| SUPPLIERS : assigned_to
    PRODUCTION_STAGES }o--o| USERS : completed_by

    ERP_PRODUCTS ||--o{ PRODUCT_BOM : has_bom
    PRODUCT_BOM }o--|| RAW_MATERIALS : uses_material
    INTERNAL_VOTES }o--|| USERS : cast_by

    SUPPLIERS ||--o{ SUPPLIER_CONTACTS : has_contacts
    SUPPLIERS ||--o{ SUPPLIER_RATINGS : rated_by
    SUPPLIERS ||--o{ REWORK_ORDERS : reworks_for
    SUPPLIERS ||--o{ RAW_MATERIALS : supplies

    RAW_MATERIALS ||--|| RAW_MATERIAL_STOCK : tracked_in
    RAW_MATERIALS ||--o{ RAW_MATERIAL_REQUIREMENTS : required_for

    SUPPLIER_RATINGS }o--|| PRODUCTION_ORDERS : for_order
    SUPPLIER_RATINGS }o--|| USERS : rated_by_user

    COST_ANALYSES }o--|| ERP_SKUS : for_sku

    COLLECTIONS {
        uuid id PK
        varchar name
        varchar season
        int year
        enum status
        date planned_launch
    }

    DROPS {
        uuid id PK
        uuid collection_id FK
        varchar name
        int drop_number
        date planned_date
        enum status
    }

    PRODUCTION_ORDERS {
        uuid id PK
        uuid collection_id FK
        uuid drop_id FK
        uuid sku_id FK
        int quantity
        enum current_stage
        enum status
        enum priority
        date planned_start_date
        date planned_end_date
        int safety_margin_days
    }

    PRODUCTION_STAGES {
        uuid id PK
        uuid production_order_id FK
        enum stage_type
        int sequence
        enum status
        date planned_start
        date planned_end
        date actual_start
        date actual_end
        boolean safety_margin_consumed
        uuid assigned_supplier_id FK
    }

    SUPPLIERS {
        uuid id PK
        varchar name
        enum type
        varchar cnpj
        int reliability_score
        numeric avg_delay_days
        boolean is_active
    }

    SUPPLIER_CONTACTS {
        uuid id PK
        uuid supplier_id FK
        date contact_date
        varchar subject
        text notes
    }

    SUPPLIER_RATINGS {
        uuid id PK
        uuid supplier_id FK
        uuid production_order_id FK
        int quality
        int communication
        int cost
        boolean on_time
    }

    RAW_MATERIALS {
        uuid id PK
        varchar name
        enum category
        enum unit
        uuid supplier_id FK
        numeric unit_cost
        int lead_time_days
    }

    RAW_MATERIAL_STOCK {
        uuid id PK
        uuid raw_material_id FK
        numeric quantity_available
        numeric quantity_reserved
    }

    RAW_MATERIAL_REQUIREMENTS {
        uuid id PK
        uuid collection_id FK
        uuid raw_material_id FK
        numeric quantity_needed
        numeric quantity_to_purchase
        date purchase_deadline
        enum status
    }

    COST_ANALYSES {
        uuid id PK
        uuid production_order_id FK
        uuid sku_id FK
        numeric material_cost
        numeric labor_cost
        numeric overhead_cost
        numeric total_cost
        numeric cost_per_piece
    }

    REWORK_ORDERS {
        uuid id PK
        uuid production_order_id FK
        uuid supplier_id FK
        text description
        int quantity
        enum status
        numeric cost
    }

    PRODUCT_BOM {
        uuid id PK
        uuid product_id FK
        uuid raw_material_id FK
        numeric qty_per_unit
        varchar unit
        text notes
    }

    INTERNAL_VOTES {
        uuid id PK
        uuid production_order_id FK
        uuid user_id FK
        enum vote
        text comment
    }
```

### 3.2 Enums

```sql
-- Defined in DATABASE.md section 3
CREATE TYPE pcp.collection_status AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE pcp.drop_status AS ENUM ('planned', 'active', 'completed');
CREATE TYPE pcp.production_status AS ENUM ('draft', 'in_progress', 'paused', 'completed', 'cancelled');
CREATE TYPE pcp.stage_type AS ENUM (
    'concept', 'pattern', 'sample', 'approval', 'size_grading',
    'material_purchase', 'cutting', 'sewing', 'finishing', 'qc', 'stock_entry'
);
CREATE TYPE pcp.stage_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
CREATE TYPE pcp.priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE pcp.supplier_type AS ENUM (
    'factory', 'weaving_mill', 'print_shop', 'dyeing_mill', 'trim_supplier', 'packaging'
);
CREATE TYPE pcp.raw_material_category AS ENUM ('fabric', 'trim', 'label', 'packaging', 'thread', 'other');
CREATE TYPE pcp.raw_material_unit AS ENUM ('meters', 'units', 'kg', 'rolls');
CREATE TYPE pcp.requirement_status AS ENUM ('pending', 'ordered', 'received');
CREATE TYPE pcp.rework_status AS ENUM ('pending', 'sent_to_supplier', 'in_rework', 'returned', 'completed');
CREATE TYPE pcp.op_type AS ENUM ('standard', 'pilot');
CREATE TYPE pcp.vote_choice AS ENUM ('yes', 'no', 'maybe');
CREATE TYPE pcp.pilot_status AS ENUM ('monitoring', 'champion', 'discontinue');
```

### 3.3 Tables

#### 3.3.1 pcp.collections

| Column          | Type                  | Constraints                   | Description                                                                                                 |
| --------------- | --------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| id              | UUID                  | PK, DEFAULT gen_random_uuid() | UUID v7                                                                                                     |
| name            | VARCHAR(255)          | NOT NULL                      | e.g., 'Colecao Inverno 2026'                                                                                |
| season          | VARCHAR(50)           | NULL                          | e.g., 'inverno_2026', 'verao_2027'                                                                          |
| year            | INTEGER               | NOT NULL                      | e.g., 2026                                                                                                  |
| status          | pcp.collection_status | NOT NULL DEFAULT 'draft'      | draft, active, completed, archived                                                                          |
| planned_launch  | DATE                  | NULL                          | Target launch date for the collection                                                                       |
| notes           | TEXT                  | NULL                          | Internal notes about the collection                                                                         |
| cover_image_url | VARCHAR(512)          | NULL                          | Cover image URL (stored in R2 via DAM). See section 13.21                                                   |
| color_palette   | JSONB                 | NOT NULL DEFAULT '[]'         | Collection color palette as array of hex values. e.g., `["#0F172A","#E2E8F0","#DC2626"]`. See section 13.21 |
| prints          | JSONB                 | NOT NULL DEFAULT '[]'         | Collection prints/patterns metadata. Array of `{name, image_url, description}`. See section 13.21           |
| description     | TEXT                  | NULL                          | Rich description of the collection (theme, inspiration, target audience)                                    |
| created_at      | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()        |                                                                                                             |
| updated_at      | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()        |                                                                                                             |

```sql
CREATE INDEX idx_pcp_collections_status ON pcp.collections (status);
CREATE INDEX idx_pcp_collections_year ON pcp.collections (year);
CREATE INDEX idx_pcp_collections_launch ON pcp.collections (planned_launch);
```

#### 3.3.2 pcp.drops

| Column        | Type            | Constraints                                        | Description                               |
| ------------- | --------------- | -------------------------------------------------- | ----------------------------------------- |
| id            | UUID            | PK, DEFAULT gen_random_uuid()                      |                                           |
| collection_id | UUID            | NOT NULL, FK pcp.collections(id) ON DELETE CASCADE | Parent collection                         |
| name          | VARCHAR(255)    | NOT NULL                                           | e.g., 'Drop 13'                           |
| drop_number   | INTEGER         | NOT NULL                                           | Sequential number within collection       |
| planned_date  | DATE            | NULL                                               | Planned launch date for this drop         |
| actual_date   | DATE            | NULL                                               | Actual launch date (filled when launched) |
| status        | pcp.drop_status | NOT NULL DEFAULT 'planned'                         | planned, active, completed                |
| notes         | TEXT            | NULL                                               |                                           |
| created_at    | TIMESTAMPTZ     | NOT NULL DEFAULT NOW()                             |                                           |
| updated_at    | TIMESTAMPTZ     | NOT NULL DEFAULT NOW()                             |                                           |

```sql
CREATE INDEX idx_pcp_drops_collection ON pcp.drops (collection_id);
CREATE INDEX idx_pcp_drops_status ON pcp.drops (status);
CREATE INDEX idx_pcp_drops_planned ON pcp.drops (planned_date);
CREATE UNIQUE INDEX idx_pcp_drops_number ON pcp.drops (collection_id, drop_number);
```

#### 3.3.3 pcp.production_orders

| Column             | Type                  | Constraints                                | Description                                                                                                                                   |
| ------------------ | --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| id                 | UUID                  | PK, DEFAULT gen_random_uuid()              |                                                                                                                                               |
| collection_id      | UUID                  | NOT NULL, FK pcp.collections(id)           |                                                                                                                                               |
| drop_id            | UUID                  | NULL, FK pcp.drops(id)                     | Nullable -- not all OPs belong to a drop                                                                                                      |
| name               | VARCHAR(255)          | NOT NULL                                   | OP name / description                                                                                                                         |
| description        | TEXT                  | NULL                                       | Detailed production notes                                                                                                                     |
| sku_id             | UUID                  | NOT NULL, FK erp.skus(id)                  | Which SKU is being produced                                                                                                                   |
| quantity           | INTEGER               | NOT NULL, CHECK (quantity > 0)             | How many units to produce                                                                                                                     |
| current_stage      | pcp.stage_type        | NOT NULL DEFAULT 'concept'                 | Current active stage                                                                                                                          |
| status             | pcp.production_status | NOT NULL DEFAULT 'draft'                   | draft, in_progress, paused, completed, cancelled                                                                                              |
| planned_start_date | DATE                  | NULL                                       | Planned production start                                                                                                                      |
| planned_end_date   | DATE                  | NULL                                       | Planned production end                                                                                                                        |
| actual_start_date  | DATE                  | NULL                                       | Actual start (set when first stage begins)                                                                                                    |
| actual_end_date    | DATE                  | NULL                                       | Actual end (set when stock_entry completes)                                                                                                   |
| safety_margin_days | INTEGER               | NOT NULL DEFAULT 3                         | Buffer days per stage before alerts escalate                                                                                                  |
| priority           | pcp.priority          | NOT NULL DEFAULT 'medium'                  | low, medium, high, critical                                                                                                                   |
| op_type            | pcp.op_type           | NOT NULL DEFAULT 'standard'                | standard or pilot. Pilot OPs have reduced qty for market validation                                                                           |
| pilot_qty          | INTEGER               | NULL, CHECK (pilot_qty BETWEEN 50 AND 100) | Used only when `op_type = 'pilot'`. Fixed qty between 50-100 units (configurable per product category)                                        |
| pilot_status       | pcp.pilot_status      | NULL                                       | NULL for standard OPs. Set by champion_detection job: monitoring, champion, discontinue                                                       |
| pilot_scale_factor | INTEGER               | NULL DEFAULT 10                            | Multiplier for suggested full-scale qty when pilot is flagged as champion                                                                     |
| notes              | TEXT                  | NULL                                       |                                                                                                                                               |
| custom_fields      | JSONB                 | NOT NULL DEFAULT '{}'                      | Tenant-configurable custom fields. Structure defined per tenant in `pcp.custom_field_definitions`. Filterable via GIN index. See section 13.5 |
| regression_count   | INTEGER               | NOT NULL DEFAULT 0                         | Number of times this OP has been regressed to a previous stage (repilotagem counter). See section 13.2                                        |
| is_reuse           | BOOLEAN               | NOT NULL DEFAULT FALSE                     | TRUE when this OP was cloned from another collection (carry-over / aproveitamento). See section 13.12                                         |
| source_op_id       | UUID                  | NULL, FK pcp.production_orders(id)         | Original OP this was cloned from (NULL if not a reuse). See section 13.12                                                                     |
| product_type_id    | UUID                  | NULL, FK pcp.product_types(id)             | Standardized product type (camiseta, calca, moletom, etc.). See section 13.25                                                                 |
| workflow_id        | UUID                  | NULL, FK pcp.workflows(id)                 | Workflow template used for this OP. NULL = default 11-stage flow. See section 13.26                                                           |
| created_by         | UUID                  | NOT NULL, FK global.users(id)              | Who created this OP                                                                                                                           |
| created_at         | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()                     |                                                                                                                                               |
| updated_at         | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()                     |                                                                                                                                               |

```sql
CREATE INDEX idx_pcp_po_collection ON pcp.production_orders (collection_id);
CREATE INDEX idx_pcp_po_drop ON pcp.production_orders (drop_id) WHERE drop_id IS NOT NULL;
CREATE INDEX idx_pcp_po_sku ON pcp.production_orders (sku_id);
CREATE INDEX idx_pcp_po_status ON pcp.production_orders (status);
CREATE INDEX idx_pcp_po_stage ON pcp.production_orders (current_stage);
CREATE INDEX idx_pcp_po_priority ON pcp.production_orders (priority) WHERE priority IN ('high', 'critical');
CREATE INDEX idx_pcp_po_planned_end ON pcp.production_orders (planned_end_date);
CREATE INDEX idx_pcp_po_created_by ON pcp.production_orders (created_by);
CREATE INDEX idx_pcp_po_op_type ON pcp.production_orders (op_type) WHERE op_type = 'pilot';
CREATE INDEX idx_pcp_po_pilot_status ON pcp.production_orders (pilot_status) WHERE pilot_status IS NOT NULL;
```

#### 3.3.4 pcp.production_stages

| Column                  | Type             | Constraints                                              | Description                                                                                                                        |
| ----------------------- | ---------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| id                      | UUID             | PK, DEFAULT gen_random_uuid()                            |                                                                                                                                    |
| production_order_id     | UUID             | NOT NULL, FK pcp.production_orders(id) ON DELETE CASCADE | Parent OP                                                                                                                          |
| stage_type              | pcp.stage_type   | NOT NULL                                                 | concept, pattern, sample, approval, size_grading, material_purchase, cutting, sewing, finishing, qc, stock_entry                   |
| sequence                | INTEGER          | NOT NULL, CHECK (sequence BETWEEN 1 AND 11)              | Order in the production flow                                                                                                       |
| status                  | pcp.stage_status | NOT NULL DEFAULT 'pending'                               | pending, in_progress, completed, skipped                                                                                           |
| planned_start           | DATE             | NULL                                                     | Planned start for this stage                                                                                                       |
| planned_end             | DATE             | NULL                                                     | Planned end / deadline for this stage                                                                                              |
| actual_start            | DATE             | NULL                                                     | When stage actually began                                                                                                          |
| actual_end              | DATE             | NULL                                                     | When stage was actually completed                                                                                                  |
| safety_margin_consumed  | BOOLEAN          | NOT NULL DEFAULT FALSE                                   | TRUE when actual_end > planned_end                                                                                                 |
| assigned_supplier_id    | UUID             | NULL, FK pcp.suppliers(id)                               | Supplier responsible for this stage                                                                                                |
| assigned_team_member_id | UUID             | NULL, FK global.users(id)                                | Internal team member responsible for supervising this stage. Complementary to `assigned_supplier_id` (external). See section 13.20 |
| cost                    | NUMERIC(12,2)    | NULL                                                     | Cost incurred at this stage                                                                                                        |
| notes                   | TEXT             | NULL                                                     | Completion notes, skip reason, etc.                                                                                                |
| completed_by            | UUID             | NULL, FK global.users(id)                                | Who marked this stage complete                                                                                                     |
| created_at              | TIMESTAMPTZ      | NOT NULL DEFAULT NOW()                                   |                                                                                                                                    |
| updated_at              | TIMESTAMPTZ      | NOT NULL DEFAULT NOW()                                   |                                                                                                                                    |

```sql
CREATE INDEX idx_pcp_ps_order ON pcp.production_stages (production_order_id);
CREATE INDEX idx_pcp_ps_type ON pcp.production_stages (stage_type);
CREATE INDEX idx_pcp_ps_status ON pcp.production_stages (status);
CREATE INDEX idx_pcp_ps_supplier ON pcp.production_stages (assigned_supplier_id) WHERE assigned_supplier_id IS NOT NULL;
CREATE INDEX idx_pcp_ps_planned_end ON pcp.production_stages (planned_end) WHERE status IN ('pending', 'in_progress');
CREATE UNIQUE INDEX idx_pcp_ps_unique ON pcp.production_stages (production_order_id, stage_type);
```

#### 3.3.5 pcp.suppliers

| Column               | Type              | Constraints                             | Description                                                              |
| -------------------- | ----------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| id                   | UUID              | PK, DEFAULT gen_random_uuid()           |                                                                          |
| name                 | VARCHAR(255)      | NOT NULL                                | Company name                                                             |
| type                 | pcp.supplier_type | NOT NULL                                | factory, weaving_mill, print_shop, dyeing_mill, trim_supplier, packaging |
| contact_name         | VARCHAR(255)      | NULL                                    | Primary contact person                                                   |
| contact_phone        | VARCHAR(20)       | NULL                                    | E.164 format                                                             |
| contact_email        | VARCHAR(255)      | NULL                                    |                                                                          |
| address              | TEXT              | NULL                                    | Full address                                                             |
| cnpj                 | VARCHAR(18)       | NULL, UNIQUE (WHERE deleted_at IS NULL) | Brazilian company ID (00.000.000/0000-00)                                |
| reliability_score    | NUMERIC(5,2)      | NOT NULL DEFAULT 50.00                  | 0-100, calculated from delivery/quality/cost history                     |
| avg_delay_days       | NUMERIC(5,1)      | NOT NULL DEFAULT 0                      | Average days late across all orders (negative = early)                   |
| total_orders         | INTEGER           | NOT NULL DEFAULT 0                      | Total production stages assigned to this supplier                        |
| on_time_deliveries   | INTEGER           | NOT NULL DEFAULT 0                      | Stages completed on or before planned_end                                |
| quality_rating       | NUMERIC(3,1)      | NOT NULL DEFAULT 3.0                    | Average quality rating 1.0-5.0                                           |
| communication_rating | NUMERIC(3,1)      | NOT NULL DEFAULT 3.0                    | Average communication rating 1.0-5.0                                     |
| cost_rating          | NUMERIC(3,1)      | NOT NULL DEFAULT 3.0                    | Average cost-effectiveness rating 1.0-5.0                                |
| notes                | TEXT              | NULL                                    |                                                                          |
| is_active            | BOOLEAN           | NOT NULL DEFAULT TRUE                   |                                                                          |
| created_at           | TIMESTAMPTZ       | NOT NULL DEFAULT NOW()                  |                                                                          |
| updated_at           | TIMESTAMPTZ       | NOT NULL DEFAULT NOW()                  |                                                                          |
| deleted_at           | TIMESTAMPTZ       | NULL                                    | Soft delete                                                              |

```sql
CREATE INDEX idx_pcp_suppliers_type ON pcp.suppliers (type);
CREATE INDEX idx_pcp_suppliers_active ON pcp.suppliers (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_pcp_suppliers_reliability ON pcp.suppliers (reliability_score DESC);
CREATE UNIQUE INDEX idx_pcp_suppliers_cnpj ON pcp.suppliers (cnpj) WHERE cnpj IS NOT NULL AND deleted_at IS NULL;
```

#### 3.3.6 pcp.supplier_contacts

| Column       | Type         | Constraints                                      | Description                           |
| ------------ | ------------ | ------------------------------------------------ | ------------------------------------- |
| id           | UUID         | PK, DEFAULT gen_random_uuid()                    |                                       |
| supplier_id  | UUID         | NOT NULL, FK pcp.suppliers(id) ON DELETE CASCADE |                                       |
| contact_date | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                           | When the contact happened             |
| subject      | VARCHAR(255) | NOT NULL                                         | Brief subject of the interaction      |
| notes        | TEXT         | NULL                                             | Detailed notes about the conversation |
| contacted_by | UUID         | NOT NULL, FK global.users(id)                    | Who made the contact                  |
| created_at   | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                           |                                       |

```sql
CREATE INDEX idx_pcp_sc_supplier ON pcp.supplier_contacts (supplier_id);
CREATE INDEX idx_pcp_sc_date ON pcp.supplier_contacts (contact_date DESC);
```

#### 3.3.7 pcp.supplier_ratings

| Column              | Type        | Constraints                                     | Description                                    |
| ------------------- | ----------- | ----------------------------------------------- | ---------------------------------------------- |
| id                  | UUID        | PK, DEFAULT gen_random_uuid()                   |                                                |
| supplier_id         | UUID        | NOT NULL, FK pcp.suppliers(id)                  |                                                |
| production_order_id | UUID        | NOT NULL, FK pcp.production_orders(id)          | Which OP this rating is for                    |
| quality             | INTEGER     | NOT NULL, CHECK (quality BETWEEN 1 AND 5)       | Quality score                                  |
| communication       | INTEGER     | NOT NULL, CHECK (communication BETWEEN 1 AND 5) | Communication score                            |
| cost                | INTEGER     | NOT NULL, CHECK (cost BETWEEN 1 AND 5)          | Cost-effectiveness score                       |
| on_time             | BOOLEAN     | NOT NULL                                        | Was this delivery on time?                     |
| delay_days          | INTEGER     | NULL                                            | Days late (NULL if on_time = true, 0+ if late) |
| notes               | TEXT        | NULL                                            | Optional comments                              |
| rated_by            | UUID        | NOT NULL, FK global.users(id)                   | Who submitted this rating                      |
| created_at          | TIMESTAMPTZ | NOT NULL DEFAULT NOW()                          |                                                |

```sql
CREATE INDEX idx_pcp_sr_supplier ON pcp.supplier_ratings (supplier_id);
CREATE INDEX idx_pcp_sr_order ON pcp.supplier_ratings (production_order_id);
CREATE INDEX idx_pcp_sr_rated_by ON pcp.supplier_ratings (rated_by);
```

#### 3.3.8 pcp.raw_materials

| Column             | Type                      | Constraints                   | Description                                                                                                                    |
| ------------------ | ------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| id                 | UUID                      | PK, DEFAULT gen_random_uuid() |                                                                                                                                |
| name               | VARCHAR(255)              | NOT NULL                      | e.g., 'Malha 30/1 Preta', 'Ziper YKK 20cm'                                                                                     |
| category           | pcp.raw_material_category | NOT NULL                      | fabric, trim, label, packaging, thread, other                                                                                  |
| unit               | pcp.raw_material_unit     | NOT NULL                      | meters, units, kg, rolls                                                                                                       |
| supplier_id        | UUID                      | NULL, FK pcp.suppliers(id)    | Default/preferred supplier                                                                                                     |
| unit_cost          | NUMERIC(10,2)             | NOT NULL DEFAULT 0            | Latest known cost per unit                                                                                                     |
| min_order_quantity | INTEGER                   | NOT NULL DEFAULT 0            | Minimum order quantity from supplier                                                                                           |
| lead_time_days     | INTEGER                   | NOT NULL DEFAULT 0            | Typical supplier lead time in days                                                                                             |
| weight_gsm         | NUMERIC(8,2)              | NULL                          | Fabric weight in grams per square meter (gramatura). Only for category=fabric. See section 13.13                               |
| width_cm           | NUMERIC(8,2)              | NULL                          | Fabric width in centimeters (largura). Only for category=fabric. See section 13.13                                             |
| shrinkage_pct      | NUMERIC(5,2)              | NULL                          | Shrinkage percentage after washing (encolhimento). Only for category=fabric. See section 13.13                                 |
| construction       | VARCHAR(100)              | NULL                          | Fabric construction type (e.g., 'jersey', 'rib', 'interlock', 'sarja', 'moletom'). Only for category=fabric. See section 13.13 |
| image_url          | VARCHAR(512)              | NULL                          | Material image URL (stored in R2 via DAM). Applicable to all categories. See section 13.13                                     |
| colors             | JSONB                     | NOT NULL DEFAULT '[]'         | Available colors for this material. Array of `{name, hex_code}`. See section 13.13                                             |
| notes              | TEXT                      | NULL                          |                                                                                                                                |
| is_active          | BOOLEAN                   | NOT NULL DEFAULT TRUE         |                                                                                                                                |
| created_at         | TIMESTAMPTZ               | NOT NULL DEFAULT NOW()        |                                                                                                                                |
| updated_at         | TIMESTAMPTZ               | NOT NULL DEFAULT NOW()        |                                                                                                                                |

```sql
CREATE INDEX idx_pcp_rm_category ON pcp.raw_materials (category);
CREATE INDEX idx_pcp_rm_supplier ON pcp.raw_materials (supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX idx_pcp_rm_active ON pcp.raw_materials (is_active) WHERE is_active = TRUE;
```

#### 3.3.9 pcp.raw_material_stock

| Column             | Type          | Constraints                                | Description                      |
| ------------------ | ------------- | ------------------------------------------ | -------------------------------- |
| id                 | UUID          | PK, DEFAULT gen_random_uuid()              |                                  |
| raw_material_id    | UUID          | NOT NULL, FK pcp.raw_materials(id), UNIQUE | One stock record per material    |
| quantity_available | NUMERIC(10,2) | NOT NULL DEFAULT 0                         | Current available stock          |
| quantity_reserved  | NUMERIC(10,2) | NOT NULL DEFAULT 0                         | Reserved for upcoming production |
| last_entry_at      | TIMESTAMPTZ   | NULL                                       | Last time stock was added        |
| last_exit_at       | TIMESTAMPTZ   | NULL                                       | Last time stock was consumed     |
| updated_at         | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()                     |                                  |

```sql
CREATE UNIQUE INDEX idx_pcp_rms_material ON pcp.raw_material_stock (raw_material_id);
```

#### 3.3.10 pcp.raw_material_requirements

| Column               | Type                   | Constraints                        | Description                                       |
| -------------------- | ---------------------- | ---------------------------------- | ------------------------------------------------- |
| id                   | UUID                   | PK, DEFAULT gen_random_uuid()      |                                                   |
| collection_id        | UUID                   | NOT NULL, FK pcp.collections(id)   | Which collection needs this material              |
| raw_material_id      | UUID                   | NOT NULL, FK pcp.raw_materials(id) | Which material                                    |
| quantity_needed      | NUMERIC(10,2)          | NOT NULL                           | Total quantity needed for the collection          |
| quantity_in_stock    | NUMERIC(10,2)          | NOT NULL DEFAULT 0                 | Snapshot of available stock at calculation time   |
| quantity_to_purchase | NUMERIC(10,2)          | NOT NULL DEFAULT 0                 | quantity_needed - quantity_in_stock (if positive) |
| purchase_deadline    | DATE                   | NULL                               | When material must be ordered to arrive on time   |
| status               | pcp.requirement_status | NOT NULL DEFAULT 'pending'         | pending, ordered, received                        |
| supplier_id          | UUID                   | NULL, FK pcp.suppliers(id)         | Which supplier to order from                      |
| notes                | TEXT                   | NULL                               |                                                   |
| created_at           | TIMESTAMPTZ            | NOT NULL DEFAULT NOW()             |                                                   |
| updated_at           | TIMESTAMPTZ            | NOT NULL DEFAULT NOW()             |                                                   |

```sql
CREATE INDEX idx_pcp_rmr_collection ON pcp.raw_material_requirements (collection_id);
CREATE INDEX idx_pcp_rmr_material ON pcp.raw_material_requirements (raw_material_id);
CREATE INDEX idx_pcp_rmr_status ON pcp.raw_material_requirements (status);
CREATE INDEX idx_pcp_rmr_deadline ON pcp.raw_material_requirements (purchase_deadline) WHERE status = 'pending';
```

#### 3.3.11 pcp.cost_analyses

| Column              | Type          | Constraints                        | Description                                            |
| ------------------- | ------------- | ---------------------------------- | ------------------------------------------------------ |
| id                  | UUID          | PK, DEFAULT gen_random_uuid()      |                                                        |
| production_order_id | UUID          | NULL, FK pcp.production_orders(id) | Associated OP (nullable for standalone cost estimates) |
| sku_id              | UUID          | NOT NULL, FK erp.skus(id)          | Which SKU                                              |
| material_cost       | NUMERIC(10,2) | NOT NULL DEFAULT 0                 | Total raw material cost                                |
| labor_cost          | NUMERIC(10,2) | NOT NULL DEFAULT 0                 | Factory labor cost                                     |
| overhead_cost       | NUMERIC(10,2) | NOT NULL DEFAULT 0                 | Factory overhead, utilities, misc                      |
| total_cost          | NUMERIC(10,2) | NOT NULL DEFAULT 0                 | material + labor + overhead                            |
| cost_per_piece      | NUMERIC(10,2) | NOT NULL DEFAULT 0                 | total_cost / quantity                                  |
| quantity            | INTEGER       | NOT NULL, CHECK (quantity > 0)     | Units in this cost calculation                         |
| notes               | TEXT          | NULL                               |                                                        |
| calculated_by       | UUID          | NOT NULL, FK global.users(id)      | Who entered this cost analysis                         |
| created_at          | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()             |                                                        |
| updated_at          | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()             |                                                        |

```sql
CREATE INDEX idx_pcp_ca_order ON pcp.cost_analyses (production_order_id) WHERE production_order_id IS NOT NULL;
CREATE INDEX idx_pcp_ca_sku ON pcp.cost_analyses (sku_id);
```

#### 3.3.12 pcp.rework_orders

| Column              | Type              | Constraints                            | Description                                               |
| ------------------- | ----------------- | -------------------------------------- | --------------------------------------------------------- |
| id                  | UUID              | PK, DEFAULT gen_random_uuid()          |                                                           |
| production_order_id | UUID              | NOT NULL, FK pcp.production_orders(id) | Source OP                                                 |
| supplier_id         | UUID              | NULL, FK pcp.suppliers(id)             | Supplier doing the rework                                 |
| description         | TEXT              | NOT NULL                               | What needs to be fixed                                    |
| quantity            | INTEGER           | NOT NULL, CHECK (quantity > 0)         | Units needing rework                                      |
| status              | pcp.rework_status | NOT NULL DEFAULT 'pending'             | pending, sent_to_supplier, in_rework, returned, completed |
| sent_at             | DATE              | NULL                                   | Date sent to supplier                                     |
| expected_return     | DATE              | NULL                                   | Expected return date                                      |
| actual_return       | DATE              | NULL                                   | Actual return date                                        |
| cost                | NUMERIC(10,2)     | NULL                                   | Rework cost                                               |
| notes               | TEXT              | NULL                                   |                                                           |
| created_by          | UUID              | NOT NULL, FK global.users(id)          | Who created this rework order                             |
| created_at          | TIMESTAMPTZ       | NOT NULL DEFAULT NOW()                 |                                                           |
| updated_at          | TIMESTAMPTZ       | NOT NULL DEFAULT NOW()                 |                                                           |

```sql
CREATE INDEX idx_pcp_rw_order ON pcp.rework_orders (production_order_id);
CREATE INDEX idx_pcp_rw_supplier ON pcp.rework_orders (supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX idx_pcp_rw_status ON pcp.rework_orders (status);
```

#### 3.3.13 pcp.product_bom

Bill of Materials linking products to raw materials. Enables auto-calculation of material requirements from OP quantities and per-SKU material specs (resolves OQ5).

| Column          | Type          | Constraints                        | Description                                                                                 |
| --------------- | ------------- | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| id              | UUID          | PK, DEFAULT gen_random_uuid()      | UUID v7                                                                                     |
| product_id      | UUID          | NOT NULL, FK erp.products(id)      | Which product this BOM entry is for                                                         |
| raw_material_id | UUID          | NOT NULL, FK pcp.raw_materials(id) | Which raw material is required                                                              |
| qty_per_unit    | NUMERIC(10,4) | NOT NULL, CHECK (qty_per_unit > 0) | Quantity of raw material needed per unit produced (e.g., 3.0000 meters of fabric per shirt) |
| unit            | VARCHAR(20)   | NOT NULL                           | Unit of measurement (kg, m, un, etc.)                                                       |
| notes           | TEXT          | NULL                               | Optional notes (e.g., "includes 10% waste allowance")                                       |
| created_at      | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()             |                                                                                             |
| updated_at      | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()             |                                                                                             |
| deleted_at      | TIMESTAMPTZ   | NULL                               | Soft delete                                                                                 |

```sql
CREATE INDEX idx_pcp_bom_product ON pcp.product_bom (product_id);
CREATE INDEX idx_pcp_bom_material ON pcp.product_bom (raw_material_id);
CREATE UNIQUE INDEX idx_pcp_bom_unique ON pcp.product_bom (product_id, raw_material_id) WHERE deleted_at IS NULL;
```

#### 3.3.14 pcp.internal_votes

Team votes on products during the approval stage. Provides internal validation data before committing to production.

| Column              | Type            | Constraints                                              | Description                          |
| ------------------- | --------------- | -------------------------------------------------------- | ------------------------------------ |
| id                  | UUID            | PK, DEFAULT gen_random_uuid()                            | UUID v7                              |
| production_order_id | UUID            | NOT NULL, FK pcp.production_orders(id) ON DELETE CASCADE | Which OP is being voted on           |
| user_id             | UUID            | NOT NULL, FK global.users(id)                            | Who cast this vote                   |
| vote                | pcp.vote_choice | NOT NULL                                                 | yes, no, maybe                       |
| comment             | TEXT            | NULL                                                     | Optional comment explaining the vote |
| created_at          | TIMESTAMPTZ     | NOT NULL DEFAULT NOW()                                   |                                      |

```sql
CREATE INDEX idx_pcp_iv_order ON pcp.internal_votes (production_order_id);
CREATE INDEX idx_pcp_iv_user ON pcp.internal_votes (user_id);
CREATE UNIQUE INDEX idx_pcp_iv_unique ON pcp.internal_votes (production_order_id, user_id);
```

### 3.4 Cross-schema References

```
pcp.production_orders.sku_id           ──► erp.skus(id)
pcp.production_orders.created_by       ──► global.users(id)
pcp.production_stages.completed_by     ──► global.users(id)
pcp.supplier_contacts.contacted_by     ──► global.users(id)
pcp.supplier_ratings.rated_by          ──► global.users(id)
pcp.cost_analyses.calculated_by        ──► global.users(id)
pcp.cost_analyses.sku_id               ──► erp.skus(id)
pcp.rework_orders.created_by           ──► global.users(id)
pcp.product_bom.product_id             ──► erp.products(id)
pcp.product_bom.raw_material_id        ──► pcp.raw_materials(id)
pcp.internal_votes.production_order_id ──► pcp.production_orders(id)
pcp.internal_votes.user_id             ──► global.users(id)

erp.inventory.quantity_in_production   ◄── updated by PLM stage completion (stock_entry)
erp.skus.cost_price                    ◄── fed from pcp.cost_analyses.cost_per_piece
erp.inventory_movements                ◄── created on stock_entry completion (type = 'production_entry')
```

---

## 4. Screens & UI

All screens use the Ambaril dark-mode design system. Desktop-first for Tavares, with a mobile-optimized stock entry flow for Ana Clara.

### 4.1 Production Orders List

```
+------------------------------------------------------------------------------+
|  PLM > Ordens de Producao                              [+ Nova OP] [Filtros] |
+------------------------------------------------------------------------------+
|                                                                              |
|  Colecao: [Inverno 2026          v]  Status: [Todos     v]  Buscar: [____]  |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  | OP-001  Camiseta Preta Basic P             Prioridade: ALTA            |  |
|  | SKU: CIE-CAM-001-P  |  Qtd: 200  |  Drop 13                          |  |
|  |                                                                        |  |
|  | [concept][pattern][sample][approv][gradin][materi][cuttin][sewing]...   |  |
|  | [##████][########][########][########][########][>>>>>>][      ][    ]  |  |
|  |                                                                        |  |
|  | Estagio atual: CORTE (7/11)      Prazo: 25/04/2026                    |  |
|  | [========================================>..........] 63%              |  |
|  |                                                                        |  |
|  | [!] Margem de seguranca consumida no estagio "Costura"                |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  | OP-002  Moletom Oversized Drop 13 M        Prioridade: CRITICA         |  |
|  | SKU: CIE-MOL-003-M  |  Qtd: 150  |  Drop 13                          |  |
|  |                                                                        |  |
|  | [concept][pattern][sample][approv][gradin][materi][cuttin][sewing]...   |  |
|  | [########][########][########][########][>>>>>>][      ][      ][    ]  |  |
|  |                                                                        |  |
|  | Estagio atual: GRADUACAO (5/11)   Prazo: 20/04/2026                   |  |
|  | [=============================>.....................] 45%              |  |
|  |                                                                        |  |
|  | [!!] Estagio "Amostra" atrasado 2 dias                                |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  | OP-003  Calca Cargo Wide Leg G             Prioridade: MEDIA           |  |
|  | SKU: CIE-CRG-007-G  |  Qtd: 100  |  Drop 14                          |  |
|  |                                                                        |  |
|  | [concept][pattern][sample][approv][gradin][materi][cuttin][sewing]...   |  |
|  | [########][>>>>>>][      ][      ][      ][      ][      ][      ]     |  |
|  |                                                                        |  |
|  | Estagio atual: MODELAGEM (2/11)   Prazo: 15/05/2026                   |  |
|  | [=======>..........................................] 9%                 |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
|  Mostrando 1-10 de 24 OPs                        [< Anterior] [Proximo >]   |
+------------------------------------------------------------------------------+

Legend:
  [########] = completed stage (green)
  [>>>>>>]   = in progress stage (blue, animated)
  [      ]   = pending stage (dark/muted)
  [!]        = warning badge (yellow)
  [!!]       = critical badge (red)
```

### 4.2 Production Order Detail (Gantt Timeline)

```
+------------------------------------------------------------------------------+
|  PLM > OPs > OP-001: Camiseta Preta Basic P                [Editar] [Pausar]|
+------------------------------------------------------------------------------+
|                                                                              |
|  Status: EM ANDAMENTO    Prioridade: [ALTA]    SKU: CIE-CAM-001-P          |
|  Colecao: Inverno 2026   Drop: 13              Quantidade: 200 un           |
|  Criado por: Tavares em 01/03/2026                                          |
|  Prazo: 01/03/2026 - 25/04/2026    Margem de seguranca: 3 dias/estagio     |
|                                                                              |
|  TIMELINE DE PRODUCAO                                                        |
|  ===================                                                         |
|                                                                              |
|         Mar 01    Mar 08    Mar 15    Mar 22    Mar 29    Abr 05    Abr 12  |
|            |         |         |         |         |         |         |     |
|  1. Conceito                                                                 |
|     [########################################] 01/03 - 05/03  CONCLUIDO     |
|                                                                              |
|  2. Modelagem                                                                |
|     [########################################] 06/03 - 10/03  CONCLUIDO     |
|                                                                              |
|  3. Amostra                                                                  |
|     [########################################] 11/03 - 15/03  CONCLUIDO     |
|     Fornecedor: Confeccoes Silva                                             |
|                                                                              |
|  4. Aprovacao                                                                |
|     [########################################] 16/03 - 17/03  CONCLUIDO     |
|                                                                              |
|  5. Graduacao                                                                |
|     [########################################] 18/03 - 20/03  CONCLUIDO     |
|                                                                              |
|  6. Compra Materiais                                                         |
|     [########################################] 21/03 - 28/03  CONCLUIDO     |
|     Fornecedor: Tecelagem Nordeste                                           |
|                                                                              |
|  7. Corte                                                                    |
|     [>>>>>>>>>>>>>>>>>>.....................] 29/03 - 05/04  EM ANDAMENTO   |
|     Fornecedor: Confeccoes Silva                                             |
|                                                                              |
|  8. Costura                                                                  |
|     [                                      ] 06/04 - 12/04  PENDENTE       |
|     Fornecedor: Confeccoes Silva                                             |
|                                                                              |
|  9. Acabamento                                                               |
|     [                                      ] 13/04 - 16/04  PENDENTE       |
|                                                                              |
| 10. Controle Qualidade                                                       |
|     [                                      ] 17/04 - 20/04  PENDENTE       |
|                                                                              |
| 11. Entrada Estoque                                                          |
|     [                                      ] 21/04 - 22/04  PENDENTE       |
|                                                                              |
+------ Stage Actions ---------------------------------------------------------+
|                                                                              |
|  Estagio atual: 7. Corte                                                    |
|  [Concluir Estagio]  [Pular Estagio]  [Adicionar Nota]                     |
|                                                                              |
+------ Historico -------------------------------------------------------------+
|                                                                              |
|  22/03 14:30  Tavares concluiu "Compra Materiais"                           |
|               Nota: "Malha 30/1 entregue. Ziper atrasou 1 dia."            |
|  17/03 10:00  Tavares concluiu "Aprovacao"                                  |
|               Nota: "Caio aprovou amostra. Sem alteracoes."                 |
|  15/03 16:45  Tavares concluiu "Amostra"                                   |
|               Avaliacao Confeccoes Silva: Qualidade 4, Comunicacao 5        |
|  ...                                                                         |
|                                                                              |
+------ Custos ---------------------------------------------------------------+
|  Material: R$ 3.200,00  |  Mao de obra: R$ 2.800,00  |  Overhead: R$ 600,00|
|  Total: R$ 6.600,00     |  Custo/peca: R$ 33,00                            |
|                                                                              |
+------ Retrabalhos ----------------------------------------------------------+
|  Nenhum retrabalho registrado.    [+ Novo Retrabalho]                       |
+------------------------------------------------------------------------------+

Color coding:
  [####] Green  = Completed on time
  [####] Yellow = Completed, safety margin consumed
  [>>>>] Blue   = In progress
  [    ] Gray   = Pending
  [####] Red    = Overdue (not yet completed)
```

### 4.3 Create/Edit Production Order Form

```
+------------------------------------------------------------------------------+
|  PLM > OPs > Nova Ordem de Producao                                          |
+------------------------------------------------------------------------------+
|                                                                              |
|  INFORMACOES BASICAS                                                         |
|  --------------------                                                        |
|  Nome da OP:      [Camiseta Preta Basic P x200________________]             |
|  Descricao:       [Producao de 200 un camiseta preta basic____]             |
|                   [tamanho P para o Drop 13___________________]             |
|                                                                              |
|  Colecao:         [Inverno 2026                            v]               |
|  Drop (opcional): [Drop 13                                 v]               |
|  SKU:             [CIE-CAM-001-P - Camiseta Preta Basic P  v]               |
|  Quantidade:      [200_____]                                                 |
|  Prioridade:      ( ) Baixa  ( ) Media  (o) Alta  ( ) Critica               |
|                                                                              |
|  DATAS PLANEJADAS                                                            |
|  -----------------                                                           |
|  Inicio planejado:   [01/03/2026]                                           |
|  Fim planejado:      [25/04/2026]                                           |
|  Margem seguranca:   [3] dias por estagio                                   |
|                                                                              |
|  ATRIBUICAO DE FORNECEDORES POR ESTAGIO (opcional)                          |
|  ------------------------------------------------                           |
|   3. Amostra:           [Confeccoes Silva               v]                  |
|   6. Compra Materiais:  [Tecelagem Nordeste             v]                  |
|   7. Corte:             [Confeccoes Silva               v]                  |
|   8. Costura:           [Confeccoes Silva               v]                  |
|   9. Acabamento:        [-- Nenhum --                   v]                  |
|  (somente estagios que tipicamente envolvem fornecedor)                     |
|                                                                              |
|  DATAS POR ESTAGIO (auto-calculadas, editaveis)                             |
|  -----------------------------------------------                            |
|  |  #  | Estagio            | Inicio     | Fim        | Dias |             |
|  |-----|--------------------|------------|------------|------|             |
|  |  1  | Conceito           | 01/03/2026 | 05/03/2026 |   5  |             |
|  |  2  | Modelagem          | 06/03/2026 | 10/03/2026 |   5  |             |
|  |  3  | Amostra            | 11/03/2026 | 15/03/2026 |   5  |             |
|  |  4  | Aprovacao          | 16/03/2026 | 17/03/2026 |   2  |             |
|  |  5  | Graduacao          | 18/03/2026 | 20/03/2026 |   3  |             |
|  |  6  | Compra Materiais   | 21/03/2026 | 28/03/2026 |   8  |             |
|  |  7  | Corte              | 29/03/2026 | 05/04/2026 |   7  |             |
|  |  8  | Costura            | 06/04/2026 | 12/04/2026 |   7  |             |
|  |  9  | Acabamento         | 13/04/2026 | 16/04/2026 |   4  |             |
|  | 10  | Controle Qualidade | 17/04/2026 | 20/04/2026 |   4  |             |
|  | 11  | Entrada Estoque    | 21/04/2026 | 22/04/2026 |   2  |             |
|                                                                              |
|  Notas:           [________________________________________]                |
|                   [________________________________________]                |
|                                                                              |
|  [Cancelar]                                              [Salvar Rascunho]  |
|                                                       [Salvar e Iniciar]    |
+------------------------------------------------------------------------------+
```

### 4.4 Stage Advancement Dialog

```
+------------------------------------------------------+
|  Concluir Estagio: 7. Corte                     [X]  |
+------------------------------------------------------+
|                                                       |
|  OP: OP-001 Camiseta Preta Basic P                   |
|  Fornecedor neste estagio: Confeccoes Silva           |
|                                                       |
|  Planejado: 29/03 - 05/04                            |
|  Hoje: 04/04   [Dentro do prazo]                     |
|                                                       |
|  Notas de conclusao:                                  |
|  [Corte finalizado. 200 pecas cortadas.____]         |
|  [Nenhuma perda de material._______________]         |
|                                                       |
|  AVALIAR FORNECEDOR (Confeccoes Silva)               |
|  ------------------------------------                 |
|  Qualidade:     [*] [*] [*] [*] [ ]   4/5           |
|  Comunicacao:   [*] [*] [*] [*] [*]   5/5           |
|  Custo:         [*] [*] [*] [ ] [ ]   3/5           |
|  Entregou no prazo?   (o) Sim  ( ) Nao               |
|                                                       |
|  [Cancelar]                       [Concluir Estagio] |
+------------------------------------------------------+
```

### 4.5 Supplier List

```
+------------------------------------------------------------------------------+
|  PLM > Fornecedores                                   [+ Novo Fornecedor]    |
+------------------------------------------------------------------------------+
|                                                                              |
|  Tipo: [Todos          v]   Status: [Ativos   v]   Buscar: [_____________]  |
|                                                                              |
|  +--------+---------------------+-------------+-------+------+------+-----+ |
|  | Score  | Nome                | Tipo        | CNPJ  | Qual.| Com. |Atraso| |
|  +--------+---------------------+-------------+-------+------+------+-----+ |
|  | [92]   | Confeccoes Silva    | Faccao      | 12.34 | 4.3  | 4.7  | 0.5d| |
|  | ██████ |                     |             | 5.678 |      |      |     | |
|  +--------+---------------------+-------------+-------+------+------+-----+ |
|  | [78]   | Tecelagem Nordeste  | Tecelagem   | 23.45 | 3.8  | 3.5  | 2.1d| |
|  | █████  |                     |             | 6.789 |      |      |     | |
|  +--------+---------------------+-------------+-------+------+------+-----+ |
|  | [65]   | Estamparia Central  | Estamparia  | 34.56 | 4.0  | 3.0  | 3.8d| |
|  | ████   |                     |             | 7.890 |      |      | [!] | |
|  +--------+---------------------+-------------+-------+------+------+-----+ |
|  | [45]   | Tinturaria SP       | Tinturaria  | 45.67 | 2.5  | 2.8  | 5.2d| |
|  | ███    |                     |             | 8.901 |      |      | [!!]| |
|  +--------+---------------------+-------------+-------+------+------+-----+ |
|                                                                              |
|  Score colors: [90-100] green  [70-89] blue  [50-69] yellow  [0-49] red     |
|  [!] = 2+ late deliveries in last 5   [!!] = 3+ late in last 5              |
+------------------------------------------------------------------------------+
```

### 4.6 Supplier Detail

```
+------------------------------------------------------------------------------+
|  PLM > Fornecedores > Confeccoes Silva                         [Editar] [X]  |
+------------------------------------------------------------------------------+
|                                                                              |
|  INFORMACOES                          SCORE DE CONFIABILIDADE                |
|  ----------------                     -----------------------                |
|  Tipo: Faccao                         [==================> 92/100]           |
|  CNPJ: 12.345.678/0001-90                                                   |
|  Contato: Jose Silva                  Entregas no prazo:  87% (26/30)       |
|  Telefone: +55 11 98765-4321         Atraso medio:       0.5 dias           |
|  Email: jose@confsilva.com.br                                                |
|  Endereco: R. Industrial 456,        Qualidade:   [****-] 4.3              |
|    Bras, SP - 03012-000              Comunicacao: [*****] 4.7              |
|                                       Custo:       [***--] 3.2              |
|  Status: [Ativo]                                                             |
|                                                                              |
+------ Historico de OPs ------------------------------------------------------+
|                                                                              |
|  | OP       | SKU              | Estagio      | Status    | Prazo     |     |
|  |----------|------------------|--------------|-----------|-----------|     |
|  | OP-001   | CIE-CAM-001-P    | Corte        | Andamento | 05/04     |     |
|  | OP-001   | CIE-CAM-001-P    | Costura      | Pendente  | 12/04     |     |
|  | OP-002   | CIE-MOL-003-M    | Amostra      | Concluido | 10/03     |     |
|  | OP-005   | CIE-CAM-002-M    | Costura      | Concluido | 28/02     |     |
|  | ...      |                  |              |           |           |     |
|                                                                              |
+------ Avaliacoes Recentes ---------------------------------------------------+
|                                                                              |
|  OP-001, Amostra (15/03): Qual 4, Com 5, Custo 3, No prazo: Sim            |
|  OP-005, Costura (28/02): Qual 5, Com 5, Custo 3, No prazo: Sim            |
|  OP-004, Corte (15/02):   Qual 4, Com 4, Custo 4, No prazo: Nao (+1d)     |
|  ...                                                                         |
|                                                                              |
+------ Registro de Contatos --------------------------------------------------+
|                                                                              |
|  17/03 10:30 - Tavares: "Confirmei prazo do corte OP-001 por telefone"      |
|  10/03 14:00 - Tavares: "Enviamos tecido para amostra OP-001"              |
|  05/03 09:15 - Tavares: "Negociacao de preco para lote de 500 un"          |
|  ...                                                             [+ Contato] |
|                                                                              |
+------------------------------------------------------------------------------+
```

### 4.7 Raw Materials Inventory

```
+------------------------------------------------------------------------------+
|  PLM > Materia-Prima > Estoque                          [+ Novo Material]    |
+------------------------------------------------------------------------------+
|                                                                              |
|  Categoria: [Todas       v]   Status: [Ativos  v]   Buscar: [____________]  |
|                                                                              |
|  +----+-------------------------+----------+--------+---------+------+-----+ |
|  | ID | Material                | Categ.   | Unid.  | Disponiv| Reser| Sts | |
|  +----+-------------------------+----------+--------+---------+------+-----+ |
|  | 01 | Malha 30/1 Preta        | Tecido   | metros | 450.00  | 200  | OK  | |
|  | 02 | Malha 30/1 Branca       | Tecido   | metros | 120.00  | 300  | [!] | |
|  | 03 | Ziper YKK 20cm          | Aviament | un     | 800     | 350  | OK  | |
|  | 04 | Etiqueta Tecida CIENA   | Etiqueta | un     | 2000    | 500  | OK  | |
|  | 05 | Linha Preta Coats       | Linha    | metros | 50.00   | 200  | [!!]| |
|  | 06 | Embalagem Kraft 30x40   | Embalag  | un     | 1500    | 400  | OK  | |
|  | 07 | Malha Moletom Cinza     | Tecido   | metros | 0.00    | 150  | [!!]| |
|  +----+-------------------------+----------+--------+---------+------+-----+ |
|                                                                              |
|  [!]  = Disponivel < Reservado (estoque insuficiente para producao)          |
|  [!!] = Disponivel = 0 ou critico                                            |
+------------------------------------------------------------------------------+
```

### 4.8 Raw Material Requirements per Collection

```
+------------------------------------------------------------------------------+
|  PLM > Materia-Prima > Necessidades por Colecao                              |
+------------------------------------------------------------------------------+
|                                                                              |
|  Colecao: [Inverno 2026                                   v]                |
|  Lancamento planejado: 15/05/2026                                            |
|                                                                              |
|  +-------------------------+----------+----------+----------+--------+-----+ |
|  | Material                | Necessario| Em estoque| A comprar| Prazo  | Sts | |
|  +-------------------------+----------+----------+----------+--------+-----+ |
|  | Malha 30/1 Preta        | 600m     | 450m     | 150m     | 25/03  | [!] | |
|  | Malha 30/1 Branca       | 400m     | 120m     | 280m     | 25/03  | [!!]| |
|  | Malha Moletom Cinza     | 300m     | 0m       | 300m     | 20/03  | [!!]| |
|  | Ziper YKK 20cm          | 350 un   | 800 un   | 0        | --     | OK  | |
|  | Etiqueta Tecida CIENA   | 1200 un  | 2000 un  | 0        | --     | OK  | |
|  | Linha Preta Coats       | 500m     | 50m      | 450m     | 28/03  | [!!]| |
|  | Embalagem Kraft 30x40   | 800 un   | 1500 un  | 0        | --     | OK  | |
|  +-------------------------+----------+----------+----------+--------+-----+ |
|                                                                              |
|  Resumo: 3 materiais com compra pendente | 2 prazos vencendo esta semana    |
|                                                                              |
|  [Recalcular Necessidades]                          [Exportar Pedido Compra] |
+------------------------------------------------------------------------------+
```

### 4.9 Cost Analysis per SKU

```
+------------------------------------------------------------------------------+
|  PLM > Custos > CIE-CAM-001-P Camiseta Preta Basic P                        |
+------------------------------------------------------------------------------+
|                                                                              |
|  OP: OP-001  |  Quantidade: 200 un  |  Calculado por: Tavares em 20/03/2026|
|                                                                              |
|  +----------------------------------+                                        |
|  | CUSTO MATERIAL        R$ 3.200   |                                        |
|  | ================================ |                                        |
|  | Malha 30/1 Preta      R$ 2.400   |  (3m x R$ 4,00/m x 200 un)           |
|  | Etiqueta Tecida       R$ 200     |  (1 un x R$ 1,00 x 200 un)           |
|  | Linha Preta           R$ 100     |  (2.5m x R$ 0,20/m x 200 un)         |
|  | Embalagem Kraft       R$ 300     |  (1 un x R$ 1,50 x 200 un)           |
|  | Ziper YKK             R$ 200     |  (1 un x R$ 1,00 x 200 un)           |
|  +----------------------------------+                                        |
|  | MAO DE OBRA           R$ 2.800   |                                        |
|  | ================================ |                                        |
|  | Corte                 R$ 600     |  (R$ 3,00/peca)                        |
|  | Costura               R$ 1.600   |  (R$ 8,00/peca)                        |
|  | Acabamento            R$ 600     |  (R$ 3,00/peca)                        |
|  +----------------------------------+                                        |
|  | OVERHEAD              R$ 600     |                                        |
|  | ================================ |                                        |
|  | Transporte            R$ 300     |                                        |
|  | Outros                R$ 300     |                                        |
|  +----------------------------------+                                        |
|                                                                              |
|  +----------------------------------+                                        |
|  | TOTAL                 R$ 6.600   |                                        |
|  | CUSTO POR PECA        R$ 33,00   |                                        |
|  +----------------------------------+                                        |
|                                                                              |
|  --> Alimenta erp.skus.cost_price = R$ 33,00 para Calculadora de Margem     |
|                                                                              |
|  [Editar Custos]    [Comparar com OPs anteriores]    [Exportar]              |
+------------------------------------------------------------------------------+
```

### 4.10 Rework Orders List and Detail

```
+------------------------------------------------------------------------------+
|  PLM > Retrabalhos                                    [+ Novo Retrabalho]    |
+------------------------------------------------------------------------------+
|                                                                              |
|  +------+--------+--------------------------+--------+------+--------+-----+ |
|  | ID   | OP     | Descricao                | Qtd    | Forn.| Status | Ret.| |
|  +------+--------+--------------------------+--------+------+--------+-----+ |
|  | RW-01| OP-005 | Costura desalinhada      | 15 un  | Conf.| Retrab.| 10/4| |
|  |      |        | no ombro esquerdo        |        | Silva|        |     | |
|  +------+--------+--------------------------+--------+------+--------+-----+ |
|  | RW-02| OP-003 | Estampa desbotada        | 30 un  | Estam| Enviado| 15/4| |
|  |      |        | apos lavagem             |        | Centr|        |     | |
|  +------+--------+--------------------------+--------+------+--------+-----+ |
|                                                                              |
+------ Detail (RW-01) -------------------------------------------------------+
|                                                                              |
|  Retrabalho RW-01                                                            |
|  OP: OP-005 (CIE-CAM-002-M Camiseta Logo M)                                |
|  Fornecedor: Confeccoes Silva                                                |
|  Descricao: Costura desalinhada no ombro esquerdo em 15 pecas               |
|  Quantidade: 15 un de 200 un totais                                          |
|                                                                              |
|  Status: EM RETRABALHO                                                       |
|  Enviado em: 28/03/2026                                                      |
|  Retorno previsto: 10/04/2026                                                |
|  Retorno real: --                                                            |
|  Custo estimado: R$ 120,00 (R$ 8,00/peca)                                  |
|                                                                              |
|  [Marcar Retornado]  [Marcar Concluido]  [Editar]                           |
+------------------------------------------------------------------------------+
```

### 4.11 Collection Overview

```
+------------------------------------------------------------------------------+
|  PLM > Colecoes > Inverno 2026                              [Editar] [Novo] |
+------------------------------------------------------------------------------+
|                                                                              |
|  Status: ATIVA    Lancamento planejado: 15/05/2026    Temporada: inverno_26 |
|                                                                              |
|  RESUMO                                                                      |
|  +----------------+----------------+----------------+----------------+       |
|  | Total OPs      | No prazo       | Atrasadas      | Concluidas     |       |
|  |      24        |      18        |       4        |       2        |       |
|  |                | (75%)          | (17%)          | (8%)           |       |
|  +----------------+----------------+----------------+----------------+       |
|                                                                              |
|  DROPS                                                                       |
|  +-----------+----------+---------+---------+----------+                     |
|  | Drop      | OPs      | Concl.  | Atraso  | Lancament|                     |
|  +-----------+----------+---------+---------+----------+                     |
|  | Drop 13   | 12       | 1       | 2       | 15/04    |                     |
|  | Drop 14   | 8        | 0       | 1       | 01/05    |                     |
|  | Drop 15   | 4        | 1       | 1       | 15/05    |                     |
|  +-----------+----------+---------+---------+----------+                     |
|                                                                              |
|  OPs DESTA COLECAO                                                           |
|  +--------+---------------------+-----------+--------+----------+---------+  |
|  | OP     | SKU                 | Estagio   | Progr. | Status   | Prazo   |  |
|  +--------+---------------------+-----------+--------+----------+---------+  |
|  | OP-001 | CIE-CAM-001-P       | Corte     | 63%    | Andament | 25/04   |  |
|  | OP-002 | CIE-MOL-003-M       | Graduacao | 45%    | Andament | 20/04   |  |
|  | OP-003 | CIE-CRG-007-G       | Modelagem | 9%     | Andament | 15/05   |  |
|  | OP-004 | CIE-CAM-001-M       | Est.Entra | 100%   | Concl.   | 10/03   |  |
|  | ...    |                     |           |        |          |         |  |
|  +--------+---------------------+-----------+--------+----------+---------+  |
+------------------------------------------------------------------------------+
```

### 4.12 Internal Vote (on OP Detail Screen)

Displayed as a collapsible section within the OP detail view (4.2), between the Stage Actions and Historico sections. Only visible when the OP is at the `approval` stage or when `op_type = 'pilot'`.

```
+------ Votacao Interna ------------------------------------------------+
|                                                                        |
|  Minimo 3 votos necessarios   [3/9 votos recebidos]                  |
|                                                                        |
|  SEU VOTO                                                              |
|  ---------                                                             |
|  Voce compraria este produto?                                          |
|                                                                        |
|  [ SIM ]    [ NAO ]    [ TALVEZ ]                                     |
|   (green)    (red)     (yellow)                                        |
|                                                                        |
|  Comentario (opcional):                                                |
|  [________________________________________]                           |
|  [________________________________________]                           |
|                                                                        |
|  [Enviar Voto]                                                        |
|                                                                        |
|  RESUMO DE VOTOS                                                       |
|  ----------------                                                      |
|  +------+------+--------+                                             |
|  | Sim  | Nao  | Talvez |                                             |
|  |  5   |  2   |   1    |                                             |
|  +------+------+--------+                                             |
|                                                                        |
|  [████████████████████ 62%] Sim                                       |
|  [██████         25%      ] Nao                                       |
|  [███       13%           ] Talvez                                    |
|                                                                        |
|  HISTORICO DE VOTOS                                                    |
|  ------------------                                                    |
|  Marcus      | Sim    | 25/03 14:30 | "Silhueta forte, vai vender"   |
|  Caio        | Sim    | 25/03 14:15 | "Encaixa bem na linha inverno" |
|  Yuri        | Talvez | 25/03 13:45 | "Cor pode ser mais escura"     |
|  Sick        | Sim    | 25/03 13:30 |                                |
|  Slimgust    | Nao    | 25/03 13:00 | "Nao e o que o publico pede"  |
|  Pedro       | Sim    | 25/03 12:30 |                                |
|  Tavares     | Sim    | 25/03 12:00 |                                |
|  Ana Clara   | Nao    | 25/03 11:45 | "Dificil de embalar"          |
|                                                                        |
+------------------------------------------------------------------------+
```

### 4.13 Product Development Pipeline Dashboard

Kanban-style dashboard showing all concepts in different validation stages. Accessible to `pm` and `admin` roles.

```
+------------------------------------------------------------------------------+
|  PLM > Pipeline de Desenvolvimento                           [Filtros] [v]  |
+------------------------------------------------------------------------------+
|                                                                              |
|  Colecao: [Inverno 2026   v]  Temporada: [Todas  v]                        |
|                                                                              |
|  +----------+----------+----------+----------+----------+--------+---------+|
|  | CONCEITO | VOTACAO  | PREVIEW  | PILOTO   | DADOS DE | ESCALA |DESCONT. ||
|  |          | INTERNA  | SOCIAL   |          | VENDA    |        |         ||
|  |   (3)    |   (2)    |   (1)    |   (2)    |   (1)    |  (4)   |  (1)    ||
|  +----------+----------+----------+----------+----------+--------+---------+|
|  |          |          |          |          |          |        |         ||
|  | +------+ | +------+ | +------+ | +------+ | +------+ |+------+|+------+||
|  | |Camise| | |Moleto| | |Calca | | |Jaqueta| | |Bone  | ||Camise|||Camise|||
|  | |ta    | | |m Over| | |Cargo | | |Corta | | |Struct| ||ta Pr|||ta Li|||
|  | |Gola V| | |size  | | |Wide  | | |Vento | | |ured  | ||eta B|||nho  |||
|  | |      | | |      | | |      | | |      | | |      | ||asic |||     |||
|  | |[img] | | |[img] | | |[img] | | |[img] | | |[img] | ||[img]|||[img]|||
|  | |      | | |      | | |      | | |      | | |      | ||     |||     |||
|  | |Votos:| | |5S 2N | | |6S 1N | | |50 un | | |80 un | ||200un|||Sell-|||
|  | | --   | | |1T    | | |0T    | | |Sell:  | | |Sell:  | ||x3   |||thru:|||
|  | |      | | |      | | |      | | | 40%   | | | 75%  | ||     |||12%  |||
|  | +------+ | +------+ | +------+ | +------+ | +------+ |+------+|+------+||
|  |          |          |          |          |          |        |         ||
|  | +------+ | +------+ |          | +------+ |          |+------+|         ||
|  | |Bermu | | |Regata| |          | |Short | |          ||Moleto||         ||
|  | |da    | | |Mesh  | |          | |Tactel| |          ||m Cin||         ||
|  | |Cargo | | |      | |          | |      | |          ||za   ||         ||
|  | |[img] | | |[img] | |          | |[img] | |          ||[img]||         ||
|  | |Votos:| | |3S 1N | |          | |75 un | |          ||150un||         ||
|  | | --   | | |2T    | |          | |Sell:  | |          ||x5   ||         ||
|  | |      | | |      | |          | | 55%   | |          ||     ||         ||
|  | +------+ | +------+ |          | +------+ |          |+------+|         ||
|  |          |          |          |          |          |        |         ||
|  | +------+ |          |          |          |          |+------+|         ||
|  | |Corset| |          |          |          |          ||Calca ||         ||
|  | |Top   | |          |          |          |          ||Jeans ||         ||
|  | |[img] | |          |          |          |          ||[img] ||         ||
|  | |Votos:| |          |          |          |          ||300un ||         ||
|  | | --   | |          |          |          |          ||x2    ||         ||
|  | +------+ |          |          |          |          |+------+|         ||
|  +----------+----------+----------+----------+----------+--------+---------+|
|                                                                              |
|  Card legend:                                                                |
|    [img]  = Product image thumbnail                                          |
|    Votos  = Vote summary (S=Sim, N=Nao, T=Talvez). "--" = no votes yet     |
|    Sell   = Pilot sell-through % (only in Piloto/Dados de Venda columns)     |
|    NNNun  = Quantity produced. "xN" = scale factor applied                   |
|    Sell-through color: >=60% green (Campeao), 30-60% yellow, <30% red       |
|                                                                              |
|  Funil: 14 conceitos → 4 em escala (28% conversion)                        |
+------------------------------------------------------------------------------+

Notes:
- Drag-and-drop is NOT supported (validation gates are system-driven)
- Cards move automatically based on OP stage + vote count + pilot data
- Click card to open OP detail with full timeline
- Filter by collection, season, or product category
```

### 4.14 Mobile: Stock Entry Form (Ana Clara)

```
+--------------------------------------+
|  Ambaril            [=]   Ana Clara |
+--------------------------------------+
|                                      |
|  ENTRADA DE ESTOQUE                  |
|  ====================                |
|                                      |
|  Selecione a OP:                     |
|  +----------------------------------+|
|  | OP-001                           ||
|  | Camiseta Preta Basic P           ||
|  | 200 un | Drop 13                 ||
|  +----------------------------------+|
|  +----------------------------------+|
|  | OP-004                           ||
|  | Camiseta Preta Basic M           ||
|  | 150 un | Drop 13                 ||
|  +----------------------------------+|
|                                      |
+--------------------------------------+
|  (after selecting OP-001)            |
+--------------------------------------+
|                                      |
|  OP-001: Camiseta Preta Basic P     |
|  SKU: CIE-CAM-001-P                 |
|  Quantidade esperada: 200 un         |
|                                      |
|  Quantidade recebida:                |
|  +----------------------------------+|
|  |                                  ||
|  |            [ 200 ]               ||
|  |                                  ||
|  +----------------------------------+|
|                                      |
|  Notas (opcional):                   |
|  +----------------------------------+|
|  | Todas as pecas em bom estado    ||
|  +----------------------------------+|
|                                      |
|  +----------------------------------+|
|  |                                  ||
|  |     [  CONFIRMAR ENTRADA  ]      ||
|  |                                  ||
|  +----------------------------------+|
|                                      |
|  +----------------------------------+|
|  |        [  CANCELAR  ]            ||
|  +----------------------------------+|
|                                      |
+--------------------------------------+

Notes:
- Large touch targets (min 48px)
- Big number input field
- Prominent green confirm button
- Only shows OPs at QC-complete stage
  (ready for stock entry)
```

---

## 5. API Endpoints

All endpoints follow the patterns defined in [API.md](../../architecture/API.md). Module prefix: `/api/v1/pcp`.

### 5.1 Collections

| Method | Path                                                | Description                                             | Auth     | Permission                |
| ------ | --------------------------------------------------- | ------------------------------------------------------- | -------- | ------------------------- |
| GET    | `/collections`                                      | List collections (paginated, filterable by status/year) | Internal | `pcp:collections:read`    |
| GET    | `/collections/:id`                                  | Get collection detail with summary stats                | Internal | `pcp:collections:read`    |
| POST   | `/collections`                                      | Create new collection                                   | Internal | `pcp:collections:write`   |
| PATCH  | `/collections/:id`                                  | Update collection                                       | Internal | `pcp:collections:write`   |
| DELETE | `/collections/:id`                                  | Archive collection (soft)                               | Internal | `pcp:collections:delete`  |
| GET    | `/collections/:id/overview`                         | Collection overview with all OPs and status summary     | Internal | `pcp:collections:read`    |
| GET    | `/collections/:id/requirements`                     | Material requirements for this collection               | Internal | `pcp:raw-materials:read`  |
| POST   | `/collections/:id/actions/recalculate-requirements` | Recalculate material needs                              | Internal | `pcp:raw-materials:write` |

### 5.2 Drops

| Method | Path                     | Description                 | Auth     | Permission               |
| ------ | ------------------------ | --------------------------- | -------- | ------------------------ |
| GET    | `/collections/:id/drops` | List drops for a collection | Internal | `pcp:collections:read`   |
| GET    | `/drops/:id`             | Get drop detail             | Internal | `pcp:collections:read`   |
| POST   | `/collections/:id/drops` | Create drop in collection   | Internal | `pcp:collections:write`  |
| PATCH  | `/drops/:id`             | Update drop                 | Internal | `pcp:collections:write`  |
| DELETE | `/drops/:id`             | Delete drop                 | Internal | `pcp:collections:delete` |

### 5.3 Production Orders

| Method | Path                                    | Description                                                             | Auth     | Permission                     |
| ------ | --------------------------------------- | ----------------------------------------------------------------------- | -------- | ------------------------------ |
| GET    | `/production-orders`                    | List all OPs (paginated, filterable by collection/drop/status/priority) | Internal | `pcp:production-orders:read`   |
| GET    | `/production-orders/:id`                | Get OP detail with stages, costs, rework                                | Internal | `pcp:production-orders:read`   |
| POST   | `/production-orders`                    | Create new OP (auto-creates 11 stages)                                  | Internal | `pcp:production-orders:write`  |
| PATCH  | `/production-orders/:id`                | Update OP metadata (name, dates, priority, notes)                       | Internal | `pcp:production-orders:write`  |
| DELETE | `/production-orders/:id`                | Cancel OP                                                               | Internal | `pcp:production-orders:delete` |
| POST   | `/production-orders/:id/actions/pause`  | Pause OP with reason                                                    | Internal | `pcp:production-orders:write`  |
| POST   | `/production-orders/:id/actions/resume` | Resume paused OP                                                        | Internal | `pcp:production-orders:write`  |

### 5.4 Production Stages

| Method | Path                            | Description                                                    | Auth     | Permission                   |
| ------ | ------------------------------- | -------------------------------------------------------------- | -------- | ---------------------------- |
| GET    | `/production-orders/:id/stages` | List all 11 stages for an OP                                   | Internal | `pcp:production-orders:read` |
| GET    | `/stages/:id`                   | Get single stage detail                                        | Internal | `pcp:production-orders:read` |
| PATCH  | `/stages/:id`                   | Update stage (dates, supplier, notes)                          | Internal | `pcp:stages:write`           |
| POST   | `/stages/:id/actions/start`     | Mark stage as in_progress                                      | Internal | `pcp:stages:write`           |
| POST   | `/stages/:id/actions/complete`  | Mark stage as completed (with notes, optional supplier rating) | Internal | `pcp:stages:write`           |
| POST   | `/stages/:id/actions/skip`      | Skip stage with mandatory reason                               | Internal | `pcp:stages:write`           |

### 5.5 Suppliers

| Method | Path                                       | Description                                                  | Auth     | Permission             |
| ------ | ------------------------------------------ | ------------------------------------------------------------ | -------- | ---------------------- |
| GET    | `/suppliers`                               | List suppliers (filterable by type, status, score range)     | Internal | `pcp:suppliers:read`   |
| GET    | `/suppliers/:id`                           | Get supplier detail with ratings, order history, contact log | Internal | `pcp:suppliers:read`   |
| POST   | `/suppliers`                               | Create new supplier                                          | Internal | `pcp:suppliers:write`  |
| PATCH  | `/suppliers/:id`                           | Update supplier info                                         | Internal | `pcp:suppliers:write`  |
| DELETE | `/suppliers/:id`                           | Soft-delete supplier                                         | Internal | `pcp:suppliers:delete` |
| GET    | `/suppliers/:id/ratings`                   | List all ratings for a supplier                              | Internal | `pcp:suppliers:read`   |
| POST   | `/suppliers/:id/ratings`                   | Submit a rating for a supplier (after stage completion)      | Internal | `pcp:suppliers:write`  |
| GET    | `/suppliers/:id/contacts`                  | List contact log entries                                     | Internal | `pcp:suppliers:read`   |
| POST   | `/suppliers/:id/contacts`                  | Log a contact interaction                                    | Internal | `pcp:suppliers:write`  |
| POST   | `/suppliers/:id/actions/recalculate-score` | Force recalculate reliability score                          | Internal | `pcp:suppliers:write`  |

### 5.6 Raw Materials

| Method | Path                                     | Description                              | Auth     | Permission                 |
| ------ | ---------------------------------------- | ---------------------------------------- | -------- | -------------------------- |
| GET    | `/raw-materials`                         | List all raw materials with stock levels | Internal | `pcp:raw-materials:read`   |
| GET    | `/raw-materials/:id`                     | Get raw material detail with stock info  | Internal | `pcp:raw-materials:read`   |
| POST   | `/raw-materials`                         | Create new raw material                  | Internal | `pcp:raw-materials:write`  |
| PATCH  | `/raw-materials/:id`                     | Update raw material info                 | Internal | `pcp:raw-materials:write`  |
| DELETE | `/raw-materials/:id`                     | Deactivate raw material                  | Internal | `pcp:raw-materials:delete` |
| GET    | `/raw-materials/:id/stock`               | Get stock record for a material          | Internal | `pcp:raw-materials:read`   |
| POST   | `/raw-materials/:id/stock/actions/entry` | Record stock entry (inbound)             | Internal | `pcp:raw-materials:write`  |
| POST   | `/raw-materials/:id/stock/actions/exit`  | Record stock exit (consumption)          | Internal | `pcp:raw-materials:write`  |

### 5.7 Raw Material Requirements

| Method | Path                | Description                                              | Auth     | Permission                 |
| ------ | ------------------- | -------------------------------------------------------- | -------- | -------------------------- |
| GET    | `/requirements`     | List all requirements (filterable by collection, status) | Internal | `pcp:raw-materials:read`   |
| GET    | `/requirements/:id` | Get single requirement detail                            | Internal | `pcp:raw-materials:read`   |
| POST   | `/requirements`     | Create requirement manually                              | Internal | `pcp:raw-materials:write`  |
| PATCH  | `/requirements/:id` | Update requirement (quantity, deadline, status)          | Internal | `pcp:raw-materials:write`  |
| DELETE | `/requirements/:id` | Delete requirement                                       | Internal | `pcp:raw-materials:delete` |

### 5.8 Cost Analyses

| Method | Path                                     | Description                                | Auth     | Permission         |
| ------ | ---------------------------------------- | ------------------------------------------ | -------- | ------------------ |
| GET    | `/cost-analyses`                         | List cost analyses (filterable by SKU, OP) | Internal | `pcp:costs:read`   |
| GET    | `/cost-analyses/:id`                     | Get cost analysis detail                   | Internal | `pcp:costs:read`   |
| POST   | `/cost-analyses`                         | Create cost analysis for an OP/SKU         | Internal | `pcp:costs:write`  |
| PATCH  | `/cost-analyses/:id`                     | Update cost analysis                       | Internal | `pcp:costs:write`  |
| DELETE | `/cost-analyses/:id`                     | Delete cost analysis                       | Internal | `pcp:costs:delete` |
| POST   | `/cost-analyses/:id/actions/sync-to-erp` | Push cost_per_piece to erp.skus.cost_price | Internal | `pcp:costs:write`  |

### 5.9 Rework Orders

| Method | Path                                  | Description                                             | Auth     | Permission          |
| ------ | ------------------------------------- | ------------------------------------------------------- | -------- | ------------------- |
| GET    | `/rework-orders`                      | List rework orders (filterable by OP, supplier, status) | Internal | `pcp:rework:read`   |
| GET    | `/rework-orders/:id`                  | Get rework order detail                                 | Internal | `pcp:rework:read`   |
| POST   | `/rework-orders`                      | Create rework order                                     | Internal | `pcp:rework:write`  |
| PATCH  | `/rework-orders/:id`                  | Update rework order                                     | Internal | `pcp:rework:write`  |
| DELETE | `/rework-orders/:id`                  | Delete rework order                                     | Internal | `pcp:rework:delete` |
| POST   | `/rework-orders/:id/actions/send`     | Mark as sent to supplier                                | Internal | `pcp:rework:write`  |
| POST   | `/rework-orders/:id/actions/return`   | Mark as returned from supplier                          | Internal | `pcp:rework:write`  |
| POST   | `/rework-orders/:id/actions/complete` | Mark rework as completed                                | Internal | `pcp:rework:write`  |

### 5.10 Internal Event Receivers

| Method | Path                             | Description                                                          | Auth               |
| ------ | -------------------------------- | -------------------------------------------------------------------- | ------------------ |
| POST   | `/internal/stock-entry-complete` | Called when stock_entry stage completes; triggers ERP inventory sync | Service-to-service |

---

## 6. Business Rules

### 6.1 Production Stages (R1-R9)

| #   | Rule                                                  | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Auto-create 11 stages**                             | When a new production order is created, the system MUST automatically create exactly 11 `pcp.production_stages` rows with `stage_type` and `sequence` values: 1=concept, 2=pattern, 3=sample, 4=approval, 5=size_grading, 6=material_purchase, 7=cutting, 8=sewing, 9=finishing, 10=qc, 11=stock_entry. All stages start with `status=pending`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| R2  | **Sequential completion with conditional regression** | Stages MUST be completed in sequence order. A stage with `sequence=N` cannot be marked `completed` or `in_progress` unless all stages with `sequence < N` are `completed` or `skipped`. Stages can be skipped (with a mandatory reason stored in `notes`). **Stage regression (retrocesso) IS permitted** under the following conditions: (1) A mandatory `regression_reason` must be provided and stored in the audit log. (2) All downstream stages after the regression target are reset to `pending` with their `actual_start` and `actual_end` cleared. (3) The system recalculates `planned_start` and `planned_end` for all affected downstream stages based on original stage durations. (4) A `regression_count` counter is incremented on the parent OP (tracked in `pcp.production_orders.regression_count`). (5) Flare event `production.stage_regression` is emitted with regression reason, source stage, and target stage. Common use case: pilot sample rejected → regression to `pattern` or `sample` stage (repilotagem). See section 13.2 for full regression rules. |
| R3  | **Safety margin consumption**                         | When a stage is completed and `actual_end > planned_end`, the system MUST set `safety_margin_consumed = true` on that stage. This indicates the stage ran late and consumed the buffer built into the timeline.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| R4  | **Alert Tier 1 — Safety margin consumed**             | When `safety_margin_consumed = true` on a stage AND the next sequential stage has not yet started (`status = pending`), emit Flare event `production.safety_margin_consumed`. Channels: in-app notification to `operations` role + Discord `#alertas` channel broadcast. Priority: high.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| R5  | **Alert Tier 2 — Deadline tomorrow**                  | When a stage has `status IN (pending, in_progress)` AND `planned_end = CURRENT_DATE + 1` (deadline is tomorrow) AND the stage is not complete, emit Flare event `production.deadline_tomorrow`. Channels: in-app to `operations` + Discord `#alertas` with @tavares mention. Priority: high.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| R6  | **Alert Tier 3 — Deadline overdue**                   | When a stage has `status IN (pending, in_progress)` AND `planned_end < CURRENT_DATE` (deadline has passed) AND the stage is not complete, emit Flare event `production.deadline_overdue`. Channels: in-app to `operations` and `pm` + Discord `#alertas` with @tavares AND @caio mentions. Priority: critical. Additionally, the production order's `priority` is automatically escalated to `critical` if not already.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| R7  | **Auto-advance current_stage**                        | When a stage is marked as `completed`, the system MUST update the parent `pcp.production_orders.current_stage` to the `stage_type` of the next non-skipped, non-completed stage in sequence. If the completed stage is the last one (stock_entry), set `current_stage = 'stock_entry'` and proceed to R8.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| R8  | **OP completion on last stage**                       | When the last stage (`stock_entry`, sequence=11) is marked `completed`, the system MUST: (1) Set `production_orders.status = 'completed'`. (2) Set `production_orders.actual_end_date = CURRENT_DATE`. (3) Trigger the ERP inventory sync per R9. (4) Emit Flare event `production.completed`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| R9  | **Stock entry triggers ERP inventory sync**           | When the `stock_entry` stage is completed, the system MUST execute the following in a database transaction: (1) `UPDATE erp.inventory SET quantity_in_production = quantity_in_production - :quantity WHERE sku_id = :sku_id`. (2) `UPDATE erp.inventory SET quantity_available = quantity_available + :quantity WHERE sku_id = :sku_id`. (3) `INSERT INTO erp.inventory_movements (sku_id, movement_type, quantity, reference_type, reference_id) VALUES (:sku_id, 'production_entry', :quantity, 'production_order', :production_order_id)`. This ensures finished goods are reflected in the ERP inventory immediately.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

### 6.2 Production Order Lifecycle (R10-R14)

| #   | Rule                          | Detail                                                                                                                                                                                                                        |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R10 | **Draft to in_progress**      | When a draft OP's first stage is started (concept set to `in_progress`), the OP's `status` changes from `draft` to `in_progress` and `actual_start_date` is set to `CURRENT_DATE`.                                            |
| R11 | **Pause with reason**         | When an OP is paused, all currently `in_progress` stages are frozen (status stays `in_progress` but no deadline alerts fire for paused OPs). A note with the pause reason is required.                                        |
| R12 | **Resume updates deadlines**  | When a paused OP is resumed, the system SHOULD offer to shift all remaining stage `planned_start` and `planned_end` dates forward by the number of days the OP was paused.                                                    |
| R13 | **Cancellation restrictions** | An OP can only be cancelled if it has no completed stages with ERP inventory impact (i.e., stock_entry was not completed). Cancelling an OP sets `status = cancelled` on the OP and all pending/in_progress stages.           |
| R14 | **Priority escalation**       | When an OP has 2 or more stages with `safety_margin_consumed = true`, the system SHOULD automatically escalate the OP's `priority` by one level (e.g., medium to high, high to critical). Already-critical OPs stay critical. |

### 6.3 Pilot Production Rules (R-PILOT)

| #         | Rule                            | Detail                                                                                                                                                                                                                                                                                                                                                                                   |
| --------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-PILOT.1 | **Pilot qty range**             | Pilot OPs (`op_type = 'pilot'`) have a fixed quantity between 50-100 units. The exact range is configurable per product category (e.g., camisetas default 75, moletons default 50). Enforced by `CHECK (pilot_qty BETWEEN 50 AND 100)` on the `pcp.production_orders` table. When `op_type = 'pilot'`, `quantity` MUST equal `pilot_qty`.                                                |
| R-PILOT.2 | **Pilot stage skipping**        | Pilot lots enter the standard 11-stage pipeline but MAY skip the `cutting` (stage 7) and `sewing` (stage 8) stages if using supplier-managed production (i.e., the supplier handles cut+sew as a single service). When skipping, the standard skip-with-reason rule (R2) applies. The skip reason is auto-populated: "Piloto com producao terceirizada (corte+costura pelo fornecedor)". |
| R-PILOT.3 | **Post-stock-entry monitoring** | After a pilot lot completes the `stock_entry` stage (stage 11) and enters `erp.inventory`, the system begins monitoring sales velocity. The monitoring window is 48h-72h from the `stock_entry` completion timestamp (`production_stages.actual_end` where `stage_type = 'stock_entry'`). Sales data is read from `erp.order_items` matching the pilot OP's `sku_id`.                    |
| R-PILOT.4 | **Champion threshold**          | If pilot sells >= 60% of `pilot_qty` within 48h of stock entry → system sets `pilot_status = 'champion'` on the OP and emits Flare event `production.pilot_champion` with suggested full-scale OP details (BOM pre-calculated via `pcp.product_bom`). Notification: "SKU {name} identificado como Campeao. Sugestao: OP de {qty} unidades. Materia-prima disponivel: {sim/parcial/nao}". |
| R-PILOT.5 | **Discontinue threshold**       | If pilot sells < 30% of `pilot_qty` within 72h of stock entry → system sets `pilot_status = 'discontinue'` on the OP and emits Flare event `production.pilot_discontinue`. Notification: "SKU {name} com sell-through de {pct}% em 72h. Status: Descontinuar quando zerar estoque."                                                                                                      |
| R-PILOT.6 | **Monitor threshold**           | If pilot sells between 30-60% within 72h → system sets `pilot_status = 'monitoring'`. No immediate action. System re-evaluates after 7 days. If still below 60%, status changes to `discontinue`. If it crosses 60%, status changes to `champion`.                                                                                                                                       |

### 6.4 Champion Detection & Auto-OP Suggestion (R-CHAMPION)

| #            | Rule                                | Detail                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CHAMPION.1 | **BOM requirement calculation**     | When a pilot SKU reaches `champion` status, the system calculates BOM requirements by querying `pcp.product_bom` for the product and multiplying `qty_per_unit` by the suggested full-scale quantity. Result is a material requirements preview shown in the champion notification.                                                                                                                                                 |
| R-CHAMPION.2 | **Suggested qty formula**           | `suggested_qty = pilot_qty × scale_factor`. The `scale_factor` defaults to 10 (stored in `production_orders.pilot_scale_factor`) and is configurable per OP at creation time. Example: pilot of 75 units × 10 = 750 units suggested for full-scale.                                                                                                                                                                                 |
| R-CHAMPION.3 | **Raw material availability check** | System checks current `pcp.raw_material_stock.quantity_available` against the BOM requirements for the suggested quantity. Status reported as: `sim` (all materials available), `parcial` (some materials available, some need ordering), `nao` (critical materials unavailable). Each material's gap is listed in the notification detail.                                                                                         |
| R-CHAMPION.4 | **Champion notification**           | Notification sent to Tavares (`operations` role) via in-app and Discord `#alertas`: "SKU {sku_name} identificado como Campeao. Sugestao: OP de {suggested_qty} unidades. Materia-prima disponivel: {sim/parcial/nao}". Includes a deep link to the pilot OP detail with a "Criar OP em Escala" action button.                                                                                                                       |
| R-CHAMPION.5 | **Tavares action options**          | On the pilot OP detail, Tavares sees three options: (1) **Aprovar** — creates a new standard OP with `quantity = suggested_qty` and the same SKU, collection, and drop. BOM-based material requirements are auto-created. (2) **Modificar** — opens OP creation form pre-filled with suggested values, allowing qty adjustment. (3) **Descartar** — dismisses the suggestion with a mandatory reason. Action logged in OP timeline. |

### 6.5 Product Validation Workflow — 4 Layers (R-VALIDATION)

| #              | Rule                         | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-VALIDATION.1 | **Layer 1 — Internal Vote**  | During the `approval` stage (stage 4), team members can vote on the product: `yes`, `no`, or `maybe`, with an optional comment. Each user can vote once per OP (enforced by UNIQUE constraint on `production_order_id, user_id` in `pcp.internal_votes`). Minimum 3 votes required before the approval stage can be completed. Results displayed as summary (e.g., "5 sim, 2 nao, 1 talvez") on the OP detail page. Voting is available to all internal roles (`admin`, `pm`, `creative`, `operations`, `support`, `finance`, `commercial`). |
| R-VALIDATION.2 | **Layer 2 — Social Preview** | After internal vote passes (majority `yes`), PM (Caio) posts a teaser on Instagram Stories with poll/reaction tracking. Results are manually entered into the system: total views, positive reactions count, negative reactions count, and optional screenshots (uploaded to DAM). Stored as a note on the OP timeline with tag `social_preview`. No automated integration — manual entry only (Instagram API does not expose Stories poll data reliably).                                                                                   |
| R-VALIDATION.3 | **Layer 3 — Pilot Lot**      | If social preview results are positive (PM's judgment call), Tavares creates a pilot OP (`op_type = 'pilot'`, `pilot_qty` between 50-100). Pilot follows the standard production pipeline per R-PILOT rules. Pilot completion triggers the 48-72h sales monitoring window.                                                                                                                                                                                                                                                                   |
| R-VALIDATION.4 | **Layer 4 — Sales Data**     | System monitors sell-through rate during the 48-72h window. Thresholds per R-PILOT.4/R-PILOT.5/R-PILOT.6 trigger automatic status classification: Campeao (>=60% in 48h), Monitorar (30-60% in 72h), or Descontinuar (<30% in 72h). Each threshold crossing is logged in the OP timeline with timestamp, calculated sell-through %, and resulting status.                                                                                                                                                                                    |
| R-VALIDATION.5 | **Checkpoint tracking**      | Each validation layer is tracked as an entry in the OP timeline (via `global.audit_logs`) with: timestamp, responsible user (who completed the checkpoint), layer identifier (internal_vote / social_preview / pilot_lot / sales_data), outcome (passed / failed / monitoring), and relevant data payload (vote summary / social metrics / sell-through %). The Product Development Pipeline dashboard (4.13) reads these checkpoints to position cards in the correct column.                                                               |

### 6.6 Supplier Management (R15-R22)

| #   | Rule                               | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R15 | **CNPJ validation**                | Supplier CNPJ must pass the Brazilian check-digit algorithm (2 verification digits). Invalid CNPJs are rejected at the API level via Zod schema. Format: `00.000.000/0000-00`.                                                                                                                                                                                                                                                                                                              |
| R16 | **CNPJ uniqueness**                | No two active (non-deleted) suppliers can have the same CNPJ.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| R17 | **Soft delete**                    | Supplier deletion sets `deleted_at`. Soft-deleted suppliers are excluded from queries and dropdown selections but remain linked to historical production stages and ratings.                                                                                                                                                                                                                                                                                                                |
| R18 | **Rating prompts**                 | After a production stage involving a supplier (i.e., `assigned_supplier_id IS NOT NULL`) is marked complete, the UI MUST prompt the user to rate that supplier. The rating is optional but strongly encouraged. Skipping dismisses the dialog; the stage completion proceeds regardless.                                                                                                                                                                                                    |
| R19 | **Rating aggregation**             | When a new `pcp.supplier_ratings` row is inserted, the system MUST recalculate the supplier's aggregate ratings: `quality_rating = AVG(all ratings.quality)`, `communication_rating = AVG(all ratings.communication)`, `cost_rating = AVG(all ratings.cost)`, `on_time_deliveries = COUNT(ratings WHERE on_time = true)`, `total_orders = COUNT(ratings)`, `avg_delay_days = AVG(ratings.delay_days WHERE delay_days IS NOT NULL)`.                                                         |
| R20 | **Reliability score formula**      | `reliability_score` is calculated as: `(on_time_rate * 40) + (quality_avg_scaled * 30) + (communication_avg_scaled * 20) + (cost_avg_scaled * 10)` where: `on_time_rate = (on_time_deliveries / total_orders) * 100` (0-100), `quality_avg_scaled = (quality_rating / 5) * 100` (0-100), `communication_avg_scaled = (communication_rating / 5) * 100` (0-100), `cost_avg_scaled = (cost_rating / 5) * 100` (0-100). The weights sum to 100. New suppliers with zero ratings default to 50. |
| R21 | **Post-OP supplier rating prompt** | After an entire OP is completed (all stages done), if the OP involved suppliers, the system emits a reminder for Tavares to rate each supplier used in the OP. This is in addition to the per-stage prompts (R18).                                                                                                                                                                                                                                                                          |
| R22 | **Late delivery pattern alert**    | The system MUST check after each rating insertion: if a supplier has been late (on_time = false) on 3 or more of their last 5 ratings, emit Flare event `supplier.delivery_late` with message "Fornecedor {name} atrasou {count} das ultimas 5 entregas". Channels: in-app to `operations` + Discord `#alertas`.                                                                                                                                                                            |

### 6.7 Raw Materials (R23-R27)

| #   | Rule                              | Detail                                                                                                                                                                                                                                                                                                                                  |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R23 | **Stock tracking**                | Every raw material has exactly one `pcp.raw_material_stock` record (1:1 relationship, enforced by UNIQUE on `raw_material_id`). The stock record is auto-created when the raw material is created, initialized to 0 available and 0 reserved.                                                                                           |
| R24 | **Stock entry updates**           | When raw material stock is received (via stock entry endpoint or Ana Clara's mobile form), update `quantity_available += received_quantity` and set `last_entry_at = NOW()`.                                                                                                                                                            |
| R25 | **Purchase deadline calculation** | `purchase_deadline = collection.planned_launch - total_production_lead_time - material.lead_time_days`. Where `total_production_lead_time` is the sum of planned durations for stages 6 (material_purchase) through 11 (stock_entry) for the relevant OP. This ensures materials arrive before the production stages that consume them. |
| R26 | **Quantity to purchase**          | `quantity_to_purchase = MAX(0, quantity_needed - quantity_available)`. If `quantity_available >= quantity_needed`, `quantity_to_purchase = 0` and status stays `pending` with no alert. If `quantity_to_purchase > 0`, the requirement is flagged for action.                                                                           |
| R27 | **Low stock alert**               | When `quantity_available < quantity_needed` for a raw material required by an upcoming collection (collection.status = 'active'), the system emits an alert. If `purchase_deadline <= CURRENT_DATE + 7` (due within a week), priority is `high`. If `purchase_deadline < CURRENT_DATE` (overdue), priority is `critical`.               |

### 6.8 Cost Analysis (R28-R32)

| #   | Rule                         | Detail                                                                                                                                                                                                                                                                |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R28 | **Total cost calculation**   | `total_cost = material_cost + labor_cost + overhead_cost`. This is enforced at the application level (not a database constraint) and recalculated on every save.                                                                                                      |
| R29 | **Cost per piece**           | `cost_per_piece = total_cost / quantity`. Division by zero is prevented by the `CHECK (quantity > 0)` constraint on the table.                                                                                                                                        |
| R30 | **ERP cost sync**            | When a cost analysis is finalized (via the "sync to ERP" action), the system updates `erp.skus.cost_price = cost_per_piece` for the associated SKU. This feeds the Margin Calculator in the ERP module, which calculates `gross_margin = selling_price - cost_price`. |
| R31 | **Cost comparison**          | The system SHOULD support comparing costs between different production orders for the same SKU, and between different suppliers for the same service type. This data helps Tavares negotiate better prices.                                                           |
| R32 | **Historical cost tracking** | Cost analyses are never deleted — they form a historical record of production costs over time. Multiple cost analyses can exist for the same SKU (from different OPs), allowing trend analysis.                                                                       |

### 6.9 Rework (R33-R37)

| #   | Rule                           | Detail                                                                                                                                                                                                                                        |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R33 | **Rework status flow**         | Status must follow the sequence: `pending` -> `sent_to_supplier` -> `in_rework` -> `returned` -> `completed`. No backwards transitions. `sent_at` is set when moving to `sent_to_supplier`. `actual_return` is set when moving to `returned`. |
| R34 | **Rework cost impact**         | When a rework order's cost is set and the rework is completed, the cost SHOULD be added to the parent OP's total cost tracking (visible in the cost analysis section of the OP detail).                                                       |
| R35 | **Rework quantity validation** | `rework_orders.quantity` cannot exceed `production_orders.quantity` for the parent OP.                                                                                                                                                        |
| R36 | **Overdue rework alert**       | When `expected_return < CURRENT_DATE` and `status IN ('sent_to_supplier', 'in_rework')`, the system emits an alert to `operations` via in-app and Discord.                                                                                    |
| R37 | **Rework supplier tracking**   | Rework orders count against a supplier's reliability. Frequent rework from the same supplier negatively impacts their quality rating and should be visible in the supplier detail view.                                                       |

---

## 7. Integrations

### 7.1 ERP Module

| Direction  | Data / Action                 | Trigger                     | Detail                                                                                                                         |
| ---------- | ----------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| PLM -> ERP | Inventory sync on stock_entry | Stage 11 completed          | R9: Decrement `quantity_in_production`, increment `quantity_available`, create `inventory_movement` of type `production_entry` |
| PLM -> ERP | Cost price sync               | Manual "sync to ERP" action | R30: Update `erp.skus.cost_price` with `cost_per_piece` from latest cost analysis                                              |
| ERP -> PLM | SKU data                      | OP creation                 | PLM reads `erp.skus` to populate SKU dropdown and validate `sku_id`                                                            |
| ERP -> PLM | Inventory data                | Cost analysis               | PLM reads `erp.inventory` for current stock context                                                                            |

### 7.2 Tarefas Module

| Direction      | Data / Action              | Trigger                          | Detail                                                                                                                                                                                                      |
| -------------- | -------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PLM -> Tarefas | Auto-create task per stage | OP creation or stage advancement | When a stage transitions to `in_progress`, optionally create a corresponding task in `tarefas.tasks` assigned to Tavares, with due date = stage `planned_end`. Task title: "PLM: {stage_name} - {OP_name}". |
| PLM -> Tarefas | Auto-complete task         | Stage completion                 | When a stage is marked `completed`, auto-complete the corresponding task in Tarefas.                                                                                                                        |

### 7.3 Dashboard Module

| Direction        | Data / Action  | Trigger              | Detail                                                                                                                                                                                                                    |
| ---------------- | -------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PLM -> Dashboard | PLM panel data | Dashboard load / SSE | Dashboard queries PLM endpoints for: total active OPs, OPs by status, overdue count, stages in progress, supplier performance summary, upcoming deadlines. Displayed in the PLM widget on Caio's and Marcus's dashboards. |

### 7.4 Pulse (Discord)

| Direction    | Data / Action           | Trigger           | Detail                                                                                                                                                                                                                               |
| ------------ | ----------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PLM -> Pulse | Daily production report | Cron at 08:45 BRT | Pulse queries `/api/v1/pcp/production-orders?status=in_progress` and generates a summary posted to `#report-producao`: total active OPs, stages completed yesterday, stages due today, overdue stages, upcoming deadlines this week. |
| PLM -> Pulse | Real-time alerts        | Flare events      | Alert Tiers 1/2/3 (R4/R5/R6) and supplier late pattern (R22) are dispatched to `#alertas` via Flare -> Pulse.                                                                                                                        |

### 7.5 Flare (Notifications)

All PLM notification events emitted to the Flare system:

| Event Key                           | Trigger                                                     | Channels                                    | Recipients               | Priority |
| ----------------------------------- | ----------------------------------------------------------- | ------------------------------------------- | ------------------------ | -------- |
| `production.safety_margin_consumed` | Stage completes late (R4)                                   | In-app, Discord `#alertas`                  | `operations` role        | High     |
| `production.deadline_tomorrow`      | Stage deadline is tomorrow (R5)                             | In-app, Discord `#alertas` (@tavares)       | `operations` role        | High     |
| `production.deadline_overdue`       | Stage deadline passed (R6)                                  | In-app, Discord `#alertas` (@tavares @caio) | `operations`, `pm` roles | Critical |
| `production.stage_completed`        | Any stage completed                                         | In-app                                      | `operations` role        | Low      |
| `production.completed`              | OP completed (all stages done)                              | In-app, Discord `#report-producao`          | `operations` role        | Medium   |
| `supplier.delivery_late`            | Supplier late 3/5 pattern (R22)                             | In-app, Discord `#alertas`                  | `operations` role        | High     |
| `raw_material.low_stock`            | Material stock below need (R27)                             | In-app                                      | `operations` role        | Medium   |
| `raw_material.purchase_overdue`     | Purchase deadline passed (R27)                              | In-app, Discord `#alertas`                  | `operations` role        | High     |
| `rework.overdue`                    | Rework return overdue (R36)                                 | In-app, Discord `#alertas`                  | `operations` role        | High     |
| `production.pilot_champion`         | Pilot SKU sell-through >=60% in 48h (R-PILOT.4)             | In-app, Discord `#alertas`                  | `operations` role        | High     |
| `production.pilot_discontinue`      | Pilot SKU sell-through <30% in 72h (R-PILOT.5)              | In-app                                      | `operations`, `pm` roles | Medium   |
| `production.pilot_monitoring`       | Pilot SKU sell-through 30-60%, under monitoring (R-PILOT.6) | In-app                                      | `operations` role        | Low      |

---

## 8. Background Jobs

All jobs run via PostgreSQL job queue (`FOR UPDATE SKIP LOCKED`) + Vercel Cron. No Redis/BullMQ.

| Job Name                                 | Queue | Schedule                | Priority | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ----- | ----------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pcp:daily-production-report`            | `pcp` | Daily 08:45 BRT         | Medium   | Generates the daily production status report for Pulse. Queries all active OPs, summarizes stages completed yesterday, stages due today, overdue stages, and upcoming deadlines for the week. Posts to Discord `#report-producao` via Pulse.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pcp:hourly-deadline-monitor`            | `pcp` | Every hour              | High     | Scans all `in_progress` and `pending` stages with `planned_end` approaching. Emits Tier 1 (safety margin consumed), Tier 2 (deadline tomorrow), and Tier 3 (deadline overdue) alerts per R4/R5/R6. Idempotent: does not re-emit the same alert within a 24-hour window.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `pcp:daily-supplier-reliability-recalc`  | `pcp` | Daily 04:00 BRT         | Low      | Recalculates `reliability_score` for all active suppliers using the formula in R20. Also recalculates `avg_delay_days`, `quality_rating`, `communication_rating`, `cost_rating` aggregates.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pcp:daily-raw-material-alert-check`     | `pcp` | Daily 07:00 BRT         | Medium   | Scans all `pcp.raw_material_requirements` with `status = 'pending'` for active collections. Checks if `quantity_available < quantity_needed` and if `purchase_deadline` is approaching or overdue. Emits alerts per R27.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pcp:weekly-supplier-late-pattern-check` | `pcp` | Weekly Monday 08:00 BRT | Low      | Scans all active suppliers for the late delivery pattern (3+ late in last 5). Emits `supplier.delivery_late` alert if pattern detected. Supplements the real-time check in R22.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `pcp:daily-rework-overdue-check`         | `pcp` | Daily 09:00 BRT         | Medium   | Scans all rework orders with `status IN ('sent_to_supplier', 'in_rework')` and `expected_return < CURRENT_DATE`. Emits `rework.overdue` alert per R36.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `pcp:champion-detection`                 | `pcp` | Every 6 hours           | High     | Scans all pilot OPs (`op_type = 'pilot'`) where `stock_entry` stage was completed within the last 72h and `pilot_status IS NULL OR pilot_status = 'monitoring'`. For each, calculates sell-through % by querying `erp.order_items` for the SKU since `stock_entry.actual_end`. Applies R-PILOT thresholds: >=60% in 48h → `champion` (emits `production.pilot_champion`), <30% in 72h → `discontinue` (emits `production.pilot_discontinue`), 30-60% → `monitoring`. For OPs in `monitoring` status for 7+ days, re-evaluates and promotes to `champion` or demotes to `discontinue`. Updates `pilot_status` on the OP. Idempotent: does not re-process OPs already in `champion` or `discontinue` final status. |

---

## 9. Permissions

From [AUTH.md](../../architecture/AUTH.md) section 3.4.3. Format: `{module}:{resource}:{action}`.

| Permission                     | admin | pm  | creative | operations | support | finance | commercial |
| ------------------------------ | ----- | --- | -------- | ---------- | ------- | ------- | ---------- |
| `pcp:collections:read`         | Y     | Y   | --       | Y          | --      | --      | --         |
| `pcp:collections:write`        | Y     | --  | --       | Y          | --      | --      | --         |
| `pcp:collections:delete`       | Y     | --  | --       | --         | --      | --      | --         |
| `pcp:production-orders:read`   | Y     | Y   | --       | Y          | --      | --      | --         |
| `pcp:production-orders:write`  | Y     | --  | --       | Y          | --      | --      | --         |
| `pcp:production-orders:delete` | Y     | --  | --       | --         | --      | --      | --         |
| `pcp:stages:read`              | Y     | Y   | --       | Y          | --      | --      | --         |
| `pcp:stages:write`             | Y     | --  | --       | Y          | --      | --      | --         |
| `pcp:suppliers:read`           | Y     | Y   | --       | Y          | --      | --      | --         |
| `pcp:suppliers:write`          | Y     | --  | --       | Y          | --      | --      | --         |
| `pcp:suppliers:delete`         | Y     | --  | --       | --         | --      | --      | --         |
| `pcp:raw-materials:read`       | Y     | Y   | --       | Y          | --      | --      | --         |
| `pcp:raw-materials:write`      | Y     | --  | --       | Y          | --      | --      | --         |
| `pcp:raw-materials:delete`     | Y     | --  | --       | --         | --      | --      | --         |
| `pcp:costs:read`               | Y     | Y   | --       | Y          | --      | Y       | --         |
| `pcp:costs:write`              | Y     | --  | --       | Y          | --      | --      | --         |
| `pcp:costs:delete`             | Y     | --  | --       | --         | --      | --      | --         |
| `pcp:rework:read`              | Y     | Y   | --       | Y          | --      | --      | --         |
| `pcp:rework:write`             | Y     | --  | --       | Y          | --      | --      | --         |
| `pcp:rework:delete`            | Y     | --  | --       | --         | --      | --      | --         |

**Notes:**

- **operations** (Tavares, Ana Clara) has full read/write access to all PLM resources. This is the primary working role for production management.
- **pm** (Caio) has read-only access across all PLM resources for monitoring and reporting. Cannot create, edit, or delete production data.
- **admin** (Marcus) has full access including delete permissions for administrative corrections.
- **finance** (Leticia) can read cost analyses only — needed for financial reporting and pricing decisions.
- **creative**, **support**, **commercial** have no PLM access.
- External roles (`b2b_retailer`, `creator`) have zero PLM access.
- Ana Clara (operations role) uses the mobile stock entry flow. Her write permission covers stage completion (specifically the stock_entry stage via the mobile interface).

---

## 10. Testing Checklist

Following the testing strategy from [TESTING.md](../../platform/TESTING.md).

### 10.1 Unit Tests

- [ ] **Reliability score calculation** — Test R20 formula with known inputs: supplier with 80% on-time (8/10), quality 4.0, communication 3.5, cost 4.5. Expected score: `(80*0.40) + (80*0.30) + (70*0.20) + (90*0.10) = 32 + 24 + 14 + 9 = 79`
- [ ] **Reliability score edge cases** — New supplier with zero ratings (expect 50), supplier with 100% on-time and all 5s (expect 100), supplier with 0% on-time and all 1s (expect 20)
- [ ] **Alert tier classification** — Given a stage with planned_end in various relative positions to CURRENT_DATE, verify correct tier: Tier 1 (safety margin consumed), Tier 2 (tomorrow), Tier 3 (overdue)
- [ ] **Stage ordering validation** — Attempt to complete stage 5 when stage 4 is still pending. Expect rejection. Allow completion when stage 4 is completed or skipped.
- [ ] **Stage skip validation** — Skip a stage without a reason in notes. Expect rejection. Skip with reason. Expect success.
- [ ] **Cost per piece calculation** — R29: Test with various total_cost and quantity values. Verify correct division. Test quantity=1 edge case.
- [ ] **Safety margin detection** — R3: Complete a stage where actual_end > planned_end. Verify safety_margin_consumed = true. Complete on time. Verify false.
- [ ] **Purchase deadline calculation** — R25: Given collection launch date, OP lead time, and material lead time, verify correct deadline.
- [ ] **Quantity to purchase** — R26: Test with quantity_needed > available (positive result), quantity_needed <= available (zero result), quantity_needed with zero available.
- [ ] **Late delivery pattern** — R22: Supplier with ratings [on_time, late, late, late, on_time]. Verify 3/5 triggers alert. Supplier with [late, late, on_time, on_time, on_time]. Verify 2/5 does not trigger.
- [ ] **Priority auto-escalation** — R14: OP with 2 stages having safety_margin_consumed = true. Verify priority escalates.
- [ ] **Rework quantity validation** — R35: Rework quantity > OP quantity. Expect rejection.
- [ ] **CNPJ validation** — Valid and invalid CNPJs, formatted and unformatted.

### 10.2 Integration Tests

- [ ] **Create OP via API** — POST to `/production-orders`, verify 11 stages auto-created with correct sequence and types.
- [ ] **Stage advancement flow** — Start stage 1, complete it, verify stage 2 becomes startable, verify `current_stage` updated on parent OP.
- [ ] **Stage advancement with supplier rating** — Complete a stage with an assigned supplier, include rating data, verify `pcp.supplier_ratings` row created and supplier aggregates updated.
- [ ] **Skip stage** — Skip stage 3 (sample) with reason, verify stage 4 becomes startable, verify `current_stage` jumps to stage 4.
- [ ] **Stock entry triggers ERP sync** — Complete stage 11 (stock_entry), verify: OP status = completed, `erp.inventory.quantity_in_production` decremented, `erp.inventory.quantity_available` incremented, `erp.inventory_movements` row created with type `production_entry`.
- [ ] **Alert emission** — Create an OP with a stage whose `planned_end` is yesterday. Run deadline monitor job. Verify Tier 3 alert emitted via Flare.
- [ ] **Supplier reliability recalculation** — Insert 5 ratings for a supplier with known values. Run recalc job. Verify `reliability_score` matches R20 formula.
- [ ] **Raw material requirement calculation** — Create a collection with OPs, create material requirements. Run recalculate endpoint. Verify `quantity_to_purchase` matches R26.
- [ ] **Cost sync to ERP** — Create cost analysis, call sync-to-erp action. Verify `erp.skus.cost_price` updated.
- [ ] **Tarefas auto-task creation** — Start a production stage. Verify a task is created in `tarefas.tasks` with correct title and due date.
- [ ] **Pause and resume OP** — Pause an OP, verify no alerts fire for paused OP stages. Resume, verify alerts resume.
- [ ] **Rework status flow** — Create rework, advance through all statuses in sequence. Verify timestamps set correctly.

### 10.3 E2E Tests

- [ ] **Full OP lifecycle** — Create collection -> Create drop -> Create OP -> Advance through all 11 stages -> Complete stock entry -> Verify OP completed, ERP inventory updated, Flare event `production.completed` emitted
- [ ] **Alert escalation path** — Create OP with tight deadlines -> Let stages become overdue -> Verify Tier 1, Tier 2, Tier 3 alerts fire in correct sequence with correct Discord mentions
- [ ] **Supplier management flow** — Create supplier -> Assign to stages in multiple OPs -> Complete stages with ratings -> Verify reliability score calculated correctly -> Trigger late pattern alert
- [ ] **Material planning flow** — Create collection -> Define material requirements -> Verify purchase deadlines calculated -> Mark materials as ordered/received -> Verify stock levels update
- [ ] **Mobile stock entry** — Open mobile view as Ana Clara -> Select OP at QC-complete stage -> Enter quantity -> Confirm -> Verify stage completed, ERP synced
- [ ] **Rework flow** — Create OP -> Advance to QC -> Create rework order -> Advance rework through statuses -> Verify cost recorded against OP

### 10.4 Performance Tests

- [ ] **Production orders list** — 100+ active OPs with stages: list endpoint under 300ms
- [ ] **Collection overview** — Collection with 50 OPs, each with 11 stages (550 stage rows): overview endpoint under 500ms
- [ ] **Supplier reliability recalc job** — 50 suppliers, 500 total ratings: complete within 10 seconds
- [ ] **Deadline monitor scan** — 100 active OPs with 1100 stages: hourly scan completes within 30 seconds
- [ ] **Material requirements recalculation** — Collection with 30 OPs and 50 distinct materials: under 5 seconds

---

## 11. Migration Path

### 11.1 Current State

There is no existing production management tool at CIENA. Production is currently tracked via:

- **Google Sheets** — Tavares maintains a spreadsheet with OP names, dates, and status columns
- **WhatsApp messages** — Supplier communication happens in individual and group chats with no centralized log
- **Memory** — Much of the supplier performance data and material requirements exist only in Tavares's head

### 11.2 Migration Plan

| Phase                                  | Action                                                                                                                                                     | Timeline   |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **Phase 1: Schema creation**           | Run database migrations to create all `pcp.*` tables, indexes, and enums                                                                                   | Sprint 1   |
| **Phase 2: Seed suppliers**            | Import CIENA's existing supplier contacts from Tavares's spreadsheet into `pcp.suppliers`. Manual process — estimated 15-20 suppliers.                     | Sprint 1   |
| **Phase 3: Seed raw materials**        | Import known raw materials and current stock levels from warehouse count. Manual process — estimated 30-50 materials.                                      | Sprint 1   |
| **Phase 4: Create active collections** | Create current collection(s) and drop(s) in the system. Create OPs for any currently in-flight production.                                                 | Sprint 1-2 |
| **Phase 5: Historical data**           | Optionally backfill completed OPs from spreadsheet data for cost analysis and supplier rating history. Lower priority — only if time permits.              | Sprint 3+  |
| **Phase 6: Training**                  | Walk Tavares through the system: creating OPs, advancing stages, rating suppliers, managing materials. Walk Ana Clara through the mobile stock entry flow. | Sprint 2   |

### 11.3 Data Seeding

```sql
-- Example seed: suppliers
INSERT INTO pcp.suppliers (id, name, type, contact_name, contact_phone, cnpj, is_active)
VALUES
  (gen_random_uuid(), 'Confeccoes Silva', 'factory', 'Jose Silva', '+5511987654321', '12.345.678/0001-90', true),
  (gen_random_uuid(), 'Tecelagem Nordeste', 'weaving_mill', 'Maria Souza', '+5511976543210', '23.456.789/0001-01', true),
  (gen_random_uuid(), 'Estamparia Central', 'print_shop', 'Pedro Lima', '+5511965432109', '34.567.890/0001-12', true);

-- Example seed: raw materials
INSERT INTO pcp.raw_materials (id, name, category, unit, unit_cost, min_order_quantity, lead_time_days, is_active)
VALUES
  (gen_random_uuid(), 'Malha 30/1 Preta', 'fabric', 'meters', 4.00, 100, 7, true),
  (gen_random_uuid(), 'Malha 30/1 Branca', 'fabric', 'meters', 4.00, 100, 7, true),
  (gen_random_uuid(), 'Ziper YKK 20cm', 'trim', 'units', 1.00, 500, 14, true),
  (gen_random_uuid(), 'Etiqueta Tecida CIENA', 'label', 'units', 1.00, 1000, 10, true);
```

---

## 12. Open Questions

| #   | Question                                                                                                                                                                                                                                                                   | Impact | Proposed Resolution                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OQ1 | **Concurrent OP count** — How many OPs will typically be active at the same time? This affects UI pagination defaults and background job performance tuning.                                                                                                               | Medium | Estimate 20-50 active OPs per collection. Start with pagination of 25 per page. Monitor after launch and adjust.                                                                                 |
| OQ2 | **Bulk stage advancement** — Should Tavares be able to advance multiple OPs through the same stage at once (e.g., mark "cutting complete" for 10 OPs simultaneously)?                                                                                                      | High   | Start with individual stage advancement. If Tavares requests bulk actions after using the system, add a bulk endpoint `POST /stages/actions/bulk-complete`.                                      |
| OQ3 | **Tarefas integration depth** — How tightly should PLM integrate with Tarefas? Options: (A) Auto-create task per stage, auto-complete on stage completion. (B) Only create tasks for stages with assigned suppliers. (C) No auto-creation, Tavares manually creates tasks. | Medium | Start with option B — auto-create tasks only for stages with `assigned_supplier_id IS NOT NULL`. This avoids cluttering Tarefas with internal stages (concept, approval) that are quick actions. |
| OQ4 | **Stage duration defaults** — Should the system suggest default durations per stage type based on historical data? E.g., "sewing typically takes 7 days for this supplier."                                                                                                | Low    | Requires historical data. After 2-3 months of usage, analyze `production_stages` data to calculate average durations per stage_type per supplier.                                                |
| OQ5 | **Raw material BOM (Bill of Materials)** — Should each SKU have a formal Bill of Materials linking it to required raw materials and quantities? Currently, material requirements are managed at the collection level, not per-SKU.                                         | High   | For now, material requirements are entered manually per collection. A BOM feature would auto-calculate requirements from OP quantities and per-SKU material specs.                               |
| OQ6 | **Multi-supplier per stage** — Can a single production stage involve multiple suppliers (e.g., fabric from supplier A, trims from supplier B, both used in "material_purchase")?                                                                                           | Low    | For v1.0, one supplier per stage. Material purchase stage represents the primary fabric supplier. Trim purchases can be noted in the stage notes field. Revisit if this becomes a pain point.    |
| OQ7 | **Audit trail granularity** — Should every stage status change be logged in `global.audit_logs`, or is the `production_stages.actual_start/actual_end` sufficient?                                                                                                         | Low    | Use the existing audit log system (from AUDIT-LOG.md). Every PATCH/POST to a stage is automatically logged by the audit middleware. No additional logging needed.                                |
| OQ8 | **Production order templates** — Should Tavares be able to save an OP as a template (with pre-set stage durations, suppliers, notes) and reuse it for similar SKUs?                                                                                                        | Medium | For now, Tavares creates each OP from scratch. After he has created 20+ OPs, patterns will emerge and we can build a template feature.                                                           |

---

_This module spec is the source of truth for PLM implementation. All development, review, and QA should reference this document. Changes require review from Marcus (admin) or Tavares (operations)._

---

## Princípios de UX

> Referência: `DS.md` seções 4 (ICP & Filosofia), 6 (Formulários), 7 (Dashboards)

### Timeline como View Principal

- **Ação > informação (DS.md 4.2, princípio 5):** a timeline visual é o elemento dominante. Mostrar o que importa ao bater o olho — ordens atrasadas em destaque, ordens no prazo subordinadas.
- **Contraste é priorização (DS.md 4.2, princípio 3):** ordens atrasadas com border `--danger`, ordens em risco com border `--warning`, ordens no prazo com border `--border-default`.
- **Padrão F (DS.md 7):** ordens mais urgentes no topo esquerdo.

### Formulários de OP — Progressive Disclosure

- **Dados básicos primeiro (DS.md 6.1):** nome da OP, coleção, fornecedor, prazo. Campos essenciais no topo.
- **Detalhes em accordion (DS.md 6.5):** insumos, custos, retoque, histórico — expandíveis sob sections colapsáveis. Não sobrecarregar Tavares com todos os campos de uma vez.
- **Pergunte menos (DS.md 6.1):** steps progressivos para criação de OP com mais de 5 campos.

### Alertas Contextuais

- **Contextualização (DS.md 7, regra 4):** todo alerta com significado + enquadramento.
  - "3 dias para deadline. Fornecedor X não confirmou entrega."
  - "Prazo de segurança consumido. Margem restante: 0 dias."
  - "Fornecedor Y atrasou 3 das últimas 5 entregas. Confiabilidade: 40%."
- **Escalonamento visual:** informação em `--info`, atenção em `--warning`, ação urgente em `--danger`.

### Empty States

- **Nunca tela vazia (DS.md 11.3):**
  - Ordens: "Nenhuma ordem de produção criada. Crie a primeira para acompanhar o fluxo."
  - Fornecedores: "Nenhum fornecedor cadastrado. Adicione seus fornecedores para acompanhar prazos e qualidade."
  - Insumos: "Lista de insumos vazia. Vincule insumos à coleção para receber alertas de compra."

---

## Production Playbooks

Pre-configured OP templates by product type. Tavares selects "Camiseta Básica" and the OP is created with standard stages (corte, costura, acabamento, embalagem), estimated times, and suggested suppliers. Admin creates/edits playbooks in PLM → Settings → Playbooks. New table `pcp.production_playbooks`.

**User Stories:**

| #       | As a... | I want to...                                                     | Acceptance Criteria                                                                                                                                        |
| ------- | ------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-AX08 | Tavares | Create a new OP from a playbook template instead of from scratch | Playbook selector at top of new OP form. Selecting a playbook pre-fills stages, times, and suppliers. Tavares adjusts quantities and dates, then confirms. |
| US-AX09 | Marcus  | Create and manage production playbooks                           | CRUD page at `(admin)/pcp/settings/playbooks`. Each playbook has: name, product_type, stages (ordered list with estimated_days), default_materials.        |
| US-AX10 | Tavares | See playbook usage count to know which templates are most useful | usage_count column increments each time a playbook is used to create an OP. Sortable in playbook list.                                                     |

---

## 13. Competitive Gap Features (Fashion-Focused PLM)

> **Source:** Competitive analysis vs Colecao.moda, Audaces ISA, and Inbazz.
> **Reference:** `docs/competitive/gap-analysis.md`
> **Convention:** User stories `US-CX01`+, Rules `R-CX01`+, Screens `4.CX01`+
> **Date:** April 2026
> **Status:** Approved — Incorporated into PLM spec based on gap analysis findings
>
> **Diagnostic:** The Ambaril PLM was designed as a **production tracking system** (OP with fixed stages through stock entry). Competitors like Colecao.moda and Audaces ISA are **product development PLMs** (tech spec sheets, pattern grading, fabric yield, visual catalog). This section bridges the gap by adding fashion-specific product development capabilities while preserving Ambaril's production tracking strengths.

---

### 13.1 Configurable Production Stages (A1)

**Gap:** Ambaril has 11 fixed stages (enum). Colecao.moda and ISA allow fully customizable stages per tenant. Brands with different processes (e.g., accessories, fully outsourced production) don't fit the 11-stage model. Current workaround (US07 skip-with-reason) is a band-aid.

**Solution:** Introduce `pcp.tenant_stages` as a configurable stage registry per tenant. The current 11-stage enum serves as the default template, but tenants can rename, hide, reorder, and add stages.

#### Data Model

**New table: `pcp.tenant_stages`**

| Column                | Type         | Constraints                     | Description                                                                      |
| --------------------- | ------------ | ------------------------------- | -------------------------------------------------------------------------------- |
| id                    | UUID         | PK, DEFAULT gen_random_uuid()   |                                                                                  |
| tenant_id             | UUID         | NOT NULL, FK global.tenants(id) |                                                                                  |
| name                  | VARCHAR(100) | NOT NULL                        | Display name (PT-BR). e.g., 'Conceito', 'Modelagem', 'Bordado'                   |
| slug                  | VARCHAR(100) | NOT NULL                        | Machine-readable identifier. e.g., 'concept', 'pattern', 'embroidery'            |
| sequence              | INTEGER      | NOT NULL                        | Order in the production flow (1-based). Gaps allowed for reordering              |
| is_active             | BOOLEAN      | NOT NULL DEFAULT TRUE           | Hidden stages have is_active=false but remain in historical data                 |
| is_default            | BOOLEAN      | NOT NULL DEFAULT FALSE          | TRUE for stages from the default template (cannot be fully deleted, only hidden) |
| default_duration_days | INTEGER      | NULL                            | Suggested duration when creating an OP                                           |
| color                 | VARCHAR(7)   | NULL                            | Hex color for Kanban cards. e.g., '#3B82F6'                                      |
| icon                  | VARCHAR(50)  | NULL                            | Lucide icon name for UI. e.g., 'scissors', 'package'                             |
| created_at            | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()          |                                                                                  |
| updated_at            | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()          |                                                                                  |

```sql
CREATE INDEX idx_pcp_ts_tenant ON pcp.tenant_stages (tenant_id);
CREATE UNIQUE INDEX idx_pcp_ts_slug ON pcp.tenant_stages (tenant_id, slug);
CREATE INDEX idx_pcp_ts_sequence ON pcp.tenant_stages (tenant_id, sequence);
```

**Default template (seeded on tenant creation):**

| sequence | slug              | name (PT-BR)       | default_duration_days |
| -------- | ----------------- | ------------------ | --------------------- |
| 1        | concept           | Conceito           | 5                     |
| 2        | pattern           | Modelagem          | 5                     |
| 3        | sample            | Amostra            | 5                     |
| 4        | approval          | Aprovacao          | 2                     |
| 5        | size_grading      | Graduacao          | 3                     |
| 6        | material_purchase | Compra Materiais   | 8                     |
| 7        | cutting           | Corte              | 7                     |
| 8        | sewing            | Costura            | 7                     |
| 9        | finishing         | Acabamento         | 4                     |
| 10       | qc                | Controle Qualidade | 4                     |
| 11       | stock_entry       | Entrada Estoque    | 2                     |

**Schema changes:**

- `pcp.production_stages.stage_type` changes from `pcp.stage_type` enum to `UUID FK pcp.tenant_stages(id)`. The enum is retained for migration compatibility but new stages reference `tenant_stages.id`.
- `pcp.production_stages.sequence` constraint changes from `CHECK (sequence BETWEEN 1 AND 11)` to `CHECK (sequence >= 1)` (unbounded upper limit).
- `pcp.production_orders.current_stage` changes from `pcp.stage_type` enum to `UUID FK pcp.tenant_stages(id)`.

#### User Stories

| #       | As a...              | I want to...                                                                       | So that...                                                                  |
| ------- | -------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| US-CX01 | Marcus (admin)       | configure the production stages for my tenant (rename, reorder, hide, add new)     | the PLM pipeline matches our actual manufacturing process                   |
| US-CX02 | Marcus               | add a custom stage (e.g., 'Bordado', 'Lavagem', 'Estampa Digital') to the pipeline | specialized production steps are tracked alongside standard stages          |
| US-CX03 | Tavares (operations) | see the tenant-configured stages when creating or viewing an OP                    | the pipeline reflects our real process, not a generic template              |
| US-CX04 | System               | seed the 11 default stages when a new tenant is created                            | tenants have a working pipeline out of the box without manual configuration |

#### Rules

| #      | Rule                         | Detail                                                                                                                                                                                                                                          |
| ------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX01 | **Default template seeding** | When a new tenant is provisioned, the system MUST create 11 rows in `pcp.tenant_stages` matching the default template above. All rows have `is_default = true`.                                                                                 |
| R-CX02 | **Stage renaming**           | Tenants can rename any stage (including defaults). The `slug` remains immutable for programmatic references.                                                                                                                                    |
| R-CX03 | **Stage hiding**             | Tenants can set `is_active = false` on any stage. Hidden stages are not created when a new OP is started, but remain visible on historical OPs that used them. Default stages cannot be hard-deleted, only hidden.                              |
| R-CX04 | **Stage addition**           | Tenants can add new stages with custom `slug`, `name`, and `sequence`. New stages are inserted into the sequence and existing stages are reordered. The `stock_entry` stage MUST always be the last stage in the sequence (enforced by R-CX05). |
| R-CX05 | **Stock entry anchoring**    | The `stock_entry` stage (slug='stock_entry') CANNOT be hidden, deleted, or moved from the last position. It is the trigger for ERP inventory sync (R9) and must always be the terminal stage.                                                   |

#### Screen 4.CX01 — Stage Configuration

```
+------------------------------------------------------------------------------+
|  PLM > Configuracoes > Etapas de Producao                                    |
+------------------------------------------------------------------------------+
|                                                                              |
|  Arraste para reordenar. A etapa "Entrada Estoque" e sempre a ultima.       |
|                                                                              |
|  +---+--+----------------------------+--------+------+--------+-----------+ |
|  | # |  | Nome                       | Slug   | Dias | Cor    | Status    | |
|  +---+--+----------------------------+--------+------+--------+-----------+ |
|  | 1 |≡ | [Conceito_____________]     | concept| [5]  | [#hex] | Ativo     | |
|  | 2 |≡ | [Modelagem____________]     | pattern| [5]  | [#hex] | Ativo     | |
|  | 3 |≡ | [Amostra______________]     | sample | [5]  | [#hex] | Ativo     | |
|  | 4 |≡ | [Aprovacao____________]     | approv.| [2]  | [#hex] | Ativo     | |
|  | 5 |≡ | [Bordado______________]     | embroid| [3]  | [#hex] | Ativo  *  | |
|  | 6 |≡ | [Graduacao____________]     | grading| [3]  | [#hex] | Oculto    | |
|  | 7 |≡ | [Compra Materiais_____]     | mat_pur| [8]  | [#hex] | Ativo     | |
|  | 8 |≡ | [Corte________________]     | cutting| [7]  | [#hex] | Ativo     | |
|  | 9 |≡ | [Costura______________]     | sewing | [7]  | [#hex] | Ativo     | |
|  |10 |≡ | [Acabamento___________]     | finish.| [4]  | [#hex] | Ativo     | |
|  |11 |≡ | [Controle Qualidade___]     | qc     | [4]  | [#hex] | Ativo     | |
|  |12 |🔒| [Entrada Estoque______]     | stock_e| [2]  | [#hex] | Ativo 🔒  | |
|  +---+--+----------------------------+--------+------+--------+-----------+ |
|                                                                              |
|  * = Etapa customizada (adicionada pelo tenant)                             |
|  🔒 = Etapa bloqueada (nao pode ser ocultada ou movida)                     |
|                                                                              |
|  [+ Adicionar Etapa]                                    [Salvar Alteracoes] |
+------------------------------------------------------------------------------+
```

---

### 13.2 Stage Regression / Repilotagem (A2)

**Gap:** Original R2 prohibited stage regression ("a completed stage cannot be reverted to pending"). In reality, garments return to previous stages constantly — rejected pilot → back to pattern, unexpected fabric → back to material purchase. Colecao.moda supports this natively with mandatory reason + repilotagem report.

**Solution:** R2 has been modified in section 6.1 to permit conditional regression. This section details the full regression workflow.

#### User Stories

| #       | As a...              | I want to...                                                                              | So that...                                                              |
| ------- | -------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| US-CX05 | Tavares (operations) | regress an OP to a previous stage (e.g., from QC back to Sample) with a mandatory reason  | rejected pilots can be reworked without losing tracking data            |
| US-CX06 | Tavares              | see a counter of how many times an OP has been regressed                                  | I can identify products with development issues and act on them         |
| US-CX07 | Caio (PM)            | view a repilotagem report showing all OPs that were regressed, with reasons and frequency | I can report on development efficiency and identify process bottlenecks |

#### Rules

| #      | Rule                              | Detail                                                                                                                                                                                                                                                                               |
| ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-CX06 | **Regression requires reason**    | When regressing a stage, the user MUST provide a `regression_reason` (min 10 characters). The reason is stored in `global.audit_logs` with action `stage_regression` and in the OP timeline.                                                                                         |
| R-CX07 | **Downstream stages reset**       | When regressing to stage N, all stages with `sequence > N` that are `completed` or `in_progress` are reset to `pending`. Their `actual_start` and `actual_end` are set to NULL. The target stage (N) is set to `in_progress`.                                                        |
| R-CX08 | **Downstream date recalculation** | After regression, the system recalculates `planned_start` and `planned_end` for all stages from N onwards, using original stage durations (from `pcp.tenant_stages.default_duration_days` or the OP-specific planned durations). Start date for stage N = CURRENT_DATE.              |
| R-CX09 | **Regression counter**            | `pcp.production_orders.regression_count` is incremented by 1 on each regression. This counter is displayed on the OP detail and is filterable on the OP list. OPs with `regression_count >= 3` trigger Flare event `production.excessive_regression` to `operations` and `pm` roles. |

#### Screen 4.CX02 — Stage Regression Dialog

```
+------------------------------------------------------+
|  Retroceder Estagio                             [X]  |
+------------------------------------------------------+
|                                                       |
|  OP: OP-001 Camiseta Preta Basic P                   |
|  Estagio atual: 10. Controle Qualidade               |
|                                                       |
|  Retroceder para:                                     |
|  [3. Amostra                                    v]   |
|                                                       |
|  [!] Esta acao vai resetar os estagios 4-10 para     |
|  "Pendente". Datas serao recalculadas.               |
|                                                       |
|  Motivo da repilotagem: *                             |
|  [Piloto reprovada no QC. Costura do ombro____]      |
|  [desalinhada. Necessario refazer amostra.____]      |
|                                                       |
|  Repilotagens anteriores nesta OP: 1                  |
|                                                       |
|  [Cancelar]                   [Confirmar Retrocesso] |
+------------------------------------------------------+
```

---

### 13.3 Product Spec Sheet / Ficha Tecnica (A3)

**Gap:** Ambaril's central entity is the OP (production order) → SKU. Colecao.moda's central entity is the Ficha Tecnica (Tech Spec Sheet) = The Product, with 10 tabs covering all product development data. Every fashion brand needs tech spec sheets to send to suppliers. Without this, users go back to spreadsheets/manual PDFs.

**Solution:** Create `pcp.product_specs` (ficha tecnica) as a rich entity linked to the OP, with tabs for measurements/grading, materials with yield calculation, itemized costs, images/croquis (DAM integration), operational sequence, and pricing.

#### Data Model

**New table: `pcp.product_specs`**

| Column               | Type          | Constraints                                                      | Description                                                                                          |
| -------------------- | ------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| id                   | UUID          | PK, DEFAULT gen_random_uuid()                                    |                                                                                                      |
| production_order_id  | UUID          | NOT NULL, FK pcp.production_orders(id) ON DELETE CASCADE, UNIQUE | 1:1 with OP                                                                                          |
| sku_id               | UUID          | NOT NULL, FK erp.skus(id)                                        | Denormalized from OP for query convenience                                                           |
| reference_code       | VARCHAR(50)   | NULL                                                             | Internal reference code (e.g., 'REF-CAM-001')                                                        |
| product_description  | TEXT          | NULL                                                             | Detailed product description for the spec sheet                                                      |
| composition          | VARCHAR(255)  | NULL                                                             | Fabric composition (e.g., '100% Algodao', '95% Algodao 5% Elastano')                                 |
| target_weight        | NUMERIC(8,2)  | NULL                                                             | Target garment weight in grams                                                                       |
| wash_instructions    | TEXT          | NULL                                                             | Care/washing instructions                                                                            |
| operational_sequence | JSONB         | NOT NULL DEFAULT '[]'                                            | Ordered list of manufacturing operations. Array of `{step, operation, machine, time_seconds, notes}` |
| approved_cost        | NUMERIC(10,2) | NULL                                                             | Pre-approved cost ceiling for this product (set during planning). See R-CX15                         |
| calculated_cost      | NUMERIC(10,2) | NULL                                                             | Actual calculated cost from itemized BOM + labor. See R-CX16                                         |
| markup_pct           | NUMERIC(5,2)  | NULL                                                             | Markup percentage for pricing (e.g., 2.50 = 250%)                                                    |
| suggested_price      | NUMERIC(10,2) | NULL                                                             | `calculated_cost * (1 + markup_pct)`. Auto-calculated                                                |
| approved_price       | NUMERIC(10,2) | NULL                                                             | Final approved selling price (may differ from suggested)                                             |
| status               | VARCHAR(20)   | NOT NULL DEFAULT 'draft'                                         | draft, in_review, approved, archived                                                                 |
| created_by           | UUID          | NOT NULL, FK global.users(id)                                    |                                                                                                      |
| created_at           | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()                                           |                                                                                                      |
| updated_at           | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()                                           |                                                                                                      |

```sql
CREATE UNIQUE INDEX idx_pcp_specs_op ON pcp.product_specs (production_order_id);
CREATE INDEX idx_pcp_specs_sku ON pcp.product_specs (sku_id);
CREATE INDEX idx_pcp_specs_status ON pcp.product_specs (status);
```

**New table: `pcp.spec_images`**

| Column          | Type         | Constraints                                          | Description                                                           |
| --------------- | ------------ | ---------------------------------------------------- | --------------------------------------------------------------------- |
| id              | UUID         | PK, DEFAULT gen_random_uuid()                        |                                                                       |
| product_spec_id | UUID         | NOT NULL, FK pcp.product_specs(id) ON DELETE CASCADE |                                                                       |
| image_url       | VARCHAR(512) | NOT NULL                                             | R2 storage URL via DAM                                                |
| image_type      | VARCHAR(50)  | NOT NULL                                             | 'croqui', 'technical_drawing', 'reference', 'detail', 'fabric_swatch' |
| caption         | VARCHAR(255) | NULL                                                 | Image description                                                     |
| sort_order      | INTEGER      | NOT NULL DEFAULT 0                                   | Display order                                                         |
| uploaded_by     | UUID         | NOT NULL, FK global.users(id)                        |                                                                       |
| created_at      | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                               |                                                                       |

```sql
CREATE INDEX idx_pcp_si_spec ON pcp.spec_images (product_spec_id);
```

**New table: `pcp.spec_cost_items`**

| Column            | Type          | Constraints                                          | Description                                                                           |
| ----------------- | ------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| id                | UUID          | PK, DEFAULT gen_random_uuid()                        |                                                                                       |
| product_spec_id   | UUID          | NOT NULL, FK pcp.product_specs(id) ON DELETE CASCADE |                                                                                       |
| category          | VARCHAR(50)   | NOT NULL                                             | 'material', 'trim', 'labor', 'outsource', 'fixed_global', 'overhead'                  |
| description       | VARCHAR(255)  | NOT NULL                                             | e.g., 'Malha 30/1 Preta', 'Costura', 'Etiqueta composicao'                            |
| raw_material_id   | UUID          | NULL, FK pcp.raw_materials(id)                       | Link to material (for material/trim categories)                                       |
| quantity_per_unit | NUMERIC(10,4) | NOT NULL DEFAULT 0                                   | Amount needed per garment                                                             |
| unit              | VARCHAR(20)   | NOT NULL DEFAULT 'un'                                | meters, units, kg, etc.                                                               |
| unit_cost         | NUMERIC(10,2) | NOT NULL DEFAULT 0                                   | Cost per unit                                                                         |
| total_cost        | NUMERIC(10,2) | NOT NULL DEFAULT 0                                   | `quantity_per_unit * unit_cost` (per garment)                                         |
| variant_color     | VARCHAR(100)  | NULL                                                 | If cost varies by color variant (e.g., different trim color). NULL = same for all     |
| is_global_fixed   | BOOLEAN       | NOT NULL DEFAULT FALSE                               | TRUE for tenant-wide fixed costs (label, composition tag) that auto-apply. See R-CX14 |
| sort_order        | INTEGER       | NOT NULL DEFAULT 0                                   |                                                                                       |
| created_at        | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()                               |                                                                                       |
| updated_at        | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()                               |                                                                                       |

```sql
CREATE INDEX idx_pcp_sci_spec ON pcp.spec_cost_items (product_spec_id);
CREATE INDEX idx_pcp_sci_material ON pcp.spec_cost_items (raw_material_id) WHERE raw_material_id IS NOT NULL;
```

**New table: `pcp.global_fixed_costs`**

| Column      | Type          | Constraints                     | Description                                                 |
| ----------- | ------------- | ------------------------------- | ----------------------------------------------------------- |
| id          | UUID          | PK, DEFAULT gen_random_uuid()   |                                                             |
| tenant_id   | UUID          | NOT NULL, FK global.tenants(id) |                                                             |
| description | VARCHAR(255)  | NOT NULL                        | e.g., 'Etiqueta composicao', 'Etiqueta marca', 'Tag cartao' |
| category    | VARCHAR(50)   | NOT NULL                        | 'trim', 'label', 'packaging', 'other'                       |
| unit_cost   | NUMERIC(10,2) | NOT NULL                        | Cost per garment                                            |
| is_active   | BOOLEAN       | NOT NULL DEFAULT TRUE           |                                                             |
| created_at  | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()          |                                                             |
| updated_at  | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()          |                                                             |

```sql
CREATE INDEX idx_pcp_gfc_tenant ON pcp.global_fixed_costs (tenant_id);
```

#### User Stories

| #       | As a...              | I want to...                                                                                         | So that...                                                                            |
| ------- | -------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| US-CX08 | Tavares (operations) | create a ficha tecnica (product spec sheet) linked to an OP                                          | all product development data is centralized, not scattered across spreadsheets        |
| US-CX09 | Tavares              | upload images (croquis, technical drawings, fabric swatches, reference photos) to a product spec     | the spec sheet is visually complete for internal review and supplier communication    |
| US-CX10 | Tavares              | add itemized cost entries to a product spec (materials, trims, labor, outsourced services, overhead) | I know the true cost breakdown per garment, not just a lump sum                       |
| US-CX11 | Tavares              | define global fixed costs (etiqueta, composicao tag, packaging) that auto-apply to all product specs | I don't have to manually add the same fixed costs to every product                    |
| US-CX12 | Tavares              | see cost per variant when different colors use different trims/materials                             | I know if the red variant costs more than the blue because of different zippers       |
| US-CX13 | Tavares              | define the operational sequence (lista de operacoes) for a product                                   | suppliers know the exact order of manufacturing operations                            |
| US-CX14 | Tavares              | set an approved cost and compare it against the calculated cost                                      | I can track if development is staying within budget                                   |
| US-CX15 | Tavares              | calculate markup and suggested price within the PLM (not just in ERP)                                | pricing decisions happen in the product development flow, not as a separate step      |
| US-CX16 | Marcus (admin)       | approve the final price for a product spec                                                           | there is a clear distinction between calculated price and commercially approved price |

#### Rules

| #      | Rule                                     | Detail                                                                                                                                                                                                                                                                                |
| ------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX10 | **Auto-create spec on OP creation**      | When a new OP is created, the system SHOULD auto-create an empty `pcp.product_specs` row linked to it (status='draft'). The spec is populated incrementally as the OP progresses through stages.                                                                                      |
| R-CX11 | **Image storage via DAM**                | All images uploaded to a product spec are stored in Cloudflare R2 via the DAM module. The `image_url` in `pcp.spec_images` points to the R2 URL. Max 20 images per spec. Max file size 10MB. Accepted formats: PNG, JPG, WEBP, SVG.                                                   |
| R-CX12 | **Itemized cost calculation**            | `pcp.product_specs.calculated_cost = SUM(pcp.spec_cost_items.total_cost)` for all items linked to the spec. Recalculated on every cost item change.                                                                                                                                   |
| R-CX13 | **Suggested price calculation**          | `suggested_price = calculated_cost * (1 + markup_pct)`. Auto-recalculated when `calculated_cost` or `markup_pct` changes.                                                                                                                                                             |
| R-CX14 | **Global fixed cost auto-application**   | When a product spec is created, all active `pcp.global_fixed_costs` for the tenant are automatically added as `pcp.spec_cost_items` with `is_global_fixed = true`. If a global fixed cost is later updated, existing specs are NOT retroactively changed (snapshot at creation time). |
| R-CX15 | **Approved vs calculated cost tracking** | If `calculated_cost > approved_cost`, the UI MUST display a warning badge: "Custo calculado (R$ X) excede o aprovado (R$ Y) em Z%". This is informational — it does not block progression.                                                                                            |
| R-CX16 | **Cost per variant**                     | When `variant_color IS NOT NULL` on a `spec_cost_item`, the system calculates cost per variant by summing all base items (variant_color IS NULL) + variant-specific items. Displayed as a comparison table on the spec sheet.                                                         |
| R-CX17 | **Spec status flow**                     | Status must follow: `draft` -> `in_review` -> `approved` -> `archived`. Only `admin` can move to `approved`. Moving to `approved` locks the spec (no further edits without regression to `in_review`).                                                                                |
| R-CX18 | **ERP cost sync from spec**              | When a spec status changes to `approved`, `calculated_cost` is synced to `erp.skus.cost_price` (same as R30 but triggered from spec approval rather than manual cost analysis sync).                                                                                                  |

#### Screen 4.CX03 — Product Spec Sheet (Ficha Tecnica)

```
+------------------------------------------------------------------------------+
|  PLM > OPs > OP-001 > Ficha Tecnica                    [Editar] [Exportar PDF]|
+------------------------------------------------------------------------------+
|                                                                              |
|  REF-CAM-001 | Camiseta Preta Basic P | Status: [EM REVISAO]               |
|  SKU: CIE-CAM-001-P | Colecao: Inverno 2026 | Drop: 13                    |
|                                                                              |
|  [Geral] [Imagens] [Materiais] [Custos] [Medidas] [Operacoes] [Preco]      |
|  ======================================================================     |
|                                                                              |
|  TAB: GERAL                                                                 |
|  -----------                                                                 |
|  Descricao:     Camiseta basica em malha 30/1, gola redonda, manga curta   |
|  Composicao:    100% Algodao                                                |
|  Peso alvo:     180g                                                         |
|  Instrucoes:    Lavar a maquina ate 30C. Nao usar alvejante.               |
|                                                                              |
+------------------------------------------------------------------------------+
|                                                                              |
|  TAB: IMAGENS                                                                |
|  -------------                                                               |
|  +----------+  +----------+  +----------+  +----------+                     |
|  | [croqui] |  | [desenho |  | [detalhe |  | [ref.    |                     |
|  |          |  |  tecnico]|  |  gola]   |  |  visual] |                     |
|  +----------+  +----------+  +----------+  +----------+                     |
|  Croqui frente  Des. tecnico  Detalhe gola  Referencia                      |
|                                                                              |
|  [+ Upload Imagem]                                                          |
|                                                                              |
+------------------------------------------------------------------------------+
|                                                                              |
|  TAB: CUSTOS                                                                 |
|  ------------                                                                |
|  +----+---------------------------+--------+------+---------+-----------+   |
|  | #  | Item                      | Qtd/un | Unit | Custo/un| Variante  |   |
|  +----+---------------------------+--------+------+---------+-----------+   |
|  |  1 | Malha 30/1 Preta          | 3.00 m | R$ 4 | R$12.00 | --        |   |
|  |  2 | Etiqueta Tecida CIENA     | 1 un   | R$ 1 | R$ 1.00 | --        |   |
|  |  3 | Linha Preta Coats         | 2.5 m  | R$0.2| R$ 0.50 | --        |   |
|  |  4 | Ziper YKK 20cm (Preto)   | 1 un   | R$ 1 | R$ 1.00 | Preto     |   |
|  |  4 | Ziper YKK 20cm (Branco)  | 1 un   |R$1.20| R$ 1.20 | Branco    |   |
|  |  5 | Costura (mao de obra)     | 1 un   | R$ 8 | R$ 8.00 | --        |   |
|  |  6 | Corte (mao de obra)       | 1 un   | R$ 3 | R$ 3.00 | --        |   |
|  |  7 | Acabamento                | 1 un   | R$ 3 | R$ 3.00 | --        |   |
|  |  8 | *Etiqueta composicao*     | 1 un   |R$0.50| R$ 0.50 | -- (fixo) |   |
|  |  9 | *Tag cartao*              | 1 un   |R$0.30| R$ 0.30 | -- (fixo) |   |
|  +----+---------------------------+--------+------+---------+-----------+   |
|  | TOTAL POR PECA               |        |      | R$29.30 |           |   |
|  +--------------------------------------------------------------+---------+   |
|                                                                              |
|  * = Custo fixo global (aplicado automaticamente)                           |
|                                                                              |
|  Custo aprovado: R$ 30.00    Custo calculado: R$ 29.30    [OK dentro]       |
|                                                                              |
+------------------------------------------------------------------------------+
```

#### Screen 4.CX04 — Product Spec Pricing Tab

```
+------------------------------------------------------------------------------+
|  TAB: PRECO                                                                  |
|  -----------                                                                 |
|                                                                              |
|  Custo calculado:       R$ 29,30                                            |
|  Markup:                [2.50] (250%)                                        |
|  Preco sugerido:        R$ 102,55   (auto-calculado)                        |
|                                                                              |
|  Preco aprovado:        [R$ 99,90]  (definido por Marcus)                   |
|  Margem real:           70,6%       (preco aprovado - custo / preco)        |
|                                                                              |
|  +-------------------------------+                                           |
|  | Comparativo por variante      |                                           |
|  +----------+----------+---------+                                           |
|  | Variante | Custo    | Margem  |                                           |
|  +----------+----------+---------+                                           |
|  | Preto    | R$ 29,30 | 70,6%   |                                           |
|  | Branco   | R$ 29,50 | 70,4%   |                                           |
|  +----------+----------+---------+                                           |
|                                                                              |
|  --> Alimenta erp.skus.cost_price ao aprovar ficha tecnica                  |
+------------------------------------------------------------------------------+
```

---

### 13.4 Supplier Portal (A4)

**Gap:** No external access for suppliers. All communication happens via WhatsApp/email. Pattern makers cannot upload files to the platform. Factories cannot see pending demands. This reduces the value of the centralized PLM.

**Solution:** Add `supplier` role in RBAC with limited access. Suppliers access via token link (no full registration required). They see only assigned stages, upload files, and confirm deliveries.

#### User Stories

| #       | As a...              | I want to...                                                                                   | So that...                                                              |
| ------- | -------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| US-CX17 | Tavares (operations) | generate an access link for a supplier so they can view their assigned stages                  | suppliers can self-serve instead of calling me for status updates       |
| US-CX18 | Supplier (external)  | view all production stages assigned to me across all OPs                                       | I know my pending demands and deadlines                                 |
| US-CX19 | Supplier             | upload files (patterns, molds, photos) to a stage I'm assigned to                              | deliverables are centralized in the PLM, not lost in WhatsApp           |
| US-CX20 | Supplier             | confirm delivery of my stage's output with notes                                               | Tavares is notified automatically without needing a phone call          |
| US-CX21 | Supplier             | view the product spec sheet (ficha tecnica) for an OP I'm assigned to, with cost fields hidden | I have the technical information I need without seeing internal pricing |

#### Rules

| #      | Rule                               | Detail                                                                                                                                                                                                                                                                                                                        |
| ------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX19 | **Supplier access via token**      | Supplier access is granted via a signed JWT token embedded in a URL: `app.ambaril.com/supplier/portal?token=xxx`. Token contains `supplier_id`, `tenant_id`, and `expires_at`. No full user account needed. Token is valid for 90 days, renewable by Tavares.                                                                 |
| R-CX20 | **Supplier visibility scope**      | Suppliers can ONLY see: (1) `pcp.production_stages` where `assigned_supplier_id` = their supplier ID. (2) The parent `pcp.production_orders` name, SKU, quantity, and deadline (but NOT cost data, priority, or internal notes). (3) `pcp.product_specs` linked to those OPs, with cost tabs hidden. (4) Files they uploaded. |
| R-CX21 | **Supplier file upload**           | Suppliers can upload files to stages assigned to them. Files are stored in R2 via DAM with prefix `supplier-uploads/{supplier_id}/`. Max 5 files per stage, 25MB each. Accepted formats: PDF, PNG, JPG, DXF, AI, CDR.                                                                                                         |
| R-CX22 | **Supplier delivery confirmation** | When a supplier confirms delivery on a stage, the system creates a pending stage completion for Tavares to review and approve. The supplier CANNOT directly complete a stage — only Tavares can. Flare event `supplier.delivery_confirmed` is emitted.                                                                        |
| R-CX23 | **Supplier portal audit**          | All supplier portal actions (view, upload, confirm) are logged in `global.audit_logs` with `actor_type = 'supplier'` and `actor_id = supplier_id`.                                                                                                                                                                            |

#### Screen 4.CX06 — Supplier Portal

```
+------------------------------------------------------------------------------+
|  Ambaril — Portal do Fornecedor                                              |
|  Confeccoes Silva                                           [Sair]          |
+------------------------------------------------------------------------------+
|                                                                              |
|  MINHAS DEMANDAS                                                             |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  | OP-001 | Camiseta Preta Basic P | 200 un                              |  |
|  | Estagio: Corte          | Prazo: 05/04/2026    | [EM ANDAMENTO]       |  |
|  |                                                                        |  |
|  | [Ver Ficha Tecnica]  [Upload Arquivo]  [Confirmar Entrega]            |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  | OP-001 | Camiseta Preta Basic P | 200 un                              |  |
|  | Estagio: Costura        | Prazo: 12/04/2026    | [PENDENTE]           |  |
|  |                                                                        |  |
|  | [Ver Ficha Tecnica]  [Upload Arquivo]                                 |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  | OP-002 | Moletom Oversized M | 150 un                                 |  |
|  | Estagio: Amostra        | Prazo: 10/03/2026    | [CONCLUIDO]          |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
|  MEUS UPLOADS                                                                |
|  | Arquivo                    | OP       | Estagio  | Data       |          |
|  |----------------------------|----------|----------|------------|          |
|  | molde-camiseta-v2.dxf     | OP-001   | Corte    | 29/03/2026 |          |
|  | foto-corte-finalizado.jpg | OP-001   | Corte    | 04/04/2026 |          |
+------------------------------------------------------------------------------+
```

---

### 13.5 Custom Fields (A5)

**Gap:** Ambaril OP schema is fixed. ISA allows fully custom fields. Colecao.moda has custom tags + filterable custom fields. A brand that wants to track "mold number", "print technique", "finishing type" has no dedicated field — they use `notes` (free text, not filterable).

**Solution:** `custom_fields JSONB` column added to `pcp.production_orders` (done in Fase 1). This section adds the definition table and user stories.

#### Data Model

**New table: `pcp.custom_field_definitions`**

| Column        | Type         | Constraints                     | Description                                                                                           |
| ------------- | ------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| id            | UUID         | PK, DEFAULT gen_random_uuid()   |                                                                                                       |
| tenant_id     | UUID         | NOT NULL, FK global.tenants(id) |                                                                                                       |
| field_key     | VARCHAR(100) | NOT NULL                        | Machine-readable key. e.g., 'mold_number', 'print_technique'                                          |
| field_label   | VARCHAR(255) | NOT NULL                        | Display label (PT-BR). e.g., 'Numero do Molde', 'Tecnica de Estampa'                                  |
| field_type    | VARCHAR(20)  | NOT NULL                        | 'text', 'number', 'select', 'date', 'boolean'                                                         |
| options       | JSONB        | NULL                            | For field_type='select': array of allowed values. e.g., `["Serigrafia","Sublimacao","DTF","Bordado"]` |
| is_required   | BOOLEAN      | NOT NULL DEFAULT FALSE          | If true, OP creation requires this field                                                              |
| is_filterable | BOOLEAN      | NOT NULL DEFAULT TRUE           | If true, appears in filter panel                                                                      |
| sort_order    | INTEGER      | NOT NULL DEFAULT 0              | Display order in form                                                                                 |
| is_active     | BOOLEAN      | NOT NULL DEFAULT TRUE           |                                                                                                       |
| created_at    | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()          |                                                                                                       |
| updated_at    | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()          |                                                                                                       |

```sql
CREATE INDEX idx_pcp_cfd_tenant ON pcp.custom_field_definitions (tenant_id);
CREATE UNIQUE INDEX idx_pcp_cfd_key ON pcp.custom_field_definitions (tenant_id, field_key);
CREATE INDEX idx_pcp_po_custom_fields ON pcp.production_orders USING GIN (custom_fields);
```

#### User Stories

| #       | As a...              | I want to...                                                       | So that...                                                             |
| ------- | -------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| US-CX22 | Marcus (admin)       | define custom fields for OPs (text, number, select, date, boolean) | our team can track data specific to our process without schema changes |
| US-CX23 | Tavares (operations) | fill in custom fields when creating or editing an OP               | all relevant data is captured in the OP, not in notes                  |
| US-CX24 | Tavares              | filter the OP list by any custom field value                       | I can find all OPs with a specific print technique or mold number      |

#### Rules

| #      | Rule                                | Detail                                                                                                                                                                                                                                                       |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-CX24 | **Custom field validation**         | When saving an OP, the system validates `custom_fields` against `pcp.custom_field_definitions` for the tenant: required fields must be present, `select` fields must match allowed options, `number` fields must be numeric, `date` fields must be ISO 8601. |
| R-CX25 | **Custom field filtering**          | The OP list endpoint (`GET /production-orders`) accepts `custom_fields` query parameter with JSONB containment syntax. e.g., `?custom_fields={"print_technique":"DTF"}`. Uses the GIN index for performance.                                                 |
| R-CX26 | **Custom field definition changes** | Updating or deleting a custom field definition does NOT retroactively affect existing OPs. The data in `custom_fields` JSONB is preserved even if the definition is removed. New OPs will no longer show the removed field.                                  |

---

### 13.6 Production Kanban View (F1)

**Gap:** Ambaril's Kanban is in the Tarefas module (Todo/In Progress/Done). There is no Kanban of PRODUCTS by PRODUCTION STAGE. Colecao.moda and ISA both have this as their primary view — columns are stages, cards are products/OPs.

**Solution:** Add a Kanban view as an alternative to the OP list (4.1). Columns = tenant-configured stages. Cards = OPs. Drag-to-advance opens a confirmation dialog.

#### User Stories

| #       | As a...              | I want to...                                                                 | So that...                                                  |
| ------- | -------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| US-CX25 | Tavares (operations) | view all OPs in a Kanban board where columns are production stages           | I can see at a glance how many products are in each stage   |
| US-CX26 | Tavares              | drag an OP card from one stage column to the next to advance it              | I can advance stages quickly without opening each OP detail |
| US-CX27 | Tavares              | see the count of OPs per stage column and highlight columns with overdue OPs | I can identify bottleneck stages immediately                |

#### Rules

| #      | Rule                | Detail                                                                                                                                                                                                                                                    |
| ------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX27 | **Drag-to-advance** | Dragging a card from column N to column N+1 opens the Stage Advancement Dialog (4.4). The stage is NOT advanced until the dialog is confirmed. Dragging backwards opens the Regression Dialog (4.CX02). Dragging to a non-adjacent column is not allowed. |
| R-CX28 | **Column counts**   | Each column header shows: total OPs in that stage, count of overdue OPs (red badge), count of OPs with safety margin consumed (yellow badge).                                                                                                             |

#### Screen 4.CX07 — Production Kanban

```
+------------------------------------------------------------------------------+
|  PLM > Kanban de Producao                     [Lista] [Kanban*] [Calendario] |
+------------------------------------------------------------------------------+
|                                                                              |
|  Colecao: [Inverno 2026  v]   Prioridade: [Todas  v]   Buscar: [________]  |
|                                                                              |
|  +----------+----------+----------+----------+----------+----------+------+ |
|  | CONCEITO | MODELAG. | AMOSTRA  | APROVAC. | COMPRA   | CORTE    | ...  | |
|  |   (3)    |   (2)    |  (4)[!2] |   (1)    | MAT.(3)  |  (5)[!!1]|      | |
|  +----------+----------+----------+----------+----------+----------+------+ |
|  |          |          |          |          |          |          |      | |
|  | +------+ | +------+ | +------+ | +------+ | +------+ | +------+ |      | |
|  | |OP-012| | |OP-003| | |OP-007| | |OP-015| | |OP-001| | |OP-004| |      | |
|  | |Camisa| | |Calca | | |Moleto| | |Bermu | | |Camise| | |Moleto| |      | |
|  | |Polo  | | |Cargo | | |m Over| | |da    | | |ta Pr | | |m Cin | |      | |
|  | |      | | |      | | |[!!]  | | |      | | |eta   | | |za    | |      | |
|  | |MEDIA | | |ALTA  | | |CRIT. | | |MEDIA | | |ALTA  | | |CRIT. | |      | |
|  | |12/04 | | |15/04 | | |05/04 | | |20/04 | | |10/04 | | |03/04 | |      | |
|  | +------+ | +------+ | +------+ | +------+ | +------+ | +------+ |      | |
|  |          |          |          |          |          |          |      | |
|  | +------+ | +------+ | +------+ |          | +------+ | +------+ |      | |
|  | |OP-018| | |OP-009| | |OP-010| |          | |OP-006| | |OP-008| |      | |
|  | |Short | | |Regata| | |Jaque | |          | |Calca | | |Camise| |      | |
|  | |Tactel| | |Mesh  | | |ta    | |          | |Jeans | | |ta Lo | |      | |
|  | |      | | |      | | |[!]   | |          | |      | | |go    | |      | |
|  | |BAIXA | | |MEDIA | | |ALTA  | |          | |MEDIA | | |[!!]  | |      | |
|  | |25/04 | | |18/04 | | |08/04 | |          | |15/04 | | |01/04 | |      | |
|  | +------+ | +------+ | +------+ |          | +------+ | +------+ |      | |
|  +----------+----------+----------+----------+----------+----------+------+ |
|                                                                              |
|  Card legend:                                                                |
|    [!!] = Overdue (red border)   [!] = Safety margin consumed (yellow)      |
|    CRIT./ALTA/MEDIA/BAIXA = Priority    DD/MM = Deadline                    |
|    Drag card right = advance (opens dialog)                                  |
|    Drag card left = regress (opens regression dialog)                        |
+------------------------------------------------------------------------------+
```

---

### 13.7 Attachments / Image Upload on OP (F2)

**Gap:** No image fields on the OP. Technical drawings, croquis, visual references — all go to Google Drive, which is exactly what Ambaril replaces.

**Solution:** Attachments are handled via the `pcp.spec_images` table (section 13.3) on the Product Spec Sheet. Additionally, a lightweight attachment system is added directly on the OP for quick uploads that don't warrant a full spec sheet entry.

#### Data Model

**New table: `pcp.op_attachments`**

| Column              | Type         | Constraints                                              | Description                       |
| ------------------- | ------------ | -------------------------------------------------------- | --------------------------------- |
| id                  | UUID         | PK, DEFAULT gen_random_uuid()                            |                                   |
| production_order_id | UUID         | NOT NULL, FK pcp.production_orders(id) ON DELETE CASCADE |                                   |
| stage_id            | UUID         | NULL, FK pcp.production_stages(id)                       | Optional link to a specific stage |
| file_url            | VARCHAR(512) | NOT NULL                                                 | R2 storage URL via DAM            |
| file_name           | VARCHAR(255) | NOT NULL                                                 | Original file name                |
| file_type           | VARCHAR(50)  | NOT NULL                                                 | MIME type                         |
| file_size_bytes     | INTEGER      | NOT NULL                                                 | File size in bytes                |
| uploaded_by         | UUID         | NOT NULL, FK global.users(id)                            |                                   |
| created_at          | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                                   |                                   |

```sql
CREATE INDEX idx_pcp_oa_order ON pcp.op_attachments (production_order_id);
CREATE INDEX idx_pcp_oa_stage ON pcp.op_attachments (stage_id) WHERE stage_id IS NOT NULL;
```

#### User Stories

| #       | As a...              | I want to...                                                                         | So that...                                                   |
| ------- | -------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| US-CX28 | Tavares (operations) | upload images and files directly to an OP (technical drawings, references, photos)   | visual assets are linked to the OP, not lost in Google Drive |
| US-CX29 | Tavares              | attach files to a specific production stage (e.g., cut pattern to the Cutting stage) | each stage has its relevant documents                        |
| US-CX30 | Tavares              | view all attachments for an OP in a gallery grid                                     | I can quickly browse all visual assets for a product         |

#### Rules

| #      | Rule             | Detail                                                                                                                                                                                                       |
| ------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-CX29 | **File storage** | All OP attachments are stored in Cloudflare R2 via DAM. Path: `pcp/{tenant_id}/{op_id}/{filename}`. Max 20 attachments per OP. Max file size 25MB. Accepted formats: PNG, JPG, WEBP, SVG, PDF, DXF, AI, CDR. |

---

### 13.8 Collection Map Visual (F3)

**Gap:** No visual view of products grouped by category/segment within a collection. Marcus described wanting "a digital version of the PDF with all the croquis" — currently assembled manually.

#### User Stories

| #       | As a...   | I want to...                                                                                                                          | So that...                                                |
| ------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| US-CX31 | Caio (PM) | view a visual collection map showing all products grouped by category (camisetas, calcas, moletons, acessorios) with thumbnail images | I can see the collection's visual composition at a glance |

#### Screen 4.CX08 — Collection Map

```
+------------------------------------------------------------------------------+
|  PLM > Colecoes > Inverno 2026 > Mapa da Colecao        [Exportar PDF]     |
+------------------------------------------------------------------------------+
|                                                                              |
|  Filtrar por: [Todas categorias  v]  [Todos status  v]                      |
|                                                                              |
|  CAMISETAS (8 pecas)                                                         |
|  +--------+  +--------+  +--------+  +--------+  +--------+  +--------+    |
|  | [img]  |  | [img]  |  | [img]  |  | [img]  |  | [img]  |  | [img]  |    |
|  | Basic  |  | Logo   |  | Gola V |  | Polo   |  | Over   |  | Croppe |    |
|  | Preta  |  | Front  |  |        |  |        |  | size   |  | d      |    |
|  | OP-001 |  | OP-005 |  | OP-012 |  | OP-018 |  | OP-020 |  | OP-022 |    |
|  | [Corte]|  | [Conc] |  | [Aprov]|  | [Conc] |  | [Cost] |  | [Conc] |    |
|  +--------+  +--------+  +--------+  +--------+  +--------+  +--------+    |
|                                                                              |
|  MOLETONS (4 pecas)                                                          |
|  +--------+  +--------+  +--------+  +--------+                             |
|  | [img]  |  | [img]  |  | [img]  |  | [img]  |                             |
|  | Over   |  | Cinza  |  | Capuz  |  | Zip    |                             |
|  | size   |  | Basico |  | Canguru|  | Full   |                             |
|  | OP-002 |  | OP-004 |  | OP-011 |  | OP-016 |                             |
|  | [Grad] |  | [Conc] |  | [Amost]|  | [Conc] |                             |
|  +--------+  +--------+  +--------+  +--------+                             |
|                                                                              |
|  CALCAS (3 pecas)                                                            |
|  +--------+  +--------+  +--------+                                          |
|  | [img]  |  | [img]  |  | [img]  |                                          |
|  | Cargo  |  | Jeans  |  | Jogger |                                          |
|  | Wide   |  | Slim   |  |        |                                          |
|  | OP-003 |  | OP-008 |  | OP-014 |                                          |
|  | [Model]|  | [Corte]|  | [Conc] |                                          |
|  +--------+  +--------+  +--------+                                          |
|                                                                              |
|  Totais: 24 pecas | 8 camisetas | 4 moletons | 3 calcas | 9 outros         |
+------------------------------------------------------------------------------+
```

---

### 13.9 Catalog / Lookbook View (F4)

**Gap:** No catalog-style visualization with product photo + data side by side. ISA has a card-based view with photos.

#### User Stories

| #       | As a...   | I want to...                                                                        | So that...                                        |
| ------- | --------- | ----------------------------------------------------------------------------------- | ------------------------------------------------- |
| US-CX32 | Caio (PM) | view products in a lookbook/catalog layout with large photo + key data side by side | I can present the collection visually in meetings |
| US-CX33 | Caio      | enter fullscreen mode on the catalog view                                           | I can present the lookbook on a projector         |

#### Screen 4.CX09 — Catalog / Lookbook View

```
+------------------------------------------------------------------------------+
|  PLM > Colecoes > Inverno 2026 > Catalogo       [Lista] [Mapa] [Catalogo*] |
+------------------------------------------------------------------------------+
|                                                                              |
|  +-----------------------------------------------------------------------+  |
|  |                                                              |         |  |
|  |                                                              | OP-001  |  |
|  |                                                              | Camiseta|  |
|  |                   [FOTO GRANDE]                              | Preta   |  |
|  |                   do produto                                 | Basic P |  |
|  |                                                              |         |  |
|  |                                                              | SKU:    |  |
|  |                                                              | CIE-CAM |  |
|  |                                                              | -001-P  |  |
|  |                                                              |         |  |
|  |                                                              | Comp:   |  |
|  |                                                              | 100%    |  |
|  |                                                              | Algodao |  |
|  |                                                              |         |  |
|  |                                                              | Cores:  |  |
|  |                                                              | Preto   |  |
|  |                                                              | Branco  |  |
|  |                                                              |         |  |
|  |                                                              | Preco:  |  |
|  |                                                              | R$99,90 |  |
|  |                                                              |         |  |
|  +-----------------------------------------------------------------------+  |
|                                                                              |
|  [< Anterior]        Pagina 1 de 24          [Proximo >]  [Tela Cheia]     |
+------------------------------------------------------------------------------+
```

---

### 13.10 Product Mix Aggregated View (F5)

**Gap:** No aggregated view showing planned vs actual product mix within a collection. Critical for PCP — Tavares needs to know "20 camisetas Linha DNA + 15 calcas Linha Basics" to plan purchases. Colecao.moda has "collection skeleton" (define types and quantities before creating OPs).

#### User Stories

| #       | As a...              | I want to...                                                                                                         | So that...                                                                   |
| ------- | -------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| US-CX34 | Tavares (operations) | define a collection skeleton (planned product mix: X camisetas, Y calcas, Z moletons) before creating individual OPs | I can plan the collection structure and measure adherence as OPs are created |
| US-CX35 | Tavares              | see planned vs actual product mix side by side                                                                       | I know if the collection is on track or deviating from the plan              |
| US-CX36 | Caio (PM)            | view the product mix summary: "Colecao Inverno 2026 → 45 pecas → 20 Linha DNA / 15 Linha Basics / 10 Capsula"        | I can report collection composition in team meetings                         |

#### Data Model

**New table: `pcp.collection_mix_plan`**

| Column          | Type         | Constraints                                        | Description                                                 |
| --------------- | ------------ | -------------------------------------------------- | ----------------------------------------------------------- |
| id              | UUID         | PK, DEFAULT gen_random_uuid()                      |                                                             |
| collection_id   | UUID         | NOT NULL, FK pcp.collections(id) ON DELETE CASCADE |                                                             |
| product_type_id | UUID         | NULL, FK pcp.product_types(id)                     | Standardized product type. See section 13.25                |
| category_label  | VARCHAR(100) | NOT NULL                                           | Display label. e.g., 'Camisetas Linha DNA', 'Calcas Basics' |
| planned_qty     | INTEGER      | NOT NULL, CHECK (planned_qty > 0)                  | How many OPs planned for this category                      |
| sort_order      | INTEGER      | NOT NULL DEFAULT 0                                 |                                                             |
| created_at      | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                             |                                                             |
| updated_at      | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                             |                                                             |

```sql
CREATE INDEX idx_pcp_cmp_collection ON pcp.collection_mix_plan (collection_id);
```

#### Rules

| #      | Rule                       | Detail                                                                                                                                                                                |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX30 | **Actual mix calculation** | The system calculates actual mix by counting OPs per `product_type_id` (or custom category) within the collection. Displayed as `actual_qty / planned_qty` with adherence percentage. |
| R-CX31 | **Mix deviation alert**    | When actual mix deviates from planned by more than 20% in any category (either over or under), emit Flare event `collection.mix_deviation` to `operations` and `pm` roles.            |

#### Screen 4.CX10 — Product Mix View

```
+------------------------------------------------------------------------------+
|  PLM > Colecoes > Inverno 2026 > Mix de Produto                             |
+------------------------------------------------------------------------------+
|                                                                              |
|  RESUMO: 45 pecas planejadas | 38 criadas | 84% aderencia                   |
|                                                                              |
|  +----------------------------+----------+----------+---------+-----------+  |
|  | Categoria                  | Planejado| Criado   | Aderenc.| Status    |  |
|  +----------------------------+----------+----------+---------+-----------+  |
|  | Camisetas Linha DNA        |    20    |    18    |   90%   | [OK]      |  |
|  | Calcas Linha Basics        |    15    |    12    |   80%   | [OK]      |  |
|  | Capsula Collab             |    10    |     8    |   80%   | [OK]      |  |
|  +----------------------------+----------+----------+---------+-----------+  |
|  | TOTAL                      |    45    |    38    |   84%   |           |  |
|  +----------------------------+----------+----------+---------+-----------+  |
|                                                                              |
|  VISUAL                                                                      |
|  [████████████████████████████████████░░░░] Camisetas DNA    18/20          |
|  [████████████████████████░░░░░░░░░░░░░░░] Calcas Basics    12/15          |
|  [████████████████░░░░░░░░░░░░░░░░░░░░░░░] Capsula Collab    8/10          |
|                                                                              |
|  [Editar Mix Planejado]                                                     |
+------------------------------------------------------------------------------+
```

---

### 13.11 OP Comments / Chat (F6)

**Gap:** To comment about a specific product/OP, Tavares has to go to the linked Tarefas task. There is no direct commenting on the OP itself. ISA has threaded comments on cards.

#### Data Model

**New table: `pcp.op_comments`**

| Column              | Type        | Constraints                                              | Description                                              |
| ------------------- | ----------- | -------------------------------------------------------- | -------------------------------------------------------- |
| id                  | UUID        | PK, DEFAULT gen_random_uuid()                            |                                                          |
| production_order_id | UUID        | NOT NULL, FK pcp.production_orders(id) ON DELETE CASCADE |                                                          |
| parent_comment_id   | UUID        | NULL, FK pcp.op_comments(id)                             | For threaded replies. NULL = top-level comment           |
| author_id           | UUID        | NOT NULL, FK global.users(id)                            |                                                          |
| body                | TEXT        | NOT NULL                                                 | Comment text. Supports @mentions via `@[user_id]` syntax |
| created_at          | TIMESTAMPTZ | NOT NULL DEFAULT NOW()                                   |                                                          |
| updated_at          | TIMESTAMPTZ | NOT NULL DEFAULT NOW()                                   |                                                          |
| deleted_at          | TIMESTAMPTZ | NULL                                                     | Soft delete                                              |

```sql
CREATE INDEX idx_pcp_oc_order ON pcp.op_comments (production_order_id);
CREATE INDEX idx_pcp_oc_parent ON pcp.op_comments (parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_pcp_oc_author ON pcp.op_comments (author_id);
```

#### User Stories

| #       | As a...              | I want to...                                                              | So that...                                                                                  |
| ------- | -------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| US-CX37 | Tavares (operations) | add comments directly on an OP detail page                                | product-related discussions are centralized on the OP, not scattered in Tarefas or WhatsApp |
| US-CX38 | Tavares              | @mention team members in OP comments and have them receive a notification | relevant people are notified about product discussions without manual follow-up             |
| US-CX39 | Tavares              | reply to a specific comment (threaded discussion)                         | conversations stay organized with context                                                   |

#### Rules

| #      | Rule                       | Detail                                                                                                                                                                                                                           |
| ------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX32 | **@mention notifications** | When a comment contains `@[user_id]`, the system emits Flare event `production.comment_mention` to the mentioned user. Channels: in-app notification. The notification deep-links to the OP detail page scrolled to the comment. |
| R-CX33 | **Comment visibility**     | OP comments are visible to all users with `pcp:production-orders:read` permission. Suppliers (via portal) CANNOT see internal comments.                                                                                          |

---

### 13.12 Copy / Move Product Between Collections (F7)

**Gap:** No way to clone an OP from a previous collection with adjustments (carry-over items). In Colecao.moda, "Aproveitamentos" is a core workflow — recurring basic tees, essential pants, etc. don't need full re-development.

#### User Stories

| #       | As a...              | I want to...                                                                                          | So that...                                                             |
| ------- | -------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| US-CX40 | Tavares (operations) | clone an OP from a previous collection into a new collection with adjustments (quantity, dates, drop) | recurring products don't need to be created from scratch every season  |
| US-CX41 | Tavares              | see which OPs in a collection are carry-overs (reuse) vs. new developments                            | I can distinguish new designs from repeated products in the collection |

#### Rules

| #      | Rule            | Detail                                                                                                                                                                                                                                                                                                                                                                |
| ------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX34 | **OP cloning**  | When cloning an OP, the system copies: name, description, sku_id, priority, custom_fields, product_spec (with all cost items, images, measurements), and BOM. It does NOT copy: stages (new stages are created fresh), dates (set by user), supplier assignments, or rework orders. The cloned OP gets `is_reuse = true` and `source_op_id` pointing to the original. |
| R-CX35 | **Reuse badge** | OPs with `is_reuse = true` display a "Aproveitamento" badge on the OP list and detail views. The badge links to the source OP for reference.                                                                                                                                                                                                                          |

---

### 13.13 Enriched Materials Library (F8)

**Gap:** `pcp.raw_materials` is a simplified registry without physical properties. Colecao.moda has a rich fabric library with weight (gramatura), width, shrinkage, construction, images, and automatic yield calculation.

**Solution:** Physical properties have been added to `pcp.raw_materials` in Fase 1 (section 3.3.8). This section adds user stories and yield calculation rules.

#### User Stories

| #       | As a...              | I want to...                                                                                              | So that...                                                                         |
| ------- | -------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| US-CX42 | Tavares (operations) | register fabric properties (gramatura, largura, encolhimento, construcao) when adding a material          | material data is complete for yield calculations and supplier specs                |
| US-CX43 | Tavares              | upload images of materials (fabric swatches, trim photos)                                                 | visual reference is available when selecting materials for a product               |
| US-CX44 | Tavares              | register available colors for each material with hex codes                                                | I can visually match materials to product designs                                  |
| US-CX45 | System               | calculate fabric yield/consumption based on physical properties (width, shrinkage) and garment dimensions | material requirements are calculated automatically, reducing waste and cost errors |

#### Rules

| #      | Rule                       | Detail                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX36 | **Yield calculation**      | Fabric consumption per garment = `(garment_area / (fabric_width * (1 - shrinkage_pct/100))) * (1 + waste_allowance)`. Where `garment_area` is derived from the product measurements (section 13.14), `fabric_width` is from `pcp.raw_materials.width_cm`, `shrinkage_pct` is from `pcp.raw_materials.shrinkage_pct`, and `waste_allowance` defaults to 10% (configurable per tenant). Result is in meters. |
| R-CX37 | **Material image storage** | Material images are stored in R2 via DAM. Path: `materials/{tenant_id}/{material_id}/{filename}`. Max 5 images per material.                                                                                                                                                                                                                                                                               |
| R-CX38 | **Color swatch display**   | Material colors are stored as JSONB array in `pcp.raw_materials.colors`. Each entry has `{name, hex_code}`. Displayed as colored circles in the material detail and material selection dropdowns.                                                                                                                                                                                                          |

---

### 13.14 Automatic Size Grading (F9)

**Gap:** No measurement table or grading concept in the schema. Colecao.moda has automatic grading: enter the pilot size measurements, define grade rules, and the system calculates the entire size range.

#### Data Model

**New table: `pcp.product_measurements`**

| Column           | Type         | Constraints                                          | Description                                                                      |
| ---------------- | ------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| id               | UUID         | PK, DEFAULT gen_random_uuid()                        |                                                                                  |
| product_spec_id  | UUID         | NOT NULL, FK pcp.product_specs(id) ON DELETE CASCADE |                                                                                  |
| measurement_name | VARCHAR(100) | NOT NULL                                             | e.g., 'Peito', 'Cintura', 'Comprimento', 'Manga', 'Ombro'                        |
| unit             | VARCHAR(10)  | NOT NULL DEFAULT 'cm'                                | Measurement unit (cm, in)                                                        |
| pilot_size       | VARCHAR(10)  | NOT NULL                                             | The size used as base for grading. e.g., 'M'                                     |
| pilot_value      | NUMERIC(8,2) | NOT NULL                                             | Measurement value for the pilot size                                             |
| grade_increment  | NUMERIC(8,2) | NOT NULL DEFAULT 2.00                                | How much to add/subtract per size step (e.g., +2cm per size up)                  |
| sizes            | JSONB        | NOT NULL DEFAULT '{}'                                | Calculated measurements per size. e.g., `{"PP":48,"P":50,"M":52,"G":54,"GG":56}` |
| sort_order       | INTEGER      | NOT NULL DEFAULT 0                                   | Display order                                                                    |
| created_at       | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                               |                                                                                  |
| updated_at       | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                               |                                                                                  |

```sql
CREATE INDEX idx_pcp_pm_spec ON pcp.product_measurements (product_spec_id);
```

#### User Stories

| #       | As a...              | I want to...                                                                                          | So that...                                                                                |
| ------- | -------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| US-CX46 | Tavares (operations) | enter measurements for the pilot size (peito, cintura, comprimento, etc.) and define grade increments | the system can calculate measurements for all sizes automatically                         |
| US-CX47 | Tavares              | see the complete measurement table for all sizes (PP through GG) auto-calculated from the pilot       | I don't have to manually calculate each size and can send the table directly to suppliers |

#### Rules

| #      | Rule                                       | Detail                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX39 | **Auto-grading calculation**               | Given a `pilot_size` (e.g., 'M'), `pilot_value` (e.g., 52cm), and `grade_increment` (e.g., 2cm), the system calculates measurements for each size in the tenant's size range. Default size range: `['PP','P','M','G','GG','XGG']`. For sizes smaller than pilot: `value = pilot_value - (steps_down * grade_increment)`. For sizes larger: `value = pilot_value + (steps_up * grade_increment)`. Results stored in `sizes` JSONB. |
| R-CX40 | **Custom grade increment per measurement** | Each measurement row can have its own `grade_increment`. e.g., chest might grade at +2cm per size while sleeve length grades at +1.5cm.                                                                                                                                                                                                                                                                                           |

#### Screen (within Product Spec Sheet Tab: Medidas)

```
+------------------------------------------------------------------------------+
|  TAB: MEDIDAS                                                                |
|  -------------                                                               |
|                                                                              |
|  Tamanho piloto: [M]    Grade: [PP, P, M, G, GG, XGG]                      |
|                                                                              |
|  +---------------+--------+------+------+------+------+------+------+       |
|  | Medida        | Increm.| PP   | P    | M*   | G    | GG   | XGG  |       |
|  +---------------+--------+------+------+------+------+------+------+       |
|  | Peito (cm)    | +2.0   | 48.0 | 50.0 | 52.0 | 54.0 | 56.0 | 58.0 |       |
|  | Cintura (cm)  | +2.0   | 42.0 | 44.0 | 46.0 | 48.0 | 50.0 | 52.0 |       |
|  | Comprimento   | +1.5   | 65.0 | 66.5 | 68.0 | 69.5 | 71.0 | 72.5 |       |
|  | Manga (cm)    | +1.0   | 19.0 | 20.0 | 21.0 | 22.0 | 23.0 | 24.0 |       |
|  | Ombro (cm)    | +1.0   | 40.0 | 41.0 | 42.0 | 43.0 | 44.0 | 45.0 |       |
|  +---------------+--------+------+------+------+------+------+------+       |
|                                                                              |
|  * = Tamanho piloto (base para calculo)                                     |
|  [+ Adicionar Medida]                                                       |
+------------------------------------------------------------------------------+
```

---

### 13.15 PDF Export — Product Spec Sheet (F10)

**Gap:** No PDF export of tech spec sheets. Every supplier receives spec sheets. Without export, users go back to manual PDF creation.

#### User Stories

| #       | As a...              | I want to...                                                                                           | So that...                                       |
| ------- | -------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| US-CX48 | Tavares (operations) | export a product spec sheet as a formatted PDF with the tenant's logo                                  | I can send professional spec sheets to suppliers |
| US-CX49 | Tavares              | select which sections/fields to include in the PDF (hide costs for suppliers, show costs for internal) | different recipients get appropriate information |

#### Rules

| #      | Rule                        | Detail                                                                                                                                                                                                                                                                  |
| ------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX41 | **PDF generation**          | PDF is generated server-side using a headless rendering pipeline. Includes: tenant logo (from `global.tenants.logo_url`), product images, measurement table, materials list, operational sequence, and optionally cost breakdown. Layout is standardized (A4 portrait). |
| R-CX42 | **Field selection presets** | Two default presets: (1) **Fornecedor** — excludes all cost fields, approved price, margin. Shows: images, measurements, materials (without costs), operational sequence. (2) **Interno** — includes everything. Tavares can create custom presets.                     |

---

### 13.16 Exportable Collection Map (F11)

**Gap:** Marcus wants a digital version of "the PDF with all the croquis" for presentations.

#### User Stories

| #       | As a...   | I want to...                                                                                        | So that...                                                   |
| ------- | --------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| US-CX50 | Caio (PM) | export the collection map (section 13.8) as a PDF with all product thumbnails organized by category | I can share the visual collection overview with stakeholders |

---

### 13.17 Bulk Edit (F12)

**Gap:** No way to update a field across multiple OPs at once. Colecao.moda supports bulk fabric changes across all products.

#### User Stories

| #       | As a...              | I want to...                                                                              | So that...                                                                         |
| ------- | -------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| US-CX51 | Tavares (operations) | select multiple OPs and update a field in batch (priority, supplier, dates, custom field) | I can make collection-wide changes without editing each OP individually            |
| US-CX52 | Tavares              | advance multiple OPs through the same stage at once (bulk stage advance)                  | I can process batch completions efficiently (e.g., all OPs finished cutting today) |

#### Rules

| #      | Rule                       | Detail                                                                                                                                                                                                                          |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX43 | **Bulk update validation** | Each OP in a bulk update is validated individually. If any OP fails validation (e.g., stage advance out of order), that OP is skipped and reported in the response. Successfully updated OPs proceed normally.                  |
| R-CX44 | **Bulk stage advance**     | Bulk stage advance opens a single confirmation dialog with a summary: "Avancando X OPs do estagio Y para Z". Each OP gets its own audit log entry. Supplier ratings are prompted individually after the bulk advance completes. |

---

### 13.18 Spreadsheet Import (F13)

**Gap:** No way to import data from spreadsheets. Brands migrating from Colecao.moda or their own spreadsheets need data import.

#### User Stories

| #       | As a...              | I want to...                                                 | So that...                                                        |
| ------- | -------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| US-CX53 | Tavares (operations) | import fabric and trim data from a CSV/Excel spreadsheet     | I can quickly populate the materials library without manual entry |
| US-CX54 | Tavares              | import a collection's planned product mix from a spreadsheet | I can transfer my existing planning data into Ambaril             |

---

### 13.19 Custom Tags (F14)

**Gap:** No user-created tag system. Colecao.moda has custom tags with filtering. ISA allows arbitrary field-based filtering.

#### Data Model

**New table: `pcp.tags`**

| Column     | Type         | Constraints                     | Description                                                                    |
| ---------- | ------------ | ------------------------------- | ------------------------------------------------------------------------------ |
| id         | UUID         | PK, DEFAULT gen_random_uuid()   |                                                                                |
| tenant_id  | UUID         | NOT NULL, FK global.tenants(id) |                                                                                |
| name       | VARCHAR(100) | NOT NULL                        | Tag name. e.g., 'Bestseller', 'Collab', 'Prioridade Desfile', 'Atencao Tecido' |
| color      | VARCHAR(7)   | NULL                            | Hex color for badge. e.g., '#EF4444'                                           |
| created_at | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()          |                                                                                |

```sql
CREATE INDEX idx_pcp_tags_tenant ON pcp.tags (tenant_id);
CREATE UNIQUE INDEX idx_pcp_tags_name ON pcp.tags (tenant_id, name);
```

**New table: `pcp.op_tags`**

| Column              | Type | Constraints                                              | Description |
| ------------------- | ---- | -------------------------------------------------------- | ----------- |
| production_order_id | UUID | NOT NULL, FK pcp.production_orders(id) ON DELETE CASCADE |             |
| tag_id              | UUID | NOT NULL, FK pcp.tags(id) ON DELETE CASCADE              |             |
| PRIMARY KEY         |      | (production_order_id, tag_id)                            |             |

```sql
CREATE INDEX idx_pcp_ot_tag ON pcp.op_tags (tag_id);
```

#### User Stories

| #       | As a...              | I want to...                             | So that...                                                                   |
| ------- | -------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| US-CX55 | Tavares (operations) | create custom tags and apply them to OPs | I can organize and categorize OPs with my own taxonomy                       |
| US-CX56 | Tavares              | filter the OP list by one or more tags   | I can quickly find all OPs with a specific tag (e.g., all 'Collab' products) |

#### Rules

| #      | Rule              | Detail                                                                                                                                                                    |
| ------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX45 | **Tag filtering** | The OP list endpoint (`GET /production-orders`) accepts `tag_ids` query parameter (comma-separated UUIDs). Multiple tags use AND logic (OP must have all specified tags). |

---

### 13.20 Internal Team Member per Stage (F15)

**Gap:** `assigned_supplier_id` is for the external supplier. There is no field for the internal team member responsible for supervising a stage.

**Solution:** `assigned_team_member_id` has been added to `pcp.production_stages` in Fase 1 (section 3.3.4).

#### User Stories

| #       | As a...              | I want to...                                                   | So that...                                                                          |
| ------- | -------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| US-CX57 | Tavares (operations) | assign an internal team member to supervise a production stage | there is a clear internal owner for each stage, separate from the external supplier |

---

### 13.21 Enriched Collection Properties (F16)

**Gap:** `pcp.collections` has no fields for cover image, color palette, prints, or rich description. ISA and Colecao.moda have these.

**Solution:** Fields have been added to `pcp.collections` in Fase 1 (section 3.3.1).

#### User Stories

| #       | As a...   | I want to...                                                                    | So that...                                                  |
| ------- | --------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| US-CX58 | Caio (PM) | set a cover image, color palette, and prints/patterns for a collection          | the collection has a visual identity beyond just a name     |
| US-CX59 | Caio      | write a rich description for a collection (theme, inspiration, target audience) | the collection's creative brief is documented in the system |

---

### 13.22 Stage Counters on Collection Overview (F17)

**Gap:** Collection Overview (4.11) shows total/on-track/delayed but not "how many OPs in each specific stage" or "how many overdue per stage."

#### User Stories

| #       | As a...   | I want to...                                                                                                   | So that...                                                                            |
| ------- | --------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| US-CX60 | Caio (PM) | see stage-by-stage counters on the Collection Overview: how many OPs in each stage, how many overdue per stage | I can identify specific bottleneck stages (e.g., "5 OPs stuck in Amostra, 3 overdue") |

---

### 13.23 Delivery Calendar Report (F18)

**Gap:** No calendar view showing "day X has 5 pieces leaving cutting, 3 from sewing." Colecao.moda has this.

#### User Stories

| #       | As a...              | I want to...                                                                                                         | So that...                                                                    |
| ------- | -------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| US-CX61 | Tavares (operations) | see a calendar view showing which stages are due on which days (e.g., "April 5: 5 OPs corte due, 3 OPs costura due") | I can plan my week and coordinate with suppliers based on expected deliveries |

#### Screen 4.CX11 — Delivery Calendar

```
+------------------------------------------------------------------------------+
|  PLM > Calendario de Entregas                  [Lista] [Kanban] [Calendario*]|
+------------------------------------------------------------------------------+
|                                                                              |
|  Colecao: [Inverno 2026  v]    << Marco 2026 >>    [Hoje]                  |
|                                                                              |
|  +------+------+------+------+------+------+------+                         |
|  | Seg  | Ter  | Qua  | Qui  | Sex  | Sab  | Dom  |                         |
|  +------+------+------+------+------+------+------+                         |
|  |      |      |      |      |  1   |  2   |  3   |                         |
|  +------+------+------+------+------+------+------+                         |
|  |  4   |  5   |  6   |  7   |  8   |  9   | 10   |                         |
|  |      | Corte| Model|      | Amost|      |      |                         |
|  |      | (5)  | (2)  |      | (3)  |      |      |                         |
|  |      |[!!2] |      |      |      |      |      |                         |
|  +------+------+------+------+------+------+------+                         |
|  | 11   | 12   | 13   | 14   | 15   | 16   | 17   |                         |
|  | Costu| QC   |      | Corte|      | Acaba|      |                         |
|  | ra(4)| (2)  |      | (3)  |      | (2)  |      |                         |
|  |      |      |      |[!1]  |      |      |      |                         |
|  +------+------+------+------+------+------+------+                         |
|  | ...                                             |                         |
|                                                                              |
|  Legend: (N) = N stages due    [!!N] = N overdue    [!N] = N at risk        |
|  Click a day cell to see the detailed list of stages due                    |
+------------------------------------------------------------------------------+
```

---

### 13.24 Manual Reminders (F19)

**Gap:** ISA has user-defined manual reminders (date+time+message) per card. Ambaril only has system-generated alerts.

#### Data Model

**New table: `pcp.reminders`**

| Column              | Type        | Constraints                                          | Description                               |
| ------------------- | ----------- | ---------------------------------------------------- | ----------------------------------------- |
| id                  | UUID        | PK, DEFAULT gen_random_uuid()                        |                                           |
| production_order_id | UUID        | NULL, FK pcp.production_orders(id) ON DELETE CASCADE | Link to OP (optional — can be standalone) |
| stage_id            | UUID        | NULL, FK pcp.production_stages(id)                   | Link to specific stage (optional)         |
| created_by          | UUID        | NOT NULL, FK global.users(id)                        |                                           |
| remind_at           | TIMESTAMPTZ | NOT NULL                                             | When to send the reminder                 |
| message             | TEXT        | NOT NULL                                             | Reminder message                          |
| is_sent             | BOOLEAN     | NOT NULL DEFAULT FALSE                               | Set to true after reminder is dispatched  |
| created_at          | TIMESTAMPTZ | NOT NULL DEFAULT NOW()                               |                                           |

```sql
CREATE INDEX idx_pcp_rem_order ON pcp.reminders (production_order_id) WHERE production_order_id IS NOT NULL;
CREATE INDEX idx_pcp_rem_due ON pcp.reminders (remind_at) WHERE is_sent = FALSE;
```

#### User Stories

| #       | As a...              | I want to...                                                                   | So that...                                                                       |
| ------- | -------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| US-CX62 | Tavares (operations) | create a manual reminder on an OP or stage with a custom date/time and message | I can set personal reminders for follow-ups that aren't covered by system alerts |
| US-CX63 | Tavares              | see all my upcoming reminders in a list                                        | I have an overview of all pending follow-ups                                     |

---

### 13.25 Standardized Product Types (F20)

**Gap:** No standardized product type catalog. OPs have a free-text name but no structured category linking to industry-standard garment types.

#### Data Model

**New table: `pcp.product_types`**

| Column               | Type         | Constraints                     | Description                                                                                                     |
| -------------------- | ------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| id                   | UUID         | PK, DEFAULT gen_random_uuid()   |                                                                                                                 |
| tenant_id            | UUID         | NOT NULL, FK global.tenants(id) |                                                                                                                 |
| name                 | VARCHAR(100) | NOT NULL                        | e.g., 'Camiseta', 'Calca', 'Moletom', 'Bermuda', 'Jaqueta', 'Bone'                                              |
| slug                 | VARCHAR(100) | NOT NULL                        | e.g., 'camiseta', 'calca', 'moletom'                                                                            |
| icon                 | VARCHAR(50)  | NULL                            | Lucide icon name                                                                                                |
| default_measurements | JSONB        | NOT NULL DEFAULT '[]'           | Default measurement names for this product type. e.g., `["Peito","Cintura","Comprimento","Manga"]` for camiseta |
| is_active            | BOOLEAN      | NOT NULL DEFAULT TRUE           |                                                                                                                 |
| created_at           | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()          |                                                                                                                 |
| updated_at           | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()          |                                                                                                                 |

```sql
CREATE INDEX idx_pcp_pt_tenant ON pcp.product_types (tenant_id);
CREATE UNIQUE INDEX idx_pcp_pt_slug ON pcp.product_types (tenant_id, slug);
```

#### User Stories

| #       | As a...              | I want to...                                                                                              | So that...                                                        |
| ------- | -------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| US-CX64 | Marcus (admin)       | define standardized product types for my brand (camiseta, calca, moletom, etc.) with default measurements | OPs have structured categories, not just free-text names          |
| US-CX65 | Tavares (operations) | select a product type when creating an OP, which auto-populates measurement names on the spec sheet       | I don't have to manually type measurement names for every product |

#### Rules

| #      | Rule                      | Detail                                                                                                                                                                                    |
| ------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX46 | **Default product types** | When a tenant is created, seed common product types: Camiseta, Calca, Moletom, Bermuda, Jaqueta, Bone, Regata, Short, Saia, Vestido, Corset, Meia. Tenant can rename, add, or deactivate. |

---

### 13.26 Multiple Workflows (F21)

**Gap:** All OPs follow the same 11-stage pipeline. In reality, different product types may require different workflows (e.g., a t-shirt has a simple flow, while jeans require special washing/treatment stages).

#### Data Model

**New table: `pcp.workflows`**

| Column      | Type         | Constraints                     | Description                                              |
| ----------- | ------------ | ------------------------------- | -------------------------------------------------------- |
| id          | UUID         | PK, DEFAULT gen_random_uuid()   |                                                          |
| tenant_id   | UUID         | NOT NULL, FK global.tenants(id) |                                                          |
| name        | VARCHAR(100) | NOT NULL                        | e.g., 'Fluxo Camiseta', 'Fluxo Jeans', 'Fluxo Acessorio' |
| description | TEXT         | NULL                            |                                                          |
| is_default  | BOOLEAN      | NOT NULL DEFAULT FALSE          | Only one workflow can be default per tenant              |
| created_at  | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()          |                                                          |
| updated_at  | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()          |                                                          |

```sql
CREATE INDEX idx_pcp_wf_tenant ON pcp.workflows (tenant_id);
CREATE UNIQUE INDEX idx_pcp_wf_default ON pcp.workflows (tenant_id) WHERE is_default = TRUE;
```

**New table: `pcp.workflow_stages`**

| Column          | Type    | Constraints                                      | Description                                          |
| --------------- | ------- | ------------------------------------------------ | ---------------------------------------------------- |
| id              | UUID    | PK, DEFAULT gen_random_uuid()                    |                                                      |
| workflow_id     | UUID    | NOT NULL, FK pcp.workflows(id) ON DELETE CASCADE |                                                      |
| tenant_stage_id | UUID    | NOT NULL, FK pcp.tenant_stages(id)               | References the tenant's stage catalog                |
| sequence        | INTEGER | NOT NULL                                         | Order within this workflow                           |
| is_required     | BOOLEAN | NOT NULL DEFAULT TRUE                            | FALSE = stage can be skipped without explicit reason |
| estimated_days  | INTEGER | NULL                                             | Estimated duration for this stage in this workflow   |

```sql
CREATE INDEX idx_pcp_ws_workflow ON pcp.workflow_stages (workflow_id);
CREATE UNIQUE INDEX idx_pcp_ws_unique ON pcp.workflow_stages (workflow_id, tenant_stage_id);
```

#### User Stories

| #       | As a...              | I want to...                                                                                                              | So that...                                                                                     |
| ------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| US-CX66 | Marcus (admin)       | create multiple workflow templates (e.g., 'Fluxo Camiseta' with 8 stages, 'Fluxo Jeans' with 14 stages including washing) | different product types follow their appropriate manufacturing process                         |
| US-CX67 | Tavares (operations) | select which workflow to use when creating an OP                                                                          | the OP is created with the right stages for the product type, not a one-size-fits-all pipeline |

#### Rules

| #      | Rule                          | Detail                                                                                                                                                                                                                                                                                                  |
| ------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX47 | **Workflow stage creation**   | When an OP is created with a `workflow_id`, the system creates `pcp.production_stages` rows based on `pcp.workflow_stages` for that workflow (instead of the default 11 stages from R1). Each stage references the `tenant_stage_id`. The `stock_entry` stage MUST always be included (R-CX05 applies). |
| R-CX48 | **Default workflow fallback** | If no `workflow_id` is specified on OP creation, the system uses the tenant's default workflow (`is_default = true`). If no default workflow exists, it falls back to creating stages from all active `pcp.tenant_stages` in sequence order (backward-compatible with R1).                              |

---

### 13.27 New API Endpoints

All endpoints follow the patterns defined in [API.md](../../architecture/API.md). Module prefix: `/api/v1/pcp`.

#### 13.27.1 Tenant Stages

| Method | Path                             | Description                                             | Auth     | Permission           |
| ------ | -------------------------------- | ------------------------------------------------------- | -------- | -------------------- |
| GET    | `/tenant-stages`                 | List all stages for the tenant                          | Internal | `pcp:settings:read`  |
| POST   | `/tenant-stages`                 | Create a new stage                                      | Internal | `pcp:settings:write` |
| PATCH  | `/tenant-stages/:id`             | Update stage (rename, reorder, toggle active)           | Internal | `pcp:settings:write` |
| DELETE | `/tenant-stages/:id`             | Delete custom stage (default stages can only be hidden) | Internal | `pcp:settings:write` |
| POST   | `/tenant-stages/actions/reorder` | Bulk reorder stages                                     | Internal | `pcp:settings:write` |

#### 13.27.2 Product Specs

| Method | Path                                    | Description                                                 | Auth     | Permission                  |
| ------ | --------------------------------------- | ----------------------------------------------------------- | -------- | --------------------------- |
| GET    | `/product-specs`                        | List product specs (filterable by collection, status)       | Internal | `pcp:product-specs:read`    |
| GET    | `/product-specs/:id`                    | Get spec detail with all tabs (images, costs, measurements) | Internal | `pcp:product-specs:read`    |
| POST   | `/product-specs`                        | Create product spec (usually auto-created with OP)          | Internal | `pcp:product-specs:write`   |
| PATCH  | `/product-specs/:id`                    | Update product spec                                         | Internal | `pcp:product-specs:write`   |
| POST   | `/product-specs/:id/images`             | Upload image to spec                                        | Internal | `pcp:product-specs:write`   |
| DELETE | `/product-specs/:id/images/:imageId`    | Remove image from spec                                      | Internal | `pcp:product-specs:write`   |
| POST   | `/product-specs/:id/cost-items`         | Add cost item                                               | Internal | `pcp:product-specs:write`   |
| PATCH  | `/product-specs/:id/cost-items/:itemId` | Update cost item                                            | Internal | `pcp:product-specs:write`   |
| DELETE | `/product-specs/:id/cost-items/:itemId` | Remove cost item                                            | Internal | `pcp:product-specs:write`   |
| POST   | `/product-specs/:id/measurements`       | Add/update measurement row                                  | Internal | `pcp:product-specs:write`   |
| POST   | `/product-specs/:id/actions/approve`    | Approve spec (locks it, syncs cost to ERP)                  | Internal | `pcp:product-specs:approve` |
| GET    | `/product-specs/:id/export/pdf`         | Generate PDF export with field selection                    | Internal | `pcp:product-specs:read`    |

#### 13.27.3 Supplier Portal

| Method | Path                                                   | Description                               | Auth           | Permission              |
| ------ | ------------------------------------------------------ | ----------------------------------------- | -------------- | ----------------------- |
| GET    | `/supplier-portal/stages`                              | List stages assigned to the supplier      | Supplier token | `supplier:stages:read`  |
| GET    | `/supplier-portal/stages/:id`                          | Get stage detail (limited fields)         | Supplier token | `supplier:stages:read`  |
| GET    | `/supplier-portal/specs/:id`                           | Get product spec (cost hidden)            | Supplier token | `supplier:specs:read`   |
| POST   | `/supplier-portal/stages/:id/files`                    | Upload file to a stage                    | Supplier token | `supplier:stages:write` |
| POST   | `/supplier-portal/stages/:id/actions/confirm-delivery` | Confirm delivery (pending Tavares review) | Supplier token | `supplier:stages:write` |
| POST   | `/suppliers/:id/actions/generate-portal-link`          | Generate access link with token           | Internal       | `pcp:suppliers:write`   |

#### 13.27.4 OP Comments

| Method | Path                              | Description                        | Auth     | Permission                    |
| ------ | --------------------------------- | ---------------------------------- | -------- | ----------------------------- |
| GET    | `/production-orders/:id/comments` | List comments for an OP (threaded) | Internal | `pcp:production-orders:read`  |
| POST   | `/production-orders/:id/comments` | Add comment                        | Internal | `pcp:production-orders:write` |
| PATCH  | `/comments/:id`                   | Edit own comment                   | Internal | `pcp:production-orders:write` |
| DELETE | `/comments/:id`                   | Soft-delete own comment            | Internal | `pcp:production-orders:write` |

#### 13.27.5 Tags

| Method | Path                                 | Description                       | Auth     | Permission                     |
| ------ | ------------------------------------ | --------------------------------- | -------- | ------------------------------ |
| GET    | `/tags`                              | List all tags for the tenant      | Internal | `pcp:production-orders:read`   |
| POST   | `/tags`                              | Create a new tag                  | Internal | `pcp:production-orders:write`  |
| PATCH  | `/tags/:id`                          | Update tag (name, color)          | Internal | `pcp:production-orders:write`  |
| DELETE | `/tags/:id`                          | Delete tag (removes from all OPs) | Internal | `pcp:production-orders:delete` |
| POST   | `/production-orders/:id/tags`        | Add tag(s) to an OP               | Internal | `pcp:production-orders:write`  |
| DELETE | `/production-orders/:id/tags/:tagId` | Remove tag from an OP             | Internal | `pcp:production-orders:write`  |

#### 13.27.6 Stage Regression

| Method | Path                          | Description                                              | Auth     | Permission         |
| ------ | ----------------------------- | -------------------------------------------------------- | -------- | ------------------ |
| POST   | `/stages/:id/actions/regress` | Regress to a previous stage (requires regression_reason) | Internal | `pcp:stages:write` |

#### 13.27.7 Bulk Operations

| Method | Path                                     | Description                             | Auth     | Permission                    |
| ------ | ---------------------------------------- | --------------------------------------- | -------- | ----------------------------- |
| POST   | `/production-orders/actions/bulk-update` | Update field(s) on multiple OPs         | Internal | `pcp:production-orders:write` |
| POST   | `/stages/actions/bulk-complete`          | Advance multiple OPs through same stage | Internal | `pcp:stages:write`            |

#### 13.27.8 Reminders

| Method | Path             | Description                     | Auth     | Permission                    |
| ------ | ---------------- | ------------------------------- | -------- | ----------------------------- |
| GET    | `/reminders`     | List reminders for current user | Internal | `pcp:production-orders:read`  |
| POST   | `/reminders`     | Create a reminder               | Internal | `pcp:production-orders:write` |
| PATCH  | `/reminders/:id` | Update reminder                 | Internal | `pcp:production-orders:write` |
| DELETE | `/reminders/:id` | Delete reminder                 | Internal | `pcp:production-orders:write` |

#### 13.27.9 Workflows

| Method | Path             | Description                             | Auth     | Permission           |
| ------ | ---------------- | --------------------------------------- | -------- | -------------------- |
| GET    | `/workflows`     | List workflows for the tenant           | Internal | `pcp:settings:read`  |
| GET    | `/workflows/:id` | Get workflow detail with stages         | Internal | `pcp:settings:read`  |
| POST   | `/workflows`     | Create workflow                         | Internal | `pcp:settings:write` |
| PATCH  | `/workflows/:id` | Update workflow                         | Internal | `pcp:settings:write` |
| DELETE | `/workflows/:id` | Delete workflow (only if no OPs use it) | Internal | `pcp:settings:write` |

#### 13.27.10 Product Types

| Method | Path                 | Description                       | Auth     | Permission           |
| ------ | -------------------- | --------------------------------- | -------- | -------------------- |
| GET    | `/product-types`     | List product types for the tenant | Internal | `pcp:settings:read`  |
| POST   | `/product-types`     | Create product type               | Internal | `pcp:settings:write` |
| PATCH  | `/product-types/:id` | Update product type               | Internal | `pcp:settings:write` |
| DELETE | `/product-types/:id` | Deactivate product type           | Internal | `pcp:settings:write` |

#### 13.27.11 Collection Mix Plan

| Method | Path                        | Description                                    | Auth     | Permission              |
| ------ | --------------------------- | ---------------------------------------------- | -------- | ----------------------- |
| GET    | `/collections/:id/mix-plan` | Get collection mix plan with actual vs planned | Internal | `pcp:collections:read`  |
| POST   | `/collections/:id/mix-plan` | Create/update mix plan entries                 | Internal | `pcp:collections:write` |

#### 13.27.12 Global Fixed Costs

| Method | Path                      | Description                            | Auth     | Permission         |
| ------ | ------------------------- | -------------------------------------- | -------- | ------------------ |
| GET    | `/global-fixed-costs`     | List global fixed costs for the tenant | Internal | `pcp:costs:read`   |
| POST   | `/global-fixed-costs`     | Create global fixed cost               | Internal | `pcp:costs:write`  |
| PATCH  | `/global-fixed-costs/:id` | Update global fixed cost               | Internal | `pcp:costs:write`  |
| DELETE | `/global-fixed-costs/:id` | Deactivate global fixed cost           | Internal | `pcp:costs:delete` |

#### 13.27.13 Import

| Method | Path                     | Description                               | Auth     | Permission                |
| ------ | ------------------------ | ----------------------------------------- | -------- | ------------------------- |
| POST   | `/import/materials`      | Import materials from CSV/Excel           | Internal | `pcp:raw-materials:write` |
| POST   | `/import/collection-mix` | Import collection mix plan from CSV/Excel | Internal | `pcp:collections:write`   |

#### 13.27.14 Clone OP

| Method | Path                                   | Description                                 | Auth     | Permission                    |
| ------ | -------------------------------------- | ------------------------------------------- | -------- | ----------------------------- |
| POST   | `/production-orders/:id/actions/clone` | Clone OP to another collection (carry-over) | Internal | `pcp:production-orders:write` |

---

### 13.28 New Permissions

| Permission                  | admin | pm  | creative | operations | support | finance | commercial | supplier |
| --------------------------- | ----- | --- | -------- | ---------- | ------- | ------- | ---------- | -------- |
| `pcp:settings:read`         | Y     | --  | --       | Y          | --      | --      | --         | --       |
| `pcp:settings:write`        | Y     | --  | --       | --         | --      | --      | --         | --       |
| `pcp:product-specs:read`    | Y     | Y   | --       | Y          | --      | --      | --         | --       |
| `pcp:product-specs:write`   | Y     | --  | --       | Y          | --      | --      | --         | --       |
| `pcp:product-specs:approve` | Y     | --  | --       | --         | --      | --      | --         | --       |
| `supplier:stages:read`      | --    | --  | --       | --         | --      | --      | --         | Y        |
| `supplier:stages:write`     | --    | --  | --       | --         | --      | --      | --         | Y        |
| `supplier:specs:read`       | --    | --  | --       | --         | --      | --      | --         | Y        |

**Notes:**

- `pcp:settings:write` is admin-only — covers tenant stages, workflows, product types, and custom field definitions.
- `pcp:product-specs:approve` is admin-only — only Marcus can approve final pricing.
- `supplier` role is external-only via token authentication (R-CX19). Suppliers have zero access to internal data beyond their assigned stages.
- `finance` role gains read access to `pcp:product-specs:read` (inherits from existing `pcp:costs:read` pattern).

---

### 13.29 New Background Jobs

| Job Name                             | Queue | Schedule         | Priority | Description                                                                                                                                                                   |
| ------------------------------------ | ----- | ---------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pcp:reminder-dispatcher`            | `pcp` | Every 15 minutes | Medium   | Scans `pcp.reminders` where `remind_at <= NOW()` and `is_sent = FALSE`. Emits Flare event `production.reminder` to the reminder creator. Sets `is_sent = TRUE`.               |
| `pcp:collection-mix-deviation-check` | `pcp` | Daily 09:00 BRT  | Low      | For each active collection with a mix plan, calculates actual vs planned counts per category. If any category deviates by >20%, emits Flare event `collection.mix_deviation`. |
| `pcp:supplier-portal-token-cleanup`  | `pcp` | Daily 03:00 BRT  | Low      | Scans supplier portal tokens and revokes any that are expired (past `expires_at`).                                                                                            |

---

### 13.30 New Flare Events

| Event Key                         | Trigger                                         | Channels                   | Recipients               | Priority |
| --------------------------------- | ----------------------------------------------- | -------------------------- | ------------------------ | -------- |
| `production.stage_regression`     | Stage regressed to previous (R-CX06)            | In-app, Discord `#alertas` | `operations`, `pm` roles | High     |
| `production.excessive_regression` | OP regressed 3+ times (R-CX09)                  | In-app, Discord `#alertas` | `operations`, `pm` roles | High     |
| `production.comment_mention`      | @mention in OP comment (R-CX32)                 | In-app                     | Mentioned user           | Medium   |
| `production.reminder`             | Manual reminder triggered                       | In-app                     | Reminder creator         | Medium   |
| `supplier.delivery_confirmed`     | Supplier confirmed delivery via portal (R-CX22) | In-app                     | `operations` role        | Medium   |
| `collection.mix_deviation`        | Mix plan deviation >20% (R-CX31)                | In-app                     | `operations`, `pm` roles | Medium   |
| `production.spec_approved`        | Product spec approved (R-CX17)                  | In-app                     | `operations` role        | Low      |

---

### 13.31 Competitive Context

> Extracted from `docs/competitive/gap-analysis.md` — Competitive positioning summary.

#### Competitive Landscape

| Competitor       | Focus                                                     | Pricing                                       | Contract            |
| ---------------- | --------------------------------------------------------- | --------------------------------------------- | ------------------- |
| **Colecao.moda** | PLM development (ficha tecnica, modelagem, rendimento)    | R$ 390 (admin) + R$ 120/user. Setup: R$ 1.000 | Min. 6 months       |
| **Audaces ISA**  | PLM + PCP advanced (customizable stages, supplier portal) | Not disclosed                                 | 12 months mandatory |
| **Inbazz**       | Creator/Influencer management                             | "Expensive" (not disclosed)                   | Not disclosed       |

#### Ambaril Competitive Advantages (Preserved)

These are differentiators that NO competitor offers and that remain unique to Ambaril after incorporating the gap features:

| Advantage                                        | Detail                                                                                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **All-in-one without fragile integrations**      | PLM + ERP + CRM + Checkout + Creators + Tarefas + DAM + Mensageria in a single database                                |
| **No lock-in contract**                          | ISA = 12 months. Colecao.moda = 6 months. Ambaril = SaaS without mandatory term                                        |
| **Multi-tenant**                                 | Any streetwear brand can use it, not just CIENA                                                                        |
| **Complete physical production pipeline**        | 11 (now configurable) stages with 3-tier escalating alerts + Discord integration                                       |
| **Automatic supplier reliability scoring**       | Quantitative scoring based on delivery, quality, communication, cost data                                              |
| **Rework tracking**                              | Defective batch tracking from detection through resolution. Not mentioned in any competitor                            |
| **Pilot production with sell-through detection** | Automatic champion/discontinue classification based on sales data. Not mentioned in any competitor                     |
| **Internal product voting**                      | Team voting during approval stage. Not mentioned in any competitor                                                     |
| **4-layer product validation pipeline**          | Internal vote → Social preview → Pilot → Sales data. Not mentioned in any competitor                                   |
| **Production playbooks**                         | OP templates by product type. Not mentioned in any competitor                                                          |
| **Daily Discord summary (#report-producao)**     | Automated daily production report via Pulse bot                                                                        |
| **Mobile stock entry**                           | Ana Clara warehouse workflow. Not mentioned in any competitor                                                          |
| **Native ERP integration**                       | NF-e, shipping, Mercado Pago, DRE — all in the same platform                                                           |
| **Raw materials with purchase alerts**           | Material management with deadline-aware purchase alerts. Colecao.moda has material library but no inventory management |

#### Gap Closure Summary

After incorporating all features from section 13:

| Gap Category          | Before                 | After                                                                                         |
| --------------------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| Configurable stages   | Fixed 11-stage enum    | Tenant-configurable stages + multiple workflows                                               |
| Stage regression      | Prohibited             | Permitted with audit trail and repilotagem counter                                            |
| Product spec sheet    | Non-existent           | Full ficha tecnica with 7 tabs (geral, imagens, materiais, custos, medidas, operacoes, preco) |
| Supplier portal       | Non-existent           | Token-based portal with limited visibility + file upload + delivery confirmation              |
| Custom fields         | Only free-text `notes` | JSONB custom fields with typed definitions and GIN-indexed filtering                          |
| Production Kanban     | Only task Kanban       | Product-by-stage Kanban with drag-to-advance                                                  |
| Image uploads         | No image fields        | OP attachments + spec images + material images                                                |
| Collection map        | Non-existent           | Visual grid by category with PDF export                                                       |
| Lookbook view         | Non-existent           | Full-page catalog layout with fullscreen mode                                                 |
| Product mix           | No planning concept    | Collection skeleton with planned vs actual tracking                                           |
| OP comments           | Redirect to Tarefas    | Direct threaded comments with @mention notifications                                          |
| Carry-over            | Create from scratch    | Clone OP with `is_reuse` flag                                                                 |
| Materials library     | Basic fields only      | Rich properties (gramatura, largura, encolhimento, cores, imagem) + yield calculation         |
| Size grading          | Non-existent           | Automatic grading from pilot measurements                                                     |
| PDF export            | Non-existent           | Formatted PDF with tenant logo and field selection presets                                    |
| Bulk operations       | Individual only        | Multi-select + bulk update/advance                                                            |
| Spreadsheet import    | Non-existent           | CSV/Excel import for materials and mix plan                                                   |
| Custom tags           | Non-existent           | Free-form tags with filtering                                                                 |
| Internal stage owner  | Supplier only          | Supplier + internal team member per stage                                                     |
| Collection properties | Name only              | Cover image, color palette, prints, rich description                                          |
| Stage counters        | Total only             | Per-stage counters with overdue breakdown                                                     |
| Delivery calendar     | Non-existent           | Calendar view with stage-by-day display                                                       |
| Manual reminders      | Non-existent           | User-created reminders with Flare dispatch                                                    |
| Product types         | Free text              | Standardized catalog with default measurements                                                |
| Multiple workflows    | Single pipeline        | Multiple workflow templates per tenant                                                        |

---

_End of Competitive Gap Features section. All features in this section complement the base PLM spec (sections 1-12) and follow the same implementation patterns, security requirements, and testing standards defined in CLAUDE.md._
