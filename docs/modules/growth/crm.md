# CRM / Retencao — Module Spec

> **Module:** CRM / Retencao
> **Schema:** `crm`
> **Route prefix:** `/api/v1/crm`
> **Admin UI route group:** `(admin)/crm/*`
> **Version:** 1.0
> **Date:** March 2026
> **Status:** Approved
> **Replaces:** Kevi (R$ 1.200/mes savings)
> **References:** [DATABASE.md](../../architecture/DATABASE.md), [API.md](../../architecture/API.md), [AUTH.md](../../architecture/AUTH.md), [LGPD.md](../../platform/LGPD.md), [NOTIFICATIONS.md](../../platform/NOTIFICATIONS.md), [GLOSSARY.md](../../dev/GLOSSARY.md)

---

## Phase Roadmap

> Each phase delivers standalone value. No phase requires a later phase to function.

| Phase | Semanas | Foco | Entregaveis |
|-------|---------|------|-------------|
| **1A** | 1-12 | Core CRM + WA + Email | Contact CRUD, CPF dedup, WA Engine completo (Meta Cloud API), transacional (T1-T3), cart recovery (CR1-CR4), welcome (L1), review (L2), email via Resend, campaigns (WA+email), UTM capture, LGPD consent (R31-R34), **Ambaril Tracker MVP** (cookie `_amb_vid`, page views, passive matching `_fbp`/`_ga`, Liquid `{{ customer }}`) |
| **1B** | 10-16 | Scoring + Segmentos | RFM engine + Grid UI, Custom Segment Builder (incl. product/SKU), Automation Editor, Birthday/Reactivation/Repurchase/VIP Welcome (L3-L6), Attribution Report, **Tracker v2** (ThumbmarkJS fingerprint, identity injection em links, retroactive attribution, multi-layer persistence) |
| **2** | 14-20 | Checkout Premium + Inbox + On-Site + Automations R1-R5 | Checkout Premium (VIP, order bump, A/B), Inbox unificado (WA+email), **On-Site Widget Engine** (popups, banners, sliders, social proof, widget builder, targeting, Shopify theme app extension), **5 novas automacoes (R1-R5):** Product Recommendations, Cross-sell, Upsell, Price Drop Alert, Back in Stock, **Shopify Web Pixel** (checkout events), **signal fusion**, **confidence decay** |
| **3+** | 18+ | Analytics + ML + Compliance | Cohort analytics (data-dependent, requires 3+ months), LGPD full erasure R35 (requires legal review), RFM history purge, lead scoring preditivo, predicao de recompra |

---

## 1. Purpose & Scope

The CRM / Retencao module is the **customer intelligence hub** of Ambaril. It owns the unified contact base, behavioral scoring (RFM), automated lifecycle messaging, cohort analytics, and channel attribution. Every customer-facing interaction — from a first checkout to a reactivation WhatsApp — flows through this module.

**Core responsibilities:**

| Capability | Description |
|-----------|-------------|
| **Unified contact base** | Single source of truth for all customer data, deduplicated by CPF |
| **RFM scoring** | Recency / Frequency / Monetary scoring with automatic segment classification |
| **Custom segments** | Boolean logic segment builder (AND/OR conditions on any contact field) |
| **Automation engine** | 23 pre-built lifecycle automations in 6 categories (transactional, cart recovery, lifecycle, recommendations, time-based, social selling) + custom automation builder |
| **Campaign dispatch** | Manual campaigns to segments via WhatsApp and/or email |
| **Cohort analytics** | Group customers by acquisition period, track repurchase rate and LTV per cohort |
| **Channel attribution** | UTM capture from Checkout, source taxonomy, last-touch attribution with creator coupon override |
| **LGPD compliance** | Granular consent tracking per channel, data export/deletion workflows |

**Out of scope:** This module does NOT handle message delivery directly. WhatsApp dispatch is delegated to the WhatsApp Engine module; email dispatch is delegated to Resend via the `packages/integrations/resend/` client. CRM orchestrates; channels deliver.

### 1.1 User Stories

| # | Story | Acceptance Criteria |
|---|-------|-------------------|
| US-01 | As Caio (PM), I want to see LTV and CAC per channel on the contact profile so I can measure acquisition efficiency. | Contact detail shows LTV card with: LTV atual (R$), LTV projetado (R$), CAC (R$), LTV/CAC ratio. CAC per channel displayed in Dashboard Retencao and CRM analytics. |
| US-02 | As Caio, I want to create Social Selling funnel templates that combine IG, WA, and email steps so I can structure our social commerce process. | Automation editor supports multi-step Social Selling funnels (SS1-SS4). Templates are editable: trigger, channel sequence, message templates, timing, segment filter. Preview shows full sequence visually. |
| US-03 | As Caio, I want to see if a contact is also a creator on their CRM profile so I can have a unified view of their relationship with CIENA. | Contact detail shows conditional "Creator" tab when CPF/email matches a `creators.creators` record. Tab displays: creator tier, coupon code, active status, link to full creator profile. |

---

## 2. Domain Model

### 2.1 Entity Relationship Diagram (ASCII)

```
 ┌──────────────────────┐       ┌─────────────────────┐
 │    crm.contacts      │       │   crm.segments      │
 │──────────────────────│       │─────────────────────│
 │ id (PK)              │◄──┐   │ id (PK)             │
 │ cpf (UNIQUE)         │   │   │ name                │
 │ email (UNIQUE)       │   │   │ type (rfm/custom/   │
 │ phone                │   │   │       cohort)        │
 │ name                 │   │   │ rules (JSONB)       │
 │ rfm_score_id (FK)────│───│──►│ contact_count       │
 │ segment_ids (UUID[]) │   │   │ is_dynamic          │
 │ total_orders         │   │   │ last_calculated_at  │
 │ total_spent          │   │   └─────────────────────┘
 │ ltv                  │   │
 │ is_vip               │   │   ┌─────────────────────┐
 │ consent_whatsapp     │   │   │   crm.rfm_scores    │
 │ consent_email        │   │   │─────────────────────│
 │ tags (TEXT[])        │   ├──►│ id (PK)             │
 │ acquisition_source   │   │   │ contact_id (FK)     │
 │ first_purchase_at    │   │   │ recency_score (1-5) │
 │ last_purchase_at     │   │   │ frequency_score(1-5)│
 └──────────┬───────────┘   │   │ monetary_score(1-5) │
            │               │   │ rfm_segment         │
            │ 1:N           │   │ recency_days        │
            ▼               │   │ frequency_count     │
 ┌──────────────────────┐   │   │ monetary_total      │
 │   crm.consents       │   │   │ calculated_at       │
 │──────────────────────│   │   └─────────────────────┘
 │ id (PK)              │   │
 │ contact_id (FK)──────│───┘   ┌─────────────────────┐
 │ consent_type         │       │  crm.automations    │
 │ granted (BOOL)       │       │─────────────────────│
 │ ip_address           │       │ id (PK)             │
 │ user_agent           │       │ name                │
 │ source               │       │ trigger_type        │
 │ created_at           │       │ trigger_config(JSON)│
 └──────────────────────┘       │ channel             │
                                │ template_id (FK)    │
 ┌──────────────────────┐       │ status              │
 │ crm.automation_runs  │       │ segment_id (FK)─────│──► crm.segments
 │──────────────────────│       │ total_sent          │
 │ id (PK)              │       │ total_converted     │
 │ automation_id (FK)───│──────►└─────────────────────┘
 │ contact_id (FK)──────│──► crm.contacts
 │ status               │       ┌─────────────────────┐
 │ channel              │       │   crm.cohorts       │
 │ scheduled_at         │       │─────────────────────│
 │ sent_at              │       │ id (PK)             │
 │ delivered_at         │       │ name                │
 │ opened_at            │       │ cohort_period       │
 │ clicked_at           │       │ contact_count       │
 │ converted_at         │       │ avg_ltv             │
 │ error_message        │       │ repurchase_rate     │
 └──────────────────────┘       │ churn_rate          │
                                │ metadata (JSONB)    │
                                └─────────────────────┘

 Cross-schema references:
 ────────────────────────
 crm.contacts.id  ◄── checkout.orders.contact_id
 crm.contacts.id  ◄── checkout.carts.contact_id
 crm.contacts.id  ◄── checkout.abandoned_carts.contact_id
 crm.automations.template_id ──► whatsapp.templates.id
 crm.contacts.is_vip ──► checked by checkout VIP whitelist gate
```

### 2.2 Enums

```sql
CREATE TYPE crm.segment_type AS ENUM ('rfm', 'custom', 'cohort');
CREATE TYPE crm.automation_trigger AS ENUM (
    'order_approved', 'order_shipped', 'order_delivered',
    'cart_abandoned', 'welcome', 'post_purchase_review',
    'repurchase', 'birthday', 'inactivity', 'vip_welcome',
    'night_owl', 'ig_story_dm', 'nurture_sequence', 'link_click_no_purchase',
    'vip_preview', 'marketplace_welcome', 'custom'
);
CREATE TYPE crm.automation_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE crm.campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'completed', 'cancelled');
CREATE TYPE crm.automation_run_status AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');
CREATE TYPE crm.channel AS ENUM ('whatsapp', 'email', 'sms');
CREATE TYPE crm.consent_type AS ENUM ('whatsapp', 'email', 'tracking');
```

---

## 3. Database Schema

All tables live in the `crm` PostgreSQL schema. Full column definitions are in [DATABASE.md](../../architecture/DATABASE.md) section 4.3. Below is the **complete reference** with all columns, types, and constraints.

### 3.1 crm.contacts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | UUID v7 |
| email | VARCHAR(255) | NULL, UNIQUE (where not deleted) | May be NULL if WhatsApp-only |
| phone | VARCHAR(20) | NULL | Brazilian format: +5511999999999 |
| name | VARCHAR(255) | NOT NULL | Full name |
| cpf | VARCHAR(14) | UNIQUE, NOT NULL (where not deleted) | Brazilian tax ID (000.000.000-00) |
| address | JSONB | NULL | `{ street, number, complement, neighborhood, city, state, zip_code }` |
| rfm_score_id | UUID | NULL, FK crm.rfm_scores(id) | Latest RFM calculation |
| segment_ids | UUID[] | NULL | Array of segment IDs this contact belongs to |
| first_purchase_at | TIMESTAMPTZ | NULL | Timestamp of first confirmed order |
| last_purchase_at | TIMESTAMPTZ | NULL | Timestamp of most recent confirmed order |
| total_orders | INTEGER | NOT NULL DEFAULT 0 | Denormalized counter of confirmed orders |
| total_spent | NUMERIC(12,2) | NOT NULL DEFAULT 0 | Denormalized sum of confirmed order totals |
| average_order_value | NUMERIC(12,2) | NOT NULL DEFAULT 0 | total_spent / total_orders |
| ltv | NUMERIC(12,2) | NOT NULL DEFAULT 0 | Lifetime value (same as total_spent for now) |
| acquisition_source | VARCHAR(100) | NULL | e.g., 'instagram_ad', 'organic', 'creator_coupon' |
| acquisition_utm | JSONB | NULL | `{ source, medium, campaign, content }` from first visit |
| birthday | DATE | NULL | Customer birthday for birthday automation |
| is_vip | BOOLEAN | NOT NULL DEFAULT FALSE | VIP whitelist for drop early access |
| consent_whatsapp | BOOLEAN | NOT NULL DEFAULT FALSE | Current WhatsApp opt-in status (LGPD) |
| consent_email | BOOLEAN | NOT NULL DEFAULT FALSE | Current email opt-in status (LGPD) |
| consent_tracking | BOOLEAN | NOT NULL DEFAULT FALSE | Current behavioral tracking opt-in (LGPD) |
| consent_updated_at | TIMESTAMPTZ | NULL | Last consent change timestamp |
| tags | TEXT[] | NULL | Freeform tags for manual categorization |
| notes | TEXT | NULL | Internal notes visible to admin/pm/support |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete |

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_contacts_cpf ON crm.contacts (cpf) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_contacts_email ON crm.contacts (email) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_contacts_phone ON crm.contacts (phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_contacts_is_vip ON crm.contacts (is_vip) WHERE is_vip = TRUE;
CREATE INDEX idx_contacts_acquisition ON crm.contacts (acquisition_source);
CREATE INDEX idx_contacts_last_purchase ON crm.contacts (last_purchase_at DESC);
CREATE INDEX idx_contacts_total_spent ON crm.contacts (total_spent DESC);
CREATE INDEX idx_contacts_tags ON crm.contacts USING GIN (tags);
CREATE INDEX idx_contacts_segment_ids ON crm.contacts USING GIN (segment_ids);
CREATE INDEX idx_contacts_not_deleted ON crm.contacts (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_birthday ON crm.contacts (
    EXTRACT(MONTH FROM birthday), EXTRACT(DAY FROM birthday)
) WHERE birthday IS NOT NULL;
```

### 3.2 crm.segments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | Segment display name |
| description | TEXT | NULL | Internal description |
| type | crm.segment_type | NOT NULL | rfm, custom, cohort |
| rules | JSONB | NOT NULL | Filter rules (see section 3.2.1) |
| contact_count | INTEGER | NOT NULL DEFAULT 0 | Cached member count |
| is_dynamic | BOOLEAN | NOT NULL DEFAULT TRUE | TRUE = recalculated automatically |
| last_calculated_at | TIMESTAMPTZ | NULL | Last recalculation timestamp |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

#### 3.2.1 Segment Rules JSONB Structure

```json
{
  "logic": "AND",
  "conditions": [
    {
      "field": "total_orders",
      "operator": "greater_than",
      "value": 3
    },
    {
      "field": "last_purchase_at",
      "operator": "within_days",
      "value": 30
    },
    {
      "logic": "OR",
      "conditions": [
        { "field": "acquisition_source", "operator": "equals", "value": "instagram_ad" },
        { "field": "acquisition_source", "operator": "equals", "value": "creator_coupon" }
      ]
    }
  ]
}
```

**Supported operators:** `equals`, `not_equals`, `greater_than`, `less_than`, `greater_or_equal`, `less_or_equal`, `contains`, `not_contains`, `within_days`, `older_than_days`, `is_true`, `is_false`, `is_null`, `is_not_null`, `in_list`.

**Supported fields:** `total_orders`, `total_spent`, `average_order_value`, `ltv`, `last_purchase_at`, `first_purchase_at`, `acquisition_source`, `is_vip`, `consent_whatsapp`, `consent_email`, `tags` (array contains), `rfm_segment`, `recency_score`, `frequency_score`, `monetary_score`, `has_purchased_product` (cross-schema: checkout.order_items → erp.products), `has_purchased_sku` (cross-schema: checkout.order_items → erp.skus), `has_cart_with_product` (cross-schema: checkout.cart_items → erp.products), `purchased_in_period` (compound: product + date range), `not_purchased_in_period` (compound: exclusion filter).

### 3.3 crm.rfm_scores

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| contact_id | UUID | NOT NULL, FK crm.contacts(id) | |
| recency_score | INTEGER | NOT NULL, CHECK (recency_score BETWEEN 1 AND 5) | 1=oldest, 5=most recent buyer |
| frequency_score | INTEGER | NOT NULL, CHECK (frequency_score BETWEEN 1 AND 5) | 1=fewest purchases, 5=most |
| monetary_score | INTEGER | NOT NULL, CHECK (monetary_score BETWEEN 1 AND 5) | 1=lowest spend, 5=highest |
| rfm_segment | VARCHAR(50) | NOT NULL | Derived segment label (see section 4.2) |
| recency_days | INTEGER | NOT NULL | Days since last purchase at calculation time |
| frequency_count | INTEGER | NOT NULL | Total order count at calculation time |
| monetary_total | NUMERIC(12,2) | NOT NULL | Total spent at calculation time |
| calculated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | When this score was computed |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

**Indexes:**

```sql
CREATE INDEX idx_rfm_scores_contact ON crm.rfm_scores (contact_id);
CREATE INDEX idx_rfm_scores_segment ON crm.rfm_scores (rfm_segment);
CREATE INDEX idx_rfm_scores_calculated ON crm.rfm_scores (calculated_at DESC);
```

### 3.4 crm.automations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | Automation display name |
| description | TEXT | NULL | |
| trigger_type | crm.automation_trigger | NOT NULL | post_purchase, cart_abandoned, etc. |
| trigger_config | JSONB | NOT NULL | Trigger-specific settings (see section 4.3) |
| channel | crm.channel | NOT NULL | whatsapp, email |
| template_id | UUID | NULL | FK whatsapp.templates(id) for WhatsApp; email template key for Resend |
| email_template_key | VARCHAR(100) | NULL | Resend template identifier (if channel = email) |
| status | crm.automation_status | NOT NULL DEFAULT 'draft' | draft, active, paused, archived |
| segment_id | UUID | NULL, FK crm.segments(id) | Optional: only fire for contacts in this segment |
| cooldown_hours | INTEGER | NOT NULL DEFAULT 48 | Minimum hours between messages to same contact |
| total_sent | INTEGER | NOT NULL DEFAULT 0 | Denormalized counter |
| total_converted | INTEGER | NOT NULL DEFAULT 0 | Denormalized counter |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

### 3.5 crm.automation_runs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| automation_id | UUID | NOT NULL, FK crm.automations(id) | |
| campaign_id | UUID | NULL, FK crm.campaigns(id) | NULL for event-triggered runs |
| contact_id | UUID | NOT NULL, FK crm.contacts(id) | |
| status | crm.automation_run_status | NOT NULL DEFAULT 'pending' | pending, running, completed, failed, skipped |
| channel | crm.channel | NOT NULL | Denormalized from automation |
| scheduled_at | TIMESTAMPTZ | NOT NULL | When to send |
| sent_at | TIMESTAMPTZ | NULL | Actual send time |
| delivered_at | TIMESTAMPTZ | NULL | Delivery confirmation from channel |
| opened_at | TIMESTAMPTZ | NULL | Email open tracking |
| clicked_at | TIMESTAMPTZ | NULL | Link click tracking |
| converted_at | TIMESTAMPTZ | NULL | Conversion event (new order from same contact) |
| error_message | TEXT | NULL | Error detail if status = failed |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

**Indexes:**

```sql
CREATE INDEX idx_automation_runs_automation ON crm.automation_runs (automation_id);
CREATE INDEX idx_automation_runs_contact ON crm.automation_runs (contact_id);
CREATE INDEX idx_automation_runs_status ON crm.automation_runs (status);
CREATE INDEX idx_automation_runs_scheduled ON crm.automation_runs (scheduled_at) WHERE status = 'pending';
CREATE UNIQUE INDEX idx_automation_runs_cooldown ON crm.automation_runs (automation_id, contact_id, scheduled_at);
CREATE INDEX idx_automation_runs_campaign ON crm.automation_runs (campaign_id) WHERE campaign_id IS NOT NULL;
```

### 3.6 crm.consents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| contact_id | UUID | NOT NULL, FK crm.contacts(id) | |
| consent_type | crm.consent_type | NOT NULL | whatsapp, email, tracking |
| granted | BOOLEAN | NOT NULL | TRUE = opted in, FALSE = opted out |
| ip_address | INET | NULL | IP at time of consent action |
| user_agent | TEXT | NULL | Browser at time of consent action |
| source | VARCHAR(100) | NOT NULL | Where consent was collected: 'checkout', 'profile', 'import', 'api' |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Immutable — append-only log |

> **LGPD requirement:** This table is append-only. Each row is a consent event. The current consent state for a contact is derived from the most recent row per `(contact_id, consent_type)` ordered by `created_at DESC`. No rows are ever updated or deleted.

### 3.8 crm.campaigns

> **Phase:** 1A (WA + email)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | Campaign display name |
| segment_id | UUID | NOT NULL, FK crm.segments(id) | Target segment |
| channel | crm.channel | NOT NULL | whatsapp or email (Phase 1A) |
| template_id | UUID | NULL | FK whatsapp.templates(id) for WhatsApp |
| email_template_key | VARCHAR(100) | NULL | Resend template identifier |
| message_body | TEXT | NULL | Inline message body if no template |
| status | crm.campaign_status | NOT NULL DEFAULT 'draft' | draft, scheduled, sending, completed, cancelled |
| scheduled_at | TIMESTAMPTZ | NULL | NULL = send immediately |
| sent_at | TIMESTAMPTZ | NULL | When dispatch started |
| completed_at | TIMESTAMPTZ | NULL | When all sends finished |
| total_recipients | INTEGER | NOT NULL DEFAULT 0 | Contacts matching segment at send time |
| total_sent | INTEGER | NOT NULL DEFAULT 0 | |
| total_delivered | INTEGER | NOT NULL DEFAULT 0 | |
| total_opened | INTEGER | NOT NULL DEFAULT 0 | |
| total_clicked | INTEGER | NOT NULL DEFAULT 0 | |
| total_converted | INTEGER | NOT NULL DEFAULT 0 | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE INDEX idx_campaigns_status ON crm.campaigns (status);
CREATE INDEX idx_campaigns_segment ON crm.campaigns (segment_id);
CREATE INDEX idx_campaigns_scheduled ON crm.campaigns (scheduled_at) WHERE status = 'scheduled';
```

### 3.7 crm.cohorts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | e.g., 'Drop 10 Buyers', '2026-01 Acquired' |
| description | TEXT | NULL | |
| cohort_period | VARCHAR(20) | NOT NULL | e.g., '2026-01', '2026-Q1', 'drop-10' |
| contact_count | INTEGER | NOT NULL DEFAULT 0 | Members in this cohort |
| avg_ltv | NUMERIC(12,2) | NOT NULL DEFAULT 0 | Average LTV of cohort members |
| repurchase_rate | NUMERIC(5,2) | NOT NULL DEFAULT 0 | Percentage who bought again |
| churn_rate | NUMERIC(5,2) | NOT NULL DEFAULT 0 | Percentage who did not return |
| metadata | JSONB | NULL | Extra analytics data per cohort |
| calculated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

---

## 4. Business Rules

### 4.1 Contact Management

> **Phase:** R1-R7 = **1A** | R8 (VIP flag) = **1B**

| # | Rule | Detail |
|---|------|--------|
| R1 | **CPF is the deduplication key** | Every contact must have a unique CPF. If a new order arrives with a CPF matching an existing contact, the order is linked to the existing contact — no duplicate is created. |
| R2 | **CPF validation** | CPF must pass the Brazilian check-digit algorithm (2 verification digits). Invalid CPFs are rejected at the API level via Zod schema. |
| R3 | **Merge on duplicate CPF** | If a CSV import or API call attempts to create a contact with a CPF that already exists: keep the oldest `created_at`, sum financial counters (`total_orders`, `total_spent`), keep the latest address, union all tags, preserve all consent records. |
| R4 | **Email uniqueness** | Email is UNIQUE but NULLable. Two contacts cannot share the same email. If a second contact attempts the same email, the system flags it as a potential duplicate and prompts manual resolution. |
| R5 | **Phone format** | Phone numbers are stored in E.164 format: `+5511999999999`. The frontend formats for display; the database stores the canonical form. |
| R6 | **Financial counter updates** | `total_orders`, `total_spent`, `average_order_value`, and `ltv` are updated asynchronously when an order transitions to `paid` status. This is triggered by the `order.paid` event from the Checkout module. |
| R7 | **Soft delete** | Contact deletion sets `deleted_at`. Soft-deleted contacts are excluded from all queries, segments, and automations. Hard deletion only via LGPD data erasure request (see R20). |
| R8 | **VIP flag** | `is_vip` is set manually by admin/pm or automatically when a contact enters a designated VIP segment. VIP status grants access to drop whitelist early purchase window. |
| R8b | **Marketplace lead capture** | When an order arrives with `acquisition_source = 'marketplace'` (detected by: physical insert/flyer in B2B retailer orders contains QR code → landing page → UTM `source=marketplace&medium=b2b_insert&campaign={retailer_name}`), the contact is registered with `acquisition_source = 'marketplace'`. Marketplace contacts are entered into a specific welcome automation with differentiated messaging (acknowledging they purchased via a lojista, introducing the CIENA direct channel). Requires B2B Insert Kit coordination (see B2B module). If contact CPF already exists, the existing contact is updated with `marketplace` tag but `acquisition_source` is NOT overwritten (first-touch preserved per R30). |

### 4.2 RFM Scoring Algorithm

> **Phase:** R9-R15 = **1B** (calculation engine active, UI deferred until stable data)

| # | Rule | Detail |
|---|------|--------|
| R9 | **Recency score (R)** | Based on days since last purchase. R5: 0-29 days. R4: 30-89 days. R3: 90-179 days. R2: 180-364 days. R1: 365+ days or never purchased. |
| R10 | **Frequency score (F)** | Based on total order count (confirmed orders only). F1: 1 order. F2: 2 orders. F3: 3-4 orders. F4: 5-7 orders. F5: 8+ orders. |
| R11 | **Monetary score (M)** | Based on total spent quintiles calculated across the entire active customer base. M1: bottom 20%. M2: 20-40%. M3: 40-60%. M4: 60-80%. M5: top 20%. Quintile boundaries recalculated on each run. |
| R12 | **Segment mapping** | Each RFM combination maps to a named segment according to the following matrix: |

**RFM Segment Mapping Table:**

| Segment | R Score | F Score | M Score | Description |
|---------|---------|---------|---------|-------------|
| Champions | 5 | 5 | 4-5 | Best customers: recent, frequent, high spend |
| Loyal Customers | 4-5 | 3-5 | 3-5 | Consistent buyers with good engagement |
| Potential Loyalists | 3-5 | 1-2 | 3-5 | Recent buyers who could become loyal |
| New Customers | 4-5 | 1 | 1-2 | Just arrived, first purchase, low spend |
| Promising | 3-5 | 1-2 | 1-2 | Recent but infrequent and low spend |
| Need Attention | 3 | 3-4 | 3-4 | Above average but slipping |
| About to Sleep | 2-3 | 2-3 | 2-3 | Below average and fading |
| At Risk | 1-2 | 3-5 | 3-5 | Were good customers, now inactive |
| Cannot Lose Them | 1-2 | 4-5 | 4-5 | High-value customers going dormant |
| Hibernating | 1-2 | 1-2 | 2-3 | Low engagement across the board |
| Lost | 1-2 | 1-2 | 1 | Minimal engagement, minimal value |

| # | Rule | Detail |
|---|------|--------|
| R13 | **RFM recalculation schedule** | Daily at 03:00 BRT via Vercel Cron. The job iterates all non-deleted contacts with at least 1 confirmed order, computes R/F/M scores, assigns segment, inserts a new `crm.rfm_scores` row, and updates `crm.contacts.rfm_score_id` to point to the latest score. |
| R14 | **RFM history retention** | Old `crm.rfm_scores` rows are retained for 90 days for trend analysis (e.g., "this contact was Champions last month, now At Risk"). Rows older than 90 days are purged by a monthly archival job. |
| R15 | **Contacts with zero orders** | Contacts who have never purchased receive R1/F0/M0 (no RFM row created). They are excluded from the RFM segment grid but appear in custom segments if conditions match. |

#### 4.2.1 LTV Calculation

> **Phase:** LTV actual = **1A** (derived from order/return data) | LTV projected + LTV/CAC = **1B** (requires RFM segments + CAC tracking)

| # | Rule | Detail |
|---|------|--------|
| R-LTV.1 | **LTV actual** | `ltv = SUM(order_totals) - SUM(returns)` per contact. Calculated from confirmed orders (`checkout.orders` with `status = paid/shipped/delivered`) minus confirmed returns (`trocas.exchanges` with `type = refund` and `status = completed`). Stored in `crm.contacts.ltv`. Updated asynchronously on `order.paid` and `exchange.completed` events. |
| R-LTV.2 | **LTV projected** | Projected LTV based on RFM segment multiplier applied to current LTV. Multipliers: Champions = 2.5x, Loyal Customers = 2.0x, Potential Loyalists = 1.8x, New Customers = 1.5x, Promising = 1.3x, Need Attention = 1.0x, About to Sleep = 0.7x, At Risk = 0.5x, Cannot Lose Them = 0.8x, Hibernating = 0.3x, Lost = 0.1x. Formula: `ltv_projected = ltv * segment_multiplier`. Multipliers configurable by admin. |
| R-LTV.3 | **LTV/CAC ratio** | Displayed on contact profile. `ltv_cac_ratio = ltv / cac`. If CAC is 0 or unknown, display "N/D" (nao disponivel). Healthy ratio threshold: >= 3.0 (green), 1.0-2.99 (yellow), < 1.0 (red). |
| R-LTV.4 | **LTV card on Contact Detail** | Contact profile displays a dedicated "LTV" card showing: LTV atual (R$), LTV projetado (R$), CAC (R$), LTV/CAC ratio (with color indicator), total de compras (count), total de devolucoes (count + R$ value). Card visible to roles: `admin`, `pm`, `finance`. |

### 4.3 Automation Engine

> **Phase:** R16-R19 = **1A** (WA + email)

| # | Rule | Detail |
|---|------|--------|
| R16 | **23 pre-built automations** | The system ships with 23 pre-built automations in 6 categories: 3 transactional (T1-T3), 4 cart recovery (CR1-CR4), 6 lifecycle (L1-L6), 5 recommendation/alert (R1-R5, Phase 2), 1 time-based (TB1, Phase 1B), 4 social selling funnels (SS1-SS4, Phase 1B). Each can be customized but not deleted. Custom automations can be added. |
| R17 | **Automation firing flow** | On trigger event: (1) Check if automation is `active`. (2) Check if contact matches segment filter (if set). (3) Check LGPD consent for the automation's channel. (4) Check cooldown: no pending/completed run for this contact+automation within `cooldown_hours`. (5) If all pass, create `automation_runs` row with `status=pending` and `scheduled_at = NOW() + delay`. |
| R18 | **Cooldown enforcement** | Default cooldown: 48 hours between messages to the same contact from the same automation. Transactional automations (T1-T3) have no cooldown — they fire on every order status change. Cart recovery D0→D1 sequence has stop_on_conversion but no inter-step cooldown. |
| R19 | **No consent = no send** | Before scheduling any automation run, the engine checks `crm.contacts.consent_whatsapp` (for WhatsApp channel) or `crm.contacts.consent_email` (for email channel). If consent is FALSE, the run is created with `status=skipped` and `error_message='no_consent'`. |

**Pre-built Automations — Transactional (Phase 1A):**

> Transactional automations fire on EVERY order status change, not just first purchase. No cooldown. WA imediato.

| # | Name | Trigger | Delay | Channel | Template | Notes |
|---|------|---------|-------|---------|----------|-------|
| T1 | Pedido Aprovado | `order.paid` | Imediato | WhatsApp | `wa_order_approved` | Toda compra, nao so primeira |
| T2 | Pedido Enviado | `order.shipped` | Imediato | WhatsApp | `wa_order_shipped` | Inclui codigo rastreio |
| T3 | Pedido Entregue | `order.delivered` | Imediato | WhatsApp | `wa_order_delivered` | Inclui link atendimento |

**Pre-built Automations — Cart Recovery (Phase 1A):**

> 4 automacoes separadas (Cliente vs Nao-Cliente x D0 vs D1). Cada uma e independente — nao e sequencia unica.

| # | Name | Trigger | Delay | Channel | Template | Notes |
|---|------|---------|-------|---------|----------|-------|
| CR1 | Cart — Nao-Cliente D0 | `cart.abandoned` + `contact.total_orders = 0` | 30 min | WhatsApp | `wa_cart_new_d0` | Primeiro contato, tom acolhedor |
| CR2 | Cart — Nao-Cliente D1 | `cart.abandoned` + `contact.total_orders = 0` + CR1 not converted | 1 dia | WhatsApp + Email | `wa_cart_new_d1` | Cupom de primeira compra |
| CR3 | Cart — Cliente D0 | `cart.abandoned` + `contact.total_orders > 0` | 30 min | WhatsApp | `wa_cart_returning_d0` | Tom familiar |
| CR4 | Cart — Cliente D1 | `cart.abandoned` + `contact.total_orders > 0` + CR3 not converted | 1 dia | WhatsApp + Email | `wa_cart_returning_d1` | Cupom exclusivo |

**Pre-built Automations — Lifecycle/Marketing (Phase 1A: L1-L2, Phase 1B: L3-L6):**

| # | Name | Phase | Trigger | Delay | Channel | Template | Notes |
|---|------|-------|---------|-------|---------|----------|-------|
| L1 | Welcome | **1A** | First purchase (`order.paid` + `total_orders = 1`) | 1 hora | WhatsApp + Email | `wa_welcome`, `email_welcome` | Fire once per lifetime |
| L2 | Post-purchase Review | **1A** | `order.delivered` | 7 dias | WhatsApp | `wa_review_request` | Link para formulario |
| L3 | Birthday | **1B** | `contact.birthday = today` | 0 (09:00 BRT) | WhatsApp + Email | `wa_birthday` | Cupom 10% auto-gerado |
| L4 | Reactivation | **1B** | Inativo 60+ dias (scan diario) | Imediato | WhatsApp + Email | `wa_reactivation` | Requer 60+ dias de dados |
| L5 | Repurchase Nudge | **1B** | 45+ dias desde ultima compra, < 60 dias | Imediato | WhatsApp | `wa_repurchase` | Requer historico de compras |
| L6 | VIP Welcome | **1B** | `is_vip` FALSE → TRUE | 1 hora | WhatsApp | `wa_vip_welcome` | Depende de segmentos |

**Pre-built Automations — Recommendations & Alerts (Phase 2):**

> 5 novas automacoes para paridade com Edrone. Requerem On-Site Widget Engine e dados de produto/estoque.

| # | Name | Phase | Trigger | Delay | Channel | Template | Notes |
|---|------|-------|---------|-------|---------|----------|-------|
| R1 | Product Recommendations | **2** | Scheduled weekly + segment | 0 (batch) | Email + WA | `wa_recommendations`, `email_recommendations` | Baseado em historico de compra |
| R2 | Cross-sell | **2** | `order.delivered` + product mapping | 3 dias | Email + WA | `wa_cross_sell`, `email_cross_sell` | Produtos complementares |
| R3 | Upsell | **2** | `order.delivered` + upgrade mapping | 5 dias | Email + WA | `wa_upsell`, `email_upsell` | Versao superior |
| R4 | Price Drop Alert | **2** | `product.price_decreased` | Imediato | Email + WA | `wa_price_drop`, `email_price_drop` | Notifica quem visualizou/carrinhou |
| R5 | Back in Stock | **2** | `inventory.restocked` (0→>0) | Imediato | Email + WA | `wa_back_in_stock`, `email_back_in_stock` | Notifica waitlist + quem viu quando esgotado |

**Pre-built Automations — Time-Based Offers (Phase 1B):**

> Automacoes baseadas em horario de visita. Requerem integracao com session tracking (checkout/storefront events).

| # | Name | Phase | Trigger | Delay | Channel | Template | Notes |
|---|------|-------|---------|-------|---------|----------|-------|
| TB1 | Night Owl Offer | **1B** | Contact visits site between 23:00-05:00 BRT without purchasing → idle 30 min | 30 min after idle detected | WhatsApp + Email | `wa_night_owl`, `email_night_owl` | Time-limited discount (e.g., "Cupom MADRUGADA - 10% off valido ate 8h"). Time window (default 23:00-05:00) and discount percentage configurable per automation instance. Requires `session.idle` event from Checkout/storefront with timestamp. Contact must have `consent_whatsapp = true` or `consent_email = true`. Fire once per 7-day window (cooldown). |

**Pre-built Automations — Social Selling Funnels (Phase 1B):**

> Multi-step sequences for structured social→commerce conversion. Templates are editable by PM (Caio). Each template defines: trigger, channel sequence, message templates, timing, segment filter.

| # | Name | Phase | Trigger | Steps | Channels | Templates | Notes |
|---|------|-------|---------|-------|----------|-----------|-------|
| SS1 | IG Story → WA | **1B** | Creator/PM posts IG story with product tag → follower DMs brand IG → auto-detected | 1. Auto-reply WA with product link + coupon | WA | `wa_ig_story_reply` | Requires Instagram Graph API webhook for DM detection. Coupon auto-generated per campaign. PM configures: product link, discount %, coupon prefix, expiry. |
| SS2 | WA Nurture | **1B** | Contact added to nurture segment (manual or via SS1 conversion) | 3 messages over 3 days: (1) Product highlight with image, (2) Social proof/review quote, (3) Limited offer with coupon | WA | `wa_nurture_d0`, `wa_nurture_d1`, `wa_nurture_d2` | Sequence stops on conversion (`order.paid`). Each step delay configurable (default D0=immediate, D1=24h, D2=48h). PM edits message content per campaign. |
| SS3 | Reengagement | **1B** | Contact clicked link (from any automation/campaign) but did not purchase within 24h | 1. WA: "Vimos que voce se interessou por X, quer ajuda?" | WA | `wa_reengagement` | Trigger: `link.clicked` event + no `order.paid` within 24h for same contact. Product name dynamically inserted from clicked URL. Cooldown: 7 days. |
| SS4 | VIP Preview | **1B** | Manual trigger by PM: upcoming drop scheduled → send early access to VIP segment | 1. WA: Early access link + exclusive window (24h before public drop) | WA + Email | `wa_vip_preview`, `email_vip_preview` | Segment filter: `is_vip = true` or custom VIP segment. PM sets: drop name, preview link, time window. Fires once per drop. |

#### 4.3.1 Automation trigger_config JSONB Examples

```json
// T1: Pedido Aprovado (transactional)
{ "event": "order.paid", "delay_minutes": 0, "fire_once": false }

// CR1: Cart — Nao-Cliente D0
{
  "event": "cart.abandoned",
  "condition": { "field": "contact.total_orders", "operator": "equals", "value": 0 },
  "delay_minutes": 30,
  "stop_on_conversion": true
}

// CR2: Cart — Nao-Cliente D1 (sequencia de CR1)
{
  "event": "cart.abandoned",
  "condition": { "field": "contact.total_orders", "operator": "equals", "value": 0 },
  "requires_previous": "CR1",
  "requires_not_converted": true,
  "delay_minutes": 1440,
  "stop_on_conversion": true,
  "coupon_config": { "discount_percent": 10, "valid_days": 3, "prefix": "FIRST" }
}

// L1: Welcome
{ "event": "order.paid", "condition": { "field": "contact.total_orders", "operator": "equals", "value": 1 }, "delay_minutes": 60, "fire_once": true }

// L3: Birthday
{ "event": "cron", "cron_expression": "0 9 * * *", "condition": { "field": "contact.birthday", "operator": "is_today" }, "coupon_config": { "discount_percent": 10, "valid_days": 7, "prefix": "BDAY" } }
```

#### 4.3.2 Reference Templates (from Kevi)

Templates reais capturados na entrevista com Caio. Usar como base para criacao dos templates WhatsApp no Meta Cloud API.

**Tom/voz:** Mix — informal WhatsApp, formal email. Sem girias forcadas. Streetwear presente ("Tmj 3️⃣3️⃣").

**Cart D0 Nao-Cliente:**
> Oi {{nome}}! Vi que voce deixou uns itens no carrinho. Precisa de ajuda pra finalizar? Qualquer duvida, e so chamar aqui! Tmj 3️⃣3️⃣

**Cart D1 Nao-Cliente (com cupom):**
> E ai {{nome}}! Seus itens ainda estao esperando por voce 🛒 Separei um cupom especial de primeira compra pra voce: {{cupom}}. Valido por 3 dias! Tmj 3️⃣3️⃣

**Cart D0 Cliente:**
> Fala {{nome}}! Parece que voce esqueceu uns itens no carrinho. Quer que eu segure pra voce? E so finalizar quando quiser! Tmj 3️⃣3️⃣

**Cart D1 Cliente (com cupom):**
> {{nome}}, seus itens ainda tao la! Separei um cupom exclusivo pra voce: {{cupom}}. Valido por 3 dias. Aproveita! Tmj 3️⃣3️⃣

**Pedido Aprovado (T1):**
> Oi {{nome}}! Seu pedido #{{numero}} foi confirmado ✅ Estamos preparando tudo com carinho. Voce vai receber o codigo de rastreio assim que enviarmos! Tmj 3️⃣3️⃣

**Pedido Enviado (T2):**
> {{nome}}, seu pedido #{{numero}} ja saiu! 📦 Rastreie aqui: {{link_rastreio}}. Qualquer duvida, e so chamar! Tmj 3️⃣3️⃣

**Pedido Entregue (T3):**
> {{nome}}, seu pedido #{{numero}} foi entregue! 🎉 Esperamos que voce ame tudo. Se precisar de algo, estamos aqui: {{link_atendimento}}. Tmj 3️⃣3️⃣

### 4.4 Campaigns

> **Phase:** R20-R23 = **1A** (WA + email)

| # | Rule | Detail |
|---|------|--------|
| R20 | **Campaign = manual one-time send** | Unlike automations (event-driven), campaigns are manually created: select segment, choose channel(s), write/select template, schedule or send immediately. |
| R21 | **Campaign scheduling** | Campaigns can be sent immediately or scheduled for a future date/time. Scheduled campaigns are stored with `status=scheduled` and dispatched by a PostgreSQL job queue worker at the specified time. |
| R22 | **Campaign rate limiting** | WhatsApp: max 80 messages/second (Meta Cloud API tier). Campaigns with large segments are queued and dispatched in batches. Email (Resend): 100/second. |
| R23 | **Campaign deduplication** | A contact cannot receive the same campaign twice. The system creates `automation_runs` (reused table) for each recipient, preventing double-sends even on retry. |

### 4.5 Cohort Analytics

> **Phase:** R24-R26 = **3+** (requires 3+ months of accumulated order data to be meaningful)

| # | Rule | Detail |
|---|------|--------|
| R24 | **Cohort definition** | Cohorts group contacts by their first purchase month (e.g., '2026-01'). Optional: by drop (e.g., 'drop-10') or by acquisition source. |
| R25 | **Cohort metrics** | For each cohort, the system calculates: member count, average LTV, repurchase rate (% who bought again within 90 days), churn rate (% who never returned after 90 days). |
| R26 | **Cohort recalculation** | Monthly on the 1st at 04:00 BRT via Vercel Cron. Updates all existing cohorts with latest data. |

### 4.6 Channel Attribution

> **Phase:** R27-R30 = **1A** (UTM capture at Checkout), **1B** (Attribution Report UI)

| # | Rule | Detail |
|---|------|--------|
| R27 | **UTM capture** | The Checkout module captures `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` on the first page load and stores them on both `checkout.carts` and (on conversion) `checkout.orders`. CRM reads these from orders. |
| R28 | **Attribution model** | Last-touch attribution: the UTM params on the order determine the source. **Exception:** if a creator coupon is applied, the attribution is overridden to `source=creator_coupon, medium=creator, campaign={creator_name}` regardless of UTM. |
| R29 | **Source taxonomy** | Standard source categories: `instagram_ad`, `facebook_ad`, `google_ad`, `tiktok_ad`, `organic_instagram`, `organic_tiktok`, `organic_google`, `creator_coupon`, `whatsapp_campaign`, `email_campaign`, `direct`, `referral`, `unknown`. |
| R30 | **First-touch storage** | The first UTM seen for a contact is stored in `crm.contacts.acquisition_utm` and `acquisition_source`. This never changes (first-touch for acquisition). Order-level attribution (last-touch) is tracked on the order itself. |

#### 4.6.1 R-CAC — CAC Tracking Rules

> **Phase:** R-CAC.1-R-CAC.3 = **1B** (manual spend input + source mapping) | R-CAC.4-R-CAC.5 = **1B** (Dashboard Retencao panel)

| # | Rule | Detail |
|---|------|--------|
| R-CAC.1 | **CAC per source channel** | Customer Acquisition Cost (CAC) is tracked per source channel. Supported channels: `paid_traffic`, `creators`, `organic`, `whatsapp`, `marketplace`, `referral`, `unknown`. Each channel maps to one or more `acquisition_source` values from R29 taxonomy (e.g., `paid_traffic` = `instagram_ad` + `facebook_ad` + `google_ad` + `tiktok_ad`). |
| R-CAC.2 | **Source determination priority** | Source is determined by priority cascade: (1) Creator coupon applied on order → `creators`. (2) UTM `source` param present → mapped to channel via config table (e.g., `utm_source=ig` → `paid_traffic`). (3) HTTP `Referer` header → auto-classified by domain (e.g., `instagram.com` → `organic`). (4) Manual tag `marketplace` on contact/order → `marketplace`. (5) No signal → `unknown`. |
| R-CAC.3 | **Marketing spend import** | Marketing spend per channel is imported monthly. Phase 1B: manual input form (admin/pm enters total spend per channel per month). Phase 3+: API integration with Meta Ads Manager and Google Ads for automated spend pull. Stored in `crm.channel_spend` table (month, channel, amount NUMERIC(12,2), imported_by, created_at). |
| R-CAC.4 | **CAC calculation** | `cac_per_channel = total_spend_channel / new_customers_from_channel` per period (monthly). New customer = contact with `first_purchase_at` within the period AND `acquisition_source` mapped to the channel. If a channel has 0 new customers, CAC = NULL (not zero). |
| R-CAC.5 | **CAC display** | CAC per channel displayed in: (1) Dashboard Retencao panel — bar chart with CAC per channel + trend line. (2) CRM Analytics > Atribuicao — table column alongside revenue/orders. (3) Contact detail LTV card — individual contact CAC based on their acquisition channel's CAC for their first_purchase month. |

### 4.7 LGPD & Consent

> **Phase:** R31-R34 = **1A** | R35 (data erasure) = **3+** (requires legal review)

| # | Rule | Detail |
|---|------|--------|
| R31 | **Consent per channel** | Consent is tracked separately for WhatsApp, email, and behavioral tracking. Each consent grant/revoke creates an immutable row in `crm.consents`. |
| R32 | **Consent collection points** | Checkout (opt-in checkboxes), contact profile (editable), CSV import (must include consent columns), API (explicit `granted` field). |
| R33 | **No consent = no marketing** | The system MUST check consent before any marketing dispatch (automation or campaign). Transactional messages (order updates, shipping notifications) do NOT require marketing consent — they fall under contract execution (LGPD Art. 7, V). |
| R34 | **Data export** | On LGPD data export request, the system generates a JSON file containing all personal data for the requested CPF: contact record, order history, consent log, automation runs, segment memberships. |
| R35 | **Data erasure** | On LGPD erasure request: anonymize contact (replace name with "Anonimizado", clear email/phone/address, hash CPF with **SHA-256 + salt** and store in `cpf_hash` field for fiscal compliance audit trail), mark all consent as revoked, retain order financial data for 5 years (fiscal obligation). **Requires legal review before implementation. Phase 3+.** |

### 4.8 Phase 3+ Backlog — ML Features

> **Phase:** 3+ (semanas 18+). Requires 6+ months of accumulated data in Ambaril.

- **Lead scoring preditivo:** identificar clientes proximos de comprar (requer 6+ meses de dados + modelo ML). Input: RFM scores, browsing behavior, cart activity, email engagement.
- **Predicao de recompra:** a partir da 1a compra, prever proxima compra e quando (requer historico de compras + modelo ML). Input: inter-purchase intervals, product category affinity, seasonal patterns.
- Ambos dependem de dados acumulados no Ambaril. Nao implementar antes de ter 6+ meses de operacao.

---

## 5. UI Screens & Wireframes

### 5.1 Contact List (Phase 1A)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRM > Contatos                                                    [+ Importar CSV] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔍 Buscar por nome, CPF, email, telefone...          [Segmento ▼] [Tags ▼] [Data ▼] │
│                                                                             │
│  ┌───┬──────────────────┬───────────────┬──────────────┬────────┬──────────┬────────┐ │
│  │ □ │ Nome             │ CPF           │ Email        │ Pedidos│ Total    │ RFM    │ │
│  ├───┼──────────────────┼───────────────┼──────────────┼────────┼──────────┼────────┤ │
│  │ □ │ Joao Silva       │ 123.456.789-0│ joao@em.com  │ 12     │ R$ 2.340 │ 5-5-4  │ │
│  │   │ Champions        │              │              │        │          │ ██████ │ │
│  ├───┼──────────────────┼───────────────┼──────────────┼────────┼──────────┼────────┤ │
│  │ □ │ Maria Santos     │ 987.654.321-0│ maria@em.com │ 3      │ R$ 560   │ 3-2-2  │ │
│  │   │ Promising        │              │              │        │          │ ███    │ │
│  ├───┼──────────────────┼───────────────┼──────────────┼────────┼──────────┼────────┤ │
│  │ □ │ Pedro Oliveira   │ 456.789.123-0│ —            │ 1      │ R$ 189   │ 1-1-1  │ │
│  │   │ Lost             │              │              │        │          │ █      │ │
│  └───┴──────────────────┴───────────────┴──────────────┴────────┴──────────┴────────┘ │
│                                                                             │
│  Mostrando 1-25 de 4.832 contatos                      [◄ Anterior] [Proximo ►]     │
│                                                                             │
│  Acoes em massa: [Adicionar tag] [Remover tag] [Adicionar ao segmento] [Exportar]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Contact Detail (Phase 1A)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRM > Contatos > Joao Silva                                [Editar] [⚙]  │
├──────────────────────────────────┬──────────────────────────────────────────┤
│                                  │                                          │
│  PERFIL                          │  HISTORICO DE COMPRAS                    │
│  ─────────────────────           │  ──────────────────────                  │
│  Nome: Joao Silva                │  Pedido #4521 — 12/03/2026 — R$ 289,90  │
│  CPF: 123.456.789-09             │    Camiseta Preta Basic P x2            │
│  Email: joao@email.com           │    Status: ✅ Entregue                   │
│  Telefone: +55 11 99999-9999     │                                          │
│  Endereco: R. Augusta 123,       │  Pedido #4412 — 28/02/2026 — R$ 459,90  │
│    Consolacao, SP - 01305-100    │    Moletom Drop 9 M x1                  │
│                                  │    Camiseta Logo G x1                   │
│  METRICAS                        │    Status: ✅ Entregue                   │
│  ─────────────────────           │                                          │
│  Total de pedidos: 12            │  ... (12 pedidos)                        │
│  Total gasto: R$ 2.340,00        │                                          │
│  Ticket medio: R$ 195,00         ├──────────────────────────────────────────┤
│  LTV: R$ 2.340,00                │                                          │
│  Primeira compra: 15/06/2025     │  TIMELINE                               │
│  Ultima compra: 12/03/2026       │  ──────────────────────                  │
│                                  │  12/03 14:30  Pedido #4521 confirmado   │
│  RFM SCORE                       │  12/03 14:31  WhatsApp: confirmacao     │
│  ─────────────────────           │  07/03 09:00  Email: campanha Drop 10   │
│  R: 5  F: 5  M: 4               │  28/02 10:15  Pedido #4412 confirmado   │
│  Segmento: Champions             │  28/02 10:16  WhatsApp: confirmacao     │
│  [████████████████ 14/15]        │  15/02 09:00  WhatsApp: recompra        │
│                                  │  01/01 09:00  WhatsApp: boas festas     │
│  SEGMENTOS                       │  ...                                     │
│  ─────────────────────           │                                          │
│  [Champions] [VIP] [Drop Lover]  ├──────────────────────────────────────────┤
│                                  │                                          │
│  TAGS                            │  CONSENTIMENTOS (LGPD)                   │
│  ─────────────────────           │  ──────────────────────                  │
│  [fiel] [streetwear] [sp]        │  WhatsApp:  ✅ Consentido (15/06/2025)  │
│  [+ Adicionar tag]               │  Email:     ✅ Consentido (15/06/2025)  │
│                                  │  Tracking:  ❌ Nao consentido            │
│  NOTAS                           │                                          │
│  ─────────────────────           │  [Revogar WhatsApp] [Revogar Email]     │
│  Cliente desde o Drop 3.         │  [Exportar dados LGPD]                  │
│  Sempre compra na hora do drop.  │  [Solicitar exclusao LGPD]             │
│                                  │                                          │
│  LTV                             │                                          │
│  ─────────────────────           │                                          │
│  LTV atual:      R$ 2.340,00    │                                          │
│  LTV projetado:  R$ 5.850,00    │                                          │
│  CAC:            R$ 42,00       │                                          │
│  LTV/CAC:        55.7x  [verde] │                                          │
│  Total compras:  12             │                                          │
│  Total devolucoes: 0 (R$ 0)    │                                          │
│                                  │                                          │
├──────────────────────────────────┼──────────────────────────────────────────┤
│                                  │                                          │
│  TABS: [Perfil] [Creator]        │  (Tab "Creator" — visivel somente       │
│                                  │   quando CPF/email do contato bate com   │
│  Creator tab content:            │   registro em creators.creators)         │
│  ─────────────────────           │                                          │
│  Tier: Silver                    │                                          │
│  Cupom: #cienaxjoao10            │                                          │
│  Status: Ativo                   │                                          │
│  [Ver perfil completo no         │                                          │
│   modulo Creators →]             │                                          │
│                                  │                                          │
└──────────────────────────────────┴──────────────────────────────────────────┘
```

### 5.3 Segment List + Segment Builder (Phase 1B)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRM > Segmentos                                          [+ Novo Segmento] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SEGMENTOS RFM (automaticos)                                                │
│  ┌────────────────────┬──────────┬──────────────┬──────────────────────┐    │
│  │ Nome               │ Contatos │ Tipo         │ Ultima atualizacao   │    │
│  ├────────────────────┼──────────┼──────────────┼──────────────────────┤    │
│  │ Champions          │ 234      │ RFM          │ 17/03/2026 03:00    │    │
│  │ Loyal Customers    │ 567      │ RFM          │ 17/03/2026 03:00    │    │
│  │ At Risk            │ 189      │ RFM          │ 17/03/2026 03:00    │    │
│  │ Lost               │ 312      │ RFM          │ 17/03/2026 03:00    │    │
│  │ ...                │          │              │                      │    │
│  └────────────────────┴──────────┴──────────────┴──────────────────────┘    │
│                                                                             │
│  SEGMENTOS CUSTOM                                                           │
│  ┌────────────────────┬──────────┬──────────────┬──────────────────────┐    │
│  │ VIP                │ 89       │ Custom       │ 17/03/2026 03:00    │    │
│  │ SP Capital         │ 1.203    │ Custom       │ 17/03/2026 03:00    │    │
│  │ High Spenders      │ 456      │ Custom       │ 17/03/2026 03:00    │    │
│  └────────────────────┴──────────┴──────────────┴──────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

SEGMENT BUILDER (dialog/sheet):
┌─────────────────────────────────────────────────────────────────────────────┐
│  Criar Segmento                                                    [X]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Nome: [________________________]                                           │
│  Descricao: [___________________________________________________]          │
│                                                                             │
│  CONDICOES                                              Logica: (AND ▼)    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [Total de pedidos ▼]  [maior que ▼]  [3        ]         [🗑]    │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  E                                                                  │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  [Ultima compra ▼]     [nos ultimos ▼] [30 dias  ]         [🗑]    │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  E                                                                  │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  ┌── OU ──────────────────────────────────────────────────────┐    │    │
│  │  │  [Fonte aquisicao ▼] [igual a ▼]   [instagram_ad]  [🗑]   │    │    │
│  │  │  OU                                                        │    │    │
│  │  │  [Fonte aquisicao ▼] [igual a ▼]   [creator_coupon] [🗑]  │    │    │
│  │  │  [+ Adicionar condicao OR]                                 │    │    │
│  │  └────────────────────────────────────────────────────────────┘    │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  [+ Adicionar condicao]    [+ Adicionar grupo OR]                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Preview: 342 contatos correspondem a estas condicoes                       │
│                                                                             │
│  [Cancelar]                                                     [Salvar]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Automation List + Automation Editor (Phase 1B)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRM > Automacoes                                      [+ Nova Automacao]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────┬────────────┬────────────┬────────┬────────┬──────┐ │
│  │ Nome               │ Trigger    │ Canal      │ Envios │ Conv.  │ On/Off│ │
│  ├────────────────────┼────────────┼────────────┼────────┼────────┼──────┤ │
│  │ Welcome            │ 1st order  │ WA + Email │ 1.203  │ —      │ [✅] │ │
│  │ Review Request     │ Delivered  │ WhatsApp   │ 892    │ 12%    │ [✅] │ │
│  │ Cart Recovery (3x) │ Abandoned  │ WA + Email │ 2.456  │ 8.3%   │ [✅] │ │
│  │ Birthday           │ Birthday   │ WA + Email │ 342    │ 45%    │ [✅] │ │
│  │ Reactivation       │ 60d inact. │ WA + Email │ 567    │ 5.2%   │ [✅] │ │
│  │ Repurchase Nudge   │ 45d since  │ WhatsApp   │ 789    │ 7.1%   │ [✅] │ │
│  │ VIP Welcome        │ VIP enter  │ WhatsApp   │ 89     │ —      │ [✅] │ │
│  └────────────────────┴────────────┴────────────┴────────┴────────┴──────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

AUTOMATION EDITOR (page):
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRM > Automacoes > Editar: Welcome                          [Salvar] [⚙] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐     ┌────────────┐     ┌─────────┐     ┌──────────────────┐  │
│  │ TRIGGER │────►│ CONDICAO   │────►│ DELAY   │────►│ ACAO             │  │
│  │         │     │            │     │         │     │                  │  │
│  │ Evento: │     │ Campo:     │     │ Espera: │     │ Canal: WhatsApp  │  │
│  │ order   │     │ total_     │     │ 1 hora  │     │ Template:        │  │
│  │ .paid   │     │ orders = 1 │     │         │     │ wa_welcome       │  │
│  └─────────┘     └────────────┘     └─────────┘     │                  │  │
│                                                      │ Canal: Email     │  │
│                                                      │ Template:        │  │
│                                                      │ email_welcome    │  │
│                                                      └──────────────────┘  │
│                                                                             │
│  METRICAS                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Total enviados: 1.203    Entregues: 1.198 (99.6%)                │    │
│  │  Abertos: 892 (74.5%)    Clicados: 234 (19.5%)                   │    │
│  │  Convertidos: —           Erros: 5 (0.4%)                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  HISTORICO DE EXECUCOES (ultimas 20)                                       │
│  ┌─────────────────┬──────────────┬──────────┬──────────────────────┐      │
│  │ Contato         │ Agendado     │ Enviado  │ Status               │      │
│  ├─────────────────┼──────────────┼──────────┼──────────────────────┤      │
│  │ Joao Silva      │ 12/03 15:30  │ 15:30    │ ✅ Entregue          │      │
│  │ Maria Santos    │ 11/03 20:00  │ 20:00    │ ✅ Entregue          │      │
│  │ Pedro Oliveira  │ 11/03 14:15  │ —        │ ⏭ Ignorado (consent)│      │
│  └─────────────────┴──────────────┴──────────┴──────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Campaign Creator (Phase 1A)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRM > Campanhas > Nova Campanha                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PASSO 1: PUBLICO                                                          │
│  ─────────────────────                                                      │
│  Segmento: [Champions              ▼]    Contatos: 234                     │
│  Filtro adicional: [Nenhum                                           ▼]    │
│  Excluir sem consentimento: [✅]          Enviavel: 221                     │
│                                                                             │
│  PASSO 2: CANAL E MENSAGEM                                                 │
│  ─────────────────────                                                      │
│  Canal: (●) WhatsApp  ( ) Email  ( ) WhatsApp + Email                      │
│                                                                             │
│  Template WhatsApp: [wa_campaign_drop10     ▼]                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Preview:                                                          │    │
│  │  ┌─────────────────────────────────┐                               │    │
│  │  │ 🔥 Ola {{nome}}!               │                               │    │
│  │  │                                 │                               │    │
│  │  │ O Drop 10 esta no ar!          │                               │    │
│  │  │ Pecas exclusivas que voce      │                               │    │
│  │  │ vai amar.                       │                               │    │
│  │  │                                 │                               │    │
│  │  │ [Ver colecao]                   │                               │    │
│  │  └─────────────────────────────────┘                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  PASSO 3: AGENDAMENTO                                                      │
│  ─────────────────────                                                      │
│  (●) Enviar agora   ( ) Agendar para: [__/__/____] [__:__]                │
│                                                                             │
│  [Cancelar]                         [Enviar para 221 contatos]             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.6 Cohort Analytics Dashboard (Phase 3+)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRM > Analytics > Cohort                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Agrupar por: (●) Mes  ( ) Trimestre  ( ) Drop     Periodo: [Ultimos 12m] │
│                                                                             │
│  MATRIZ DE RETENCAO                                                        │
│  ┌─────────────┬───────┬───────┬───────┬───────┬───────┬───────┬───────┐  │
│  │ Cohort      │ Mes 0 │ Mes 1 │ Mes 2 │ Mes 3 │ Mes 4 │ Mes 5 │ Mes 6 │  │
│  │             │ (acq) │       │       │       │       │       │       │  │
│  ├─────────────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┤  │
│  │ 2025-09     │ 100%  │ 32%   │ 21%   │ 18%   │ 15%   │ 12%   │ 10%   │  │
│  │ (n=234)     │ ████  │ ███   │ ██    │ ██    │ █     │ █     │ █     │  │
│  ├─────────────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┤  │
│  │ 2025-10     │ 100%  │ 28%   │ 19%   │ 15%   │ 13%   │ 11%   │       │  │
│  │ (n=312)     │ ████  │ ███   │ ██    │ █     │ █     │ █     │       │  │
│  ├─────────────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┤  │
│  │ 2025-11     │ 100%  │ 35%   │ 24%   │ 19%   │ 16%   │       │       │  │
│  │ (n=189)     │ ████  │ ███   │ ██    │ ██    │ █     │       │       │  │
│  ├─────────────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┤  │
│  │ ...         │       │       │       │       │       │       │       │  │
│  └─────────────┴───────┴───────┴───────┴───────┴───────┴───────┴───────┘  │
│                                                                             │
│  METRICAS POR COHORT                                                       │
│  ┌─────────────┬──────────┬───────────┬──────────┬──────────┬───────────┐  │
│  │ Cohort      │ Contatos │ Recompra  │ LTV Medio│ Churn    │ AOV       │  │
│  ├─────────────┼──────────┼───────────┼──────────┼──────────┼───────────┤  │
│  │ 2025-09     │ 234      │ 32%       │ R$ 567   │ 68%      │ R$ 189    │  │
│  │ 2025-10     │ 312      │ 28%       │ R$ 423   │ 72%      │ R$ 165    │  │
│  │ 2025-11     │ 189      │ 35%       │ R$ 612   │ 65%      │ R$ 204    │  │
│  └─────────────┴──────────┴───────────┴──────────┴──────────┴───────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.7 Channel Attribution Report (Phase 1B)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRM > Analytics > Atribuicao                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Periodo: [01/03/2026] a [17/03/2026]       Modelo: Last-touch             │
│                                                                             │
│  DISTRIBUICAO POR FONTE                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │            ████████████████ Instagram Ad (42%)                      │    │
│  │        ██████████ Creator Coupon (25%)                              │    │
│  │      ████████ Organic Instagram (18%)                               │    │
│  │    ██████ Direct (8%)                                               │    │
│  │   ████ Email Campaign (5%)                                          │    │
│  │  ██ Others (2%)                                                     │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  DETALHAMENTO UTM                                                          │
│  ┌──────────────┬────────────┬──────────┬────────┬──────────┬──────────┐   │
│  │ Fonte        │ Medio      │ Campanha │ Pedidos│ Receita  │ AOV      │   │
│  ├──────────────┼────────────┼──────────┼────────┼──────────┼──────────┤   │
│  │ instagram    │ paid       │ drop10   │ 89     │ R$ 17.8k │ R$ 200   │   │
│  │ instagram    │ paid       │ retgt_m3 │ 45     │ R$ 8.1k  │ R$ 180   │   │
│  │ creator      │ coupon     │ @joao    │ 34     │ R$ 6.8k  │ R$ 200   │   │
│  │ creator      │ coupon     │ @maria   │ 28     │ R$ 5.0k  │ R$ 179   │   │
│  │ instagram    │ organic    │ —        │ 38     │ R$ 6.5k  │ R$ 171   │   │
│  │ direct       │ —          │ —        │ 17     │ R$ 3.2k  │ R$ 188   │   │
│  │ email        │ campaign   │ drop10   │ 11     │ R$ 2.1k  │ R$ 191   │   │
│  └──────────────┴────────────┴──────────┴────────┴──────────┴──────────┘   │
│                                                                             │
│  [Exportar CSV]                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.8 RFM Segment Grid (Phase 1B)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRM > Analytics > RFM Grid                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Ultima atualizacao: 17/03/2026 03:00      Total de contatos com RFM: 4.320│
│                                                                             │
│        Frequency ──────────────────────────────────────────────►            │
│   R    │   F1        F2        F3        F4        F5                      │
│   e  5 │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐              │
│   c    │ │ New   │ │Promis.│ │Potent.│ │ Loyal │ │ Champ │              │
│   e    │ │  156  │ │  203  │ │  189  │ │  234  │ │  267  │              │
│   n    │ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘              │
│   c  4 │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐              │
│   y    │ │ New   │ │Promis.│ │Potent.│ │ Loyal │ │ Loyal │              │
│        │ │  134  │ │  178  │ │  145  │ │  198  │ │  212  │              │
│   │  3 │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐              │
│   │    │ │Promis.│ │ About │ │ Need  │ │ Need  │ │Potent.│              │
│   │    │ │  112  │ │ Sleep │ │ Attn  │ │ Attn  │ │  156  │              │
│   │    │ │       │ │  98   │ │  87   │ │  76   │ │       │              │
│   ▼  2 │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐              │
│        │ │Hibern.│ │ About │ │ About │ │At Risk│ │At Risk│              │
│        │ │  145  │ │ Sleep │ │ Sleep │ │  167  │ │  134  │              │
│        │ │       │ │  123  │ │  109  │ │       │ │       │              │
│      1 │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐              │
│        │ │ Lost  │ │Hibern.│ │Hibern.│ │Cannot │ │Cannot │              │
│        │ │  234  │ │  178  │ │  145  │ │ Lose  │ │ Lose  │              │
│        │ │       │ │       │ │       │ │  89   │ │  67   │              │
│        │ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘              │
│                                                                             │
│  [Clicar em um segmento para ver os contatos]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. API Endpoints

All endpoints follow the patterns defined in [API.md](../../architecture/API.md). Module prefix: `/api/v1/crm`.

### 6.1 Contacts (Phase 1A; erase-lgpd = Phase 3+)

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/contacts` | Internal | List contacts (paginated, filterable) | `?cursor=&limit=25&search=&segment=&tag=&sort=-createdAt` | `{ data: Contact[], meta: Pagination }` |
| GET | `/contacts/:id` | Internal | Get contact detail | `?include=rfm,orders,automations` | `{ data: Contact }` |
| POST | `/contacts` | Internal | Create contact | `{ name, cpf, email?, phone?, address?, tags?, consent_whatsapp?, consent_email? }` | `201 { data: Contact }` |
| PATCH | `/contacts/:id` | Internal | Update contact | `{ name?, email?, phone?, address?, tags?, is_vip?, notes? }` | `{ data: Contact }` |
| DELETE | `/contacts/:id` | Internal | Soft-delete contact | — | `204` |
| POST | `/contacts/import` | Internal | Import CSV of contacts | `multipart/form-data` with CSV file | `{ data: { imported: N, skipped: N, errors: [...] } }` |
| POST | `/contacts/:id/actions/merge` | Internal | Merge with another contact | `{ target_contact_id }` | `{ data: Contact }` |
| POST | `/contacts/:id/actions/export-lgpd` | Internal | LGPD data export | — | `{ data: { download_url } }` |
| POST | `/contacts/:id/actions/erase-lgpd` | Internal | LGPD data erasure | `{ confirmation_token }` | `204` |

### 6.2 Segments (Phase 1B; basic list in Phase 1A)

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/segments` | Internal | List all segments | `?type=rfm,custom&sort=-contactCount` | `{ data: Segment[] }` |
| GET | `/segments/:id` | Internal | Get segment detail | `?include=contacts` | `{ data: Segment }` |
| POST | `/segments` | Internal | Create custom segment | `{ name, description?, rules, is_dynamic? }` | `201 { data: Segment }` |
| PATCH | `/segments/:id` | Internal | Update segment | `{ name?, description?, rules? }` | `{ data: Segment }` |
| DELETE | `/segments/:id` | Internal | Delete segment | — | `204` |
| POST | `/segments/:id/actions/recalculate` | Internal | Force recalculate segment | — | `{ data: { contact_count } }` |
| POST | `/segments/preview` | Internal | Preview segment without saving | `{ rules }` | `{ data: { contact_count, sample_contacts: Contact[] } }` |

### 6.3 Automations (Phase 1A CRUD; Phase 1B full editor)

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/automations` | Internal | List automations | `?status=active&sort=-totalSent` | `{ data: Automation[] }` |
| GET | `/automations/:id` | Internal | Get automation detail + metrics | `?include=runs` | `{ data: Automation }` |
| POST | `/automations` | Internal | Create custom automation | `{ name, trigger_type, trigger_config, channel, template_id?, status? }` | `201 { data: Automation }` |
| PATCH | `/automations/:id` | Internal | Update automation | `{ name?, trigger_config?, channel?, template_id?, status? }` | `{ data: Automation }` |
| POST | `/automations/:id/actions/activate` | Internal | Set status to active | — | `{ data: Automation }` |
| POST | `/automations/:id/actions/pause` | Internal | Set status to paused | — | `{ data: Automation }` |
| GET | `/automations/:id/runs` | Internal | List runs for automation | `?status=&contactId=&cursor=&limit=25` | `{ data: AutomationRun[] }` |

### 6.4 Campaigns (Phase 1A)

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/campaigns` | Internal | List campaigns | `?cursor=&limit=25` | `{ data: Campaign[] }` |
| POST | `/campaigns` | Internal | Create and send/schedule | `{ segment_id, channel, template_id?, email_template_key?, scheduled_at?, message_body? }` | `201 { data: Campaign }` |
| GET | `/campaigns/:id` | Internal | Campaign detail + metrics | — | `{ data: Campaign }` |
| POST | `/campaigns/:id/actions/cancel` | Internal | Cancel scheduled campaign | — | `{ data: Campaign }` |

### 6.5 Analytics (overview = Phase 1A; rfm-grid + attribution = Phase 1B; cohorts = Phase 3+)

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/analytics/rfm-grid` | Internal | RFM 5x5 grid with counts | — | `{ data: { grid: RfmCell[][] } }` |
| GET | `/analytics/cohorts` | Internal | Cohort retention matrix | `?groupBy=month&period=12m` | `{ data: { cohorts: Cohort[] } }` |
| GET | `/analytics/attribution` | Internal | Channel attribution report | `?dateFrom=&dateTo=` | `{ data: { sources: AttributionSource[] } }` |
| GET | `/analytics/overview` | Internal | CRM overview metrics | — | `{ data: { totalContacts, activeContacts, avgLtv, avgAov, ... } }` |

### 6.6 Consents (Phase 1A)

| Method | Path | Auth | Description | Request Body / Query | Response |
|--------|------|------|-------------|---------------------|----------|
| GET | `/contacts/:id/consents` | Internal | Consent history for contact | — | `{ data: Consent[] }` |
| POST | `/contacts/:id/consents` | Internal | Record consent change | `{ consent_type, granted, source }` | `201 { data: Consent }` |

### 6.7 Internal Event Receivers (Phase 1A)

These are internal endpoints called by other modules (not exposed to external clients):

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/internal/contacts/upsert-from-order` | Service-to-service | Called by Checkout on order.paid to create/update contact |
| POST | `/internal/contacts/update-financials` | Service-to-service | Called by Checkout on order.paid to update counters |
| POST | `/internal/automations/trigger` | Service-to-service | Called by Checkout/ERP to trigger automation events |

---

## 7. Integrations

### 7.1 Inbound (modules that feed data INTO CRM)

| Source Module | Event / Data | CRM Action |
|--------------|-------------|------------|
| **Checkout** | `order.paid` | Create/update contact (upsert by CPF), update financial counters, capture UTM attribution, trigger welcome/post-purchase automations |
| **Checkout** | `cart.abandoned` | Link contact to abandoned cart, trigger cart recovery automation sequence |
| **Checkout** | `order.delivered` | Trigger post-purchase review automation |
| **ERP** | Order status changes | Update `last_purchase_at`, update contact timeline |
| **Trocas** | `exchange.completed` | Update contact LTV (subtract refund if applicable) |
| **Creators** | Coupon usage | Override attribution to creator source |
| **Creators** | Creator application approved | When a customer applies as creator and is approved, CRM contact is linked automatically via CPF/email match. CRM contact gains `creator` tag and `creator_id` reference. |
| **B2B** | Marketplace insert scan | QR code from B2B insert kit scanned → landing page visit with UTM `source=marketplace` → contact registered with `acquisition_source = 'marketplace'` (see R8b). |
| **Ambaril Tracker** | Visitor identified (passive match) | Link visitor to contact, merge browsing history. See [section 15A](#15a-ambaril-tracker--passive-visitor-identification) |
| **Ambaril Tracker** | Page view on product | Feed product interest data to CRM (enables R4 Price Drop, R5 Back in Stock) |

### 7.2 Outbound (CRM dispatches TO other modules/services)

| Target | Data / Action | Trigger |
|--------|--------------|---------|
| **WhatsApp Engine** | Send template message | Automation run or campaign dispatch (channel = whatsapp) |
| **Resend** (email) | Send transactional/marketing email | Automation run or campaign dispatch (channel = email) |
| **ClawdBot** (Discord) | CRM report data | Daily report at 09:00 (ClawdBot queries CRM analytics endpoints) |
| **Checkout** | VIP whitelist check | Checkout queries `crm.contacts.is_vip` during VIP drop window |
| **Creators** | CRM data on creator profile | Creators module queries CRM for contact purchase history, RFM score, and LTV to display on creator profile (bidirectional with inbound creator link). |

### 7.3 External Services

| Service | Purpose | Integration Pattern |
|---------|---------|-------------------|
| **Resend** | Email dispatch (transactional + marketing) | `packages/integrations/resend/client.ts` — API key auth, 100 emails/s, retry with backoff |
| **WhatsApp Engine** | WhatsApp dispatch | Internal module-to-module call via API (CRM schedules, WhatsApp Engine delivers) |

### 7.4 CRM ↔ Creators Unified View

> **Phase:** **1B** (requires Creators module operational)

**Sync mechanism:** CRM and Creators are linked via CPF or email match between `crm.contacts` and `creators.creators`.

| Direction | Trigger | Action |
|-----------|---------|--------|
| **Creators → CRM** | Creator application approved (`creators.creators.status = 'active'`) | CRM contact matched by CPF/email gains: (1) `creator` tag added to `tags[]`, (2) `creator_id` stored in contact metadata (JSONB). If no CRM contact exists for that CPF/email, one is created with `acquisition_source = 'creator_application'`. |
| **CRM → Creators** | CRM contact data updated (purchase, RFM recalc) | Creators module reads CRM data on-demand via internal API: `GET /api/v1/crm/internal/contacts/by-cpf/:cpf` returns purchase history, RFM score, LTV, segments. Displayed on creator profile in Creators module. |
| **CRM UI** | Contact detail page load | If `creator_id` is set on contact, a "Creator" tab is rendered showing: tier, coupon code, active status, deep link to `/admin/creators/:creator_id`. Tab hidden if no match. |
| **Creators UI** | Creator profile page load | If CRM contact match exists, creator profile shows: total de compras, LTV, RFM score + segment name, last purchase date. Data fetched from CRM internal API. |

---

## 8. Background Jobs

All jobs run via PostgreSQL job queue (`FOR UPDATE SKIP LOCKED`) + Vercel Cron. No Redis/BullMQ.

| Job Name | Queue | Schedule | Priority | Phase | Description |
|----------|-------|----------|----------|-------|-------------|
| `crm:automation-dispatch` | `crm` | Every 1 minute (poll) | High | **1A** | Pick up pending automation_runs where scheduled_at <= NOW(), dispatch via channel |
| `crm:campaign-dispatch` | `crm` | On-demand (scheduled) | High | **1A** | Send scheduled campaign at specified time |
| `crm:cart-recovery-step` | `crm` | Trigger-based | Medium | **1A** | Advance cart recovery D0→D1 sequence (CR1→CR2 or CR3→CR4) |
| `crm:rfm-recalculate` | `crm` | Daily 03:00 BRT | Medium | **1B** | Recalculate RFM scores for all contacts with orders |
| `crm:segment-recalculate` | `crm` | Daily 03:30 BRT | Medium | **1B** | Recalculate all dynamic segments, update contact_count and contact segment_ids |
| `crm:birthday-scan` | `crm` | Daily 08:30 BRT | Low | **1B** | Scan contacts with today's birthday, trigger birthday automation |
| `crm:inactivity-scan` | `crm` | Daily 10:00 BRT | Low | **1B** | Scan contacts inactive 60+ days, trigger reactivation automation |
| `crm:repurchase-scan` | `crm` | Daily 10:30 BRT | Low | **1B** | Scan contacts 45-59 days since last purchase, trigger repurchase nudge |
| `crm:cohort-recalculate` | `crm` | Monthly 1st 04:00 BRT | Medium | **3+** | Recalculate all cohort metrics |

> **Note:** T1-T3 (transactional automations) are event-driven, not background jobs — fired synchronously on order status webhook via `crm:automation-dispatch`.
| `crm:rfm-history-purge` | `crm` | Monthly 1st 05:00 BRT | Low | **3+** | Delete RFM score rows older than 90 days |

---

## 9. Permissions

From [AUTH.md](../../architecture/AUTH.md) section 3.4.3. Format: `{module}:{resource}:{action}`.

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b | creator |
|-----------|-------|-----|----------|-----------|---------|---------|-----------|-----|---------|
| `crm:contacts:read` | Y | Y | -- | -- | Y | -- | -- | -- | -- |
| `crm:contacts:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:contacts:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `crm:contacts:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `crm:segments:read` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:segments:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:segments:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `crm:automations:read` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:automations:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:automations:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `crm:campaigns:read` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:campaigns:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:campaigns:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `crm:consents:read` | Y | Y | -- | -- | Y | -- | -- | -- | -- |
| `crm:consents:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:cohorts:read` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:cohorts:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |

**Notes:**
- `support` can read contacts and consents to assist customers, but cannot modify CRM data.
- `pm` (Caio) has full read/write to manage CRM strategy (segments, automations, campaigns).
- Only `admin` (Marcus) can delete contacts, segments, automations, or campaigns.
- External roles (`b2b_retailer`, `creator`) have zero CRM access.

---

## 10. Notifications (Flare Events)

Events emitted by the CRM module to the Flare notification system. See [NOTIFICATIONS.md](../../platform/NOTIFICATIONS.md).

| Event Key | Trigger | Channels | Recipients | Priority |
|-----------|---------|----------|------------|----------|
| `contact.created` | New contact created | _(none by default)_ | — | — |
| `campaign.sent` | Campaign dispatch completed | In-app | `pm` role | Low |
| `campaign.failed` | Campaign dispatch failed | In-app, Discord `#alertas` | `admin`, `pm` | High |
| `automation.triggered` | Automation fires for contact | WhatsApp or Email | Customer (contact) | Medium |
| `rfm.recalculation.completed` | Daily RFM job finishes | In-app | `pm` role | Low |
| `rfm.segment.shift` | Contact moves between major segments (e.g., Champions -> At Risk) | In-app | `pm` role | Medium |
| `consent.revoked` | Customer revokes consent | In-app | `admin`, `pm` | Medium |
| `lgpd.export.requested` | LGPD data export initiated | In-app | `admin` | High |
| `lgpd.erasure.requested` | LGPD data erasure initiated | In-app, Discord `#alertas` | `admin` | Critical |

---

## 11. Error Handling

All errors follow the standard envelope from [API.md](../../architecture/API.md) and error codes from [ERROR-HANDLING.md](../../platform/ERROR-HANDLING.md).

| Error Code | HTTP | When | User-facing Message |
|-----------|------|------|-------------------|
| `CRM_DUPLICATE_CPF` | 409 | Contact with same CPF already exists | "Ja existe um contato com este CPF." |
| `CRM_DUPLICATE_EMAIL` | 409 | Contact with same email already exists | "Ja existe um contato com este email." |
| `CRM_INVALID_CPF` | 422 | CPF fails check-digit validation | "CPF invalido." |
| `CRM_CONTACT_NOT_FOUND` | 404 | Contact ID does not exist or is deleted | "Contato nao encontrado." |
| `CRM_SEGMENT_NOT_FOUND` | 404 | Segment ID does not exist | "Segmento nao encontrado." |
| `CRM_SEGMENT_RULES_INVALID` | 422 | Segment rules JSON is malformed | "Regras do segmento invalidas. Verifique os campos e operadores." |
| `CRM_AUTOMATION_NOT_FOUND` | 404 | Automation ID does not exist | "Automacao nao encontrada." |
| `CRM_AUTOMATION_ALREADY_ACTIVE` | 409 | Trying to activate an already-active automation | "Esta automacao ja esta ativa." |
| `CRM_NO_CONSENT` | 422 | Attempting to send to contact without consent | "Contato nao possui consentimento para este canal." |
| `CRM_COOLDOWN_ACTIVE` | 422 | Automation cannot fire due to cooldown period | "Contato ja recebeu mensagem recentemente. Aguarde o periodo de cooldown." |
| `CRM_CAMPAIGN_EMPTY_SEGMENT` | 422 | Segment has 0 contacts with consent | "Nenhum contato elegivel neste segmento (sem consentimento ou segmento vazio)." |
| `CRM_CSV_PARSE_ERROR` | 422 | CSV import has format errors | "Erro ao processar CSV. Verifique o formato." |
| `CRM_LGPD_CONFIRMATION_REQUIRED` | 422 | Erasure requested without confirmation | "Confirmacao necessaria para exclusao de dados LGPD." |
| `CRM_MERGE_SAME_CONTACT` | 422 | Attempting to merge a contact with itself | "Nao e possivel mesclar um contato com ele mesmo." |

---

## 12. Testing Checklist

Following the testing strategy from [TESTING.md](../../platform/TESTING.md).

### 12.1 Unit Tests

**Phase 1A:**
- [ ] CPF validation (valid, invalid, edge cases: all-same-digits, formatted, unformatted)
- [ ] Contact merge logic (financial sums, tag union, address recency, oldest created_at)
- [ ] Consent check logic (latest consent per type)
- [ ] UTM attribution logic (last-touch with creator override)
- [ ] Automation trigger condition evaluation
- [ ] Cooldown period calculation

**Phase 1B:**
- [ ] RFM score calculation for each score band (R1-R5, F1-F5, M1-M5)
- [ ] RFM segment mapping (all 11 segments with boundary conditions)
- [ ] Monetary quintile calculation (even distribution, edge cases with ties)
- [ ] Segment rules parser (AND logic, OR logic, nested groups, all operators)

### 12.2 Integration Tests

**Phase 1A:**
- [ ] Create contact via API, verify database state
- [ ] Create contact with duplicate CPF, verify 409 response
- [ ] Import CSV with 100 contacts (mix of new and duplicates), verify import report
- [ ] Create automation, trigger event, verify automation_run created with correct scheduled_at
- [ ] Verify automation skipped when consent is false
- [ ] Verify automation skipped when cooldown is active
- [ ] Campaign to segment of 50 contacts, verify 50 automation_runs created
- [ ] Contact upsert from order.paid event (Checkout integration)
- [ ] LGPD data export: verify JSON contains all personal data

**Phase 1B:**
- [ ] Create custom segment, verify contact_count matches filter
- [ ] RFM recalculation job: run with known data, verify scores match expected
- [ ] Birthday automation: set birthday to today, run scan, verify automation triggered

**Phase 1A (Cart Recovery):**
- [ ] Cart recovery CR1-CR4: verify 4 separate automations fire based on customer status (total_orders) and delay
- [ ] Cart recovery D0→D1 sequence: verify CR2 only fires if CR1 not converted, CR4 only if CR3 not converted
- [ ] Transactional T1-T3: verify automations fire on every order status change (not just first)

**Phase 3+:**
- [ ] LGPD erasure: verify anonymization, verify consent revoked, verify financial data retained

### 12.3 E2E Tests

**Phase 1A:**
- [ ] Contact detail page: verify all sections render (profile, orders, timeline, consents)
- [ ] Campaign flow: create segment -> create email campaign -> schedule -> dispatch -> verify delivery metrics

**Phase 1B:**
- [ ] Segment builder: create complex segment with nested AND/OR, verify preview count, save, verify in list
- [ ] RFM grid: verify grid renders with correct segment counts, click segment navigates to contact list

**Phase 2:**
- [ ] Full lifecycle: checkout creates contact -> RFM calculated -> segment assigned -> automation fires -> WhatsApp sent

### 12.4 Performance Tests

- [ ] Contact list with 10,000+ contacts: pagination under 200ms
- [ ] RFM recalculation with 10,000 contacts: completes within 5 minutes (Phase 1B)
- [ ] Segment recalculation with complex rules on 10,000 contacts: under 30 seconds (Phase 1B)
- [ ] Campaign dispatch to 5,000 contacts: queued and dispatching within 2 minutes
- [ ] Cohort matrix calculation for 12 months: under 10 seconds (Phase 3+)

---

## 13. On-Site Widget Engine (Phase 2)

> **Phase:** 2 (semanas 14-20). Requires CRM core (Phase 1A) + Shopify theme app extension operational.
> **Inspired by:** Edrone On-Site Engine (popups, banners, sliders, social proof, chat widget).

The On-Site Widget Engine extends the CRM module with customer-facing widgets embedded in the Shopify storefront via a theme app extension. Widgets capture leads, display promotions, show social proof, and drive conversions — all managed from the Ambaril admin.

### 13.1 Data Model

#### 4 new tables in schema `crm`

| Table | Est. Rows | Description |
|-------|-----------|-------------|
| `crm.widgets` | ~50 | Widget configuration (type, content, targeting, metrics) |
| `crm.widget_events` | ~100k+/month | High-volume event log (view, click, close, subscribe, convert) |
| `crm.widget_templates` | ~20 | Pre-built + custom templates |
| `crm.widget_metrics_daily` | ~365×N | Daily aggregated metrics per widget |

#### New ENUMs

```sql
CREATE TYPE crm.widget_type AS ENUM ('popup', 'banner', 'slider', 'social_proof');
CREATE TYPE crm.widget_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE crm.popup_trigger AS ENUM ('exit_intent', 'scroll_percent', 'time_delay', 'click', 'page_load');
CREATE TYPE crm.widget_event_type AS ENUM ('view', 'click', 'close', 'auto_close', 'subscribe_email', 'subscribe_phone', 'convert');
CREATE TYPE crm.widget_placement AS ENUM ('overlay_center', 'overlay_bottom', 'top_bar', 'inline', 'sidebar', 'toast_bottom_left', 'toast_bottom_right', 'slide_in_right');
```

#### crm.widgets

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | UUID v7 |
| name | VARCHAR(255) | NOT NULL | Widget display name |
| type | crm.widget_type | NOT NULL | popup, banner, slider, social_proof |
| status | crm.widget_status | NOT NULL DEFAULT 'draft' | draft, active, paused, archived |
| placement | crm.widget_placement | NOT NULL | Where on page the widget renders |
| trigger_type | crm.popup_trigger | NULL | Only for popups |
| trigger_config | JSONB | NULL | `{ scroll_percent: 50, delay_seconds: 5 }` |
| content | JSONB | NOT NULL | `{ title, body, image_url, cta_text, cta_url, fields[], colors, custom_css }` |
| targeting_rules | JSONB | NOT NULL DEFAULT '{}' | `{ pages, device, visitor_type, segment_id, url_contains, cart_value_min_cents }` |
| frequency_cap | JSONB | NOT NULL DEFAULT '{"type":"once_per_session"}' | once_per_session, once_per_day, always, once_per_lifetime |
| priority | INTEGER | NOT NULL DEFAULT 0 | Higher = shown first when multiple widgets qualify |
| starts_at | TIMESTAMPTZ | NULL | Schedule start |
| ends_at | TIMESTAMPTZ | NULL | Schedule end, auto-pause when expired |
| total_views | INTEGER | NOT NULL DEFAULT 0 | Denormalized counter |
| total_clicks | INTEGER | NOT NULL DEFAULT 0 | Denormalized counter |
| total_conversions | INTEGER | NOT NULL DEFAULT 0 | Denormalized counter |
| total_revenue_cents | BIGINT | NOT NULL DEFAULT 0 | Attributed revenue in cents |
| template_id | UUID | NULL, FK crm.widget_templates(id) | Source template |
| created_by | UUID | NOT NULL, FK global.users(id) | Creator |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete |

```sql
CREATE INDEX idx_widgets_status ON crm.widgets (status);
CREATE INDEX idx_widgets_type ON crm.widgets (type);
CREATE INDEX idx_widgets_priority ON crm.widgets (priority DESC) WHERE status = 'active';
CREATE INDEX idx_widgets_schedule ON crm.widgets (starts_at, ends_at) WHERE status = 'active';
```

#### crm.widget_events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| widget_id | UUID | NOT NULL, FK crm.widgets(id) | |
| event_type | crm.widget_event_type | NOT NULL | view, click, close, subscribe_email, etc. |
| contact_id | UUID | NULL, FK crm.contacts(id) | NULL for anonymous visitors |
| session_id | VARCHAR(64) | NOT NULL | Client-generated session identifier |
| page_url | TEXT | NOT NULL | URL where event occurred |
| device_type | VARCHAR(20) | NULL | desktop, mobile, tablet |
| metadata | JSONB | NULL | Extra event data (e.g., email captured, field values) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE INDEX idx_widget_events_widget ON crm.widget_events (widget_id);
CREATE INDEX idx_widget_events_type ON crm.widget_events (event_type);
CREATE INDEX idx_widget_events_created ON crm.widget_events (created_at DESC);
CREATE INDEX idx_widget_events_session ON crm.widget_events (session_id);
CREATE INDEX idx_widget_events_contact ON crm.widget_events (contact_id) WHERE contact_id IS NOT NULL;
```

#### crm.widget_templates

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | Template display name |
| type | crm.widget_type | NOT NULL | popup, banner, slider, social_proof |
| placement | crm.widget_placement | NOT NULL | Default placement |
| content | JSONB | NOT NULL | Default content structure |
| thumbnail_url | TEXT | NULL | Preview image |
| is_system | BOOLEAN | NOT NULL DEFAULT FALSE | TRUE = pre-built, cannot be deleted |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

#### crm.widget_metrics_daily

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| widget_id | UUID | NOT NULL, FK crm.widgets(id) | |
| date | DATE | NOT NULL | Aggregation date |
| views | INTEGER | NOT NULL DEFAULT 0 | |
| clicks | INTEGER | NOT NULL DEFAULT 0 | |
| closes | INTEGER | NOT NULL DEFAULT 0 | |
| subscriptions | INTEGER | NOT NULL DEFAULT 0 | Email + phone captures |
| conversions | INTEGER | NOT NULL DEFAULT 0 | |
| revenue_cents | BIGINT | NOT NULL DEFAULT 0 | Attributed revenue |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE UNIQUE INDEX idx_widget_metrics_daily_widget_date ON crm.widget_metrics_daily (widget_id, date);
CREATE INDEX idx_widget_metrics_daily_date ON crm.widget_metrics_daily (date DESC);
```

### 13.2 Rendering Pipeline

```
Admin creates widget → crm.widgets (DB) → PostgreSQL-backed cache (60s TTL)
                                               ↓
Shopify storefront (JS snippet via theme app extension)
    → GET /api/v1/public/crm/widgets/active?page=product&product_id=X
    → Client-side evaluates final targeting (viewport, scroll, timing)
    → Renders widget (vanilla JS + CSS, ~15KB gzip, no React on storefront)
    → POST /api/v1/public/crm/widgets/events (view, click, subscribe, convert)
                                               ↓
PostgreSQL job queue → Worker aggregates into widget_metrics_daily + updates denormalized counters
```

**Targeting rules engine (JSONB):**

```json
{
  "pages": ["product", "collection"],
  "device": "all",
  "visitor_type": "new_visitor",
  "url_contains": "/colecao-noturna",
  "cart_value_min_cents": 15000,
  "segment_id": null
}
```

Evaluated server-side on the public endpoint + client-side for scroll/time triggers.

### 13.3 UI — Widget Builder (CRM > On-Site)

**Widget List:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRM > On-Site                                                [+ Novo Widget] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────┬──────────┬──────────┬────────┬────────┬──────────┐ │
│  │ Nome               │ Tipo     │ Status   │ Views  │ CTR    │ Receita  │ │
│  ├────────────────────┼──────────┼──────────┼────────┼────────┼──────────┤ │
│  │ Welcome Popup      │ Popup    │ [✅ Ativo]│ 12.4k  │ 3.2%   │ R$ 4.5k │ │
│  │ Drop 10 Banner     │ Banner   │ [⏸ Pausa]│ 8.1k   │ 1.8%   │ R$ 2.1k │ │
│  │ Social Proof Toast │ Social   │ [✅ Ativo]│ 45.2k  │ 0.9%   │ R$ 890  │ │
│  │ Exit Intent Coupon  │ Popup    │ [✅ Ativo]│ 6.3k   │ 5.1%   │ R$ 3.8k │ │
│  └────────────────────┴──────────┴──────────┴────────┴────────┴──────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Widget Builder (5-step wizard):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRM > On-Site > Novo Widget                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [1. Tipo ✓] ──► [2. Conteudo ●] ──► [3. Targeting] ──► [4. Trigger] ──► [5. Revisar] │
│                                                                             │
│  ┌────────────────────────────────┬────────────────────────────────────────┐│
│  │ EDITOR                        │ PREVIEW (cienalab.com.br)             ││
│  │                               │                                        ││
│  │ Titulo:                       │  ┌──────────────────────────────────┐  ││
│  │ [Cadastre-se e ganhe 10%   ]  │  │       cienalab.com.br            │  ││
│  │                               │  │                                  │  ││
│  │ Corpo:                        │  │   ┌──────────────────────────┐   │  ││
│  │ [Receba novidades e ofertas]  │  │   │ Cadastre-se e ganhe 10%  │   │  ││
│  │                               │  │   │                          │   │  ││
│  │ CTA:                          │  │   │ Receba novidades e       │   │  ││
│  │ [QUERO MEU CUPOM           ]  │  │   │ ofertas exclusivas.      │   │  ││
│  │                               │  │   │                          │   │  ││
│  │ Campos:                       │  │   │ [Email                 ] │   │  ││
│  │ [✅] Email  [✅] WhatsApp     │  │   │ [WhatsApp              ] │   │  ││
│  │                               │  │   │                          │   │  ││
│  │ Imagem:                       │  │   │ [☑ Aceito receber]       │   │  ││
│  │ [Fazer upload]                │  │   │                          │   │  ││
│  │                               │  │   │ [QUERO MEU CUPOM]        │   │  ││
│  │ Cores:                        │  │   └──────────────────────────┘   │  ││
│  │ Fundo: [#1A1A1A]             │  │                                  │  ││
│  │ Texto: [#FFFFFF]             │  │                                  │  ││
│  │ Botao: [#FF4500]             │  └──────────────────────────────────┘  ││
│  └────────────────────────────────┴────────────────────────────────────────┘│
│                                                                             │
│  [◄ Voltar]                                              [Proximo passo ►] │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 13.4 Business Rules (R36-R45)

| # | Rule | Detail |
|---|------|--------|
| R36 | **One popup visible at a time** | When multiple popups qualify, only the one with highest `priority` is shown. Banners and social proof can coexist. |
| R37 | **Frequency cap via localStorage** | Client-side localStorage tracks `ambaril_widget_{id}_seen` with timestamp. Server trusts client for frequency cap (performance). |
| R38 | **Exit intent mobile = scroll-up gesture** | Mobile has no mouse exit intent. Equivalent trigger: fast upward scroll gesture. Touch targets >= 44px for Ana Clara (mobile-first rule). |
| R39 | **Social proof: real data only** | Social proof widgets show real data from the last 24h rolling window. If count < 5 events, the widget is hidden (avoid "1 pessoa comprou" looking fake). |
| R40 | **Lead capture requires LGPD consent** | Every email/phone capture via widget MUST include LGPD checkbox. On submit, creates `crm.consents` row with `source='onsite_widget'`. |
| R41 | **Schedule auto-pause** | When `ends_at` passes, widget auto-transitions to `status='paused'`. Background job checks every 1 minute. |
| R42 | **Revenue attribution** | Last-interaction model with 7-day window. If a session interacted with a widget and the contact purchases within 7 days, revenue is attributed to that widget. |
| R43 | **Spin wheel: server-side results** | Spin wheel (popup variant) outcomes are determined server-side with configurable weights. Client receives the result after animation completes. Anti-fraud: one spin per email/phone. |
| R44 | **Public rate limiting** | Widget active endpoint: 60 req/min per IP. Widget events endpoint: 30 req/min per IP. Enforced via PostgreSQL-based sliding window rate limiting. |
| R45 | **A/B testing reserved for Phase 2+** | For now, priority resolves conflicts between widgets. A/B testing of widget variants is deferred. |

### 13.5 API Endpoints (12 new)

All endpoints follow [API.md](../../architecture/API.md) patterns. Module prefix: `/api/v1/crm`.

#### Internal (10)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/widgets` | Internal | List widgets (paginated, filterable by type/status) |
| POST | `/widgets` | Internal | Create widget |
| GET | `/widgets/:id` | Internal | Get widget detail + metrics |
| PATCH | `/widgets/:id` | Internal | Update widget |
| DELETE | `/widgets/:id` | Internal | Soft-delete widget |
| POST | `/widgets/:id/actions/activate` | Internal | Set status to active |
| POST | `/widgets/:id/actions/pause` | Internal | Set status to paused |
| POST | `/widgets/:id/actions/duplicate` | Internal | Clone widget with new name |
| GET | `/widgets/:id/metrics` | Internal | Get daily metrics for date range |
| GET | `/widget-templates` | Internal | List available templates |

#### Public (2)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/public/crm/widgets/active` | None | Get active widgets for current page context. Query: `?page=product&product_id=X&cart_value=15000`. Returns filtered, prioritized widget configs. Rate limit: 60/min. |
| POST | `/api/v1/public/crm/widgets/events` | None | Record widget events (batch). Body: `{ events: [{ widget_id, event_type, session_id, page_url, metadata? }] }`. Rate limit: 30/min. |

### 13.6 Background Jobs

| Job Name | Queue | Schedule | Priority | Description |
|----------|-------|----------|----------|-------------|
| `crm:widget-events-aggregate` | `crm` | Every 5 min | Medium | Aggregate widget_events → widget_metrics_daily + update denormalized counters on crm.widgets |
| `crm:widget-conversion-track` | `crm` | Trigger: `order.paid` | Medium | Check if session interacted with any widget in last 7 days; attribute revenue |
| `crm:widget-schedule-check` | `crm` | Every 1 min | Low | Auto-pause widgets where `ends_at <= NOW()` and `status = 'active'` |
| `crm:recommendations-dispatch` | `crm` | Weekly MON 10:00 BRT | Medium | Generate personalized product recommendations per segment, enqueue automation_runs for R1 |
| `crm:back-in-stock-notify` | `crm` | Trigger: `inventory.restocked` | High | Fire R5 automation for contacts on waitlist or who viewed product when out of stock |
| `crm:price-drop-notify` | `crm` | Trigger: `product.price_decreased` | High | Fire R4 automation for contacts who viewed/carted the product |

### 13.7 Permissions

| Permission | admin | pm | creative | operations | support |
|-----------|-------|-----|----------|-----------|---------|
| `crm:widgets:read` | Y | Y | Y (view metrics) | -- | -- |
| `crm:widgets:write` | Y | Y | -- | -- | -- |
| `crm:widgets:delete` | Y | -- | -- | -- | -- |

### 13.8 Notifications (Flare Events)

| Event Key | Trigger | Channels | Recipients | Priority |
|-----------|---------|----------|------------|----------|
| `widget.activated` | Widget goes live | In-app | `pm` role | Low |
| `widget.high_conversion` | Widget CTR > 10% in 24h | In-app | `admin`, `pm` | Medium |
| `widget.schedule_expired` | Widget auto-paused by schedule | In-app | `pm` role | Low |

### 13.9 Error Handling

| Error Code | HTTP | When | User-facing Message |
|-----------|------|------|-------------------|
| `CRM_WIDGET_NOT_FOUND` | 404 | Widget ID does not exist or is deleted | "Widget nao encontrado." |
| `CRM_WIDGET_ALREADY_ACTIVE` | 409 | Trying to activate an already-active widget | "Este widget ja esta ativo." |
| `CRM_WIDGET_INVALID_CONTENT` | 422 | Widget content JSONB is malformed | "Conteudo do widget invalido. Verifique os campos obrigatorios." |
| `CRM_WIDGET_INVALID_TARGETING` | 422 | Targeting rules JSONB is malformed | "Regras de segmentacao invalidas." |
| `CRM_WIDGET_RATE_LIMIT` | 429 | Public endpoint rate limit exceeded | "Muitas requisicoes. Tente novamente em instantes." |
| `CRM_WIDGET_TEMPLATE_NOT_FOUND` | 404 | Template ID not found | "Template nao encontrado." |

### 13.10 Testing Checklist

**Unit Tests:**
- [ ] Widget targeting rules evaluation (page match, device match, visitor type, cart value threshold)
- [ ] Frequency cap logic (once_per_session, once_per_day, once_per_lifetime)
- [ ] Priority sorting (highest priority first, tie-breaking by created_at)
- [ ] Revenue attribution within 7-day window
- [ ] Social proof count threshold (hide if < 5)

**Integration Tests:**
- [ ] Create widget via API, verify database state
- [ ] Activate widget, verify it appears in public endpoint
- [ ] Record events via public endpoint, verify aggregation in metrics_daily
- [ ] Widget schedule: set ends_at in past, verify auto-pause
- [ ] Lead capture: submit email via widget, verify crm.consents row created with source='onsite_widget'
- [ ] Revenue attribution: interact with widget, place order within 7 days, verify revenue attributed

**E2E Tests:**
- [ ] Widget builder 5-step flow: type → content → targeting → trigger → review → activate
- [ ] Widget list: verify metrics display (views, CTR, revenue)
- [ ] Public widget rendering on mock storefront page
- [ ] Exit intent trigger fires on desktop (mouse leave) and mobile (scroll-up)

---

## 14. Server-Side Analytics Integrations

> **Phase:** 1A (Meta CAPI), 1B (GA4 MP + Enhanced Conversions), 2 (Server-Side GTM)

### 14.1 Architecture Overview

```
[Browser] → [Next.js on Vercel] → [API Route /api/v1/events]
                                         │
                          ┌──────────────┼──────────────┐
                          ▼              ▼              ▼
                    [Meta CAPI]   [GA4 MP API]   [Ambaril DB]
```

- Consent verified server-side BEFORE forwarding to any third-party
- PII hashing (SHA-256) happens on the server — never sent in clear text
- No third-party scripts loaded without explicit LGPD consent

### 14.2 Meta Conversions API (CAPI)

| Property | Value |
|----------|-------|
| **Purpose** | Server-to-server conversion tracking for Meta Ads optimization |
| **Integration pattern** | `packages/integrations/meta-capi/client.ts` |
| **Auth** | System User Access Token (permanent, stored in env) |
| **API version** | v21.0 (March 2026) |
| **Rate limits** | 2,000 events/second per pixel |
| **Retry** | Exponential backoff (1s, 2s, 4s), max 3 retries |

**Events sent to Meta CAPI:**

| Event | Trigger | Hashed Data Sent | Phase |
|-------|---------|-----------------|-------|
| `PageView` | Checkout page loaded | ip, user_agent, fbp, fbc | 1A |
| `AddToCart` | Item added to cart | + item data (content_id, price) | 1A |
| `InitiateCheckout` | Checkout started (CPF entered) | + hashed email, phone | 1A |
| `Purchase` | Order confirmed (order.paid) | + hashed email, phone, order_value, currency=BRL | 1A |
| `Lead` | Creator application submitted | + hashed email, phone | 1A |

**Deduplication:** Each event includes `event_id = {session_id}_{event_type}_{timestamp_ms}` to prevent double-counting with browser pixel events.

**Consent gate:** Events are ONLY sent if `crm.contacts.consent_tracking = TRUE` or if the visitor accepted tracking cookies. Server checks consent status before forwarding.

### 14.3 GA4 Measurement Protocol

| Property | Value |
|----------|-------|
| **Purpose** | Server-side event tracking for Google Analytics 4 |
| **Integration pattern** | `packages/integrations/ga4/client.ts` |
| **Auth** | API Secret + Measurement ID (stored in env) |
| **Endpoint** | `POST https://www.google-analytics.com/mp/collect` |
| **Rate limits** | 25 events per request batch |
| **Retry** | Exponential backoff, max 2 retries |

**Events sent to GA4:**

| Event | Trigger | Parameters | Phase |
|-------|---------|-----------|-------|
| `purchase` | order.paid | transaction_id, value, currency, items[], coupon | 1B |
| `begin_checkout` | Checkout started | value, currency, items[] | 1B |
| `add_to_cart` | Item added | value, currency, items[] | 1B |
| `sign_up` | Creator application | method='creator_form' | 1B |

### 14.4 GA4 Enhanced Conversions

Hashed first-party data sent with purchase events for improved cross-device matching:
- `sha256(email)` — from checkout identification step
- `sha256(phone)` — E.164 format before hashing
- `sha256(address.street + address.city + address.state + address.zip)` — normalized

Enabled per-event when contact has `consent_tracking = TRUE`.

### 14.5 Server-Side GTM (Phase 2)

| Property | Value |
|----------|-------|
| **Purpose** | Proxy all tracking through first-party domain, bypassing ad blockers |
| **Setup** | Google Tag Manager Server Container on Cloud Run (~$100-200/mês) |
| **Domain** | `metrics.{tenant_domain}` (e.g., `metrics.cienalab.com.br`) |
| **Benefit** | +40-50% data recovery vs client-side only |

**Flow:** Browser → `metrics.cienalab.com.br` (first-party) → GTM Server → Meta CAPI + GA4 + Ambaril DB

**Phase 2 because:** Requires additional infrastructure (Cloud Run container), DNS configuration per tenant. Not critical for MVP but significantly improves data quality.

---

## 15. Ambaril Identity Graph

> **Phase:** 1A (core graph + Ambaril Tracker MVP), 1B (progressive profiling + Tracker v2), 2 (Web Pixel + signal fusion + cross-device stitching)
> **Technical subsystem:** See [section 15A](#15a-ambaril-tracker--passive-visitor-identification) for the Ambaril Tracker — passive visitor identification pipeline, data model, APIs, and background jobs.

### 15.1 Purpose

First-party identity resolution that is LGPD-compliant. No US-based de-anonymization tools (RB2B, Leadpipe, Capturify) — these have ~5-15% match rate for BR traffic and are likely illegal under LGPD.

The Identity Graph combines **deterministic signals** (CPF, email, phone) with **passive/probabilistic signals** (cookies, fingerprints, ad platform IDs) captured by the Ambaril Tracker (section 15A) to build a unified customer profile. The Tracker handles anonymous visitor identification; this section describes the overall identity model and resolution strategy.

### 15.2 Identity Graph Structure

Each contact in `crm.contacts` has multiple identity signals stitched together. Passive identifiers from the Ambaril Tracker (section 15A) are stored in `identity.passive_identifiers` and linked to contacts upon identification.

| Signal | Source | Match Priority | Confidence | Storage |
|--------|--------|---------------|------------|---------|
| **CPF** | Checkout / PIX payment | 1 (strongest — unique per person) | 0.99 | `crm.contacts.cpf` |
| **Email (verified)** | Checkout, popup, quiz, creator form | 2 | 0.95 | `crm.contacts.email` |
| **Liquid {{ customer }}** | Shopify logged-in user (Ambaril Tracker) | 2 | 1.00 (deterministic) | `identity.passive_identifiers` |
| **Link injection (_cid)** | Email/WA links sent by Ambaril | 2 | 0.95 | `identity.passive_identifiers` |
| **Phone** | Checkout, WhatsApp opt-in | 3 | 0.90 | `crm.contacts.phone` |
| **_amb_vid cookie** | Ambaril Tracker (server-set, 2yr) | 4 | 0.85 | `identity.passive_identifiers` |
| **IG Handle** | Creator form, UGC detection | 5 | 0.80 | `crm.contacts` metadata |
| **_fbp cookie** | Meta Pixel / Ambaril Tracker | 6 | 0.40 | `identity.passive_identifiers` |
| **_ga cookie** | Google Analytics / Ambaril Tracker | 6 | 0.35 | `identity.passive_identifiers` |
| **shopify_client_id** | Shopify Web Pixel | 7 | 0.30 | `identity.passive_identifiers` |
| **Browser fingerprint** | Ambaril Tracker (ThumbmarkJS) | 8 | 0.20 | `identity.passive_identifiers` |
| **ETag** | Ambaril Tracker (HTTP cache trick) | 9 (weakest) | 0.15 | `identity.passive_identifiers` |

**Stitching logic:** When a new signal arrives (e.g., email from popup), the system checks all existing contacts for a match on any higher-priority signal. If match found → merge. If no match → create new contact. Passive signals (priority 4+) are resolved by the Ambaril Tracker's identity resolution pipeline (section 15A) and linked to contacts via `identity.visitors.contact_id`.

### 15.3 Visitor Reengagement Strategy

| Visitor Type | Detection | Action |
|-------------|-----------|--------|
| **Returning customer** (identified by Tracker) | `identity.visitors.contact_id IS NOT NULL` → lookup contact | Reengagement via WA/email (channels with consent). Browsing history available via `identity.page_views` |
| **Anonymous returning** (has `_amb_vid`) | `identity.visitors` exists but `contact_id IS NULL` | Meta CAPI retargeting (Meta does the match via hashed signals). On-site widget targeting (section 13) |
| **Captured lead** (email from popup/quiz) | Email matches contact without purchase | Nurture automation sequence (CRM). Ambaril Tracker retroactively links all anonymous page views to this contact |
| **Creator follower** (UTM from creator link) | UTM `source=creator` | Track attribution, offer creator discount at checkout |

### 15.4 Progressive Profiling

Collect data incrementally in exchange for value:

| Trigger | Data Collected | Value Offered |
|---------|---------------|---------------|
| First visit popup | Email | 10% first purchase coupon |
| Post-purchase | Phone (WhatsApp opt-in) | Order tracking via WA |
| Quiz (size recommendation) | Height, weight, style preference | Personalized size recommendation |
| Creator application | Full profile (name, CPF, IG, bio) | Access to creator program |
| VIP invitation | Birthday, preferences | VIP early access to drops |

---

## 15A. Ambaril Tracker — Passive Visitor Identification

> **Subsystem name:** Ambaril Tracker
> **Schema:** `identity`
> **Phase:** 1A (MVP), 1B (v2), 2 (Web Pixel + fusion)
> **Depends on:** CRM module (crm.contacts), Shopify Theme App Extension
> **References:** [section 15](#15-ambaril-identity-graph), [BRAZIL-IDENTITY-RESOLUTION.md](../../research/BRAZIL-IDENTITY-RESOLUTION.md)

Script not-sandboxed injected into the Shopify storefront via Theme App Extension (App Embed Block) that tracks ALL visitors, stores behavioral data, and performs passive matching against the customer base.

**Projected identification rate:** 17-30% of anonymous visitors passively identified (based on Edrone benchmarks for similar e-commerce scale).

### 15A.1 Data Model — 4 new tables in schema `identity`

#### New Enums

```sql
CREATE TYPE identity.identification_method AS ENUM (
    'cookie_match', 'fbp_match', 'ga_match', 'fingerprint_match',
    'liquid_customer', 'link_injection', 'checkout', 'form_capture',
    'shopify_client_id', 'etag_match', 'signal_fusion'
);

CREATE TYPE identity.page_type AS ENUM (
    'home', 'product', 'collection', 'cart', 'checkout',
    'search', 'account', 'blog', 'other'
);
```

#### identity.visitors (~100k+/month)

```sql
CREATE TABLE identity.visitors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES global.tenants(id),
    amb_vid         VARCHAR(64) NOT NULL,
    fingerprint_hash VARCHAR(64),
    first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_sessions  INTEGER NOT NULL DEFAULT 0,
    total_page_views INTEGER NOT NULL DEFAULT 0,
    contact_id      UUID REFERENCES crm.contacts(id),
    identified_at   TIMESTAMPTZ,
    identification_method identity.identification_method,
    device_type     VARCHAR(20),   -- desktop, mobile, tablet
    browser         VARCHAR(50),
    os              VARCHAR(50),
    city            VARCHAR(100),  -- from IP geolocation
    state           VARCHAR(2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    UNIQUE(tenant_id, amb_vid)
);

CREATE INDEX idx_visitors_tenant_contact ON identity.visitors(tenant_id, contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_visitors_tenant_last_seen ON identity.visitors(tenant_id, last_seen_at DESC);
CREATE INDEX idx_visitors_unidentified ON identity.visitors(tenant_id, last_seen_at DESC) WHERE contact_id IS NULL;
```

#### identity.passive_identifiers (~500k+)

```sql
CREATE TABLE identity.passive_identifiers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES global.tenants(id),
    visitor_id      UUID NOT NULL REFERENCES identity.visitors(id),
    contact_id      UUID REFERENCES crm.contacts(id),
    identifier_type VARCHAR(30) NOT NULL, -- 'amb_vid', 'fbp', 'ga', 'fingerprint', 'shopify_client_id', 'etag'
    identifier_value VARCHAR(255) NOT NULL,
    confidence      NUMERIC(3,2) NOT NULL DEFAULT 0.50,
    first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, identifier_type, identifier_value)
);

CREATE INDEX idx_passive_ids_visitor ON identity.passive_identifiers(visitor_id);
CREATE INDEX idx_passive_ids_contact ON identity.passive_identifiers(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_passive_ids_lookup ON identity.passive_identifiers(tenant_id, identifier_type, identifier_value);
```

**Confidence by signal type:**

| Signal | Base Confidence | Decay Half-Life |
|--------|----------------|-----------------|
| CPF (purchase) | 0.99 | ~3 years |
| Email (verified) | 0.95 | ~3 years |
| Liquid {{ customer }} | 1.00 | Session (deterministic) |
| Link injection (_cid) | 0.95 | ~1 year |
| Phone (WhatsApp) | 0.90 | ~1.4 years |
| _amb_vid cookie match | 0.85 | ~1 year |
| _fbp cookie match | 0.40 | ~50 days |
| _ga cookie match | 0.35 | ~50 days |
| shopify_client_id | 0.30 | ~50 days |
| Fingerprint match | 0.20 | ~25 days |
| ETag match | 0.15 | ~25 days |

#### identity.page_views (~500k+/month, partitioned by month)

```sql
CREATE TABLE identity.page_views (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES global.tenants(id),
    visitor_id      UUID NOT NULL REFERENCES identity.visitors(id),
    session_id      VARCHAR(64) NOT NULL,
    page_url        TEXT NOT NULL,
    page_type       identity.page_type,
    product_id      VARCHAR(100),  -- Shopify product ID if page_type = 'product'
    referrer        TEXT,
    duration_seconds INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_page_views_visitor ON identity.page_views(visitor_id, created_at DESC);
CREATE INDEX idx_page_views_session ON identity.page_views(session_id);
CREATE INDEX idx_page_views_product ON identity.page_views(tenant_id, product_id, created_at DESC) WHERE product_id IS NOT NULL;
```

#### identity.visitor_sessions (~50k+/month)

```sql
CREATE TABLE identity.visitor_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES global.tenants(id),
    visitor_id      UUID NOT NULL REFERENCES identity.visitors(id),
    session_id      VARCHAR(64) NOT NULL,
    started_at      TIMESTAMPTZ NOT NULL,
    ended_at        TIMESTAMPTZ,
    page_view_count INTEGER NOT NULL DEFAULT 0,
    cart_value_cents BIGINT,
    utm_source      VARCHAR(100),
    utm_medium      VARCHAR(100),
    utm_campaign    VARCHAR(255),
    device_type     VARCHAR(20),
    landing_page    TEXT,
    exit_page       TEXT,
    converted       BOOLEAN NOT NULL DEFAULT FALSE,
    order_id        UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, session_id)
);

CREATE INDEX idx_sessions_visitor ON identity.visitor_sessions(visitor_id, started_at DESC);
CREATE INDEX idx_sessions_tenant_date ON identity.visitor_sessions(tenant_id, started_at DESC);
```

### 15A.2 Shopify Integration Architecture

```
VISITOR → Shopify Storefront
    │
    ├── [Theme App Extension — App Embed Block] (not-sandboxed)
    │   ├── Reads {{ customer }} via Liquid (if logged in → conf 1.0)
    │   ├── Reads _fbp, _ga, _amb_vid via document.cookie
    │   ├── Generates fingerprint (ThumbmarkJS, MIT license, ~97% accuracy)
    │   ├── Tracks: URL, product, time on page, scroll depth
    │   ├── Respawn: if _amb_vid cookie cleared → restore from localStorage/IndexedDB
    │   └── POST /api/v1/public/identity/trace (batch, debounced 3s)
    │
    ├── [Shopify Web Pixel — App Pixel] (sandboxed, Phase 2)
    │   ├── Receives: checkout_started, checkout_completed (email, phone, order)
    │   ├── Uses browser.cookie.get('_amb_vid') to correlate
    │   ├── Required: ScriptTag blocked in checkout (Aug 2026)
    │   └── POST /api/v1/public/identity/checkout-event
    │
    └── [Shopify Admin API — Server-side]
        ├── Sync: customers (email, phone, orders)
        ├── Webhooks: orders/create (coupon → attribution)
        └── Protected Customer Data scopes: read_customer_email, read_customer_phone
```

### 15A.3 Identity Resolution Pipeline

```
NEW SIGNAL ARRIVES (page view with cookies/fingerprint)
    │
    ├─ 1. Lookup _amb_vid in identity.visitors
    │     ├── Found → visitor exists, UPDATE last_seen_at
    │     └── Not found → CREATE visitor + generate _amb_vid
    │
    ├─ 2. Passive matching (no user action required)
    │     ├── _amb_vid → identity.passive_identifiers → contact_id? → IDENTIFIED
    │     ├── _fbp → identity.passive_identifiers → contact_id? → IDENTIFIED
    │     ├── _ga → identity.passive_identifiers → contact_id? → IDENTIFIED
    │     ├── fingerprint → identity.passive_identifiers → contact_id? → IDENTIFIED
    │     ├── Liquid {{ customer.email }} → crm.contacts → IDENTIFIED (conf 1.0)
    │     └── No match → stays anonymous
    │
    ├─ 3. Retroactive attribution (when identification occurs)
    │     └── UPDATE identity.visitors SET contact_id = X
    │         WHERE amb_vid = 'abc' AND contact_id IS NULL
    │         → All previous page_views now linked to the customer
    │
    └─ 4. Signal fusion (combine multiple weak signals)
          └── If fingerprint(0.20) + _ga(0.35) + IP similar(0.10) > 0.65
              → consider as same visitor (merge visitors)
```

### 15A.4 Identity Injection in Links (Tier S)

All links in emails and WhatsApp messages sent by Ambaril include encrypted `_cid`:

```
https://cienalab.com.br/products/camiseta-x?_cid=enc(contact_id)
```

When the visitor clicks:
1. Next.js middleware detects `_cid` in URL
2. Decrypts → `contact_id`
3. Sets `_amb_vid` cookie (server-set, 2 years)
4. Creates `identity.passive_identifiers` record with type `'link_injection'`, confidence 0.95
5. Visitor passively identified on all future navigation

**Important:** `_cid` is encrypted with AES-256-GCM, not just encoded. Includes expiry of 90 days.

### 15A.5 Business Rules (R-ID.1 to R-ID.12)

| # | Rule | Detail |
|---|------|--------|
| R-ID.1 | **Server-set cookie** | `_amb_vid` is set via `Set-Cookie` HTTP header (not JS), bypassing Safari ITP 7-day limit → lasts 2 years |
| R-ID.2 | **Multi-layer persistence** | Visitor ID stored in 4 layers: cookie, localStorage, IndexedDB, Service Worker cache. If any layer is cleared, respawn from the others |
| R-ID.3 | **Retroactive attribution** | When a visitor is identified, ALL anonymous history (page views, sessions) is retroactively attributed to the contact |
| R-ID.4 | **Signal merge threshold** | For merge of anonymous visitors based on combined signals, minimum threshold: 0.65 combined confidence |
| R-ID.5 | **Confidence decay** | Confidence decays over time. Recently verified cookies/fingerprints > old signals. Formula: `conf_effective = conf_base * 2^(-days_since_seen / half_life)` |
| R-ID.6 | **One contact per CPF** | CPF remains the definitive dedup key. Identity graph does NOT create duplicates — merges when CPF confirms |
| R-ID.7 | **Consent tracking gate** | Page views are stored ALWAYS (server-side data, no consent required). Fingerprinting + cookie matching require `consent_tracking = TRUE` |
| R-ID.8 | **Rate limiting** | Trace endpoint: 120 req/min per IP. Checkout event: 30 req/min per IP |
| R-ID.9 | **Data retention** | page_views: 90 days (partitioned, auto-drop). visitor_sessions: 1 year. visitors: indefinite (but anonymized on LGPD erasure) |
| R-ID.10 | **Link injection opt-out** | If contact revokes `consent_tracking`, future links do NOT include `_cid` |
| R-ID.11 | **Shopify customer auto-identification** | If `{{ customer }}` is available via Liquid (customer logged into Shopify), identification is deterministic (conf 1.0) — independent of cookies/consent |
| R-ID.12 | **Fingerprint renewal** | Fingerprint is recalculated on every visit and compared with stored hash. If diff > threshold (browser update, etc.), creates new `passive_identifier` maintaining link to visitor |

### 15A.6 API Endpoints

#### Public (3 new — no auth, tenant resolved by domain)

| Method | Path | Description | Rate Limit |
|--------|------|-------------|-----------|
| POST | `/api/v1/public/identity/trace` | Batch page views + signals from Tracker | 120/min/IP |
| POST | `/api/v1/public/identity/checkout-event` | Checkout event from Web Pixel | 30/min/IP |
| GET | `/api/v1/public/identity/config` | Tracker config (version, features enabled) | 10/min/IP |

#### Internal (4 new — requires auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/identity/visitors` | List visitors (paginated, filterable) |
| GET | `/api/v1/identity/visitors/:id` | Visitor detail + page views + sessions |
| GET | `/api/v1/identity/contacts/:contactId/browsing` | Browsing history of an identified contact |
| GET | `/api/v1/identity/analytics/overview` | Metrics: visitors/day, identification rate, top pages |

### 15A.7 Background Jobs

All jobs run via PostgreSQL job queue (`FOR UPDATE SKIP LOCKED`) + Vercel Cron.

| Job | Schedule | Priority | Description |
|-----|----------|----------|-------------|
| `identity:passive-match` | Every 5 min (poll) | High | Attempts passive matching for recently unidentified visitors (last 5 min) |
| `identity:page-views-partition` | Monthly 1st 02:00 BRT | Low | Creates new monthly partition, drops partitions > 90 days |
| `identity:confidence-decay` | Daily 04:00 BRT | Low | Recalculates confidence scores based on decay formula |
| `identity:visitor-merge` | Daily 04:30 BRT | Medium | Detects and merges visitors that are likely the same person (multi-signal fusion) |

### 15A.8 Theme App Extension — JavaScript Bundle

File: `packages/shopify-tracker/src/tracker.ts` (~15KB gzipped)

**Responsibilities:**
1. Read `{{ customer }}` from Liquid (injected as data attribute by the Liquid block)
2. Read/set `_amb_vid` cookie (fallback: localStorage, IndexedDB)
3. Generate fingerprint via ThumbmarkJS
4. Track page views with debounce (3s)
5. Detect viewed products (parse URL `/products/{handle}`)
6. Send batch of events to `/api/v1/public/identity/trace`
7. Respawn identifiers if any storage layer was cleared

**Does NOT:**
- Render UI (that is the On-Site Widget Engine, section 13)
- Intercept forms (the Widget Engine does that)
- Access checkout (the Web Pixel does that)

### 15A.9 Permissions

| Permission | admin | pm | creative | operations | support |
|-----------|-------|-----|----------|-----------|---------|
| `identity:visitors:read` | Y | Y | -- | -- | -- |
| `identity:analytics:read` | Y | Y | -- | -- | -- |

### 15A.10 Testing Checklist

**Unit:**
- [ ] `_amb_vid` cookie set/get/respawn
- [ ] Fingerprint matching (exact + fuzzy)
- [ ] Confidence decay calculation
- [ ] Signal merge threshold evaluation
- [ ] Identity injection encrypt/decrypt
- [ ] Retroactive attribution (visitor → contact merge)

**Integration:**
- [ ] Trace endpoint: send batch, verify page_views created
- [ ] Cookie matching: create known identifier, send matching cookie, verify identification
- [ ] Liquid customer: send customer data, verify immediate identification
- [ ] Link injection: click link with `_cid`, verify cookie set + identification
- [ ] Shopify Web Pixel event: `checkout_completed`, verify contact created/updated

**E2E:**
- [ ] Full flow: anonymous visit → browse products → identify via popup email → verify retroactive attribution
- [ ] Full flow: anonymous visit → click email link with `_cid` → browse → verify identified
- [ ] Full flow: logged-in Shopify customer → visit → verify immediate identification via Liquid

**Performance:**
- [ ] Trace endpoint: 1000 concurrent requests, p99 < 100ms
- [ ] page_views query for 1M+ rows (with partition): < 200ms
- [ ] Passive matching job: 10k new visitors, < 30 seconds

---

## 16. Jornada dos 100 Dias — Automation Template

> **Phase:** 1B (pre-built template, activatable per tenant with 1 click)
> **Based on:** Framework de Antonio Carlos Nogueira, adapted for fashion/streetwear

### 16.1 Overview

Pre-configured omnichannel customer journey from first purchase to brand advocate. 6 marcos (milestones), ~20 touchpoints across WhatsApp, email, and retargeting.

**Activation:** Tenant activates with 1 click in CRM > Automations > Templates > "Jornada 100 Dias". Each step is customizable (message content, timing, channel). Metrics tracked per step.

### 16.2 Journey Steps

**MARCO 1 — COMPRA REALIZADA** (Dia 0)

| # | Canal | Trigger | Delay | Mensagem | Automation ID |
|---|-------|---------|-------|----------|---------------|
| 1.1 | Email | `order.confirmed` | Imediato | Confirmação do pedido + detalhes + rastreamento + cupom próxima compra | `j100_m1_email_confirmation` |
| 1.2 | WhatsApp | `order.confirmed` | Imediato | Agradecimento personalizado + link suporte | `j100_m1_wa_thanks` |

**MARCO 2 — PEDIDO A CAMINHO** (Dia 3-7)

| # | Canal | Trigger | Delay | Mensagem | Automation ID |
|---|-------|---------|-------|----------|---------------|
| 2.1 | Email | `order.shipped` | Imediato | Tracking + dicas de uso/styling | `j100_m2_email_shipped` |
| 2.2 | WhatsApp | `order.shipped` | Imediato | "Seu pedido está a caminho!" + link tracking | `j100_m2_wa_shipped` |
| 2.3 | Email | `order.shipped` | +2 dias | Conteúdo educativo: como usar/combinar o produto | `j100_m2_email_styling` |

**MARCO 3 — ENTREGA E PRIMEIRA EXPERIÊNCIA** (Dia 8-15)

| # | Canal | Trigger | Delay | Mensagem | Automation ID |
|---|-------|---------|-------|----------|---------------|
| 3.1 | WhatsApp | `order.delivered` | Imediato | "Recebeu? Precisa de ajuda?" | `j100_m3_wa_delivered` |
| 3.2 | Email | `order.delivered` | +3 dias | Review request (link para E11 Reviews) | `j100_m3_email_review` |
| 3.3 | Email | `order.delivered` | +5 dias | Cross-sell: produtos complementares com desconto | `j100_m3_email_crosssell` |

**MARCO 4 — ENGAJAMENTO** (Dia 16-30)

| # | Canal | Trigger | Delay | Mensagem | Automation ID |
|---|-------|---------|-------|----------|---------------|
| 4.1 | Email | `order.delivered` | +16 dias | Storytelling: história da marca + bastidores | `j100_m4_email_story` |
| 4.2 | WhatsApp | `order.delivered` | +20 dias | "Como foi sua experiência?" (feedback survey) | `j100_m4_wa_feedback` |
| 4.3 | Email | `order.delivered` | +25 dias | Convite programa de indicação (referral) | `j100_m4_email_referral` |

**MARCO 5 — INCENTIVO À RECOMPRA** (Dia 31-60)

| # | Canal | Trigger | Delay | Mensagem | Automation ID |
|---|-------|---------|-------|----------|---------------|
| 5.1 | Email | `purchase_date` | +31 dias | Cupom exclusivo recompra + recomendações personalizadas | `j100_m5_email_repurchase` |
| 5.2 | WhatsApp | `purchase_date` | +35 dias | "Desconto especial para sua próxima compra" | `j100_m5_wa_discount` |
| 5.3 | Email | `purchase_date` | +45 dias | Pesquisa NPS | `j100_m5_email_nps` |
| 5.4 | Email | `purchase_date` | +55 dias | Novos produtos/categorias + conteúdo aprofundado | `j100_m5_email_newproducts` |

**MARCO 6 — TRANSFORMAÇÃO EM FÃS** (Dia 61-100)

| # | Canal | Trigger | Delay | Mensagem | Automation ID |
|---|-------|---------|-------|----------|---------------|
| 6.1 | Email | `purchase_date` | +61 dias | Convite grupo VIP WhatsApp / comunidade exclusiva | `j100_m6_email_vip` |
| 6.2 | WhatsApp | `purchase_date` | +65 dias | "Quer fazer parte da comunidade exclusiva?" | `j100_m6_wa_community` |
| 6.3 | Email | `purchase_date` | +75 dias | UGC incentive: "Poste com #{brand}lab e ganhe destaque + desconto" | `j100_m6_email_ugc` |
| 6.4 | Email | `purchase_date` | +85 dias | Convite para ser Creator (se perfil qualifica) | `j100_m6_email_creator` |
| 6.5 | WhatsApp | `purchase_date` | +95 dias | Pesquisa + presente especial (desconto aniversário) | `j100_m6_wa_gift` |

### 16.3 Implementation

- Each step is a `crm.automations` row with `trigger_type='custom'` and delay in `trigger_config`
- Template activation creates all 20 automations with `status=draft`
- Tenant reviews and activates each step (or all at once)
- A/B test support: each step can have 2 message variants
- Metrics per step: `sent`, `delivered`, `opened`, `clicked`, `converted` (tracked via `automation_runs`)
- Stop condition: if contact purchases again, Marco 5-6 steps are skipped and journey restarts from Marco 1

### 16.4 Business Rules

| # | Rule | Detail |
|---|------|--------|
| R-J100.1 | **One active journey per contact** | A contact can only be in one Jornada 100 Dias instance at a time. New purchase restarts the journey. |
| R-J100.2 | **Consent required per channel** | Each step checks `consent_whatsapp` or `consent_email` before sending. Steps for non-consented channels are skipped (not failed). |
| R-J100.3 | **Step cancellation on recompra** | If a contact places a new order during Marcos 5-6, remaining steps are cancelled and a new journey starts from Marco 1. |
| R-J100.4 | **Retargeting steps** | Marcos 1, 4, and 5 include retargeting segments. Steps 1.3, 4.4, and 5.5 create/update Meta Custom Audiences via CAPI for retargeting campaigns. These are segment-based (not individual sends). |
| R-J100.5 | **Template customization** | All message content is editable per tenant. Default messages use {brand} placeholder (replaced with tenant brand name). PM/admin customizes before activation. |

---

## 17. Future Evolutions (Roadmap)

> Not part of v1. Planned for future phases.

| # | Evolution | Description | Dependencies |
|---|----------|-------------|-------------|
| R1 | Predictive Churn | ML model predicting which customers will churn based on RFM trajectory, engagement patterns, and purchase intervals. | 6+ months data, Astro |
| R2 | Next-Purchase Prediction | Predict when and what a customer will buy next. Powers proactive outreach. | 6+ months data, Astro |
| R3 | Zero-Party Data Engine | Structured collection of explicit customer preferences (style, size, budget, occasions) via quizzes, surveys, and progressive profiling. Feeds all personalization. | CRM 1B+ |
| R4 | Customer Health Score | Composite score (0-100) combining RFM, engagement, NPS, support tickets, and return rate. Single metric for relationship health. | CRM 1B, Trocas, Inbox |
| R5 | Revenue Forecasting | Monthly revenue prediction based on customer base composition, seasonal patterns, and planned campaigns. | 12+ months data, Astro |
| R6 | Dynamic Segments | Segments that auto-update in real-time as contact data changes (vs. current batch recalculation). | CRM 2 |
| R7 | Win-Back Inteligente | AI-powered reactivation campaigns with personalized offers based on customer's purchase history, preferred categories, and optimal discount level. | Astro, CRM 2 |

---

---

## Princípios de UX

> Referência: `DS.md` seções 4 (ICP & Filosofia), 6 (Formulários), 7 (Dashboards), 8 (Charts)

### Personalização por Role
- **Dashboard CRM por role (DS.md 7, regra 5):** Caio (pm) vê analytics + performance de campanhas + segmentos. Slimgust (support) vê tickets + últimas interações + automações de suporte.
- **Conduza para ação (DS.md 7, regra 6):** só exibir métricas acionáveis pelo role. Support não precisa ver ROAS. PM não precisa ver tempo de resposta de ticket.

### Dados Enquadrados
- **Contextualização (DS.md 8):** LTV com enquadramento: "R$ 2.400 — Top 10% dos clientes". Churn rate com delta: "3.2% (+0.5% vs mês passado)". RFM score com significado: "Score 5 — cliente ideal, comprando frequentemente".
- **Números em DM Mono, deltas em cor semântica:** `--success` para melhoria, `--danger` para deterioração.

### Progressive Disclosure em Filtros
- **Filtros básicos visíveis (DS.md 6.5):** segmento, status, período. Sempre visíveis no topo da lista.
- **Filtros avançados em expand:** RFM score range, canal de aquisição, tags custom, valor de LTV range — expandíveis sob "Mais filtros".
- **Evite digitação (DS.md 6.2):** filtros por seleção (dropdown, chips, toggles), não por texto livre.

### Empty States
- **Lista de contatos (DS.md 11.3):** "Nenhum cliente cadastrado. Conecte o checkout para importar automaticamente."
- **Segmentos (DS.md 11.3):** "Nenhum segmento criado. Segmentos RFM são gerados automaticamente após as primeiras vendas."
- **Automações (DS.md 11.3):** "Nenhuma automação ativa. Comece com 'Boas-vindas' — ativa em 2 cliques."
- **Módulo não ativado (DS.md 11.4):** "CRM disponível. Unifique sua base de clientes em um lugar." + preview + CTA "Ativar".

*This module spec is the source of truth for CRM implementation. All development, review, and QA should reference this document. Changes require review from Marcus (admin) or Caio (pm).*
