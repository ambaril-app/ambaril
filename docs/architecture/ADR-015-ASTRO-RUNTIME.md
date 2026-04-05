# ADR-015 — Runtime do Astro: Fork do Hermes Agent

> **Status:** APROVADO — Marcus aprovou Sessao 36
> **Data:** Abril 2026
> **Autor:** Claude (Sessao 36)
> **Aprovado por:** Marcus (04/04/2026)
> **Docs relacionados:** [astro.md](../modules/intelligence/astro.md), [STACK.md](./STACK.md), [INFRA.md](./INFRA.md)

---

## 1. O problema

O Astro precisa de um runtime para o Discord bot — o agente que interage com a equipe, envia reports, processa alertas e responde perguntas em linguagem natural.

A pergunta inicial era: construir custom (discord.js + tudo do zero) ou usar um framework open-source?

Identificamos dois projetos relevantes:

- **OpenClaw** (`github.com/openclaw/openclaw`) — a inspiração original do "clawdbot" (nome antigo do schema)
- **Hermes Agent** (`github.com/nousresearch/hermes-agent`) — evolução arquitetural do OpenClaw

Ambos são descritos como "single-user personal assistant", mas isso nao significa que nao podem ser usados no Ambaril. A pergunta certa eh: **podemos isolar 1 instancia por tenant (e 1 profile por collaborador)?** A resposta eh sim.

---

## 2. O que cada projeto oferece

### OpenClaw

- TypeScript nativo (mesma stack do monorepo)
- 22+ channel adapters (Discord, WhatsApp, Telegram, Slack, iMessage...)
- Plugin SDK de 319 arquivos
- MCP support
- Memoria: sqlite-vec + LanceDB (basica, sem estrutura)
- Deploy: Docker, systemd, Kubernetes-ready
- **Nao tem:** memory system estruturado, skills, cron, approval workflow, profiles, SOUL.md, REST API

OpenClaw eh um **message router com LLM** — o "corpo" sem o "cerebro".

### Hermes Agent

- Python 93% (stack diferente do monorepo — roda como microservice)
- **Sistema de Profiles**: isolamento completo por tenant numa maquina (config, .env, SOUL.md, memories, skills, DB separados por profile) — **multi-tenant ja construido**
- **SOUL.md**: personalidade customizavel por profile — exatamente o que especificamos
- **4 camadas de memoria**: MEMORY.md (fatos), USER.md (perfil), episodica FTS5 (historico), procedural/skills (procedimentos)
- **Skills**: criados automaticamente apos tarefas complexas (5+ tool calls); hub de skills community
- **Approval workflow**: smart/manual, allowlist permanente
- **Cron**: linguagem natural, executa como agent task (com acesso a memoria e skills)
- **REST API** OpenAI-compatible (`/v1/chat/completions`, `/v1/responses`)
- **MCP bidirecional**: client (usa tools externos) + server (expoe messaging para outros agentes)
- 13+ channel adapters (Discord, Telegram, Slack, WhatsApp, Signal, email)
- Webhooks com HMAC validation (GitHub, GitLab, Stripe, JIRA)
- Plugin system (drop Python files em `~/.hermes/plugins/`)
- `hermes claw migrate` — importa dados do OpenClaw (confirma que Hermes eh o successor)
- MIT license, 24k stars, 3.1k forks

---

## 3. As opcoes que consideramos

### Opcao A: Custom discord.js (spec original)

Construir tudo do zero no `apps/discord-bot`:

- Discord bot (discord.js)
- Workflow Engine
- Cron de reports
- Approval workflow
- SOUL.md system prompt

**Pros:** TypeScript nativo, controle total, no monorepo
**Cons:** 3-6 meses de desenvolvimento; reinventando funcionalidades que ja existem

### Opcao B: Fork OpenClaw

Forkar o OpenClaw e adicionar inteligencia (memoria, skills, cron, approval) em cima.

**Pros:** TypeScript, 22+ channel adapters prontos
**Cons:** OpenClaw nao tem o "cerebro" — teriamos que construir toda a camada de inteligencia em cima, o que equivale quase a construir do zero. Ganharíamos os adapters mas nao muito mais.

### Opcao C: Fork Hermes (recomendado)

Forkar o Hermes como base do Astro runtime.

**Pros:**

- Profiles = multi-tenant ja construido
- SOUL.md = personalidade ja funciona
- Memory 4 camadas = Genius sync
- Skills = Workflow Engine ja existe
- Cron = report scheduling ja existe
- Approval workflow = human-in-the-loop ja existe
- REST API = integracao trivial com Next.js
- MCP bidirecional = Ambaril expoe modules como tools
- 2-3 semanas para MVP vs 3-6 meses custom

**Cons:**

- Python (stack diferente) — mas roda como microservice externo, como Redis ou Elasticsearch

---

## 4. Decisao: Fork Hermes

**Hermes ganha em 11 de 14 criterios de comparacao.**

A unica desvantagem e o Python. Mas isso nao eh bloqueante — Hermes roda como servico externo com REST API OpenAI-compatible. Eh o mesmo padrao de usar Redis, Elasticsearch, ou qualquer outro servico que nao eh TypeScript.

```
Ambaril SaaS (Next.js/Vercel)
     ↕ REST API / MCP
Astro Agent (Hermes fork, VPS por tenant)
     ↕ Discord / WhatsApp / Telegram / Slack
Time (CIENA + futuros tenants)
```

O framework Ambaril cuida dos dados de negocio (11 modulos, Neon, Drizzle).
O Hermes fork cuida da inteligencia conversacional (memoria, skills, cron, canal delivery).

---

## 5. Modelo de isolamento: Profile por collaborador

A visao do Marcus de "cada collaborador ter seu agente individual" eh exatamente o que o sistema de Profiles do Hermes suporta. Cada membro da equipe ganha um profile com:

- `SOUL.md` personalizado ao role (Tavares = PLM/producao, Ana Clara = logistica/mobile, etc.)
- `MEMORY.md` com fatos relevantes ao trabalho
- Skills especializadas ao role
- Canal preferido (Discord DM, WhatsApp, etc.)
- Acesso aos dados do tenant via MCP tools

```
VPS do Tenant CIENA (Hetzner CX22, ~$4/mes)
├── Profile: marcus   → SOUL.md: executivo, decisoes, overview
├── Profile: tavares  → SOUL.md: PLM, producao, gargalos
├── Profile: ana-clara → SOUL.md: logistica, mobile-first, expedicao
├── Profile: guilherme → SOUL.md: B2B, atacado, pipeline
├── Profile: pedro    → SOUL.md: financeiro, DRE, conciliacao
├── Profile: slimgust → SOUL.md: atendimento, WA, email
├── Profile: caio     → SOUL.md: marketing, estrategia, CRM
├── Profile: yuri     → SOUL.md: criativo, conteudo, DAM
└── Profile: sick     → SOUL.md: design, ads, UI/UX
```

Cada profile eh completamente isolado: config, .env (tokens), memories, skills, state DB.

---

## 6. Integracao Ambaril ↔ Hermes

### Camada 1: REST API (MVP)

```typescript
// Ambaril chat web usa a REST API do Hermes
const response = await fetch(`https://astro-${tenantId}.ambaril.com/v1/chat/completions`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${profileToken}` },
  body: JSON.stringify({ messages: [...], stream: true })
})
```

### Camada 2: MCP (dados de negocio)

Hermes conecta ao MCP Server do Ambaril. Cada modulo expoe suas queries como tools:

```
Hermes (MCP Client)
  → query_orders(period, status)
  → check_inventory(sku_code)
  → get_plm_status(order_id)
  → get_crm_segment(contact_id)
  → ...
```

O agente usa esses tools automaticamente quando o usuario pergunta sobre dados de negocio.
Mais seguro que SQL direto — o Ambaril valida permissoes por tenant antes de retornar dados.

### Camada 3: Genius sync

```
Genius (Neon, entries verified)
  → cron job periodico → MEMORY.md do profile do tenant
```

Genius eh a fonte de verdade para conhecimento de negocio.
Hermes faz sync dos entries verified para sua MEMORY.md, usada como contexto frozen.

### Camada 4: Webhooks (eventos de negocio)

```
Ambaril (Flare events: stock.critical, sales.spike, etc.)
  → POST astro-{tenantId}.ambaril.com/webhooks/ambaril-events
  → Hermes formata alerta e envia ao canal correto (Discord #alertas, WA, etc.)
```

---

## 7. Custo por tenant

| Item                          | Custo/mes       | Nota                         |
| ----------------------------- | --------------- | ---------------------------- |
| VPS Hetzner CX22 (2vCPU, 4GB) | ~$4             | Roda 5-10 profiles           |
| LLM API (Haiku para reports)  | $5-15           | Depende do volume            |
| LLM API (Sonnet para chat)    | $10-30          | Depende do volume            |
| Neon (shared pelo Ambaril)    | $0              | Ja incluso                   |
| **Total**                     | **~$19-49/mes** | Incluivel no plano do tenant |

---

## 8. Repositorio

O fork do Hermes vai ser mantido em repositorio separado do monorepo Ambaril:

```
github.com/ambaril/astro-agent   ← fork de nousresearch/hermes-agent
```

A conexao com o monorepo eh exclusivamente via REST API e MCP — o agente nao precisa estar dentro do `apps/` do Turborepo.

O `apps/discord-bot` referenciado no CLAUDE.md e STACK.md sera substituido por uma referencia ao `astro-agent` externo. O monorepo cuida apenas do **MCP Server** que expoe os modulos Ambaril como tools.

---

## 9. O que muda na implementacao

| Antes (spec original)                  | Depois (ADR-015)                           |
| -------------------------------------- | ------------------------------------------ |
| `apps/discord-bot` custom (discord.js) | `ambaril/astro-agent` (Hermes fork)        |
| Workflow Engine (a construir)          | Hermes Skills (ja existe)                  |
| Cron reports custom                    | Hermes Cron (linguagem natural, ja existe) |
| SOUL.md (especificado, a implementar)  | SOUL.md (ja funciona no Hermes)            |
| Human-in-the-loop (a construir)        | Hermes Approval Workflow (ja existe)       |
| LLM routing Haiku/Sonnet               | Hermes multi-provider routing (ja existe)  |
| astro_readonly SQL role                | MCP tools do Ambaril (mais seguro)         |
| Agente unico por tenant                | Profile por collaborador (mais granular)   |

---

## 10. O que NAO muda

- Genius continua como KB de negocio estruturado (Neon PostgreSQL, entries/linting/verification)
- Todas as user stories do astro.md continuam validas
- Todos os data models do astro.md continuam validos
- Business rules continuam validos
- Multi-tenant SaaS (Next.js + Neon + Vercel) continua
- 11 modulos de negocio continuam
- Ordem de implementacao continua (Astro eh o ultimo, Sprint 12-13)
