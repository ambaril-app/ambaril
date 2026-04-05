# Ambaril — Tech Stack e Decisões Técnicas

> **Versão:** 1.0
> **Data:** Março 2026
> **Status:** Aprovado — ADRs 008-014 ratificados
> **Referências:** [DS.md](../../DS.md), [PLAN.md](../../PLAN.md), [GLOSSARY.md](../dev/GLOSSARY.md)

---

## 1. Overview

Ambaril (marca UI: **Ambaril**) é uma plataforma SaaS all-in-one para a marca de streetwear CIENA. Substitui 5+ ferramentas pagas (Bling, Kevi, Yever, TroqueCommerce, Monday/Trello) e adiciona módulos novos (PCP, Creators, Marketing Intelligence, Dashboard Beacon, WhatsApp Engine, ClawdBot Discord).

**Números de referência:**

- ~15 módulos, ~100+ telas
- 9 usuários internos + portais externos (B2B, Creators, público checkout)
- Faturamento ~R$ 170k/mês
- Ana Clara usa exclusivamente mobile
- Real-time necessário para Drop War Room (vendas por minuto)
- Integrações com 12+ APIs externas

---

## 2. Frontend

### 2.1 Framework

| Opção                       | Prós                                                                                                       | Contras                                                      | Nota            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------- |
| **Next.js 15 (App Router)** | RSC para performance, SSR para checkout SEO, API routes como BFF, deploy nativo Vercel, ecossistema maduro | Lock-in Vercel (mitigável), complexidade App Router          | **Recomendado** |
| SvelteKit                   | Performance excelente, DX simples, bundle menor                                                            | Ecossistema menor, menos devs disponíveis, shadcn não nativo | Alternativa     |
| Remix                       | Bom para forms, nested routes                                                                              | Comunidade menor, menos integrações                          | Descartado      |

**Decisão:** APROVADO (ADR-008) — Next.js 15.

### 2.2 UI Layer (definido pelo DS.md)

| Lib                 | Uso                                                                                                                                  | Versão de referência |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| **shadcn/ui**       | Componentes base (Button, Input, Select, Dialog, Table, Tabs, Tooltip, Popover, Command, Sheet) — Radix UI headless + cva + Tailwind | latest               |
| **Recharts**        | Charts e metric cards no Beacon Dashboard                                                                                            | v3+                  |
| **Lucide React**    | Ícones (`lucide-react`) — Light, Regular, Bold apenas                                                                                | latest               |
| **Tailwind CSS**    | Utilitários de layout, responsividade, estados                                                                                       | v4+                  |
| **DM Sans/DM Mono** | Fonte (CDN jsdelivr conforme DS.md)                                                                                                  | 1.3.1+               |

### 2.3 State Management

| Opção                             | Prós                                      | Contras                                            | Nota                              |
| --------------------------------- | ----------------------------------------- | -------------------------------------------------- | --------------------------------- |
| **React Server Components first** | Zero JS no client para dados, performance | Limitado a dados, precisa de client state          | Base obrigatória                  |
| **Zustand** (client)              | Leve (1.1kb), API simples, boa DX         | Mais uma dependência                               | **Recomendado** para client state |
| **Jotai** (client)                | Atômico, bom para estado derivado         | Curva de aprendizado, overhead para equipe pequena | Alternativa                       |
| React Context                     | Nativo, sem dependência                   | Renders desnecessários, não escala                 | Não recomendado                   |

**Decisão:** APROVADO (ADR-011) — RSC + Zustand.

### 2.4 Forms e Validação

| Lib                 | Uso                                                       |
| ------------------- | --------------------------------------------------------- |
| **React Hook Form** | Gerenciamento de forms (performance, uncontrolled inputs) |
| **Zod**             | Schemas de validação (compartilhados front/back)          |

Zod schemas são definidos uma vez e usados tanto no frontend (validação inline) quanto no backend (validação de API). Isso é não-negociável — sem duplicação de validação.

### 2.5 Data Fetching

| Opção               | Prós                                         | Contras                                       | Nota                                      |
| ------------------- | -------------------------------------------- | --------------------------------------------- | ----------------------------------------- |
| **TanStack Query**  | Cache, refetch, optimistic updates, devtools | Mais uma lib                                  | **Recomendado** para client-side fetching |
| SWR                 | Mais simples, Vercel ecosystem               | Menos features que TanStack                   | Alternativa                               |
| Server Actions only | Zero lib extra                               | Limitado para UX complexa (optimistic, cache) | Insuficiente sozinho                      |

**Decisão:** APROVADO — Server Actions para mutations + TanStack Query para client data.

---

## 3. Backend

### 3.1 Runtime e Framework

| Opção                                   | Prós                                                  | Contras                                                | Nota                              |
| --------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------ | --------------------------------- |
| **Next.js API Routes + Server Actions** | Mesmo deploy, type sharing, colocalizado com frontend | Limitado para background jobs, não é um backend "real" | **Recomendado** como BFF          |
| Hono (separado)                         | Ultra leve, edge-ready, type-safe                     | Segundo deploy, mais complexidade                      | Para API pública futura           |
| Fastify (separado)                      | Maduro, plugins, performance                          | Overhead de manter 2 stacks                            | Não recomendado p/ equipe pequena |

**Decisão:** APROVADO (ADR-008) — Next.js API Routes + Server Actions como BFF principal. Se necessário no futuro, extrair APIs para Hono. Background jobs via PostgreSQL queues + Vercel Cron (ver seção 6).

### 3.2 ORM / Database Access

| Opção           | Prós                                                                                    | Contras                                                                      | Nota             |
| --------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------- |
| **Drizzle ORM** | Type-safe, SQL-like, lightweight (~35kb), migrations first-class, suporta raw SQL fácil | Ecossistema mais novo, menos tutoriais                                       | **Recomendado**  |
| Prisma          | Maduro, Prisma Studio, grande ecossistema                                               | Pesado (~8MB), queries complexas requerem raw SQL, overhead de schema.prisma | Alternativa      |
| Kysely          | Query builder puro, zero overhead                                                       | Sem migrations embutido, menos ergonômico                                    | Para SQL experts |

**Decisão:** APROVADO (ADR-009) — Drizzle ORM.

**Justificativa Drizzle:** O Ambaril precisa de queries SQL complexas (tsvector search, window functions para RFM, CTEs para DRE, aggregations para dashboard). Drizzle permite raw SQL ergonomicamente sem sair do ORM. Prisma obrigaria raw SQL separado para metade das queries do sistema.

---

## 4. Database

### 4.1 PostgreSQL

**Não-negociável.** Requisitos que exigem Postgres:

- `tsvector` + `tsquery` para busca global full-text (DS.md seção 9.2)
- JSONB para metadata flexível (audit log diffs, configurações)
- Window functions para RFM scoring, cohort analytics
- CTEs para DRE, calculadora de margem
- Row-level security (possível futuro para RBAC)
- Triggers para audit log automático
- Enums nativos para status (order, production stages)

### 4.2 Hosting do Banco

| Opção     | Prós                                                                          | Contras                                          | Nota                |
| --------- | ----------------------------------------------------------------------------- | ------------------------------------------------ | ------------------- |
| **Neon**  | Serverless, branching (dev/staging/prod isolados), scale-to-zero, autoscaling | Latência cold start (~100ms), pricing em compute | **Recomendado**     |
| Supabase  | Postgres + auth + realtime + storage, generous free tier                      | Mais opinado, pode conflitar com escolhas custom | Alternativa viável  |
| Railway   | Simple, flat pricing, always-on                                               | Sem branching, sem scale-to-zero                 | Alternativa simples |
| RDS (AWS) | Enterprise, confiável                                                         | Overkill, gerenciamento manual, caro             | Não recomendado     |

**Decisão:** APROVADO (ADR-010) — Neon PostgreSQL Scale ($69/mês). Branching é killer feature para dev workflow.

---

## 5. Cache e Real-time

### 5.1 Redis — REJEITADO (ADR-012)

> **Redis foi eliminado da stack.** Background jobs usam PostgreSQL queues + Vercel Cron. Sessions usam cookie `ambaril_session` com tabela `global.sessions`. Rate limiting usa PostgreSQL. Cache de dashboard usa RSC + ISR/revalidação.

| Opção             | Prós                                                   | Contras                       | Nota                    |
| ----------------- | ------------------------------------------------------ | ----------------------------- | ----------------------- |
| ~~Upstash~~       | Serverless, pay-per-request, REST API, edge-compatible | Latência vs. dedicated Redis  | **REJEITADO (ADR-012)** |
| ~~Railway Redis~~ | Always-on, dedicated, previsível                       | Sem edge, pricing fixo        | **REJEITADO (ADR-012)** |
| ~~Vercel KV~~     | Integrado, edge-ready                                  | Wrapper do Upstash com markup | **REJEITADO (ADR-012)** |

**Usos originalmente planejados para Redis (agora resolvidos sem Redis):**

- ~~Session store~~ → cookie `ambaril_session` + tabela `global.sessions`
- ~~Job queue (BullMQ)~~ → PostgreSQL queues + Vercel Cron (ADR-012)
- Real-time counters (Drop War Room) → SSE + PostgreSQL (ADR-013)
- Rate limiting → PostgreSQL-based
- Cache de dados de dashboard → RSC + ISR/revalidação

### 5.2 Real-time (Drop War Room)

| Opção                        | Prós                                                                | Contras                            | Nota              |
| ---------------------------- | ------------------------------------------------------------------- | ---------------------------------- | ----------------- |
| **Server-Sent Events (SSE)** | Simples, HTTP nativo, funciona com Vercel, unidirecional suficiente | Não bidirecional, reconexão manual | **Recomendado**   |
| WebSocket (Soketi/Pusher)    | Bidirecional, maduro                                                | Requer infra separada, custo       | Para escala maior |
| Polling (5s)                 | Zero infra extra                                                    | Latência, tráfego desnecessário    | Fallback          |

**Decisão:** APROVADO (ADR-013) — SSE para Drop War Room + notifications. A War Room é read-only (dados fluem servidor→cliente). SSE funciona nativamente com Next.js e Vercel. Se bidirecional for necessário no futuro, migrar para WebSocket.

---

## 6. Background Jobs

| Opção                               | Prós                                                                                       | Contras                                               | Nota                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ----------------------- |
| **PostgreSQL queues + Vercel Cron** | Zero dependência extra, sem Redis, integrado com stack existente, retry via tabela de jobs | Menos features que BullMQ                             | **APROVADO (ADR-012)**  |
| ~~BullMQ + Redis~~                  | Maduro, prioridades, retry, scheduling (cron), dashboard (Bull Board)                      | Requer worker dedicado (não serverless), requer Redis | **REJEITADO (ADR-012)** |
| ~~Trigger.dev~~                     | Serverless jobs, built for Next.js                                                         | Vendor lock-in, pricing                               | REJEITADO               |
| ~~Inngest~~                         | Event-driven, serverless, step functions                                                   | Vendor lock-in, curva de aprendizado                  | REJEITADO               |

**Jobs necessários no Ambaril:**

| Job                           | Módulo    | Frequência                           | Prioridade |
| ----------------------------- | --------- | ------------------------------------ | ---------- |
| Reports de vendas             | ClawdBot  | Diário 08:00                         | Alta       |
| Reports de estoque            | ClawdBot  | Diário 08:15                         | Alta       |
| Reports financeiro            | ClawdBot  | Diário 08:30                         | Alta       |
| Reports de produção           | ClawdBot  | Diário 08:45                         | Alta       |
| Reports de marketing          | ClawdBot  | Diário 09:00                         | Alta       |
| Reports B2B                   | ClawdBot  | Semanal seg 09:30                    | Média      |
| Reports suporte               | ClawdBot  | Semanal sex 17:00                    | Média      |
| RFM scoring recalc            | CRM       | Diário 03:00                         | Média      |
| DRE mensal                    | ERP       | Mensal dia 1                         | Alta       |
| WhatsApp campaign dispatch    | WhatsApp  | On-demand (queued)                   | Alta       |
| NF-e emission                 | ERP       | On-demand (queued)                   | Crítica    |
| Shipping label gen            | ERP       | On-demand (queued)                   | Alta       |
| Cart recovery                 | CRM       | Trigger: 30min, 2h, 24h pós-abandono | Média      |
| Creator tier progression      | Creators  | Mensal dia 1                         | Média      |
| Creator payout calc           | Creators  | Mensal dia 10                        | Alta       |
| Instagram UGC polling         | Marketing | A cada 15min                         | Baixa      |
| Competitor Ad Library polling | Marketing | Diário 06:00                         | Baixa      |
| Audit log archival            | Platform  | Mensal                               | Baixa      |

**Decisão:** APROVADO (ADR-012) — PostgreSQL queues + Vercel Cron. Redis eliminado da stack.

---

## 7. File Storage (DAM)

| Opção             | Prós                                       | Contras                            | Nota                      |
| ----------------- | ------------------------------------------ | ---------------------------------- | ------------------------- |
| **Cloudflare R2** | S3-compatible, egress gratuito, CDN global | Console menos polida que S3        | **Recomendado**           |
| AWS S3            | Maduro, ecossistema vasto                  | Egress caro (pode crescer com DAM) | Alternativa               |
| Supabase Storage  | Integrado se usar Supabase                 | Lock-in                            | Alternativa (se Supabase) |

**Usos:**

- DAM: fotos de produto, KVs, mockups, vídeos, UGC aprovado
- Thumbnails: gerados server-side (Sharp) no upload
- CDN: Cloudflare CDN nativo (R2) ou CloudFront (S3)

---

## 8. External Services / APIs

| Serviço                 | Propósito                        | Módulo(s)       | Auth                 | Rate Limits                  | Custo                       |
| ----------------------- | -------------------------------- | --------------- | -------------------- | ---------------------------- | --------------------------- |
| **Mercado Pago**        | Pagamentos (cartão, PIX, boleto) | Checkout, ERP   | OAuth + Access Token | 1000 req/min                 | ~6% cartão, 0% PIX          |
| **Focus NFe**           | Emissão de NF-e                  | ERP             | API Key              | 60 req/min                   | ~R$ 0,10/NF-e               |
| **PlugNotas**           | Alternativa NF-e                 | ERP             | API Key              | Variável                     | Similar Focus               |
| **Melhor Envio**        | Etiquetas + rastreamento         | ERP, Trocas     | OAuth                | 600 req/min                  | Variável por transportadora |
| **ViaCEP**              | Autocomplete de endereço         | Checkout        | Público              | Sem limite oficial           | Gratuito                    |
| **Meta Cloud API**      | WhatsApp Business messaging      | WhatsApp        | System User Token    | 80 msg/s (tier 1)            | ~R$ 0,25-0,80/msg           |
| **Instagram Graph API** | UGC detection, creator metrics   | Marketing Intel | App Token            | 200 req/user/hr              | Gratuito                    |
| **Meta Ad Library API** | Competitor ad monitoring         | Marketing Intel | App Token            | Rate limited                 | Gratuito                    |
| **Discord API**         | ClawdBot (reports + chat)        | ClawdBot        | Bot Token            | 50 req/s                     | Gratuito                    |
| **Resend**              | Email transacional + marketing   | CRM, WhatsApp   | API Key              | 100/day free, then unlimited | $20/mo (10k emails)         |
| **Claude API**          | LLM: reports, chat, descriptions | ClawdBot, ERP   | API Key              | Tier-based                   | ~$15-50/mo estimado         |
| **Cloudflare R2**       | File storage (DAM)               | DAM             | S3-compat keys       | Sem limite prático           | $0.015/GB/mo, egress free   |

### 8.1 Client Pattern

Cada integração externa deve seguir este padrão:

```
packages/integrations/
├── mercado-pago/
│   ├── client.ts         # HTTP client configurado (base URL, auth, retry)
│   ├── types.ts          # Tipos do request/response
│   ├── webhooks.ts       # Handler de webhooks incoming
│   └── index.ts          # Exports públicos
├── melhor-envio/
│   └── ...
├── focus-nfe/
│   └── ...
└── ...
```

**Requisitos para cada client:**

- Retry com exponential backoff (1s, 2s, 4s, max 3 tentativas)
- Timeout configurável por serviço
- Logging estruturado (request ID, duração, status)
- Circuit breaker para serviços críticos (Mercado Pago, NF-e)
- Type-safe request/response (Zod schemas)

---

## 9. Monorepo Structure

| Opção                      | Prós                                   | Contras                              | Nota                  |
| -------------------------- | -------------------------------------- | ------------------------------------ | --------------------- |
| **Turborepo**              | Rápido, cache inteligente, zero config | Menos features que Nx                | **Recomendado**       |
| Nx                         | Mais features, computation cache       | Complexo, overkill para este tamanho | Alternativa           |
| pnpm workspaces (sem tool) | Simples, sem dependência extra         | Sem cache, sem task graph            | Para projetos menores |

**Estrutura proposta:**

```
ambaril/
├── apps/
│   ├── web/                  # Next.js app principal (admin + checkout)
│   │   ├── app/              # App Router pages
│   │   │   ├── (admin)/      # Route group: dashboard interno
│   │   │   ├── (checkout)/   # Route group: checkout público
│   │   │   ├── (creators)/   # Route group: portal creators
│   │   │   ├── (b2b)/        # Route group: portal B2B
│   │   │   └── api/          # API routes
│   │   ├── components/       # Componentes específicos do app
│   │   └── lib/              # Utilidades específicas do app
│   │
│   └── discord-bot/          # ClawdBot (Node.js standalone)
│       ├── commands/         # Slash commands
│       ├── reports/          # Report generators (SQL → format)
│       ├── chat/             # Chat interativo #geral-ia
│       └── scheduler/        # Cron scheduler para reports
│
├── packages/
│   ├── db/                   # Database: schema, migrations, seed, queries
│   │   ├── schema/           # Drizzle schema files (1 per module)
│   │   ├── migrations/       # SQL migrations
│   │   ├── seed/             # Seed data para dev
│   │   └── queries/          # Queries compartilhadas
│   │
│   ├── ui/                   # Shared UI components (shadcn customizado)
│   │   ├── components/       # Button, Input, Table, etc.
│   │   ├── tokens/           # CSS tokens (DS.md)
│   │   └── lib/              # UI utilities
│   │
│   ├── integrations/         # External API clients
│   │   ├── mercado-pago/
│   │   ├── melhor-envio/
│   │   ├── focus-nfe/
│   │   ├── whatsapp/
│   │   ├── instagram/
│   │   ├── discord/
│   │   ├── resend/
│   │   ├── claude/
│   │   └── viacep/
│   │
│   ├── validators/           # Zod schemas compartilhados front/back
│   │
│   ├── types/                # TypeScript types compartilhados
│   │
│   └── utils/                # Utilidades genéricas (formatters, BR helpers)
│       ├── currency.ts       # formatBRL(), parseBRL()
│       ├── cpf.ts            # validateCPF(), formatCPF(), maskCPF()
│       ├── cep.ts            # formatCEP()
│       ├── date.ts           # formatDateBR(), formatTimeBR()
│       └── ...
│
├── docs/                     # Esta documentação
├── turbo.json                # Turborepo config
├── package.json              # Root package.json
├── pnpm-workspace.yaml       # pnpm workspace config
└── .env.example              # Template de env vars
```

---

## 10. Hosting e Deploy

| Opção                       | Prós                                                                              | Contras                                 | Custo estimado                                       |
| --------------------------- | --------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| **Vercel** (web + cron)     | Next.js nativo, preview deploys, edge functions, analytics, Vercel Cron para jobs | Pricing pode escalar, serverless limits | ~$20-50/mo (Pro)                                     |
| **Neon** (database)         | Serverless PG, branching, autoscaling, scale-to-zero OFF                          | Cold start                              | ~$69/mo (Scale)                                      |
| **Cloudflare R2** (storage) | Egress free, S3 compat                                                            | —                                       | ~$5-15/mo                                            |
| **Resend** (email)          | Developer-friendly                                                                | —                                       | ~$20-40/mo                                           |
| ~~Railway (worker)~~        | —                                                                                 | —                                       | **REJEITADO (ADR-012)** — worker eliminado com Redis |
| ~~Upstash (Redis)~~         | —                                                                                 | —                                       | **REJEITADO (ADR-012)** — Redis eliminado da stack   |

**Custo total estimado:** ~$114-174/mo — 4 vendors (Vercel, Neon, Cloudflare R2, Resend). Muito abaixo dos R$ 4.300+/mês de ferramentas substituídas.

### 10.1 Environments

| Env           | Database                  | URL                   | Propósito   |
| ------------- | ------------------------- | --------------------- | ----------- |
| `development` | Neon branch `dev` (local) | `localhost:3000`      | Dev local   |
| `staging`     | Neon branch `staging`     | `staging.ambaril.app` | Preview, QA |
| `production`  | Neon branch `main`        | `app.ambaril.app`     | Produção    |

---

## 11. Monitoring e Observability

| Ferramenta              | Propósito                                            | Prioridade                          |
| ----------------------- | ---------------------------------------------------- | ----------------------------------- |
| **Sentry**              | Error tracking, performance monitoring               | Crítica (dia 1)                     |
| **Vercel Analytics**    | Web vitals, page performance                         | Alta                                |
| **Job Queue Dashboard** | Dashboard de PostgreSQL jobs (status, retry, failed) | Alta                                |
| **Structured Logging**  | JSON logs com correlation ID                         | Alta                                |
| **Uptime monitoring**   | Ping externo para APIs críticas                      | Média (Better Uptime / UptimeRobot) |

---

## 12. Security Baseline

| Medida             | Implementação                                |
| ------------------ | -------------------------------------------- |
| HTTPS everywhere   | Enforced by hosting provider                 |
| CORS               | Configurado por domínio permitido            |
| CSRF               | Next.js Server Actions (built-in)            |
| Rate limiting      | PostgreSQL-based, per-user, per-endpoint     |
| Input validation   | Zod schemas em todas as bordas               |
| SQL injection      | ORM (Drizzle) parametriza queries            |
| XSS                | React escaping + Content-Security-Policy     |
| Secrets management | Env vars (não commitadas), rotação periódica |
| Dependency audit   | `pnpm audit` no CI                           |
| Audit log          | Toda mutação logada (ver AUDIT-LOG.md)       |

---

## 13. ADR Log (Architecture Decision Records)

| #       | Data     | Decisão                                                                    | Status       |
| ------- | -------- | -------------------------------------------------------------------------- | ------------ |
| ADR-001 | Mar 2026 | Light mode como padrão, dark mode opt-in, system como terceira opção       | Aprovado     |
| ADR-002 | Mar 2026 | PostgreSQL como banco único (sem NoSQL)                                    | Aprovado     |
| ADR-003 | Mar 2026 | shadcn/ui (Radix + cva) + Recharts + Lucide React + Tailwind como UI stack | Aprovado     |
| ADR-004 | Mar 2026 | DM Sans/DM Mono como fonte                                                 | Aprovado     |
| ADR-005 | Mar 2026 | REST-first (não GraphQL)                                                   | Aprovado     |
| ADR-006 | Mar 2026 | Monorepo (não microservices)                                               | Aprovado     |
| ADR-007 | Mar 2026 | Single Next.js app com route groups (não múltiplos apps frontend)          | Aprovado     |
| ADR-008 | Mar 2026 | Framework: Next.js 15 (App Router)                                         | **Aprovado** |
| ADR-009 | Mar 2026 | ORM: Drizzle ORM                                                           | **Aprovado** |
| ADR-010 | Mar 2026 | Database hosting: Neon PostgreSQL Scale ($69/mês)                          | **Aprovado** |
| ADR-011 | Mar 2026 | State management: Zustand + React Server Components                        | **Aprovado** |
| ADR-012 | Mar 2026 | Background jobs: PostgreSQL queues + Vercel Cron (Redis eliminado)         | **Aprovado** |
| ADR-013 | Mar 2026 | Real-time: SSE (Server-Sent Events)                                        | **Aprovado** |
| ADR-014 | Mar 2026 | Multi-tenancy: Shared DB + tenant_id + RLS (B+A defesa em profundidade)    | **Aprovado** |

---

_Todas as decisões de ADR-001 a ADR-014 foram aprovadas e ratificadas._
