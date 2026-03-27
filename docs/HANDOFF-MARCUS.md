# Handoff para Marcus — Phase 0 Complete

> Data: 2026-03-27
> Status: Phase 0 Foundation **COMPLETA** (exceto itens abaixo que dependem de voce)

---

## O que foi feito nesta sessao

| Step | Descricao | Status |
|------|-----------|--------|
| 1 | `pnpm install` + lock file regenerado (`@ambaril/*`) | OK |
| 2 | ADR-014 — Multi-tenancy Strategy (doc completo) | OK |
| 3 | HeroUI Provider + migracao de 4 componentes (Button, Badge, Input, Card) + login page | OK |
| 4 | 35 tabelas Drizzle — checkout (7), crm (12), erp (9), whatsapp (4), dashboard (3) | OK |
| 5 | Zod validators (14 schemas) + types (20+ tipos) + constants (6 modulos, 10 enums) | OK |
| 6 | Este documento de handoff | OK |

**Build status:** `pnpm build` compila sem erros.

---

## 3 acoes que dependem de voce

### M1: Criar projeto Neon (~3 min)

1. Acesse [console.neon.tech](https://console.neon.tech)
2. Crie uma conta (ou faca login com GitHub)
3. Clique **"New Project"**
4. Configure:
   - **Project name:** `ambaril-prod`
   - **Region:** `aws-sa-east-1` (Sao Paulo) — **IMPORTANTE** para latencia
   - **Postgres version:** 17 (mais recente)
   - **Plan:** Scale ($69/mês) — voce pode comecar no Free e fazer upgrade depois
5. Copie a **connection string** que aparece (formato: `postgresql://user:pass@ep-xxx.sa-east-1.aws.neon.tech/neondb?sslmode=require`)
6. Crie o arquivo `.env` na raiz do monorepo:

```bash
# No terminal, dentro de ambaril/
echo 'DATABASE_URL="postgresql://user:pass@ep-xxx.sa-east-1.aws.neon.tech/neondb?sslmode=require"' > .env
```

> **Substitua** a connection string pela sua. O `.env` ja esta no `.gitignore`.

7. **Opcional mas recomendado:** No painel Neon, va em Settings > Compute e desative "Scale to Zero" para o branch `main` (evita cold starts de ~5s).

---

### M2: Criar repositorio GitHub (~2 min)

1. Acesse [github.com/new](https://github.com/new)
2. Configure:
   - **Repository name:** `ambaril` (ou `ambaril-platform`)
   - **Visibility:** Private
   - **NÃO** inicialize com README, .gitignore, ou license (o repo ja tem tudo)
3. Depois de criar, copie a URL SSH/HTTPS
4. No terminal:

```bash
cd /Users/boromarl/Downloads/Ambaril/ambaril
git init
git add -A
git commit -m "feat: Phase 0 Foundation — monorepo scaffold, Drizzle schemas, HeroUI, shared package"
git branch -M main
git remote add origin git@github.com:SEU-USER/ambaril.git
git push -u origin main
```

> **Substitua** `SEU-USER/ambaril` pela URL real do seu repo.

---

### M3: Aprovar ADR-014 — Multi-tenancy Strategy (~5 min de leitura)

O documento esta em: **`docs/architecture/ADR-014-MULTI-TENANCY.md`**

**TL;DR da recomendacao:**

| Aspecto | Proposta |
|---------|----------|
| **Approach** | Shared DB + coluna `tenant_id` + filtro no app |
| **Custo** | $0 extra (sem schema/DB separado) |
| **Complexidade** | Media — helper `withTenant()` no Drizzle |
| **Tabelas afetadas** | ~90 de ~95 recebem `tenant_id` |
| **Tabelas globais** | `tenants`, `roles`, `permissions`, `users`, `user_tenants` (SEM tenant_id) |
| **Seguranca** | Middleware injeta `tenantId` na sessao, helper filtra automaticamente |

**Alternativas documentadas:**
- Option A: PostgreSQL RLS (Row-Level Security) — mais seguro, mais complexo
- Option C: Schema-per-tenant — isolamento total, caro pra manter
- Option D: DB-per-tenant — overkill pra nosso caso

**O que eu preciso de voce:**
- Leia o ADR (especialmente secao "Options" e "Recommendation")
- Responda: **"Aprovado Option B"** ou escolha outra option
- Se tiver duvidas, pergunte — posso explicar qualquer tradeoff

---

## Depois que voce fizer M1 + M2 + M3

Com o `DATABASE_URL` no `.env` e ADR-014 aprovado, eu posso:

1. Adicionar `tenant_id` a todos os schemas (baseado na decisao ADR-014)
2. Gerar migrations: `pnpm db:generate`
3. Rodar migrations: `pnpm db:migrate`
4. Seed inicial (roles, permissions, tenant CIENA, user admin Marcus)
5. Comecar **Phase 1: Creators CRUD** (prioridade #1)

**Tempo estimado do seu lado:** ~10 minutos total para M1 + M2 + M3.

---

## Resumo do estado do monorepo

```
ambaril/
├── apps/web/                  # Next.js 15 — HeroUI configurado, login page funcional
├── packages/db/               # Drizzle ORM — 55 tabelas em 7 schemas
│   └── src/schema/
│       ├── global.ts          # 8 tabelas (users, roles, permissions, sessions...)
│       ├── creators.ts        # 12 tabelas (creators, campaigns, coupons...)
│       ├── checkout.ts        # 7 tabelas (carts, orders, abandoned_carts...)
│       ├── crm.ts             # 12 tabelas (contacts, segments, automations...)
│       ├── erp.ts             # 9 tabelas (products, skus, inventory, nfe...)
│       ├── whatsapp.ts        # 4 tabelas (templates, messages, conversations...)
│       └── dashboard.ts       # 3 tabelas (dashboard_configs, widgets, war_room...)
├── packages/shared/           # Zod validators (21 schemas), types, constants
├── packages/ui/               # HeroUI wrappers (Button, Badge, Input, Card)
├── packages/email/            # Resend (scaffold)
└── docs/
    └── architecture/
        └── ADR-014-MULTI-TENANCY.md  # PRECISA DA SUA APROVACAO
```

**Build:** `pnpm build` — OK, zero erros.
