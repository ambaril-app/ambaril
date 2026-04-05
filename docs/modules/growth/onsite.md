# CRM / On-Site Widget Engine — Sub-Spec

> **Sub-spec of:** [CRM module](crm.md) — Phase 2. **Not a standalone module.** Onsite widgets are a feature set of the CRM, not a separate sidebar item or sold independently.
> **Schema:** `onsite`
> **Route prefix:** `/api/v1/onsite`
> **Admin UI route group:** `(admin)/crm/onsite/*`
> **CDN entry point:** `cdn.ambaril.com/onsite.js`
> **Version:** 1.0
> **Date:** April 2026
> **Status:** Planned (CRM Phase 2 — Semanas 10-11)
> **References:** [DATABASE.md](../../architecture/DATABASE.md), [API.md](../../architecture/API.md), [AUTH.md](../../architecture/AUTH.md), [CRM spec](crm.md), [Mensageria spec](../communication/mensageria.md)

---

## 1. Purpose & Scope

The Onsite feature set is the **widget injection engine** of the CRM module. It enables tenants to deploy conversion-focused widgets on any website or ecommerce platform — without platform-specific code. A single JavaScript snippet is installed once; all widget creation, targeting, and analytics are managed from the Ambaril CRM admin (`(admin)/crm/onsite/`).

> **Why this lives in CRM:** All targeting uses CRM segments. Lead capture creates `crm.contacts`. Review widgets pull from `crm.reviews`. Social proof uses `erp.orders`. The Ambaril Tracker (CRM) handles visitor identification. Onsite without CRM is just a basic popup tool — CRM is what makes it intelligent.

**Core philosophy:** Ambaril is platform-agnostic. The same widgets that work on Shopify work on Nuvemshop, Vtex, WooCommerce, or any custom site. Platform integrations (Shopify Theme App Extension, Nuvemshop App) are optional enhancements that unlock deeper context (cart state, checkout events), not requirements.

**Core responsibilities:**

| Capability              | Description                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Widget Builder**      | Create and configure widgets (popups, banners, sliders, social proof, chat, review snippets) via visual builder in admin |
| **Targeting Engine**    | Rule-based targeting: URL patterns, scroll depth, time on page, device type, CRM segment, visitor status (new/returning) |
| **Snippet Injection**   | Single `<script>` tag loads all active widgets for the tenant. Zero-config installation                                  |
| **Lead Capture**        | Popup/slider form submissions create `crm.contacts` with `consent_email` and/or `consent_sms`                            |
| **Social Proof Engine** | Real-time purchase notifications using live `erp.orders` data                                                            |
| **Review Widgets**      | Star rating teaser and inline star snippets using `crm.reviews` aggregate data                                           |
| **Analytics**           | Per-widget metrics: views, clicks, CTR, conversions (purchases), subscribers (email + SMS), revenue attributed           |
| **A/B Testing**         | Two variants per widget, automatic traffic split, winner detection by conversion rate                                    |

**Out of scope (v1):**

- Deep funnel tracking inside checkout (use Ambaril Tracker + Shopify Web Pixel for that)
- Full page personalization / product recommendations on PDP (CRM Phase 2, O3)
- Live shopping widget / streaming (CRM O9, future)

**Primary users:**

- **Caio (PM):** Creates and manages campaigns, monitors analytics
- **Yuri (Creative Director):** Designs widget content (images, copy)
- **System (automated):** Social Proof uses real-time ERP data; Review widgets pull from `crm.reviews`

---

## 2. Architecture

### 2.1 Installation

```html
<!-- Install once in <head> or before </body> of any site -->
<script
  src="https://cdn.ambaril.com/onsite.js"
  data-app-id="[tenant_app_id]"
  async
></script>
```

`tenant_app_id` is a public identifier (not a secret). It maps to the tenant's active widget configuration. The script is served from Cloudflare CDN with aggressive caching (immutable for versioned URLs).

On load, `onsite.js`:

1. Reads `data-app-id` from the script tag
2. Fetches tenant widget configuration from `/api/v1/onsite/config/[app_id]` (edge-cached, max 60s TTL)
3. Evaluates targeting rules for the current page/visitor
4. Injects matching widgets into the DOM
5. Reports `onsite.widget_view` events to Ambaril Tracker

### 2.2 Platform Integrations (Optional Enhancements)

| Platform    | Enhancement         | How                                                                        |
| ----------- | ------------------- | -------------------------------------------------------------------------- |
| Shopify     | Theme App Extension | Deeper cart state, product page context, checkout events via Web Pixel     |
| Nuvemshop   | App install         | Cart abandonment signals, customer data injection                          |
| Vtex IO     | IO App              | Product catalog context                                                    |
| Custom site | Manual events       | `AmbarilOnsite.identify({ email, name })` JS API for custom identification |

When a platform integration is active, Onsite receives richer context. Without it, it works with URL patterns and behavioral signals only.

### 2.3 Identity Resolution

Onsite shares the `_amb_vid` cookie with Ambaril Tracker. If a visitor is already identified (via Tracker), Onsite can:

- Apply CRM segment targeting (serve a widget only to "VIP" segment members)
- Suppress subscriber popups for known contacts (avoid asking for email they already gave)
- Personalize widget content (`{{contact.first_name}}` placeholder in widget copy)

### 2.4 Provider-Agnostic CDN

The `onsite.js` bundle is built and published to Cloudflare R2 (served via CDN worker). No Vercel dependency for the client-side script — this ensures it loads fast from any geography and doesn't count against Vercel Edge invocations.

---

## 3. Widget Types

### 3.1 Popup

Modal overlay appearing on top of page content. Most flexible widget type.

**Trigger options:**
| Trigger | Description |
|---------|-------------|
| Tempo na página | Show after N seconds on the page |
| Exit intent (desktop) | Mouse leaves the browser viewport toward the address bar |
| Exit intent mobile (scroll up) | User rapidly scrolls up (leaving intent) |
| Exit intent mobile (inatividade) | No interaction for N seconds on mobile |
| Scroll depth | User has scrolled X% of the page |
| URL match | Show only on specific pages (product page, cart, homepage) |
| Frequency | Show once per session / once per day / always |

**Content types:**

- **Newsletter signup:** email field + optional SMS field (consent checkbox). Submit → `crm.contacts` created/updated with `consent_email=true` / `consent_sms=true`
- **Spin to Win (gamification):** Wheel with prizes (% discounts, free shipping). Email capture required to spin. Prize delivered as Shopify coupon code (via `ecommerce` capability)
- **Announcement:** text + optional CTA button (link to URL)
- **Countdown:** countdown timer + CTA (integrates with CRM Drop Countdown, O5)
- **Custom:** raw HTML/CSS block (advanced users only)

**Templates library:** Pre-built design templates in categories:

- Captar inscritos (newsletter, SMS opt-in)
- Promoções (desconto, frete grátis)
- Gamificação (Spin to Win)
- Exit intent
- Sazonais (Black Friday, Natal, etc.)

**Analytics per popup:**

- Visualizações, Novos inscritos (email), Novos inscritos (SMS), Cliques, CTR, Conversões, Receita atribuída (7-day window after popup interaction)

### 3.2 Banner / Weblayer

Inline or sticky banner, typically at top or bottom of page. Lower friction than popup.

**Types:**

- **Announcement bar (sticky top):** thin bar with text + optional CTA. Common use: "Frete grátis acima de R$ 299" or "Drop 13 chegou! Ver coleção →"
- **Content overlay (weblayer):** full-width content block injected into page. Appears between page sections.
- **Sticky bottom bar:** CTA bar fixed at bottom of viewport on mobile

**Targeting:** same as Popup (URL, device, time, scroll, CRM segment)

**Metrics:** Views, Clicks, CTR, Subscribers, Revenue attributed

### 3.3 Slider

Sliding panel (drawer) from left or right edge. Less intrusive than popup.

**Typical uses:**

- Email/SMS signup with value prop ("Seja o primeiro a saber dos drops. Digite seu e-mail.")
- Promotional content
- Cookie consent (future LGPD requirement)

**Trigger:** same options as Popup, plus "scroll to bottom of page"

### 3.4 Social Proof Notifications

Small toast notification appearing at a corner of the page showing real purchase activity.

**Data source:** `erp.orders` — live purchases, anonymized by default (first name + city only: "Murillo de São Paulo comprou..."). Respects LGPD: no full name without explicit display consent.

**Configuration:**

- Display position: bottom-left, bottom-right, top-left, top-right
- Display duration: 4s–10s
- Frequency: every N seconds when there's activity
- Anonymization level: "M. de São Paulo" (masked) or "Murillo de São Paulo" (first name + city)
- Minimum order age: show purchases from last N hours/days (prevent stale data)
- Exclude returns/cancelled orders
- Product image shown: yes/no

**Metrics:** Views, Clicks, CTR, "Pedidos apoiados" (orders placed within 30 min of social proof view + same product), Revenue supported

### 3.5 Chat Bubble

Floating action button (bottom right) linking to customer support channel.

**Options:**

- Redirect to WhatsApp (opens `https://wa.me/[phone]?text=[pre-filled message]`)
- Open Ambaril Inbox (direct conversation via Mensageria webhook)
- Custom URL

**Configuration:**

- Icon (WhatsApp logo or custom)
- Label text ("Fale conosco", "Precisa de ajuda?")
- Show/hide on mobile vs desktop
- URL / phone number

**Metrics:** Views, Clicks, CTR

### 3.6 Review Teaser

Aggregate star rating widget, typically displayed on the homepage or footer.

**Data source:** `crm.reviews` — aggregate average rating and total review count for the tenant's store reviews.

**Display:** `★★★★★ 4.7 — Baseado em 128 avaliações` (customizable format)

**Click behavior:** Opens review list page or scrolls to review section (configurable link)

**Placement:** Injected into a CSS selector defined in the widget config (e.g., `.footer-trust-badges`). Alternatively, uses a placeholder `div` with `data-ambaril-widget="review-teaser"`.

### 3.7 Star Snippet (Product Rating)

Inline star rating on product pages, showing per-product review average.

**Data source:** `crm.reviews WHERE review_type='product' AND product_id=[shopify_product_id]`

**Placement:** Injected below product title via CSS selector or placeholder div

**Schema.org markup:** Automatically adds `<meta itemprop="aggregateRating">` for Google rich snippets

**Minimum reviews:** Widget only renders if product has ≥ 3 reviews (configurable threshold to avoid misleading single-review stars)

---

## 4. Domain Model

### 4.1 Entity Relationship Diagram (ASCII)

```
 ┌──────────────────────────┐       ┌────────────────────────┐
 │    onsite.widgets        │       │  onsite.widget_variants │
 │──────────────────────────│       │────────────────────────│
 │ id (PK)                  │◄──────│ id (PK)                │
 │ tenant_id (FK)           │       │ widget_id (FK)         │
 │ name                     │       │ variant_label          │  ← A or B
 │ widget_type              │       │ weight (%)             │  ← traffic split
 │ status                   │       │ content (JSONB)        │  ← all visual config
 │ targeting_rules (JSONB)  │       │ is_winner              │
 │ ab_test_active           │       │ created_at             │
 │ created_at               │       └────────────────────────┘
 │ updated_at               │
 │ deleted_at               │       ┌────────────────────────┐
 └────────────┬─────────────┘       │  onsite.widget_events  │
              │ 1:N                  │────────────────────────│
              ▼                      │ id (PK)                │
 ┌──────────────────────────┐        │ tenant_id (FK)         │
 │   onsite.widget_stats    │        │ widget_id (FK)         │
 │──────────────────────────│        │ variant_id (FK)        │
 │ id (PK)                  │        │ visitor_id             │  ← _amb_vid
 │ widget_id (FK)           │        │ contact_id (FK)        │  ← if identified
 │ date (DATE)              │        │ event_type             │  ← 'view'|'click'|'submit'
 │ views                    │        │ email_captured         │
 │ clicks                   │        │ sms_captured           │
 │ subscribers_email        │        │ metadata (JSONB)       │
 │ subscribers_sms          │        │ created_at             │
 │ conversions              │        └────────────────────────┘
 │ revenue_attributed (NUM) │
 └──────────────────────────┘
```

### 4.2 Database Schema

```sql
CREATE SCHEMA IF NOT EXISTS onsite;

CREATE TABLE onsite.widgets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES global.tenants(id),
  name             TEXT NOT NULL,
  widget_type      TEXT NOT NULL CHECK (widget_type IN (
                     'popup', 'banner', 'slider', 'social_proof', 'chat_bubble',
                     'review_teaser', 'star_snippet'
                   )),
  status           TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive','draft')),
  targeting_rules  JSONB NOT NULL DEFAULT '{}',
  -- targeting_rules shape:
  -- { url_patterns: string[], devices: string[], triggers: TriggerConfig[],
  --   crm_segment_ids: string[], min_page_views: number, visitor_type: 'new'|'returning'|'all' }
  ab_test_active   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE TABLE onsite.widget_variants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id        UUID NOT NULL REFERENCES onsite.widgets(id),
  variant_label    TEXT NOT NULL DEFAULT 'A', -- 'A' or 'B'
  weight           SMALLINT NOT NULL DEFAULT 100, -- % traffic (must sum to 100 across variants)
  content          JSONB NOT NULL DEFAULT '{}',
  -- content shape varies by widget_type, e.g. for popup:
  -- { template_id, headline, body, cta_text, cta_url, image_url,
  --   form_fields: ['email'|'sms'], countdown_target_date, spin_prizes: [...] }
  is_winner        BOOLEAN,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE onsite.widget_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES global.tenants(id),
  widget_id        UUID NOT NULL REFERENCES onsite.widgets(id),
  variant_id       UUID REFERENCES onsite.widget_variants(id),
  visitor_id       TEXT,                              -- _amb_vid
  contact_id       UUID REFERENCES crm.contacts(id), -- null if unidentified
  event_type       TEXT NOT NULL CHECK (event_type IN ('view','click','submit','close','spin_result')),
  email_captured   TEXT,   -- hashed after dedup, null if event_type != 'submit'
  sms_captured     TEXT,   -- hashed, null if not captured
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON onsite.widget_events (tenant_id, widget_id, created_at DESC);
CREATE INDEX ON onsite.widget_events (tenant_id, visitor_id);

-- Daily aggregated stats (materialized by Vercel Cron 00:30 BRT)
CREATE TABLE onsite.widget_stats (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id             UUID NOT NULL REFERENCES onsite.widgets(id),
  variant_id            UUID REFERENCES onsite.widget_variants(id),
  date                  DATE NOT NULL,
  views                 INTEGER NOT NULL DEFAULT 0,
  clicks                INTEGER NOT NULL DEFAULT 0,
  submissions           INTEGER NOT NULL DEFAULT 0,
  subscribers_email     INTEGER NOT NULL DEFAULT 0,
  subscribers_sms       INTEGER NOT NULL DEFAULT 0,
  conversions           INTEGER NOT NULL DEFAULT 0, -- purchases within 7-day attribution window
  revenue_attributed    NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (widget_id, variant_id, date)
);
```

---

## 5. User Stories

| #     | As a... | I want to...                                                     | Acceptance Criteria                                                                                                                                                                                                                                                                                                                                               |
| ----- | ------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-01 | Caio    | Create a newsletter popup to capture email + SMS on the homepage | Popup builder: select "Newsletter signup" template, configure headline/body/CTA, add email field + SMS opt-in checkbox (with LGPD consent text), set trigger "15s na página + homepage URL only". Preview renders correctly. Publish. Snippet on site shows popup after 15s. Submit creates/updates `crm.contacts` with `consent_email=true`, `consent_sms=true`. |
| US-02 | Caio    | Create a Spin to Win popup for a weekend promotion               | Select "Gamificação → Gire e Ganhe" template. Configure 6 prizes: 3x "10% OFF", 2x "15% OFF", 1x "Frete grátis". Each prize maps to a Shopify discount code prefix. Submit generates coupon and shows to user.                                                                                                                                                    |
| US-03 | Caio    | Show "Maria from São Paulo just bought X" notifications          | Social Proof widget: connect to `erp.orders`. Configure: show orders from last 48h, anonymize to first name + city, display 6s, position bottom-left. Activate. On product pages, toasts appear when orders exist.                                                                                                                                                |
| US-04 | Caio    | Show aggregate store rating on the homepage                      | Review Teaser widget: configure CSS selector `.trust-badges`. Shows `★★★★★ 4.7 — Baseado em 128 avaliações`. Updates in real time as new reviews come in.                                                                                                                                                                                                         |
| US-05 | Caio    | Show per-product star rating on product pages                    | Star Snippet widget: automatic injection at `[data-ambaril-widget="star-snippet"]` placeholder or below `.product-title` CSS selector. Queries `crm.reviews` for the product ID in the page URL. Renders only if ≥ 3 reviews. Schema.org markup included.                                                                                                         |
| US-06 | Caio    | A/B test two popup variants                                      | Popup settings → "Ativar teste A/B". Create Variant A (current) and Variant B (alternative headline). Set 50/50 split. After 7 days, view results: variant A had 4.2% CTR, variant B had 6.1% CTR. Click "Declarar vencedor B". From now on, 100% of traffic sees variant B.                                                                                      |
| US-07 | Caio    | See which widgets are driving revenue                            | Onsite dashboard: per-widget table with `Receita atribuída (7 dias)` column. Sort by revenue descending. The Spin to Win popup shows R$ 3.240 attributed in the last 7 days.                                                                                                                                                                                      |
| US-08 | Caio    | Suppress email popup for contacts already in the CRM             | Widget targeting: enable "Não mostrar para contatos já identificados". Visitors with active `_amb_vid` linked to a `crm.contacts` record with `consent_email=true` don't see the newsletter popup.                                                                                                                                                                |
| US-09 | Yuri    | See a live preview of a widget before publishing                 | Widget editor: live preview panel on the right side shows exactly how the widget will appear on mobile + desktop. Toggle between viewports.                                                                                                                                                                                                                       |
| US-10 | Admin   | View overall Onsite performance dashboard                        | `(admin)/crm/onsite/dashboard`: Metrics strip (active widgets, total views, total subscribers today, total revenue attributed). Per-widget table. Charts: subscribers over time by type (email vs SMS), top-performing widgets by CTR.                                                                                                                            |

---

## 6. Targeting Engine

### 6.1 Rule Types

All rules are combined with AND logic (all conditions must match for the widget to show). Individual rule groups can use OR internally.

| Rule                 | Config                                                   | Example                                          |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| URL pattern          | glob or regex                                            | `**/colecao/**` → shows on collection pages only |
| URL exclusion        | glob or regex                                            | `**/checkout/**` → never shows during checkout   |
| Device type          | mobile / tablet / desktop                                | Mobile-only popup                                |
| Scroll depth         | 0–100%                                                   | Show after 50% scroll                            |
| Time on page         | seconds                                                  | Show after 30s                                   |
| Page views (session) | count                                                    | Show only after viewing 2+ pages                 |
| Visitor type         | new / returning / all                                    | New visitor popup vs returning VIP popup         |
| CRM segment          | segment_id[]                                             | Show "VIP Exclusive" popup only to VIP segment   |
| Display frequency    | once_per_session / once_per_day / once_per_week / always |                                                  |
| Start / End date     | datetime                                                 | Seasonal campaign window                         |

### 6.2 CRM Segment Targeting

When Ambaril Tracker has identified the visitor (via `visitor_id` → `contact_id` linkage), the Onsite snippet can fetch the visitor's CRM segments in real time:

`GET /api/v1/onsite/visitor-context/[app_id]?vid=[visitor_id]`

Returns: `{ segmentIds: string[], isKnown: boolean }` (no PII, never returns contact data to the client).

This call is made once per page load (max 200ms timeout — if it fails, falls back to non-personalized targeting). The result is cached in `sessionStorage` for the session.

---

## 7. Analytics & Attribution

### 7.1 Attribution Model

Revenue is attributed to a widget interaction if:

1. The visitor had a `widget.click` or `widget.submit` event for that widget
2. The visitor placed an order within **7 calendar days** of the interaction
3. The order is linked to the same `visitor_id` (or `contact_id` if identified)

Attribution is last-touch within the 7-day window. If multiple widgets were interacted with, the most recent one gets credit.

### 7.2 Dashboard Metrics

Page: `(admin)/crm/onsite/dashboard`

**Metrics strip (today, vs previous 7 days):**

- Elementos ativos
- Visualizações totais
- Inscritos hoje (email + SMS)
- CTR médio
- Receita atribuída (7 dias)
- Pedidos apoiados

**Widget performance table:**
| Widget | Tipo | Status | Views | Inscritos | CTR | Conversões | Receita |
|--------|------|--------|-------|-----------|-----|-----------|---------|

**Charts:**

- Inscritos por dia (line chart, email vs SMS)
- Top 5 widgets por receita atribuída (horizontal bar)
- Funil por widget tipo: views → clicks → submits → conversions

### 7.3 Per-Widget Report

`(admin)/crm/onsite/[widgetId]/relatorio`:

- Daily metrics table (last 30 days)
- A/B test results (if active): variant A vs B comparison across all metrics
- Subscriber list (contacts captured via this widget) — links to CRM profiles
- Device breakdown: desktop vs mobile view/conversion split

---

## 8. Installation Guide

### 8.1 Quick Start (Any Platform)

1. In Ambaril admin: `(admin)/crm/onsite/instalacao` → copy the snippet
2. Paste snippet in the `<head>` of every page (or use a tag manager like GTM)
3. Verify: open browser console, look for `[Ambaril Onsite] initialized — tenant: [app_id]`
4. Create your first widget and activate it
5. Visit your site → widget appears

### 8.2 Shopify-Specific Install

1. Go to Shopify Admin → Themes → Edit code → `theme.liquid`
2. Paste snippet before `</head>`
3. Optional: install Ambaril Shopify Theme App Extension for deeper cart/checkout context

### 8.3 Nuvemshop Install

1. Nuvemshop Admin → Personalizar → HTML adicional → `<head>` section
2. Paste snippet

### 8.4 Google Tag Manager

1. Create new tag → Custom HTML
2. Paste snippet
3. Trigger: All Pages
4. Publish

---

## 9. Phase Roadmap

| Phase  | Semanas | Scope                                                                                                                                               |
| ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | 10-11   | Popup (newsletter + announcement), Banner, Social Proof, Chat Bubble, Dashboard basic. Snippet install. Lead capture → CRM                          |
| **2**  | 12-13   | Slider, Review Teaser, Star Snippet, Spin to Win, A/B testing, advanced targeting (CRM segments, device), revenue attribution                       |
| **3+** | Future  | Personalized widgets (product recommendations per visitor), AI copy generation, Vtex/WooCommerce deeper integrations, session recording integration |

---

## 10. Business Rules

| #    | Rule                                                                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ON-1 | Popup frequency: default `once_per_session`. Prevents spam. Configurable per widget but min `once_per_session` for subscriber popups                               |
| ON-2 | Lead capture requires explicit consent checkbox (LGPD). Cannot pre-check. Cannot hide the consent text                                                             |
| ON-3 | Social Proof data is real but anonymized (first name + city only) by default                                                                                       |
| ON-4 | Widgets never load inside checkout pages (`/checkout/**`, `/pagamento/**`)                                                                                         |
| ON-5 | Email captured via popup goes through deduplication against `crm.contacts` — if contact exists, updates consent, no duplicate created                              |
| ON-6 | A/B test declared winner ends the test and removes the losing variant from the rotation permanently                                                                |
| ON-7 | Star Snippet does not render if product has fewer than `min_reviews_threshold` (default: 3, configurable per tenant)                                               |
| ON-8 | CDN script is versioned (e.g., `onsite.v1.2.min.js`). Breaking changes use a new major version. Tenants on older versions are notified and have a migration period |
| ON-9 | Widget events (`onsite.widget_events`) are retained for 90 days, then archived or purged per LGPD data retention settings                                          |

---

## 11. LGPD Compliance

- All lead capture widgets must include visible LGPD consent text and an unchecked opt-in checkbox
- Email and SMS fields are transmitted over HTTPS only — never in plain GET parameters
- `contact_id` is never sent to the client-side snippet — only `visitor_id` (opaque identifier)
- `email_captured` in `onsite.widget_events` is hashed (SHA-256) after the dedup/upsert operation — the raw email is never stored in events, only in `crm.contacts`
- Data subject deletion (LGPD Art. 18): deleting a `crm.contacts` record cascades to nullify `contact_id` in `onsite.widget_events`; `visitor_id` events remain (anonymous)
- Cookie `_amb_vid` duration: 365 days. Must be disclosed in the tenant's cookie policy

---

## 12. Open Questions

| #    | Question                                                                                                                                                                                                  | Owner  | Status |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| OQ-1 | Should we build the popup visual editor in-house (canvas-based) or use a library like GrapesJS or Unlayer? In-house gives more control but significant dev effort.                                        | Marcus | Open   |
| OQ-2 | Spin to Win prizes: should Ambaril generate Shopify coupon codes automatically, or should the tenant create them in Shopify first and paste codes? Auto-generation requires `ecommerce` write capability. | Caio   | Open   |
| OQ-3 | Should the Chat Bubble support AI-powered FAQ responses (Astro), or only redirect to WhatsApp/Inbox? Phase 1 will be redirect-only; Astro integration is Phase 3.                                         | Marcus | Open   |
| OQ-4 | What is the CDN strategy for `onsite.js`? Options: (a) Cloudflare R2 + Cloudflare Workers for edge delivery, (b) Vercel Edge Middleware. R2 is preferred for cost and independence from Vercel.           | Marcus | Open   |

---

_This module spec is the source of truth for Onsite implementation. All development, review, and QA should reference this document. Changes require review from Marcus (admin) or Caio (pm)._
