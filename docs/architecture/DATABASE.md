# Ambaril — Database Schema

> **Version:** 1.0
> **Date:** March 2026
> **Engine:** PostgreSQL 16+ (hosted on Neon)
> **ORM:** Drizzle ORM
> **References:** [GLOSSARY.md](../dev/GLOSSARY.md), [STACK.md](./STACK.md)

---

## 1. Design Principles

| Principle        | Rule                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Naming**       | All table and column names in `snake_case`, English. See GLOSSARY.md for PT-BR mapping                             |
| **Primary Keys** | UUID v7 (`gen_random_uuid()` or app-generated). Sortable by creation time                                          |
| **Soft Delete**  | `deleted_at TIMESTAMPTZ NULL` on entities that support deletion                                                    |
| **Timestamps**   | `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` and `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` on every table |
| **Timezone**     | All timestamps stored in UTC. Converted to BRT (`America/Sao_Paulo`) in the frontend only                          |
| **Foreign Keys** | `{entity}_id` format (e.g., `contact_id`, `order_id`). Always indexed                                              |
| **Enums**        | PostgreSQL native `CREATE TYPE ... AS ENUM (...)` for all status and category fields                               |
| **JSONB**        | Used for flexible metadata: audit diffs, config objects, address structures, extra fields                          |
| **Indexes**      | On all foreign keys, frequently filtered columns, and search columns. Detailed in section 5                        |
| **Namespacing**  | PostgreSQL schemas per module. No table prefixes                                                                   |
| **Money**        | `NUMERIC(12,2)` for all monetary values (BRL). Never use `FLOAT` or `REAL`                                         |
| **Percentages**  | `NUMERIC(5,2)` for rates and percentages (e.g., `12.50` = 12.5%)                                                   |
| **Scores**       | `INTEGER` for 0-100 scores, `NUMERIC(3,2)` for 1-5 ratings                                                         |
| **Arrays**       | PostgreSQL native `TEXT[]` for simple tag lists. JSONB for complex arrays                                          |

---

## 2. Schemas

PostgreSQL schemas namespace each module. Created via migration:

```sql
CREATE SCHEMA IF NOT EXISTS global;
CREATE SCHEMA IF NOT EXISTS checkout;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS erp;
CREATE SCHEMA IF NOT EXISTS pcp;
CREATE SCHEMA IF NOT EXISTS whatsapp;
CREATE SCHEMA IF NOT EXISTS trocas;
CREATE SCHEMA IF NOT EXISTS inbox;
CREATE SCHEMA IF NOT EXISTS b2b;
CREATE SCHEMA IF NOT EXISTS creators;
CREATE SCHEMA IF NOT EXISTS marketing;
CREATE SCHEMA IF NOT EXISTS tarefas;
CREATE SCHEMA IF NOT EXISTS clawdbot;
CREATE SCHEMA IF NOT EXISTS dashboard;
CREATE SCHEMA IF NOT EXISTS dam;
CREATE SCHEMA IF NOT EXISTS reviews;
```

| Schema      | Module             | Tables                                                                                                                                                                                                                              |
| ----------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `global`    | Platform           | users, roles, permissions, audit_logs, notifications, search_index                                                                                                                                                                  |
| `checkout`  | Checkout           | carts, cart_items, orders, order_items, abandoned_carts, utm_tracking, ab_tests                                                                                                                                                     |
| `crm`       | CRM / Retention    | contacts, segments, rfm_scores, automations, automation_runs, campaigns, consents, cohorts, widgets, widget_events, widget_templates, widget_metrics_daily                                                                          |
| `erp`       | ERP + Fiscal       | products, skus, inventory, inventory_movements, nfe_documents, financial_transactions, margin_calculations, shipping_labels, revenue_leak_daily                                                                                     |
| `pcp`       | Production         | collections, drops, production_orders, production_stages, suppliers, supplier_contacts, supplier_ratings, raw_materials, raw_material_stock, cost_analyses, product_bom, internal_votes, rework_orders                              |
| `whatsapp`  | WhatsApp Engine    | templates, message_logs, conversations, groups                                                                                                                                                                                      |
| `trocas`    | Exchanges          | exchange_requests, exchange_items, reverse_logistics                                                                                                                                                                                |
| `inbox`     | Support Inbox      | tickets, messages, quick_replies                                                                                                                                                                                                    |
| `b2b`       | B2B Portal         | retailers, b2b_orders, b2b_order_items, b2b_catalog                                                                                                                                                                                 |
| `creators`  | Creators Program   | creators, coupons, sales_attributions, points_ledger, challenges, challenge_submissions, payouts, social_accounts, content_detections, campaigns, campaign_creators, campaign_briefs, gifting_log, creator_kit_downloads, referrals |
| `marketing` | Marketing Intel    | ugc_posts, competitor_ads, campaign_metrics, creator_scouts, experiments                                                                                                                                                            |
| `tarefas`   | Tasks / Projects   | projects, tasks, task_comments, task_attachments, project_templates, calendar_events                                                                                                                                                |
| `clawdbot`  | Discord Bot        | report_schedules, report_logs, chat_history                                                                                                                                                                                         |
| `dashboard` | Dashboard / Beacon | dashboard_configs, widgets, war_room_sessions                                                                                                                                                                                       |
| `dam`       | Digital Assets     | assets, asset_versions, asset_tags                                                                                                                                                                                                  |
| `reviews`   | Reviews & Ratings  | reviews, review_media, review_config, review_requests                                                                                                                                                                               |

---

## 3. ENUMs

All PostgreSQL native ENUMs. Defined before table creation.

```sql
-- global
CREATE TYPE global.user_role AS ENUM ('admin', 'pm', 'creative', 'operations', 'support', 'finance', 'commercial');
CREATE TYPE global.audit_action AS ENUM ('create', 'update', 'delete');
CREATE TYPE global.notification_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- checkout
CREATE TYPE checkout.order_status AS ENUM ('pending', 'paid', 'separating', 'shipped', 'delivered', 'cancelled', 'returned');
CREATE TYPE checkout.payment_method AS ENUM ('credit_card', 'pix', 'bank_slip');
CREATE TYPE checkout.cart_status AS ENUM ('active', 'converted', 'abandoned');
CREATE TYPE checkout.ab_test_status AS ENUM ('draft', 'running', 'completed', 'cancelled');

-- crm
CREATE TYPE crm.segment_type AS ENUM ('rfm', 'custom', 'cohort');
CREATE TYPE crm.automation_trigger AS ENUM ('order_approved', 'order_shipped', 'order_delivered', 'cart_abandoned', 'welcome', 'post_purchase_review', 'repurchase', 'birthday', 'inactivity', 'vip_welcome', 'custom', 'product_recommendations', 'cross_sell', 'upsell', 'price_drop', 'back_in_stock');
CREATE TYPE crm.automation_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE crm.automation_run_status AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');
CREATE TYPE crm.channel AS ENUM ('whatsapp', 'email', 'sms');
CREATE TYPE crm.consent_type AS ENUM ('whatsapp', 'email', 'tracking');
CREATE TYPE crm.campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'completed', 'cancelled');

-- crm (on-site widgets — Phase 2)
CREATE TYPE crm.widget_type AS ENUM ('popup', 'banner', 'slider', 'social_proof');
CREATE TYPE crm.widget_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE crm.popup_trigger AS ENUM ('exit_intent', 'scroll_percent', 'time_delay', 'click', 'page_load');
CREATE TYPE crm.widget_event_type AS ENUM ('view', 'click', 'close', 'auto_close', 'subscribe_email', 'subscribe_phone', 'convert');
CREATE TYPE crm.widget_placement AS ENUM ('overlay_center', 'overlay_bottom', 'top_bar', 'inline', 'sidebar', 'toast_bottom_left', 'toast_bottom_right', 'slide_in_right');

-- erp
CREATE TYPE erp.sku_tier AS ENUM ('gold', 'silver', 'bronze', 'unranked');
CREATE TYPE erp.movement_type AS ENUM ('sale', 'return', 'adjustment', 'production_entry', 'purchase', 'loss', 'tier_change');
CREATE TYPE erp.nfe_type AS ENUM ('sale', 'return');
CREATE TYPE erp.nfe_status AS ENUM ('pending', 'authorized', 'cancelled', 'rejected');
CREATE TYPE erp.nfe_provider AS ENUM ('focus_nfe', 'plugnotas');
CREATE TYPE erp.transaction_type AS ENUM ('sale', 'refund', 'chargeback', 'fee', 'pix_received', 'bank_slip_received');
CREATE TYPE erp.transaction_status AS ENUM ('pending', 'confirmed', 'failed', 'reversed');
CREATE TYPE erp.shipping_label_status AS ENUM ('pending', 'generated', 'printed', 'in_transit', 'delivered', 'cancelled');

-- pcp
CREATE TYPE pcp.supplier_type AS ENUM ('factory', 'weaving_mill', 'print_shop', 'dyeing_mill', 'trim_supplier', 'packaging');
CREATE TYPE pcp.production_status AS ENUM ('draft', 'in_progress', 'paused', 'completed', 'cancelled');
CREATE TYPE pcp.stage_type AS ENUM ('concept', 'pattern', 'sample', 'approval', 'size_grading', 'material_purchase', 'cutting', 'sewing', 'finishing', 'qc', 'stock_entry');
CREATE TYPE pcp.stage_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
CREATE TYPE pcp.rework_status AS ENUM ('pending', 'sent_to_supplier', 'in_progress', 'returned', 'completed', 'cancelled');
CREATE TYPE pcp.raw_material_category AS ENUM ('fabric', 'trim', 'label', 'packaging', 'thread', 'dye', 'other');
CREATE TYPE pcp.op_type AS ENUM ('standard', 'pilot');
CREATE TYPE pcp.vote_option AS ENUM ('yes', 'no', 'maybe');
CREATE TYPE pcp.pilot_status AS ENUM ('pending_data', 'champion', 'monitor', 'discontinue');

-- whatsapp
CREATE TYPE whatsapp.template_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected');
CREATE TYPE whatsapp.message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE whatsapp.message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');
CREATE TYPE whatsapp.conversation_status AS ENUM ('open', 'closed', 'expired');

-- trocas
CREATE TYPE trocas.request_type AS ENUM ('exchange_size', 'exchange_color', 'store_credit', 'refund');
CREATE TYPE trocas.request_status AS ENUM ('pending', 'approved', 'collecting', 'received', 'processing', 'completed', 'rejected', 'cancelled');
CREATE TYPE trocas.logistics_status AS ENUM ('label_generated', 'collected', 'in_transit', 'delivered_warehouse');

-- inbox
CREATE TYPE inbox.ticket_status AS ENUM ('open', 'waiting_customer', 'waiting_internal', 'resolved', 'closed');
CREATE TYPE inbox.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE inbox.message_source AS ENUM ('whatsapp', 'email', 'internal_note');

-- b2b
CREATE TYPE b2b.retailer_status AS ENUM ('pending', 'approved', 'suspended', 'inactive');
CREATE TYPE b2b.b2b_order_status AS ENUM ('pending', 'confirmed', 'separating', 'shipped', 'delivered', 'cancelled');
CREATE TYPE b2b.b2b_payment_method AS ENUM ('pix', 'bank_slip');

-- creators
CREATE TYPE creators.creator_tier AS ENUM ('ambassador', 'seed', 'grow', 'bloom', 'core');
CREATE TYPE creators.creator_status AS ENUM ('pending', 'active', 'suspended', 'inactive');
CREATE TYPE creators.pix_key_type AS ENUM ('cpf', 'email', 'phone', 'random');
CREATE TYPE creators.payment_method AS ENUM ('pix', 'store_credit', 'product');
CREATE TYPE creators.payment_preference AS ENUM ('pix', 'store_credit', 'product');
CREATE TYPE creators.social_platform AS ENUM ('instagram', 'tiktok', 'youtube', 'pinterest', 'twitter', 'other');
CREATE TYPE creators.content_post_type AS ENUM ('post', 'story', 'reel', 'tiktok', 'youtube', 'live');
CREATE TYPE creators.points_action AS ENUM ('sale', 'post', 'challenge', 'referral', 'engagement', 'manual_adjustment', 'tier_bonus', 'hashtag_detected', 'creator_of_month');
CREATE TYPE creators.payout_status AS ENUM ('pending', 'processing', 'paid', 'failed');
CREATE TYPE creators.challenge_type AS ENUM ('drop', 'style', 'community', 'viral', 'surprise');
CREATE TYPE creators.challenge_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE creators.submission_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE creators.coupon_type AS ENUM ('creator', 'campaign', 'vip');
CREATE TYPE creators.campaign_type AS ENUM ('seeding', 'paid', 'gifting', 'reward');
CREATE TYPE creators.campaign_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE creators.delivery_status AS ENUM ('pending', 'shipped', 'delivered', 'returned');

-- marketing
CREATE TYPE marketing.ugc_status AS ENUM ('detected', 'curated', 'approved', 'rejected', 'published');
CREATE TYPE marketing.ad_platform AS ENUM ('meta', 'google', 'tiktok');
CREATE TYPE marketing.experiment_result AS ENUM ('a_won', 'b_won', 'inconclusive', 'ongoing');

-- tarefas
CREATE TYPE tarefas.task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled');
CREATE TYPE tarefas.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE tarefas.event_type AS ENUM ('drop_launch', 'campaign', 'content_post', 'briefing_deadline', 'creative_deadline', 'meeting', 'other');

-- clawdbot
CREATE TYPE clawdbot.report_frequency AS ENUM ('daily', 'weekly', 'monthly', 'on_demand');
CREATE TYPE clawdbot.report_status AS ENUM ('pending', 'generating', 'sent', 'failed');
CREATE TYPE clawdbot.llm_model AS ENUM ('haiku', 'sonnet', 'opus');

-- dashboard
CREATE TYPE dashboard.widget_type AS ENUM ('metric_card', 'line_chart', 'bar_chart', 'donut_chart', 'table', 'sparkline', 'custom');
CREATE TYPE dashboard.war_room_status AS ENUM ('scheduled', 'active', 'ended');

-- reviews
CREATE TYPE reviews.review_status AS ENUM ('pending', 'approved', 'rejected');
```

---

## 4. Table Definitions

### 4.1 Schema: `global`

#### global.users

| Column        | Type             | Constraints                   | Description                                                   |
| ------------- | ---------------- | ----------------------------- | ------------------------------------------------------------- |
| id            | UUID             | PK, DEFAULT gen_random_uuid() | UUID v7                                                       |
| email         | VARCHAR(255)     | NOT NULL, UNIQUE              | Login email                                                   |
| name          | VARCHAR(255)     | NOT NULL                      | Display name                                                  |
| password_hash | VARCHAR(255)     | NOT NULL                      | bcrypt/argon2 hash                                            |
| role          | global.user_role | NOT NULL                      | admin, pm, creative, operations, support, finance, commercial |
| avatar_url    | TEXT             | NULL                          | Profile photo URL (R2/S3)                                     |
| is_active     | BOOLEAN          | NOT NULL DEFAULT TRUE         | Soft disable without deleting                                 |
| last_login_at | TIMESTAMPTZ      | NULL                          | Last successful login                                         |
| created_at    | TIMESTAMPTZ      | NOT NULL DEFAULT NOW()        |                                                               |
| updated_at    | TIMESTAMPTZ      | NOT NULL DEFAULT NOW()        |                                                               |

```sql
CREATE INDEX idx_users_email ON global.users (email);
CREATE INDEX idx_users_role ON global.users (role);
CREATE INDEX idx_users_is_active ON global.users (is_active) WHERE is_active = TRUE;
```

#### global.roles

| Column       | Type         | Constraints            | Description                     |
| ------------ | ------------ | ---------------------- | ------------------------------- |
| id           | UUID         | PK                     |                                 |
| name         | VARCHAR(100) | NOT NULL, UNIQUE       | Role identifier (e.g., 'admin') |
| display_name | VARCHAR(255) | NOT NULL               | PT-BR display name              |
| description  | TEXT         | NULL                   | Role description                |
| created_at   | TIMESTAMPTZ  | NOT NULL DEFAULT NOW() |                                 |
| updated_at   | TIMESTAMPTZ  | NOT NULL DEFAULT NOW() |                                 |

#### global.permissions

| Column     | Type         | Constraints                   | Description                                     |
| ---------- | ------------ | ----------------------------- | ----------------------------------------------- |
| id         | UUID         | PK                            |                                                 |
| role_id    | UUID         | NOT NULL, FK global.roles(id) |                                                 |
| resource   | VARCHAR(100) | NOT NULL                      | e.g., 'orders', 'contacts', 'production_orders' |
| action     | VARCHAR(50)  | NOT NULL                      | e.g., 'read', 'write', 'delete', 'export'       |
| conditions | JSONB        | NULL                          | Optional row-level conditions                   |
| created_at | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()        |                                                 |

```sql
CREATE UNIQUE INDEX idx_permissions_unique ON global.permissions (role_id, resource, action);
CREATE INDEX idx_permissions_role ON global.permissions (role_id);
```

#### global.audit_logs

| Column        | Type                | Constraints                   | Description                                  |
| ------------- | ------------------- | ----------------------------- | -------------------------------------------- |
| id            | UUID                | PK                            |                                              |
| timestamp     | TIMESTAMPTZ         | NOT NULL DEFAULT NOW()        | When the action occurred                     |
| user_id       | UUID                | NOT NULL, FK global.users(id) | Who performed the action                     |
| user_role     | global.user_role    | NOT NULL                      | Denormalized for query speed                 |
| action        | global.audit_action | NOT NULL                      | create, update, delete                       |
| resource_type | VARCHAR(100)        | NOT NULL                      | e.g., 'order', 'contact', 'production_order' |
| resource_id   | UUID                | NOT NULL                      | ID of the affected resource                  |
| module        | VARCHAR(50)         | NOT NULL                      | Schema name: 'checkout', 'crm', 'erp', etc.  |
| changes       | JSONB               | NOT NULL                      | `{ "before": {...}, "after": {...} }`        |
| ip_address    | INET                | NULL                          | Client IP                                    |
| user_agent    | TEXT                | NULL                          | Browser/client identifier                    |
| request_id    | UUID                | NULL                          | Correlation ID for tracing                   |
| created_at    | TIMESTAMPTZ         | NOT NULL DEFAULT NOW()        |                                              |

```sql
CREATE INDEX idx_audit_logs_user ON global.audit_logs (user_id);
CREATE INDEX idx_audit_logs_resource ON global.audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_logs_module ON global.audit_logs (module);
CREATE INDEX idx_audit_logs_timestamp ON global.audit_logs (timestamp DESC);
CREATE INDEX idx_audit_logs_action ON global.audit_logs (action);
```

> **Note:** audit_logs is append-only. No UPDATE or DELETE. Archived monthly to cold storage via background job.

#### global.notifications

| Column     | Type                         | Constraints                   | Description                                  |
| ---------- | ---------------------------- | ----------------------------- | -------------------------------------------- |
| id         | UUID                         | PK                            |                                              |
| user_id    | UUID                         | NOT NULL, FK global.users(id) | Recipient                                    |
| title      | VARCHAR(255)                 | NOT NULL                      | Notification headline                        |
| body       | TEXT                         | NOT NULL                      | Notification detail                          |
| icon       | VARCHAR(50)                  | NULL                          | Lucide icon name                             |
| action_url | TEXT                         | NULL                          | Deep link into the app                       |
| priority   | global.notification_priority | NOT NULL DEFAULT 'medium'     | low, medium, high, critical                  |
| read_at    | TIMESTAMPTZ                  | NULL                          | NULL = unread                                |
| module     | VARCHAR(50)                  | NOT NULL                      | Source module                                |
| event_type | VARCHAR(100)                 | NOT NULL                      | e.g., 'stock_critical', 'production_delayed' |
| metadata   | JSONB                        | NULL                          | Extra context for rendering                  |
| created_at | TIMESTAMPTZ                  | NOT NULL DEFAULT NOW()        |                                              |

```sql
CREATE INDEX idx_notifications_user_unread ON global.notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user ON global.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_module ON global.notifications (module);
```

#### global.search_index

| Column        | Type         | Constraints            | Description                              |
| ------------- | ------------ | ---------------------- | ---------------------------------------- |
| id            | UUID         | PK                     |                                          |
| resource_type | VARCHAR(100) | NOT NULL               | 'product', 'order', 'contact', 'creator' |
| resource_id   | UUID         | NOT NULL               | FK to the source record                  |
| title         | TEXT         | NOT NULL               | Primary display text                     |
| subtitle      | TEXT         | NULL                   | Secondary text (SKU, email, etc.)        |
| metadata      | JSONB        | NULL                   | Extra display data                       |
| module        | VARCHAR(50)  | NOT NULL               | Schema for routing                       |
| search_vector | TSVECTOR     | NOT NULL               | Full-text search vector                  |
| created_at    | TIMESTAMPTZ  | NOT NULL DEFAULT NOW() |                                          |
| updated_at    | TIMESTAMPTZ  | NOT NULL DEFAULT NOW() |                                          |

```sql
CREATE UNIQUE INDEX idx_search_index_resource ON global.search_index (resource_type, resource_id);
CREATE INDEX idx_search_index_fts ON global.search_index USING GIN (search_vector);
CREATE INDEX idx_search_index_module ON global.search_index (module);
```

---

### 4.2 Schema: `checkout`

#### checkout.carts

| Column           | Type                 | Constraints                   | Description                                                           |
| ---------------- | -------------------- | ----------------------------- | --------------------------------------------------------------------- |
| id               | UUID                 | PK                            |                                                                       |
| session_id       | VARCHAR(255)         | NOT NULL                      | Browser session / anonymous ID                                        |
| contact_id       | UUID                 | NULL, FK crm.contacts(id)     | Linked after identification                                           |
| status           | checkout.cart_status | NOT NULL DEFAULT 'active'     | active, converted, abandoned                                          |
| subtotal         | NUMERIC(12,2)        | NOT NULL DEFAULT 0            |                                                                       |
| discount_amount  | NUMERIC(12,2)        | NOT NULL DEFAULT 0            |                                                                       |
| shipping_cost    | NUMERIC(12,2)        | NULL                          | Calculated after CEP entry                                            |
| total            | NUMERIC(12,2)        | NOT NULL DEFAULT 0            |                                                                       |
| coupon_id        | UUID                 | NULL, FK creators.coupons(id) | Applied coupon                                                        |
| utm_source       | VARCHAR(255)         | NULL                          |                                                                       |
| utm_medium       | VARCHAR(255)         | NULL                          |                                                                       |
| utm_campaign     | VARCHAR(255)         | NULL                          |                                                                       |
| utm_content      | VARCHAR(255)         | NULL                          |                                                                       |
| shipping_address | JSONB                | NULL                          | `{ street, number, complement, neighborhood, city, state, zip_code }` |
| billing_cpf      | VARCHAR(14)          | NULL                          | CPF entered at checkout                                               |
| metadata         | JSONB                | NULL                          | AB test variant, referrer, etc.                                       |
| abandoned_at     | TIMESTAMPTZ          | NULL                          | When marked as abandoned                                              |
| converted_at     | TIMESTAMPTZ          | NULL                          | When converted to order                                               |
| created_at       | TIMESTAMPTZ          | NOT NULL DEFAULT NOW()        |                                                                       |
| updated_at       | TIMESTAMPTZ          | NOT NULL DEFAULT NOW()        |                                                                       |

```sql
CREATE INDEX idx_carts_session ON checkout.carts (session_id);
CREATE INDEX idx_carts_contact ON checkout.carts (contact_id);
CREATE INDEX idx_carts_status ON checkout.carts (status);
CREATE INDEX idx_carts_abandoned ON checkout.carts (abandoned_at) WHERE status = 'abandoned';
```

#### checkout.cart_items

| Column      | Type          | Constraints                                       | Description            |
| ----------- | ------------- | ------------------------------------------------- | ---------------------- |
| id          | UUID          | PK                                                |                        |
| cart_id     | UUID          | NOT NULL, FK checkout.carts(id) ON DELETE CASCADE |                        |
| sku_id      | UUID          | NOT NULL, FK erp.skus(id)                         |                        |
| quantity    | INTEGER       | NOT NULL, CHECK (quantity > 0)                    |                        |
| unit_price  | NUMERIC(12,2) | NOT NULL                                          | Price at time of add   |
| total_price | NUMERIC(12,2) | NOT NULL                                          | quantity \* unit_price |
| created_at  | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()                            |                        |
| updated_at  | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()                            |                        |

```sql
CREATE INDEX idx_cart_items_cart ON checkout.cart_items (cart_id);
CREATE INDEX idx_cart_items_sku ON checkout.cart_items (sku_id);
```

#### checkout.orders

| Column               | Type                    | Constraints                    | Description                                                           |
| -------------------- | ----------------------- | ------------------------------ | --------------------------------------------------------------------- |
| id                   | UUID                    | PK                             |                                                                       |
| order_number         | SERIAL                  | NOT NULL, UNIQUE               | Human-readable sequential number (e.g., #4521)                        |
| contact_id           | UUID                    | NOT NULL, FK crm.contacts(id)  | Buyer                                                                 |
| status               | checkout.order_status   | NOT NULL DEFAULT 'pending'     | pending, paid, separating, shipped, delivered, cancelled, returned    |
| subtotal             | NUMERIC(12,2)           | NOT NULL                       | Sum of items before discounts                                         |
| discount_amount      | NUMERIC(12,2)           | NOT NULL DEFAULT 0             | Coupon + PIX discount                                                 |
| shipping_cost        | NUMERIC(12,2)           | NOT NULL DEFAULT 0             |                                                                       |
| total                | NUMERIC(12,2)           | NOT NULL                       | subtotal - discount_amount + shipping_cost                            |
| payment_method       | checkout.payment_method | NOT NULL                       | credit_card, pix, bank_slip                                           |
| payment_id           | VARCHAR(255)            | NULL                           | Mercado Pago payment ID                                               |
| installments         | INTEGER                 | NOT NULL DEFAULT 1             | Number of installments (1 = full)                                     |
| pix_discount_applied | BOOLEAN                 | NOT NULL DEFAULT FALSE         | Whether PIX discount was given                                        |
| coupon_id            | UUID                    | NULL, FK creators.coupons(id)  | Applied creator/campaign coupon                                       |
| utm_source           | VARCHAR(255)            | NULL                           |                                                                       |
| utm_medium           | VARCHAR(255)            | NULL                           |                                                                       |
| utm_campaign         | VARCHAR(255)            | NULL                           |                                                                       |
| utm_content          | VARCHAR(255)            | NULL                           |                                                                       |
| shipping_address     | JSONB                   | NOT NULL                       | `{ street, number, complement, neighborhood, city, state, zip_code }` |
| billing_cpf          | VARCHAR(14)             | NOT NULL                       | Buyer CPF (NF-e requirement)                                          |
| nfe_id               | UUID                    | NULL, FK erp.nfe_documents(id) | Linked after NF-e emission                                            |
| tracking_code        | VARCHAR(100)            | NULL                           | Carrier tracking code                                                 |
| shipped_at           | TIMESTAMPTZ             | NULL                           |                                                                       |
| delivered_at         | TIMESTAMPTZ             | NULL                           |                                                                       |
| notes                | TEXT                    | NULL                           | Internal notes                                                        |
| created_at           | TIMESTAMPTZ             | NOT NULL DEFAULT NOW()         |                                                                       |
| updated_at           | TIMESTAMPTZ             | NOT NULL DEFAULT NOW()         |                                                                       |
| deleted_at           | TIMESTAMPTZ             | NULL                           | Soft delete                                                           |

```sql
CREATE UNIQUE INDEX idx_orders_number ON checkout.orders (order_number);
CREATE INDEX idx_orders_contact ON checkout.orders (contact_id);
CREATE INDEX idx_orders_status ON checkout.orders (status);
CREATE INDEX idx_orders_coupon ON checkout.orders (coupon_id) WHERE coupon_id IS NOT NULL;
CREATE INDEX idx_orders_nfe ON checkout.orders (nfe_id) WHERE nfe_id IS NOT NULL;
CREATE INDEX idx_orders_created ON checkout.orders (created_at DESC);
CREATE INDEX idx_orders_payment_method ON checkout.orders (payment_method);
CREATE INDEX idx_orders_shipped ON checkout.orders (shipped_at) WHERE shipped_at IS NOT NULL;
CREATE INDEX idx_orders_utm ON checkout.orders (utm_source, utm_medium, utm_campaign);
CREATE INDEX idx_orders_not_deleted ON checkout.orders (id) WHERE deleted_at IS NULL;
```

#### checkout.order_items

| Column       | Type          | Constraints                                        | Description               |
| ------------ | ------------- | -------------------------------------------------- | ------------------------- |
| id           | UUID          | PK                                                 |                           |
| order_id     | UUID          | NOT NULL, FK checkout.orders(id) ON DELETE CASCADE |                           |
| sku_id       | UUID          | NOT NULL, FK erp.skus(id)                          |                           |
| product_name | VARCHAR(255)  | NOT NULL                                           | Denormalized for history  |
| sku_code     | VARCHAR(50)   | NOT NULL                                           | Denormalized for history  |
| size         | VARCHAR(10)   | NOT NULL                                           | Denormalized              |
| color        | VARCHAR(50)   | NOT NULL                                           | Denormalized              |
| quantity     | INTEGER       | NOT NULL, CHECK (quantity > 0)                     |                           |
| unit_price   | NUMERIC(12,2) | NOT NULL                                           | Price at time of purchase |
| total_price  | NUMERIC(12,2) | NOT NULL                                           | quantity \* unit_price    |
| created_at   | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()                             |                           |

```sql
CREATE INDEX idx_order_items_order ON checkout.order_items (order_id);
CREATE INDEX idx_order_items_sku ON checkout.order_items (sku_id);
```

#### checkout.abandoned_carts

| Column             | Type          | Constraints                     | Description                                                             |
| ------------------ | ------------- | ------------------------------- | ----------------------------------------------------------------------- |
| id                 | UUID          | PK                              |                                                                         |
| cart_id            | UUID          | NOT NULL, FK checkout.carts(id) | Original cart                                                           |
| contact_id         | UUID          | NULL, FK crm.contacts(id)       | If identified                                                           |
| email              | VARCHAR(255)  | NULL                            | Email captured at checkout                                              |
| phone              | VARCHAR(20)   | NULL                            | Phone captured at checkout                                              |
| total_value        | NUMERIC(12,2) | NOT NULL                        | Cart value at abandonment                                               |
| recovery_status    | VARCHAR(50)   | NOT NULL DEFAULT 'pending'      | pending, contacted_30m, contacted_2h, contacted_24h, recovered, expired |
| recovered_order_id | UUID          | NULL, FK checkout.orders(id)    | If recovered                                                            |
| last_contacted_at  | TIMESTAMPTZ   | NULL                            |                                                                         |
| created_at         | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()          |                                                                         |
| updated_at         | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()          |                                                                         |

```sql
CREATE INDEX idx_abandoned_carts_cart ON checkout.abandoned_carts (cart_id);
CREATE INDEX idx_abandoned_carts_contact ON checkout.abandoned_carts (contact_id);
CREATE INDEX idx_abandoned_carts_status ON checkout.abandoned_carts (recovery_status);
CREATE INDEX idx_abandoned_carts_created ON checkout.abandoned_carts (created_at DESC);
```

#### checkout.utm_tracking

| Column       | Type         | Constraints                  | Description        |
| ------------ | ------------ | ---------------------------- | ------------------ |
| id           | UUID         | PK                           |                    |
| session_id   | VARCHAR(255) | NOT NULL                     |                    |
| contact_id   | UUID         | NULL, FK crm.contacts(id)    |                    |
| utm_source   | VARCHAR(255) | NULL                         |                    |
| utm_medium   | VARCHAR(255) | NULL                         |                    |
| utm_campaign | VARCHAR(255) | NULL                         |                    |
| utm_content  | VARCHAR(255) | NULL                         |                    |
| utm_term     | VARCHAR(255) | NULL                         |                    |
| referrer     | TEXT         | NULL                         | HTTP referrer      |
| landing_page | TEXT         | NULL                         | First page visited |
| converted    | BOOLEAN      | NOT NULL DEFAULT FALSE       |                    |
| order_id     | UUID         | NULL, FK checkout.orders(id) | If converted       |
| created_at   | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()       |                    |

```sql
CREATE INDEX idx_utm_tracking_session ON checkout.utm_tracking (session_id);
CREATE INDEX idx_utm_tracking_contact ON checkout.utm_tracking (contact_id);
CREATE INDEX idx_utm_tracking_source ON checkout.utm_tracking (utm_source, utm_medium, utm_campaign);
```

#### checkout.ab_tests

| Column                | Type                    | Constraints              | Description            |
| --------------------- | ----------------------- | ------------------------ | ---------------------- |
| id                    | UUID                    | PK                       |                        |
| name                  | VARCHAR(255)            | NOT NULL                 | Test name              |
| description           | TEXT                    | NULL                     |                        |
| status                | checkout.ab_test_status | NOT NULL DEFAULT 'draft' |                        |
| variant_a             | JSONB                   | NOT NULL                 | `{ name, config }`     |
| variant_b             | JSONB                   | NOT NULL                 | `{ name, config }`     |
| traffic_split         | NUMERIC(3,2)            | NOT NULL DEFAULT 0.50    | % traffic to variant B |
| variant_a_sessions    | INTEGER                 | NOT NULL DEFAULT 0       |                        |
| variant_b_sessions    | INTEGER                 | NOT NULL DEFAULT 0       |                        |
| variant_a_conversions | INTEGER                 | NOT NULL DEFAULT 0       |                        |
| variant_b_conversions | INTEGER                 | NOT NULL DEFAULT 0       |                        |
| started_at            | TIMESTAMPTZ             | NULL                     |                        |
| ended_at              | TIMESTAMPTZ             | NULL                     |                        |
| winner                | VARCHAR(1)              | NULL                     | 'A' or 'B'             |
| created_at            | TIMESTAMPTZ             | NOT NULL DEFAULT NOW()   |                        |
| updated_at            | TIMESTAMPTZ             | NOT NULL DEFAULT NOW()   |                        |

```sql
CREATE INDEX idx_ab_tests_status ON checkout.ab_tests (status);
```

---

### 4.3 Schema: `crm`

#### crm.contacts

| Column              | Type          | Constraints                 | Description                                                           |
| ------------------- | ------------- | --------------------------- | --------------------------------------------------------------------- |
| id                  | UUID          | PK                          |                                                                       |
| email               | VARCHAR(255)  | NULL, UNIQUE                | May be NULL if WhatsApp-only                                          |
| phone               | VARCHAR(20)   | NULL                        | Brazilian format: +5511999999999                                      |
| name                | VARCHAR(255)  | NOT NULL                    | Full name                                                             |
| cpf                 | VARCHAR(14)   | UNIQUE, NOT NULL            | Brazilian tax ID (formato: 000.000.000-00)                            |
| address             | JSONB         | NULL                        | `{ street, number, complement, neighborhood, city, state, zip_code }` |
| rfm_score_id        | UUID          | NULL, FK crm.rfm_scores(id) | Latest RFM calculation                                                |
| segment_ids         | UUID[]        | NULL                        | Array of segment IDs                                                  |
| first_purchase_at   | TIMESTAMPTZ   | NULL                        |                                                                       |
| last_purchase_at    | TIMESTAMPTZ   | NULL                        |                                                                       |
| total_orders        | INTEGER       | NOT NULL DEFAULT 0          | Denormalized counter                                                  |
| total_spent         | NUMERIC(12,2) | NOT NULL DEFAULT 0          | Denormalized sum                                                      |
| average_order_value | NUMERIC(12,2) | NOT NULL DEFAULT 0          | total_spent / total_orders                                            |
| ltv                 | NUMERIC(12,2) | NOT NULL DEFAULT 0          | Lifetime value                                                        |
| acquisition_source  | VARCHAR(100)  | NULL                        | e.g., 'instagram_ad', 'organic', 'creator_coupon'                     |
| acquisition_utm     | JSONB         | NULL                        | `{ source, medium, campaign, content }` from first visit              |
| birthday            | DATE          | NULL                        | Customer birthday for birthday automation                             |
| is_vip              | BOOLEAN       | NOT NULL DEFAULT FALSE      | VIP whitelist for drops                                               |
| consent_whatsapp    | BOOLEAN       | NOT NULL DEFAULT FALSE      | LGPD opt-in                                                           |
| consent_email       | BOOLEAN       | NOT NULL DEFAULT FALSE      | LGPD opt-in                                                           |
| consent_tracking    | BOOLEAN       | NOT NULL DEFAULT FALSE      | LGPD opt-in                                                           |
| consent_updated_at  | TIMESTAMPTZ   | NULL                        | Last consent change                                                   |
| tags                | TEXT[]        | NULL                        | Freeform tags                                                         |
| notes               | TEXT          | NULL                        | Internal notes                                                        |
| created_at          | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()      |                                                                       |
| updated_at          | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()      |                                                                       |
| deleted_at          | TIMESTAMPTZ   | NULL                        | Soft delete                                                           |

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

#### crm.segments

| Column             | Type             | Constraints            | Description                                              |
| ------------------ | ---------------- | ---------------------- | -------------------------------------------------------- |
| id                 | UUID             | PK                     |                                                          |
| name               | VARCHAR(255)     | NOT NULL               | Segment name                                             |
| description        | TEXT             | NULL                   |                                                          |
| type               | crm.segment_type | NOT NULL               | rfm, custom, cohort                                      |
| rules              | JSONB            | NOT NULL               | Filter rules: `{ conditions: [...], logic: 'AND'/'OR' }` |
| contact_count      | INTEGER          | NOT NULL DEFAULT 0     | Cached count                                             |
| is_dynamic         | BOOLEAN          | NOT NULL DEFAULT TRUE  | Recalculated automatically                               |
| last_calculated_at | TIMESTAMPTZ      | NULL                   |                                                          |
| created_at         | TIMESTAMPTZ      | NOT NULL DEFAULT NOW() |                                                          |
| updated_at         | TIMESTAMPTZ      | NOT NULL DEFAULT NOW() |                                                          |

```sql
CREATE INDEX idx_segments_type ON crm.segments (type);
```

> **Cross-schema segment rules:** Segment rules support cross-schema fields:
>
> - `has_purchased_product`: JOIN checkout.order_items → erp.products
> - `has_purchased_sku`: JOIN checkout.order_items → erp.skus
> - `has_cart_with_product`: JOIN checkout.cart_items → erp.products
> - `purchased_in_period` / `not_purchased_in_period`: compound date+product filter

#### crm.rfm_scores

| Column          | Type          | Constraints                   | Description                                 |
| --------------- | ------------- | ----------------------------- | ------------------------------------------- |
| id              | UUID          | PK                            |                                             |
| contact_id      | UUID          | NOT NULL, FK crm.contacts(id) |                                             |
| recency_score   | INTEGER       | NOT NULL, CHECK (1-5)         | 1=oldest, 5=most recent                     |
| frequency_score | INTEGER       | NOT NULL, CHECK (1-5)         | 1=least, 5=most frequent                    |
| monetary_score  | INTEGER       | NOT NULL, CHECK (1-5)         | 1=lowest, 5=highest spend                   |
| rfm_segment     | VARCHAR(50)   | NOT NULL                      | e.g., 'champions', 'at_risk', 'hibernating' |
| recency_days    | INTEGER       | NOT NULL                      | Days since last purchase                    |
| frequency_count | INTEGER       | NOT NULL                      | Total purchases in period                   |
| monetary_total  | NUMERIC(12,2) | NOT NULL                      | Total spent in period                       |
| calculated_at   | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()        |                                             |
| created_at      | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()        |                                             |

```sql
CREATE INDEX idx_rfm_scores_contact ON crm.rfm_scores (contact_id);
CREATE INDEX idx_rfm_scores_segment ON crm.rfm_scores (rfm_segment);
CREATE INDEX idx_rfm_scores_calculated ON crm.rfm_scores (calculated_at DESC);
```

#### crm.automations

| Column             | Type                   | Constraints               | Description                                    |
| ------------------ | ---------------------- | ------------------------- | ---------------------------------------------- |
| id                 | UUID                   | PK                        |                                                |
| name               | VARCHAR(255)           | NOT NULL                  | Automation name                                |
| description        | TEXT                   | NULL                      |                                                |
| trigger_type       | crm.automation_trigger | NOT NULL                  | post_purchase, cart_abandoned, etc.            |
| trigger_config     | JSONB                  | NOT NULL                  | Trigger-specific settings (delays, conditions) |
| channel            | crm.channel            | NOT NULL                  | whatsapp, email                                |
| template_id        | UUID                   | NULL                      | FK whatsapp.templates or email template        |
| email_template_key | VARCHAR(100)           | NULL                      | Resend template identifier                     |
| status             | crm.automation_status  | NOT NULL DEFAULT 'draft'  |                                                |
| segment_id         | UUID                   | NULL, FK crm.segments(id) | Target segment filter                          |
| cooldown_hours     | INTEGER                | NOT NULL DEFAULT 48       | Min hours between msgs to same contact         |
| total_sent         | INTEGER                | NOT NULL DEFAULT 0        |                                                |
| total_converted    | INTEGER                | NOT NULL DEFAULT 0        |                                                |
| created_at         | TIMESTAMPTZ            | NOT NULL DEFAULT NOW()    |                                                |
| updated_at         | TIMESTAMPTZ            | NOT NULL DEFAULT NOW()    |                                                |

```sql
CREATE INDEX idx_automations_status ON crm.automations (status);
CREATE INDEX idx_automations_trigger ON crm.automations (trigger_type);
```

#### crm.automation_runs

| Column        | Type                      | Constraints                      | Description                   |
| ------------- | ------------------------- | -------------------------------- | ----------------------------- |
| id            | UUID                      | PK                               |                               |
| automation_id | UUID                      | NOT NULL, FK crm.automations(id) |                               |
| campaign_id   | UUID                      | NULL, FK crm.campaigns(id)       | NULL for event-triggered runs |
| contact_id    | UUID                      | NOT NULL, FK crm.contacts(id)    |                               |
| status        | crm.automation_run_status | NOT NULL DEFAULT 'pending'       |                               |
| channel       | crm.channel               | NOT NULL                         |                               |
| scheduled_at  | TIMESTAMPTZ               | NOT NULL                         | When to send                  |
| sent_at       | TIMESTAMPTZ               | NULL                             |                               |
| delivered_at  | TIMESTAMPTZ               | NULL                             |                               |
| opened_at     | TIMESTAMPTZ               | NULL                             | Email opens                   |
| clicked_at    | TIMESTAMPTZ               | NULL                             | Link clicks                   |
| converted_at  | TIMESTAMPTZ               | NULL                             | Conversion event              |
| error_message | TEXT                      | NULL                             | If failed                     |
| created_at    | TIMESTAMPTZ               | NOT NULL DEFAULT NOW()           |                               |
| updated_at    | TIMESTAMPTZ               | NOT NULL DEFAULT NOW()           |                               |

```sql
CREATE INDEX idx_automation_runs_automation ON crm.automation_runs (automation_id);
CREATE INDEX idx_automation_runs_contact ON crm.automation_runs (contact_id);
CREATE INDEX idx_automation_runs_status ON crm.automation_runs (status);
CREATE INDEX idx_automation_runs_scheduled ON crm.automation_runs (scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_automation_runs_campaign ON crm.automation_runs (campaign_id) WHERE campaign_id IS NOT NULL;
```

#### crm.consents

| Column       | Type             | Constraints                   | Description                            |
| ------------ | ---------------- | ----------------------------- | -------------------------------------- |
| id           | UUID             | PK                            |                                        |
| contact_id   | UUID             | NOT NULL, FK crm.contacts(id) |                                        |
| consent_type | crm.consent_type | NOT NULL                      | whatsapp, email, tracking              |
| granted      | BOOLEAN          | NOT NULL                      | TRUE = opted in, FALSE = opted out     |
| ip_address   | INET             | NULL                          | IP at time of consent                  |
| user_agent   | TEXT             | NULL                          | Browser at time of consent             |
| source       | VARCHAR(100)     | NOT NULL                      | 'checkout', 'profile', 'import', 'api' |
| created_at   | TIMESTAMPTZ      | NOT NULL DEFAULT NOW()        | Immutable consent log                  |

```sql
CREATE INDEX idx_consents_contact ON crm.consents (contact_id);
CREATE INDEX idx_consents_type ON crm.consents (contact_id, consent_type);
```

> **Note:** consents is append-only. Each row is a consent event. Current state derived from latest row per contact + type. Required for LGPD compliance.

#### crm.campaigns

| Column             | Type                | Constraints               | Description                             |
| ------------------ | ------------------- | ------------------------- | --------------------------------------- |
| id                 | UUID                | PK                        |                                         |
| name               | VARCHAR(255)        | NOT NULL                  | Campaign name                           |
| segment_id         | UUID                | NULL, FK crm.segments(id) | Target segment                          |
| channel            | crm.channel         | NOT NULL                  | whatsapp, email                         |
| template_id        | UUID                | NULL                      | FK whatsapp.templates for WA campaigns  |
| email_template_key | VARCHAR(100)        | NULL                      | Resend template identifier              |
| message_body       | TEXT                | NULL                      | Inline message content (if no template) |
| status             | crm.campaign_status | NOT NULL DEFAULT 'draft'  |                                         |
| scheduled_at       | TIMESTAMPTZ         | NULL                      | When to start sending                   |
| sent_at            | TIMESTAMPTZ         | NULL                      | When sending actually started           |
| completed_at       | TIMESTAMPTZ         | NULL                      | When all messages were sent             |
| total_recipients   | INTEGER             | NOT NULL DEFAULT 0        |                                         |
| total_sent         | INTEGER             | NOT NULL DEFAULT 0        |                                         |
| total_delivered    | INTEGER             | NOT NULL DEFAULT 0        |                                         |
| total_opened       | INTEGER             | NOT NULL DEFAULT 0        |                                         |
| total_clicked      | INTEGER             | NOT NULL DEFAULT 0        |                                         |
| total_converted    | INTEGER             | NOT NULL DEFAULT 0        |                                         |
| created_at         | TIMESTAMPTZ         | NOT NULL DEFAULT NOW()    |                                         |
| updated_at         | TIMESTAMPTZ         | NOT NULL DEFAULT NOW()    |                                         |

```sql
CREATE INDEX idx_campaigns_status ON crm.campaigns (status);
CREATE INDEX idx_campaigns_segment ON crm.campaigns (segment_id);
CREATE INDEX idx_campaigns_scheduled ON crm.campaigns (scheduled_at) WHERE status = 'scheduled';
```

#### crm.cohorts

| Column          | Type          | Constraints            | Description                                |
| --------------- | ------------- | ---------------------- | ------------------------------------------ |
| id              | UUID          | PK                     |                                            |
| name            | VARCHAR(255)  | NOT NULL               | e.g., 'Drop 10 Buyers', '2026-01 Acquired' |
| description     | TEXT          | NULL                   |                                            |
| cohort_period   | VARCHAR(20)   | NOT NULL               | e.g., '2026-01', '2026-Q1', 'drop-10'      |
| contact_count   | INTEGER       | NOT NULL DEFAULT 0     |                                            |
| avg_ltv         | NUMERIC(12,2) | NOT NULL DEFAULT 0     |                                            |
| repurchase_rate | NUMERIC(5,2)  | NOT NULL DEFAULT 0     | Percentage                                 |
| churn_rate      | NUMERIC(5,2)  | NOT NULL DEFAULT 0     | Percentage                                 |
| metadata        | JSONB         | NULL                   | Extra analytics                            |
| calculated_at   | TIMESTAMPTZ   | NOT NULL DEFAULT NOW() |                                            |
| created_at      | TIMESTAMPTZ   | NOT NULL DEFAULT NOW() |                                            |
| updated_at      | TIMESTAMPTZ   | NOT NULL DEFAULT NOW() |                                            |

```sql
CREATE INDEX idx_cohorts_period ON crm.cohorts (cohort_period);
```

#### crm.widgets (Phase 2 — On-Site Widget Engine)

| Column              | Type                 | Constraints                                    | Description                                                                       |
| ------------------- | -------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| id                  | UUID                 | PK, DEFAULT gen_random_uuid()                  | UUID v7                                                                           |
| name                | VARCHAR(255)         | NOT NULL                                       | Widget display name                                                               |
| type                | crm.widget_type      | NOT NULL                                       | popup, banner, slider, social_proof                                               |
| status              | crm.widget_status    | NOT NULL DEFAULT 'draft'                       | draft, active, paused, archived                                                   |
| placement           | crm.widget_placement | NOT NULL                                       | Where on page the widget renders                                                  |
| trigger_type        | crm.popup_trigger    | NULL                                           | Only for popups                                                                   |
| trigger_config      | JSONB                | NULL                                           | `{ scroll_percent: 50, delay_seconds: 5 }`                                        |
| content             | JSONB                | NOT NULL                                       | `{ title, body, image_url, cta_text, cta_url, fields[], colors, custom_css }`     |
| targeting_rules     | JSONB                | NOT NULL DEFAULT '{}'                          | `{ pages, device, visitor_type, segment_id, url_contains, cart_value_min_cents }` |
| frequency_cap       | JSONB                | NOT NULL DEFAULT '{"type":"once_per_session"}' | once_per_session, once_per_day, always, once_per_lifetime                         |
| priority            | INTEGER              | NOT NULL DEFAULT 0                             | Higher = shown first                                                              |
| starts_at           | TIMESTAMPTZ          | NULL                                           | Schedule start                                                                    |
| ends_at             | TIMESTAMPTZ          | NULL                                           | Schedule end                                                                      |
| total_views         | INTEGER              | NOT NULL DEFAULT 0                             | Denormalized counter                                                              |
| total_clicks        | INTEGER              | NOT NULL DEFAULT 0                             | Denormalized counter                                                              |
| total_conversions   | INTEGER              | NOT NULL DEFAULT 0                             | Denormalized counter                                                              |
| total_revenue_cents | BIGINT               | NOT NULL DEFAULT 0                             | Attributed revenue                                                                |
| template_id         | UUID                 | NULL, FK crm.widget_templates(id)              | Source template                                                                   |
| created_by          | UUID                 | NOT NULL, FK global.users(id)                  | Creator                                                                           |
| created_at          | TIMESTAMPTZ          | NOT NULL DEFAULT NOW()                         |                                                                                   |
| updated_at          | TIMESTAMPTZ          | NOT NULL DEFAULT NOW()                         |                                                                                   |
| deleted_at          | TIMESTAMPTZ          | NULL                                           | Soft delete                                                                       |

```sql
CREATE INDEX idx_widgets_status ON crm.widgets (status);
CREATE INDEX idx_widgets_type ON crm.widgets (type);
CREATE INDEX idx_widgets_priority ON crm.widgets (priority DESC) WHERE status = 'active';
CREATE INDEX idx_widgets_schedule ON crm.widgets (starts_at, ends_at) WHERE status = 'active';
```

#### crm.widget_events (Phase 2)

| Column      | Type                  | Constraints                   | Description                               |
| ----------- | --------------------- | ----------------------------- | ----------------------------------------- |
| id          | UUID                  | PK, DEFAULT gen_random_uuid() |                                           |
| widget_id   | UUID                  | NOT NULL, FK crm.widgets(id)  |                                           |
| event_type  | crm.widget_event_type | NOT NULL                      | view, click, close, subscribe_email, etc. |
| contact_id  | UUID                  | NULL, FK crm.contacts(id)     | NULL for anonymous visitors               |
| session_id  | VARCHAR(64)           | NOT NULL                      | Client-generated session ID               |
| page_url    | TEXT                  | NOT NULL                      | URL where event occurred                  |
| device_type | VARCHAR(20)           | NULL                          | desktop, mobile, tablet                   |
| metadata    | JSONB                 | NULL                          | Extra event data                          |
| created_at  | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()        |                                           |

```sql
CREATE INDEX idx_widget_events_widget ON crm.widget_events (widget_id);
CREATE INDEX idx_widget_events_type ON crm.widget_events (event_type);
CREATE INDEX idx_widget_events_created ON crm.widget_events (created_at DESC);
CREATE INDEX idx_widget_events_session ON crm.widget_events (session_id);
CREATE INDEX idx_widget_events_contact ON crm.widget_events (contact_id) WHERE contact_id IS NOT NULL;
```

#### crm.widget_templates (Phase 2)

| Column        | Type                 | Constraints            | Description                         |
| ------------- | -------------------- | ---------------------- | ----------------------------------- |
| id            | UUID                 | PK                     |                                     |
| name          | VARCHAR(255)         | NOT NULL               | Template display name               |
| type          | crm.widget_type      | NOT NULL               | popup, banner, slider, social_proof |
| placement     | crm.widget_placement | NOT NULL               | Default placement                   |
| content       | JSONB                | NOT NULL               | Default content structure           |
| thumbnail_url | TEXT                 | NULL                   | Preview image                       |
| is_system     | BOOLEAN              | NOT NULL DEFAULT FALSE | TRUE = pre-built                    |
| created_at    | TIMESTAMPTZ          | NOT NULL DEFAULT NOW() |                                     |
| updated_at    | TIMESTAMPTZ          | NOT NULL DEFAULT NOW() |                                     |

#### crm.widget_metrics_daily (Phase 2)

| Column        | Type        | Constraints                  | Description            |
| ------------- | ----------- | ---------------------------- | ---------------------- |
| id            | UUID        | PK                           |                        |
| widget_id     | UUID        | NOT NULL, FK crm.widgets(id) |                        |
| date          | DATE        | NOT NULL                     | Aggregation date       |
| views         | INTEGER     | NOT NULL DEFAULT 0           |                        |
| clicks        | INTEGER     | NOT NULL DEFAULT 0           |                        |
| closes        | INTEGER     | NOT NULL DEFAULT 0           |                        |
| subscriptions | INTEGER     | NOT NULL DEFAULT 0           | Email + phone captures |
| conversions   | INTEGER     | NOT NULL DEFAULT 0           |                        |
| revenue_cents | BIGINT      | NOT NULL DEFAULT 0           | Attributed revenue     |
| created_at    | TIMESTAMPTZ | NOT NULL DEFAULT NOW()       |                        |

```sql
CREATE UNIQUE INDEX idx_widget_metrics_daily_widget_date ON crm.widget_metrics_daily (widget_id, date);
CREATE INDEX idx_widget_metrics_daily_date ON crm.widget_metrics_daily (date DESC);
```

---

### 4.4 Schema: `erp`

#### erp.products

| Column      | Type         | Constraints            | Description                                       |
| ----------- | ------------ | ---------------------- | ------------------------------------------------- |
| id          | UUID         | PK                     |                                                   |
| name        | VARCHAR(255) | NOT NULL               | e.g., 'Camiseta Preta Basic'                      |
| slug        | VARCHAR(255) | NOT NULL, UNIQUE       | URL-safe: 'camiseta-preta-basic'                  |
| description | TEXT         | NULL                   | Product description (may be AI-generated)         |
| category    | VARCHAR(100) | NOT NULL               | e.g., 'camiseta', 'calca', 'jaqueta', 'acessorio' |
| is_active   | BOOLEAN      | NOT NULL DEFAULT TRUE  |                                                   |
| created_at  | TIMESTAMPTZ  | NOT NULL DEFAULT NOW() |                                                   |
| updated_at  | TIMESTAMPTZ  | NOT NULL DEFAULT NOW() |                                                   |
| deleted_at  | TIMESTAMPTZ  | NULL                   | Soft delete                                       |

```sql
CREATE UNIQUE INDEX idx_products_slug ON erp.products (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON erp.products (category);
CREATE INDEX idx_products_active ON erp.products (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_not_deleted ON erp.products (id) WHERE deleted_at IS NULL;
```

#### erp.skus

| Column          | Type          | Constraints                   | Description                                                                                                           |
| --------------- | ------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| id              | UUID          | PK                            |                                                                                                                       |
| product_id      | UUID          | NOT NULL, FK erp.products(id) | Parent product                                                                                                        |
| sku_code        | VARCHAR(50)   | NOT NULL, UNIQUE              | e.g., 'SKU-0412-P-PRETA'                                                                                              |
| size            | VARCHAR(10)   | NOT NULL                      | PP, P, M, G, GG, XG                                                                                                   |
| color           | VARCHAR(50)   | NOT NULL                      | e.g., 'preta', 'branca', 'off_white'                                                                                  |
| price           | NUMERIC(12,2) | NOT NULL                      | Selling price (BRL)                                                                                                   |
| cost_price      | NUMERIC(12,2) | NOT NULL DEFAULT 0            | Production cost (from PCP)                                                                                            |
| weight_grams    | INTEGER       | NOT NULL DEFAULT 0            | For shipping calculation                                                                                              |
| dimensions      | JSONB         | NULL                          | `{ length_cm, width_cm, height_cm }`                                                                                  |
| barcode         | VARCHAR(50)   | NULL                          | EAN-13 if applicable                                                                                                  |
| tier            | erp.sku_tier  | NOT NULL DEFAULT 'unranked'   | gold (top 20%), silver (next 30%), bronze (bottom 50%), unranked (< 30 days data). Ref: Pandora96 tier classification |
| tier_updated_at | TIMESTAMPTZ   | NULL                          | Last tier recalculation                                                                                               |
| is_active       | BOOLEAN       | NOT NULL DEFAULT TRUE         |                                                                                                                       |
| created_at      | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()        |                                                                                                                       |
| updated_at      | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()        |                                                                                                                       |

```sql
CREATE UNIQUE INDEX idx_skus_code ON erp.skus (sku_code);
CREATE INDEX idx_skus_product ON erp.skus (product_id);
CREATE INDEX idx_skus_size ON erp.skus (size);
CREATE INDEX idx_skus_color ON erp.skus (color);
CREATE INDEX idx_skus_active ON erp.skus (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_skus_tier ON erp.skus (tier);
```

#### erp.revenue_leak_daily (Pandora96-inspired)

> Tracks estimated revenue lost per out-of-stock SKU per day. Can be implemented as a materialized view refreshed daily.

| Column                 | Type          | Constraints               | Description                                        |
| ---------------------- | ------------- | ------------------------- | -------------------------------------------------- |
| id                     | UUID          | PK                        |                                                    |
| sku_id                 | UUID          | NOT NULL, FK erp.skus(id) | Out-of-stock SKU                                   |
| date                   | DATE          | NOT NULL                  | Day of calculation                                 |
| page_views             | INTEGER       | NOT NULL DEFAULT 0        | Daily page views for this SKU (from analytics)     |
| avg_conversion_rate    | NUMERIC(5,4)  | NOT NULL DEFAULT 0        | Historical conversion rate for this SKU            |
| avg_order_value        | NUMERIC(12,2) | NOT NULL DEFAULT 0        | Historical AOV for this SKU                        |
| estimated_lost_revenue | NUMERIC(12,2) | NOT NULL DEFAULT 0        | page_views × avg_conversion_rate × avg_order_value |
| created_at             | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()    |                                                    |

```sql
CREATE UNIQUE INDEX idx_revenue_leak_sku_date ON erp.revenue_leak_daily (sku_id, date);
CREATE INDEX idx_revenue_leak_date ON erp.revenue_leak_daily (date DESC);
CREATE INDEX idx_revenue_leak_amount ON erp.revenue_leak_daily (estimated_lost_revenue DESC);
```

#### erp.inventory

| Column                 | Type         | Constraints                       | Description                          |
| ---------------------- | ------------ | --------------------------------- | ------------------------------------ |
| id                     | UUID         | PK                                |                                      |
| sku_id                 | UUID         | NOT NULL, FK erp.skus(id), UNIQUE | One inventory row per SKU            |
| quantity_available     | INTEGER      | NOT NULL DEFAULT 0                | Available for sale                   |
| quantity_reserved      | INTEGER      | NOT NULL DEFAULT 0                | Reserved by pending orders           |
| quantity_in_production | INTEGER      | NOT NULL DEFAULT 0                | From PCP production orders           |
| quantity_in_transit    | INTEGER      | NOT NULL DEFAULT 0                | Purchased, in shipment               |
| reorder_point          | INTEGER      | NOT NULL DEFAULT 5                | Alert threshold                      |
| depletion_velocity     | NUMERIC(8,2) | NOT NULL DEFAULT 0                | Units sold per day (rolling 30d avg) |
| last_entry_at          | TIMESTAMPTZ  | NULL                              | Last stock increase                  |
| last_exit_at           | TIMESTAMPTZ  | NULL                              | Last stock decrease                  |
| updated_at             | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()            |                                      |

```sql
CREATE UNIQUE INDEX idx_inventory_sku ON erp.inventory (sku_id);
CREATE INDEX idx_inventory_low_stock ON erp.inventory (quantity_available) WHERE quantity_available <= 10;
CREATE INDEX idx_inventory_zero ON erp.inventory (sku_id) WHERE quantity_available = 0;
```

#### erp.inventory_movements

| Column         | Type              | Constraints                   | Description                                                |
| -------------- | ----------------- | ----------------------------- | ---------------------------------------------------------- |
| id             | UUID              | PK                            |                                                            |
| sku_id         | UUID              | NOT NULL, FK erp.skus(id)     |                                                            |
| movement_type  | erp.movement_type | NOT NULL                      | sale, return, adjustment, production_entry, purchase, loss |
| quantity       | INTEGER           | NOT NULL                      | Positive = inbound, negative = outbound                    |
| reference_type | VARCHAR(100)      | NULL                          | 'order', 'exchange_request', 'production_order', 'manual'  |
| reference_id   | UUID              | NULL                          | FK to the source record                                    |
| notes          | TEXT              | NULL                          |                                                            |
| user_id        | UUID              | NOT NULL, FK global.users(id) | Who performed or triggered                                 |
| created_at     | TIMESTAMPTZ       | NOT NULL DEFAULT NOW()        | Immutable log                                              |

```sql
CREATE INDEX idx_inv_movements_sku ON erp.inventory_movements (sku_id);
CREATE INDEX idx_inv_movements_type ON erp.inventory_movements (movement_type);
CREATE INDEX idx_inv_movements_reference ON erp.inventory_movements (reference_type, reference_id);
CREATE INDEX idx_inv_movements_created ON erp.inventory_movements (created_at DESC);
CREATE INDEX idx_inv_movements_user ON erp.inventory_movements (user_id);
```

> **Note:** inventory_movements is append-only. The `erp.inventory` table is the derived current state. A trigger or application logic keeps them in sync.

#### erp.nfe_documents

| Column       | Type             | Constraints                      | Description                           |
| ------------ | ---------------- | -------------------------------- | ------------------------------------- |
| id           | UUID             | PK                               |                                       |
| order_id     | UUID             | NOT NULL, FK checkout.orders(id) | Source order                          |
| type         | erp.nfe_type     | NOT NULL                         | sale or return                        |
| nfe_number   | INTEGER          | NULL                             | Sequential NF-e number (from SEFAZ)   |
| nfe_key      | VARCHAR(44)      | NULL, UNIQUE                     | 44-digit access key (chave de acesso) |
| status       | erp.nfe_status   | NOT NULL DEFAULT 'pending'       |                                       |
| xml_url      | TEXT             | NULL                             | Stored XML file URL (R2/S3)           |
| pdf_url      | TEXT             | NULL                             | DANFE PDF URL                         |
| api_provider | erp.nfe_provider | NOT NULL                         | focus_nfe or plugnotas                |
| api_response | JSONB            | NULL                             | Full API response for debugging       |
| emitted_at   | TIMESTAMPTZ      | NULL                             | When authorized by SEFAZ              |
| created_at   | TIMESTAMPTZ      | NOT NULL DEFAULT NOW()           |                                       |
| updated_at   | TIMESTAMPTZ      | NOT NULL DEFAULT NOW()           |                                       |

```sql
CREATE INDEX idx_nfe_order ON erp.nfe_documents (order_id);
CREATE INDEX idx_nfe_status ON erp.nfe_documents (status);
CREATE INDEX idx_nfe_key ON erp.nfe_documents (nfe_key) WHERE nfe_key IS NOT NULL;
CREATE INDEX idx_nfe_type ON erp.nfe_documents (type);
CREATE INDEX idx_nfe_emitted ON erp.nfe_documents (emitted_at DESC) WHERE emitted_at IS NOT NULL;
```

#### erp.financial_transactions

| Column          | Type                    | Constraints                  | Description                                                     |
| --------------- | ----------------------- | ---------------------------- | --------------------------------------------------------------- |
| id              | UUID                    | PK                           |                                                                 |
| order_id        | UUID                    | NULL, FK checkout.orders(id) | Related order (nullable for fees)                               |
| type            | erp.transaction_type    | NOT NULL                     | sale, refund, chargeback, fee, pix_received, bank_slip_received |
| status          | erp.transaction_status  | NOT NULL DEFAULT 'pending'   |                                                                 |
| gross_amount    | NUMERIC(12,2)           | NOT NULL                     | Amount before fees                                              |
| fee_amount      | NUMERIC(12,2)           | NOT NULL DEFAULT 0           | Gateway / processing fee                                        |
| net_amount      | NUMERIC(12,2)           | NOT NULL                     | gross_amount - fee_amount                                       |
| payment_method  | checkout.payment_method | NULL                         |                                                                 |
| external_id     | VARCHAR(255)            | NULL                         | Mercado Pago transaction ID                                     |
| external_status | VARCHAR(100)            | NULL                         | Raw status from gateway                                         |
| metadata        | JSONB                   | NULL                         | Full webhook payload                                            |
| reconciled      | BOOLEAN                 | NOT NULL DEFAULT FALSE       | Matched with gateway                                            |
| reconciled_at   | TIMESTAMPTZ             | NULL                         |                                                                 |
| created_at      | TIMESTAMPTZ             | NOT NULL DEFAULT NOW()       |                                                                 |
| updated_at      | TIMESTAMPTZ             | NOT NULL DEFAULT NOW()       |                                                                 |

```sql
CREATE INDEX idx_fin_tx_order ON erp.financial_transactions (order_id);
CREATE INDEX idx_fin_tx_type ON erp.financial_transactions (type);
CREATE INDEX idx_fin_tx_status ON erp.financial_transactions (status);
CREATE INDEX idx_fin_tx_external ON erp.financial_transactions (external_id);
CREATE INDEX idx_fin_tx_reconciled ON erp.financial_transactions (reconciled) WHERE reconciled = FALSE;
CREATE INDEX idx_fin_tx_created ON erp.financial_transactions (created_at DESC);
```

#### erp.margin_calculations

| Column             | Type          | Constraints               | Description                     |
| ------------------ | ------------- | ------------------------- | ------------------------------- |
| id                 | UUID          | PK                        |                                 |
| sku_id             | UUID          | NOT NULL, FK erp.skus(id) |                                 |
| selling_price      | NUMERIC(12,2) | NOT NULL                  | Current or simulated price      |
| production_cost    | NUMERIC(12,2) | NOT NULL                  | From PCP cost_analyses          |
| avg_shipping_cost  | NUMERIC(12,2) | NOT NULL DEFAULT 0        | Based on weight/dimensions      |
| gateway_fee_rate   | NUMERIC(5,4)  | NOT NULL DEFAULT 0.06     | ~6% for credit card, weighted   |
| gateway_fee_amount | NUMERIC(12,2) | NOT NULL                  |                                 |
| tax_icms_rate      | NUMERIC(5,4)  | NOT NULL DEFAULT 0        | ICMS rate                       |
| tax_pis_rate       | NUMERIC(5,4)  | NOT NULL DEFAULT 0        | PIS rate                        |
| tax_cofins_rate    | NUMERIC(5,4)  | NOT NULL DEFAULT 0        | COFINS rate                     |
| tax_total_amount   | NUMERIC(12,2) | NOT NULL                  |                                 |
| gross_margin       | NUMERIC(12,2) | NOT NULL                  | selling_price - production_cost |
| gross_margin_pct   | NUMERIC(5,2)  | NOT NULL                  | As percentage                   |
| net_margin         | NUMERIC(12,2) | NOT NULL                  | After all deductions            |
| net_margin_pct     | NUMERIC(5,2)  | NOT NULL                  | As percentage                   |
| is_simulation      | BOOLEAN       | NOT NULL DEFAULT FALSE    | TRUE = what-if scenario         |
| calculated_at      | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()    |                                 |
| created_at         | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()    |                                 |

```sql
CREATE INDEX idx_margin_sku ON erp.margin_calculations (sku_id);
CREATE INDEX idx_margin_simulation ON erp.margin_calculations (is_simulation);
CREATE INDEX idx_margin_net ON erp.margin_calculations (net_margin_pct DESC) WHERE is_simulation = FALSE;
```

#### erp.shipping_labels

| Column                  | Type                      | Constraints                      | Description                                      |
| ----------------------- | ------------------------- | -------------------------------- | ------------------------------------------------ |
| id                      | UUID                      | PK                               |                                                  |
| order_id                | UUID                      | NOT NULL, FK checkout.orders(id) |                                                  |
| carrier                 | VARCHAR(100)              | NOT NULL                         | e.g., 'correios_pac', 'correios_sedex', 'jadlog' |
| tracking_code           | VARCHAR(100)              | NULL                             | Carrier tracking number                          |
| status                  | erp.shipping_label_status | NOT NULL DEFAULT 'pending'       |                                                  |
| label_url               | TEXT                      | NULL                             | PDF label URL                                    |
| cost                    | NUMERIC(12,2)             | NOT NULL DEFAULT 0               | Shipping cost charged to tenant                  |
| estimated_delivery_days | INTEGER                   | NULL                             |                                                  |
| melhor_envio_id         | VARCHAR(255)              | NULL                             | Melhor Envio shipment ID                         |
| api_response            | JSONB                     | NULL                             | Full API response                                |
| printed_at              | TIMESTAMPTZ               | NULL                             |                                                  |
| created_at              | TIMESTAMPTZ               | NOT NULL DEFAULT NOW()           |                                                  |
| updated_at              | TIMESTAMPTZ               | NOT NULL DEFAULT NOW()           |                                                  |

```sql
CREATE INDEX idx_shipping_labels_order ON erp.shipping_labels (order_id);
CREATE INDEX idx_shipping_labels_tracking ON erp.shipping_labels (tracking_code) WHERE tracking_code IS NOT NULL;
CREATE INDEX idx_shipping_labels_status ON erp.shipping_labels (status);
```

---

### 4.5 Schema: `pcp`

#### pcp.collections

| Column              | Type                  | Constraints              | Description                        |
| ------------------- | --------------------- | ------------------------ | ---------------------------------- |
| id                  | UUID                  | PK                       |                                    |
| name                | VARCHAR(255)          | NOT NULL                 | e.g., 'Coleção Inverno 2026'       |
| slug                | VARCHAR(255)          | NOT NULL, UNIQUE         |                                    |
| description         | TEXT                  | NULL                     |                                    |
| season              | VARCHAR(50)           | NULL                     | e.g., 'inverno_2026', 'verao_2027' |
| planned_launch_date | DATE                  | NULL                     |                                    |
| actual_launch_date  | DATE                  | NULL                     |                                    |
| status              | pcp.production_status | NOT NULL DEFAULT 'draft' |                                    |
| metadata            | JSONB                 | NULL                     | Extra collection info              |
| created_at          | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()   |                                    |
| updated_at          | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()   |                                    |
| deleted_at          | TIMESTAMPTZ           | NULL                     |                                    |

```sql
CREATE INDEX idx_collections_status ON pcp.collections (status);
CREATE INDEX idx_collections_launch ON pcp.collections (planned_launch_date);
```

#### pcp.drops

| Column              | Type                  | Constraints                      | Description            |
| ------------------- | --------------------- | -------------------------------- | ---------------------- |
| id                  | UUID                  | PK                               |                        |
| collection_id       | UUID                  | NOT NULL, FK pcp.collections(id) | Parent collection      |
| name                | VARCHAR(255)          | NOT NULL                         | e.g., 'Drop 13'        |
| slug                | VARCHAR(255)          | NOT NULL, UNIQUE                 |                        |
| description         | TEXT                  | NULL                             |                        |
| planned_launch_date | DATE                  | NULL                             |                        |
| actual_launch_date  | DATE                  | NULL                             |                        |
| status              | pcp.production_status | NOT NULL DEFAULT 'draft'         |                        |
| waitlist_count      | INTEGER               | NOT NULL DEFAULT 0               | Pre-registration count |
| metadata            | JSONB                 | NULL                             |                        |
| created_at          | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()           |                        |
| updated_at          | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()           |                        |

```sql
CREATE INDEX idx_drops_collection ON pcp.drops (collection_id);
CREATE INDEX idx_drops_status ON pcp.drops (status);
CREATE INDEX idx_drops_launch ON pcp.drops (planned_launch_date);
```

#### pcp.production_orders

| Column             | Type                  | Constraints                                | Description                                                         |
| ------------------ | --------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| id                 | UUID                  | PK                                         |                                                                     |
| collection_id      | UUID                  | NOT NULL, FK pcp.collections(id)           |                                                                     |
| drop_id            | UUID                  | NULL, FK pcp.drops(id)                     | Nullable — not all OPs belong to a drop                             |
| name               | VARCHAR(255)          | NOT NULL                                   | OP name / description                                               |
| description        | TEXT                  | NULL                                       |                                                                     |
| sku_id             | UUID                  | NOT NULL, FK erp.skus(id)                  | Which SKU is being produced                                         |
| quantity           | INTEGER               | NOT NULL, CHECK (quantity > 0)             | How many units                                                      |
| current_stage      | pcp.stage_type        | NOT NULL DEFAULT 'concept'                 | Current production stage                                            |
| status             | pcp.production_status | NOT NULL DEFAULT 'draft'                   | draft, in_progress, paused, completed, cancelled                    |
| planned_start_date | DATE                  | NULL                                       |                                                                     |
| planned_end_date   | DATE                  | NULL                                       |                                                                     |
| actual_start_date  | DATE                  | NULL                                       |                                                                     |
| actual_end_date    | DATE                  | NULL                                       |                                                                     |
| safety_margin_days | INTEGER               | NOT NULL DEFAULT 3                         | Buffer days per stage                                               |
| op_type            | pcp.op_type           | NOT NULL DEFAULT 'standard'                | standard or pilot (Pandora96 pilot lot)                             |
| pilot_qty          | INTEGER               | NULL, CHECK (pilot_qty BETWEEN 50 AND 100) | Fixed qty for pilot OPs (50-100 units). NULL for standard OPs       |
| pilot_status       | pcp.pilot_status      | NULL                                       | pending_data, champion, monitor, discontinue. NULL for standard OPs |
| pilot_sell_through | NUMERIC(5,2)          | NULL                                       | Sell-through % after 48-72h for pilot OPs                           |
| notes              | TEXT                  | NULL                                       |                                                                     |
| created_at         | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()                     |                                                                     |
| updated_at         | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()                     |                                                                     |

```sql
CREATE INDEX idx_prod_orders_collection ON pcp.production_orders (collection_id);
CREATE INDEX idx_prod_orders_drop ON pcp.production_orders (drop_id) WHERE drop_id IS NOT NULL;
CREATE INDEX idx_prod_orders_sku ON pcp.production_orders (sku_id);
CREATE INDEX idx_prod_orders_status ON pcp.production_orders (status);
CREATE INDEX idx_prod_orders_stage ON pcp.production_orders (current_stage);
CREATE INDEX idx_prod_orders_planned_end ON pcp.production_orders (planned_end_date);
CREATE INDEX idx_prod_orders_pilot ON pcp.production_orders (op_type) WHERE op_type = 'pilot';
```

#### pcp.production_stages

| Column                 | Type             | Constraints                                              | Description                                                                                                      |
| ---------------------- | ---------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| id                     | UUID             | PK                                                       |                                                                                                                  |
| production_order_id    | UUID             | NOT NULL, FK pcp.production_orders(id) ON DELETE CASCADE |                                                                                                                  |
| stage_type             | pcp.stage_type   | NOT NULL                                                 | concept, pattern, sample, approval, size_grading, material_purchase, cutting, sewing, finishing, qc, stock_entry |
| status                 | pcp.stage_status | NOT NULL DEFAULT 'pending'                               | pending, in_progress, completed, skipped                                                                         |
| sequence               | INTEGER          | NOT NULL                                                 | Order within the production flow (1-11)                                                                          |
| planned_start          | DATE             | NULL                                                     |                                                                                                                  |
| planned_end            | DATE             | NULL                                                     |                                                                                                                  |
| actual_start           | DATE             | NULL                                                     |                                                                                                                  |
| actual_end             | DATE             | NULL                                                     |                                                                                                                  |
| safety_margin_consumed | BOOLEAN          | NOT NULL DEFAULT FALSE                                   | TRUE when actual_end > planned_end                                                                               |
| assigned_supplier_id   | UUID             | NULL, FK pcp.suppliers(id)                               | Supplier doing this stage                                                                                        |
| cost                   | NUMERIC(12,2)    | NULL                                                     | Cost incurred at this stage                                                                                      |
| notes                  | TEXT             | NULL                                                     |                                                                                                                  |
| completed_by           | UUID             | NULL, FK global.users(id)                                | Who marked complete                                                                                              |
| created_at             | TIMESTAMPTZ      | NOT NULL DEFAULT NOW()                                   |                                                                                                                  |
| updated_at             | TIMESTAMPTZ      | NOT NULL DEFAULT NOW()                                   |                                                                                                                  |

```sql
CREATE INDEX idx_prod_stages_order ON pcp.production_stages (production_order_id);
CREATE INDEX idx_prod_stages_type ON pcp.production_stages (stage_type);
CREATE INDEX idx_prod_stages_status ON pcp.production_stages (status);
CREATE INDEX idx_prod_stages_supplier ON pcp.production_stages (assigned_supplier_id) WHERE assigned_supplier_id IS NOT NULL;
CREATE UNIQUE INDEX idx_prod_stages_unique ON pcp.production_stages (production_order_id, stage_type);
```

#### pcp.suppliers

| Column               | Type              | Constraints            | Description                                                              |
| -------------------- | ----------------- | ---------------------- | ------------------------------------------------------------------------ |
| id                   | UUID              | PK                     |                                                                          |
| name                 | VARCHAR(255)      | NOT NULL               | Company name                                                             |
| type                 | pcp.supplier_type | NOT NULL               | factory, weaving_mill, print_shop, dyeing_mill, trim_supplier, packaging |
| contact_name         | VARCHAR(255)      | NULL                   | Primary contact person                                                   |
| contact_phone        | VARCHAR(20)       | NULL                   |                                                                          |
| contact_email        | VARCHAR(255)      | NULL                   |                                                                          |
| address              | TEXT              | NULL                   | Full address                                                             |
| cnpj                 | VARCHAR(18)       | NULL, UNIQUE           | Brazilian company ID (00.000.000/0000-00)                                |
| reliability_score    | INTEGER           | NOT NULL DEFAULT 50    | 0-100, calculated from delivery history                                  |
| avg_delay_days       | NUMERIC(5,1)      | NOT NULL DEFAULT 0     | Average days late (negative = early)                                     |
| total_orders         | INTEGER           | NOT NULL DEFAULT 0     | Total production stages assigned                                         |
| on_time_deliveries   | INTEGER           | NOT NULL DEFAULT 0     | Stages completed on time                                                 |
| quality_rating       | NUMERIC(3,2)      | NOT NULL DEFAULT 3.00  | 1.00-5.00 scale                                                          |
| communication_rating | NUMERIC(3,2)      | NOT NULL DEFAULT 3.00  | 1.00-5.00 scale                                                          |
| cost_rating          | NUMERIC(3,2)      | NOT NULL DEFAULT 3.00  | 1.00-5.00 scale                                                          |
| notes                | TEXT              | NULL                   |                                                                          |
| is_active            | BOOLEAN           | NOT NULL DEFAULT TRUE  |                                                                          |
| created_at           | TIMESTAMPTZ       | NOT NULL DEFAULT NOW() |                                                                          |
| updated_at           | TIMESTAMPTZ       | NOT NULL DEFAULT NOW() |                                                                          |
| deleted_at           | TIMESTAMPTZ       | NULL                   |                                                                          |

```sql
CREATE INDEX idx_suppliers_type ON pcp.suppliers (type);
CREATE INDEX idx_suppliers_active ON pcp.suppliers (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_suppliers_reliability ON pcp.suppliers (reliability_score DESC);
CREATE UNIQUE INDEX idx_suppliers_cnpj ON pcp.suppliers (cnpj) WHERE cnpj IS NOT NULL AND deleted_at IS NULL;
```

#### pcp.supplier_contacts

| Column      | Type         | Constraints                                      | Description                              |
| ----------- | ------------ | ------------------------------------------------ | ---------------------------------------- |
| id          | UUID         | PK                                               |                                          |
| supplier_id | UUID         | NOT NULL, FK pcp.suppliers(id) ON DELETE CASCADE |                                          |
| name        | VARCHAR(255) | NOT NULL                                         | Contact person name                      |
| role        | VARCHAR(100) | NULL                                             | e.g., 'vendas', 'producao', 'financeiro' |
| phone       | VARCHAR(20)  | NULL                                             |                                          |
| email       | VARCHAR(255) | NULL                                             |                                          |
| is_primary  | BOOLEAN      | NOT NULL DEFAULT FALSE                           |                                          |
| notes       | TEXT         | NULL                                             |                                          |
| created_at  | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                           |                                          |

```sql
CREATE INDEX idx_supplier_contacts_supplier ON pcp.supplier_contacts (supplier_id);
```

#### pcp.supplier_ratings

| Column              | Type        | Constraints                        | Description                        |
| ------------------- | ----------- | ---------------------------------- | ---------------------------------- |
| id                  | UUID        | PK                                 |                                    |
| supplier_id         | UUID        | NOT NULL, FK pcp.suppliers(id)     |                                    |
| production_stage_id | UUID        | NULL, FK pcp.production_stages(id) | Related stage                      |
| quality_score       | INTEGER     | NOT NULL, CHECK (1-5)              |                                    |
| communication_score | INTEGER     | NOT NULL, CHECK (1-5)              |                                    |
| cost_score          | INTEGER     | NOT NULL, CHECK (1-5)              |                                    |
| delivery_days_delta | INTEGER     | NOT NULL DEFAULT 0                 | actual - planned (positive = late) |
| notes               | TEXT        | NULL                               |                                    |
| rated_by            | UUID        | NOT NULL, FK global.users(id)      |                                    |
| created_at          | TIMESTAMPTZ | NOT NULL DEFAULT NOW()             |                                    |

```sql
CREATE INDEX idx_supplier_ratings_supplier ON pcp.supplier_ratings (supplier_id);
CREATE INDEX idx_supplier_ratings_stage ON pcp.supplier_ratings (production_stage_id);
```

#### pcp.raw_materials

| Column                 | Type                      | Constraints                | Description                                        |
| ---------------------- | ------------------------- | -------------------------- | -------------------------------------------------- |
| id                     | UUID                      | PK                         |                                                    |
| name                   | VARCHAR(255)              | NOT NULL                   | e.g., 'Malha 30/1 Preta', 'Ziper YKK 20cm'         |
| category               | pcp.raw_material_category | NOT NULL                   | fabric, trim, label, packaging, thread, dye, other |
| unit                   | VARCHAR(20)               | NOT NULL                   | 'meters', 'units', 'kg', 'rolls'                   |
| description            | TEXT                      | NULL                       |                                                    |
| default_supplier_id    | UUID                      | NULL, FK pcp.suppliers(id) | Preferred supplier                                 |
| unit_cost              | NUMERIC(12,2)             | NOT NULL DEFAULT 0         | Latest known cost per unit                         |
| minimum_order_quantity | INTEGER                   | NOT NULL DEFAULT 0         | Supplier MOQ                                       |
| lead_time_days         | INTEGER                   | NOT NULL DEFAULT 0         | Typical supplier lead time                         |
| is_active              | BOOLEAN                   | NOT NULL DEFAULT TRUE      |                                                    |
| created_at             | TIMESTAMPTZ               | NOT NULL DEFAULT NOW()     |                                                    |
| updated_at             | TIMESTAMPTZ               | NOT NULL DEFAULT NOW()     |                                                    |

```sql
CREATE INDEX idx_raw_materials_category ON pcp.raw_materials (category);
CREATE INDEX idx_raw_materials_supplier ON pcp.raw_materials (default_supplier_id);
CREATE INDEX idx_raw_materials_active ON pcp.raw_materials (is_active) WHERE is_active = TRUE;
```

#### pcp.raw_material_stock

| Column             | Type          | Constraints                                | Description             |
| ------------------ | ------------- | ------------------------------------------ | ----------------------- |
| id                 | UUID          | PK                                         |                         |
| raw_material_id    | UUID          | NOT NULL, FK pcp.raw_materials(id), UNIQUE |                         |
| quantity_available | NUMERIC(12,2) | NOT NULL DEFAULT 0                         | Current stock (in unit) |
| quantity_reserved  | NUMERIC(12,2) | NOT NULL DEFAULT 0                         | Reserved for production |
| reorder_point      | NUMERIC(12,2) | NOT NULL DEFAULT 0                         | Alert threshold         |
| last_purchase_cost | NUMERIC(12,2) | NULL                                       | Cost from last purchase |
| last_purchase_at   | TIMESTAMPTZ   | NULL                                       |                         |
| updated_at         | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()                     |                         |

```sql
CREATE UNIQUE INDEX idx_rm_stock_material ON pcp.raw_material_stock (raw_material_id);
CREATE INDEX idx_rm_stock_low ON pcp.raw_material_stock (quantity_available) WHERE quantity_available <= reorder_point;
```

#### pcp.cost_analyses

| Column              | Type          | Constraints                        | Description                                  |
| ------------------- | ------------- | ---------------------------------- | -------------------------------------------- |
| id                  | UUID          | PK                                 |                                              |
| production_order_id | UUID          | NULL, FK pcp.production_orders(id) |                                              |
| sku_id              | UUID          | NOT NULL, FK erp.skus(id)          |                                              |
| raw_material_cost   | NUMERIC(12,2) | NOT NULL DEFAULT 0                 | Sum of materials                             |
| labor_cost          | NUMERIC(12,2) | NOT NULL DEFAULT 0                 | Factory labor                                |
| overhead_cost       | NUMERIC(12,2) | NOT NULL DEFAULT 0                 | Factory overhead, utilities                  |
| transport_cost      | NUMERIC(12,2) | NOT NULL DEFAULT 0                 | Inbound freight                              |
| total_cost_per_unit | NUMERIC(12,2) | NOT NULL                           | All costs / quantity                         |
| quantity            | INTEGER       | NOT NULL                           | Units produced                               |
| total_cost          | NUMERIC(12,2) | NOT NULL                           | total_cost_per_unit \* quantity              |
| is_pre_cost         | BOOLEAN       | NOT NULL DEFAULT TRUE              | TRUE = estimate (pré-custo), FALSE = actual  |
| breakdown           | JSONB         | NULL                               | `{ materials: [...], labor_details: {...} }` |
| notes               | TEXT          | NULL                               |                                              |
| created_at          | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()             |                                              |
| updated_at          | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()             |                                              |

```sql
CREATE INDEX idx_cost_analyses_order ON pcp.cost_analyses (production_order_id);
CREATE INDEX idx_cost_analyses_sku ON pcp.cost_analyses (sku_id);
CREATE INDEX idx_cost_analyses_pre ON pcp.cost_analyses (is_pre_cost);
```

#### pcp.product_bom (Pandora96-inspired — Bill of Materials)

> Links products to raw materials with quantity-per-unit. When a pilot SKU is identified as "champion", the system uses BOM to calculate material requirements for scale-up.

| Column          | Type          | Constraints                        | Description                                      |
| --------------- | ------------- | ---------------------------------- | ------------------------------------------------ |
| id              | UUID          | PK                                 |                                                  |
| product_id      | UUID          | NOT NULL, FK erp.products(id)      | Product this BOM belongs to                      |
| raw_material_id | UUID          | NOT NULL, FK pcp.raw_materials(id) | Raw material component                           |
| qty_per_unit    | NUMERIC(10,4) | NOT NULL                           | Amount of material per unit (e.g., 0.8 kg/piece) |
| unit            | VARCHAR(20)   | NOT NULL                           | kg, m, un, cm, etc.                              |
| notes           | TEXT          | NULL                               |                                                  |
| created_at      | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()             |                                                  |
| updated_at      | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()             |                                                  |
| deleted_at      | TIMESTAMPTZ   | NULL                               |                                                  |

```sql
CREATE UNIQUE INDEX idx_bom_product_material ON pcp.product_bom (product_id, raw_material_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bom_product ON pcp.product_bom (product_id);
CREATE INDEX idx_bom_material ON pcp.product_bom (raw_material_id);
```

#### pcp.internal_votes (Pandora96-inspired — Product Validation Layer 1)

> Team members vote (yes/no/maybe) on products during the approval stage. Minimum 3 votes required before proceeding.

| Column              | Type            | Constraints                            | Description           |
| ------------------- | --------------- | -------------------------------------- | --------------------- |
| id                  | UUID            | PK                                     |                       |
| production_order_id | UUID            | NOT NULL, FK pcp.production_orders(id) | OP being voted on     |
| user_id             | UUID            | NOT NULL, FK global.users(id)          | Team member who voted |
| vote                | pcp.vote_option | NOT NULL                               | yes, no, maybe        |
| comment             | TEXT            | NULL                                   | Optional reasoning    |
| created_at          | TIMESTAMPTZ     | NOT NULL DEFAULT NOW()                 |                       |

```sql
CREATE UNIQUE INDEX idx_votes_op_user ON pcp.internal_votes (production_order_id, user_id);
CREATE INDEX idx_votes_op ON pcp.internal_votes (production_order_id);
```

#### pcp.rework_orders

| Column              | Type              | Constraints                            | Description               |
| ------------------- | ----------------- | -------------------------------------- | ------------------------- |
| id                  | UUID              | PK                                     |                           |
| production_order_id | UUID              | NOT NULL, FK pcp.production_orders(id) | Source OP                 |
| supplier_id         | UUID              | NULL, FK pcp.suppliers(id)             | Supplier doing the rework |
| description         | TEXT              | NOT NULL                               | What needs to be fixed    |
| quantity            | INTEGER           | NOT NULL                               | Units needing rework      |
| status              | pcp.rework_status | NOT NULL DEFAULT 'pending'             |                           |
| sent_at             | TIMESTAMPTZ       | NULL                                   | Sent to supplier          |
| returned_at         | TIMESTAMPTZ       | NULL                                   | Returned from supplier    |
| completed_at        | TIMESTAMPTZ       | NULL                                   | Rework verified OK        |
| cost                | NUMERIC(12,2)     | NULL                                   | Rework cost               |
| notes               | TEXT              | NULL                                   |                           |
| created_at          | TIMESTAMPTZ       | NOT NULL DEFAULT NOW()                 |                           |
| updated_at          | TIMESTAMPTZ       | NOT NULL DEFAULT NOW()                 |                           |

```sql
CREATE INDEX idx_rework_prod_order ON pcp.rework_orders (production_order_id);
CREATE INDEX idx_rework_supplier ON pcp.rework_orders (supplier_id);
CREATE INDEX idx_rework_status ON pcp.rework_orders (status);
```

---

### 4.6 Schema: `whatsapp`

#### whatsapp.templates

| Column           | Type                     | Constraints              | Description                             |
| ---------------- | ------------------------ | ------------------------ | --------------------------------------- |
| id               | UUID                     | PK                       |                                         |
| name             | VARCHAR(255)             | NOT NULL                 | Template identifier                     |
| language         | VARCHAR(10)              | NOT NULL DEFAULT 'pt_BR' |                                         |
| category         | VARCHAR(50)              | NOT NULL                 | 'transactional', 'marketing', 'utility' |
| status           | whatsapp.template_status | NOT NULL DEFAULT 'draft' |                                         |
| header_text      | TEXT                     | NULL                     |                                         |
| body_text        | TEXT                     | NOT NULL                 | Template body with {{variables}}        |
| footer_text      | TEXT                     | NULL                     |                                         |
| buttons          | JSONB                    | NULL                     | `[{ type, text, url/phone }]`           |
| meta_template_id | VARCHAR(255)             | NULL                     | Meta-approved template ID               |
| variables        | JSONB                    | NULL                     | `[{ index, description, example }]`     |
| created_at       | TIMESTAMPTZ              | NOT NULL DEFAULT NOW()   |                                         |
| updated_at       | TIMESTAMPTZ              | NOT NULL DEFAULT NOW()   |                                         |

```sql
CREATE INDEX idx_wa_templates_status ON whatsapp.templates (status);
CREATE INDEX idx_wa_templates_category ON whatsapp.templates (category);
```

#### whatsapp.message_logs

| Column          | Type                       | Constraints                         | Description               |
| --------------- | -------------------------- | ----------------------------------- | ------------------------- |
| id              | UUID                       | PK                                  |                           |
| conversation_id | UUID                       | NULL, FK whatsapp.conversations(id) |                           |
| contact_id      | UUID                       | NULL, FK crm.contacts(id)           |                           |
| phone           | VARCHAR(20)                | NOT NULL                            | Recipient phone           |
| direction       | whatsapp.message_direction | NOT NULL                            | inbound or outbound       |
| status          | whatsapp.message_status    | NOT NULL DEFAULT 'pending'          |                           |
| template_id     | UUID                       | NULL, FK whatsapp.templates(id)     | If template message       |
| body            | TEXT                       | NOT NULL                            | Message content           |
| media_url       | TEXT                       | NULL                                | Image/video/document URL  |
| meta_message_id | VARCHAR(255)               | NULL                                | Meta Cloud API message ID |
| error_code      | VARCHAR(50)                | NULL                                | Meta error code if failed |
| error_message   | TEXT                       | NULL                                |                           |
| sent_at         | TIMESTAMPTZ                | NULL                                |                           |
| delivered_at    | TIMESTAMPTZ                | NULL                                |                           |
| read_at         | TIMESTAMPTZ                | NULL                                |                           |
| created_at      | TIMESTAMPTZ                | NOT NULL DEFAULT NOW()              |                           |

```sql
CREATE INDEX idx_wa_messages_conversation ON whatsapp.message_logs (conversation_id);
CREATE INDEX idx_wa_messages_contact ON whatsapp.message_logs (contact_id);
CREATE INDEX idx_wa_messages_phone ON whatsapp.message_logs (phone);
CREATE INDEX idx_wa_messages_status ON whatsapp.message_logs (status);
CREATE INDEX idx_wa_messages_created ON whatsapp.message_logs (created_at DESC);
CREATE INDEX idx_wa_messages_meta_id ON whatsapp.message_logs (meta_message_id) WHERE meta_message_id IS NOT NULL;
```

#### whatsapp.conversations

| Column               | Type                         | Constraints                   | Description       |
| -------------------- | ---------------------------- | ----------------------------- | ----------------- |
| id                   | UUID                         | PK                            |                   |
| contact_id           | UUID                         | NOT NULL, FK crm.contacts(id) |                   |
| phone                | VARCHAR(20)                  | NOT NULL                      |                   |
| status               | whatsapp.conversation_status | NOT NULL DEFAULT 'open'       |                   |
| last_message_at      | TIMESTAMPTZ                  | NULL                          |                   |
| last_message_preview | TEXT                         | NULL                          | Truncated preview |
| unread_count         | INTEGER                      | NOT NULL DEFAULT 0            |                   |
| assigned_user_id     | UUID                         | NULL, FK global.users(id)     | Agent assigned    |
| closed_at            | TIMESTAMPTZ                  | NULL                          |                   |
| created_at           | TIMESTAMPTZ                  | NOT NULL DEFAULT NOW()        |                   |
| updated_at           | TIMESTAMPTZ                  | NOT NULL DEFAULT NOW()        |                   |

```sql
CREATE INDEX idx_wa_conversations_contact ON whatsapp.conversations (contact_id);
CREATE INDEX idx_wa_conversations_status ON whatsapp.conversations (status);
CREATE INDEX idx_wa_conversations_assigned ON whatsapp.conversations (assigned_user_id);
CREATE INDEX idx_wa_conversations_last_msg ON whatsapp.conversations (last_message_at DESC);
```

#### whatsapp.groups

| Column          | Type         | Constraints            | Description                         |
| --------------- | ------------ | ---------------------- | ----------------------------------- |
| id              | UUID         | PK                     |                                     |
| name            | VARCHAR(255) | NOT NULL               | e.g., 'VIP Drop 13'                 |
| description     | TEXT         | NULL                   |                                     |
| type            | VARCHAR(50)  | NOT NULL               | 'vip', 'creators', 'b2b', 'general' |
| invite_link     | TEXT         | NULL                   | Smart rotation link                 |
| max_members     | INTEGER      | NOT NULL DEFAULT 256   | WhatsApp group limit                |
| current_members | INTEGER      | NOT NULL DEFAULT 0     |                                     |
| is_active       | BOOLEAN      | NOT NULL DEFAULT TRUE  |                                     |
| metadata        | JSONB        | NULL                   |                                     |
| created_at      | TIMESTAMPTZ  | NOT NULL DEFAULT NOW() |                                     |
| updated_at      | TIMESTAMPTZ  | NOT NULL DEFAULT NOW() |                                     |

```sql
CREATE INDEX idx_wa_groups_type ON whatsapp.groups (type);
CREATE INDEX idx_wa_groups_active ON whatsapp.groups (is_active) WHERE is_active = TRUE;
```

---

### 4.7 Schema: `trocas`

#### trocas.exchange_requests

| Column              | Type                  | Constraints                      | Description                                         |
| ------------------- | --------------------- | -------------------------------- | --------------------------------------------------- |
| id                  | UUID                  | PK                               |                                                     |
| order_id            | UUID                  | NOT NULL, FK checkout.orders(id) | Original order                                      |
| contact_id          | UUID                  | NOT NULL, FK crm.contacts(id)    | Customer                                            |
| type                | trocas.request_type   | NOT NULL                         | exchange_size, exchange_color, store_credit, refund |
| status              | trocas.request_status | NOT NULL DEFAULT 'pending'       |                                                     |
| reason              | TEXT                  | NOT NULL                         | Customer reason                                     |
| internal_notes      | TEXT                  | NULL                             | Support/ops notes                                   |
| refund_amount       | NUMERIC(12,2)         | NULL                             | If refund type                                      |
| store_credit_amount | NUMERIC(12,2)         | NULL                             | If store_credit type                                |
| nfe_return_id       | UUID                  | NULL, FK erp.nfe_documents(id)   | Return NF-e                                         |
| ticket_id           | UUID                  | NULL, FK inbox.tickets(id)       | Source support ticket                               |
| approved_by         | UUID                  | NULL, FK global.users(id)        | Who approved                                        |
| approved_at         | TIMESTAMPTZ           | NULL                             |                                                     |
| completed_at        | TIMESTAMPTZ           | NULL                             |                                                     |
| created_at          | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()           |                                                     |
| updated_at          | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()           |                                                     |

```sql
CREATE INDEX idx_exchange_req_order ON trocas.exchange_requests (order_id);
CREATE INDEX idx_exchange_req_contact ON trocas.exchange_requests (contact_id);
CREATE INDEX idx_exchange_req_status ON trocas.exchange_requests (status);
CREATE INDEX idx_exchange_req_type ON trocas.exchange_requests (type);
CREATE INDEX idx_exchange_req_created ON trocas.exchange_requests (created_at DESC);
```

#### trocas.exchange_items

| Column              | Type        | Constraints                                                 | Description                  |
| ------------------- | ----------- | ----------------------------------------------------------- | ---------------------------- |
| id                  | UUID        | PK                                                          |                              |
| exchange_request_id | UUID        | NOT NULL, FK trocas.exchange_requests(id) ON DELETE CASCADE |                              |
| original_sku_id     | UUID        | NOT NULL, FK erp.skus(id)                                   | SKU being returned           |
| replacement_sku_id  | UUID        | NULL, FK erp.skus(id)                                       | SKU being sent (if exchange) |
| quantity            | INTEGER     | NOT NULL DEFAULT 1                                          |                              |
| reason_detail       | TEXT        | NULL                                                        | Item-level reason            |
| created_at          | TIMESTAMPTZ | NOT NULL DEFAULT NOW()                                      |                              |

```sql
CREATE INDEX idx_exchange_items_request ON trocas.exchange_items (exchange_request_id);
CREATE INDEX idx_exchange_items_original_sku ON trocas.exchange_items (original_sku_id);
CREATE INDEX idx_exchange_items_replacement_sku ON trocas.exchange_items (replacement_sku_id);
```

#### trocas.reverse_logistics

| Column              | Type                    | Constraints                               | Description               |
| ------------------- | ----------------------- | ----------------------------------------- | ------------------------- |
| id                  | UUID                    | PK                                        |                           |
| exchange_request_id | UUID                    | NOT NULL, FK trocas.exchange_requests(id) |                           |
| tracking_code       | VARCHAR(100)            | NULL                                      | Return shipping tracking  |
| status              | trocas.logistics_status | NOT NULL DEFAULT 'label_generated'        |                           |
| label_url           | TEXT                    | NULL                                      | Return shipping label PDF |
| carrier             | VARCHAR(100)            | NULL                                      |                           |
| melhor_envio_id     | VARCHAR(255)            | NULL                                      |                           |
| cost                | NUMERIC(12,2)           | NOT NULL DEFAULT 0                        | Reverse shipping cost     |
| collected_at        | TIMESTAMPTZ             | NULL                                      |                           |
| delivered_at        | TIMESTAMPTZ             | NULL                                      | Arrived at warehouse      |
| created_at          | TIMESTAMPTZ             | NOT NULL DEFAULT NOW()                    |                           |
| updated_at          | TIMESTAMPTZ             | NOT NULL DEFAULT NOW()                    |                           |

```sql
CREATE INDEX idx_reverse_logistics_request ON trocas.reverse_logistics (exchange_request_id);
CREATE INDEX idx_reverse_logistics_tracking ON trocas.reverse_logistics (tracking_code) WHERE tracking_code IS NOT NULL;
CREATE INDEX idx_reverse_logistics_status ON trocas.reverse_logistics (status);
```

---

### 4.8 Schema: `inbox`

#### inbox.tickets

| Column              | Type                  | Constraints                           | Description                            |
| ------------------- | --------------------- | ------------------------------------- | -------------------------------------- |
| id                  | UUID                  | PK                                    |                                        |
| ticket_number       | SERIAL                | NOT NULL, UNIQUE                      | Human-readable e.g., #T-1234           |
| contact_id          | UUID                  | NOT NULL, FK crm.contacts(id)         | Customer                               |
| assigned_to         | UUID                  | NULL, FK global.users(id)             | Support agent (Slimgust default)       |
| status              | inbox.ticket_status   | NOT NULL DEFAULT 'open'               |                                        |
| priority            | inbox.ticket_priority | NOT NULL DEFAULT 'medium'             |                                        |
| subject             | VARCHAR(255)          | NOT NULL                              |                                        |
| tags                | TEXT[]                | NULL                                  | e.g., ['troca', 'rastreamento', 'nfe'] |
| source              | inbox.message_source  | NOT NULL                              | whatsapp, email                        |
| order_id            | UUID                  | NULL, FK checkout.orders(id)          | Related order                          |
| exchange_request_id | UUID                  | NULL, FK trocas.exchange_requests(id) | Related exchange                       |
| first_response_at   | TIMESTAMPTZ           | NULL                                  | SLA tracking                           |
| resolved_at         | TIMESTAMPTZ           | NULL                                  |                                        |
| closed_at           | TIMESTAMPTZ           | NULL                                  |                                        |
| created_at          | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()                |                                        |
| updated_at          | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()                |                                        |

```sql
CREATE INDEX idx_tickets_contact ON inbox.tickets (contact_id);
CREATE INDEX idx_tickets_assigned ON inbox.tickets (assigned_to);
CREATE INDEX idx_tickets_status ON inbox.tickets (status);
CREATE INDEX idx_tickets_priority ON inbox.tickets (priority);
CREATE INDEX idx_tickets_order ON inbox.tickets (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_tickets_created ON inbox.tickets (created_at DESC);
CREATE INDEX idx_tickets_tags ON inbox.tickets USING GIN (tags);
CREATE INDEX idx_tickets_open ON inbox.tickets (status, created_at DESC) WHERE status NOT IN ('resolved', 'closed');
```

#### inbox.messages

| Column              | Type                 | Constraints                                      | Description                              |
| ------------------- | -------------------- | ------------------------------------------------ | ---------------------------------------- |
| id                  | UUID                 | PK                                               |                                          |
| ticket_id           | UUID                 | NOT NULL, FK inbox.tickets(id) ON DELETE CASCADE |                                          |
| sender_type         | VARCHAR(20)          | NOT NULL                                         | 'customer', 'agent', 'system'            |
| sender_id           | UUID                 | NULL                                             | user_id if agent, contact_id if customer |
| source              | inbox.message_source | NOT NULL                                         | whatsapp, email, internal_note           |
| body                | TEXT                 | NOT NULL                                         |                                          |
| attachments         | JSONB                | NULL                                             | `[{ url, filename, mime_type, size }]`   |
| whatsapp_message_id | UUID                 | NULL, FK whatsapp.message_logs(id)               | Link to WA log                           |
| created_at          | TIMESTAMPTZ          | NOT NULL DEFAULT NOW()                           |                                          |

```sql
CREATE INDEX idx_inbox_messages_ticket ON inbox.messages (ticket_id, created_at);
CREATE INDEX idx_inbox_messages_sender ON inbox.messages (sender_type, sender_id);
```

#### inbox.quick_replies

| Column      | Type         | Constraints                   | Description                             |
| ----------- | ------------ | ----------------------------- | --------------------------------------- |
| id          | UUID         | PK                            |                                         |
| title       | VARCHAR(255) | NOT NULL                      | Short label                             |
| body        | TEXT         | NOT NULL                      | Reply template with {{variables}}       |
| category    | VARCHAR(100) | NULL                          | e.g., 'tracking', 'exchange', 'general' |
| usage_count | INTEGER      | NOT NULL DEFAULT 0            |                                         |
| created_by  | UUID         | NOT NULL, FK global.users(id) |                                         |
| created_at  | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()        |                                         |
| updated_at  | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()        |                                         |

```sql
CREATE INDEX idx_quick_replies_category ON inbox.quick_replies (category);
```

---

### 4.9 Schema: `b2b`

#### b2b.retailers

| Column              | Type                | Constraints                | Description                    |
| ------------------- | ------------------- | -------------------------- | ------------------------------ |
| id                  | UUID                | PK                         |                                |
| company_name        | VARCHAR(255)        | NOT NULL                   | Store / brand name             |
| cnpj                | VARCHAR(18)         | NOT NULL, UNIQUE           | Brazilian company ID           |
| contact_name        | VARCHAR(255)        | NOT NULL                   | Primary contact                |
| contact_email       | VARCHAR(255)        | NOT NULL                   |                                |
| contact_phone       | VARCHAR(20)         | NOT NULL                   |                                |
| address             | JSONB               | NOT NULL                   | Full address                   |
| status              | b2b.retailer_status | NOT NULL DEFAULT 'pending' |                                |
| approved_by         | UUID                | NULL, FK global.users(id)  | Guilherme approves             |
| approved_at         | TIMESTAMPTZ         | NULL                       |                                |
| payment_terms       | TEXT                | NULL                       | e.g., 'PIX only', 'boleto 30d' |
| minimum_order_value | NUMERIC(12,2)       | NOT NULL DEFAULT 2000      | Minimum R$ per order           |
| discount_rate       | NUMERIC(5,2)        | NOT NULL DEFAULT 0         | Special discount %             |
| notes               | TEXT                | NULL                       |                                |
| total_orders        | INTEGER             | NOT NULL DEFAULT 0         |                                |
| total_spent         | NUMERIC(12,2)       | NOT NULL DEFAULT 0         |                                |
| last_order_at       | TIMESTAMPTZ         | NULL                       |                                |
| created_at          | TIMESTAMPTZ         | NOT NULL DEFAULT NOW()     |                                |
| updated_at          | TIMESTAMPTZ         | NOT NULL DEFAULT NOW()     |                                |
| deleted_at          | TIMESTAMPTZ         | NULL                       |                                |

```sql
CREATE UNIQUE INDEX idx_retailers_cnpj ON b2b.retailers (cnpj) WHERE deleted_at IS NULL;
CREATE INDEX idx_retailers_status ON b2b.retailers (status);
CREATE INDEX idx_retailers_total_spent ON b2b.retailers (total_spent DESC);
```

#### b2b.b2b_orders

| Column           | Type                   | Constraints                    | Description      |
| ---------------- | ---------------------- | ------------------------------ | ---------------- |
| id               | UUID                   | PK                             |                  |
| order_number     | SERIAL                 | NOT NULL, UNIQUE               | e.g., #B-0042    |
| retailer_id      | UUID                   | NOT NULL, FK b2b.retailers(id) |                  |
| status           | b2b.b2b_order_status   | NOT NULL DEFAULT 'pending'     |                  |
| subtotal         | NUMERIC(12,2)          | NOT NULL                       |                  |
| discount_amount  | NUMERIC(12,2)          | NOT NULL DEFAULT 0             |                  |
| shipping_cost    | NUMERIC(12,2)          | NOT NULL DEFAULT 0             |                  |
| total            | NUMERIC(12,2)          | NOT NULL                       |                  |
| payment_method   | b2b.b2b_payment_method | NOT NULL                       | pix or bank_slip |
| payment_id       | VARCHAR(255)           | NULL                           |                  |
| shipping_address | JSONB                  | NOT NULL                       |                  |
| nfe_id           | UUID                   | NULL, FK erp.nfe_documents(id) |                  |
| tracking_code    | VARCHAR(100)           | NULL                           |                  |
| shipped_at       | TIMESTAMPTZ            | NULL                           |                  |
| delivered_at     | TIMESTAMPTZ            | NULL                           |                  |
| notes            | TEXT                   | NULL                           |                  |
| created_at       | TIMESTAMPTZ            | NOT NULL DEFAULT NOW()         |                  |
| updated_at       | TIMESTAMPTZ            | NOT NULL DEFAULT NOW()         |                  |
| deleted_at       | TIMESTAMPTZ            | NULL                           |                  |

```sql
CREATE INDEX idx_b2b_orders_retailer ON b2b.b2b_orders (retailer_id);
CREATE INDEX idx_b2b_orders_status ON b2b.b2b_orders (status);
CREATE INDEX idx_b2b_orders_created ON b2b.b2b_orders (created_at DESC);
```

#### b2b.b2b_order_items

| Column       | Type          | Constraints                                       | Description     |
| ------------ | ------------- | ------------------------------------------------- | --------------- |
| id           | UUID          | PK                                                |                 |
| b2b_order_id | UUID          | NOT NULL, FK b2b.b2b_orders(id) ON DELETE CASCADE |                 |
| sku_id       | UUID          | NOT NULL, FK erp.skus(id)                         |                 |
| product_name | VARCHAR(255)  | NOT NULL                                          | Denormalized    |
| sku_code     | VARCHAR(50)   | NOT NULL                                          | Denormalized    |
| size         | VARCHAR(10)   | NOT NULL                                          |                 |
| color        | VARCHAR(50)   | NOT NULL                                          |                 |
| quantity     | INTEGER       | NOT NULL, CHECK (quantity > 0)                    |                 |
| unit_price   | NUMERIC(12,2) | NOT NULL                                          | Wholesale price |
| total_price  | NUMERIC(12,2) | NOT NULL                                          |                 |
| created_at   | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()                            |                 |

```sql
CREATE INDEX idx_b2b_order_items_order ON b2b.b2b_order_items (b2b_order_id);
CREATE INDEX idx_b2b_order_items_sku ON b2b.b2b_order_items (sku_id);
```

#### b2b.b2b_catalog

| Column           | Type          | Constraints                       | Description              |
| ---------------- | ------------- | --------------------------------- | ------------------------ |
| id               | UUID          | PK                                |                          |
| sku_id           | UUID          | NOT NULL, FK erp.skus(id), UNIQUE |                          |
| wholesale_price  | NUMERIC(12,2) | NOT NULL                          | Markup 2x-2.5x from cost |
| minimum_quantity | INTEGER       | NOT NULL DEFAULT 1                | Minimum units per SKU    |
| is_available     | BOOLEAN       | NOT NULL DEFAULT TRUE             | Visible in B2B portal    |
| created_at       | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()            |                          |
| updated_at       | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()            |                          |

```sql
CREATE UNIQUE INDEX idx_b2b_catalog_sku ON b2b.b2b_catalog (sku_id);
CREATE INDEX idx_b2b_catalog_available ON b2b.b2b_catalog (is_available) WHERE is_available = TRUE;
```

---

### 4.10 Schema: `creators`

> 📋 **DEPRIORITIZED** — Schema projetado mas não implementado no codebase atual. Código removido em 2026-03-31 (módulo deprioritized). Referência: `docs/archive/creators-schema.ts`. Será reimplementado quando Creators entrar na fila.

#### creators.coupons

| Column           | Type                 | Constraints            | Description                                                               |
| ---------------- | -------------------- | ---------------------- | ------------------------------------------------------------------------- |
| id               | UUID                 | PK                     |                                                                           |
| code             | VARCHAR(50)          | NOT NULL, UNIQUE       | e.g., 'MIBR10', 'CIENA20'                                                 |
| type             | creators.coupon_type | NOT NULL               | creator, campaign, vip                                                    |
| discount_percent | NUMERIC(5,2)         | NULL                   | e.g., 10.00 = 10% off. NULL if fixed amount.                              |
| discount_amount  | NUMERIC(12,2)        | NULL                   | Fixed discount in R$. NULL if percentage. One of percent/amount required. |
| max_uses         | INTEGER              | NULL                   | NULL = unlimited                                                          |
| current_uses     | INTEGER              | NOT NULL DEFAULT 0     |                                                                           |
| min_order_value  | NUMERIC(12,2)        | NULL                   | Minimum cart value                                                        |
| valid_from       | TIMESTAMPTZ          | NOT NULL DEFAULT NOW() |                                                                           |
| valid_until      | TIMESTAMPTZ          | NULL                   | NULL = no expiration                                                      |
| is_active        | BOOLEAN              | NOT NULL DEFAULT TRUE  |                                                                           |
| created_at       | TIMESTAMPTZ          | NOT NULL DEFAULT NOW() |                                                                           |
| updated_at       | TIMESTAMPTZ          | NOT NULL DEFAULT NOW() |                                                                           |

```sql
CREATE UNIQUE INDEX idx_coupons_code ON creators.coupons (code);
CREATE INDEX idx_coupons_type ON creators.coupons (type);
CREATE INDEX idx_coupons_active ON creators.coupons (is_active) WHERE is_active = TRUE;
```

#### creators.creators

| Column                  | Type                        | Constraints                       | Description                                                      |
| ----------------------- | --------------------------- | --------------------------------- | ---------------------------------------------------------------- |
| id                      | UUID                        | PK                                |                                                                  |
| user_id                 | UUID                        | NULL, FK global.users(id)         | For portal login. NULL for managed_by_staff creators.            |
| name                    | VARCHAR(255)                | NOT NULL                          |                                                                  |
| email                   | VARCHAR(255)                | NOT NULL                          |                                                                  |
| phone                   | VARCHAR(20)                 | NOT NULL                          |                                                                  |
| cpf                     | VARCHAR(14)                 | NOT NULL, UNIQUE                  | For anti-fraud: CPF buyer != CPF creator                         |
| bio                     | TEXT                        | NULL                              | Short bio (max 280 chars)                                        |
| profile_image_url       | TEXT                        | NULL                              |                                                                  |
| tier                    | creators.creator_tier       | NOT NULL DEFAULT 'seed'           | seed (8%), grow (10%), bloom (12%), core (15%)                   |
| commission_rate         | NUMERIC(5,2)                | NOT NULL DEFAULT 8.00             | Percentage of net revenue                                        |
| coupon_id               | UUID                        | NOT NULL, FK creators.coupons(id) | Creator's unique coupon                                          |
| total_sales_amount      | NUMERIC(12,2)               | NOT NULL DEFAULT 0                | Lifetime GMV                                                     |
| total_sales_count       | INTEGER                     | NOT NULL DEFAULT 0                | Lifetime sale count                                              |
| total_points            | INTEGER                     | NOT NULL DEFAULT 0                | loyalty points balance                                           |
| current_month_sales     | NUMERIC(12,2)               | NOT NULL DEFAULT 0                | For tier evaluation                                              |
| status                  | creators.creator_status     | NOT NULL DEFAULT 'pending'        |                                                                  |
| managed_by_staff        | BOOLEAN                     | NOT NULL DEFAULT FALSE            | White-glove: PM manages everything for this creator              |
| payment_preference      | creators.payment_preference | NOT NULL DEFAULT 'pix'            | Creator's preferred payment method (PM has final say)            |
| pix_key                 | VARCHAR(255)                | NULL                              | For PIX payout                                                   |
| pix_key_type            | creators.pix_key_type       | NULL                              | cpf, email, phone, random                                        |
| clothing_size           | VARCHAR(5)                  | NULL                              | PP, P, M, G, GG                                                  |
| birth_date              | DATE                        | NULL                              |                                                                  |
| discovery_source        | VARCHAR(100)                | NULL                              | How they found CIENA (instagram, tiktok, amigo, evento, outro)   |
| motivation              | TEXT                        | NULL                              | "Why do you want to represent CIENA?"                            |
| content_niches          | JSONB                       | NULL                              | e.g., ["streetwear", "lifestyle", "musica"]                      |
| content_types           | JSONB                       | NULL                              | e.g., ["reels", "stories", "tiktok"]                             |
| address                 | JSONB                       | NULL                              | `{ cep, street, number, complement, neighborhood, city, state }` |
| content_rights_accepted | BOOLEAN                     | NOT NULL DEFAULT FALSE            | Image/content rights waiver accepted                             |
| monthly_cap             | NUMERIC(12,2)               | NOT NULL DEFAULT 3000             | Anti-fraud: max R$3k/month                                       |
| referred_by_creator_id  | UUID                        | NULL, FK creators.creators(id)    | Referral tracking                                                |
| joined_at               | TIMESTAMPTZ                 | NULL                              | When status became 'active'                                      |
| last_sale_at            | TIMESTAMPTZ                 | NULL                              |                                                                  |
| tier_evaluated_at       | TIMESTAMPTZ                 | NULL                              | Last tier recalculation                                          |
| created_at              | TIMESTAMPTZ                 | NOT NULL DEFAULT NOW()            |                                                                  |
| updated_at              | TIMESTAMPTZ                 | NOT NULL DEFAULT NOW()            |                                                                  |

```sql
CREATE UNIQUE INDEX idx_creators_cpf ON creators.creators (cpf);
CREATE INDEX idx_creators_user ON creators.creators (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_creators_tier ON creators.creators (tier);
CREATE INDEX idx_creators_status ON creators.creators (status);
CREATE INDEX idx_creators_coupon ON creators.creators (coupon_id);
CREATE INDEX idx_creators_total_sales ON creators.creators (total_sales_amount DESC);
CREATE INDEX idx_creators_referred_by ON creators.creators (referred_by_creator_id) WHERE referred_by_creator_id IS NOT NULL;
CREATE INDEX idx_creators_managed ON creators.creators (managed_by_staff) WHERE managed_by_staff = TRUE;
```

#### creators.sales_attributions

| Column              | Type          | Constraints                        | Description                              |
| ------------------- | ------------- | ---------------------------------- | ---------------------------------------- |
| id                  | UUID          | PK                                 |                                          |
| creator_id          | UUID          | NOT NULL, FK creators.creators(id) |                                          |
| order_id            | UUID          | NOT NULL, FK checkout.orders(id)   |                                          |
| coupon_id           | UUID          | NOT NULL, FK creators.coupons(id)  |                                          |
| order_total         | NUMERIC(12,2) | NOT NULL                           | Order total at time of sale              |
| discount_given      | NUMERIC(12,2) | NOT NULL                           | Discount amount from coupon              |
| commission_base     | NUMERIC(12,2) | NOT NULL                           | Net revenue (order_total - discount)     |
| commission_rate     | NUMERIC(5,2)  | NOT NULL                           | Rate at time of sale                     |
| commission_amount   | NUMERIC(12,2) | NOT NULL                           | commission_base \* commission_rate / 100 |
| buyer_cpf_hash      | VARCHAR(64)   | NOT NULL                           | SHA-256 of buyer CPF (anti-fraud)        |
| is_valid            | BOOLEAN       | NOT NULL DEFAULT TRUE              | FALSE if flagged as fraud                |
| validated_at        | TIMESTAMPTZ   | NULL                               | After 7-day exchange window              |
| invalidation_reason | TEXT          | NULL                               | If flagged                               |
| created_at          | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()             |                                          |

```sql
CREATE INDEX idx_sales_attr_creator ON creators.sales_attributions (creator_id);
CREATE INDEX idx_sales_attr_order ON creators.sales_attributions (order_id);
CREATE INDEX idx_sales_attr_valid ON creators.sales_attributions (is_valid, validated_at);
CREATE INDEX idx_sales_attr_created ON creators.sales_attributions (created_at DESC);
```

#### creators.points_ledger

| Column         | Type                   | Constraints                        | Description                                                                |
| -------------- | ---------------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| id             | UUID                   | PK                                 |                                                                            |
| creator_id     | UUID                   | NOT NULL, FK creators.creators(id) |                                                                            |
| points         | INTEGER                | NOT NULL                           | Positive = earned, negative = spent/deducted                               |
| action_type    | creators.points_action | NOT NULL                           | sale, post, challenge, referral, engagement, manual_adjustment, tier_bonus |
| reference_type | VARCHAR(100)           | NULL                               | 'order', 'ugc_post', 'challenge_submission', 'creator'                     |
| reference_id   | UUID                   | NULL                               | FK to source record                                                        |
| description    | TEXT                   | NULL                               | Human-readable description                                                 |
| created_at     | TIMESTAMPTZ            | NOT NULL DEFAULT NOW()             | Immutable ledger                                                           |

```sql
CREATE INDEX idx_points_ledger_creator ON creators.points_ledger (creator_id);
CREATE INDEX idx_points_ledger_action ON creators.points_ledger (action_type);
CREATE INDEX idx_points_ledger_created ON creators.points_ledger (created_at DESC);
```

> **Note:** points_ledger is append-only. Current balance derived from `SUM(points) WHERE creator_id = ?`. Denormalized into `creators.creators.total_points`.

#### creators.challenges

| Column        | Type                      | Constraints              | Description                             |
| ------------- | ------------------------- | ------------------------ | --------------------------------------- |
| id            | UUID                      | PK                       |                                         |
| name          | VARCHAR(255)              | NOT NULL                 | e.g., 'Drop 13 Challenge'               |
| description   | TEXT                      | NOT NULL                 |                                         |
| type          | creators.challenge_type   | NOT NULL                 | drop, style, community, viral, surprise |
| status        | creators.challenge_status | NOT NULL DEFAULT 'draft' |                                         |
| points_reward | INTEGER                   | NOT NULL                 | Points awarded on completion            |
| requirements  | JSONB                     | NOT NULL                 | `{ criteria, min_engagement, etc. }`    |
| starts_at     | TIMESTAMPTZ               | NOT NULL                 |                                         |
| ends_at       | TIMESTAMPTZ               | NOT NULL                 |                                         |
| max_winners   | INTEGER                   | NULL                     | NULL = unlimited                        |
| created_at    | TIMESTAMPTZ               | NOT NULL DEFAULT NOW()   |                                         |
| updated_at    | TIMESTAMPTZ               | NOT NULL DEFAULT NOW()   |                                         |

```sql
CREATE INDEX idx_challenges_status ON creators.challenges (status);
CREATE INDEX idx_challenges_dates ON creators.challenges (starts_at, ends_at);
```

#### creators.challenge_submissions

| Column         | Type                       | Constraints                          | Description                     |
| -------------- | -------------------------- | ------------------------------------ | ------------------------------- |
| id             | UUID                       | PK                                   |                                 |
| challenge_id   | UUID                       | NOT NULL, FK creators.challenges(id) |                                 |
| creator_id     | UUID                       | NOT NULL, FK creators.creators(id)   |                                 |
| status         | creators.submission_status | NOT NULL DEFAULT 'pending'           |                                 |
| proof_url      | TEXT                       | NOT NULL                             | Instagram post URL or evidence  |
| proof_metadata | JSONB                      | NULL                                 | Engagement metrics, screenshots |
| reviewed_by    | UUID                       | NULL, FK global.users(id)            |                                 |
| reviewed_at    | TIMESTAMPTZ                | NULL                                 |                                 |
| points_awarded | INTEGER                    | NOT NULL DEFAULT 0                   |                                 |
| notes          | TEXT                       | NULL                                 |                                 |
| created_at     | TIMESTAMPTZ                | NOT NULL DEFAULT NOW()               |                                 |
| updated_at     | TIMESTAMPTZ                | NOT NULL DEFAULT NOW()               |                                 |

```sql
CREATE INDEX idx_challenge_subs_challenge ON creators.challenge_submissions (challenge_id);
CREATE INDEX idx_challenge_subs_creator ON creators.challenge_submissions (creator_id);
CREATE INDEX idx_challenge_subs_status ON creators.challenge_submissions (status);
CREATE UNIQUE INDEX idx_challenge_subs_unique ON creators.challenge_submissions (challenge_id, creator_id);
```

#### creators.payouts

| Column              | Type                    | Constraints                        | Description                                          |
| ------------------- | ----------------------- | ---------------------------------- | ---------------------------------------------------- |
| id                  | UUID                    | PK                                 |                                                      |
| creator_id          | UUID                    | NOT NULL, FK creators.creators(id) |                                                      |
| period_start        | DATE                    | NOT NULL                           | First day of payout period                           |
| period_end          | DATE                    | NOT NULL                           | Last day of payout period                            |
| gross_amount        | NUMERIC(12,2)           | NOT NULL                           | Total commissions earned                             |
| deductions          | JSONB                   | NOT NULL DEFAULT '{}'              | `{ returns, fraud_flags, adjustments }`              |
| net_amount          | NUMERIC(12,2)           | NOT NULL                           | gross_amount - deductions                            |
| payment_method      | creators.payment_method | NOT NULL DEFAULT 'pix'             | pix, store_credit, product                           |
| status              | creators.payout_status  | NOT NULL DEFAULT 'pending'         |                                                      |
| pix_key             | VARCHAR(255)            | NULL                               | Snapshot of PIX key at payment time                  |
| pix_key_type        | creators.pix_key_type   | NULL                               | Snapshot of key type at payment time                 |
| pix_transaction_id  | VARCHAR(255)            | NULL                               | Bank transaction reference                           |
| store_credit_code   | VARCHAR(50)             | NULL                               | Shopify discount code (e.g., CREDIT-IGUIN-250)       |
| store_credit_amount | NUMERIC(12,2)           | NULL                               | Store credit value                                   |
| product_items       | JSONB                   | NULL                               | `[{ product_id, variant_id, name, quantity, cost }]` |
| product_total_cost  | NUMERIC(12,2)           | NULL                               | Total cost of product items                          |
| paid_at             | TIMESTAMPTZ             | NULL                               |                                                      |
| notes               | TEXT                    | NULL                               |                                                      |
| created_at          | TIMESTAMPTZ             | NOT NULL DEFAULT NOW()             |                                                      |
| updated_at          | TIMESTAMPTZ             | NOT NULL DEFAULT NOW()             |                                                      |

```sql
CREATE INDEX idx_payouts_creator ON creators.payouts (creator_id);
CREATE INDEX idx_payouts_status ON creators.payouts (status);
CREATE INDEX idx_payouts_method ON creators.payouts (payment_method);
CREATE INDEX idx_payouts_period ON creators.payouts (period_start, period_end);
CREATE UNIQUE INDEX idx_payouts_unique_period ON creators.payouts (creator_id, period_start, period_end);
```

#### creators.referrals

| Column        | Type        | Constraints                        | Description                                           |
| ------------- | ----------- | ---------------------------------- | ----------------------------------------------------- |
| id            | UUID        | PK                                 |                                                       |
| referrer_id   | UUID        | NOT NULL, FK creators.creators(id) | Creator who referred                                  |
| referred_id   | UUID        | NOT NULL, FK creators.creators(id) | Creator who was referred                              |
| referral_code | VARCHAR(50) | NOT NULL                           | Code used to track referral                           |
| status        | VARCHAR(20) | NOT NULL DEFAULT 'pending'         | pending, confirmed (referred creator made first sale) |
| confirmed_at  | TIMESTAMPTZ | NULL                               | When referred creator's first sale confirmed          |
| created_at    | TIMESTAMPTZ | NOT NULL DEFAULT NOW()             |                                                       |

```sql
CREATE INDEX idx_referrals_referrer ON creators.referrals (referrer_id);
CREATE INDEX idx_referrals_referred ON creators.referrals (referred_id);
CREATE UNIQUE INDEX idx_referrals_unique ON creators.referrals (referrer_id, referred_id);
```

#### creators.social_accounts

| Column      | Type                     | Constraints                        | Description                                           |
| ----------- | ------------------------ | ---------------------------------- | ----------------------------------------------------- |
| id          | UUID                     | PK                                 |                                                       |
| creator_id  | UUID                     | NOT NULL, FK creators.creators(id) |                                                       |
| platform    | creators.social_platform | NOT NULL                           | instagram, tiktok, youtube, pinterest, twitter, other |
| handle      | VARCHAR(100)             | NOT NULL                           | Without @ prefix (or URL for YouTube)                 |
| url         | VARCHAR(500)             | NULL                               | Full profile URL                                      |
| followers   | INTEGER                  | NULL                               | Updated by social-sync job                            |
| is_primary  | BOOLEAN                  | NOT NULL DEFAULT FALSE             | Primary platform for this creator                     |
| verified_at | TIMESTAMPTZ              | NULL                               | When handle was verified via API                      |
| created_at  | TIMESTAMPTZ              | NOT NULL DEFAULT NOW()             |                                                       |
| updated_at  | TIMESTAMPTZ              | NOT NULL DEFAULT NOW()             |                                                       |

```sql
CREATE UNIQUE INDEX idx_social_accounts_platform_handle ON creators.social_accounts (platform, handle);
CREATE INDEX idx_social_accounts_creator ON creators.social_accounts (creator_id);
CREATE INDEX idx_social_accounts_primary ON creators.social_accounts (creator_id, is_primary) WHERE is_primary = TRUE;
```

#### creators.content_detections

| Column           | Type                       | Constraints                        | Description                                    |
| ---------------- | -------------------------- | ---------------------------------- | ---------------------------------------------- |
| id               | UUID                       | PK                                 |                                                |
| creator_id       | UUID                       | NOT NULL, FK creators.creators(id) |                                                |
| platform         | creators.social_platform   | NOT NULL                           | instagram, tiktok, youtube, etc.               |
| platform_post_id | VARCHAR(255)               | NOT NULL                           | IG media ID, TikTok video ID, etc.             |
| post_url         | TEXT                       | NOT NULL                           |                                                |
| post_type        | creators.content_post_type | NOT NULL                           | post, story, reel, tiktok, youtube, live       |
| caption          | TEXT                       | NULL                               |                                                |
| likes            | INTEGER                    | NULL DEFAULT 0                     |                                                |
| comments         | INTEGER                    | NULL DEFAULT 0                     |                                                |
| shares           | INTEGER                    | NULL DEFAULT 0                     |                                                |
| hashtag_matched  | VARCHAR(100)               | NULL                               | e.g., `#cienaxiguin10` if detected via hashtag |
| detected_at      | TIMESTAMPTZ                | NOT NULL DEFAULT NOW()             | When detected by polling job                   |
| posted_at        | TIMESTAMPTZ                | NULL                               | Original post timestamp                        |
| created_at       | TIMESTAMPTZ                | NOT NULL DEFAULT NOW()             |                                                |

```sql
CREATE UNIQUE INDEX idx_content_detect_post ON creators.content_detections (platform, platform_post_id);
CREATE INDEX idx_content_detect_creator ON creators.content_detections (creator_id);
CREATE INDEX idx_content_detect_platform ON creators.content_detections (platform, detected_at DESC);
CREATE INDEX idx_content_detect_hashtag ON creators.content_detections (hashtag_matched) WHERE hashtag_matched IS NOT NULL;
```

#### creators.campaigns

| Column              | Type                     | Constraints                   | Description                                     |
| ------------------- | ------------------------ | ----------------------------- | ----------------------------------------------- |
| id                  | UUID                     | PK                            |                                                 |
| name                | VARCHAR(255)             | NOT NULL                      | e.g., 'Drop 10 Seeding'                         |
| campaign_type       | creators.campaign_type   | NOT NULL                      | seeding, paid, gifting, reward                  |
| status              | creators.campaign_status | NOT NULL DEFAULT 'draft'      | draft, active, completed, cancelled             |
| brief               | JSONB                    | NULL                          | `{ deadline, format, hashtags, dos_and_donts }` |
| start_date          | DATE                     | NULL                          |                                                 |
| end_date            | DATE                     | NULL                          |                                                 |
| total_product_cost  | NUMERIC(12,2)            | NOT NULL DEFAULT 0            | Cost of products sent to creators               |
| total_shipping_cost | NUMERIC(12,2)            | NOT NULL DEFAULT 0            | Shipping costs for product delivery             |
| total_fee_cost      | NUMERIC(12,2)            | NOT NULL DEFAULT 0            | Fees paid to influencers (paid partnerships)    |
| total_reward_cost   | NUMERIC(12,2)            | NOT NULL DEFAULT 0            | Prize/reward costs                              |
| created_by          | UUID                     | NOT NULL, FK global.users(id) | PM/admin who created                            |
| created_at          | TIMESTAMPTZ              | NOT NULL DEFAULT NOW()        |                                                 |
| updated_at          | TIMESTAMPTZ              | NOT NULL DEFAULT NOW()        |                                                 |

> **Computed fields (not stored):** `total_cost` = sum of 4 cost columns. `total_gmv` = sum of sales_attributions for campaign creators during campaign period. `roi` = (total_gmv - total_cost) / total_cost × 100.

```sql
CREATE INDEX idx_campaigns_status ON creators.campaigns (status);
CREATE INDEX idx_campaigns_type ON creators.campaigns (campaign_type);
CREATE INDEX idx_campaigns_dates ON creators.campaigns (start_date, end_date);
```

#### creators.campaign_creators

| Column          | Type                     | Constraints                         | Description                           |
| --------------- | ------------------------ | ----------------------------------- | ------------------------------------- |
| id              | UUID                     | PK                                  |                                       |
| campaign_id     | UUID                     | NOT NULL, FK creators.campaigns(id) |                                       |
| creator_id      | UUID                     | NOT NULL, FK creators.creators(id)  |                                       |
| product_id      | UUID                     | NULL, FK erp.products(id)           | Product sent (for seeding/gifting)    |
| delivery_status | creators.delivery_status | NULL DEFAULT 'pending'              | pending, shipped, delivered, returned |
| product_cost    | NUMERIC(12,2)            | NULL DEFAULT 0                      | Cost of product for this creator      |
| shipping_cost   | NUMERIC(12,2)            | NULL DEFAULT 0                      | Shipping cost for this creator        |
| fee_amount      | NUMERIC(12,2)            | NULL DEFAULT 0                      | Fee paid to this creator              |
| notes           | TEXT                     | NULL                                |                                       |
| created_at      | TIMESTAMPTZ              | NOT NULL DEFAULT NOW()              |                                       |
| updated_at      | TIMESTAMPTZ              | NOT NULL DEFAULT NOW()              |                                       |

```sql
CREATE UNIQUE INDEX idx_campaign_creators_unique ON creators.campaign_creators (campaign_id, creator_id);
CREATE INDEX idx_campaign_creators_campaign ON creators.campaign_creators (campaign_id);
CREATE INDEX idx_campaign_creators_creator ON creators.campaign_creators (creator_id);
CREATE INDEX idx_campaign_creators_delivery ON creators.campaign_creators (delivery_status);
```

#### creators.campaign_briefs (Pandora96-inspired)

> Structured briefing documents attached to campaigns. Creators access these in their portal to understand content requirements.

| Column        | Type                    | Constraints                         | Description                                        |
| ------------- | ----------------------- | ----------------------------------- | -------------------------------------------------- |
| id            | UUID                    | PK                                  |                                                    |
| campaign_id   | UUID                    | NOT NULL, FK creators.campaigns(id) | Parent campaign                                    |
| title         | VARCHAR(255)            | NOT NULL                            | Brief title                                        |
| content_md    | TEXT                    | NOT NULL                            | Markdown-formatted guidelines                      |
| hashtags      | TEXT[]                  | NOT NULL DEFAULT '{}'               | Required hashtags for this campaign                |
| deadline      | TIMESTAMPTZ             | NULL                                | Content submission deadline                        |
| examples_json | JSONB                   | NULL                                | `[{ url, type, caption }]` — example content links |
| target_tiers  | creators.creator_tier[] | NULL                                | Which tiers receive this brief (NULL = all)        |
| created_by    | UUID                    | NOT NULL, FK global.users(id)       | PM who created the brief                           |
| created_at    | TIMESTAMPTZ             | NOT NULL DEFAULT NOW()              |                                                    |
| updated_at    | TIMESTAMPTZ             | NOT NULL DEFAULT NOW()              |                                                    |
| deleted_at    | TIMESTAMPTZ             | NULL                                |                                                    |

```sql
CREATE INDEX idx_briefs_campaign ON creators.campaign_briefs (campaign_id);
CREATE INDEX idx_briefs_deadline ON creators.campaign_briefs (deadline) WHERE deadline IS NOT NULL;
```

#### creators.gifting_log (Pandora96-inspired — Auto-Gifting)

> Tracks product gifts sent to top creators/ambassadors. Links to ERP for fulfillment.

| Column       | Type         | Constraints                        | Description                                                               |
| ------------ | ------------ | ---------------------------------- | ------------------------------------------------------------------------- |
| id           | UUID         | PK                                 |                                                                           |
| creator_id   | UUID         | NOT NULL, FK creators.creators(id) | Recipient creator                                                         |
| order_id     | UUID         | NULL, FK checkout.orders(id)       | Internal order created for fulfillment (if applicable)                    |
| product_id   | UUID         | NOT NULL, FK erp.products(id)      | Product gifted                                                            |
| sku_id       | UUID         | NULL, FK erp.skus(id)              | Specific variant (size/color)                                             |
| reason       | VARCHAR(255) | NOT NULL                           | 'monthly_top_performer', 'milestone_reward', 'campaign_seeding', 'manual' |
| campaign_id  | UUID         | NULL, FK creators.campaigns(id)    | If part of a campaign                                                     |
| created_by   | UUID         | NOT NULL, FK global.users(id)      | PM who approved the gift                                                  |
| shipped_at   | TIMESTAMPTZ  | NULL                               | When gift was shipped                                                     |
| delivered_at | TIMESTAMPTZ  | NULL                               | When gift was delivered                                                   |
| created_at   | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()             |                                                                           |

```sql
CREATE INDEX idx_gifting_creator ON creators.gifting_log (creator_id);
CREATE INDEX idx_gifting_campaign ON creators.gifting_log (campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_gifting_date ON creators.gifting_log (created_at DESC);
```

#### creators.creator_kit_downloads (Pandora96-inspired)

> Tracks which brand assets creators download from the portal.

| Column        | Type        | Constraints                        | Description          |
| ------------- | ----------- | ---------------------------------- | -------------------- |
| id            | UUID        | PK                                 |                      |
| creator_id    | UUID        | NOT NULL, FK creators.creators(id) |                      |
| asset_id      | UUID        | NOT NULL, FK dam.assets(id)        | DAM asset downloaded |
| downloaded_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW()             |                      |

```sql
CREATE INDEX idx_kit_downloads_creator ON creators.creator_kit_downloads (creator_id);
CREATE INDEX idx_kit_downloads_asset ON creators.creator_kit_downloads (asset_id);
```

---

### 4.11 Schema: `marketing`

#### marketing.ugc_posts

| Column             | Type                 | Constraints                    | Description                                      |
| ------------------ | -------------------- | ------------------------------ | ------------------------------------------------ |
| id                 | UUID                 | PK                             |                                                  |
| instagram_post_id  | VARCHAR(255)         | NOT NULL, UNIQUE               | Instagram Graph API post ID                      |
| instagram_username | VARCHAR(100)         | NOT NULL                       | Post author                                      |
| post_url           | TEXT                 | NOT NULL                       | Instagram permalink                              |
| media_type         | VARCHAR(20)          | NOT NULL                       | 'image', 'video', 'carousel'                     |
| media_url          | TEXT                 | NULL                           | Direct media URL                                 |
| caption            | TEXT                 | NULL                           | Post caption                                     |
| likes_count        | INTEGER              | NOT NULL DEFAULT 0             |                                                  |
| comments_count     | INTEGER              | NOT NULL DEFAULT 0             |                                                  |
| engagement_rate    | NUMERIC(5,2)         | NOT NULL DEFAULT 0             |                                                  |
| status             | marketing.ugc_status | NOT NULL DEFAULT 'detected'    | detected, curated, approved, rejected, published |
| curated_by         | UUID                 | NULL, FK global.users(id)      | Yuri/Sick                                        |
| approved_by        | UUID                 | NULL, FK global.users(id)      | Caio                                             |
| dam_asset_id       | UUID                 | NULL, FK dam.assets(id)        | If saved to DAM                                  |
| creator_id         | UUID                 | NULL, FK creators.creators(id) | If from a creator                                |
| tags               | TEXT[]               | NULL                           |                                                  |
| detected_at        | TIMESTAMPTZ          | NOT NULL DEFAULT NOW()         | When discovered by poller                        |
| created_at         | TIMESTAMPTZ          | NOT NULL DEFAULT NOW()         |                                                  |
| updated_at         | TIMESTAMPTZ          | NOT NULL DEFAULT NOW()         |                                                  |

```sql
CREATE UNIQUE INDEX idx_ugc_ig_post ON marketing.ugc_posts (instagram_post_id);
CREATE INDEX idx_ugc_status ON marketing.ugc_posts (status);
CREATE INDEX idx_ugc_username ON marketing.ugc_posts (instagram_username);
CREATE INDEX idx_ugc_engagement ON marketing.ugc_posts (engagement_rate DESC);
CREATE INDEX idx_ugc_creator ON marketing.ugc_posts (creator_id) WHERE creator_id IS NOT NULL;
CREATE INDEX idx_ugc_detected ON marketing.ugc_posts (detected_at DESC);
```

#### marketing.competitor_ads

| Column          | Type                  | Constraints            | Description                               |
| --------------- | --------------------- | ---------------------- | ----------------------------------------- |
| id              | UUID                  | PK                     |                                           |
| platform        | marketing.ad_platform | NOT NULL               | meta, google, tiktok                      |
| competitor_name | VARCHAR(255)          | NOT NULL               | e.g., 'Baw', 'Approve', 'High', 'Disturb' |
| ad_id           | VARCHAR(255)          | NOT NULL               | Platform ad ID                            |
| ad_url          | TEXT                  | NULL                   | Link to ad                                |
| creative_url    | TEXT                  | NULL                   | Screenshot / creative asset               |
| ad_format       | VARCHAR(50)           | NULL                   | 'image', 'video', 'carousel', 'story'     |
| copy_text       | TEXT                  | NULL                   | Ad copy                                   |
| started_at      | DATE                  | NULL                   | When ad started running                   |
| ended_at        | DATE                  | NULL                   | When ad stopped (NULL = still active)     |
| metadata        | JSONB                 | NULL                   | Extra data from Ad Library API            |
| created_at      | TIMESTAMPTZ           | NOT NULL DEFAULT NOW() |                                           |
| updated_at      | TIMESTAMPTZ           | NOT NULL DEFAULT NOW() |                                           |

```sql
CREATE INDEX idx_competitor_ads_competitor ON marketing.competitor_ads (competitor_name);
CREATE INDEX idx_competitor_ads_platform ON marketing.competitor_ads (platform);
CREATE UNIQUE INDEX idx_competitor_ads_unique ON marketing.competitor_ads (platform, ad_id);
CREATE INDEX idx_competitor_ads_started ON marketing.competitor_ads (started_at DESC);
```

#### marketing.campaign_metrics

| Column        | Type                  | Constraints            | Description                 |
| ------------- | --------------------- | ---------------------- | --------------------------- |
| id            | UUID                  | PK                     |                             |
| platform      | marketing.ad_platform | NOT NULL               |                             |
| campaign_id   | VARCHAR(255)          | NOT NULL               | Platform campaign ID        |
| campaign_name | VARCHAR(255)          | NOT NULL               |                             |
| date          | DATE                  | NOT NULL               | Metrics date                |
| impressions   | INTEGER               | NOT NULL DEFAULT 0     |                             |
| clicks        | INTEGER               | NOT NULL DEFAULT 0     |                             |
| spend         | NUMERIC(12,2)         | NOT NULL DEFAULT 0     | Ad spend in BRL             |
| conversions   | INTEGER               | NOT NULL DEFAULT 0     |                             |
| revenue       | NUMERIC(12,2)         | NOT NULL DEFAULT 0     | Attributed revenue          |
| roas          | NUMERIC(8,2)          | NOT NULL DEFAULT 0     | revenue / spend             |
| cpa           | NUMERIC(12,2)         | NOT NULL DEFAULT 0     | spend / conversions         |
| cpm           | NUMERIC(12,2)         | NOT NULL DEFAULT 0     | spend / impressions \* 1000 |
| ctr           | NUMERIC(5,2)          | NOT NULL DEFAULT 0     | clicks / impressions \* 100 |
| metadata      | JSONB                 | NULL                   | Full API response data      |
| created_at    | TIMESTAMPTZ           | NOT NULL DEFAULT NOW() |                             |

```sql
CREATE INDEX idx_campaign_metrics_platform ON marketing.campaign_metrics (platform);
CREATE INDEX idx_campaign_metrics_campaign ON marketing.campaign_metrics (campaign_id);
CREATE INDEX idx_campaign_metrics_date ON marketing.campaign_metrics (date DESC);
CREATE UNIQUE INDEX idx_campaign_metrics_unique ON marketing.campaign_metrics (platform, campaign_id, date);
```

#### marketing.creator_scouts

| Column               | Type         | Constraints                    | Description                                           |
| -------------------- | ------------ | ------------------------------ | ----------------------------------------------------- |
| id                   | UUID         | PK                             |                                                       |
| instagram_username   | VARCHAR(100) | NOT NULL                       |                                                       |
| full_name            | VARCHAR(255) | NULL                           |                                                       |
| followers_count      | INTEGER      | NOT NULL DEFAULT 0             |                                                       |
| engagement_rate      | NUMERIC(5,2) | NOT NULL DEFAULT 0             |                                                       |
| niche                | VARCHAR(100) | NULL                           | e.g., 'streetwear', 'lifestyle', 'fitness'            |
| city                 | VARCHAR(100) | NULL                           |                                                       |
| profile_url          | TEXT         | NOT NULL                       |                                                       |
| discovery_source     | VARCHAR(100) | NOT NULL                       | 'ad_library', 'hashtag', 'similar_creators', 'manual' |
| contacted            | BOOLEAN      | NOT NULL DEFAULT FALSE         |                                                       |
| converted_creator_id | UUID         | NULL, FK creators.creators(id) | If became a creator                                   |
| notes                | TEXT         | NULL                           |                                                       |
| created_at           | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()         |                                                       |
| updated_at           | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()         |                                                       |

```sql
CREATE UNIQUE INDEX idx_creator_scouts_ig ON marketing.creator_scouts (instagram_username);
CREATE INDEX idx_creator_scouts_engagement ON marketing.creator_scouts (engagement_rate DESC);
CREATE INDEX idx_creator_scouts_contacted ON marketing.creator_scouts (contacted);
```

#### marketing.experiments (Pandora96-inspired — Test Tracker)

> Accumulative knowledge base of A/B tests and experiments. Prevents repeating failed experiments and preserves winning patterns.

| Column         | Type                        | Constraints                   | Description                                                     |
| -------------- | --------------------------- | ----------------------------- | --------------------------------------------------------------- |
| id             | UUID                        | PK                            |                                                                 |
| hypothesis     | TEXT                        | NOT NULL                      | What we're testing and why                                      |
| channel        | VARCHAR(50)                 | NOT NULL                      | ads, email, whatsapp, checkout, social, product, pricing        |
| variant_a      | TEXT                        | NOT NULL                      | Description of control/variant A                                |
| variant_b      | TEXT                        | NOT NULL                      | Description of variant B                                        |
| result         | marketing.experiment_result | NOT NULL DEFAULT 'ongoing'    | a_won, b_won, inconclusive, ongoing                             |
| learning       | TEXT                        | NULL                          | Key takeaway from the experiment                                |
| metric_name    | VARCHAR(100)                | NULL                          | Primary metric measured (e.g., 'conversion_rate', 'ctr', 'aov') |
| metric_a_value | NUMERIC(12,4)               | NULL                          | Metric result for variant A                                     |
| metric_b_value | NUMERIC(12,4)               | NULL                          | Metric result for variant B                                     |
| started_at     | TIMESTAMPTZ                 | NOT NULL DEFAULT NOW()        |                                                                 |
| ended_at       | TIMESTAMPTZ                 | NULL                          |                                                                 |
| created_by     | UUID                        | NOT NULL, FK global.users(id) | Who registered the experiment                                   |
| created_at     | TIMESTAMPTZ                 | NOT NULL DEFAULT NOW()        |                                                                 |
| updated_at     | TIMESTAMPTZ                 | NOT NULL DEFAULT NOW()        |                                                                 |
| deleted_at     | TIMESTAMPTZ                 | NULL                          |                                                                 |

```sql
CREATE INDEX idx_experiments_channel ON marketing.experiments (channel);
CREATE INDEX idx_experiments_result ON marketing.experiments (result);
CREATE INDEX idx_experiments_date ON marketing.experiments (started_at DESC);
```

---

### 4.12 Schema: `tarefas`

#### tarefas.projects

| Column        | Type         | Constraints                            | Description                       |
| ------------- | ------------ | -------------------------------------- | --------------------------------- |
| id            | UUID         | PK                                     |                                   |
| name          | VARCHAR(255) | NOT NULL                               | e.g., 'Drop 13 Launch'            |
| description   | TEXT         | NULL                                   |                                   |
| owner_id      | UUID         | NOT NULL, FK global.users(id)          | Project owner (usually Caio)      |
| status        | VARCHAR(50)  | NOT NULL DEFAULT 'active'              | 'active', 'completed', 'archived' |
| color         | VARCHAR(7)   | NULL                                   | Hex color for UI                  |
| template_id   | UUID         | NULL, FK tarefas.project_templates(id) | If created from template          |
| drop_id       | UUID         | NULL, FK pcp.drops(id)                 | Linked drop                       |
| collection_id | UUID         | NULL, FK pcp.collections(id)           | Linked collection                 |
| starts_at     | DATE         | NULL                                   |                                   |
| ends_at       | DATE         | NULL                                   |                                   |
| metadata      | JSONB        | NULL                                   |                                   |
| created_at    | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                 |                                   |
| updated_at    | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                 |                                   |
| deleted_at    | TIMESTAMPTZ  | NULL                                   |                                   |

```sql
CREATE INDEX idx_projects_owner ON tarefas.projects (owner_id);
CREATE INDEX idx_projects_status ON tarefas.projects (status);
CREATE INDEX idx_projects_drop ON tarefas.projects (drop_id) WHERE drop_id IS NOT NULL;
```

#### tarefas.tasks

| Column              | Type                  | Constraints                        | Description                                         |
| ------------------- | --------------------- | ---------------------------------- | --------------------------------------------------- |
| id                  | UUID                  | PK                                 |                                                     |
| project_id          | UUID                  | NOT NULL, FK tarefas.projects(id)  |                                                     |
| parent_task_id      | UUID                  | NULL, FK tarefas.tasks(id)         | For subtasks                                        |
| title               | VARCHAR(500)          | NOT NULL                           |                                                     |
| description         | TEXT                  | NULL                               |                                                     |
| status              | tarefas.task_status   | NOT NULL DEFAULT 'backlog'         | backlog, todo, in_progress, review, done, cancelled |
| priority            | tarefas.task_priority | NOT NULL DEFAULT 'medium'          |                                                     |
| assigned_to         | UUID                  | NULL, FK global.users(id)          |                                                     |
| due_date            | DATE                  | NULL                               |                                                     |
| planned_start       | DATE                  | NULL                               | For Gantt view                                      |
| planned_end         | DATE                  | NULL                               | For Gantt view                                      |
| sort_order          | INTEGER               | NOT NULL DEFAULT 0                 | Drag-drop ordering                                  |
| production_order_id | UUID                  | NULL, FK pcp.production_orders(id) | PCP integration                                     |
| production_stage_id | UUID                  | NULL, FK pcp.production_stages(id) | PCP integration                                     |
| tags                | TEXT[]                | NULL                               |                                                     |
| created_at          | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()             |                                                     |
| updated_at          | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()             |                                                     |
| deleted_at          | TIMESTAMPTZ           | NULL                               |                                                     |

```sql
CREATE INDEX idx_tasks_project ON tarefas.tasks (project_id);
CREATE INDEX idx_tasks_assigned ON tarefas.tasks (assigned_to);
CREATE INDEX idx_tasks_status ON tarefas.tasks (status);
CREATE INDEX idx_tasks_due ON tarefas.tasks (due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_parent ON tarefas.tasks (parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX idx_tasks_prod_order ON tarefas.tasks (production_order_id) WHERE production_order_id IS NOT NULL;
CREATE INDEX idx_tasks_tags ON tarefas.tasks USING GIN (tags);
CREATE INDEX idx_tasks_sort ON tarefas.tasks (project_id, sort_order);
```

#### tarefas.task_comments

| Column     | Type        | Constraints                                      | Description                      |
| ---------- | ----------- | ------------------------------------------------ | -------------------------------- |
| id         | UUID        | PK                                               |                                  |
| task_id    | UUID        | NOT NULL, FK tarefas.tasks(id) ON DELETE CASCADE |                                  |
| user_id    | UUID        | NOT NULL, FK global.users(id)                    |                                  |
| body       | TEXT        | NOT NULL                                         | Comment text (supports markdown) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW()                           |                                  |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW()                           |                                  |

```sql
CREATE INDEX idx_task_comments_task ON tarefas.task_comments (task_id, created_at);
```

#### tarefas.task_attachments

| Column      | Type         | Constraints                                      | Description |
| ----------- | ------------ | ------------------------------------------------ | ----------- |
| id          | UUID         | PK                                               |             |
| task_id     | UUID         | NOT NULL, FK tarefas.tasks(id) ON DELETE CASCADE |             |
| uploaded_by | UUID         | NOT NULL, FK global.users(id)                    |             |
| file_name   | VARCHAR(255) | NOT NULL                                         |             |
| file_url    | TEXT         | NOT NULL                                         | R2/S3 URL   |
| file_size   | INTEGER      | NOT NULL                                         | Bytes       |
| mime_type   | VARCHAR(100) | NOT NULL                                         |             |
| created_at  | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                           |             |

```sql
CREATE INDEX idx_task_attachments_task ON tarefas.task_attachments (task_id);
```

#### tarefas.project_templates

| Column         | Type         | Constraints                   | Description                                              |
| -------------- | ------------ | ----------------------------- | -------------------------------------------------------- |
| id             | UUID         | PK                            |                                                          |
| name           | VARCHAR(255) | NOT NULL                      | e.g., 'Drop Launch Template'                             |
| description    | TEXT         | NULL                          |                                                          |
| tasks_template | JSONB        | NOT NULL                      | `[{ title, description, relative_days, assigned_role }]` |
| created_by     | UUID         | NOT NULL, FK global.users(id) |                                                          |
| created_at     | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()        |                                                          |
| updated_at     | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()        |                                                          |

#### tarefas.calendar_events

| Column      | Type               | Constraints                   | Description                               |
| ----------- | ------------------ | ----------------------------- | ----------------------------------------- |
| id          | UUID               | PK                            |                                           |
| title       | VARCHAR(255)       | NOT NULL                      |                                           |
| description | TEXT               | NULL                          |                                           |
| event_type  | tarefas.event_type | NOT NULL                      | drop_launch, campaign, content_post, etc. |
| starts_at   | TIMESTAMPTZ        | NOT NULL                      |                                           |
| ends_at     | TIMESTAMPTZ        | NULL                          | NULL = all-day or point-in-time           |
| all_day     | BOOLEAN            | NOT NULL DEFAULT FALSE        |                                           |
| project_id  | UUID               | NULL, FK tarefas.projects(id) |                                           |
| task_id     | UUID               | NULL, FK tarefas.tasks(id)    |                                           |
| assigned_to | UUID               | NULL, FK global.users(id)     | Primary responsible                       |
| color       | VARCHAR(7)         | NULL                          | Override color                            |
| metadata    | JSONB              | NULL                          |                                           |
| created_at  | TIMESTAMPTZ        | NOT NULL DEFAULT NOW()        |                                           |
| updated_at  | TIMESTAMPTZ        | NOT NULL DEFAULT NOW()        |                                           |

```sql
CREATE INDEX idx_calendar_events_dates ON tarefas.calendar_events (starts_at, ends_at);
CREATE INDEX idx_calendar_events_type ON tarefas.calendar_events (event_type);
CREATE INDEX idx_calendar_events_assigned ON tarefas.calendar_events (assigned_to);
CREATE INDEX idx_calendar_events_project ON tarefas.calendar_events (project_id) WHERE project_id IS NOT NULL;
```

---

### 4.13 Schema: `clawdbot`

#### clawdbot.report_schedules

| Column          | Type                      | Constraints              | Description                                                                           |
| --------------- | ------------------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| id              | UUID                      | PK                       |                                                                                       |
| name            | VARCHAR(255)              | NOT NULL                 | e.g., 'Daily Sales Report'                                                            |
| discord_channel | VARCHAR(100)              | NOT NULL                 | e.g., '#report-vendas'                                                                |
| frequency       | clawdbot.report_frequency | NOT NULL                 | daily, weekly, monthly, on_demand                                                     |
| cron_expression | VARCHAR(100)              | NULL                     | e.g., '0 8 \* \* \*' (daily 08:00)                                                    |
| report_type     | VARCHAR(100)              | NOT NULL                 | 'sales', 'inventory', 'financial', 'production', 'marketing', 'commercial', 'support' |
| llm_model       | clawdbot.llm_model        | NOT NULL DEFAULT 'haiku' | haiku for structured, sonnet for analysis                                             |
| query_template  | TEXT                      | NOT NULL                 | SQL template or query identifier                                                      |
| format_template | TEXT                      | NULL                     | Discord message format template                                                       |
| is_active       | BOOLEAN                   | NOT NULL DEFAULT TRUE    |                                                                                       |
| last_run_at     | TIMESTAMPTZ               | NULL                     |                                                                                       |
| created_at      | TIMESTAMPTZ               | NOT NULL DEFAULT NOW()   |                                                                                       |
| updated_at      | TIMESTAMPTZ               | NOT NULL DEFAULT NOW()   |                                                                                       |

```sql
CREATE INDEX idx_report_schedules_active ON clawdbot.report_schedules (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_report_schedules_frequency ON clawdbot.report_schedules (frequency);
```

#### clawdbot.report_logs

| Column             | Type                   | Constraints                                | Description           |
| ------------------ | ---------------------- | ------------------------------------------ | --------------------- |
| id                 | UUID                   | PK                                         |                       |
| schedule_id        | UUID                   | NOT NULL, FK clawdbot.report_schedules(id) |                       |
| status             | clawdbot.report_status | NOT NULL DEFAULT 'pending'                 |                       |
| discord_message_id | VARCHAR(255)           | NULL                                       | Posted message ID     |
| query_result       | JSONB                  | NULL                                       | Raw query data        |
| formatted_message  | TEXT                   | NULL                                       | Final Discord message |
| llm_model_used     | clawdbot.llm_model     | NULL                                       | Actual model used     |
| llm_tokens_used    | INTEGER                | NULL                                       | Token count           |
| execution_time_ms  | INTEGER                | NULL                                       | Total execution time  |
| error_message      | TEXT                   | NULL                                       | If failed             |
| created_at         | TIMESTAMPTZ            | NOT NULL DEFAULT NOW()                     |                       |

```sql
CREATE INDEX idx_report_logs_schedule ON clawdbot.report_logs (schedule_id);
CREATE INDEX idx_report_logs_status ON clawdbot.report_logs (status);
CREATE INDEX idx_report_logs_created ON clawdbot.report_logs (created_at DESC);
```

#### clawdbot.chat_history

| Column           | Type               | Constraints            | Description                    |
| ---------------- | ------------------ | ---------------------- | ------------------------------ |
| id               | UUID               | PK                     |                                |
| discord_user_id  | VARCHAR(255)       | NOT NULL               | Discord user snowflake ID      |
| discord_username | VARCHAR(255)       | NOT NULL               |                                |
| discord_channel  | VARCHAR(100)       | NOT NULL               | Usually '#geral-ia'            |
| message_type     | VARCHAR(20)        | NOT NULL               | 'user_message', 'bot_response' |
| content          | TEXT               | NOT NULL               | Message content                |
| llm_model_used   | clawdbot.llm_model | NULL                   | For bot responses              |
| llm_tokens_used  | INTEGER            | NULL                   |                                |
| query_executed   | TEXT               | NULL                   | SQL query if data was fetched  |
| created_at       | TIMESTAMPTZ        | NOT NULL DEFAULT NOW() |                                |

```sql
CREATE INDEX idx_chat_history_user ON clawdbot.chat_history (discord_user_id);
CREATE INDEX idx_chat_history_channel ON clawdbot.chat_history (discord_channel);
CREATE INDEX idx_chat_history_created ON clawdbot.chat_history (created_at DESC);
```

---

### 4.14 Schema: `dashboard`

#### dashboard.dashboard_configs

| Column     | Type         | Constraints                   | Description                                               |
| ---------- | ------------ | ----------------------------- | --------------------------------------------------------- |
| id         | UUID         | PK                            |                                                           |
| user_id    | UUID         | NOT NULL, FK global.users(id) | Owner (personalized dashboards)                           |
| name       | VARCHAR(255) | NOT NULL                      | e.g., 'Marcus Overview', 'Pedro Financial'                |
| layout     | JSONB        | NOT NULL                      | Widget positions and sizes: `[{ widget_id, x, y, w, h }]` |
| is_default | BOOLEAN      | NOT NULL DEFAULT FALSE        | Default dashboard for this user                           |
| created_at | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()        |                                                           |
| updated_at | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()        |                                                           |

```sql
CREATE INDEX idx_dashboard_configs_user ON dashboard.dashboard_configs (user_id);
CREATE INDEX idx_dashboard_configs_default ON dashboard.dashboard_configs (user_id) WHERE is_default = TRUE;
```

#### dashboard.widgets

| Column                   | Type                  | Constraints                                                    | Description                                         |
| ------------------------ | --------------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| id                       | UUID                  | PK                                                             |                                                     |
| dashboard_id             | UUID                  | NOT NULL, FK dashboard.dashboard_configs(id) ON DELETE CASCADE |                                                     |
| type                     | dashboard.widget_type | NOT NULL                                                       | metric_card, line_chart, bar_chart, etc.            |
| title                    | VARCHAR(255)          | NOT NULL                                                       | Widget display title                                |
| data_source              | VARCHAR(255)          | NOT NULL                                                       | Query or endpoint identifier                        |
| config                   | JSONB                 | NOT NULL                                                       | Widget-specific config: filters, time range, colors |
| refresh_interval_seconds | INTEGER               | NOT NULL DEFAULT 300                                           | 300 = 5min default                                  |
| sort_order               | INTEGER               | NOT NULL DEFAULT 0                                             |                                                     |
| created_at               | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()                                         |                                                     |
| updated_at               | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()                                         |                                                     |

```sql
CREATE INDEX idx_widgets_dashboard ON dashboard.widgets (dashboard_id);
```

#### dashboard.war_room_sessions

| Column                 | Type                      | Constraints                   | Description                                         |
| ---------------------- | ------------------------- | ----------------------------- | --------------------------------------------------- |
| id                     | UUID                      | PK                            |                                                     |
| name                   | VARCHAR(255)              | NOT NULL                      | e.g., 'Drop 13 War Room'                            |
| drop_id                | UUID                      | NULL, FK pcp.drops(id)        | Linked drop                                         |
| status                 | dashboard.war_room_status | NOT NULL DEFAULT 'scheduled'  |                                                     |
| activated_by           | UUID                      | NOT NULL, FK global.users(id) | Marcus or Caio                                      |
| config                 | JSONB                     | NOT NULL                      | `{ sku_ids, comparison_drop_id, alert_thresholds }` |
| starts_at              | TIMESTAMPTZ               | NOT NULL                      |                                                     |
| ends_at                | TIMESTAMPTZ               | NULL                          | NULL = still active                                 |
| total_revenue          | NUMERIC(12,2)             | NOT NULL DEFAULT 0            | Running total                                       |
| total_orders           | INTEGER                   | NOT NULL DEFAULT 0            | Running count                                       |
| peak_orders_per_minute | INTEGER                   | NOT NULL DEFAULT 0            |                                                     |
| created_at             | TIMESTAMPTZ               | NOT NULL DEFAULT NOW()        |                                                     |
| updated_at             | TIMESTAMPTZ               | NOT NULL DEFAULT NOW()        |                                                     |

```sql
CREATE INDEX idx_war_room_status ON dashboard.war_room_sessions (status);
CREATE INDEX idx_war_room_drop ON dashboard.war_room_sessions (drop_id);
CREATE INDEX idx_war_room_dates ON dashboard.war_room_sessions (starts_at DESC);
```

---

### 4.15 Schema: `dam`

#### dam.assets

| Column           | Type         | Constraints                   | Description                                                           |
| ---------------- | ------------ | ----------------------------- | --------------------------------------------------------------------- |
| id               | UUID         | PK                            |                                                                       |
| name             | VARCHAR(255) | NOT NULL                      | File display name                                                     |
| file_name        | VARCHAR(255) | NOT NULL                      | Original filename                                                     |
| file_url         | TEXT         | NOT NULL                      | R2/S3 URL                                                             |
| thumbnail_url    | TEXT         | NULL                          | Generated thumbnail                                                   |
| mime_type        | VARCHAR(100) | NOT NULL                      | e.g., 'image/jpeg', 'video/mp4'                                       |
| file_size        | BIGINT       | NOT NULL                      | Bytes                                                                 |
| width            | INTEGER      | NULL                          | Pixels (images/video)                                                 |
| height           | INTEGER      | NULL                          | Pixels (images/video)                                                 |
| duration_seconds | INTEGER      | NULL                          | Video/audio duration                                                  |
| asset_type       | VARCHAR(50)  | NOT NULL                      | 'product_photo', 'kv', 'mockup', 'video', 'ugc', 'design', 'document' |
| status           | VARCHAR(50)  | NOT NULL DEFAULT 'draft'      | 'draft', 'approved', 'published', 'archived'                          |
| collection_id    | UUID         | NULL, FK pcp.collections(id)  | Associated collection                                                 |
| drop_id          | UUID         | NULL, FK pcp.drops(id)        | Associated drop                                                       |
| product_id       | UUID         | NULL, FK erp.products(id)     | Associated product                                                    |
| uploaded_by      | UUID         | NOT NULL, FK global.users(id) |                                                                       |
| approved_by      | UUID         | NULL, FK global.users(id)     |                                                                       |
| current_version  | INTEGER      | NOT NULL DEFAULT 1            |                                                                       |
| metadata         | JSONB        | NULL                          | EXIF, color profile, etc.                                             |
| created_at       | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()        |                                                                       |
| updated_at       | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()        |                                                                       |
| deleted_at       | TIMESTAMPTZ  | NULL                          |                                                                       |

```sql
CREATE INDEX idx_assets_type ON dam.assets (asset_type);
CREATE INDEX idx_assets_status ON dam.assets (status);
CREATE INDEX idx_assets_collection ON dam.assets (collection_id) WHERE collection_id IS NOT NULL;
CREATE INDEX idx_assets_drop ON dam.assets (drop_id) WHERE drop_id IS NOT NULL;
CREATE INDEX idx_assets_product ON dam.assets (product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_assets_uploaded_by ON dam.assets (uploaded_by);
CREATE INDEX idx_assets_not_deleted ON dam.assets (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_mime ON dam.assets (mime_type);
```

#### dam.asset_versions

| Column         | Type        | Constraints                                   | Description                  |
| -------------- | ----------- | --------------------------------------------- | ---------------------------- |
| id             | UUID        | PK                                            |                              |
| asset_id       | UUID        | NOT NULL, FK dam.assets(id) ON DELETE CASCADE |                              |
| version_number | INTEGER     | NOT NULL                                      | 1, 2, 3...                   |
| file_url       | TEXT        | NOT NULL                                      | This version's file URL      |
| file_size      | BIGINT      | NOT NULL                                      |                              |
| uploaded_by    | UUID        | NOT NULL, FK global.users(id)                 |                              |
| change_notes   | TEXT        | NULL                                          | What changed in this version |
| created_at     | TIMESTAMPTZ | NOT NULL DEFAULT NOW()                        |                              |

```sql
CREATE INDEX idx_asset_versions_asset ON dam.asset_versions (asset_id);
CREATE UNIQUE INDEX idx_asset_versions_unique ON dam.asset_versions (asset_id, version_number);
```

#### dam.asset_tags

| Column     | Type         | Constraints                                   | Description                                          |
| ---------- | ------------ | --------------------------------------------- | ---------------------------------------------------- |
| id         | UUID         | PK                                            |                                                      |
| asset_id   | UUID         | NOT NULL, FK dam.assets(id) ON DELETE CASCADE |                                                      |
| tag        | VARCHAR(100) | NOT NULL                                      | e.g., 'inverno', 'camiseta', 'lifestyle', 'flat_lay' |
| created_at | TIMESTAMPTZ  | NOT NULL DEFAULT NOW()                        |                                                      |

```sql
CREATE INDEX idx_asset_tags_asset ON dam.asset_tags (asset_id);
CREATE INDEX idx_asset_tags_tag ON dam.asset_tags (tag);
CREATE UNIQUE INDEX idx_asset_tags_unique ON dam.asset_tags (asset_id, tag);
```

---

### 4.16 Schema: `reviews`

#### reviews.reviews

| Column               | Type                  | Constraints                              | Description                       |
| -------------------- | --------------------- | ---------------------------------------- | --------------------------------- |
| id                   | UUID                  | PK, DEFAULT gen_random_uuid()            | UUID v7                           |
| product_id           | UUID                  | NOT NULL, FK erp.products(id)            | Reviewed product                  |
| contact_id           | UUID                  | NOT NULL, FK crm.contacts(id)            | Reviewer                          |
| order_id             | UUID                  | NULL, FK checkout.orders(id)             | Source order (verified purchase)  |
| rating               | INTEGER               | NOT NULL, CHECK (rating BETWEEN 1 AND 5) | 1-5 star rating                   |
| title                | VARCHAR(255)          | NULL                                     | Review title                      |
| body                 | TEXT                  | NULL                                     | Review body text                  |
| status               | reviews.review_status | NOT NULL DEFAULT 'pending'               | pending, approved, rejected       |
| is_verified_purchase | BOOLEAN               | NOT NULL DEFAULT FALSE                   | TRUE if order_id is set           |
| admin_response       | TEXT                  | NULL                                     | Admin/support response            |
| admin_response_by    | UUID                  | NULL, FK global.users(id)                | Who responded                     |
| admin_response_at    | TIMESTAMPTZ           | NULL                                     | When response was posted          |
| flagged_reason       | TEXT                  | NULL                                     | If auto-flagged (profanity, URLs) |
| helpful_count        | INTEGER               | NOT NULL DEFAULT 0                       | "Was this helpful?" counter       |
| created_at           | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()                   |                                   |
| updated_at           | TIMESTAMPTZ           | NOT NULL DEFAULT NOW()                   |                                   |
| deleted_at           | TIMESTAMPTZ           | NULL                                     | Soft delete                       |

```sql
CREATE UNIQUE INDEX idx_reviews_order_contact ON reviews.reviews (order_id, contact_id) WHERE order_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_reviews_product ON reviews.reviews (product_id);
CREATE INDEX idx_reviews_status ON reviews.reviews (status);
CREATE INDEX idx_reviews_rating ON reviews.reviews (product_id, rating);
CREATE INDEX idx_reviews_created ON reviews.reviews (created_at DESC);
```

#### reviews.review_media

| Column          | Type        | Constraints                                        | Description         |
| --------------- | ----------- | -------------------------------------------------- | ------------------- |
| id              | UUID        | PK                                                 |                     |
| review_id       | UUID        | NOT NULL, FK reviews.reviews(id) ON DELETE CASCADE |                     |
| type            | VARCHAR(10) | NOT NULL                                           | 'photo' or 'video'  |
| url             | TEXT        | NOT NULL                                           | R2 storage URL      |
| thumbnail_url   | TEXT        | NULL                                               | Generated thumbnail |
| file_size_bytes | INTEGER     | NOT NULL                                           | Max 5MB for photos  |
| sort_order      | INTEGER     | NOT NULL DEFAULT 0                                 | Display order       |
| created_at      | TIMESTAMPTZ | NOT NULL DEFAULT NOW()                             |                     |

```sql
CREATE INDEX idx_review_media_review ON reviews.review_media (review_id);
```

#### reviews.review_config

| Column                     | Type        | Constraints                 | Description                                 |
| -------------------------- | ----------- | --------------------------- | ------------------------------------------- |
| id                         | UUID        | PK                          | Singleton — only 1 row                      |
| request_delay_hours        | INTEGER     | NOT NULL DEFAULT 48         | Hours after delivery to send review request |
| cooldown_days              | INTEGER     | NOT NULL DEFAULT 30         | Min days between requests to same contact   |
| auto_approve_threshold     | INTEGER     | NOT NULL DEFAULT 4          | Auto-approve if rating >= this (0=disable)  |
| low_rating_alert_threshold | INTEGER     | NOT NULL DEFAULT 2          | Flare alert if rating <= this               |
| auto_reply_enabled         | BOOLEAN     | NOT NULL DEFAULT FALSE      | Reserved for future AI auto-reply           |
| request_channel            | VARCHAR(20) | NOT NULL DEFAULT 'whatsapp' | 'whatsapp', 'email', 'both'                 |
| updated_at                 | TIMESTAMPTZ | NOT NULL DEFAULT NOW()      |                                             |

#### reviews.review_requests

| Column       | Type        | Constraints                      | Description                |
| ------------ | ----------- | -------------------------------- | -------------------------- |
| id           | UUID        | PK                               |                            |
| order_id     | UUID        | NOT NULL, FK checkout.orders(id) |                            |
| contact_id   | UUID        | NOT NULL, FK crm.contacts(id)    |                            |
| channel      | VARCHAR(20) | NOT NULL                         | 'whatsapp' or 'email'      |
| sent_at      | TIMESTAMPTZ | NOT NULL DEFAULT NOW()           | When request was sent      |
| responded_at | TIMESTAMPTZ | NULL                             | When review was submitted  |
| review_id    | UUID        | NULL, FK reviews.reviews(id)     | Linked review if responded |
| created_at   | TIMESTAMPTZ | NOT NULL DEFAULT NOW()           |                            |

```sql
CREATE UNIQUE INDEX idx_review_requests_order_contact ON reviews.review_requests (order_id, contact_id);
CREATE INDEX idx_review_requests_contact ON reviews.review_requests (contact_id);
```

---

## 5. Key Relationships (Cross-Module Foreign Keys)

All foreign keys that cross schema boundaries:

| Source Table                                  | Column | Target Table                | Notes                            |
| --------------------------------------------- | ------ | --------------------------- | -------------------------------- |
| checkout.carts.contact_id                     | UUID   | crm.contacts.id             | Cart linked to CRM contact       |
| checkout.carts.coupon_id                      | UUID   | creators.coupons.id         | Applied coupon                   |
| checkout.cart_items.sku_id                    | UUID   | erp.skus.id                 | Product variant                  |
| checkout.orders.contact_id                    | UUID   | crm.contacts.id             | Buyer                            |
| checkout.orders.coupon_id                     | UUID   | creators.coupons.id         | Creator/campaign coupon          |
| checkout.orders.nfe_id                        | UUID   | erp.nfe_documents.id        | Linked NF-e                      |
| checkout.order_items.sku_id                   | UUID   | erp.skus.id                 | Product variant                  |
| checkout.abandoned_carts.contact_id           | UUID   | crm.contacts.id             | Identified contact               |
| checkout.abandoned_carts.recovered_order_id   | UUID   | checkout.orders.id          | Same schema but notable          |
| checkout.utm_tracking.contact_id              | UUID   | crm.contacts.id             | Attribution                      |
| checkout.utm_tracking.order_id                | UUID   | checkout.orders.id          | Conversion                       |
| crm.automation_runs.contact_id                | UUID   | crm.contacts.id             | Same schema                      |
| erp.nfe_documents.order_id                    | UUID   | checkout.orders.id          | NF-e for order                   |
| erp.inventory_movements.user_id               | UUID   | global.users.id             | Who triggered                    |
| pcp.production_orders.sku_id                  | UUID   | erp.skus.id                 | SKU being produced               |
| pcp.production_stages.assigned_supplier_id    | UUID   | pcp.suppliers.id            | Same schema                      |
| pcp.production_stages.completed_by            | UUID   | global.users.id             | Who marked complete              |
| pcp.supplier_ratings.rated_by                 | UUID   | global.users.id             | Who rated                        |
| pcp.raw_materials.default_supplier_id         | UUID   | pcp.suppliers.id            | Preferred supplier               |
| trocas.exchange_requests.order_id             | UUID   | checkout.orders.id          | Original order                   |
| trocas.exchange_requests.contact_id           | UUID   | crm.contacts.id             | Customer                         |
| trocas.exchange_requests.nfe_return_id        | UUID   | erp.nfe_documents.id        | Return NF-e                      |
| trocas.exchange_requests.ticket_id            | UUID   | inbox.tickets.id            | Source ticket                    |
| trocas.exchange_requests.approved_by          | UUID   | global.users.id             | Approver                         |
| trocas.exchange_items.original_sku_id         | UUID   | erp.skus.id                 | Returned SKU                     |
| trocas.exchange_items.replacement_sku_id      | UUID   | erp.skus.id                 | Replacement SKU                  |
| inbox.tickets.contact_id                      | UUID   | crm.contacts.id             | Customer                         |
| inbox.tickets.assigned_to                     | UUID   | global.users.id             | Agent                            |
| inbox.tickets.order_id                        | UUID   | checkout.orders.id          | Related order                    |
| inbox.tickets.exchange_request_id             | UUID   | trocas.exchange_requests.id | Related exchange                 |
| inbox.messages.whatsapp_message_id            | UUID   | whatsapp.message_logs.id    | WA message link                  |
| whatsapp.message_logs.contact_id              | UUID   | crm.contacts.id             | Recipient contact                |
| whatsapp.message_logs.conversation_id         | UUID   | whatsapp.conversations.id   | Same schema                      |
| whatsapp.conversations.contact_id             | UUID   | crm.contacts.id             | Conversation owner               |
| whatsapp.conversations.assigned_user_id       | UUID   | global.users.id             | Agent                            |
| b2b.b2b_orders.retailer_id                    | UUID   | b2b.retailers.id            | Same schema                      |
| b2b.b2b_orders.nfe_id                         | UUID   | erp.nfe_documents.id        | B2B NF-e                         |
| b2b.b2b_order_items.sku_id                    | UUID   | erp.skus.id                 | Product variant                  |
| b2b.b2b_catalog.sku_id                        | UUID   | erp.skus.id                 | Wholesale SKU                    |
| b2b.retailers.approved_by                     | UUID   | global.users.id             | Guilherme                        |
| creators.creators.user_id                     | UUID   | global.users.id             | Portal login                     |
| creators.creators.coupon_id                   | UUID   | creators.coupons.id         | Same schema                      |
| creators.creators.referred_by_creator_id      | UUID   | creators.creators.id        | Self-ref                         |
| creators.sales_attributions.creator_id        | UUID   | creators.creators.id        | Same schema                      |
| creators.sales_attributions.order_id          | UUID   | checkout.orders.id          | Attributed order                 |
| creators.sales_attributions.coupon_id         | UUID   | creators.coupons.id         | Same schema                      |
| creators.challenge_submissions.reviewed_by    | UUID   | global.users.id             | Reviewer                         |
| marketing.ugc_posts.curated_by                | UUID   | global.users.id             | Curator                          |
| marketing.ugc_posts.approved_by               | UUID   | global.users.id             | Approver                         |
| marketing.ugc_posts.dam_asset_id              | UUID   | dam.assets.id               | Saved asset                      |
| reviews.reviews.product_id                    | UUID   | erp.products.id             | Reviewed product                 |
| reviews.reviews.contact_id                    | UUID   | crm.contacts.id             | Reviewer                         |
| reviews.reviews.order_id                      | UUID   | checkout.orders.id          | Source order (verified purchase) |
| reviews.review_requests.order_id              | UUID   | checkout.orders.id          | Request source order             |
| reviews.review_requests.contact_id            | UUID   | crm.contacts.id             | Request recipient                |
| crm.widgets.template_id                       | UUID   | crm.widget_templates.id     | Widget source template           |
| crm.widgets.created_by                        | UUID   | global.users.id             | Widget creator                   |
| crm.widget_events.widget_id                   | UUID   | crm.widgets.id              | Event source widget              |
| crm.widget_events.contact_id                  | UUID   | crm.contacts.id             | Event contact (if known)         |
| marketing.ugc_posts.creator_id                | UUID   | creators.creators.id        | Creator author                   |
| marketing.creator_scouts.converted_creator_id | UUID   | creators.creators.id        | If converted                     |
| tarefas.projects.owner_id                     | UUID   | global.users.id             | Project owner                    |
| tarefas.projects.drop_id                      | UUID   | pcp.drops.id                | Linked drop                      |
| tarefas.projects.collection_id                | UUID   | pcp.collections.id          | Linked collection                |
| tarefas.tasks.assigned_to                     | UUID   | global.users.id             | Assignee                         |
| tarefas.tasks.production_order_id             | UUID   | pcp.production_orders.id    | PCP link                         |
| tarefas.tasks.production_stage_id             | UUID   | pcp.production_stages.id    | PCP link                         |
| tarefas.calendar_events.assigned_to           | UUID   | global.users.id             | Responsible                      |
| dashboard.war_room_sessions.drop_id           | UUID   | pcp.drops.id                | Monitored drop                   |
| dashboard.war_room_sessions.activated_by      | UUID   | global.users.id             | Who started                      |
| dam.assets.collection_id                      | UUID   | pcp.collections.id          | Associated collection            |
| dam.assets.drop_id                            | UUID   | pcp.drops.id                | Associated drop                  |
| dam.assets.product_id                         | UUID   | erp.products.id             | Associated product               |
| dam.assets.uploaded_by                        | UUID   | global.users.id             | Uploader                         |
| dam.assets.approved_by                        | UUID   | global.users.id             | Approver                         |

---

## 6. Indexes Strategy

Beyond primary keys and foreign key indexes (already defined per-table above), these are the critical additional indexes:

### 6.1 Composite Indexes for Common Queries

```sql
-- Orders by status + date (order list page)
CREATE INDEX idx_orders_status_date ON checkout.orders (status, created_at DESC) WHERE deleted_at IS NULL;

-- Contact purchase history
CREATE INDEX idx_orders_contact_date ON checkout.orders (contact_id, created_at DESC);

-- Inventory movements for a SKU over time
CREATE INDEX idx_inv_movements_sku_date ON erp.inventory_movements (sku_id, created_at DESC);

-- Production orders active by collection
CREATE INDEX idx_prod_orders_collection_status ON pcp.production_orders (collection_id, status) WHERE status IN ('in_progress', 'paused');

-- Tasks for a user by status (my tasks view)
CREATE INDEX idx_tasks_user_status ON tarefas.tasks (assigned_to, status) WHERE deleted_at IS NULL;

-- Creator sales in a date range
CREATE INDEX idx_sales_attr_creator_date ON creators.sales_attributions (creator_id, created_at DESC);
```

### 6.2 Partial Indexes for Filtered Queries

```sql
-- Only active users
CREATE INDEX idx_users_active ON global.users (id) WHERE is_active = TRUE;

-- Only unread notifications
CREATE INDEX idx_notifications_unread ON global.notifications (user_id) WHERE read_at IS NULL;

-- Only open tickets
CREATE INDEX idx_tickets_open_priority ON inbox.tickets (priority, created_at) WHERE status NOT IN ('resolved', 'closed');

-- Only pending payouts
CREATE INDEX idx_payouts_pending ON creators.payouts (creator_id) WHERE status = 'pending';

-- Only active war rooms
CREATE INDEX idx_war_room_active ON dashboard.war_room_sessions (id) WHERE status = 'active';

-- Only non-deleted orders
CREATE INDEX idx_orders_active ON checkout.orders (created_at DESC) WHERE deleted_at IS NULL;
```

### 6.3 Full-Text Search Indexes

See section 7 below.

---

## 7. Full-Text Search

### 7.1 Configuration

Use PostgreSQL `portuguese` text search configuration for proper stemming and stop words.

```sql
-- Verify Portuguese config exists
SELECT cfgname FROM pg_ts_config WHERE cfgname = 'portuguese';
```

### 7.2 Search Vector Columns

Add `search_vector TSVECTOR` to searchable tables and keep them updated via triggers.

```sql
-- erp.products: weighted search (name > description)
ALTER TABLE erp.products ADD COAmbaril search_vector TSVECTOR;

CREATE FUNCTION erp.products_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_search
  BEFORE INSERT OR UPDATE OF name, description ON erp.products
  FOR EACH ROW EXECUTE FUNCTION erp.products_search_trigger();

CREATE INDEX idx_products_fts ON erp.products USING GIN (search_vector);


-- erp.skus: search by SKU code
ALTER TABLE erp.skus ADD COAmbaril search_vector TSVECTOR;

CREATE FUNCTION erp.skus_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.sku_code, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.size, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.color, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_skus_search
  BEFORE INSERT OR UPDATE OF sku_code, size, color ON erp.skus
  FOR EACH ROW EXECUTE FUNCTION erp.skus_search_trigger();

CREATE INDEX idx_skus_fts ON erp.skus USING GIN (search_vector);


-- crm.contacts: search by name, email, CPF
ALTER TABLE crm.contacts ADD COAmbaril search_vector TSVECTOR;

CREATE FUNCTION crm.contacts_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.cpf, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.phone, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contacts_search
  BEFORE INSERT OR UPDATE OF name, email, cpf, phone ON crm.contacts
  FOR EACH ROW EXECUTE FUNCTION crm.contacts_search_trigger();

CREATE INDEX idx_contacts_fts ON crm.contacts USING GIN (search_vector);


-- creators.creators: search by name, instagram, coupon
ALTER TABLE creators.creators ADD COAmbaril search_vector TSVECTOR;

CREATE FUNCTION creators.creators_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.instagram_handle, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.email, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_creators_search
  BEFORE INSERT OR UPDATE OF name, instagram_handle, email ON creators.creators
  FOR EACH ROW EXECUTE FUNCTION creators.creators_search_trigger();

CREATE INDEX idx_creators_fts ON creators.creators USING GIN (search_vector);
```

### 7.3 Global Search Index

The `global.search_index` table serves as a materialized cross-module search view. Updated via triggers or application-level hooks on INSERT/UPDATE/DELETE of searchable entities.

```sql
-- Populate search_index from products
INSERT INTO global.search_index (id, resource_type, resource_id, title, subtitle, module, search_vector)
SELECT
  gen_random_uuid(),
  'product',
  p.id,
  p.name,
  string_agg(s.sku_code, ', '),
  'erp',
  setweight(to_tsvector('portuguese', p.name), 'A') ||
  setweight(to_tsvector('simple', string_agg(COALESCE(s.sku_code, ''), ' ')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(p.description, '')), 'C')
FROM erp.products p
LEFT JOIN erp.skus s ON s.product_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id;

-- Populate search_index from contacts
INSERT INTO global.search_index (id, resource_type, resource_id, title, subtitle, module, search_vector)
SELECT
  gen_random_uuid(),
  'contact',
  c.id,
  c.name,
  COALESCE(c.email, c.phone),
  'crm',
  setweight(to_tsvector('portuguese', c.name), 'A') ||
  setweight(to_tsvector('simple', COALESCE(c.email, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(c.cpf, '')), 'B')
FROM crm.contacts c
WHERE c.deleted_at IS NULL;
```

### 7.4 Search Query Pattern

```sql
-- Global search with ranking
SELECT
  resource_type,
  resource_id,
  title,
  subtitle,
  module,
  ts_rank(search_vector, query) AS rank
FROM global.search_index,
  plainto_tsquery('portuguese', 'camiseta preta') AS query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;
```

---

## 8. Migration Strategy

### 8.1 Tool

**Drizzle Kit** for all database migrations.

### 8.2 Naming Convention

```
migrations/
├── 0001_create_schemas.sql
├── 0002_create_enums.sql
├── 0003_global_users_roles_permissions.sql
├── 0004_global_audit_logs_notifications.sql
├── 0005_erp_products_skus_inventory.sql
├── 0006_crm_contacts_segments.sql
├── 0007_checkout_orders_carts.sql
├── 0008_pcp_collections_production.sql
├── 0009_pcp_suppliers_materials.sql
├── 0010_whatsapp_templates_messages.sql
├── 0011_trocas_exchanges.sql
├── 0012_inbox_tickets.sql
├── 0013_b2b_retailers_orders.sql
├── 0014_creators_program.sql
├── 0015_marketing_ugc_ads.sql
├── 0016_tarefas_projects_tasks.sql
├── 0017_clawdbot_reports.sql
├── 0018_dashboard_configs.sql
├── 0019_dam_assets.sql
├── 0020_global_search_index.sql
├── 0021_add_fts_triggers.sql
└── ...
```

Format: `NNNN_description.sql` — zero-padded 4-digit sequence, lowercase snake_case description.

### 8.3 Rules

1. **Forward-only.** No down migrations in production. Rollback by deploying a new forward migration that reverts changes.
2. **Idempotent.** Use `IF NOT EXISTS` / `IF EXISTS` where possible.
3. **Non-destructive.** Never `DROP COAmbaril` or `DROP TABLE` without a deprecation period. Instead: (a) add new column, (b) migrate data, (c) remove old column in a later migration.
4. **Small migrations.** One logical change per file. Do not combine unrelated schema changes.
5. **Tested.** Every migration runs against a Neon branch before production.

### 8.4 Neon Branching Workflow

```
main (production)
  ├── staging (QA — reset weekly from main)
  └── dev (development — reset daily from main)
       └── feature/xyz (per-feature branch — created ad hoc)
```

Migrations are developed on a Neon feature branch, tested on staging, then applied to main.

### 8.5 Seed Script

Development seed data lives in `packages/db/seed/`:

```
seed/
├── 01_users.ts         — 9 team members (Marcus, Caio, Tavares, Ana Clara, etc.)
├── 02_products.ts      — 20 products, 80 SKUs
├── 03_inventory.ts     — Inventory for all SKUs
├── 04_contacts.ts      — 200 contacts with realistic RFM distribution
├── 05_orders.ts        — 500 orders across 6 months
├── 06_collections.ts   — 3 collections, 5 drops
├── 07_production.ts    — 15 production orders with stages
├── 08_suppliers.ts     — 8 suppliers with ratings
├── 09_creators.ts      — 20 creators across 4 tiers
├── 10_coupons.ts       — 25 coupons (20 creator + 5 campaign)
├── 11_tickets.ts       — 50 support tickets
└── 12_dashboard.ts     — Default dashboard configs per user role
```

Run: `pnpm db:seed` (calls Drizzle seed runner).

---

## 9. Database Functions and Triggers

### 9.1 updated_at Auto-Update

Applied to every table with an `updated_at` column:

```sql
CREATE FUNCTION global.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Example: apply to all tables
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON global.users
  FOR EACH ROW EXECUTE FUNCTION global.update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON checkout.orders
  FOR EACH ROW EXECUTE FUNCTION global.update_updated_at();

-- ... repeat for all tables with updated_at
```

### 9.2 Inventory Sync Trigger

When an inventory_movement is inserted, update the inventory table:

```sql
CREATE FUNCTION erp.sync_inventory()
RETURNS trigger AS $$
BEGIN
  UPDATE erp.inventory
  SET
    quantity_available = quantity_available + NEW.quantity,
    last_entry_at = CASE WHEN NEW.quantity > 0 THEN NOW() ELSE last_entry_at END,
    last_exit_at = CASE WHEN NEW.quantity < 0 THEN NOW() ELSE last_exit_at END,
    updated_at = NOW()
  WHERE sku_id = NEW.sku_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_sync
  AFTER INSERT ON erp.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION erp.sync_inventory();
```

### 9.3 Order Number Sequence

```sql
-- Separate sequence for human-readable order numbers
CREATE SEQUENCE checkout.order_number_seq START 4500;
-- B2B orders have their own sequence
CREATE SEQUENCE b2b.b2b_order_number_seq START 1;
-- Tickets have their own sequence
CREATE SEQUENCE inbox.ticket_number_seq START 1;
```

---

## 10. Table Summary

| Schema    | Table Count | Key Tables                                                                                                                                                                     |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| global    | 6           | users, audit_logs, notifications, search_index                                                                                                                                 |
| checkout  | 7           | orders, order_items, carts, abandoned_carts                                                                                                                                    |
| crm       | 12          | contacts, segments, rfm_scores, automations, campaigns, widgets, widget_events, widget_templates, widget_metrics_daily                                                         |
| erp       | 8           | products, skus, inventory, nfe_documents, financial_transactions                                                                                                               |
| pcp       | 11          | production_orders, production_stages, suppliers, raw_materials                                                                                                                 |
| whatsapp  | 4           | templates, message_logs, conversations, groups                                                                                                                                 |
| trocas    | 3           | exchange_requests, exchange_items, reverse_logistics                                                                                                                           |
| inbox     | 3           | tickets, messages, quick_replies                                                                                                                                               |
| b2b       | 4           | retailers, b2b_orders, b2b_order_items, b2b_catalog                                                                                                                            |
| creators  | 12          | creators, coupons, sales_attributions, points_ledger, challenges, challenge_submissions, payouts, referrals, social_accounts, content_detections, campaigns, campaign_creators |
| marketing | 4           | ugc_posts, competitor_ads, campaign_metrics, creator_scouts                                                                                                                    |
| tarefas   | 6           | projects, tasks, task_comments, calendar_events                                                                                                                                |
| clawdbot  | 3           | report_schedules, report_logs, chat_history                                                                                                                                    |
| dashboard | 3           | dashboard_configs, widgets, war_room_sessions                                                                                                                                  |
| dam       | 3           | assets, asset_versions, asset_tags                                                                                                                                             |
| reviews   | 4           | reviews, review_media, review_config, review_requests                                                                                                                          |
| **Total** | **93**      |                                                                                                                                                                                |

---

_This document is the single source of truth for the Ambaril database schema. All schema changes must be reflected here before implementation. Update this document as part of every migration PR._
