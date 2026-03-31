# Ambaril — Phase 1: Creators — Execution Guide

> **Module:** Creators (Influencer Program)
> **Spec:** [`docs/modules/growth/creators.md`](docs/modules/growth/creators.md) (2.270 linhas, v1.2)
> **Design System:** [`DS.md`](DS.md) (Moonstone)
> **Agent Guide:** [`AGENT_TEAMS_GUIDE.md`](AGENT_TEAMS_GUIDE.md) (Part 2)
> **Updated:** 2026-03-30

---

## Phase 0 Summary (DONE)

Monorepo scaffolded (Next.js 15 + Turborepo + pnpm). Auth system functional. Admin layout with RBAC guard.
Drizzle schemas: 7 schemas, ~59 tables, 52 RLS policies. Multi-tenancy B+A (ADR-014).
CIENA tenant seeded with 9 users, 4 creator tiers, 7 roles, 45 permissions.
Commit `39ffbc4` (110 files, 53.9k lines).

## Phase 1 Creators — COMPLETE (2026-03-30)

All 7 Waves executed successfully. Type-check: 0 errors across 5 packages.

| Wave | Status | Files | Agents |
|------|--------|-------|--------|
| Pre-Wave (Schema) | DONE | 1 schema + migrations | Claude direct |
| Wave 1 (UI + Schemas) | DONE | 13 UI components + 24 Zod schemas | 3 agents |
| Wave 2 (Backend) | DONE | 18 server actions + 8 integration/stub files | 3 agents |
| Wave 3 (Admin Pages) | DONE | 47 admin page files | 4 agents |
| Wave 4 (Creator Portal) | DONE | 42 portal page files | 3 agents |
| Wave 5 (Public + Auth) | DONE | 9 files (form + creator-auth) | 2 agents |
| Wave 6 (Cron Jobs) | DONE | 12 cron routes + vercel.json | 2 agents |
| Wave 7 (Review + Polish) | DONE | Auth fixes on 17 pages, cleanup | 2 agents |

**Key stats:** ~160+ files created, 20+ agent executions, ~30k lines of code.

---

## Phase 1 Retrospective — What Went Wrong

Phase 1 delivered 100% functional coverage of the spec (27 user stories, 19 wireframes, 12 cron jobs). Type-check passes. But **the first-use experience is broken**.

### Root Cause: No Prioritization, No Integration-First

The spec describes a **mature** creator program. The implementation built everything at once, assuming data already exists (active creators, sales, campaigns, challenges, payouts). Result: ~20 pages with empty tables, no clear "what do I do first?" flow.

### Specific Problems

| Problem | Impact |
|---------|--------|
| 12 portal pages visible from day 1 | Creator sees sidebar with 12 items, ~8 are empty |
| 2 pages are pure stubs (Products, Materials) | Empty states with no functionality |
| No tenant onboarding flow | New tenant has no way to import existing coupons/influencers from their e-commerce/checkout platforms |
| Integrations hardcoded to Shopify+Yever | Not every tenant uses those platforms — need provider abstraction |
| Admin has 11 sub-routes at same level | PM doesn't know what to do first (configure tiers? approve pending?) |
| Data depends on integrations not yet triggered | Sales attribution needs Yever webhooks, content detection needs IG API polling |
| No "adopt running operation" | Tenant already has active coupons and influencers — system ignores this |

### What Should Have Happened

```
What was built:                      What should have been built:
─────────────────                    ────────────────────────────
Phase 1: EVERYTHING AT ONCE          Layer 0: Integration & Import
  160+ files, 30k LOC                  - Integration catalog (tenant picks providers)
  27 user stories                       - Pull existing coupons from connected platform
  12 cron jobs                          - Detect active influencers
  Full admin + full portal              - Setup wizard for PM

                                      Layer 1: Core Flow (5 pages)
                                        - Admin: approve/manage creators
                                        - Portal: dashboard + coupon + profile
                                        - Public: apply form

                                      Layer 2: Engagement (add when data exists)
                                        - Challenges, ranking, briefings
                                        - Content detection, points

                                      Layer 3: Advanced (add when mature)
                                        - Payouts with IRRF/ISS
                                        - Anti-fraud, analytics
                                        - Gifting, scoring
```

### Lesson: Integration-First, Flow-First

This lesson applies to **every future module**. See Phase 1.5 below for the fix, and "Module Delivery Framework" for the reusable pattern.

---

## Phase 0.5: Platform Onboarding & Integration Catalog (Pre-requisite for ALL Modules)

> **Spec:** [`docs/modules/platform/onboarding.md`](docs/modules/platform/onboarding.md) (12-section spec, v1.0)
> **Goal:** Every tenant must be able to set up their company, connect integrations, and activate modules — before any module-specific code runs.
> **Principle:** This is the foundation layer. Without it, modules have no integrations, no data discovery, no setup wizards.

### Why Phase 0.5 Exists

Phase 1 (Creators) built 160+ files but the first-use experience was broken because:
1. No tenant setup wizard — admin had no way to configure integrations
2. No integration catalog — providers were hardcoded (Shopify/Yever)
3. No module activation — PM didn't know where to start

Phase 0.5 fixes this for ALL modules, not just Creators.

### Phase 0.5 Delivery Layers

```
Layer -1: Schema + Provider Interfaces (1 session)
  ├─ 6 new tables (integration_providers, tenant_integrations,
  │   integration_sync_logs, tenant_modules, onboarding_progress, team_invites)
  ├─ 6 new enums (integration_auth_type, integration_status, sync_frequency,
  │   module_status, invite_status, capability_type)
  ├─ Seed data: 8 providers (Shopify, Yever, Mercado Pago, Instagram,
  │   Focus NFe, Melhor Envio, Meta WA, Resend)
  ├─ Provider interfaces: EcommerceProvider, CheckoutProvider,
  │   PaymentsProvider, SocialProvider, FiscalProvider, ShippingProvider, MessagingProvider
  └─ CIENA implementations: ShopifyProvider, YeverProvider (real APIs)

Layer 0: Tenant Setup Wizard (1 session)
  ├─ 3-step wizard UI (empresa → equipe → integrações)
  ├─ Onboarding progress persistence (global.onboarding_progress)
  ├─ First-login redirect middleware
  └─ Team invite flow (email via Resend)

Layer 1: Integration Catalog (1 session)
  ├─ /admin/settings/integrations page
  ├─ Provider cards grid (grouped by capability)
  ├─ OAuth flow (Shopify, Instagram)
  ├─ API key flow (Yever, Focus NFe)
  ├─ Test connection
  ├─ Provider detail/config modal
  └─ Data discovery post-connection

Layer 2: Module Activation (1 session)
  ├─ /admin/settings/modules page
  ├─ Prerequisites check per module
  ├─ Module setup wizard framework
  ├─ Creators setup wizard (6 steps, per Phase 1.5 spec below)
  ├─ Dashboard checklist widget (progress bar, Zeigarnik effect)
  └─ Progressive sidebar (conditional nav items)

Layer 3: Health Monitoring & Cron (1 session)
  ├─ Integration health check job (1h)
  ├─ OAuth token refresh job (6h)
  ├─ Scheduled sync executor (per-integration config)
  ├─ Sync logs viewer
  ├─ Circuit breaker logic (5 errors → pause)
  └─ Log/invite cleanup jobs (90 days / 7 days)
```

### Module Prerequisites Registry

Every module declares which capabilities it requires. The onboarding module checks these before allowing activation.

| Module | Required Capabilities | Optional Capabilities |
|---|---|---|
| creators | ecommerce, checkout | social, messaging |
| crm | ecommerce | messaging, social |
| erp | — | ecommerce, fiscal, shipping |
| pcp | — | — |
| checkout | payments | ecommerce |
| whatsapp | messaging (WA) | — |
| trocas | ecommerce, shipping | — |
| inbox | — | messaging |
| b2b | ecommerce | — |
| marketing-intel | social | ecommerce |
| dashboard | — | (reads from all active modules) |
| tarefas | — | — |
| dam | — | — |
| clawdbot | — | — |

### Relationship to Phase 1.5

Phase 0.5 builds the **platform-level infrastructure** (integration catalog, tenant setup, module activation framework). Phase 1.5 (below) uses that infrastructure to fix the **Creators-specific** first-use experience. Phase 0.5 Layer 2 includes the Creators setup wizard as the first module setup wizard implementation.

---

## Phase 1.5: Flow Fix — Creators (Fixing the First-Use Experience)

> **Goal:** Make the Creators module usable end-to-end, starting from a tenant that already has a running store with active coupons and influencers.
> **Principle:** Integration-first. Progressive disclosure. "It's all about the flow."

### Layer 0: Tenant Onboarding & Integration (PRIORITY 1)

Before any creator can use the portal, the **tenant's PM** needs to set up the module. But first, the tenant needs **platform-level integrations** connected — because the Creators module (and every other module) depends on data from the tenant's existing tools.

#### 0.0 — Platform Integration Catalog (prerequisite for ALL modules)

Ambaril does NOT hardcode integrations to specific platforms. Instead, it exposes an **integration catalog** where tenants choose which providers to connect. Each integration fulfills a **capability** that modules consume.

**Architecture:**

```
┌─────────────────────────────────────────────────────┐
│                    Ambaril Modules                    │
│  (Creators, CRM, ERP, Checkout, etc.)               │
│                                                       │
│  Modules consume CAPABILITIES, not providers:        │
│  - ecommerce.coupons.list()                          │
│  - ecommerce.orders.listByCoupon(code)               │
│  - ecommerce.products.list()                         │
│  - checkout.orders.listByPeriod(start, end)          │
│  - social.instagram.getProfile(handle)               │
└───────────────────────┬─────────────────────────────┘
                        │ Provider Interface
┌───────────────────────┴─────────────────────────────┐
│              Integration Provider Layer              │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Shopify  │ │Nuvemshop │ │   VNDA   │ │ (next) │ │
│  │ Provider │ │ Provider │ │ Provider │ │Provider│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Yever   │ │Merc.Pago │ │  (next)  │            │
│  │ Provider │ │ Provider │ │ Provider │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘
```

**Capability categories:**

| Capability | What modules need it | Example providers |
|------------|---------------------|-------------------|
| `ecommerce` | Creators, CRM, ERP, Dashboard | Shopify, Nuvemshop, VNDA, WooCommerce |
| `checkout` | Creators (sales attribution), ERP (orders) | Yever, Shopify Checkout, Mercado Pago |
| `payments` | Creators (payouts), ERP (financeiro) | Mercado Pago, PagSeguro, Stripe |
| `social` | Creators (content detection, follower sync) | Instagram Graph API, TikTok API |
| `fiscal` | ERP (NF-e), Creators (IRRF/ISS) | Focus NFe, Bling (fiscal only) |
| `shipping` | ERP (logistics) | Melhor Envio, Correios |
| `messaging` | CRM, Creators (notifications) | Meta Cloud API (WA), Resend (email) |

**Platform settings page:** `/admin/settings/integrations`

| What it shows | Details |
|--------------|---------|
| Catalog grid | All available providers, grouped by capability. Each card: logo, name, status (connected/not), "Conectar" button |
| Connected providers | List of active connections with last sync time, health status, "Desconectar" button |
| Per-provider setup | OAuth flow or API key input. Test connection. Configure sync frequency |

**Data model addition:**

```
global.integration_providers (seed data — read-only)
  id, slug, name, capability, logo_url, auth_type (oauth|api_key), config_schema (jsonb)

global.tenant_integrations (per-tenant)
  id, tenant_id, provider_id (FK), credentials_encrypted, status (active|inactive|error),
  last_sync_at, sync_frequency, config (jsonb), created_at, updated_at
```

**Provider interface (code):**

```typescript
// packages/shared/src/integrations/types.ts
interface EcommerceProvider {
  listCoupons(): Promise<ExternalCoupon[]>
  listProducts(cursor?: string): Promise<PaginatedResult<ExternalProduct>>
  getCouponUsage(code: string): Promise<CouponUsageStats>
}

interface CheckoutProvider {
  listOrdersByCoupon(code: string, since?: Date): Promise<ExternalOrder[]>
  listOrdersByPeriod(start: Date, end: Date): Promise<ExternalOrder[]>
}

interface SocialProvider {
  getProfile(handle: string): Promise<SocialProfile | null>
  searchMentions(brand: string, since?: Date): Promise<SocialPost[]>
}

// Each provider implements the interface
// packages/shared/src/integrations/providers/shopify.ts → implements EcommerceProvider
// packages/shared/src/integrations/providers/yever.ts → implements CheckoutProvider
// etc.
```

**CIENA (tenant 1) connects:** Shopify (ecommerce) + Yever (checkout) + Instagram (social) + Resend (messaging).
**Future tenant might connect:** Nuvemshop (ecommerce) + Mercado Pago (checkout+payments) + Instagram (social).
**The module code is identical** — it calls `ecommerce.listCoupons()`, doesn't care which provider backs it.

#### 0.1 — Creators Setup Wizard (`/admin/creators/setup`)

A step-by-step wizard that runs ONCE when the tenant first opens the Creators module.

| Step | What it does |
|------|-------------|
| **1. Check Integrations** | Verify required capabilities are connected: `ecommerce` (required — for coupons), `checkout` (required — for sales attribution), `social` (optional — for content detection). If missing: link to `/admin/settings/integrations` to connect. |
| **2. Configure Tiers** | Pre-fill with recommended tiers (seed/grow/bloom/core) or let tenant customize. Commission rates, min requirements. |
| **3. Import Existing Coupons** | Call `ecommerce.listCoupons()` via connected provider. Show list: "Encontramos 12 cupons ativos. Quais são de influenciadores?" |
| **4. Link Coupons → Creators** | For each selected coupon: "Vincular a um criador?" Options: (a) Create new creator from coupon data, (b) Search existing creator, (c) Skip |
| **5. Creator Account Options** | For each linked creator: "Como cadastrar?" Options: (a) Staff completes profile now (white-glove), (b) Send invite link for creator to complete registration, (c) Import from existing data (if available) |
| **6. Review & Activate** | Summary of configured tiers, imported coupons, linked creators. "Ativar módulo Creators" button. |

After wizard completes: redirect to `/admin/creators` (the list page, now with data).

#### 0.2 — Integration Sync Actions (provider-agnostic)

| Action | Capability used | Target |
|--------|----------------|--------|
| `syncCoupons` | `ecommerce.listCoupons()` | `creators.coupons` table |
| `syncOrdersByCoupon` | `checkout.listOrdersByCoupon(code)` | `creators.sales_attributions` table |
| `detectExistingInfluencers` | Cross-reference imported coupon codes with naming patterns | Suggest creator profiles |
| `importCreatorFromCoupon` | Coupon metadata (name, discount %) | `creators.creators` + `creators.coupons` |

#### 0.3 — Incomplete Creator Profile Flow

When a creator account is created via import (coupon linkage), they may have incomplete data.

| Scenario | Flow |
|----------|------|
| Staff creates creator (white-glove) | Staff fills all fields. Creator never logs in. `managed_by_staff=true`. |
| Staff sends invite link | Creator receives email/WA with link to `/creators/complete-profile?token=xxx`. Creator fills remaining fields (social accounts, bio, photo, PIX). |
| Creator applies via public form | Full 3-step form (already implemented). |

**New route:** `/creators/complete-profile` — simplified form for creators imported by staff. Only asks for fields not already filled.

### Layer 1: Core Flow Fix (PRIORITY 2)

Fix the navigation so that the first-use experience makes sense.

#### 1.1 — Admin: Progressive Sidebar

Instead of showing all 11 sub-routes from day 1, show them progressively:

| Condition | Visible Admin Pages |
|-----------|-------------------|
| Module just activated (0 creators) | Setup Wizard, Tiers |
| 1+ creators exist | + Creator List, Creator Detail |
| 1+ active creators with sales | + Payouts |
| 1+ campaigns created | + Campaigns |
| 1+ challenges created | + Challenges |
| Anti-fraud flags exist | + Anti-Fraud |
| Always (but last) | Analytics |

#### 1.2 — Portal: Progressive Sidebar

Same principle for the creator portal:

| Condition | Visible Portal Pages |
|-----------|---------------------|
| Always | Dashboard, Cupom, Perfil |
| Creator has 1+ sales | + Vendas |
| Creator has points > 0 | + Pontos |
| Active challenges exist | + Desafios |
| Active briefings exist | + Briefings |
| Payouts exist for creator | + Ganhos |
| Ranking has 5+ creators | + Ranking |
| Content detections exist | + Conteúdo |
| Products stub ready | + Produtos (stub) |
| Materials stub ready | + Materiais (stub) |

#### 1.3 — Dashboard: Context-Aware Empty States

Instead of generic "Nenhum dado encontrado", show **actionable** empty states:

| Page | Empty State Message | CTA |
|------|-------------------|-----|
| Dashboard (no sales) | "Compartilhe seu cupom para começar a ganhar comissões!" | "Ver meu cupom" → `/creators/coupons` |
| Sales (no sales) | "Quando seus seguidores usarem seu cupom, as vendas aparecerão aqui." | "Copiar cupom" |
| Points (0 points) | "Ganhe pontos compartilhando conteúdo e participando de desafios!" | "Ver desafios" (if any) |
| Challenges (none active) | "Nenhum desafio ativo no momento. Fique de olho!" | — |
| Ranking (< 5 creators) | "O ranking será ativado quando tivermos 5+ criadores ativos." | — |

### Layer 2: Data Seeding from Integration (PRIORITY 3)

Once integrations are connected and coupons are linked, populate real data via provider-agnostic capabilities:

| Data | Capability | When |
|------|-----------|------|
| Historical sales | `checkout.listOrdersByCoupon()` | On setup (backfill) |
| Coupon usage stats | `ecommerce.getCouponUsage()` | On setup + daily sync |
| Creator follower counts | `social.getProfile()` | On creator link + weekly sync |
| Content detections | `social.searchMentions()` | After creator linked + 15min polling |

**Note:** The actual API called depends on which provider the tenant connected (Shopify, Nuvemshop, Yever, etc.). The module code never references a specific provider.

### Layer 3: Enable Advanced Features (PRIORITY 4)

Only after Layer 0-2 are working:

- Fiscal compliance (IRRF/ISS/tax profiles) — needed before first real payout
- Anti-fraud monitoring — needs sales data to detect patterns
- Analytics dashboard — needs 30+ days of data to be meaningful
- Gifting suggestions — needs tier distribution + sales ranking
- Campaign ROI — needs campaign + sales data correlation

---

## Module Delivery Framework (Apply to ALL Future Modules)

> Extracted from Phase 1 retrospective. Every module MUST follow this pattern.

### Simulação Dia 1 — Obrigatório antes de qualquer spec técnico

**Todo módulo começa aqui.** Se não consegue preencher, o spec não está pronto para implementação.

```
## Simulação Dia 1

**Usuário:** [nome do role — ex: Caio - PM]
**Contexto:** primeira vez abrindo o módulo
**Dados existentes no tenant:** [o que já existe nos sistemas externos: Shopify/Yever/etc]

Passo 1: [tela exata que o usuário vê]
Passo 2: [primeira ação que ele toma]
Passo 3: [o que acontece na tela]
Passo 4: [onde ele chega]
Passo 5: [valor real que ele obteve]

**Resultado mínimo aceitável:** [o que precisa funcionar para o módulo ter valor]
**O que NÃO existe ainda:** [features que dependem de dados futuros — esconder até condição X]
**Dados a importar:** [o que já existe nos sistemas externos do tenant que precisa ser puxado]
```

### Pre-Implementation Checklist

Before writing any UI code for a new module:

- [ ] **Simulação Dia 1 preenchida** — sem isso, não começar
- [ ] **What capabilities does this module need?** (ecommerce, checkout, payments, social, fiscal, shipping, messaging)
- [ ] **Are providers implemented for those capabilities?** If not, implement provider before module UI
- [ ] **What data already exists in the tenant's connected platforms?** (orders, customers, coupons, products)
- [ ] **What's the minimum viable flow?** (3-5 pages that form the core loop)
- [ ] **What's the module setup wizard?** (check integrations → import existing data → configure → activate)
- [ ] **What features need accumulated data?** (analytics, ranking, predictions — defer these)

### Definition of Done (obrigatório)

| ❌ NÃO é done | ✅ É done |
|--------------|----------|
| `pnpm type-check` zero errors | Dono do produto testou o fluxo no browser |
| Todos os arquivos criados conforme spec | First-time-user completou a jornada end-to-end |
| Spec 100% coberta | Pelo menos 1 dado real aparece na tela |

### Implementation Order (for every module)

**Usar fatias verticais, não waves horizontais.** Cada fatia = 1 jornada completa testável no browser antes de avançar.

```
Layer -1: Platform Integrations (if new capability needed)
  └─ Define capability interface (TypeScript types)
  └─ Implement provider(s) for that capability
  └─ Add provider to integration catalog (seed data)
  └─ Integration settings UI (already exists at /admin/settings/integrations)

Layer 0: Module Onboarding
  └─ Setup wizard (check connected integrations → import → configure → activate)
  └─ Integration sync via capabilities (pull existing data, provider-agnostic)
  └─ Incomplete entity handling (invite to complete vs staff completes)

Layer 1: Core Flow
  └─ 3-5 admin pages (the essential management loop)
  └─ 3-5 user-facing pages (the essential usage loop)
  └─ Progressive sidebar (show pages as data appears)
  └─ Actionable empty states (guide user to next step)

Layer 2: Engagement
  └─ Features that need accumulated data (analytics, ranking, gamification)
  └─ Appear in nav only when data threshold is met
  └─ Cron jobs that enrich existing data

Layer 3: Advanced
  └─ Compliance features (fiscal, legal, audit)
  └─ Automation & intelligence (anti-fraud, scoring, predictions)
  └─ Edge cases & error recovery
```

### Integration Architecture Rules

1. **Modules consume capabilities, never providers.** A module calls `ecommerce.listCoupons()`, never `shopify.listDiscountCodes()`.
2. **Provider interfaces live in `packages/shared/src/integrations/`.** Each capability has a TypeScript interface. Each provider implements it.
3. **Tenant chooses providers at `/admin/settings/integrations`.** Catalog-style UI (like Bling/Nuvemshop app stores).
4. **Credentials stored encrypted per tenant** in `global.tenant_integrations`. Never in `.env` (`.env` is for Ambaril platform keys only, not tenant-specific).
5. **CIENA is just the first tenant.** Their Shopify+Yever setup is ONE possible configuration, not THE configuration.
6. **New providers are additive.** Adding Nuvemshop support = implement `EcommerceProvider` interface, add seed row to `integration_providers`, done. Zero changes to module code.

### Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad |
|-------------|-------------|
| Build all pages before any integration | Pages are empty, PM doesn't know what to do |
| Technical waves (schema → backend → UI) | No testable flow until all waves complete |
| Show all features from day 1 | Overwhelms user, most pages are empty |
| Generic empty states ("No data") | User doesn't know what to do next |
| Assume clean-slate onboarding | Tenants have existing data in other tools |
| Skip tenant setup wizard | PM has no guidance on how to start |
| **Hardcode provider-specific code in modules** | Locks platform to specific vendors. Every tenant is different |
| **Store tenant API keys in `.env`** | `.env` is for platform infra. Tenant credentials go in DB (encrypted) |
| **Waves horizontais (schema→backend→UI→portal→jobs)** | 160 arquivos entregues, nenhum fluxo end-to-end verificável. Usar fatias verticais |
| **Considerar type-check como Definition of Done** | Type-check é necessário, não suficiente. Done = dono do produto testou no browser |
| **Escrever spec sem Simulação Dia 1** | Spec que não começa com first-time-user journey vai construir páginas vazias sem utilidade |

---

## Pre-Wave: Schema Fixes (Claude direct — before spawning agents)

The Drizzle schema (`packages/db/src/schema/creators.ts`) has gaps vs the spec.
Claude applies all fixes below, runs `drizzle-kit generate` + `drizzle-kit push`, verifies type-check passes.
Agents treat schema as **READ-ONLY** after this.

### New Enums

| Enum | Values |
|------|--------|
| `taxpayer_type` | `pf`, `mei`, `pj` |
| `fiscal_doc_type` | `rpa`, `nfse`, `none` |
| `gifting_status` | `suggested`, `approved`, `rejected`, `ordered`, `shipped`, `delivered` |
| `proof_type` | `instagram_post`, `instagram_story`, `tiktok`, `youtube`, `other` |
| `attribution_status` | `pending`, `confirmed`, `adjusted`, `cancelled` |
| `referral_status` | `pending`, `active`, `expired` |
| `discount_type` | `percent`, `fixed` |

### Enum Corrections

| Enum | Current (Drizzle) | Target (Spec) |
|------|-------------------|---------------|
| `content_post_type` | post, story, reel, tiktok, youtube, live | **image, video, carousel, story, reel, short** |
| `points_action` | sale, post, challenge, referral, engagement, manual_adjustment, tier_bonus, hashtag_detected, creator_of_month | Add **`product_redemption`**; rename `post`→`post_detected`, `challenge`→`challenge_completed` |
| `payout_status` | pending, processing, paid, failed | Add **`calculating`** (before pending) |
| `challenge_status` | draft, active, completed, cancelled | Add **`judging`** (between active and completed) |
| `delivery_status` | pending, shipped, delivered, returned | Replace `returned` with **`content_posted`** |

### New Tables

**1. `creators.campaign_briefs`** (10 columns + tenant_id)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | |
| campaign_id | UUID FK campaigns | NOT NULL |
| title | VARCHAR(255) | NOT NULL |
| content_md | TEXT | NOT NULL, markdown |
| hashtags | TEXT[] | nullable |
| deadline | TIMESTAMPTZ | nullable |
| examples_json | JSONB | nullable, `[{ type, url, caption }]` |
| target_tiers | VARCHAR[] | nullable, tier slugs (null = all) |
| created_by | UUID FK users | NOT NULL |
| created_at / updated_at | TIMESTAMPTZ | |

**2. `creators.gifting_log`** (14 columns + tenant_id)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | |
| creator_id | UUID FK creators | NOT NULL |
| campaign_id | UUID FK campaigns | nullable |
| product_id | UUID | nullable (FK to future erp.products) |
| product_name | VARCHAR(255) | NOT NULL snapshot |
| product_cost | NUMERIC(12,2) | NOT NULL |
| shipping_cost | NUMERIC(12,2) | DEFAULT 0 |
| reason | TEXT | NOT NULL |
| status | gifting_status enum | DEFAULT 'suggested' |
| erp_order_id | UUID | nullable (FK to future erp.orders) |
| approved_by | UUID FK users | nullable |
| approved_at | TIMESTAMPTZ | nullable |
| created_at / updated_at | TIMESTAMPTZ | |

**3. `creators.creator_kit_downloads`** (5 columns + tenant_id)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | |
| creator_id | UUID FK creators | NOT NULL |
| asset_id | UUID | NOT NULL (FK to future dam.assets) |
| asset_name | VARCHAR(255) | NOT NULL snapshot |
| downloaded_at | TIMESTAMPTZ | DEFAULT NOW() |

**4. `creators.tax_profiles`** (12 columns + tenant_id)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | |
| creator_id | UUID FK creators | NOT NULL UNIQUE |
| taxpayer_type | taxpayer_type enum | DEFAULT 'pf' |
| cpf | VARCHAR(14) | NOT NULL |
| cnpj | VARCHAR(18) | nullable |
| mei_active | BOOLEAN | nullable |
| mei_validated_at | TIMESTAMPTZ | nullable |
| municipality_code | VARCHAR(10) | nullable (IBGE) |
| municipality_name | VARCHAR(255) | nullable |
| iss_rate | NUMERIC(5,2) | nullable (2-5%) |
| has_nf_capability | BOOLEAN | DEFAULT false |
| created_at / updated_at | TIMESTAMPTZ | |

### Missing Columns in Existing Tables

| Table | Column | Type | Notes |
|-------|--------|------|-------|
| `creators` | `suspension_reason` | VARCHAR(500) | nullable |
| `payouts` | `irrf_withheld` | NUMERIC(12,2) | DEFAULT 0 |
| `payouts` | `iss_withheld` | NUMERIC(12,2) | DEFAULT 0 |
| `payouts` | `fiscal_doc_type` | fiscal_doc_type enum | DEFAULT 'none' |
| `payouts` | `fiscal_doc_id` | VARCHAR(255) | nullable |
| `payouts` | `fiscal_doc_verified` | BOOLEAN | DEFAULT false |
| `payouts` | `failure_reason` | VARCHAR(500) | nullable |
| `challenges` | `month` | INTEGER | NOT NULL, CHECK 1-12 |
| `challenges` | `year` | INTEGER | NOT NULL, CHECK >= 2026 |
| `challenges` | `created_by` | UUID FK users | NOT NULL |
| `content_detections` | `points_awarded` | BOOLEAN | DEFAULT false |
| `challenge_submissions` | `proof_type` | proof_type enum | NOT NULL |
| `challenge_submissions` | `caption` | TEXT | nullable |
| `challenge_submissions` | `rejection_reason` | VARCHAR(500) | nullable |

### Structural Differences to Reconcile

**`sales_attributions`** — current Drizzle uses `isValid/validatedAt/invalidationReason/buyerCpfHash/discountGiven/commissionBase`. Spec uses `status` enum (attribution_status), `confirmed_at`, `exchange_window_ends_at`, `exchange_adjusted`, `adjustment_reason`, `discount_amount`, `net_revenue`. **Align to spec** (add new columns, deprecate old ones gradually).

**`coupons`** — current Drizzle is a generic coupon table (type: creator/campaign/vip). Spec has a simpler creator-focused table with `creator_id`, `usage_count`, `total_revenue_generated`, `discount_type`. Add missing columns: `creator_id`, `usage_count`, `total_revenue_generated`, `discount_type`.

**`referrals`** — current Drizzle uses `referralCode`, `status` (varchar), `confirmedAt`. Spec uses `status` (referral_status enum), `points_awarded` (boolean), `referred_first_sale_at`. Align columns.

### Post-fix Checklist

- [ ] `pnpm type-check` — zero errors
- [ ] `drizzle-kit generate` succeeds
- [ ] `drizzle-kit push` applied to Neon
- [ ] Seed still runs (update if needed)

---

## Wave 1: Foundation (3 agents, parallel, no dependencies)

### Agent: `ui-components`

Build reusable UI components following DS.md (Moonstone). shadcn/ui (Radix + cva) + Tailwind + Lucide React.

| File | Component | Requirements |
|------|-----------|-------------|
| `packages/ui/src/components/data-table.tsx` | DataTable | Sort, filter, pagination, bulk select, empty state |
| `packages/ui/src/components/modal.tsx` | Modal | Overlay, close on ESC, focus trap |
| `packages/ui/src/components/sheet.tsx` | Sheet | Side panel (right), close on outside click |
| `packages/ui/src/components/tabs.tsx` | Tabs | Horizontal tabs with active indicator |
| `packages/ui/src/components/skeleton.tsx` | Skeleton | Loading placeholder |
| `packages/ui/src/components/empty-state.tsx` | EmptyState | Icon + message + optional CTA |

**Criteria:** type-check passes, all exported via `packages/ui/src/index.ts`, DS.md compliant (DM Sans, Moonstone tokens, Lucide icons).

### Agent: `ui-forms`

Build form-oriented UI components.

| File | Component | Requirements |
|------|-----------|-------------|
| `packages/ui/src/components/form-select.tsx` | FormSelect | React Hook Form compatible, search/filter |
| `packages/ui/src/components/form-date-picker.tsx` | FormDatePicker | PT-BR format (dd/mm/yyyy) |
| `packages/ui/src/components/form-file-upload.tsx` | FormFileUpload | Drag & drop, preview, R2 upload |
| `packages/ui/src/components/form-textarea.tsx` | FormTextarea | Char count, auto-resize |
| `packages/ui/src/components/avatar.tsx` | Avatar | Image + fallback initials |
| `packages/ui/src/components/status-badge.tsx` | StatusBadge | Color-coded by status (pending=yellow, active=green, suspended=red) |
| `packages/ui/src/components/step-indicator.tsx` | StepIndicator | 3-step progress (for /creators/apply form) |

**Criteria:** type-check passes, all exported via index.ts, DS.md compliant, labels PT-BR.

### Agent: `schemas`

Zod validation schemas covering 100% of spec business rules. Shared between frontend forms and server actions.

**File:** `packages/shared/src/schemas/creators.ts`

| Schema | Fields / Rules | Covers |
|--------|---------------|--------|
| `registrationStep1Schema` | name, email, phone (BR format), cpf (11 digits + check digit), birth_date, city, state | US-01, R33 |
| `registrationStep2Schema` | instagram (required), tiktok (required), youtube?, pinterest?, twitter?, other? | US-01, R33 |
| `registrationStep3Schema` | bio (max 280), motivation, content_niches[], content_types[], discovery_source, clothing_size, address, content_rights_accepted, terms_accepted | US-01, R33 |
| `ambassadorRegistrationSchema` | extends step 1-3 + ambassador_option: boolean | US-NEW1, R34a |
| `profileUpdateSchema` | name?, bio?, pix_key?, pix_key_type?, payment_preference?, clothing_size?, address?, profile_image_url? | US-11 |
| `socialAccountsSchema` | accounts[]: { platform, handle, url?, is_primary? } | US-11 |
| `tierConfigSchema` | name, slug, commission_rate (0-100), min_followers, benefits, sort_order | R0-R8 |
| `challengeCrudSchema` | name, description, category (enum), month (1-12), year (>=2026), points_reward (50-500), requirements (jsonb), max_participants?, starts_at, ends_at | US-15 |
| `challengeSubmissionSchema` | proof_url (URL), proof_type (enum), caption? | US-08 |
| `payoutCalculateSchema` | period_start (date), period_end (date) | R15-R17 |
| `payoutProcessSchema` | payout_ids: UUID[], payment_method? | R16 |
| `payoutMethodSchema` | payment_method (enum), pix_key?, store_credit_amount?, product_items? | US-26 |
| `campaignCrudSchema` | name, campaign_type (enum), start_date, end_date?, costs (4 numeric fields) | US-25 |
| `campaignBriefSchema` | campaign_id, title, content_md, hashtags[]?, deadline?, examples_json?, target_tiers[]? | US-NEW3, R-PLAYBOOK |
| `giftingConfigSchema` | monthly_budget, product_pool, top_n | R-GIFTING.2 |
| `giftingApproveSchema` | gifting_ids: UUID[] | R-GIFTING.4 |
| `taxProfileSchema` | taxpayer_type (enum), cpf, cnpj?, municipality_code?, iss_rate? | R-FISCAL.1 |
| `pointsAdjustmentSchema` | points (integer, nonzero), reason (min 10 chars) | US-22, R24 |
| `antiFraudResolveSchema` | action ('suspend' | 'clear'), reason | US-18 |
| `couponCrudSchema` | code (uppercase, 3-20 chars), discount_percent?, discount_amount?, discount_type | US-03 |
| `utmLinkSchema` | platform (enum), campaign_name? | US-24, R32b |
| `creatorFiltersSchema` | status?, tier?, managed?, search?, sort?, cursor?, limit? | US-14 (admin) |
| `referralSchema` | referral_code | US-12 |

**Criteria:** type-check passes, all exported, each schema has JSDoc, covers 100% of form fields from spec sections 5.x and 6.x.

---

## Wave 2: Backend (3 agents, parallel, depends on Wave 1)

### Agent: `backend-crud`

Server Actions for CRUD operations + creator lifecycle management.

| File | Actions | Spec Coverage |
|------|---------|---------------|
| `apps/web/src/app/actions/creators/crud.ts` | listCreators, getCreator, createCreator (white-glove), updateCreator | US-14, US-23, 6.2 |
| `apps/web/src/app/actions/creators/tiers.ts` | listTiers, createTier, updateTier, deleteTier | R0-R8 |
| `apps/web/src/app/actions/creators/coupons.ts` | createCoupon, updateCoupon, deactivateCoupon, generateCouponCode | US-03, 6.2 |
| `apps/web/src/app/actions/creators/social-accounts.ts` | listSocialAccounts, upsertSocialAccounts | US-11, 6.1/6.2 |
| `apps/web/src/app/actions/creators/lifecycle.ts` | approveCreator (+ coupon gen + user creation), rejectCreator, suspendCreator, reactivateCreator, ambassador auto-approval | US-14, R34, R34a, R35, R36 |
| `apps/web/src/app/actions/creators/referrals.ts` | getReferralLink, trackReferral, checkReferralReward | US-12, R22 |

**Key rules:** approveCreator creates `global.users` with role=creator (skip if managed_by_staff). Coupon code = uppercase first name + discount. Ambassador auto-approve if IG followers >= threshold.

### Agent: `backend-business`

Server Actions for business logic (financial, gamification, analytics).

| File | Actions | Spec Coverage |
|------|---------|---------------|
| `apps/web/src/app/actions/creators/payouts.ts` | calculatePayouts (with IRRF/ISS), listPayouts, approvePayout, processPayout, markPaid, setPayoutMethod | R15-R18, R-FISCAL.1-10, US-17, US-26 |
| `apps/web/src/app/actions/creators/sales.ts` | attributeSale, confirmSales, adjustCommission (exchange), listSalesForCreator | R9-R14, US-05, 6.3 |
| `apps/web/src/app/actions/creators/challenges.ts` | createChallenge, updateChallenge, deleteChallenge, listChallenges, submitProof, approveSubmission, rejectSubmission | US-15, US-16, US-07, US-08 |
| `apps/web/src/app/actions/creators/campaigns.ts` | createCampaign, updateCampaign, addCreatorToCampaign, updateDeliveryStatus, removeCreatorFromCampaign, getCampaignWithROI | US-25, 6.2.4 |
| `apps/web/src/app/actions/creators/briefs.ts` | createBrief, updateBrief, deleteBrief, listBriefs, getBriefDetail | US-NEW3, 6.2.2 |
| `apps/web/src/app/actions/creators/gifting.ts` | generateSuggestions, approveSuggestions, rejectSuggestions, configureGifting, listGiftingHistory | US-NEW4, R-GIFTING.1-6, 6.2.3 |
| `apps/web/src/app/actions/creators/points.ts` | awardPoints, adjustPoints, getPointsLedger, getPointsBalance | R19-R24a, US-22 |
| `apps/web/src/app/actions/creators/anti-fraud.ts` | checkSelfPurchase, checkMonthlyCap, listFlags, resolveFlag | R25-R28, US-18, 6.2.6 |
| `apps/web/src/app/actions/creators/ranking.ts` | getRanking (top 20 GMV), getCreatorOfMonth | US-14a, 6.1 |
| `apps/web/src/app/actions/creators/analytics.ts` | getOverviewKPIs, getTopPerformers, getProductMix, getTierDistribution | US-19, 6.2.7 |
| `apps/web/src/app/actions/creators/utm-links.ts` | generateUtmLink | US-24, R32b |
| `apps/web/src/app/actions/creators/scoring.ts` | calculateCompositeScore (conversion 0.35, content_quality 0.25, engagement 0.20, brand_alignment 0.15, followers 0.05) | R-SCORING |

**Key rules:** Payout net = gross - IRRF - ISS - deductions. Commission = net_revenue * rate / 100. Monthly cap R$ 3.000. Min payout R$ 50. Points are append-only ledger.

### Agent: `integrations`

External service clients + stubs for modules that don't exist yet.

| File | Integration | Spec Coverage |
|------|-------------|---------------|
| `apps/web/src/lib/shopify.ts` | OAuth Client Credentials (tokens 24h), GraphQL `discountCodeBasicCreate` for store credit coupons, product catalog query | US-26 (store_credit), US-14b (products) |
| `apps/web/src/lib/yever.ts` | Orders by coupon code (sale attribution verification) | R9 |
| `apps/web/src/lib/storage.ts` | Cloudflare R2: presigned upload URL, presigned download URL | US-01 (profile photo), US-14e (Creator Kit) |
| `apps/web/src/lib/email.ts` | Resend: welcome email, payout notification, challenge notification templates | R34, 10.x |
| `apps/web/src/lib/stubs/products.ts` | `getProducts()` → `[]`, `getProductById()` → `null` | US-14b (catalog stub) |
| `apps/web/src/lib/stubs/dam.ts` | `getCreatorKitAssets()` → `[]`, `getAssetDownloadUrl()` → `null` | US-14e, US-NEW5 (Creator Kit stub) |
| `apps/web/src/lib/stubs/whatsapp.ts` | `sendTemplate()` → `console.log(...)` no-op | R34, R37, 10.x (WA stub) |
| `apps/web/src/lib/stubs/erp.ts` | `createGiftingOrder()` → `null`, `getOrderById()` → `null` | R-GIFTING.4 (ERP stub) |

**Criteria:** type-check passes, Shopify/Yever/R2/Resend connect to real APIs (using .env keys), stubs have `// TODO: replace when {module} is implemented` comments.

---

## Wave 3: Admin Pages (4 agents, depends on Wave 2)

### Agent: `admin-list`

| Page | Route | Wireframe | Key Features |
|------|-------|-----------|-------------|
| Creator List | `/admin/creators` | 5.14 | DataTable with filter (status, tier, managed), search, bulk actions, summary cards |
| Creator Detail | `/admin/creators/[id]` | 5.15 | Tabs: profile, sales, points, payouts, campaigns, social, anti-fraud flags. Actions: approve/reject/suspend/reactivate, adjust points, generate UTM link |
| New Creator (white-glove) | `/admin/creators/new` | R33a | Full form, managed_by_staff=true, skip IG API validation |

**Files:** `apps/web/src/app/(admin)/admin/creators/{page.tsx,components/*,[id]/*,new/*}`

### Agent: `admin-config`

| Page | Route | Wireframe | Key Features |
|------|-------|-----------|-------------|
| Tier Config | `/admin/creators/tiers` | — | CRUD tiers (name, slug, commission_rate, benefits), drag-to-reorder |
| Payout Manager | `/admin/creators/payouts` | 5.17 | Calculate button, review table (gross/IRRF/ISS/net), bulk approve, process PIX, set payment method, fiscal doc status |
| Challenge Manager | `/admin/creators/challenges` | 5.16 | CRUD challenges by month/year, submission review queue with approve/reject |

**Files:** `apps/web/src/app/(admin)/admin/creators/{tiers,payouts,challenges}/**`

### Agent: `admin-campaigns`

| Page | Route | Wireframe | Key Features |
|------|-------|-----------|-------------|
| Campaign List | `/admin/creators/campaigns` | 5.20 | DataTable: name, type, status, costs, GMV, ROI. Create new campaign |
| Campaign Detail | `/admin/creators/campaigns/[id]` | 5.12 | Cost breakdown, creators list with delivery status, playbook tracker, ROI chart (Recharts) |
| Campaign Brief | `/admin/creators/campaigns/[id]/brief` | — | Markdown editor, hashtags, deadline, example uploads, tier targeting |
| Anti-Fraud Monitor | `/admin/creators/anti-fraud` | 5.18 | Active flags table (type, creator, date, details), resolve actions (suspend/clear) |

**Files:** `apps/web/src/app/(admin)/admin/creators/{campaigns,anti-fraud}/**`

### Agent: `admin-analytics`

| Page | Route | Wireframe | Key Features |
|------|-------|-----------|-------------|
| Analytics Dashboard | `/admin/creators/analytics` | 5.19 | KPI cards (GMV, commissions, CAC, ROAS), charts: top 10 performers (bar), tier distribution (pie), product mix (pie), monthly evolution (line). All Recharts. |

**Files:** `apps/web/src/app/(admin)/admin/creators/analytics/**`

**Wave 3 criteria:** type-check, all pages render, DataTable with real data from server actions, charts DS.md compliant, labels PT-BR.

---

## Wave 4: Creator Portal (3 agents, parallel with Wave 3, depends on Wave 2)

### Agent: `portal-layout`

| Page | Route | Wireframe | Key Features |
|------|-------|-----------|-------------|
| Layout | `/creators/(authenticated)/layout.tsx` | — | Navbar + sidebar for creators, role=creator middleware |
| Dashboard | `/creators/(authenticated)/dashboard` | 5.1 | Tier badge + progress bar, 3 KPI cards (earnings, sales, points), recent sales table, active challenges |
| Coupons & Links | `/creators/(authenticated)/coupons` | 5.2 | Large coupon display + copy, coupon metrics, share templates (WA, IG, QR), UTM links tab |

**Files:** `apps/web/src/app/creators/(authenticated)/{layout,dashboard,coupons}/**`

### Agent: `portal-data`

| Page | Route | Wireframe | Key Features |
|------|-------|-----------|-------------|
| Sales | `/creators/(authenticated)/sales` | 5.3 | Sales history table with date filter, status filter, period summary |
| Earnings | `/creators/(authenticated)/earnings` | 5.6 | Balance card (gross/IRRF/ISS/net), payment preference selector, payout history table, fiscal info |
| Points | `/creators/(authenticated)/points` | — | Points ledger table (action, description, points, date), total balance |
| Ranking | `/creators/(authenticated)/ranking` | 5.8 | Top 20 GMV, my position, creator of month spotlight |
| Profile | `/creators/(authenticated)/profile` | 5.7 | Edit: name, bio, social accounts, PIX, address, tax_profile, clothing size. Non-editable: CPF, email, tier |

**Files:** `apps/web/src/app/creators/(authenticated)/{sales,earnings,points,ranking,profile}/**`

### Agent: `portal-engagement`

| Page | Route | Wireframe | Key Features |
|------|-------|-----------|-------------|
| Challenges | `/creators/(authenticated)/challenges` | 5.4, 5.5 | Active challenges with requirements + deadline, submit proof modal, my submissions history |
| Products | `/creators/(authenticated)/products` | 5.9 | Product grid with commission estimate, favorites, "Exclusivos" filter (stub) |
| Briefings | `/creators/(authenticated)/briefings` | 5.10 | Active briefs with guidelines + hashtags + examples, past briefs history |
| Materials | `/creators/(authenticated)/materials` | 5.11 | Creator Kit grid (logos, photos, guidelines), download tracking (stub) |
| Content | `/creators/(authenticated)/content` | — | Gallery of detected posts (IG/TikTok), points status per post |

**Files:** `apps/web/src/app/creators/(authenticated)/{challenges,products,briefings,materials,content}/**`

**Wave 4 criteria:** type-check, all pages render, mobile-responsive (touch targets 44px), labels PT-BR, ambassador portal hides earnings/payouts pages.

---

## Wave 5: Public Pages (2 agents, parallel with Waves 3-4, depends on Wave 2)

### Agent: `public-form`

| Page | Route | Wireframe | Key Features |
|------|-------|-----------|-------------|
| Creator Application | `/creators/apply` | 5.13 | 3-step form with StepIndicator. Step 1: personal data (CPF validation). Step 2: social networks (IG + TikTok required). Step 3: about (bio, niches, content rights waiver). Ambassador option checkbox. Profile photo upload (R2). Confirmation email (Resend). |

**Files:** `apps/web/src/app/creators/apply/{page.tsx,components/*,actions.ts}`

**Key rules:** CPF check-digit validation + uniqueness. IG handle uniqueness via social_accounts. IG API check (exists + public). Ambassador auto-approval if followers >= threshold. Form data persists to DB on submit.

### Agent: `creator-auth`

| Feature | Files | Details |
|---------|-------|---------|
| Creator account creation | `apps/web/src/lib/creator-auth.ts` | On approval, create global.users with role=creator. Skip if managed_by_staff |
| Creator login | `apps/web/src/app/creators/(authenticated)/login/*` | Email + password login, sets ambaril_session cookie with role=creator |
| Portal middleware | `apps/web/src/app/creators/(authenticated)/middleware.ts` | Verify session, check role=creator, check status=active, inject tenantId |

**Criteria:** Registration persists to DB + sends email + upload works. Login sets session. Middleware blocks suspended/inactive creators.

---

## Wave 6: Background Jobs (2 agents, depends on Waves 3-5)

### Agent: `jobs-core`

All jobs use PostgreSQL queue (`FOR UPDATE SKIP LOCKED`) + Vercel Cron.

| Job | Schedule | Route | Spec |
|-----|----------|-------|------|
| confirm-sales | Daily 04:00 BRT | `apps/web/src/app/api/cron/creators/confirm-sales/route.ts` | R12: confirm pending attributions past 7-day window, award +10 pts, update counters, check referrals |
| tier-evaluation | Monthly day 1, 03:00 BRT | `.../tier-evaluation/route.ts` | R5-R8: evaluate vs 90-day sales + lifetime pts, upgrade/downgrade (2 consecutive failures), Creator of Month (+500 pts) |
| payout-calculation | Monthly day 10, 02:00 BRT | `.../payout-calculation/route.ts` | R15-R17: sum confirmed commissions, apply IRRF/ISS, create payout rows, skip below R$ 50 |
| monthly-cap-reset | Monthly day 1, 00:00 BRT | `.../monthly-cap-reset/route.ts` | R26: reset current_month_sales to 0, clear cap flags |
| ambassador-promotion | Daily 05:30 BRT | `.../ambassador-promotion/route.ts` | R0a: promote ambassadors with >= threshold sales in 60 days to SEED |
| referral-expiry | Daily 05:00 BRT | `.../referral-expiry/route.ts` | expire pending referrals older than 90 days |

### Agent: `jobs-social`

| Job | Schedule | Route | Spec |
|-----|----------|-------|------|
| instagram-polling | Every 15 min | `.../instagram-polling/route.ts` | R29: poll IG Graph API for @cienalab mentions, match to creators, award +50 pts |
| hashtag-tracking | Daily 06:00 BRT | `.../hashtag-tracking/route.ts` | R29a: search `#cienax*` hashtags, match to creators, award +25 pts |
| social-sync | Daily 07:00 BRT | `.../social-sync/route.ts` | R32a: update follower counts from platform APIs |
| inactive-alerter | Weekly Mon 08:00 BRT | `.../inactive-alerter/route.ts` | alert PM for creators with no sales in 30 days |
| content-reminder | Daily 10:00 BRT | `.../content-reminder/route.ts` | send WA reminder to creators approved 7-14 days ago with no posts |
| gifting-suggestions | Monthly day 5, 09:00 BRT | `.../gifting-suggestions/route.ts` | R-GIFTING.1: rank top N creators, generate suggestions |

**Also:** Update `vercel.json` with all cron schedules.

**Criteria:** Jobs execute without error, type-check passes, each job has 1+ Vitest test.

---

## Wave 7: Review & Polish (3 agents, depends on Wave 6)

### Agent: `reviewer-1`

- Review: admin pages (Waves 3), public form (Wave 5), jobs-core (Wave 6)
- Check: server action error handling, RBAC enforcement, input validation, SQL injection prevention
- Verify: all business rules from spec sections 4.1-4.4, 4.6-4.10 are implemented

### Agent: `reviewer-2`

- Review: portal pages (Wave 4), integrations (Wave 2), jobs-social (Wave 6)
- Check: portal only shows own data, ambassador-specific UI (hide earnings), mobile responsiveness
- Verify: all business rules from spec sections 4.5, 4.9 (lifecycle + onboarding) are implemented

### Agent: `polish`

- DS.md compliance audit: Moonstone tokens, DM Sans/Mono, Lucide icons, shadcn/ui components
- Mobile-responsive check: all portal pages, touch targets 44px
- Final type-check: `pnpm type-check` zero errors
- Clean TODOs, console.logs, unused imports
- Verify all labels are PT-BR (no English in UI)

---

## Stubs for Modules Not Yet Implemented

| Feature | Depends On | Stub | Location |
|---------|-----------|------|----------|
| Product catalog (portal) | ERP products | `getProducts()` → `[]` with TODO | `apps/web/src/lib/stubs/products.ts` |
| Creator Kit / Materials | DAM module | `getCreatorKitAssets()` → `[]` with TODO | `apps/web/src/lib/stubs/dam.ts` |
| Post-purchase creator invite | WhatsApp Engine | Event emitted, handler is no-op | `apps/web/src/lib/stubs/whatsapp.ts` |
| Sale attribution trigger | Checkout order.paid | Server action created, no webhook | `apps/web/src/app/actions/creators/sales.ts` |
| Exchange adjustment | Trocas module | Server action created, no trigger | `apps/web/src/app/actions/creators/sales.ts` |
| Gifting → ERP order | ERP orders | gifting_log created, erp_order_id = null | `apps/web/src/lib/stubs/erp.ts` |
| WA notifications | WhatsApp Engine | `sendTemplate()` → console.log | `apps/web/src/lib/stubs/whatsapp.ts` |
| CRM sync | CRM module | No-op on creator.approved | `apps/web/src/lib/stubs/crm.ts` |

---

## Coverage Checklist

### User Stories

- [x] US-01 (registration 3-step): Wave 5 public-form
- [x] US-02 (approval notification): Wave 2 backend-crud (lifecycle)
- [x] US-03 (share coupon): Wave 4 portal-layout (coupons)
- [x] US-04 (dashboard): Wave 4 portal-layout (dashboard)
- [x] US-05 (sales history): Wave 4 portal-data (sales)
- [x] US-06 (IG post detected): Wave 6 jobs-social + Wave 4 portal-engagement (content)
- [x] US-07 (challenges): Wave 4 portal-engagement (challenges)
- [x] US-08 (submit proof): Wave 4 portal-engagement (challenges)
- [x] US-09 (tier notification): Wave 6 jobs-core (tier-evaluation)
- [x] US-10 (payout history): Wave 4 portal-data (earnings)
- [x] US-11 (profile edit): Wave 4 portal-data (profile)
- [x] US-12 (referral): Wave 2 backend-crud (referrals)
- [x] US-13 (tier downgrade): Wave 6 jobs-core (tier-evaluation)
- [x] US-14 (admin review): Wave 3 admin-list
- [x] US-14a (ranking): Wave 4 portal-data (ranking)
- [x] US-14b (products catalog): Wave 4 portal-engagement (products) — stub
- [x] US-14c (share templates): Wave 4 portal-layout (coupons)
- [x] US-14d (detected content): Wave 4 portal-engagement (content)
- [x] US-14e (brand assets): Wave 4 portal-engagement (materials) — stub
- [x] US-15 (challenge CRUD): Wave 3 admin-config
- [x] US-16 (review submissions): Wave 3 admin-config
- [x] US-17 (process payouts): Wave 3 admin-config
- [x] US-18 (anti-fraud): Wave 3 admin-campaigns
- [x] US-19 (analytics): Wave 3 admin-analytics
- [x] US-20 (suspend): Wave 3 admin-list
- [x] US-21 (reactivate): Wave 3 admin-list
- [x] US-22 (adjust points): Wave 3 admin-list
- [x] US-23 (white-glove): Wave 3 admin-list (new)
- [x] US-24 (UTM links): Wave 3 admin-list (detail)
- [x] US-25 (campaign ROI): Wave 3 admin-campaigns
- [x] US-26 (payment method): Wave 3 admin-config (payouts)
- [x] US-27 (post-purchase invite): Wave 6 jobs-social — stub
- [x] US-NEW1 (ambassador apply): Wave 5 public-form
- [x] US-NEW2 (ambassador portal): Wave 4 portal-layout
- [x] US-NEW3 (campaign briefs): Wave 3 admin-campaigns
- [x] US-NEW4 (gifting suggestions): Wave 3 admin-campaigns + Wave 6 jobs-social
- [x] US-NEW5 (materials download): Wave 4 portal-engagement — stub

### Business Rules

- [x] R0-R8 (tier system): Pre-Wave (schema) + Wave 2 (backend) + Wave 6 (tier-evaluation job)
- [x] R9-R18 (commission/payouts): Wave 2 (backend-business) + Wave 6 (confirm-sales, payout-calculation)
- [x] R19-R24a (points): Wave 2 (backend-business)
- [x] R25-R28 (anti-fraud): Wave 2 (backend-business)
- [x] R29-R32b (social tracking): Wave 6 (jobs-social)
- [x] R33-R37 (lifecycle): Wave 2 (backend-crud) + Wave 5 (public-form) + Wave 6 (content-reminder)
- [x] R-SCORING: Wave 2 (backend-business)
- [x] R-GIFTING.1-6: Wave 2 (backend-business) + Wave 6 (gifting-suggestions)
- [x] R-PLAYBOOK.1-4: Wave 3 (admin-campaigns)
- [x] R-FISCAL.1-10: Wave 2 (backend-business) + Pre-Wave (tax_profiles table)

### Background Jobs (12 total)

- [x] confirm-sales (daily): Wave 6 jobs-core
- [x] tier-evaluation (monthly): Wave 6 jobs-core
- [x] payout-calculation (monthly): Wave 6 jobs-core
- [x] monthly-cap-reset (monthly): Wave 6 jobs-core
- [x] ambassador-promotion (daily): Wave 6 jobs-core
- [x] referral-expiry (daily): Wave 6 jobs-core
- [x] instagram-polling (15min): Wave 6 jobs-social
- [x] hashtag-tracking (daily): Wave 6 jobs-social
- [x] social-sync (daily): Wave 6 jobs-social
- [x] inactive-alerter (weekly): Wave 6 jobs-social
- [x] content-reminder (daily): Wave 6 jobs-social
- [x] gifting-suggestions (monthly): Wave 6 jobs-social

### UI Screens (20 wireframes)

- [x] 5.1 Portal Dashboard: Wave 4
- [x] 5.2 Portal Coupons & Links: Wave 4
- [x] 5.3 Portal Sales History: Wave 4
- [x] 5.4 Portal Challenges: Wave 4
- [x] 5.5 Portal Challenge Submission: Wave 4
- [x] 5.6 Portal Earnings: Wave 4
- [x] 5.7 Portal Profile: Wave 4
- [x] 5.8 Portal Ranking: Wave 4
- [x] 5.9 Portal Products: Wave 4 (stub)
- [x] 5.10 Portal Briefings: Wave 4
- [x] 5.11 Portal Materials: Wave 4 (stub)
- [x] 5.12 Admin Campaign Detail + Playbook: Wave 3
- [x] 5.13 Public Application Form: Wave 5
- [x] 5.14 Admin Creator List: Wave 3
- [x] 5.15 Admin Creator Detail: Wave 3
- [x] 5.16 Admin Challenge Manager: Wave 3
- [x] 5.17 Admin Payout Manager: Wave 3
- [x] 5.18 Admin Anti-Fraud Monitor: Wave 3
- [x] 5.19 Admin Analytics Dashboard: Wave 3
- [x] 5.20 Admin Campaigns (ROI Tracker): Wave 3

---

## References

| Doc | Content |
|-----|---------|
| `CLAUDE.md` | Rules for Claude, stack, structure |
| `DS.md` | Design System Moonstone |
| `AGENT_TEAMS_GUIDE.md` | Agent team execution patterns |
| `docs/modules/platform/onboarding.md` | Platform Onboarding & Integration Catalog spec |
| `docs/modules/growth/creators.md` | Full spec (2.270 lines) |
| `docs/architecture/DATABASE.md` | Schema reference |
| `docs/architecture/AUTH.md` | RBAC, permissions |
| `docs/architecture/API.md` | REST patterns |
| `packages/db/src/schema/creators.ts` | Drizzle schema |
