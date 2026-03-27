# Ambaril — Instruções para Claude

## Identidade do projeto

- **Nome da aplicação:** Ambaril (plataforma SaaS multi-tenant)
- **Nome antigo:** CIENA OS, LUMN — NUNCA usar estes nomes em código, docs ou interface
- **Tipo:** SaaS all-in-one para streetwear brands brasileiras (multi-tenant)
- **Substitui:** Bling (ERP), Kevi (CRM), Yever (Checkout), TroqueCommerce (Trocas), Monday+Trello (Tarefas)
- **Equipe:** 9 pessoas (ver docs/dev/GLOSSARY.md seção 4)
- **Faturamento:** ~R$ 170k/mês
- **15 módulos** + 11 expansões aprovadas (ver plan.md)

## Regras absolutas

- NUNCA use "CIENA OS" ou "LUMN" — o nome é **Ambaril**
- A CIENA é o **primeiro tenant**. Nada de negócio deve ser hardcoded para CIENA — usar `tenant_id` / configuração por tenant
- Código SEMPRE em inglês (variáveis, funções, componentes, tabelas, colunas, rotas, enums, nomes de arquivo)
- Interface SEMPRE em PT-BR (labels, buttons, mensagens, tooltips, placeholders)
- Comentários em inglês
- Consultar `docs/dev/GLOSSARY.md` para tradução PT-BR → EN antes de criar qualquer entidade
- TypeScript strict mode (`"strict": true`), sem `any` — usar `unknown` + type narrowing
- Valores monetários: `NUMERIC(12,2)` — NUNCA float/double
- Primary keys: UUID v7
- Timestamps: UTC, colunas `created_at` e `updated_at` em toda tabela
- Soft delete: coluna `deleted_at` (nullable timestamp)
- API envelope: `{ data, meta, errors }` — ver `docs/architecture/API.md`
- Prefixar arquivos com kebab-case: `order-list.tsx`, não `OrderList.tsx`

## Stack (ver docs/architecture/STACK.md)

- **Framework:** Next.js 15 (App Router)
- **UI:** HeroUI + Recharts + Lucide React + Tailwind v4 + DM Sans/DM Mono
- **ORM:** Drizzle ORM + PostgreSQL (Neon)
- **Cache/Queues:** PostgreSQL queues + Vercel Cron (ADR-012 — Redis eliminado)
- **Storage:** Cloudflare R2 (DAM, fotos de produto)
- **Email:** Resend (transacional + marketing)
- **LLM:** Claude API (Haiku para reports, Sonnet para chat)
- **Monorepo:** Turborepo (`apps/web`, `apps/discord-bot`, `packages/db`, `packages/ui`, `packages/shared`, `packages/email`)
- **Forms:** React Hook Form + Zod (schemas compartilhados front/back)
- **Data Fetching:** Server Actions + TanStack Query
- **Testes:** Vitest (unit/integration) + Playwright (E2E)
- **Session cookie:** `ambaril_session`
- **Workspace packages:** `@ambaril/*`
- **Monorepo path:** `ambaril/`

## Documentação (SEMPRE consultar antes de implementar)

| Doc | Path | Conteúdo |
|-----|------|----------|
| Design System | `DS.md` | Cores (Moonstone), tipografia (DM Sans/Mono), componentes (HeroUI), navegação, charts (Recharts), animações |
| Plan | `plan.md` | Mapa de 15 módulos + 9 expansões + timeline |
| Schema | `docs/architecture/DATABASE.md` | 79 tabelas, 15 schemas PostgreSQL |
| API | `docs/architecture/API.md` | Padrões REST + catálogo de endpoints |
| Auth | `docs/architecture/AUTH.md` | RBAC, 9 roles, permission matrix |
| Stack | `docs/architecture/STACK.md` | Tech stack com ADRs aprovados |
| Infra | `docs/architecture/INFRA.md` | Deploy, CI/CD, custos |
| Glossário | `docs/dev/GLOSSARY.md` | Mapeamento PT-BR ↔ EN |
| Dev Guide | `docs/dev/DEV-GUIDE.md` | Onboarding do dev |
| Git | `docs/dev/GIT-WORKFLOW.md` | Branching, commits, PRs |
| Módulos | `docs/modules/{group}/{module}.md` | 14 specs com 12 seções cada |
| Expansões | `docs/expansions/expansions.md` | E1-E9 com data model stubs |
| Platform | `docs/platform/*.md` | LGPD, Audit Log, Errors, Testing, Notifications (Flare), Search |

## Estrutura de módulos (espelha sidebar)

```
modules/
├── commerce/          checkout.md, b2b.md
├── operations/        erp.md, pcp.md, trocas.md
├── growth/            crm.md, creators.md, marketing-intel.md
├── team/              tarefas.md, inbox.md, dam.md
├── communication/     whatsapp.md, clawdbot.md
└── intelligence/      dashboard.md
```

## RBAC — Roles (ver AUTH.md para detalhes completos)

| Role | Pessoas | Escopo |
|------|---------|--------|
| `admin` | Marcus | Tudo |
| `pm` | Caio | CRM, Creators, Marketing Intel, Tarefas, Dashboard, DAM, Checkout analytics |
| `creative` | Yuri, Sick | DAM (full), Tarefas (próprias + Calendário Editorial), Marketing Intel (read-only), Dashboard (painel Marketing) |
| `operations` | Tavares, Ana Clara | ERP, PCP, Trocas, Estoque |
| `support` | Slimgust | Inbox, Trocas, CRM (read-only) |
| `finance` | Pedro | ERP financeiro, DRE, Margem |
| `commercial` | Guilherme | B2B Portal |
| `b2b_retailer` | Lojistas externos | Portal B2B (limitado) |
| `creator` | Influenciadores | Portal Creators (self-service) |

Modelo de permissão: `resource:action` (ex: `erp:orders:write`, `dam:assets:upload`)

## Brand vocabulary

| Nome | Tipo | Em código |
|------|------|-----------|
| **Beacon** | Dashboard | `beacon` / `dashboard` |
| **Pulse** | Discord Bot | `pulse` / `clawdbot` |
| **Flare** | Alertas | `flare` / `notifications` |
| **Forge** | PCP + ERP | `forge` (conceitual) |

## Mobile-first

Ana Clara usa EXCLUSIVAMENTE mobile — todas as telas de ERP, logística e estoque devem ser responsive-first com touch targets de 44px.

## Integrações externas

| Serviço | Uso |
|---------|-----|
| Mercado Pago | Gateway de pagamento (PIX, cartão, boleto) |
| Melhor Envio | Frete, etiquetas, rastreamento |
| Focus NFe | Emissão de NF-e |
| Meta Cloud API | WhatsApp (sem BSP) |
| Instagram Graph API | UGC Monitor, Creator Scout |
| Meta Ad Library | Competitor Watch |
| Shopify | Storefront + Admin APIs (catálogo mantido) |
| Claude API | ClawdBot reports (Haiku) + chat (Sonnet) |
| Resend | Email transacional + marketing |
| ViaCEP | Lookup de endereço por CEP |
| Cloudflare R2 | Storage de assets (DAM) |
| Sentry | Monitoring e error tracking |
| Bling API v3 | OAuth 2.0 — criar app em developer.bling.com.br/aplicativos |

## Engenharia reversa (temporario)

- **Pasta `_legacy/`:** dados capturados das ferramentas atuais (Bling, Yever, Kevi, TroqueCommerce)
- Esta pasta e **descartavel** — sera deletada quando modulos estiverem em producao
- Specs reais do que construir estao em `docs/modules/`
- Script de captura: `scripts/reverse-engineer.ts` (Playwright)
- Cada ferramenta tem `NOTAS.md` (analise qualitativa) e `mapeamento.md` (ponte legado → Ambaril)
- Bling API v3: **OAuth 2.0** (criar app em developer.bling.com.br/aplicativos)
