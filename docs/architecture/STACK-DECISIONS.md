# Decisoes de Stack Pendentes — Para Aprovacao

> **Para:** Marcus / Caio
> **Data:** Marco 2026
> **Contexto:** 6 decisoes tecnicas bloqueiam o inicio do codigo. Cada uma tem uma recomendacao com justificativa. Precisamos de OK para seguir.
> **Detalhes completos:** `docs/architecture/STACK.md` (secoes 2-6)

---

## Resumo Rapido

| # | Decisao | Recomendacao | Alternativa | Impacto |
|---|---------|-------------|-------------|---------|
| ADR-008 | Framework frontend | **Next.js 15** | SvelteKit | Todas as telas, API, deploy |
| ADR-009 | ORM / acesso ao banco | **Drizzle ORM** | Prisma | Todas as queries, migrations |
| ADR-010 | Hosting do banco | **Neon** | Supabase, Railway | Dev workflow, custos |
| ADR-011 | State management | **Zustand + RSC** | Jotai | Componentes interativos |
| ADR-012 | Background jobs | **BullMQ + Redis** | Trigger.dev | 19 jobs agendados |
| ADR-013 | Real-time | **SSE** | WebSocket | War Room, notificacoes |

---

## ADR-008: Framework → Next.js 15 (App Router)

**Por que:** RSC elimina JS desnecessario no client (performance). SSR para checkout (SEO). API Routes como backend. Ecossistema maduro, facil contratar devs. Deploy nativo Vercel.

**Por que nao SvelteKit:** ecossistema menor, HeroUI nao nativo, menos devs disponiveis no mercado.

**Custo de mudar depois:** Altissimo — reescrever tudo.

---

## ADR-009: ORM → Drizzle ORM

**Por que:** O Ambaril precisa de queries SQL complexas:
- `tsvector` para busca full-text
- Window functions para RFM scoring
- CTEs para DRE e calculadora de margem
- Aggregations para Dashboard

Drizzle permite escrever SQL complexo sem sair do ORM. Prisma obrigaria raw SQL separado para ~50% das queries.

**Numeros:** Drizzle ~35kb vs Prisma ~8MB.

**Custo de mudar depois:** Alto — reescrever todos os schemas e queries.

---

## ADR-010: DB Hosting → Neon (Serverless PostgreSQL)

**Por que:** Branching e a killer feature — cada dev/staging/prod tem seu proprio banco isolado. Scale-to-zero (nao paga quando ninguem usa). Autoscaling em picos (drops).

**Custo estimado:** ~$19-50/mes (Launch plan)

**Por que nao Supabase:** mais opinado, conflita com escolhas custom (auth propria, storage R2).
**Por que nao Railway:** sem branching, sem scale-to-zero.

**Custo de mudar depois:** Baixo — Postgres e Postgres. Migracao e simples.

---

## ADR-011: State Management → RSC + Zustand

**Por que:** React Server Components (RSC) carregam dados sem JS no client — base obrigatoria. Zustand (1.1kb) cuida do estado interativo (filtros, modais, formularios). API simples, curva zero.

**Por que nao Jotai:** overhead de aprendizado para equipe pequena.
**Por que nao Context:** re-renders desnecessarios, nao escala.

**Custo de mudar depois:** Baixo — state management e isolado por componente.

---

## ADR-012: Background Jobs → BullMQ + Redis

**Por que:** 19 jobs agendados no Ambaril (RFM scoring, NF-e, campanhas, reports do ClawdBot, etc.). BullMQ e maduro, tem prioridades, retry automatico, scheduling cron, e dashboard (Bull Board) para monitorar jobs.

**Trade-off:** Precisa de worker dedicado (Railway ~$5-20/mes), nao roda serverless.

**Por que nao Trigger.dev/Inngest:** vendor lock-in, pricing escala com volume.

**Custo de mudar depois:** Alto — todos os jobs precisam ser reescritos.

---

## ADR-013: Real-time → Server-Sent Events (SSE)

**Por que:** O unico caso de real-time e o Drop War Room, que e read-only (servidor → cliente). SSE e HTTP nativo, funciona no Vercel, sem infra extra.

**Se precisar de bidirecional no futuro:** migrar para WebSocket (Soketi/Pusher).

**Custo de mudar depois:** Baixo — SSE e WebSocket sao substituiveis.

---

## Custo Total Estimado da Stack

| Servico | Custo/mes |
|---------|-----------|
| Vercel (Pro) | $20-50 |
| Neon (Launch) | $19-50 |
| Upstash (Redis) | $10-30 |
| Railway (worker) | $5-20 |
| Cloudflare R2 | $5-15 |
| Resend | $20 |
| **Total** | **~$80-185/mes** |

vs. R$ 4.300+/mes em ferramentas substituidas (Kevi, Bling, Yever, TroqueCommerce, Monday).

---

## Como Aprovar

Para cada decisao, responder:
- [x] **Aprovado** (seguir recomendacao)
- [ ] **Alternativa** (especificar qual)
- [ ] **Preciso de mais info**

| ADR | Aprovado? |
|-----|-----------|
| 008 — Next.js 15 | [ ] |
| 009 — Drizzle ORM | [ ] |
| 010 — Neon | [ ] |
| 011 — Zustand + RSC | [ ] |
| 012 — BullMQ + Redis | [ ] |
| 013 — SSE | [ ] |
