# Ambaril — Plano de Implementação

> Documento único de execução. Mantido sob 300 linhas.
> Detalhes de cada módulo: `docs/modules/{group}/{module}.md`
> Stack e ADRs: `docs/architecture/STACK.md`

---

## Phase 0: Foundation (EM PROGRESSO)

### Concluído

- [x] Monorepo scaffolding (Next.js 15 + Turborepo + pnpm)
- [x] Design System Moonstone (DM Sans/Mono, HeroUI, Lucide, Recharts)
- [x] Drizzle schemas — 7 schemas, ~73 tabelas base
- [x] Auth system (Argon2id, sessions DB, middleware, RBAC types)
- [x] Login page funcional
- [x] Admin layout (sidebar + topbar + RBAC guard)
- [x] Shared package (types, validators, constants, utils)
- [x] 4 UI components base (Button, Input, Card, Badge)
- [x] Auditoria pré-commit (BullMQ→PG queues, refs stale corrigidas)
- [x] Rebrand Ambaril (era LUMN) — sessão 16
- [x] ADR-014 aprovado — Shared DB + tenant_id + RLS (B+A)
- [x] Multi-tenancy B+A implementado:
  - [x] Tabelas `tenants` + `user_tenants` no schema global
  - [x] `tenant_id` em ~54 tabelas de dados
  - [x] RLS policies (`enableRLS` + `pgPolicy`) em tabelas de domínio
  - [x] Auth atualizado com `tenantId` (createSession, getSession)
  - [x] `withTenantContext` + `getTenantSession` helpers
  - [x] Login flow busca tenant do user via `user_tenants`
  - [x] Layout/sidebar/topbar usam `TenantSessionData`
  - [x] DB exports completos (7 schemas)

### Pendente

- [ ] Gerar migrations (`pnpm db:generate`)
- [ ] Revisar SQL gerado (conferir policies)
- [ ] Aplicar migrations no Neon (`pnpm db:migrate`)
- [ ] Executar seed (`pnpm db:seed`) — CIENA + 9 users + tiers
- [ ] Verificar login end-to-end
- [ ] Primeiro commit + push

---

## Phase 1: Creators (PRÓXIMA)

> Spec completa: `docs/modules/growth/creators.md`
> Prioridade #1 (Marcus: "vai nos ajudar a faturar mais")
> Creators v1.1: cupom-only attribution, tiers configuráveis, formulário 3 etapas

### Steps

1. **Componentes UI base**
   - DataTable genérico (sort, filter, pagination, bulk actions)
   - Form components (Select, DatePicker, FileUpload, Textarea)
   - Modal/Dialog, Sheet, Tabs, Avatar, Status Badge
   - Empty states, loading skeletons

2. **Backend Creators — Server Actions**
   - CRUD creators (list, create, update, approve/reject)
   - CRUD creator tiers (per-tenant)
   - CRUD challenges + submissions
   - CRUD campaigns + campaign_creators
   - Payouts (calculate, approve, mark paid)
   - Sales attribution (coupon-based via Yever API)
   - Points ledger (append-only)

3. **Admin Pages — Creators**
   - `/admin/creators` — lista com filtros (status, tier, search)
   - `/admin/creators/[id]` — perfil completo + tabs (vendas, pontos, conteúdo, pagamentos)
   - `/admin/creators/tiers` — CRUD tiers (seed/grow/bloom/core configuráveis)
   - `/admin/creators/payouts` — lista de pagamentos + aprovação em lote
   - `/admin/creators/challenges` — lista + criação + revisão de submissões
   - `/admin/creators/campaigns` — seeding/gifting campaigns
   - `/admin/creators/analytics` — primeiro painel Beacon (Recharts)

4. **Creator Portal — Público**
   - `/creators/apply` — formulário 3 etapas (dados, social, motivação)
   - Validação Zod compartilhada front/back
   - Upload de foto de perfil (Cloudflare R2)
   - Confirmação por email (Resend)

5. **Creator Portal — Logado**
   - `/creators/dashboard` — resumo vendas, pontos, comissão
   - `/creators/sales` — histórico de vendas atribuídas
   - `/creators/points` — ledger de pontos + ranking
   - `/creators/challenges` — desafios disponíveis + submissões
   - `/creators/payouts` — histórico de pagamentos + dados PIX
   - `/creators/profile` — editar perfil + redes sociais
   - `/creators/content` — conteúdo detectado (UGC)
   - `/creators/referrals` — programa de indicação

6. **Integração Shopify + Yever**
   - Shopify Admin API: sync cupons → Shopify discount codes
   - Yever API: buscar pedidos com cupom → sales_attributions
   - Job queue: sync periódico (Vercel Cron)

7. **Dashboard Creators (Beacon)**
   - Cards: total creators, vendas atribuídas, comissão paga, ROI
   - Charts: vendas por creator (bar), evolução mensal (line), tiers (donut)
   - Top 10 creators ranking

---

## Phase 2: PCP (Planejamento e Controle de Produção)

> Spec: `docs/modules/operations/pcp.md`
> Tavares é o principal user (eng. student CEFET-RJ)
> Shopify integration: read-only (não altera catálogo)

### Steps

1. Componentes de gestão de produção (Kanban board, timeline)
2. Backend: production orders, PCP stages, SKU tier automation
3. Admin pages: production orders, supplier management, timeline
4. Shopify Storefront API: sync produtos/SKUs (read-only)
5. Dashboard PCP: stockout alerts, depletion velocity, revenue leak

---

## Phase 3: Dashboard Beacon

> Spec: `docs/modules/intelligence/dashboard.md`
> War Room para drops (monitoramento real-time)

1. Widget engine (metric cards, charts, tables)
2. Dashboard configurável por user (drag-and-drop layout)
3. War Room: real-time drop monitoring (SSE per ADR-013)
4. Comparação vs. drop anterior

---

## Phase 4: Marketing Intel

> Spec: `docs/modules/growth/marketing-intel.md`

1. Competitor Watch (Meta Ad Library API)
2. UGC Monitor (Instagram Graph API)
3. Marketing calendar
4. Social selling funnel analytics

---

## Phase 5: Tarefas

> Spec: `docs/modules/team/tarefas.md`
> Substitui Monday + Trello

1. Task board (Kanban) com módulos Ambaril como contexto
2. Calendário editorial (para Yuri/Sick)
3. Automações: tarefas criadas por eventos do sistema

---

## Fases 6+: Substituição de Ferramentas

> Estas fases substituem ferramentas pagas existentes.
> Detalhes em `docs/modules/` e `plan.md`.

| Phase | Módulo | Substitui | Economia |
|-------|--------|-----------|----------|
| 6 | DAM | Google Drive | - |
| 7 | CRM (1A) | Kevi | R$297/mês |
| 8 | Checkout | Yever | R$~1k/mês |
| 9 | ERP | Bling | R$~400/mês |
| 10 | Trocas | TroqueCommerce | R$99/mês |
| 11 | WhatsApp | Meta Cloud API | - |
| 12 | Inbox | Disparate tools | - |
| 13 | B2B Portal | Manual | - |
| 14 | Discord Bot (Pulse) | - | - |
| 15 | ClawdBot (AI) | - | - |

---

## Referências

| Doc | Conteúdo |
|-----|----------|
| `CLAUDE.md` | Regras para Claude, stack, estrutura |
| `DS.md` | Design System Moonstone |
| `plan.md` | Mapa completo de módulos + timeline |
| `docs/architecture/DATABASE.md` | Schema completo |
| `docs/architecture/AUTH.md` | RBAC, permissões |
| `docs/architecture/STACK.md` | ADRs aprovados |
| `docs/architecture/API.md` | Padrões REST |
| `docs/modules/{group}/{module}.md` | Specs de cada módulo |

---

## Decisões Chave

- **ADR-014:** Shared DB + tenant_id + RLS (B+A). Migrar para project-per-tenant quando 3+ tenants.
- **Auth:** Custom (sem framework). Cookie `ambaril_session`. Tabelas global.users/sessions.
- **Creators #1:** Prioridade máxima. Cupom-only attribution. Tiers configuráveis por tenant.
- **Roadmap v3:** NOVO primeiro (gera receita), SUBSTITUIÇÃO depois.
- **SaaS model:** Módulos vendidos individualmente.
- **Objetivo 6 meses:** Produto pronto + primeiro cliente cobaia.
