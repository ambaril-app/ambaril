# Ambaril — Instruções para Claude

## Identidade do projeto

- **Nome da aplicação:** Ambaril (plataforma SaaS multi-tenant)
- **Nome antigo:** CIENA OS, LUMN — NUNCA usar estes nomes em código, docs ou interface
- **Tipo:** SaaS all-in-one para streetwear brands brasileiras (multi-tenant)
- **Substitui:** Bling (ERP), Kevi (CRM), Yever (Checkout), TroqueCommerce (Trocas), Monday+Trello (Tarefas), Chatwoot+WA manual (Mensageria), Google Drive (DAM), Planilhas (PLM)
- **Equipe:** 9 pessoas (ver docs/dev/GLOSSARY.md seção 4)
- **Faturamento:** ~R$ 170k/mês
- **11 módulos core + 2 camadas AI** + expansões aprovadas (ver PLAN.md)

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
- **LLM:** Multi-model — Claude Sonnet (Anthropic, tier `reasoning`: chat, criativo) + Gemini 2.5 Flash (Google, tier `structured`: reports, distill, classificação)
- **Monorepo:** Turborepo (`apps/web`, `apps/mcp-server`, `packages/db`, `packages/ui`, `packages/shared`, `packages/email`)
- **Astro Agent:** Fork externo do Hermes (`ambaril/astro-agent`, Python, VPS por tenant) — conecta via REST API + MCP. Ver ADR-015.
- **Forms:** React Hook Form + Zod (schemas compartilhados front/back)
- **Data Fetching:** Server Actions + TanStack Query
- **Testes:** Vitest (unit/integration) + Playwright (E2E)
- **Session cookie:** `ambaril_session`
- **Workspace packages:** `@ambaril/*`
- **Monorepo path:** `ambaril/`

## Documentação (SEMPRE consultar antes de implementar)

| Doc              | Path                               | Conteúdo                                                                                                       |
| ---------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Design System    | `DS.md`                            | Cores (Moonstone), tipografia (DM Sans/Mono), componentes (shadcn/ui), navegação, charts (Recharts), animações |
| Design Companion | `../DESIGN.md`                     | Regras LLM-first, recipes de componentes e páginas, prompt contract, mapeamento para referências curadas       |
| Plan             | `PLAN.md`                          | Mapa de 11 módulos + 2 AI + timeline                                                                           |
| Schema           | `docs/architecture/DATABASE.md`    | 79 tabelas, 15 schemas PostgreSQL                                                                              |
| API              | `docs/architecture/API.md`         | Padrões REST + catálogo de endpoints                                                                           |
| Auth             | `docs/architecture/AUTH.md`        | RBAC, 9 roles, permission matrix                                                                               |
| Stack            | `docs/architecture/STACK.md`       | Tech stack com ADRs aprovados                                                                                  |
| Infra            | `docs/architecture/INFRA.md`       | Deploy, CI/CD, custos                                                                                          |
| Glossário        | `docs/dev/GLOSSARY.md`             | Mapeamento PT-BR ↔ EN                                                                                          |
| Dev Guide        | `docs/dev/DEV-GUIDE.md`            | Onboarding do dev                                                                                              |
| Git              | `docs/dev/GIT-WORKFLOW.md`         | Branching, commits, PRs                                                                                        |
| Módulos          | `docs/modules/{group}/{module}.md` | Specs completos — todas as features dentro do módulo                                                           |
| Security         | `docs/platform/SECURITY.md`        | Security lifecycle, gates, patterns, incident response                                                         |
| Platform         | `docs/platform/*.md`               | LGPD, Audit Log, Errors, Testing, Notifications (Flare), Search                                                |

## Estrutura de módulos (espelha sidebar)

```
modules/
├── commerce/          checkout.md, b2b.md
├── operations/        erp.md, plm.md, trocas.md
├── growth/            crm.md, creators.md, marketing.md  ← creators.md reativado
├── team/              tarefas.md, dam.md
├── communication/     mensageria.md  ← pulse.md DEPRECATED S35, movido para docs/archive/
└── intelligence/      dashboard.md, astro.md, genius.md
```

### Módulo = Ferramenta (identidade de mercado)

| Módulo               | Substitui        | Equivalente mercado            |
| -------------------- | ---------------- | ------------------------------ |
| ERP                  | Bling            | Bling, Tiny, Omie              |
| PLM                  | Planilhas        | Centric PLM, Backbone PLM      |
| Dashboard            | Reports manuais  | Trezo, Metabase                |
| Tarefas              | Monday+Trello    | Monday, Asana, ClickUp         |
| CRM                  | Kevi             | Edrone, Klaviyo                |
| Creators             | Processo manual  | Aspire, CreatorIQ              |
| Mensageria           | Chatwoot+WA      | Zenvia, Take Blip, Intercom    |
| Trocas               | TroqueCommerce   | TroqueCommerce, AfterShip      |
| DAM                  | Google Drive     | Brandfolder, Bynder            |
| Marketing            | Manus AI+Meta BS | Sprout Social+SEMrush          |
| B2B                  | Manual           | Handshake, NuOrder             |
| Astro (AI)           | —                | Shopify Sidekick               |
| Genius (AI KB)       | —                | Notion AI, Guru                |
| Astro (AI + Discord) | —                | Shopify Sidekick + Databox+bot |

## RBAC — Roles (ver AUTH.md para detalhes completos)

| Role           | Pessoas            | Escopo                                                                               |
| -------------- | ------------------ | ------------------------------------------------------------------------------------ |
| `admin`        | Marcus             | Tudo                                                                                 |
| `pm`           | Caio               | CRM, Marketing, Tarefas (+ Calendário Universal), Dashboard, DAM, Checkout analytics |
| `creative`     | Yuri, Sick         | DAM (full), Tarefas (próprias), Marketing (read-only), Dashboard (painel Marketing)  |
| `operations`   | Tavares, Ana Clara | ERP, PLM, Trocas, Estoque                                                            |
| `support`      | Slimgust           | Mensageria (inbox), Trocas, CRM (read-only)                                          |
| `finance`      | Pedro              | ERP financeiro, DRE, Margem                                                          |
| `commercial`   | Guilherme          | B2B Portal                                                                           |
| `b2b_retailer` | Lojistas externos  | Portal B2B (limitado)                                                                |
| `creator`      | Influenciadores    | Portal Creators (self-service)                                                       |

Modelo de permissão: `resource:action` (ex: `erp:orders:write`, `dam:assets:upload`)

## Brand vocabulary

| Nome       | Tipo                       | Em código                     |
| ---------- | -------------------------- | ----------------------------- |
| **Beacon** | Dashboard                  | `beacon` / `dashboard`        |
| **Astro**  | AI Brain + Discord Runtime | `astro` / `ai` / `mcp-server` |
| **Flare**  | Alertas                    | `flare` / `notifications`     |
| **Forge**  | PLM + ERP                  | `forge` (conceitual)          |
| **Astro**  | AI Brain                   | `astro` / `ai`                |

## Responsividade (ver DS.md §10)

- **Desktop-first.** 90% do uso é desktop. Mobile é bônus, não requisito.
- **Exceção:** Ana Clara (logistics) usa EXCLUSIVAMENTE mobile — telas de ERP/logística/estoque devem ser mobile-functional com touch targets de 44px e ação sticky no bottom.
- **Módulos desktop-only na v1:** Dashboard completo, Analytics, PLM timeline, Fiscal, CRM bulk actions, DAM.

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

| Capability  | Providers (CIENA)                   | Alternativas futuras           |
| ----------- | ----------------------------------- | ------------------------------ |
| `ecommerce` | Shopify                             | Nuvemshop, VNDA, WooCommerce   |
| `checkout`  | Yever                               | Shopify Checkout, Mercado Pago |
| `payments`  | Mercado Pago                        | PagSeguro, Stripe              |
| `social`    | Instagram Graph API                 | TikTok API                     |
| `fiscal`    | Focus NFe                           | Bling (fiscal only)            |
| `shipping`  | Melhor Envio                        | Correios direto                |
| `messaging` | Meta Cloud API (WA), Resend (email) | Twilio                         |

### Serviços de infraestrutura (não são por tenant)

| Serviço              | Uso                                                               |
| -------------------- | ----------------------------------------------------------------- |
| Cloudflare R2        | Storage de assets (DAM)                                           |
| Anthropic Claude API | Sonnet — chat, reasoning, geração criativa (tier `reasoning`)     |
| Google Gemini API    | Flash — reports, distill, classificação, lint (tier `structured`) |
| Sentry               | Monitoring e error tracking                                       |
| ViaCEP               | Lookup de endereço por CEP                                        |
| Meta Ad Library      | Competitor Watch                                                  |

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

## Diretivas de agente — Segurança obrigatória (ESAA-Security Enforcement)

> Estas diretivas são **invioláveis**. Código que não as segue é código com vulnerabilidade. O SECURITY.md (docs/platform/SECURITY.md) contém os padrões completos — as diretivas abaixo são o resumo executável.

### S1. Server Actions — Tríade obrigatória (Auth + Permission + Validation)

Toda server action ("use server") que acessa dados ou executa mutações DEVE conter, nesta ordem:

```typescript
const session = await getTenantSession();                        // 1. Auth
if (!hasPermission(session.effectivePermissions, "module:action")) // 2. Permission
  return { success: false, error: "Permissão negada" };
const parsed = mySchema.safeParse(input);                        // 3. Zod validation
if (!parsed.success) return { success: false, error: ... };
```

**Sem exceção.** Mesmo que "só admin use isso". O frontend esconde botões por UX — o backend verifica por segurança.

### S2. Queries — Tenant isolation + colunas explícitas

- SEMPRE usar `withTenantContext(session.tenantId, ...)` para mutações
- SEMPRE filtrar por `tenantId` em queries de leitura
- NUNCA `.select()` sem colunas — sempre `.select({ id: table.id, name: table.name })`
- NUNCA retornar `passwordHash`, `credentials`, `tokens` em responses (mesmo server-side)

```typescript
// CORRETO
const result = await db
  .select({ id: users.id, name: users.name, email: users.email })
  .from(users)
  .where(eq(users.tenantId, session.tenantId));

// PROIBIDO — expõe passwordHash e todos os campos
const result = await db.select().from(users);
```

### S3. Input externo — Zod obrigatório

- TODO input de usuário (FormData, JSON body, query params, path params) DEVE ser validado com Zod ANTES de qualquer processamento
- Campos de texto: `.max()` obrigatório para prevenir payload abuse
- Emails: `.email()` + `.toLowerCase().trim()`
- IDs: `.uuid()` ou equivalente
- Nunca `as MyType` para cast de input — sempre `schema.safeParse()`

### S4. HTML fora do React — escapeHtml obrigatório

React JSX auto-escapa. Mas qualquer interpolação de dados de usuário em:

- Templates de email (Resend)
- HTML strings
- Logs com dados de usuário

DEVE usar `escapeHtml()` de `@ambaril/shared/utils`:

```typescript
import { escapeHtml } from "@ambaril/shared/utils";
html: `<td>${escapeHtml(userName)}</td>`;
```

### S5. Fetch externo — safeFetch obrigatório

NUNCA usar `fetch()` diretamente para URLs que contenham dados de tenant/usuário. Usar `safeFetch()` de `@/lib/safe-fetch`:

```typescript
import { safeFetch } from "@/lib/safe-fetch";
const res = await safeFetch(`https://${creds.shop}/admin/api/...`);
```

Isso valida contra allowlist de domínios e bloqueia IPs privados (SSRF protection).

### S6. Audit trail — registrar mutações sensíveis

Toda mutação que afeta: credenciais, permissões, dados de cliente, sessões, ou configurações DEVE registrar audit:

```typescript
import { audit } from "@/lib/audit";
audit(session, {
  action: "create", // create | update | delete
  resourceType: "integration",
  resourceId: providerId,
  details: { capability },
});
```

### S7. Secrets — zero em código, zero em logs

- NUNCA logar passwords, tokens, API keys, credentials (mesmo em dev)
- NUNCA hardcodar secrets — usar `process.env.X`
- Credentials de tenant vão em `global.tenant_integrations` (encrypted via `@/lib/crypto`)
- `.env` é para infra da plataforma, não para API keys de tenant

### S8. API routes — auth obrigatório

Se criar uma rota em `app/api/`:

- Endpoints públicos: DEVEM ter rate limiting
- Endpoints autenticados: DEVEM chamar `getSession()` e verificar permissões
- Endpoints de cron: DEVEM verificar `CRON_SECRET` via header `Authorization: Bearer`
- Webhooks: DEVEM verificar assinatura do provider

### S9. Novos endpoints — checklist mental antes de implementar

Antes de escrever qualquer novo endpoint/action, responder mentalmente:

1. Quem pode acessar? (role + permission)
2. Que input aceita? (Zod schema)
3. Que dados retorna? (colunas explícitas, sem PII desnecessário)
4. Cruza fronteira de tenant? (tenantId filter obrigatório)
5. É destrutivo? (precisa confirmação + audit log)
6. Aceita URL externa? (safeFetch)

### S10. Verificação de segurança pós-implementação

Após completar qualquer feature, executar esta checklist:

- [ ] Todas as server actions têm getTenantSession() + permission check?
- [ ] Todos os inputs validados com Zod?
- [ ] Queries usam .select({}) explícito (nunca .select())?
- [ ] Mutations usam withTenantContext()?
- [ ] Nenhum console.log com dados sensíveis?
- [ ] HTML fora do React usa escapeHtml()?
- [ ] Fetch externo usa safeFetch()?
- [ ] Audit log registrado para mutações sensíveis?
- [ ] `pnpm turbo type-check --filter=@ambaril/web` passa?
- [ ] `bash scripts/security-check.sh` passa sem violations?

---

## Diretivas de agente — Qualidade de implementação

### Pré-trabalho

**1. Regra Step 0 — Dead code antes de refatorar**
Em qualquer arquivo >300 LOC antes de uma refatoração estrutural: primeiro remover dead props, exports não usados, imports não usados e debug logs. Fazer commit separado disso antes de iniciar o trabalho real. Dead code consome tokens e acelera perda de contexto.

**2. Execução faseada**
Nunca tentar refatorações multi-arquivo em uma única resposta. Quebrar em fases explícitas de no máximo 5 arquivos. Completar a Fase 1, rodar verificação, aguardar aprovação explícita antes da Fase 2.

### Qualidade de código

**3. Mentalidade senior dev**
Antes de entregar qualquer implementação, perguntar: "O que um dev sênior perfeccionista rejeitaria em code review?" Se a arquitetura for genuinamente problemática — estado duplicado, padrões inconsistentes, abstrações vazando — propor e implementar a correção estrutural antes de continuar. Não aplicar band-aids. Quando a tarefa pedir apenas uma mudança pontual, fazer apenas isso; mas se houver problema arquitetural bloqueante no caminho, sinalizá-lo e propor correção.

**4. Verificação forçada obrigatória**
Uma tarefa está PROIBIDA de ser reportada como concluída sem antes executar:

- `pnpm turbo type-check --filter=@ambaril/web` (type-check)
- `bash scripts/security-check.sh` (ESAA-Security quick check)
- Corrigir TODOS os erros e violations resultantes

Se o security check reportar violations (exit code != 0), a tarefa NÃO está concluída.
O security check verifica: auth em server actions, bare .select(), secrets em logs, XSS vectors, SSRF, headers, source maps.

### Gestão de contexto

**5. Sub-agents para tarefas grandes**
Para tarefas que tocam >5 arquivos independentes, usar agentes paralelos (5-8 arquivos por agente). Processamento sequencial de tarefas grandes garante perda de contexto.

**6. Context decay — re-leitura defensiva**
Após 10+ mensagens em uma conversa, re-ler qualquer arquivo antes de editá-lo. Não confiar na memória do conteúdo de arquivos. Compactação automática pode ter destruído esse contexto silenciosamente.

**7. Budget de leitura de arquivo**
Cada leitura de arquivo é limitada a 2.000 linhas. Para arquivos >500 LOC, usar parâmetros `offset` e `limit` para leitura em chunks sequenciais. Nunca assumir que uma única leitura capturou o arquivo completo.

**8. Resultados truncados**
Resultados de ferramentas muito grandes são truncados silenciosamente. Se qualquer busca ou comando retornar poucos resultados em uma base grande, re-rodar com escopo mais estreito (diretório único, glob mais restrito). Declarar quando suspeitar de truncamento.

### Segurança nas edições

**9. Integridade da edição**
Antes de CADA edição de arquivo, re-ler o arquivo. Após editar, ler novamente para confirmar que a mudança foi aplicada corretamente. A ferramenta de edição falha silenciosamente quando `old_string` não encontra match por contexto stale. Nunca agrupar mais de 3 edits no mesmo arquivo sem uma leitura de verificação.

**10. Rename e refatoração — busca semântica manual**
Ao renomear ou alterar qualquer função/tipo/variável, executar buscas separadas para:

- Chamadas diretas e referências
- Referências a nível de tipo (interfaces, generics)
- String literals contendo o nome
- Dynamic imports e calls de `require()`
- Re-exports e entradas em barrel files
- Arquivos de teste e mocks

Nunca assumir que um único grep capturou tudo.

## Modos de operação e skills custom

### Skills do pipeline de desenvolvimento

| Comando           | Propósito                    | Quando usar                            |
| ----------------- | ---------------------------- | -------------------------------------- |
| `/spec-create`    | Criar spec de módulo novo    | Ideia → spec completa                  |
| `/spec-review`    | Validar spec existente       | Antes de implementar, ou após mudanças |
| `/spec-plan`      | Gerar plano de implementação | Spec aprovada → waves/slices           |
| `/spec-implement` | Executar o plano             | Plano aprovado → código                |

### Modos (sem auto-trigger desnecessário)

- **Conversa** (default): Nenhuma skill auto-triggera. Pesquisa, discussão, análise livre.
- **Spec workflow**: Ativado por `/spec-create`, `/spec-review`, `/spec-plan`, `/spec-implement`.
- **Design/Polish**: Ativado por `/polish`, `/critique`, `/normalize`, etc.
- **"Não sei qual usar"**: Se o operador perguntar, analisar contexto e sugerir a skill mais adequada.

### INSIGHTS.md

Durante implementação (`/spec-implement`), anotar inconsistências, gaps, expansões e riscos de segurança em `INSIGHTS.md` na raiz do projeto. **Não parar para discutir** — logar e continuar. Lembrar o operador ao final da sessão se o arquivo foi atualizado.

### Limites de saturação (hard stops)

| Signal                | Threshold | Ação               |
| --------------------- | --------- | ------------------ |
| Context tokens        | > 100K    | Parar sessão       |
| Arquivos tocados      | > 15      | Parar sessão       |
| Mensagens na conversa | > 25      | Parar sessão       |
| Tempo decorrido       | > 45 min  | Parar sessão       |
| Erros consecutivos    | > 3       | Parar, pedir ajuda |

## Convenção de naming para documentação

| Categoria            | Padrão                                          | Exemplo                                      |
| -------------------- | ----------------------------------------------- | -------------------------------------------- |
| Root-level configs   | `UPPERCASE.md`                                  | `CLAUDE.md`, `README.md`, `DS.md`, `PLAN.md` |
| Architecture docs    | `UPPERCASE.md`                                  | `API.md`, `AUTH.md`, `DATABASE.md`           |
| ADRs                 | `ADR-NNN-KEBAB-CASE.md`                         | `ADR-014-MULTI-TENANCY.md`                   |
| Module specs         | `kebab-case.md`                                 | `erp.md`, `plm.md`, `mensageria.md`          |
| Dev guides           | `UPPERCASE.md` (guias) / `kebab-case.md` (refs) | `DEV-GUIDE.md`, `focus-nfe-api-reference.md` |
| Platform docs        | `UPPERCASE.md`                                  | `SECURITY.md`, `LGPD.md`                     |
| Competitive analysis | `kebab-case.md`                                 | `audaces-isa.md`, `inbazz.md`                |
| Archived docs        | `kebab-case-archived.md` em `docs/archive/`     | `pulse-archived.md`                          |

**Regras:**

- NUNCA usar underscore em nomes de `.md` — usar hyphen
- NUNCA misturar idiomas no mesmo filename
- Archived docs SEMPRE em `docs/archive/`, nunca soltos em `docs/modules/`
