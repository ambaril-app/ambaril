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
- **UI:** shadcn/ui (Radix + cva) + Recharts + Lucide React + Tailwind v4 + DM Sans/DM Mono
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
| Design System | `DS.md` | Cores (Moonstone), tipografia (DM Sans/Mono), componentes (shadcn/ui), navegação, charts (Recharts), animações |
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

## Responsividade (ver DS.md §10)

- **Desktop-first.** 90% do uso é desktop. Mobile é bônus, não requisito.
- **Exceção:** Ana Clara (logistics) usa EXCLUSIVAMENTE mobile — telas de ERP/logística/estoque devem ser mobile-functional com touch targets de 44px e ação sticky no bottom.
- **Módulos desktop-only na v1:** Dashboard completo, Analytics, PCP timeline, Fiscal, CRM bulk actions, DAM.

## Frontend — Regras de implementação

Ao escrever qualquer componente visual (React, HTML, CSS):

1. **Consultar DS.md** — tokens, spacing scale (§14.1), overflow rules (§14.2), layout rules (§14.4)
2. **Consultar skill `baseline-ui`** — checklist de robustez genérica (acessibilidade, overflow, animação)
3. **Spacing:** usar APENAS a escala do DS.md (4/8/12/16/20/24/32/48/64). Nunca valores arbitrários
4. **Overflow:** todo texto em flex/grid precisa de `min-width: 0`. Textos em espaço limitado precisam de truncamento (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`)
5. **Tabelas:** wrapper com `overflow-x: auto`, `min-width` no `<table>`, `max-width` em cells com dados variáveis
6. **SVG:** `vector-effect: non-scaling-stroke` em todas as linhas. Charts usam `aspect-ratio` com min/max height
7. **Interativos:** `min-height: 36px` desktop, `44px` mobile. Labels com `for`. `autocomplete` em inputs
8. **Dados numéricos:** `font-variant-numeric: tabular-nums`. Monetários com `&nbsp;` (non-breaking space)
9. **Nunca** bloquear paste, usar `transition: all`, usar `vh` (usar `dvh`), centralizar conteúdo de cards (exceto empty states)
10. **Teste mental:** antes de entregar, verificar: "o que acontece se o texto for 2x mais longo? Se a tela for 768px? Se o valor for R$ 1.000.000?"

## Integrações externas — Provider Abstraction

**Regra fundamental:** Módulos consomem **capabilities**, nunca providers diretamente.
Tenant escolhe quais providers conectar em `/admin/settings/integrations` (catálogo estilo app store).
Código do módulo chama `ecommerce.listCoupons()` — nunca `shopify.listDiscountCodes()`.

### Capabilities e exemplos de providers

| Capability | Providers (CIENA) | Alternativas futuras |
|------------|-------------------|---------------------|
| `ecommerce` | Shopify | Nuvemshop, VNDA, WooCommerce |
| `checkout` | Yever | Shopify Checkout, Mercado Pago |
| `payments` | Mercado Pago | PagSeguro, Stripe |
| `social` | Instagram Graph API | TikTok API |
| `fiscal` | Focus NFe | Bling (fiscal only) |
| `shipping` | Melhor Envio | Correios direto |
| `messaging` | Meta Cloud API (WA), Resend (email) | Twilio |

### Serviços de infraestrutura (não são por tenant)

| Serviço | Uso |
|---------|-----|
| Cloudflare R2 | Storage de assets (DAM) |
| Claude API | ClawdBot reports (Haiku) + chat (Sonnet) |
| Sentry | Monitoring e error tracking |
| ViaCEP | Lookup de endereço por CEP |
| Meta Ad Library | Competitor Watch |

### Provider interface pattern

```
packages/shared/src/integrations/
  types.ts                    — Capability interfaces (EcommerceProvider, CheckoutProvider, etc.)
  registry.ts                 — Resolve tenant → provider at runtime
  providers/
    shopify.ts                — implements EcommerceProvider
    nuvemshop.ts              — implements EcommerceProvider (futuro)
    yever.ts                  — implements CheckoutProvider
    mercado-pago.ts           — implements PaymentsProvider
    instagram.ts              — implements SocialProvider
    ...
```

- **Credentials:** por tenant em `global.tenant_integrations` (encrypted). `.env` é para infra da plataforma, não para API keys de tenant.
- **Adicionar novo provider:** implementar interface da capability + registrar no catálogo. Zero mudanças no código dos módulos.

