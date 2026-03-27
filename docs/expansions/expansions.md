# Ambaril — Expansions Spec (E1-E11)

> **Version:** 1.0
> **Date:** March 2026
> **Status:** Approved (lower priority than 15 core modules)
> **References:** [DATABASE.md](../architecture/DATABASE.md), [API.md](../architecture/API.md), [AUTH.md](../architecture/AUTH.md), [NOTIFICATIONS.md](../platform/NOTIFICATIONS.md), [GLOSSARY.md](../dev/GLOSSARY.md)

---

## Summary Table

| # | Expansion | Host Module | Priority | Dependencies | Complexity | Target |
|---|-----------|-------------|----------|--------------|------------|--------|
| E1 | Waitlist + VIP Whitelist para Drops | Checkout + CRM | Medium | CRM contacts, PCP drops, WhatsApp Engine | Medium | v1.1 |
| E2 | Cloud Estoque / Split Delivery | Checkout + ERP | Medium | ERP inventory, PCP delivery estimates, Checkout flow | High | v1.1 |
| E3 | Alocacao de Estoque por Canal | ERP | Low | B2B at scale, drop data history, ERP inventory | High | v2.0 |
| E4 | Recomendacao de Tamanho | Checkout | Medium | ERP SKU size tables, Trocas exchange data | Medium | v1.2 |
| E5 | Pagina "Meu Pedido" | Public Frontend | Medium-High | ERP orders API, Trocas, NF-e | Low | v1.1 |
| E6 | Prova Social / UGC no Site | Frontend Shopify | Low-Medium | Marketing Intel UGC, DAM, Shopify embed | Medium | v1.2 |
| E7 | Gerador de Descricao de Produto | ERP / Internal Tool | Low | Claude API, ERP product catalog | Low | v1.2 |
| E8 | Precificacao Assistida por IA | ERP (Margin Calculator) | Low | ERP with 2-3 months of real data, Competitor Watch | Medium | v2.0 |
| E9 | Automacao de Fluxos / Workflow Engine | Platform-wide | Low-Medium | All core modules stable | Very High | v2.0 |
| E10 | WhatsApp Group Manager | WhatsApp Engine + CRM | Medium | WhatsApp Engine (Phase 1A) operacional | High | v2.0 |
| E11 | Reviews & Ratings | Checkout + CRM | Medium | CRM contacts, Checkout orders, On-Site widgets | Medium | v1.2 |
| E12 | Ambassador Program (standalone) | Creators | Low | Creators ambassador tier at scale (1k+ ambassadors) | High | v2.0+ |

---

## E1. Waitlist + VIP Whitelist para Drops

### 1. Overview

**What it does:** Enables pre-registration for upcoming drops (capturing email and WhatsApp) and gates the first 24 hours of a drop launch to VIP-whitelisted customers only. After 24h, the drop opens to the general public.

**Host modules:** Checkout + CRM

**Priority:** Medium — high impact on drop hype and demand calibration but not blocking core operations.

> **Pandora96 cross-ref:** Integrates with Checkout time-based coupons (Pandora96 insight). VIP waitlist registrants can receive time-limited coupons valid only during the VIP window (e.g., "VIPMADRUGADA" active 23h-5h on launch night). See Checkout spec R-TIME-COUPON.

**Business impact:**
- Pre-registration data feeds PCP demand planning: "1,200 people want the black jacket" calibrates production quantity
- VIP exclusivity reinforces brand positioning (Corteiz-style scarcity mechanics)
- WhatsApp launch notifications drive first-hour conversion
- Waitlist size is a leading indicator for production decisions

---

### 2. User Stories

| # | As a... | I want to... | So that... | Acceptance Criteria |
|---|---------|-------------|-----------|-------------------|
| US-01 | Visitor | Sign up for a waitlist for an upcoming drop | I get notified when the drop launches | Waitlist form captures name, email, phone (WhatsApp); creates `checkout.waitlist_entries` row; sends confirmation WhatsApp `wa_waitlist_confirmed` |
| US-02 | VIP customer | Access a drop during the exclusive 24h window | I can purchase limited items before the public | VIP gate checks `crm.contacts.is_vip = TRUE`; if VIP and within 24h window, proceed; if not VIP, show countdown + "Este drop e exclusivo para VIPs nas primeiras 24h" |
| US-03 | Non-VIP customer | See the drop page during the VIP window | I know the drop exists and when I can buy | Products visible with images/prices but "Comprar" button disabled; countdown timer to public opening; "Cadastre-se na waitlist" CTA |
| US-04 | PM (Caio) | See waitlist registration count per drop | I can share demand signals with PCP for production calibration | Waitlist dashboard: total registrants, breakdown by product/variant interest, daily registration trend chart |
| US-05 | Admin (Marcus) | Configure VIP whitelist rules per drop | I control who gets early access | Drop settings: toggle VIP-only mode, set VIP window duration (default 24h), manually add contacts to whitelist |
| US-06 | System | Send WhatsApp launch notifications to waitlist registrants | Registrants are notified the moment the drop goes live | On `drop.launched` event, batch-send `wa_drop_launch` template to all waitlist entries with `consent_whatsapp = TRUE` via WhatsApp Engine |

---

### 3. Data Model

#### checkout.waitlist_entries (new table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| drop_id | UUID | NOT NULL, FK pcp.drops(id) | Which drop |
| contact_id | UUID | NULL, FK crm.contacts(id) | Linked after CPF/email match |
| name | VARCHAR(255) | NOT NULL | Registrant name |
| email | VARCHAR(255) | NOT NULL | |
| phone | VARCHAR(20) | NOT NULL | WhatsApp number |
| product_interest | UUID | NULL, FK erp.products(id) | Specific product of interest (optional) |
| source | VARCHAR(50) | NOT NULL DEFAULT 'website' | website, instagram, whatsapp |
| notified_at | TIMESTAMPTZ | NULL | When launch notification was sent |
| converted_order_id | UUID | NULL, FK checkout.orders(id) | If registrant purchased |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE INDEX idx_waitlist_drop ON checkout.waitlist_entries (drop_id);
CREATE INDEX idx_waitlist_email ON checkout.waitlist_entries (email);
CREATE INDEX idx_waitlist_contact ON checkout.waitlist_entries (contact_id) WHERE contact_id IS NOT NULL;
CREATE UNIQUE INDEX idx_waitlist_drop_email ON checkout.waitlist_entries (drop_id, email);
```

#### checkout.vip_drop_access (new table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| drop_id | UUID | NOT NULL, FK pcp.drops(id) | |
| is_vip_only | BOOLEAN | NOT NULL DEFAULT TRUE | Toggle VIP gate |
| vip_window_hours | INTEGER | NOT NULL DEFAULT 24 | Hours of VIP exclusivity |
| vip_opens_at | TIMESTAMPTZ | NOT NULL | When VIP access starts |
| public_opens_at | TIMESTAMPTZ | NOT NULL | When public access starts (`vip_opens_at + vip_window_hours`) |
| whitelist_contact_ids | UUID[] | NOT NULL DEFAULT '{}' | Manually added contacts beyond is_vip |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE UNIQUE INDEX idx_vip_drop ON checkout.vip_drop_access (drop_id);
```

---

### 4. Screens & UI

#### Waitlist Registration Page (Public)

```
┌─────────────────────────────────────────────────┐
│                   CIENA                          │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │                                           │   │
│  │         [DROP HERO IMAGE]                 │   │
│  │         COLECAO NOTURNA                   │   │
│  │         Lanca em 15 Mar 2026              │   │
│  │                                           │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│   Seja o primeiro a saber.                       │
│   Cadastre-se e receba o aviso no WhatsApp.      │
│                                                  │
│   ┌──────────────────────────────────────┐       │
│   │ Nome                                 │       │
│   └──────────────────────────────────────┘       │
│   ┌──────────────────────────────────────┐       │
│   │ E-mail                               │       │
│   └──────────────────────────────────────┘       │
│   ┌──────────────────────────────────────┐       │
│   │ WhatsApp (DDD + numero)              │       │
│   └──────────────────────────────────────┘       │
│                                                  │
│   [ QUERO SER AVISADO ]                          │
│                                                  │
│   1.247 pessoas ja se cadastraram                │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### VIP Gate (During VIP Window)

```
┌─────────────────────────────────────────────────┐
│                   CIENA                          │
│                                                  │
│   COLECAO NOTURNA - DROP EXCLUSIVO              │
│                                                  │
│   ┌───────────────────────────────────────────┐  │
│   │  Acesso exclusivo para membros VIP        │  │
│   │  Abre para o publico em:                  │  │
│   │                                           │  │
│   │     ┌────┐  ┌────┐  ┌────┐  ┌────┐       │  │
│   │     │ 18 │: │ 42 │: │ 15 │               │  │
│   │     │ hr │  │min │  │seg │               │  │
│   │     └────┘  └────┘  └────┘               │  │
│   │                                           │  │
│   │  Ja e membro VIP?                         │  │
│   │  [ ENTRAR COM MEU CPF ]                   │  │
│   │                                           │  │
│   │  Nao e VIP? Cadastre-se na waitlist       │  │
│   │  para os proximos drops.                  │  │
│   └───────────────────────────────────────────┘  │
│                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│   │  Produto  │  │  Produto  │  │  Produto  │    │
│   │  [img]    │  │  [img]    │  │  [img]    │    │
│   │  R$ 229   │  │  R$ 189   │  │  R$ 149   │    │
│   │ [BLOCKED] │  │ [BLOCKED] │  │ [BLOCKED] │    │
│   └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
```

---

### 5. API Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/v1/public/checkout/waitlist` | None | `{ drop_id, name, email, phone, product_interest? }` | `{ data: { id, drop_id, created_at } }` |
| GET | `/api/v1/public/checkout/drops/{id}/access` | None (CPF query) | `?cpf=12345678900` | `{ data: { can_purchase: bool, reason: string, opens_at?: string } }` |
| GET | `/api/v1/checkout/waitlist?dropId={id}` | admin, pm | — | `{ data: [WaitlistEntry], meta: { total, cursor } }` |
| GET | `/api/v1/checkout/waitlist/stats?dropId={id}` | admin, pm | — | `{ data: { total, by_product: [...], daily_trend: [...] } }` |
| PUT | `/api/v1/checkout/drops/{id}/vip-access` | admin | `{ is_vip_only, vip_window_hours, whitelist_contact_ids }` | `{ data: VipDropAccess }` |
| POST | `/api/v1/checkout/drops/{id}/actions/notify-waitlist` | admin | `{ template_id? }` | `{ data: { queued: number, skipped: number } }` |

---

### 6. Business Rules

| # | Rule | Condition | Outcome |
|---|------|-----------|---------|
| BR-01 | Waitlist deduplication | Same email + same drop_id | Reject with "Voce ja esta cadastrado nesta waitlist" |
| BR-02 | VIP gate enforcement | `NOW() < public_opens_at` AND `is_vip_only = TRUE` | Only contacts with `is_vip = TRUE` OR in `whitelist_contact_ids` can add to cart |
| BR-03 | Public opening | `NOW() >= public_opens_at` | All visitors can purchase normally; VIP gate removed |
| BR-04 | VIP identification | Customer enters CPF at gate | System looks up `crm.contacts` by CPF; if `is_vip = TRUE`, grant access and set session flag |
| BR-05 | Waitlist-to-contact linking | Email matches existing `crm.contacts.email` | Auto-link `contact_id` on waitlist entry |
| BR-06 | Conversion tracking | Waitlist registrant completes purchase | Set `converted_order_id` on waitlist entry; used for waitlist-to-purchase conversion rate |
| BR-07 | Notification consent | Phone provided but no LGPD consent | First message is the opt-in template; only send launch notification if consent granted |
| BR-08 | Waitlist count display | Public waitlist page | Show real count rounded down to nearest 50 (e.g., 1,247 -> "Mais de 1.200 pessoas") |

---

### 7. Integrations

| Integration | Direction | Detail |
|-------------|-----------|--------|
| CRM | Read | Check `crm.contacts.is_vip` for gate access |
| CRM | Write | Create or update contact from waitlist registration data |
| PCP | Read | Fetch `pcp.drops` for drop metadata (name, launch date, products) |
| WhatsApp Engine | Write | Send `wa_waitlist_confirmed` and `wa_drop_launch` templates |
| Checkout | Internal | VIP gate middleware applied to cart/payment routes during VIP window |

**Events emitted:**
- `waitlist.registered` — new waitlist entry created
- `waitlist.notified` — launch notifications sent
- `drop.vip_window_opened` — VIP access period started
- `drop.public_opened` — public access period started

---

### 8. Background Jobs

| Job | Trigger | Schedule | Description |
|-----|---------|----------|-------------|
| `waitlist-link-contacts` | On `waitlist.registered` | Async (queue) | Match waitlist email/phone against `crm.contacts`; link `contact_id` if found; create contact if not |
| `waitlist-notify-launch` | On `drop.launched` | Async (batch) | Batch-send WhatsApp launch notifications to all eligible waitlist entries (consent = true, not yet notified) |
| `vip-window-auto-open` | Cron | Every 1 min | Check if any `checkout.vip_drop_access.public_opens_at <= NOW()` and emit `drop.public_opened` event |
| `waitlist-conversion-track` | On `order.paid` | Async | Check if buyer email/CPF matches any waitlist entry for the same drop; set `converted_order_id` |

---

### 9. Permissions

| Role | Waitlist (public) | Waitlist Admin | VIP Config |
|------|------------------|---------------|------------|
| Public (no auth) | Register | -- | -- |
| admin | -- | Read, Export | Full |
| pm | -- | Read, Export | Read |
| operations | -- | Read | -- |
| All other internal | -- | -- | -- |

Reference: [AUTH.md](../architecture/AUTH.md) section 3.1

---

### 10. Testing Checklist

- [ ] Waitlist registration with valid data creates entry and sends WhatsApp confirmation
- [ ] Duplicate email + drop_id registration is rejected with friendly message
- [ ] VIP gate blocks non-VIP customers during VIP window
- [ ] VIP customer can access drop with CPF lookup during VIP window
- [ ] Manually whitelisted contacts (non-VIP) can access during VIP window
- [ ] Products are visible but unbuyable during VIP window for non-VIP users
- [ ] After `public_opens_at`, all users can purchase normally
- [ ] WhatsApp launch notification batch sends correctly to consented entries
- [ ] Waitlist count rounds down to nearest 50 for public display
- [ ] Waitlist-to-contact auto-linking works for existing contacts
- [ ] Conversion tracking links waitlist entry to completed order
- [ ] PCP can read waitlist counts for demand calibration

---

### 11. Implementation Prerequisites

- CRM contacts module with `is_vip` flag operational
- PCP drops table (`pcp.drops`) with launch dates
- WhatsApp Engine with template management and batch dispatch
- Checkout flow with middleware hook points for gate logic

---

### 12. Open Questions

- [ ] Should VIP gate also support a password/invite code as an alternative to CPF lookup?
- [ ] Should waitlist registrants who are not yet contacts get auto-created in CRM, or only linked if they already exist?
- [ ] What is the maximum VIP window duration? (24h default, but should there be a cap?)
- [ ] Should the waitlist form capture product-variant-level interest (e.g., "Black Jacket, size M") or product-level only?

---

## E2. Cloud Estoque / Split Delivery

### 1. Overview

**What it does:** Allows selling products that are not yet in physical stock — items in production or in transit. Checkout displays clear delivery timeline differences. Mixed orders (in-stock + cloud) receive split deliveries with separate ETAs.

**Host modules:** Checkout + ERP

**Priority:** Medium — enables selling during production, increasing revenue velocity.

**Business impact:**
- Sell pre-production items to capture demand immediately after drop announcement
- Reduce "out of stock" friction — items in production can still be purchased
- Split delivery transparency builds trust
- Cloud purchase incentives (free shipping or discount) increase conversion

---

### 2. User Stories

| # | As a... | I want to... | So that... | Acceptance Criteria |
|---|---------|-------------|-----------|-------------------|
| US-01 | Customer | See clearly which items in my cart are Cloud Estoque | I understand the delivery timeline difference | Cart items show badge: "Pronta Entrega" (green) or "Cloud Estoque - Envio estimado em X dias" (blue) |
| US-02 | Customer | See split delivery information at checkout | I know when each group of items will arrive | Shipping step shows two delivery groups with separate ETAs and carrier options |
| US-03 | Customer | Receive a shipping incentive for Cloud Estoque items | I am motivated to purchase items not yet in stock | Cloud items get free shipping or a small discount (configurable), displayed as badge in cart |
| US-04 | Operations (Tavares) | Mark SKUs as Cloud Estoque with estimated availability date | I can enable pre-sale for items in production | Inventory management: set `stock_status = 'cloud'` with `estimated_available_at` date per SKU |
| US-05 | Operations (Ana Clara) | Process split delivery orders with clear separation of shipment groups | I can ship available items immediately and cloud items when they arrive | Order detail shows two shipment groups; each group has independent status progression |
| US-06 | System | Prevent overselling Cloud Estoque items | Cloud sales do not exceed production quantity | Cloud quantity capped at `quantity_in_production + quantity_in_transit`; decremented on purchase |

---

### 3. Data Model

#### New columns on `erp.inventory`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| cloud_available | INTEGER | NOT NULL DEFAULT 0 | Units available for cloud sale (derived from in_production + in_transit) |
| estimated_available_at | DATE | NULL | When cloud stock is expected to become physical stock |

#### New ENUM: `erp.stock_fulfillment_type`

```sql
CREATE TYPE erp.stock_fulfillment_type AS ENUM ('standard', 'cloud');
```

#### New column on `checkout.order_items`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| fulfillment_type | erp.stock_fulfillment_type | NOT NULL DEFAULT 'standard' | Whether this item ships from stock or cloud |
| estimated_ship_date | DATE | NULL | For cloud items, estimated ship date |

#### checkout.shipment_groups (new table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| order_id | UUID | NOT NULL, FK checkout.orders(id) | |
| group_type | erp.stock_fulfillment_type | NOT NULL | standard or cloud |
| status | checkout.order_status | NOT NULL DEFAULT 'pending' | Independent status per group |
| tracking_code | VARCHAR(100) | NULL | Carrier tracking code |
| estimated_ship_date | DATE | NULL | |
| estimated_delivery_date | DATE | NULL | |
| shipped_at | TIMESTAMPTZ | NULL | |
| delivered_at | TIMESTAMPTZ | NULL | |
| shipping_cost | NUMERIC(12,2) | NOT NULL DEFAULT 0 | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE INDEX idx_shipment_groups_order ON checkout.shipment_groups (order_id);
CREATE INDEX idx_shipment_groups_status ON checkout.shipment_groups (status);
```

---

### 4. Screens & UI

Reference checkout.md section 4 for base checkout wireframes. Cloud Estoque adds the following to the cart and shipping steps:

**Cart badge:** Each cart item row shows a small badge to the right of the product name — "Pronta Entrega" (green chip) or "Cloud Estoque" (blue chip with estimated date).

**Shipping step split display:**

```
┌─────────────────────────────────────────────────┐
│   Entrega                                        │
│                                                  │
│   Envio 1 - Pronta Entrega                       │
│   ┌─────────────────────────────────────────┐    │
│   │ Camiseta Preta Basic (M)        x1      │    │
│   │ Meia CIENA Pack                 x1      │    │
│   │                                         │    │
│   │ Estimativa: 3-5 dias uteis              │    │
│   │ PAC: R$ 18,90  |  SEDEX: R$ 32,50      │    │
│   └─────────────────────────────────────────┘    │
│                                                  │
│   Envio 2 - Cloud Estoque                        │
│   ┌─────────────────────────────────────────┐    │
│   │ Jaqueta Noturna (G)             x1      │    │
│   │                                         │    │
│   │ Produto em producao.                    │    │
│   │ Envio estimado: 20 Mar 2026             │    │
│   │ + 3-5 dias uteis de entrega             │    │
│   │ Frete GRATIS (Cloud Estoque)            │    │
│   └─────────────────────────────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

### 5. API Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| GET | `/api/v1/public/checkout/products/{id}/availability` | None | — | `{ data: { sku_id, stock_status, quantity_available, cloud_available, estimated_available_at } }` |
| PUT | `/api/v1/erp/inventory/{skuId}/cloud` | operations, admin | `{ cloud_available, estimated_available_at }` | `{ data: Inventory }` |
| GET | `/api/v1/erp/orders/{id}/shipment-groups` | operations, admin | — | `{ data: [ShipmentGroup] }` |
| PUT | `/api/v1/erp/shipment-groups/{id}/status` | operations, admin | `{ status, tracking_code? }` | `{ data: ShipmentGroup }` |

---

### 6. Business Rules

| # | Rule | Condition | Outcome |
|---|------|-----------|---------|
| BR-01 | Cloud availability cap | `cloud_available` cannot exceed `quantity_in_production + quantity_in_transit` | Prevent overselling cloud items |
| BR-02 | Split delivery creation | Order contains both standard and cloud items | System creates two `checkout.shipment_groups` rows automatically |
| BR-03 | Cloud incentive | Cloud items in cart | Apply free shipping to cloud group OR configurable discount (default: free shipping) |
| BR-04 | Cloud status display | `estimated_available_at` is set | Checkout displays "Envio estimado: {date} + transit time" |
| BR-05 | Cloud-to-standard conversion | Production batch arrives and stock is entered | `cloud_available` decrements, `quantity_available` increments; pending cloud orders become standard fulfillment |
| BR-06 | Mixed order payment | Order has both types | Single payment for entire order; shipping costs summed (cloud shipping may be R$0) |
| BR-07 | Cloud item cancellation | Customer cancels before cloud item ships | Full refund for cloud items; `cloud_available` re-incremented |

---

### 7. Integrations

| Integration | Direction | Detail |
|-------------|-----------|--------|
| ERP Inventory | Read/Write | Cloud availability reads from `erp.inventory`; decremented on sale |
| PCP | Read | `pcp.production_orders` provides estimated completion dates for cloud availability |
| Checkout | Internal | Cart and shipping step render split delivery UI |
| WhatsApp Engine | Write | Send `wa_cloud_shipped` notification when cloud items ship (separate from standard shipment notification) |
| Melhor Envio | Write | Generate separate shipping labels per shipment group |

**Events emitted:**
- `order.split_delivery_created` — order split into multiple shipment groups
- `shipment_group.shipped` — individual shipment group dispatched
- `shipment_group.delivered` — individual shipment group delivered
- `cloud.stock_converted` — cloud items converted to physical stock

---

### 8. Background Jobs

| Job | Trigger | Schedule | Description |
|-----|---------|----------|-------------|
| `cloud-availability-sync` | On `production_order.stage_completed` (stage = stock_entry) | Async | Convert cloud reservations to standard stock when production enters inventory |
| `cloud-eta-update` | PCP stage date changes | Async | Update `estimated_available_at` when PCP production timeline shifts |
| `split-delivery-notify` | On `shipment_group.shipped` | Async | Send WhatsApp notification per shipment group: "Envio 1 de 2 saiu para entrega" |

---

### 9. Permissions

| Role | Cloud Config | Shipment Groups | Cloud Reports |
|------|-------------|----------------|---------------|
| admin | Full | Full | Read |
| operations | Full | Full | Read |
| finance | -- | Read | Read |
| pm | Read | Read | Read |

---

### 10. Testing Checklist

- [ ] Cart correctly displays Pronta Entrega vs Cloud Estoque badges per item
- [ ] Checkout shipping step splits into two delivery groups for mixed orders
- [ ] Cloud items receive free shipping incentive
- [ ] Cloud availability does not exceed in_production + in_transit
- [ ] Overselling cloud items is prevented (concurrent purchase race condition)
- [ ] Two shipment groups created on order completion for mixed orders
- [ ] Each shipment group has independent status progression
- [ ] WhatsApp notifications sent per shipment group
- [ ] Cloud-to-standard conversion works when production stock arrives
- [ ] Cancellation of cloud items correctly re-increments cloud_available

---

### 11. Implementation Prerequisites

- ERP inventory with `quantity_in_production` and `quantity_in_transit` populated by PCP
- PCP production orders with stage-level date tracking
- Checkout flow operational with single-delivery model (extend to multi-delivery)
- Melhor Envio integration for multiple labels per order

---

### 12. Open Questions

- [ ] Should cloud items have a maximum pre-sale window (e.g., max 30 days before estimated availability)?
- [ ] If production is delayed beyond estimated date, what is the automatic customer communication?
- [ ] Should cloud orders be auto-cancelled if delay exceeds X days? (CDC consumer protection considerations)
- [ ] Can cloud items be exchanged via Trocas, or only refunded?

---

## E3. Alocacao de Estoque por Canal

### 1. Overview

**What it does:** Reserves stock percentages by sales channel: X% DTC (direct-to-consumer), Y% VIP (early access), Z% B2B (wholesale), W% influencers. Prevents one channel from cannibalizing another.

**Host module:** ERP

**Priority:** Low — approved with caveat. Needs deep study. Tight working capital means "holding stock" is risky. Implement AFTER B2B scales and sufficient drop data exists to calibrate allocation.

**Business impact:**
- Prevents B2B wholesale from consuming stock meant for DTC (higher margin)
- Ensures VIP customers always have access to key items during drops
- Data-driven allocation based on historical channel performance

---

### 2. User Stories

| # | As a... | I want to... | So that... | Acceptance Criteria |
|---|---------|-------------|-----------|-------------------|
| US-01 | Admin (Marcus) | Set stock allocation percentages per channel for a drop | I control how inventory is distributed across sales channels | Allocation form: DTC %, VIP %, B2B %, Influencer %. Sum must equal 100%. Applied per drop or per SKU |
| US-02 | Operations (Tavares) | See allocated vs consumed stock per channel | I can monitor if a channel is over/under-performing its allocation | Dashboard: channel rows with allocated units, sold units, remaining units, utilization % |
| US-03 | Commercial (Guilherme) | See B2B-allocated stock separately from DTC stock | I know exactly how many units I can offer to retailers | B2B catalog shows only B2B-allocated available quantities |
| US-04 | System | Enforce channel-specific stock limits at checkout | A channel cannot sell more than its allocation | Checkout validates purchase against channel-specific availability |
| US-05 | PM (Caio) | Release unused channel allocation to other channels | Unsold VIP stock becomes available to DTC after the VIP window closes | Manual or time-based release of unused allocations |

---

### 3. Data Model

#### erp.channel_allocations (new table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| sku_id | UUID | NOT NULL, FK erp.skus(id) | |
| drop_id | UUID | NULL, FK pcp.drops(id) | Optional — allocation can be drop-specific or general |
| channel | VARCHAR(50) | NOT NULL | 'dtc', 'vip', 'b2b', 'influencer' |
| allocated_quantity | INTEGER | NOT NULL | Units reserved for this channel |
| sold_quantity | INTEGER | NOT NULL DEFAULT 0 | Units sold through this channel |
| released_quantity | INTEGER | NOT NULL DEFAULT 0 | Units released back to general pool |
| release_at | TIMESTAMPTZ | NULL | Auto-release datetime (e.g., end of VIP window) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE UNIQUE INDEX idx_channel_alloc_unique ON erp.channel_allocations (sku_id, channel, drop_id);
CREATE INDEX idx_channel_alloc_sku ON erp.channel_allocations (sku_id);
CREATE INDEX idx_channel_alloc_drop ON erp.channel_allocations (drop_id) WHERE drop_id IS NOT NULL;
CREATE INDEX idx_channel_alloc_release ON erp.channel_allocations (release_at) WHERE release_at IS NOT NULL;
```

#### New ENUM

```sql
CREATE TYPE erp.sales_channel AS ENUM ('dtc', 'vip', 'b2b', 'influencer');
```

---

### 4. Screens & UI

No customer-facing UI. Admin-only:
- **Allocation Setup:** Form per SKU or per drop with channel sliders (percentage-based, auto-calculates units from total stock)
- **Allocation Monitor:** Table with columns: SKU, Channel, Allocated, Sold, Remaining, Utilization %, Release At
- **Release Action:** "Liberar para DTC" button on unused channel allocations

---

### 5. API Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/v1/erp/channel-allocations` | admin | `{ sku_id, drop_id?, allocations: [{ channel, percentage }] }` | `{ data: [ChannelAllocation] }` |
| GET | `/api/v1/erp/channel-allocations?skuId={id}&dropId={id}` | admin, pm, operations, commercial | — | `{ data: [ChannelAllocation] }` |
| PUT | `/api/v1/erp/channel-allocations/{id}` | admin | `{ allocated_quantity, release_at? }` | `{ data: ChannelAllocation }` |
| POST | `/api/v1/erp/channel-allocations/{id}/actions/release` | admin | `{ target_channel?: 'dtc' }` | `{ data: { released: number } }` |

---

### 6. Business Rules

| # | Rule | Condition | Outcome |
|---|------|-----------|---------|
| BR-01 | Allocation sum | Sum of all channel percentages for a SKU | Must equal 100% or less (remainder stays in general pool) |
| BR-02 | Channel enforcement | Purchase attempt on a channel with exhausted allocation | If general pool has stock, allow purchase (soft enforcement); if not, block with "Esgotado neste canal" |
| BR-03 | Auto-release | `release_at <= NOW()` AND `released_quantity = 0` | Remaining units (allocated - sold) added back to general pool |
| BR-04 | B2B visibility | B2B retailer views catalog | Available quantity = `b2b.allocated_quantity - b2b.sold_quantity` |
| BR-05 | Working capital guard | Total allocated > total physical stock | Reject allocation — cannot allocate more than exists |

---

### 7. Integrations

| Integration | Direction | Detail |
|-------------|-----------|--------|
| ERP Inventory | Read | Total stock per SKU for allocation calculation |
| Checkout | Read | Check channel availability at cart/payment |
| B2B Portal | Read | B2B catalog shows B2B-allocated stock only |
| PCP Drops | Read | Drop-level allocation grouping |

**Events emitted:**
- `allocation.created` — new channel allocation set
- `allocation.exhausted` — a channel's allocation is fully consumed
- `allocation.released` — unused allocation released to general pool

---

### 8. Background Jobs

| Job | Trigger | Schedule | Description |
|-----|---------|----------|-------------|
| `allocation-auto-release` | Cron | Every 5 min | Check `release_at <= NOW()`; release remaining units to general pool |
| `allocation-utilization-report` | Cron | Daily at 08:00 BRT | Generate daily utilization report per channel for Dashboard/Beacon |

---

### 9. Permissions

| Role | Create Allocations | View Allocations | Release |
|------|-------------------|-----------------|---------|
| admin | Yes | Yes | Yes |
| pm | No | Yes | No |
| operations | No | Yes | No |
| commercial | No | Yes (B2B channel only) | No |
| finance | No | Yes | No |

---

### 10. Testing Checklist

- [ ] Allocation percentages sum to 100% or less
- [ ] Channel-specific stock decrements correctly on purchase
- [ ] Auto-release fires at configured datetime
- [ ] B2B portal shows only B2B-allocated stock
- [ ] Cannot allocate more units than physical stock exists
- [ ] Released units appear in general pool immediately
- [ ] Concurrent purchases on same channel do not exceed allocation (race condition)

---

### 11. Implementation Prerequisites

- B2B module at scale with meaningful order volume
- 2-3 drops of historical data for calibration
- ERP inventory fully operational
- Clear channel identification on every purchase (DTC vs B2B vs VIP)

---

### 12. Open Questions

- [ ] Should allocation be hard (block purchase) or soft (allow with alert)?
- [ ] How to handle influencer seedlings (gifted product) — is that a channel or a separate flow?
- [ ] What is the minimum data required to make informed allocation decisions?
- [ ] Should allocation percentages be suggested by the system based on historical data?

---

## E4. Recomendacao de Tamanho

### 1. Overview

**What it does:** Customer enters height, weight, and fit preference (slim/regular/oversized) at checkout, and the system suggests the best size. Runs entirely client-side (pure JS, no API call) for instant rendering.

**Host module:** Checkout

**Priority:** Medium — directly reduces size exchanges, cutting logistics costs and improving NPS.

**Business impact:**
- Reduces size-related exchanges (currently the #1 exchange reason)
- Lower reverse logistics cost (Melhor Envio return labels, reprocessing)
- Higher NPS — customers get the right size the first time
- Exchange data from Trocas module refines the model over time

---

### 2. User Stories

| # | As a... | I want to... | So that... | Acceptance Criteria |
|---|---------|-------------|-----------|-------------------|
| US-01 | Customer | Enter my height, weight, and fit preference to get a size recommendation | I choose the right size the first time | Modal/drawer with 3 inputs; instant recommendation; no page reload or API call |
| US-02 | Customer | See the size recommendation alongside the product size selector | I can compare the recommendation with my usual size choice | Recommended size highlighted with "Tamanho recomendado" badge on the size selector |
| US-03 | Operations (Tavares) | Maintain size measurement tables per product | The recommendation engine has accurate data | ERP product edit form includes measurement table: size x body measurements |
| US-04 | PM (Caio) | See the impact of size recommendations on exchange rates | I can measure if the feature is working | Dashboard metric: exchange rate for orders with recommendation vs without |
| US-05 | System | Use exchange data to refine size recommendations | The model improves over time based on real outcomes | Exchange requests with `reason = wrong_size` feed a correction factor per SKU-size combination |

---

### 3. Data Model

#### erp.size_charts (new table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| product_id | UUID | NOT NULL, FK erp.products(id) | |
| size | VARCHAR(10) | NOT NULL | PP, P, M, G, GG, XG |
| chest_cm | NUMERIC(5,1) | NULL | Chest measurement in cm |
| waist_cm | NUMERIC(5,1) | NULL | Waist measurement |
| hip_cm | NUMERIC(5,1) | NULL | Hip measurement |
| length_cm | NUMERIC(5,1) | NULL | Garment length |
| shoulder_cm | NUMERIC(5,1) | NULL | Shoulder width |
| sleeve_cm | NUMERIC(5,1) | NULL | Sleeve length |
| inseam_cm | NUMERIC(5,1) | NULL | For pants/shorts |
| fit_type | VARCHAR(20) | NOT NULL DEFAULT 'regular' | slim, regular, oversized |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE UNIQUE INDEX idx_size_charts_product_size ON erp.size_charts (product_id, size);
CREATE INDEX idx_size_charts_product ON erp.size_charts (product_id);
```

#### erp.size_recommendation_corrections (new table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| product_id | UUID | NOT NULL, FK erp.products(id) | |
| original_size | VARCHAR(10) | NOT NULL | Size originally purchased |
| exchanged_to_size | VARCHAR(10) | NOT NULL | Size exchanged to |
| occurrence_count | INTEGER | NOT NULL DEFAULT 1 | How many times this exchange happened |
| correction_factor | NUMERIC(3,2) | NOT NULL DEFAULT 0 | Adjustment weight (-1.0 to +1.0) |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE UNIQUE INDEX idx_size_corrections_unique ON erp.size_recommendation_corrections (product_id, original_size, exchanged_to_size);
```

---

### 4. Screens & UI

#### Size Recommendation Modal (Client-Side)

```
┌──────────────────────────────────────────────┐
│  Encontre seu tamanho ideal          [X]     │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ Altura (cm)                         │    │
│  │ ┌───────────────────────────┐       │    │
│  │ │ 175                      │       │    │
│  │ └───────────────────────────┘       │    │
│  │                                     │    │
│  │ Peso (kg)                           │    │
│  │ ┌───────────────────────────┐       │    │
│  │ │ 72                       │       │    │
│  │ └───────────────────────────┘       │    │
│  │                                     │    │
│  │ Preferencia de caimento             │    │
│  │ ┌──────┐ ┌─────────┐ ┌──────────┐  │    │
│  │ │ Slim │ │ Regular │ │Oversized │  │    │
│  │ │      │ │  [SEL]  │ │          │  │    │
│  │ └──────┘ └─────────┘ └──────────┘  │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  Tamanho recomendado:                │    │
│  │                                      │    │
│  │           ┌─────┐                    │    │
│  │           │  G  │                    │    │
│  │           └─────┘                    │    │
│  │                                      │    │
│  │  Para 175cm, 72kg com caimento       │    │
│  │  regular, o tamanho G oferece o      │    │
│  │  melhor ajuste neste produto.        │    │
│  │                                      │    │
│  │  Medidas do tamanho G:               │    │
│  │  Peito: 108cm | Comprimento: 72cm   │    │
│  │  Ombro: 48cm  | Manga: 22cm         │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  [ SELECIONAR TAMANHO G ]                    │
│                                              │
└──────────────────────────────────────────────┘
```

---

### 5. API Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| GET | `/api/v1/public/checkout/products/{id}/size-chart` | None | — | `{ data: [SizeChart] }` |
| POST | `/api/v1/erp/products/{id}/size-charts` | operations, admin | `{ size, chest_cm, waist_cm, ... }` | `{ data: SizeChart }` |
| PUT | `/api/v1/erp/products/{id}/size-charts/{sizeId}` | operations, admin | `{ chest_cm, waist_cm, ... }` | `{ data: SizeChart }` |
| GET | `/api/v1/erp/products/{id}/size-corrections` | pm, admin | — | `{ data: [SizeCorrection] }` |

**Note:** Size recommendation calculation runs **client-side only**. The public endpoint serves the size chart data; the matching algorithm runs in the browser (pure JS). No `/recommend` API endpoint exists.

---

### 6. Business Rules

| # | Rule | Condition | Outcome |
|---|------|-----------|---------|
| BR-01 | Matching algorithm | Height + weight + fit preference | Map to body measurements using standard BR body proportion tables; find closest size in product size chart; apply correction factor from exchange data |
| BR-02 | Correction factor | Exchange data shows P->M is most common exchange for product X | Bias recommendation toward M for borderline P/M customers on product X |
| BR-03 | Fit preference adjustment | Customer selects "oversized" | Recommend one size up from body-measurement match |
| BR-04 | Fit preference adjustment | Customer selects "slim" | Recommend the exact body-measurement match (no size-up) |
| BR-05 | Missing measurements | Product has no size chart data | Hide "Encontre seu tamanho" button; show standard size grid only |
| BR-06 | Recommendation tracking | Customer uses recommendation and purchases | Store `used_size_recommendation = true` on `checkout.order_items` for analytics |
| BR-07 | Client-side rendering | Size chart data loaded | Full matching logic runs in browser; renders in < 100ms; no network call for recommendation |

**Matching Algorithm (client-side JS):**

```javascript
function recommendSize(height, weight, fitPreference, sizeChart, corrections) {
  // 1. Estimate body measurements from height + weight
  const bodyChest = estimateChest(height, weight);  // BR anthropometric table
  const bodyWaist = estimateWaist(height, weight);

  // 2. For each size, calculate fit score
  const scores = sizeChart.map(size => {
    let ease = 0;
    if (fitPreference === 'slim') ease = 2;       // 2cm ease
    if (fitPreference === 'regular') ease = 6;     // 6cm ease
    if (fitPreference === 'oversized') ease = 12;  // 12cm ease

    const chestDiff = Math.abs((bodyChest + ease) - size.chest_cm);
    const waistDiff = Math.abs((bodyWaist + ease) - size.waist_cm);

    let score = 100 - (chestDiff * 2 + waistDiff * 1.5);

    // 3. Apply correction factor from exchange history
    const correction = corrections.find(c => c.original_size === size.size);
    if (correction) score += correction.correction_factor * 10;

    return { size: size.size, score, measurements: size };
  });

  // 4. Return highest-scoring size
  return scores.sort((a, b) => b.score - a.score)[0];
}
```

---

### 7. Integrations

| Integration | Direction | Detail |
|-------------|-----------|--------|
| ERP Products | Read | Size chart data per product |
| Trocas | Read | Exchange reason data feeds correction factors |
| Checkout | Internal | Recommendation modal embedded in product page / size selector |
| Dashboard | Write | Recommendation usage and exchange rate metrics |

**Events emitted:**
- `size_recommendation.used` — customer selected the recommended size
- `size_recommendation.overridden` — customer chose a different size than recommended

---

### 8. Background Jobs

| Job | Trigger | Schedule | Description |
|-----|---------|----------|-------------|
| `size-correction-recalculate` | Cron | Weekly (Sunday 02:00 BRT) | Aggregate `trocas.exchange_items` where `reason = 'wrong_size'` per product; update `erp.size_recommendation_corrections` |
| `size-recommendation-analytics` | Cron | Daily at 06:00 BRT | Calculate recommendation adoption rate and exchange rate comparison (with vs without recommendation) |

---

### 9. Permissions

| Role | Size Charts (manage) | Corrections (view) | Analytics |
|------|---------------------|--------------------| ----------|
| admin | Full | Yes | Yes |
| operations | Full | Yes | No |
| pm | Read | Yes | Yes |

---

### 10. Testing Checklist

- [ ] Size chart data loads in < 200ms for the public endpoint
- [ ] Client-side recommendation renders in < 100ms (no visible delay)
- [ ] Recommendation changes when fit preference toggles between slim/regular/oversized
- [ ] Products without size charts hide the recommendation button
- [ ] Exchange data correction factors shift recommendations appropriately
- [ ] "Tamanho recomendado" badge appears on the correct size in the selector
- [ ] Recommendation tracking flag is stored on order_items
- [ ] Analytics correctly compare exchange rates with vs without recommendation

---

### 11. Implementation Prerequisites

- ERP product catalog with size-variant SKUs
- Trocas module operational and recording exchange reasons
- At least 1-2 months of exchange data for initial correction factors
- Size chart data populated for all active products (manual data entry by Tavares)

---

### 12. Open Questions

- [ ] Should the recommendation use a third-party body measurement API or pure BR anthropometric tables?
- [ ] How to handle unisex products where male and female body proportions differ?
- [ ] Should the recommendation be stored per-customer for repeat purchases (localStorage or CRM)?
- [ ] What is the minimum exchange data volume before correction factors become statistically reliable?

---

## E5. Pagina "Meu Pedido"

### 1. Overview

**What it does:** A public page (no login required) where customers enter their order number and CPF to view order status, tracking, exchange status, and download NF-e. Reduces support ticket volume.

**Host module:** Public Frontend (subdomain or Shopify page)

**Priority:** Medium-High — directly reduces "cadê meu pedido?" support tickets.

**Business impact:**
- Reduces Slimgust's support ticket volume (estimated 30-40% of tickets are order status inquiries)
- Self-service tracking improves customer experience
- NF-e download eliminates manual PDF-sending requests

---

### 2. User Stories

| # | As a... | I want to... | So that... | Acceptance Criteria |
|---|---------|-------------|-----------|-------------------|
| US-01 | Customer | Look up my order by entering order number + CPF | I can check my order status without contacting support | Two-field lookup form; both fields required; returns order details on match |
| US-02 | Customer | See the current shipping status and tracking link | I know where my package is | Status timeline with all stages; active stage highlighted; tracking link opens carrier page |
| US-03 | Customer | Download my NF-e (DANFE PDF) | I have my fiscal document for warranty or expense reporting | "Baixar NF-e" button; downloads PDF directly; only shown if NF-e status = 'authorized' |
| US-04 | Customer | See the status of an active exchange request | I know where my exchange is in the process | Exchange section appears if `trocas.exchange_requests` exist for this order; shows exchange status timeline |
| US-05 | System | Rate-limit lookups to prevent enumeration | Malicious actors cannot scrape order data | 10 attempts per IP per hour; Redis counter with 1-hour TTL; 429 response on limit |

---

### 3. Data Model

No new tables required. This expansion reads from existing tables:
- `checkout.orders` — order status, items, shipping info
- `checkout.order_items` — line items
- `erp.nfe_documents` — NF-e PDF URL
- `erp.shipping_labels` — tracking code, carrier, status
- `trocas.exchange_requests` — exchange status if any
- `trocas.reverse_logistics` — return shipping tracking

---

### 4. Screens & UI

#### Lookup Form

```
┌──────────────────────────────────────────────────┐
│                    CIENA                           │
│              Acompanhe seu pedido                  │
│                                                    │
│   ┌──────────────────────────────────────────┐    │
│   │ Numero do pedido (ex: 4521)              │    │
│   └──────────────────────────────────────────┘    │
│   ┌──────────────────────────────────────────┐    │
│   │ CPF (somente numeros)                    │    │
│   └──────────────────────────────────────────┘    │
│                                                    │
│   [ BUSCAR PEDIDO ]                                │
│                                                    │
└──────────────────────────────────────────────────┘
```

#### Order Detail View

```
┌──────────────────────────────────────────────────┐
│                    CIENA                           │
│              Pedido #4521                          │
│                                                    │
│   Status do pedido                                 │
│   ┌──────────────────────────────────────────┐    │
│   │  (v) Confirmado    12 Mar 14:22           │    │
│   │   |                                       │    │
│   │  (v) Separando     12 Mar 16:05           │    │
│   │   |                                       │    │
│   │  (v) Enviado       13 Mar 09:30           │    │
│   │   |  Rastreio: BR123456789XX              │    │
│   │   |  [ RASTREAR NO SITE DA TRANSPORTADORA ]│   │
│   │   |                                       │    │
│   │  ( ) Entregue      Previsao: 18 Mar       │    │
│   └──────────────────────────────────────────┘    │
│                                                    │
│   Itens do pedido                                  │
│   ┌──────────────────────────────────────────┐    │
│   │  Camiseta Preta Basic (M)       x1       │    │
│   │  Meia CIENA Pack                x2       │    │
│   │                                           │    │
│   │  Subtotal:    R$ 247,80                   │    │
│   │  Frete:       R$ 18,90                    │    │
│   │  Desconto:   -R$ 24,78                    │    │
│   │  Total:       R$ 241,92                   │    │
│   └──────────────────────────────────────────┘    │
│                                                    │
│   Nota Fiscal                                      │
│   ┌──────────────────────────────────────────┐    │
│   │  NF-e #001234                             │    │
│   │  [ BAIXAR NF-e (PDF) ]                    │    │
│   └──────────────────────────────────────────┘    │
│                                                    │
│   Troca em andamento                               │
│   ┌──────────────────────────────────────────┐    │
│   │  Troca #TR-0087 - Troca de tamanho       │    │
│   │  Status: Aguardando devolucao             │    │
│   │  Etiqueta de devolucao: [ BAIXAR ]        │    │
│   └──────────────────────────────────────────┘    │
│                                                    │
└──────────────────────────────────────────────────┘
```

---

### 5. API Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/v1/public/orders/lookup` | None (rate-limited) | `{ order_number: number, cpf: string }` | `{ data: { order, items, nfe, tracking, exchange? } }` |

**Response payload:**

```json
{
  "data": {
    "order_number": 4521,
    "status": "shipped",
    "created_at": "2026-03-12T14:22:00Z",
    "total_cents": 24192,
    "subtotal_cents": 24780,
    "shipping_cents": 1890,
    "discount_cents": 2478,
    "payment_method": "pix",
    "items": [
      { "name": "Camiseta Preta Basic", "size": "M", "color": "preta", "quantity": 1, "unit_price_cents": 12990 },
      { "name": "Meia CIENA Pack", "size": "U", "color": "preta", "quantity": 2, "unit_price_cents": 5895 }
    ],
    "timeline": [
      { "status": "pending", "at": "2026-03-12T14:22:00Z" },
      { "status": "paid", "at": "2026-03-12T14:22:15Z" },
      { "status": "separating", "at": "2026-03-12T16:05:00Z" },
      { "status": "shipped", "at": "2026-03-13T09:30:00Z" }
    ],
    "tracking": {
      "code": "BR123456789XX",
      "carrier": "Correios",
      "url": "https://rastreamento.correios.com.br/BR123456789XX",
      "estimated_delivery": "2026-03-18"
    },
    "nfe": {
      "number": 1234,
      "key": "35260312345678000195550010001234001234567890",
      "pdf_url": "https://cdn.ciena.com/nfe/001234.pdf",
      "status": "authorized"
    },
    "exchange": {
      "id": "...",
      "type": "exchange_size",
      "status": "collecting",
      "return_label_url": "https://cdn.ciena.com/labels/return-0087.pdf",
      "created_at": "2026-03-14T10:00:00Z"
    }
  }
}
```

---

### 6. Business Rules

| # | Rule | Condition | Outcome |
|---|------|-----------|---------|
| BR-01 | Lookup authentication | Order number + CPF must both match | If mismatch: "Pedido nao encontrado. Verifique o numero e CPF." (do not reveal which field is wrong) |
| BR-02 | Rate limiting | 10 lookups per IP per hour | Redis key `meu_pedido:ratelimit:{ip}` with INCR + EXPIRE 3600. On 11th attempt: 429 "Muitas tentativas. Tente novamente em 1 hora." |
| BR-03 | Data minimization | Response payload | Do NOT return: full CPF, email, phone, full address, payment details. Only order-relevant data |
| BR-04 | NF-e download | NF-e status = 'authorized' | Show download button. If status = 'pending' or 'rejected', show "NF-e em processamento" |
| BR-05 | Exchange visibility | `trocas.exchange_requests` exists for this order | Show exchange section with status timeline and return label download |
| BR-06 | Cancelled orders | Order status = 'cancelled' | Show cancellation notice with date; do not show tracking or NF-e sections |

---

### 7. Integrations

| Integration | Direction | Detail |
|-------------|-----------|--------|
| Checkout Orders | Read | Order data, items, status timeline |
| ERP NF-e | Read | NF-e status and PDF URL |
| ERP Shipping | Read | Tracking code, carrier, estimated delivery |
| Trocas | Read | Exchange request status and return label |

**Events emitted:**
- `meu_pedido.lookup` — for analytics (how many customers use self-service vs. support)

---

### 8. Background Jobs

None. This expansion is fully synchronous (single API call on lookup).

---

### 9. Permissions

This is a public page. No authentication required. Rate-limited by IP.

Reference: [AUTH.md](../architecture/AUTH.md) section 1.5 for "Meu Pedido" auth details.

---

### 10. Testing Checklist

- [ ] Valid order_number + CPF returns full order details
- [ ] Mismatched order_number or CPF returns generic "not found" error (no field-specific leak)
- [ ] Rate limit blocks after 10 attempts per IP per hour
- [ ] NF-e download link works for authorized NF-e
- [ ] NF-e section hidden for orders without authorized NF-e
- [ ] Exchange section appears only for orders with active exchange requests
- [ ] Return label download works from exchange section
- [ ] Response does not leak sensitive data (full CPF, email, address)
- [ ] Cancelled orders show appropriate messaging
- [ ] Page renders correctly on mobile (customer-facing, mobile-first)

---

### 11. Implementation Prerequisites

- Checkout orders with full lifecycle tracking
- ERP NF-e integration (Focus NFe) emitting authorized NF-e with PDF URLs
- ERP shipping integration (Melhor Envio) with tracking codes
- Trocas module operational (optional — exchange section only shows if data exists)
- Redis for rate limiting

---

### 12. Open Questions

- [ ] Should this be a subdomain (pedido.ciena.com.br) or a Shopify page?
- [ ] Should the customer be able to request an exchange directly from this page, or only view status?
- [ ] Should lookup also support CPF-only (returns list of all orders for that CPF)?
- [ ] Should there be a "Precisa de ajuda?" link that opens a WhatsApp conversation with Slimgust?

---

## E6. Prova Social / UGC no Site

### 1. Overview

**What it does:** Displays a curated gallery of user-generated content (customers wearing CIENA) on the storefront. Must have strong editorial aesthetic — NOT a cheap marketplace-style review widget. Shoppable: click a photo to see the product and go to checkout.

**Host module:** Frontend Shopify (embed)

**Priority:** Low-Medium — brand-building, not operationally critical.

> **Pandora96 cross-ref:** UGC from ambassadors (tier 0, `creators.creator_tier = 'ambassador'`) should be tagged with source `ambassador` in the DAM/UGC pipeline, enabling filtering by organic vs. creator vs. ambassador content. Ambassador UGC volume is a key metric for measuring the ambassador program's content impact. See DAM spec R-UGC-SOURCE and Creators spec Ambassador tier.

**Business impact:**
- Social proof increases conversion (industry benchmark: +15-25% when UGC is present)
- Reinforces CIENA's community identity ("the CIENA people")
- Shoppable UGC creates a direct content-to-purchase pathway

**Marcus's requirement:** Must be very cool with lots of "sauce". Cannot look like a cheap marketplace. References: Corteiz, Live Fast Die Young, Supreme unboxing culture. Curated gallery with editorial aesthetic, NOT automated product reviews.

---

### 2. User Stories

| # | As a... | I want to... | So that... | Acceptance Criteria |
|---|---------|-------------|-----------|-------------------|
| US-01 | Visitor | Browse a UGC gallery on the CIENA site | I see real people wearing the brand and feel connected to the community | Grid/masonry gallery with high-quality curated photos; editorial aesthetic; no stock-photo feeling |
| US-02 | Visitor | Click a UGC photo and see which product is featured | I can purchase the product I see in the photo | Photo detail shows product overlay with name, price, and "Comprar" button linking to product page |
| US-03 | PM (Caio) | Select which approved UGCs appear on the storefront | Only the best, brand-aligned content is published | "Publicar no site" toggle on approved UGC in Marketing Intelligence; order/priority field |
| US-04 | Creative (Yuri/Sick) | Apply brand-consistent treatment to UGC before publishing | The gallery maintains CIENA's editorial aesthetic | DAM integration: curated photos can be edited/filtered in DAM before embedding |
| US-05 | Admin (Marcus) | Control the gallery layout and which products are tagged | The gallery represents the brand exactly as I want | Gallery admin: reorder photos, assign products, set section title and subtitle |

---

### 3. Data Model

#### New columns on `marketing.ugc_posts`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| published_to_site | BOOLEAN | NOT NULL DEFAULT FALSE | Whether this UGC appears on the storefront |
| site_display_order | INTEGER | NULL | Sort order on the gallery (lower = first) |
| tagged_product_ids | UUID[] | NOT NULL DEFAULT '{}' | Products visible in this photo (FK to `erp.products`) |
| site_published_at | TIMESTAMPTZ | NULL | When published to storefront |

```sql
CREATE INDEX idx_ugc_published ON marketing.ugc_posts (published_to_site, site_display_order) WHERE published_to_site = TRUE;
```

#### marketing.ugc_gallery_config (new table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| title | VARCHAR(255) | NOT NULL DEFAULT 'A CIENA no corre' | Gallery section title |
| subtitle | TEXT | NULL | Gallery section subtitle |
| layout | VARCHAR(20) | NOT NULL DEFAULT 'masonry' | masonry, grid, carousel |
| max_items | INTEGER | NOT NULL DEFAULT 12 | Max items displayed |
| is_active | BOOLEAN | NOT NULL DEFAULT TRUE | Toggle gallery on/off |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

---

### 4. Screens & UI

#### UGC Gallery on Storefront (Shopify Embed)

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│            A CIENA NO CORRE.                          │
│   A comunidade que veste a rua com identidade.        │
│                                                       │
│   ┌─────────┐ ┌──────────────┐ ┌─────────┐           │
│   │         │ │              │ │         │           │
│   │  [UGC]  │ │              │ │  [UGC]  │           │
│   │  @user1 │ │    [UGC]     │ │  @user3 │           │
│   │         │ │    @user2    │ │         │           │
│   │         │ │              │ │         │           │
│   └─────────┘ │              │ └─────────┘           │
│   ┌──────────┐└──────────────┘ ┌─────────┐           │
│   │          │ ┌─────────┐     │         │           │
│   │  [UGC]   │ │         │     │  [UGC]  │           │
│   │  @user4  │ │  [UGC]  │     │  @user6 │           │
│   │          │ │  @user5  │     │         │           │
│   └──────────┘ └─────────┘     └─────────┘           │
│                                                       │
│              [ VER MAIS ]                             │
│                                                       │
└──────────────────────────────────────────────────────┘
```

#### UGC Photo Detail (Overlay/Modal)

```
┌──────────────────────────────────────────────────┐
│                                            [X]    │
│  ┌──────────────────────────────────────────┐    │
│  │                                          │    │
│  │                                          │    │
│  │            [FULL UGC PHOTO]              │    │
│  │                                          │    │
│  │                                          │    │
│  │                                          │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│  @user2 • Foto do corre com a jaqueta nova        │
│                                                   │
│  ┌──────────────────────────┐                     │
│  │ [thumb] Jaqueta Noturna  │                     │
│  │         R$ 229,90        │                     │
│  │         [ COMPRAR ]      │                     │
│  └──────────────────────────┘                     │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

### 5. API Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| GET | `/api/v1/public/ugc/gallery` | None | `?limit=12` | `{ data: [{ id, image_url, author_username, tagged_products: [{ id, name, price, slug }] }] }` |
| PUT | `/api/v1/marketing/ugc/{id}/publish` | pm, admin | `{ published_to_site, site_display_order, tagged_product_ids }` | `{ data: UgcPost }` |
| GET | `/api/v1/marketing/ugc/gallery-config` | pm, admin | — | `{ data: GalleryConfig }` |
| PUT | `/api/v1/marketing/ugc/gallery-config` | admin | `{ title, subtitle, layout, max_items, is_active }` | `{ data: GalleryConfig }` |

---

### 6. Business Rules

| # | Rule | Condition | Outcome |
|---|------|-----------|---------|
| BR-01 | Curation-only publishing | UGC must have `status = 'approved'` before `published_to_site = true` | Cannot publish unapproved UGC |
| BR-02 | Product tagging | Published UGC should have at least one tagged product | Warning (not blocking) — untagged UGC shows without shoppable overlay |
| BR-03 | Gallery ordering | `site_display_order` determines sequence | Lower numbers displayed first; NULL = end of list |
| BR-04 | Inactive products | Tagged product is deactivated (`is_active = false`) | Product removed from UGC shoppable overlay but photo remains |
| BR-05 | Gallery max items | Public endpoint returns up to `max_items` | Configured in `ugc_gallery_config`; default 12 |
| BR-06 | Image quality | UGC image resolution | Minimum 600x600px; images below threshold are flagged in admin but not auto-rejected |

---

### 7. Integrations

| Integration | Direction | Detail |
|-------------|-----------|--------|
| Marketing Intelligence | Read | UGC posts with `status = approved` |
| DAM | Read | Curated/edited versions of UGC images |
| ERP Products | Read | Product name, price, slug for shoppable tags |
| Shopify | Embed | Custom Shopify section or app embed for gallery rendering |

**Pipeline:** Marketing Intelligence detects UGC -> Caio curates -> Yuri/Sick apply brand treatment in DAM -> Caio publishes to site -> Shopify embed renders gallery.

**Events emitted:**
- `ugc.published_to_site` — UGC published to storefront
- `ugc.product_clicked` — visitor clicked a shoppable product from UGC (analytics)

---

### 8. Background Jobs

| Job | Trigger | Schedule | Description |
|-----|---------|----------|-------------|
| `ugc-gallery-cache-invalidate` | On `ugc.published_to_site` | Async | Invalidate Shopify/CDN cache for gallery embed |
| `ugc-dead-product-cleanup` | Cron | Daily at 03:00 BRT | Remove deactivated product IDs from `tagged_product_ids` arrays |

---

### 9. Permissions

| Role | Publish UGC | Configure Gallery | View Gallery Admin |
|------|------------|-------------------|-------------------|
| admin | Yes | Yes | Yes |
| pm | Yes | No | Yes |
| creative | No (read-only) | No | Yes |

---

### 10. Testing Checklist

- [ ] Public gallery endpoint returns only published and approved UGC
- [ ] Gallery renders correctly in masonry, grid, and carousel layouts
- [ ] Shoppable product overlay appears on click with correct product data
- [ ] "Comprar" button links to correct product page
- [ ] Deactivated products are removed from shoppable overlays
- [ ] Gallery respects `max_items` configuration
- [ ] Gallery can be toggled off via `is_active` flag
- [ ] Image rendering maintains aspect ratio without distortion
- [ ] Mobile rendering is responsive and touch-friendly

---

### 11. Implementation Prerequisites

- Marketing Intelligence UGC Monitor operational
- DAM module for image curation/editing
- ERP product catalog with slugs and prices
- Shopify theme with custom section or app embed support

---

### 12. Open Questions

- [ ] Should the gallery be a Shopify app embed, a custom Liquid section, or a headless embed via iframe/JS?
- [ ] How to handle UGC images that are low resolution or poor quality?
- [ ] Should there be a "Submit your photo" CTA for customers to upload their own UGC?
- [ ] What is the CDN/caching strategy for gallery images on Shopify?

---

## E7. Gerador de Descricao de Produto

### 1. Overview

**What it does:** When registering a product in the ERP, the system uses Claude API to generate SEO product descriptions, Instagram copy, WhatsApp VIP copy, and hashtags — all in CIENA's brand voice.

**Host module:** ERP / Internal Tool

**Priority:** Low — efficiency gain, not operationally critical.

**Business impact:**
- Saves 15-30 min per product on copywriting
- Consistent brand voice across all channels
- SEO-optimized descriptions improve organic search

**Marcus requirement:** VERY strong humanization. CANNOT look like AI. Not even "cool robotic" AI. Must sound like a real BR streetwear enthusiast wrote it. Supervision: Slimgust writes/edits, Caio approves.

---

### 2. User Stories

| # | As a... | I want to... | So that... | Acceptance Criteria |
|---|---------|-------------|-----------|-------------------|
| US-01 | Support (Slimgust) | Generate product copy with one click when registering a new product | I have a starting point for product descriptions without writing from scratch | "Gerar descricao" button on product form; generates 4 outputs: SEO description, Instagram copy, WhatsApp VIP copy, hashtags |
| US-02 | Support (Slimgust) | Edit the generated copy before saving | I can humanize and refine the AI output | All 4 outputs are editable textareas; save button per field |
| US-03 | PM (Caio) | Approve product copy before it goes live | Quality control ensures brand consistency | "Aprovar" button per copy field; status: draft -> pending_approval -> approved |
| US-04 | Admin (Marcus) | Configure the brand voice prompt template | The AI output matches CIENA's tone of voice | Prompt template editor in settings; variables: `{product_name}`, `{category}`, `{materials}`, `{collection}` |
| US-05 | System | Generate copy using Claude API with brand context | Descriptions are on-brand and natural-sounding | Claude API call with prompt template + product metadata; response parsed into 4 sections |

---

### 3. Data Model

#### erp.product_copy (new table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| product_id | UUID | NOT NULL, FK erp.products(id) | |
| seo_description | TEXT | NULL | SEO-optimized product page description |
| instagram_copy | TEXT | NULL | Instagram caption (max 2200 chars) |
| whatsapp_vip_copy | TEXT | NULL | WhatsApp VIP group message |
| hashtags | TEXT[] | NULL | Generated hashtags |
| status | VARCHAR(20) | NOT NULL DEFAULT 'draft' | draft, pending_approval, approved |
| generated_by | VARCHAR(20) | NOT NULL DEFAULT 'ai' | ai, manual |
| approved_by | UUID | NULL, FK global.users(id) | Who approved |
| approved_at | TIMESTAMPTZ | NULL | |
| prompt_version | INTEGER | NOT NULL DEFAULT 1 | Which prompt template version was used |
| raw_ai_response | JSONB | NULL | Full Claude API response for debugging |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE INDEX idx_product_copy_product ON erp.product_copy (product_id);
CREATE INDEX idx_product_copy_status ON erp.product_copy (status);
```

#### global.prompt_templates (new table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(100) | NOT NULL, UNIQUE | e.g., 'product_description' |
| template | TEXT | NOT NULL | Prompt template with `{variable}` placeholders |
| variables | TEXT[] | NOT NULL | List of expected variables |
| model | VARCHAR(50) | NOT NULL DEFAULT 'claude-sonnet-4-20250514' | Claude model to use |
| max_tokens | INTEGER | NOT NULL DEFAULT 1500 | |
| temperature | NUMERIC(2,1) | NOT NULL DEFAULT 0.7 | |
| version | INTEGER | NOT NULL DEFAULT 1 | Auto-incremented on update |
| updated_by | UUID | NULL, FK global.users(id) | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

---

### 4. Screens & UI

No public-facing UI. Admin-only product copy generation integrated into ERP product form:
- "Gerar descricao com IA" button next to product description fields
- Loading spinner during Claude API call (2-5 seconds)
- 4 editable textareas: SEO Description, Instagram Copy, WhatsApp VIP Copy, Hashtags
- Status badge per field (Draft / Aguardando aprovacao / Aprovado)
- "Enviar para aprovacao" and "Aprovar" buttons

---

### 5. API Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/v1/erp/products/{id}/actions/generate-copy` | support, admin | `{ regenerate?: boolean }` | `{ data: ProductCopy }` |
| PUT | `/api/v1/erp/products/{id}/copy` | support, admin | `{ seo_description?, instagram_copy?, whatsapp_vip_copy?, hashtags? }` | `{ data: ProductCopy }` |
| POST | `/api/v1/erp/products/{id}/copy/actions/submit-approval` | support | — | `{ data: { status: 'pending_approval' } }` |
| POST | `/api/v1/erp/products/{id}/copy/actions/approve` | pm, admin | — | `{ data: { status: 'approved', approved_by, approved_at } }` |
| GET | `/api/v1/platform/prompt-templates` | admin | — | `{ data: [PromptTemplate] }` |
| PUT | `/api/v1/platform/prompt-templates/{name}` | admin | `{ template, model?, max_tokens?, temperature? }` | `{ data: PromptTemplate }` |

---

### 6. Business Rules

| # | Rule | Condition | Outcome |
|---|------|-----------|---------|
| BR-01 | Generation requires product data | Product must have name, category, and at least one SKU | Without these, generation returns error "Preencha nome, categoria e ao menos um SKU" |
| BR-02 | Regeneration limit | Max 3 regenerations per product per day | Prevent excessive Claude API usage |
| BR-03 | Approval workflow | Copy must be `approved` before used on Shopify/WhatsApp | Draft copy is internal-only |
| BR-04 | Prompt humanization | System prompt includes brand context | Include: CIENA tone of voice doc, BR streetwear vocabulary, cultural references, anti-AI-detection instructions |
| BR-05 | Cost tracking | Every Claude API call | Log model, input_tokens, output_tokens, cost_estimate in `raw_ai_response` JSONB |
| BR-06 | Hashtag generation | Instagram copy | Generate 15-20 hashtags mixing branded (#cienalab, #ciena), category (#streetwearbr, #modaurbana), and trending |

**Prompt template (default):**

```
Voce e um copywriter de moda streetwear brasileira. Voce escreve para a CIENA,
uma marca de streetwear de Belo Horizonte que mistura cultura urbana, atitude e
autenticidade. O tom e direto, confiante, sem ser arrogante. Usa girias naturais
do BR sem forcar. NUNCA use termos genericos de IA como "eleve seu estilo" ou
"descubra a essencia". Escreva como se fosse um post de um mano que realmente
veste a peca.

Produto: {product_name}
Categoria: {category}
Materiais: {materials}
Colecao: {collection}
Tamanhos: {sizes}
Preco: R$ {price}

Gere:
1. DESCRICAO SEO (150-200 palavras) — para a pagina do produto. Inclua
   palavras-chave naturais.
2. COPY INSTAGRAM (max 2200 chars) — caption para post de lancamento.
   Engajamento alto. Com CTA.
3. COPY WHATSAPP VIP (max 500 chars) — mensagem para o grupo VIP.
   Exclusividade e urgencia.
4. HASHTAGS — 15-20 hashtags relevantes.
```

---

### 7. Integrations

| Integration | Direction | Detail |
|-------------|-----------|--------|
| Claude API (Anthropic) | Write | Generate product descriptions |
| ERP Products | Read | Product metadata for prompt variables |
| Shopify | Write (future) | Push approved SEO description to Shopify product page |
| WhatsApp Engine | Read | WhatsApp VIP copy available for VIP group broadcasts |

**Events emitted:**
- `product_copy.generated` — AI copy generated for a product
- `product_copy.approved` — copy approved by PM

---

### 8. Background Jobs

None. Copy generation is user-initiated (on-demand). No scheduled batch generation.

---

### 9. Permissions

| Role | Generate | Edit | Submit for Approval | Approve | Prompt Template |
|------|----------|------|--------------------|---------|-----------------|
| admin | Yes | Yes | Yes | Yes | Full |
| pm | No | No | No | Yes | Read |
| support | Yes | Yes | Yes | No | No |
| operations | No | No | No | No | No |

---

### 10. Testing Checklist

- [ ] Copy generation works with valid product data (name, category, SKU)
- [ ] Generation fails gracefully when product data is incomplete
- [ ] Regeneration limit (3/day) is enforced
- [ ] All 4 copy fields are editable after generation
- [ ] Approval workflow: draft -> pending_approval -> approved
- [ ] Only PM/admin can approve copy
- [ ] Claude API errors are handled gracefully (timeout, rate limit, 500)
- [ ] Cost tracking records tokens and estimated cost per generation
- [ ] Prompt template is configurable by admin
- [ ] Generated copy does NOT sound robotic or generic

---

### 11. Implementation Prerequisites

- Claude API key (Anthropic) configured in environment
- ERP product catalog with name, category, SKU data
- Brand voice documentation for prompt engineering
- API cost budgeting (estimated: R$ 0.05-0.10 per generation with Claude Sonnet)

---

### 12. Open Questions

- [ ] Should there be a "tone slider" (more casual <-> more editorial)?
- [ ] Should the system store multiple copy versions per product for A/B testing descriptions?
- [ ] How to handle products in collections with thematic copy (e.g., all "Noturna" products share a narrative)?
- [ ] Should copy generation include alt-text for product images (accessibility)?

---

## E8. Precificacao Assistida por IA

### 1. Overview

**What it does:** AI-powered pricing assistance that combines production cost, desired margin, competitor prices, and historical sales performance to recommend optimal price points with margin-level classifications.

**Host module:** ERP (connected to Margin Calculator sub-module)

**Priority:** Low — requires 2-3 months of accumulated ERP data to be useful.

**Business impact:**
- Data-driven pricing replaces gut-feel decisions
- Margin visibility per price point helps balance revenue vs. volume
- Competitor pricing context prevents under/over-pricing

---

### 2. User Stories

| # | As a... | I want to... | So that... | Acceptance Criteria |
|---|---------|-------------|-----------|-------------------|
| US-01 | Finance (Pedro) | See AI-generated pricing recommendations for a SKU | I can evaluate pricing options with margin impact | Recommendation card showing 3-4 price points with margin %, volume estimate, and risk level |
| US-02 | Admin (Marcus) | See competitor pricing context alongside recommendations | I can position CIENA's pricing strategically | Competitor section shows similar products from Baw, Approve, High, Disturb with their prices |
| US-03 | Operations (Tavares) | Understand cost breakdown for each price scenario | I can validate that production costs are accurately reflected | Cost breakdown: raw materials, manufacturing, finishing, packaging, shipping avg, gateway fee, tax |
| US-04 | PM (Caio) | See historical volume performance at different price points | I understand price elasticity for CIENA products | Chart: historical price vs units sold for same category; "At R$199, similar products sold 40% more volume" |
| US-05 | System | Generate pricing insights automatically when cost data changes | Recommendations stay current with production costs | On `margin_calculation.updated` or `cost_analysis.completed`, refresh pricing recommendations |

---

### 3. Data Model

#### erp.pricing_recommendations (new table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| sku_id | UUID | NOT NULL, FK erp.skus(id) | |
| recommended_price | NUMERIC(12,2) | NOT NULL | Suggested price |
| cost_total | NUMERIC(12,2) | NOT NULL | Total cost (production + shipping + fees + tax) |
| margin_amount | NUMERIC(12,2) | NOT NULL | Recommended price - cost_total |
| margin_percentage | NUMERIC(5,2) | NOT NULL | (margin_amount / recommended_price) * 100 |
| margin_level | VARCHAR(30) | NOT NULL | 'at_limit', 'tight', 'fair', 'high', 'very_high' |
| estimated_volume_factor | NUMERIC(4,2) | NULL | Relative volume vs baseline (e.g., 1.40 = 40% more volume) |
| competitor_context | JSONB | NULL | `[{ brand, product, price }]` |
| reasoning | TEXT | NOT NULL | AI-generated explanation |
| is_primary | BOOLEAN | NOT NULL DEFAULT FALSE | Whether this is the top recommendation |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE INDEX idx_pricing_rec_sku ON erp.pricing_recommendations (sku_id);
CREATE INDEX idx_pricing_rec_primary ON erp.pricing_recommendations (sku_id, is_primary) WHERE is_primary = TRUE;
```

#### New ENUM

```sql
CREATE TYPE erp.margin_level AS ENUM ('at_limit', 'tight', 'fair', 'high', 'very_high');
```

**Margin level thresholds:**

| Level | Margin % Range | Color | Description |
|-------|---------------|-------|-------------|
| at_limit | < 20% | Red | No a margem cobre custos fixos |
| tight | 20-35% | Orange | Margem apertada — risco se custos subirem |
| fair | 35-55% | Yellow | Margem saudavel para streetwear |
| high | 55-75% | Green | Margem alta — bom posicionamento |
| very_high | > 75% | Blue | Margem muito alta — avaliar se preco e sustentavel |

---

### 4. Screens & UI

No public-facing UI. Integrated into ERP Margin Calculator:
- "Sugestao de preco (IA)" section below the manual margin calculator
- Shows 3-4 price point cards with margin level badges
- Competitor price comparison sidebar
- Historical volume chart (price vs. units sold for same category)

---

### 5. API Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/v1/erp/skus/{id}/actions/generate-pricing` | finance, admin, operations | `{ include_competitors?: boolean }` | `{ data: [PricingRecommendation] }` |
| GET | `/api/v1/erp/skus/{id}/pricing-recommendations` | finance, admin, operations, pm | — | `{ data: [PricingRecommendation] }` |
| GET | `/api/v1/erp/categories/{category}/price-history` | finance, admin, pm | `?months=6` | `{ data: { avg_price, avg_units, price_volume_curve: [...] } }` |

---

### 6. Business Rules

| # | Rule | Condition | Outcome |
|---|------|-----------|---------|
| BR-01 | Cost data required | SKU must have `cost_price > 0` in `erp.skus` | Cannot generate recommendations without cost data |
| BR-02 | Multi-point recommendation | Every generation | Produce exactly 4 price points: aggressive (high volume, low margin), balanced (fair margin), premium (high margin), ceiling (maximum before demand drops) |
| BR-03 | Competitor data inclusion | `include_competitors = true` AND competitor data exists in `marketing.competitor_ads` | Include competitor pricing context in recommendations |
| BR-04 | Volume estimation | Historical data for same category exists | Estimate volume factor based on price-volume curve from historical sales |
| BR-05 | Margin level classification | Calculated margin % | Apply threshold table (see Data Model section) |
| BR-06 | Cost breakdown transparency | Every recommendation | Include full cost breakdown: production_cost, avg_shipping, gateway_fee_pct (4.99% credit, 0.99% PIX), tax_estimate, packaging |
| BR-07 | Staleness | Recommendations older than 14 days OR cost data changed | Mark as stale; prompt regeneration |

**Cost formula:**

```
total_cost = production_cost
           + avg_shipping_cost        -- rolling 30d average from erp.shipping_labels
           + (price * gateway_fee_pct) -- 4.99% credit card or 0.99% PIX (use weighted avg)
           + (price * tax_rate)        -- estimated tax rate (configurable, default 12%)
           + packaging_cost            -- fixed per-unit (configurable, default R$ 3.00)

margin_amount = price - total_cost
margin_pct = (margin_amount / price) * 100
```

---

### 7. Integrations

| Integration | Direction | Detail |
|-------------|-----------|--------|
| ERP SKUs | Read | Cost price, current selling price |
| ERP Margin Calculator | Read | Existing cost breakdowns |
| ERP Financial Transactions | Read | Historical revenue and volume data |
| Marketing Intel (Competitor Watch) | Read | Competitor product prices |
| PCP Cost Analysis | Read | Detailed production cost breakdown |
| Claude API | Write | Generate natural-language pricing reasoning |

**Events emitted:**
- `pricing.recommendation_generated` — new pricing recommendations created
- `pricing.recommendation_stale` — existing recommendations marked as outdated

---

### 8. Background Jobs

| Job | Trigger | Schedule | Description |
|-----|---------|----------|-------------|
| `pricing-staleness-check` | Cron | Daily at 07:00 BRT | Check all recommendations; mark stale if > 14 days old or underlying cost data changed |
| `pricing-auto-generate` | On `cost_analysis.completed` | Async | Auto-generate pricing recommendations when PCP completes a new cost analysis |
| `pricing-volume-curve-update` | Cron | Weekly (Monday 03:00 BRT) | Recalculate price-volume curves per category from historical order data |

---

### 9. Permissions

| Role | Generate | View | Price History |
|------|----------|------|--------------|
| admin | Yes | Yes | Yes |
| finance | Yes | Yes | Yes |
| operations | Yes | Yes | No |
| pm | No | Yes | Yes |

---

### 10. Testing Checklist

- [ ] Recommendations generate 4 price points with correct margin calculations
- [ ] Margin level classification matches threshold table
- [ ] Cost formula correctly includes all components (production, shipping, fees, tax, packaging)
- [ ] Competitor data is included when available and requested
- [ ] Volume estimation uses actual historical data
- [ ] Recommendations marked stale after 14 days
- [ ] Cannot generate without cost data
- [ ] Claude API reasoning is coherent and actionable
- [ ] Gateway fee uses weighted average of payment method distribution

---

### 11. Implementation Prerequisites

- ERP operational with 2-3 months of real order data
- PCP cost analysis module completed for production costs
- Competitor Watch (Marketing Intel) with competitor pricing data
- Margin Calculator sub-module functional
- Claude API integration (shared with E7)

---

### 12. Open Questions

- [ ] Should the system track actual price changes and their volume impact to improve future recommendations?
- [ ] How to handle seasonal products where historical volume data may not apply?
- [ ] Should recommendations account for coupon/discount impact on effective margin?
- [ ] What is the minimum historical data volume before volume estimation is reliable?

---

## E9. Automacao de Fluxos / Workflow Engine

### 1. Overview

**What it does:** A visual/configurable workflow engine that allows non-developers (primarily Caio) to create event-driven automations across all Ambaril modules. Replaces hardcoded if/then logic with a flexible rule engine.

**Host module:** Platform-wide

**Priority:** Low-Medium — very powerful but complex to build. Target for Ambaril v2.

**Business impact:**
- Caio can create new automations without developer intervention
- Cross-module workflows that would otherwise require custom code
- Reduces response time for operational edge cases
- Scales team operations without scaling headcount

---

### 2. User Stories

| # | As a... | I want to... | So that... | Acceptance Criteria |
|---|---------|-------------|-----------|-------------------|
| US-01 | PM (Caio) | Create a new workflow automation without writing code | I can automate repetitive cross-module processes | Visual workflow builder with trigger selection, condition configuration, and action steps |
| US-02 | PM (Caio) | Test a workflow before activating it | I can verify it works correctly without affecting production data | "Testar" mode that runs the workflow against a simulated event and shows what would happen (dry-run) |
| US-03 | Admin (Marcus) | View all active workflows and their execution history | I can monitor what automations are running and catch issues | Workflow list with status, last run, success/failure count; click-through to execution log |
| US-04 | PM (Caio) | Pause or deactivate a workflow | I can stop a misbehaving automation immediately | "Pausar" and "Desativar" buttons; paused workflows stop executing but retain configuration |
| US-05 | System | Execute workflows asynchronously on matching events | Automations fire reliably without blocking the triggering operation | Event bus routes events to matching workflow triggers; execution is async (queue-based) |

---

### 3. Data Model

#### global.workflows (new table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | Human-readable workflow name |
| description | TEXT | NULL | What this workflow does |
| trigger_event | VARCHAR(100) | NOT NULL | Event name, e.g., 'order.paid', 'creator.points_earned' |
| trigger_conditions | JSONB | NOT NULL DEFAULT '{}' | Filter conditions on event payload |
| actions | JSONB | NOT NULL | Ordered list of action steps (see schema below) |
| status | VARCHAR(20) | NOT NULL DEFAULT 'draft' | draft, active, paused, archived |
| created_by | UUID | NOT NULL, FK global.users(id) | |
| last_run_at | TIMESTAMPTZ | NULL | |
| run_count | INTEGER | NOT NULL DEFAULT 0 | Total executions |
| error_count | INTEGER | NOT NULL DEFAULT 0 | Failed executions |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE INDEX idx_workflows_status ON global.workflows (status);
CREATE INDEX idx_workflows_trigger ON global.workflows (trigger_event) WHERE status = 'active';
CREATE INDEX idx_workflows_created_by ON global.workflows (created_by);
```

**`actions` JSONB schema:**

```json
[
  {
    "step": 1,
    "type": "condition",
    "config": {
      "field": "event.contact.is_vip",
      "operator": "equals",
      "value": true
    },
    "on_true": 2,
    "on_false": null
  },
  {
    "step": 2,
    "type": "send_whatsapp",
    "config": {
      "template_id": "wa_vip_order_confirmed",
      "to": "{{event.contact.phone}}",
      "variables": {
        "1": "{{event.contact.name}}",
        "2": "{{event.order.total_formatted}}",
        "3": "{{event.order.estimated_delivery}}"
      }
    }
  },
  {
    "step": 3,
    "type": "update_record",
    "config": {
      "table": "crm.contacts",
      "record_id": "{{event.contact.id}}",
      "fields": { "last_vip_interaction_at": "{{now}}" }
    }
  }
]
```

#### global.workflow_executions (new table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| workflow_id | UUID | NOT NULL, FK global.workflows(id) | |
| trigger_event | VARCHAR(100) | NOT NULL | Event that triggered this execution |
| event_payload | JSONB | NOT NULL | Full event data at time of trigger |
| status | VARCHAR(20) | NOT NULL DEFAULT 'running' | running, completed, failed, skipped |
| steps_executed | JSONB | NOT NULL DEFAULT '[]' | Log of each step: `[{ step, status, output, duration_ms }]` |
| error_message | TEXT | NULL | If failed, the error details |
| started_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| completed_at | TIMESTAMPTZ | NULL | |

```sql
CREATE INDEX idx_workflow_exec_workflow ON global.workflow_executions (workflow_id);
CREATE INDEX idx_workflow_exec_status ON global.workflow_executions (status);
CREATE INDEX idx_workflow_exec_started ON global.workflow_executions (started_at DESC);
```

#### New ENUM

```sql
CREATE TYPE global.workflow_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE global.workflow_execution_status AS ENUM ('running', 'completed', 'failed', 'skipped');
```

---

### 4. Screens & UI

No public-facing UI. Admin-only workflow builder:

**Workflow list page:** Table with columns: Name, Trigger Event, Status Badge, Last Run, Runs (total), Errors, Actions (Edit / Pause / Archive)

**Workflow builder:** Form-based (not drag-and-drop for v1):
1. Name + Description
2. Trigger Event (dropdown of all system events)
3. Trigger Conditions (JSON builder with field/operator/value rows)
4. Action Steps (ordered list, each with type dropdown and config form)
5. Test / Activate buttons

**Action types available:**

| Type | Description | Config |
|------|-------------|--------|
| `send_whatsapp` | Send a WhatsApp template message | template_id, to, variables |
| `send_email` | Send an email via Resend | to, subject, body_template |
| `create_notification` | Create an in-app notification | user_id or role, title, body, priority |
| `discord_alert` | Post to a Discord channel via ClawdBot | channel, message |
| `update_record` | Update a field on a database record | table, record_id, fields |
| `condition` | Branch based on event data | field, operator, value, on_true, on_false |
| `delay` | Wait before proceeding | duration_minutes |
| `log` | Write to audit log without action | message |

---

### 5. API Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| GET | `/api/v1/platform/workflows` | admin, pm | `?status=active` | `{ data: [Workflow], meta }` |
| POST | `/api/v1/platform/workflows` | admin, pm | `{ name, trigger_event, trigger_conditions, actions }` | `{ data: Workflow }` |
| GET | `/api/v1/platform/workflows/{id}` | admin, pm | — | `{ data: Workflow }` |
| PUT | `/api/v1/platform/workflows/{id}` | admin, pm | `{ name?, trigger_conditions?, actions?, status? }` | `{ data: Workflow }` |
| POST | `/api/v1/platform/workflows/{id}/actions/test` | admin, pm | `{ mock_event: {...} }` | `{ data: { dry_run: true, steps_executed: [...] } }` |
| POST | `/api/v1/platform/workflows/{id}/actions/activate` | admin, pm | — | `{ data: { status: 'active' } }` |
| POST | `/api/v1/platform/workflows/{id}/actions/pause` | admin, pm | — | `{ data: { status: 'paused' } }` |
| GET | `/api/v1/platform/workflows/{id}/executions` | admin, pm | `?cursor=&limit=25` | `{ data: [WorkflowExecution], meta }` |

---

### 6. Business Rules

| # | Rule | Condition | Outcome |
|---|------|-----------|---------|
| BR-01 | Active trigger matching | System event emitted | Find all workflows where `trigger_event` matches AND `status = 'active'` AND `trigger_conditions` evaluate to true against event payload |
| BR-02 | Async execution | Workflow matched | Execute asynchronously via job queue; never block the triggering operation |
| BR-03 | Step failure handling | An action step fails | Log error; mark execution as `failed`; do NOT continue to subsequent steps (fail-fast) |
| BR-04 | Condition evaluation | `condition` action type | Evaluate field against value using operator (equals, not_equals, gt, lt, gte, lte, contains, in); route to `on_true` or `on_false` step |
| BR-05 | Template variable resolution | `{{event.field.path}}` syntax in action configs | Resolve dot-notation paths against the event payload; `{{now}}` resolves to current UTC timestamp |
| BR-06 | Rate limiting | Workflow executes more than 100 times per hour | Auto-pause workflow; alert admin; prevent runaway automations |
| BR-07 | Circular dependency prevention | Workflow action triggers an event that re-triggers the same workflow | Execution context carries `workflow_origin_id`; skip if same workflow |
| BR-08 | Dry-run mode | `test` endpoint called | Execute all steps but do NOT persist changes or send messages; return simulated results |
| BR-09 | Delay action | `delay` type with `duration_minutes` | Schedule continuation via delayed job; resume after specified minutes |
| BR-10 | Max active workflows | System-wide | Maximum 50 active workflows (guard against performance impact) |

---

### 7. Integrations

| Integration | Direction | Detail |
|-------------|-----------|--------|
| All modules | Read | Workflow engine listens to ALL Flare events across all modules |
| WhatsApp Engine | Write | `send_whatsapp` action dispatches messages |
| Resend (Email) | Write | `send_email` action sends emails |
| ClawdBot (Discord) | Write | `discord_alert` action posts to Discord channels |
| CRM | Read/Write | Read contact data for conditions; update contact fields via `update_record` |
| ERP | Read/Write | Read order/inventory data; update records |
| Creators | Read/Write | Read creator data for tier conditions; update fields |
| Notifications | Write | `create_notification` action creates in-app Flare notifications |

**Events consumed (examples):**
- `order.paid`, `order.shipped`, `order.delivered`
- `stock.low`, `stock.critical`
- `creator.points_earned`, `creator.tier_upgraded`
- `exchange.approved`, `exchange.completed`
- `cart.abandoned`

---

### 8. Background Jobs

| Job | Trigger | Schedule | Description |
|-----|---------|----------|-------------|
| `workflow-event-router` | On any Flare event | Async (real-time) | Match event against active workflow triggers; enqueue executions |
| `workflow-executor` | On `workflow.execution.queued` | Async (queue) | Execute workflow steps sequentially; log each step result |
| `workflow-delay-resume` | On delay timer | Scheduled (per-execution) | Resume execution after delay step completes |
| `workflow-rate-limit-check` | Cron | Every 5 min | Check per-workflow execution counts; auto-pause if > 100/hour |
| `workflow-execution-cleanup` | Cron | Weekly (Sunday 04:00 BRT) | Archive executions older than 90 days to cold storage |

---

### 9. Permissions

| Role | Create | Edit | Activate | View Executions | Delete |
|------|--------|------|----------|----------------|--------|
| admin | Yes | Yes | Yes | Yes | Yes |
| pm | Yes | Yes | Yes | Yes | No |
| All other roles | No | No | No | No | No |

---

### 10. Testing Checklist

- [ ] Workflow creation with valid trigger event and actions saves correctly
- [ ] Dry-run mode executes steps without persisting or sending
- [ ] Active workflow triggers on matching event
- [ ] Trigger conditions correctly filter events (AND logic)
- [ ] Condition action correctly branches on true/false
- [ ] WhatsApp action dispatches message with resolved variables
- [ ] Email action sends via Resend
- [ ] Discord alert action posts to correct channel
- [ ] Update record action modifies the target record
- [ ] Delay action pauses execution for specified duration
- [ ] Failed step stops execution and logs error
- [ ] Rate limiting auto-pauses runaway workflows
- [ ] Circular dependency detection prevents infinite loops
- [ ] Template variable resolution handles nested paths
- [ ] Paused workflows do not execute
- [ ] Execution log shows step-by-step results with duration

---

### 11. Implementation Prerequisites

- All core modules stable and emitting Flare events consistently
- Event bus / pub-sub system operational
- Job queue (BullMQ or similar) for async execution
- WhatsApp Engine, Resend, and ClawdBot integrations operational
- Redis for rate limiting and delay scheduling

---

### 12. Open Questions

- [ ] Should v1 use a form-based builder or invest in a visual drag-and-drop canvas (e.g., React Flow)?
- [ ] Should workflows support parallel action branches (AND-split) or only sequential?
- [ ] Should there be workflow templates (pre-built automations that Caio can clone and customize)?
- [ ] How to handle workflow versioning — if a workflow is edited, do in-flight executions use the old or new version?
- [ ] Should workflows have a "scope" concept (e.g., only trigger for specific drops or products)?
- [ ] What is the SLA for workflow execution latency (event emitted -> action executed)?

---

## E10. WhatsApp Group Manager (A2)

**Vive dentro de:** WhatsApp Engine + CRM
**Inspiracao:** SendFlow.com.br

### Overview

Plataforma de automacao de grupos WhatsApp para engajamento de comunidade. Contorna limite de participantes por grupo via criacao/rotacao automatica.

### Features

- Criacao automatica de grupos WhatsApp (contornando limite de participantes)
- Adicao/remocao automatica de membros baseado em segmentos CRM
- Broadcast em grupos (texto, audio, video, arquivos)
- Welcome messages automaticas para novos membros
- Lead scoring por engajamento em grupo
- Import/export de comunidades
- Dashboard de analytics por grupo

### Nota tecnica

Requer WhatsApp Web automation (Playwright/Puppeteer), NAO usa Meta Cloud API oficial. Risco de ban — requer "guia anti-banimento" e boas praticas. Produto separado da messaging via API oficial.

**Complexidade:** Alta
**Prioridade:** Media
**Phase:** v2.0
**Dependencias:** WhatsApp Engine (Phase 1A) operacional

---

## E11. Reviews & Ratings

### 1. Overview

**What it does:** Product review and rating system with automated post-purchase requests, media uploads (photos/videos), moderation workflow, and public display. Reviews feed social proof widgets (On-Site Engine) and provide product quality signals.

**Host modules:** Checkout + CRM

**Priority:** Medium — high impact on conversion (social proof) and product quality feedback.

**Business impact:**
- Social proof on product pages increases conversion rate 10-30%
- Post-purchase review requests via WhatsApp/email drive engagement
- Low-rating alerts enable rapid quality response (operational feedback loop)
- Review photos serve as UGC for marketing (feeds DAM/Marketing Intel)
- Verified purchase badges build trust in the streetwear community

---

### 2. User Stories

| # | As a... | I want to... | So that... | Acceptance Criteria |
|---|---------|-------------|-----------|-------------------|
| US-01 | Customer | Receive a review request after my order is delivered | I can share my experience with the product | Review request sent via WA/email `request_delay_hours` after `order.delivered`; unique link per order+contact |
| US-02 | Customer | Submit a review with rating, text, and photos | Other customers can see real feedback | Review form: 1-5 stars (required), title (optional), body (optional), up to 5 photos (5MB each); LGPD consent checkbox |
| US-03 | Visitor | See product reviews on the product page | I can make an informed purchase decision | Public API returns reviews with avg rating, distribution, and paginated list; verified purchase badge |
| US-04 | PM (Caio) | See review analytics and moderate submissions | I can maintain quality and respond to issues | Review dashboard: pending moderation, avg rating trend, response rate; bulk approve/reject |
| US-05 | Admin (Marcus) | Configure review request timing and auto-approve rules | Reviews flow automatically without manual work | Config singleton: request_delay_hours, cooldown_days, auto_approve_threshold, low_rating_alert_threshold |
| US-06 | Support (Slimgust) | Respond to negative reviews | Customers feel heard and issues are resolved | Admin response field on each review; response visible publicly below the review |

---

### 3. Data Model

#### Schema: `reviews` (new schema, 4 tables)

```sql
CREATE SCHEMA IF NOT EXISTS reviews;
```

#### reviews.reviews

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | UUID v7 |
| product_id | UUID | NOT NULL, FK erp.products(id) | Reviewed product |
| contact_id | UUID | NOT NULL, FK crm.contacts(id) | Reviewer |
| order_id | UUID | NULL, FK checkout.orders(id) | Source order (verified purchase) |
| rating | INTEGER | NOT NULL, CHECK (rating BETWEEN 1 AND 5) | 1-5 star rating |
| title | VARCHAR(255) | NULL | Review title |
| body | TEXT | NULL | Review body text |
| status | reviews.review_status | NOT NULL DEFAULT 'pending' | pending, approved, rejected |
| is_verified_purchase | BOOLEAN | NOT NULL DEFAULT FALSE | TRUE if order_id is set |
| admin_response | TEXT | NULL | Admin/support response |
| admin_response_by | UUID | NULL, FK global.users(id) | Who responded |
| admin_response_at | TIMESTAMPTZ | NULL | When response was posted |
| flagged_reason | TEXT | NULL | If auto-flagged (profanity, URLs) |
| helpful_count | INTEGER | NOT NULL DEFAULT 0 | "Was this helpful?" counter |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete |

```sql
CREATE UNIQUE INDEX idx_reviews_order_contact ON reviews.reviews (order_id, contact_id) WHERE order_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_reviews_product ON reviews.reviews (product_id);
CREATE INDEX idx_reviews_status ON reviews.reviews (status);
CREATE INDEX idx_reviews_rating ON reviews.reviews (product_id, rating);
CREATE INDEX idx_reviews_created ON reviews.reviews (created_at DESC);
```

#### reviews.review_media

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| review_id | UUID | NOT NULL, FK reviews.reviews(id) ON DELETE CASCADE | |
| type | VARCHAR(10) | NOT NULL | 'photo' or 'video' |
| url | TEXT | NOT NULL | R2 storage URL |
| thumbnail_url | TEXT | NULL | Generated thumbnail |
| file_size_bytes | INTEGER | NOT NULL | Max 5MB for photos |
| sort_order | INTEGER | NOT NULL DEFAULT 0 | Display order |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE INDEX idx_review_media_review ON reviews.review_media (review_id);
```

#### reviews.review_config

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Singleton — only 1 row |
| request_delay_hours | INTEGER | NOT NULL DEFAULT 48 | Hours after delivery to send review request |
| cooldown_days | INTEGER | NOT NULL DEFAULT 30 | Min days between review requests to same contact |
| auto_approve_threshold | INTEGER | NOT NULL DEFAULT 4 | Auto-approve if rating >= this (1-5, 0=disable) |
| low_rating_alert_threshold | INTEGER | NOT NULL DEFAULT 2 | Flare alert if rating <= this |
| auto_reply_enabled | BOOLEAN | NOT NULL DEFAULT FALSE | Reserved for future AI auto-reply |
| request_channel | VARCHAR(20) | NOT NULL DEFAULT 'whatsapp' | 'whatsapp', 'email', 'both' |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

#### reviews.review_requests

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| order_id | UUID | NOT NULL, FK checkout.orders(id) | |
| contact_id | UUID | NOT NULL, FK crm.contacts(id) | |
| channel | VARCHAR(20) | NOT NULL | 'whatsapp' or 'email' |
| sent_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | When request was sent |
| responded_at | TIMESTAMPTZ | NULL | When review was submitted |
| review_id | UUID | NULL, FK reviews.reviews(id) | Linked review if responded |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE UNIQUE INDEX idx_review_requests_order_contact ON reviews.review_requests (order_id, contact_id);
CREATE INDEX idx_review_requests_contact ON reviews.review_requests (contact_id);
```

#### New ENUMs

```sql
CREATE TYPE reviews.review_status AS ENUM ('pending', 'approved', 'rejected');
```

---

### 4. Screens & UI

#### Review Submission (Public — via unique link)

```
┌─────────────────────────────────────────────────┐
│                   CIENA                          │
│                                                  │
│   Conta pra gente o que achou!                  │
│                                                  │
│   Pedido #4521 — Camiseta Preta Basic (M)       │
│                                                  │
│   Nota:  ★ ★ ★ ★ ☆                             │
│                                                  │
│   Titulo (opcional):                            │
│   [________________________________]            │
│                                                  │
│   Sua avaliacao:                                │
│   [________________________________]            │
│   [________________________________]            │
│   [________________________________]            │
│                                                  │
│   Fotos (ate 5, max 5MB cada):                  │
│   [+ Adicionar fotos]                           │
│                                                  │
│   [☑ Aceito que minha avaliacao seja            │
│       exibida publicamente (LGPD)]              │
│                                                  │
│   [ENVIAR AVALIACAO]                            │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### Review Moderation (Admin — CRM > Reviews)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRM > Reviews                                          [⚙ Configuracoes] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Pendentes│  │Aprovados │  │Rejeitados│  │ Media    │                   │
│  │    12    │  │   342    │  │    8     │  │ ★ 4.3   │                   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                   │
│                                                                             │
│  PENDENTES DE MODERACAO                                                    │
│  ┌──────────────────┬───────┬──────────────────────┬────────┬────────────┐ │
│  │ Produto          │ Nota  │ Texto                │ Fotos  │ Acoes      │ │
│  ├──────────────────┼───────┼──────────────────────┼────────┼────────────┤ │
│  │ Camiseta Preta   │ ★★★★★ │ "Qualidade incrivel, │ 2      │ [✅] [❌]  │ │
│  │                  │       │  caimento perfeito"  │        │ [Responder]│ │
│  ├──────────────────┼───────┼──────────────────────┼────────┼────────────┤ │
│  │ Moletom Drop 9   │ ★★    │ "Veio com defeito   │ 1      │ [✅] [❌]  │ │
│  │ ⚠ Low Rating    │       │  na costura"         │        │ [Responder]│ │
│  └──────────────────┴───────┴──────────────────────┴────────┴────────────┘ │
│                                                                             │
│  Mostrando 1-12 de 12 pendentes                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5. API Endpoints

#### Internal (10)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/reviews/reviews` | Internal | List reviews (filterable by product, status, rating) |
| GET | `/api/v1/reviews/reviews/:id` | Internal | Get review detail |
| PATCH | `/api/v1/reviews/reviews/:id` | Internal | Update review (admin response) |
| POST | `/api/v1/reviews/reviews/:id/actions/approve` | Internal | Approve review |
| POST | `/api/v1/reviews/reviews/:id/actions/reject` | Internal | Reject review |
| POST | `/api/v1/reviews/reviews/:id/actions/respond` | Internal | Add admin response |
| POST | `/api/v1/reviews/import` | Internal | Import reviews from CSV |
| GET | `/api/v1/reviews/config` | Internal | Get review config singleton |
| PATCH | `/api/v1/reviews/config` | Internal | Update review config |
| GET | `/api/v1/reviews/analytics` | Internal | Review analytics (avg rating trend, response rate, pending count) |

#### Public (3)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/public/reviews/products/:productId` | None | Get reviews for a product (paginated, approved only). Query: `?sort=-createdAt&limit=10` |
| GET | `/api/v1/public/reviews/products/:productId/summary` | None | Get avg rating + distribution (5-star histogram) |
| POST | `/api/v1/public/reviews/submit` | None (token-based) | Submit review via unique link token. Body: `{ token, rating, title?, body?, photos?[] }` |

---

### 6. Business Rules

| # | Rule | Condition | Outcome |
|---|------|-----------|---------|
| BR-01 | One review per order per contact | Same `order_id + contact_id` | Reject with "Voce ja avaliou este pedido." |
| BR-02 | Verified purchase badge | `order_id IS NOT NULL` | Show "Compra verificada" badge on public display |
| BR-03 | Auto-approve threshold | `rating >= review_config.auto_approve_threshold` | Auto-set `status = 'approved'`; skip moderation queue |
| BR-04 | Low-rating alert | `rating <= review_config.low_rating_alert_threshold` | Send Flare alert (in-app + Discord #alertas) to admin, pm, support |
| BR-05 | Review request timing | `order.delivered + request_delay_hours` | Send review request via configured channel (WA/email/both) |
| BR-06 | Cooldown between requests | `last_request_sent_at + cooldown_days` | Skip sending if within cooldown period |
| BR-07 | Content moderation | URLs or profanity detected in body | Auto-flag `flagged_reason = 'content_filter'`; force manual moderation (even if above threshold) |
| BR-08 | Media limits | Max 5 photos, 5MB each | Reject upload with "Maximo de 5 fotos, 5MB cada." |
| BR-09 | Review link expiration | Token valid for 30 days after delivery | Expired tokens return "Link expirado. Entre em contato com o suporte." |

---

### 7. Integrations

| Integration | Direction | Detail |
|-------------|-----------|--------|
| CRM | Read | Contact data for review request dispatch |
| CRM (On-Site) | Write | Approved reviews feed social proof widgets (avg rating, review count) |
| Checkout | Read | Order data for verified purchase badge |
| WhatsApp Engine | Write | Send `wa_review_request` template via CRM automation L2 |
| Email (Resend) | Write | Send `email_review_request` template |
| DAM | Write | Review photos optionally flow into DAM as UGC |
| Flare | Write | Low-rating alerts |
| Cloudflare R2 | Write | Store review media (photos/videos) |

**Events emitted:**
- `review.submitted` — new review created (pending moderation)
- `review.approved` — review approved (triggers social proof update)
- `review.low_rating` — review with rating <= threshold

---

### 8. Background Jobs

| Job | Trigger | Schedule | Description |
|-----|---------|----------|-------------|
| `reviews:send-requests` | `order.delivered` + delay | Async (queue) | Send review request via WA/email after `request_delay_hours`. Check cooldown. Creates `review_requests` row. |
| `reviews:aggregate-ratings` | Hourly | Cron | Update cached avg rating + distribution per product in Redis (60s TTL for public API) |
| `reviews:auto-moderate` | On `review.submitted` | Async | Check content filter (URLs, profanity). If clean and rating >= threshold, auto-approve. Else, queue for manual moderation. |

---

### 9. Permissions

| Role | List/Read | Moderate | Respond | Config | Delete |
|------|-----------|----------|---------|--------|--------|
| admin | Y | Y | Y | Y | Y |
| pm | Y | Y | Y | Y | -- |
| support | Y | -- | Y | -- | -- |
| All other internal | -- | -- | -- | -- | -- |
| Public (no auth) | Read approved | -- | -- | -- | -- |

Reference: [AUTH.md](../architecture/AUTH.md)

---

### 10. Testing Checklist

- [ ] Review request sent `request_delay_hours` after delivery
- [ ] Cooldown prevents duplicate requests within `cooldown_days`
- [ ] Review submission via unique token link works (rating + text + photos)
- [ ] Duplicate review (same order + contact) rejected with friendly message
- [ ] Auto-approve fires when rating >= threshold
- [ ] Low-rating alert fires via Flare when rating <= threshold
- [ ] Content filter flags reviews with URLs or profanity
- [ ] Max 5 photos, 5MB each enforced on upload
- [ ] Public API returns only approved reviews
- [ ] Product summary returns correct avg rating and star distribution
- [ ] Admin can respond to review; response visible publicly
- [ ] Review link expires after 30 days

---

### 11. Implementation Prerequisites

- CRM contacts module operational (Phase 1A)
- Checkout orders with delivery tracking (Phase 1A)
- WhatsApp Engine for review request dispatch (Phase 1A)
- On-Site Widget Engine for social proof display (Phase 2)
- Cloudflare R2 for media storage (Phase 0)

---

### 12. Open Questions

- [ ] Should reviews be product-level or variant/SKU-level? (Product-level recommended for streetwear — limited editions have few units per size)
- [ ] Should there be a "Was this helpful?" voting system for reviews? (Counter exists in schema but UI deferred)
- [ ] Should AI auto-reply to reviews be a Phase 2 feature? (Config field exists but implementation deferred)
- [ ] How to handle reviews for products that are discontinued/out of stock permanently?

---

## Cross-Expansion Dependencies

```
E1 (Waitlist)      ──► E3 (Channel Allocation) — VIP allocation uses waitlist data
E2 (Cloud Estoque) ──► E3 (Channel Allocation) — cloud items need channel-aware availability
E4 (Size Rec)      ◄── Trocas module (core)     — exchange data feeds correction model
E6 (UGC Site)      ◄── Marketing Intel (core)    — UGC pipeline starts in Marketing Intel
E7 (Copy Gen)      ──► E8 (Pricing AI)           — both use Claude API; share integration
E8 (Pricing AI)    ◄── ERP Margin Calc (core)    — extends existing margin calculator
E9 (Workflow)      ◄── All core modules          — requires stable event bus from all modules
E10 (WA Groups)    ◄── WhatsApp Engine (core)    — requires WA Engine operational for group automation
E11 (Reviews)      ◄── CRM + Checkout (core)     — requires contacts + orders + On-Site widgets for social proof
```

## Implementation Roadmap

| Phase | Expansions | When | Rationale |
|-------|-----------|------|-----------|
| **v1.1** | E1, E2, E5 | After core modules stable | High customer impact; medium complexity |
| **v1.2** | E4, E6, E7, E11 | +2-3 months after v1.1 | Requires accumulated data (E4 exchange data, E6 UGC pipeline, E11 review volume) |
| **v2.0** | E3, E8, E9, E10 | +3-6 months after v1.2 | Complex implementations requiring mature data and stable platform |

---

## Future Consideration: E12. Ambassador Program (standalone)

> **Status:** Not yet approved — evaluate when Creators ambassador tier reaches 1,000+ active ambassadors.

**Rationale:** The Pandora96 ambassador program (100k+ embaixadoras) demonstrates that a massive, zero-commission ambassador program can become a standalone growth engine. If CIENA's ambassador tier (currently part of the Creators module) scales beyond what the Creators module can reasonably contain, it may warrant extraction into a dedicated module with its own:
- Self-service onboarding portal (no PM approval needed)
- Separate ranking and leaderboard system
- Community features (ambassador-to-ambassador messaging, regional groups)
- Brand advocacy analytics (UGC volume, social reach, engagement aggregation)
- Gamification beyond CIENA Points (badges, levels, exclusive events)

**Trigger for extraction:** Ambassador count > 1,000 AND ambassador-generated GMV > 20% of total creator GMV. Until then, the ambassador tier lives comfortably within the Creators module.
