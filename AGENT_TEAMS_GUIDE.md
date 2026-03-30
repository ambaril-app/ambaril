# Agent Teams — Guia de Execução Autônoma

> **Versão:** 2.0 — Março 2026
> **Escopo:** Team lead + teammates. Cobre execução autônoma overnight.
> **Estrutura:** Parte 1 (genérica, todas as fases) + Parte 2 (específica da fase atual)

---

# PARTE 1 — Regras Gerais (todas as fases)

---

## 1. Estrutura de trabalho em Waves

Cada fase do IMPLEMENTATION.md é dividida em **Waves** — grupos de tarefas com dependências explícitas.

```
Wave N:   [tarefas independentes que podem rodar em paralelo]
Wave N+1: [tarefas que dependem de Wave N estar 100% concluída]
```

### Regras

- Não avance para a próxima Wave até que TODAS as tarefas da Wave atual estejam concluídas E revisadas
- Ao final de cada Wave, faça shutdown dos teammates atuais e spawne novos com contexto limpo
- Passe para os novos teammates apenas um resumo conciso (2-3 frases) do que foi feito
- O mapeamento de Waves para cada fase está na Parte 2 deste documento

---

## 2. Dimensionamento do time

- Use **3 a 5 teammates** por Wave. Mais que isso aumenta overhead sem ganho
- Planeje **3 a 5 tarefas por teammate** — protege o contexto
- **Max 3-4 páginas/componentes por agente frontend** — evita saturação
- Prefira menos teammates focados a muitos dispersos

---

## 3. Definição de tarefas

Cada tarefa deve ser:

- **Autocontida**: completável sem depender de tarefa em andamento
- **Sem conflito de arquivos**: dois teammates NUNCA editam o mesmo arquivo
- **Com critério de conclusão claro**: descreva exatamente o que é "pronto"
- **Com escopo limitado**: se parece grande, quebre em subtarefas

### Template obrigatório

```
Tarefa: [título imperativo]
Arquivos PERMITIDOS: [lista de arquivos que este teammate pode tocar]
Arquivos PROIBIDOS: [arquivos que NÃO pode modificar]
Dependências: [tarefas que precisam estar prontas antes]
Critério de conclusão: [o que precisa ser verdade para marcar done]
```

---

## 4. Ownership de arquivos — Regra de ouro

### Um arquivo, um dono

- Ao criar tarefas, liste explicitamente quais arquivos cada teammate pode modificar
- Se duas tarefas precisam do mesmo arquivo, serialize-as (uma bloqueia a outra)
- Para arquivos compartilhados (routes, index, validators), designar um ÚNICO teammate responsável
- **Database schema (`packages/db/schema/`) é READ-ONLY** — nenhum agente modifica schema/migrations. Se encontrar bug, documente em ISSUES.md

### Se ocorrer conflito

1. Pare os dois teammates envolvidos
2. Identifique qual versão está correta
3. Restaure o arquivo correto
4. Reassigne as tarefas com escopos mais claros

### Ownership de validações (Zod)

Todos os Zod schemas de um módulo vivem em UM ÚNICO arquivo:
```
packages/shared/src/schemas/{module}.ts
```
Um único teammate é dono deste arquivo. Outros importam dele.

---

## 5. Verificação cruzada obrigatória

Após cada tarefa concluída:

1. O autor marca a tarefa como concluída
2. O lead designa OUTRO teammate para revisar
3. O reviewer deve:
   - Ler o código produzido
   - Rodar `pnpm vitest run` nos testes relevantes
   - Rodar `pnpm type-check` (TypeScript sem erros)
   - Verificar se o critério de conclusão foi atendido
   - Verificar compliance com DS.md (cores, fontes, ícones — ver seção 8)
   - Aprovar ou rejeitar com feedback específico
4. Se rejeitada, o autor corrige e submete novamente
5. Só após aprovação a tarefa é considerada realmente concluída

**Nunca permita que o autor da tarefa seja o próprio reviewer.**

---

## 6. Gestão de contexto

### Para o team lead

- Seja conciso nas mensagens — envie apenas o necessário
- Não repita informações que já estão no CLAUDE.md ou nos arquivos do projeto
- Use a task list como fonte de verdade, não mensagens
- Resista a fazer o trabalho você mesmo — SEMPRE delegue para teammates
- Referencie docs por path, não copie conteúdo nas mensagens

### Para teammates

- Após concluir uma tarefa, reporte o resultado de forma concisa ao lead
- Não inclua dumps de código inteiro nas mensagens — referencie `arquivo:linha`
- Foque na tarefa atribuída — não explore além do escopo
- Leia os arquivos de código existente ANTES de criar código novo (ver seção 10)

### Reciclagem entre Waves

```
Fim da Wave N:
1. Verificar que todas as tarefas estão concluídas e revisadas
2. Fazer shutdown de todos os teammates
3. Spawnar novos teammates para Wave N+1
4. Briefing conciso: "Wave N concluída. [resumo 2-3 frases]. Wave N+1: [objetivos]."
```

---

## 7. Tratamento de erros

### Para o lead

- Se um teammate travar em um erro por mais de 2 tentativas, intervenha:
  - Envie contexto adicional
  - Reatribua a tarefa a outro teammate
  - Ou quebre a tarefa em partes menores
- Se testes falharem após uma Wave, NÃO avance — corrija primeiro

### Para teammates

- Se encontrar um erro que não resolve em 2 tentativas, reporte ao lead com:
  - O que tentou
  - O erro exato
  - Sua hipótese sobre a causa
- Não fique em loop tentando a mesma abordagem repetidamente

---

## 8. Design System — Compliance obrigatória

**Todo agente que toca frontend DEVE seguir `DS.md` (Design System Moonstone).**

### Briefing obrigatório para agentes frontend

Antes de iniciar, leia `DS.md` completamente. Regras invioláveis:

| Regra | Correto | Errado |
|-------|---------|--------|
| Cores | Usar tokens CSS: `text-text-primary`, `bg-bg-void` | Hex hardcoded: `#D0D4DE`, `#07080B` |
| Fontes | DM Sans (300-700), DM Mono para números/IDs | Qualquer outra família |
| Ícones | `lucide-react` APENAS | Phosphor, Heroicons, Font Awesome |
| Components | shadcn/ui (Radix + cva) como base | HeroUI, MUI, Chakra UI |
| Charts | Recharts | Tremor, Chart.js, D3 |
| File naming | `kebab-case.tsx` | `PascalCase.tsx`, `camelCase.tsx` |
| Exports | Named exports | `export default` |
| Letter-spacing | H1: -0.01em, Labels: +0.04em uppercase | Default spacing |
| Border radius | Cards: 12px, Inputs: 8px, Badges: 5-6px | Inconsistente |

### Onde o brilho vive (e onde NÃO vive)

- **SIM:** KPI cards (gradiente sutil), hover em cards (shadow), charts (gradiente de área)
- **NÃO:** Texto (nunca glow), ícones (opacity, não glow), backgrounds de página (sempre flat)

### Tokens CSS obrigatórios

```css
/* Backgrounds: --bg-void, --bg-base, --bg-raised, --bg-surface, --bg-elevated */
/* Borders: --border-subtle, --border-default, --border-strong */
/* Text: --text-ghost, --text-muted, --text-secondary, --text-tertiary, --text-primary, --text-bright, --text-white */
/* Semantic: --success, --warning, --danger, --info */
```

---

## 9. Auth e Multi-Tenancy — Padrão obrigatório

**Todo agente que escreve server actions ou páginas protegidas DEVE seguir este padrão.**

### Server Action — Template

```typescript
"use server";

import { getTenantSession } from "@/lib/tenant";
import { withTenantContext } from "@/lib/tenant";
import { db } from "@ambaril/db";
import { eq } from "drizzle-orm";

export async function myAction(input: unknown) {
  // 1. SEMPRE começar com session
  const session = await getTenantSession();
  // getTenantSession() já redireciona para /login se não autenticado

  // 2. Validar input com Zod
  const parsed = mySchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos." };
  }

  // 3. Verificar permissão (se necessário além do role)
  if (!session.permissions.includes("creators:write") && session.role !== "admin") {
    return { error: "Sem permissão." };
  }

  // 4. Usar withTenantContext para queries com RLS
  const result = await withTenantContext(session.tenantId, async (tx) => {
    return tx.select().from(myTable).where(eq(myTable.tenantId, session.tenantId));
  });

  return { data: result };
}
```

### Página protegida — Template

```typescript
import { getTenantSession } from "@/lib/tenant";

export default async function MyPage() {
  const session = await getTenantSession();

  // Session já tem: userId, role, permissions, name, email, tenantId, tenantSlug

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-medium text-text-bright">Título</h1>
      {/* conteúdo */}
    </div>
  );
}
```

### Regras de auth

- `getTenantSession()` redireciona para `/login` automaticamente se não autenticado
- Admin (`role === "admin"`) tem permissão wildcard `["*"]`
- Verificar `session.permissions.includes("resource:action")` para outros roles
- SEMPRE incluir `tenantId` em queries (RLS é defesa em profundidade, mas seja explícito)

---

## 10. Prevenção de alucinação

### Antes de criar código novo

1. **Ler código existente** no diretório relevante
2. **Copiar padrões** dos arquivos existentes — não inventar novo padrão
3. **Verificar CLAUDE.md** para regras absolutas

### Padrões existentes no codebase (COPIAR, não reinventar)

| O que | Arquivo de referência | Padrão |
|-------|----------------------|--------|
| Server Action | `apps/web/src/app/(auth)/login/actions.ts` | `"use server"`, Zod validation, db query, redirect |
| Página admin | `apps/web/src/app/(admin)/admin/creators/page.tsx` | `getTenantSession()`, layout com `space-y-6` |
| Layout admin | `apps/web/src/app/(admin)/layout.tsx` | Sidebar + Topbar + session check |
| UI Component | `packages/ui/src/components/button.tsx` | Radix + cva wrapper, named export, `cn()` utility |
| Middleware | `apps/web/src/middleware.ts` | Cookie check, public routes |

### O que é PROIBIDO

| Proibido | Correto |
|----------|---------|
| Criar API routes para CRUD interno | Usar Server Actions |
| `export default function` em componentes UI | `export { MyComponent }` named export |
| Cores hex hardcoded em JSX/CSS | Tokens Tailwind: `text-text-primary`, `bg-bg-void` |
| Outra lib de ícones | `lucide-react` apenas |
| Raw SQL em server actions | Drizzle ORM typed queries |
| `any` em TypeScript | `unknown` + type narrowing |
| Arquivos PascalCase | `kebab-case.tsx` |
| Float para dinheiro | `NUMERIC(12,2)` (Drizzle: `numeric`) |
| Texto em inglês na interface | PT-BR sempre (labels, botões, mensagens) |
| Código/variáveis em PT-BR | Inglês sempre (funções, tabelas, colunas, rotas) |

---

## 11. Captura de decisões — ISSUES.md

Quando um agente encontra uma decisão que precisa de humano, deve **parar e documentar** no arquivo `ISSUES.md` na raiz do monorepo.

### Quando parar e documentar

- Thresholds de negócio (ex: mínimo de seguidores para auto-aprovação)
- Regras financeiras (ex: payout mínimo, teto de comissão)
- UX decisions além do DS.md (ex: ordem de colunas, filtros default)
- Mudanças de schema (novas tabelas ou colunas)
- Integrações com APIs externas sem spec clara

### Template de entrada em ISSUES.md

```markdown
## [PENDENTE] Título curto da decisão

**Contexto:** [O que o agente estava fazendo quando encontrou a dúvida]
**Pergunta:** [A decisão que precisa ser tomada]
**Opções:**
1. [Opção A — com prós/contras]
2. [Opção B — com prós/contras]
**Afeta:** [Quais tarefas/arquivos são bloqueados por esta decisão]
**Agente:** [Nome do agente que registrou]
```

### Regra de ouro

**Prefira não fazer nada a fazer algo errado quando sem supervisão humana.**

---

## 12. Testes — Requisitos por Wave

### Antes de marcar tarefa como concluída

```bash
# 1. TypeScript sem erros
pnpm type-check

# 2. Testes unitários/integração passando
pnpm vitest run

# 3. Sem TODOs ou console.logs abandonados
# (agente deve verificar nos arquivos que tocou)
```

### Testes mínimos por tipo de código

| Tipo | Teste obrigatório |
|------|------------------|
| Server Action (CRUD) | Vitest: input válido retorna data, input inválido retorna error, sem auth retorna redirect |
| Business logic (cálculo) | Vitest: edge cases, valores limites, tipos de tier |
| Página admin/portal | TypeScript compila, componente renderiza sem crash |
| Integração API externa | Vitest: chamada real à API com credentials do .env |
| UI Component | TypeScript compila, props tipadas |

---

## 13. Security Verification — Obrigatória

**Checklist completo:** `SECURITY-CHECKLIST.md` (60 checks, 10 domínios)

### Checks P1 — Obrigatórios em TODA Wave

Todo server action DEVE seguir este fluxo de segurança:

```
1. getTenantSession()         → autentica e obtém tenant
2. schema.safeParse(input)    → valida entrada com Zod
3. permissions.includes(...)  → verifica permissão
4. withTenantContext(...)      → garante RLS ativo
5. return { data } ou { error } → envelope padrão
```

### Verificações de segurança por tipo de código

| Tipo | Checks obrigatórios |
|------|--------------------|
| Server Action | Auth (A01-A05), Tenant (T01-T04), Validation (V01, V08) |
| File Upload | F01-F06 (whitelist, tamanho, presigned URL, UUID filename) |
| Página com dados pessoais | L01 (dados pessoais em crm.personal_data), M03 (mascarar CPF/PIX em logs) |
| Integração API externa | S01 (sem keys hardcoded), S04 (sem NEXT_PUBLIC_ para secrets) |

### Regra de ouro de segurança

- **Dados pessoais** (CPF, PIX, endereço) → SEMPRE em `crm.personal_data`, NUNCA na tabela principal
- **Env vars** → NUNCA no código, NUNCA com NEXT_PUBLIC_ se sensível
- **File uploads** → SEMPRE presigned URL direto ao R2, NUNCA via server
- **Passwords** → SEMPRE Argon2id, NUNCA bcrypt/SHA

---

## 14. Definition of Done — Por tipo de tarefa

### UI Component
- [ ] Renderiza sem erro
- [ ] Props tipadas com TypeScript strict
- [ ] DS.md compliant (tokens, fontes, ícones)
- [ ] Named export (não `export default`)
- [ ] Arquivo kebab-case.tsx
- [ ] Exportado via `packages/ui/src/index.ts`

### Server Action
- [ ] `"use server"` no topo
- [ ] Zod validation com `safeParse()`
- [ ] `getTenantSession()` chamado
- [ ] Permission check (resource:action)
- [ ] `withTenantContext()` para queries
- [ ] Return `{ data }` ou `{ error }` (envelope)
- [ ] Pelo menos 1 teste Vitest
- [ ] Sem `any`, sem float para money

### Page (Admin ou Portal)
- [ ] SSR correto (server component por padrão)
- [ ] Loading state (Skeleton ou Suspense)
- [ ] Error boundary
- [ ] Mobile-responsive (especialmente para Ana Clara)
- [ ] Labels e mensagens em PT-BR
- [ ] Cores via tokens Tailwind (não hex)
- [ ] `getTenantSession()` para páginas protegidas

### Integração API Externa
- [ ] Credenciais lidas de `process.env`
- [ ] Sem secrets hardcoded
- [ ] Error handling com retry (max 3 tentativas)
- [ ] Timeouts configurados
- [ ] Resposta validada com Zod

---

## 15. Pilares Enterprise — Mentalidade de implementação

> Ambaril é SaaS B2B para empresas multimilionárias. Todo código deve refletir qualidade enterprise, mesmo que a infraestrutura comece lean.

Todo agente DEVE considerar estes 10 pilares ao implementar qualquer feature:

| # | Pilar | O que significa para agentes | Referência |
|---|-------|------------------------------|-----------|
| 1 | **UI/UX & Design System** | Seguir DS.md (Moonstone) rigorosamente. shadcn/ui (Radix + cva), DM Sans, lucide-react, tokens CSS. Desktop-first (Ana Clara usa exclusivamente mobile) | `DS.md` |
| 2 | **Security** | SECURITY-CHECKLIST.md (60 checks). P1 obrigatório toda Wave. `getTenantSession` + Zod + `withTenantContext` + presigned uploads | `SECURITY-CHECKLIST.md` |
| 3 | **Performance** | RSC por padrão, lazy loading, skeleton states, pagination (max 100 items), no unnecessary client JS. Recharts com gradiente 3-stop | ADR-008, `DS.md` |
| 4 | **Reliability & Observability** | Error boundaries em toda page, audit log para ops sensíveis, structured logging, Sentry integration | `SECURITY-CHECKLIST.md` M01-M06 |
| 5 | **Multi-tenancy & Isolation** | RLS em todas tabelas, `withTenantContext` em toda query, nunca expor `tenant_id` ao client, testar com 2 tenants | ADR-014, `SECURITY-CHECKLIST.md` T01-T09 |
| 6 | **Auth & Authorization** | `getTenantSession`, permission checks `resource:action`, brute force protection, session invalidation, cookie security | `AUTH.md` |
| 7 | **Testing & Quality** | Vitest para cada server action, type-check zero erros, no `any`, strict mode, peer review na Wave 5 | Seção 12 deste guia |
| 8 | **DevOps / CI/CD** | Git workflow, Vercel auto-deploy, Neon branching, `.env` management, pnpm lockfile commitado | `INFRA.md`, `GIT-WORKFLOW.md` |
| 9 | **Compliance & Auditability** | LGPD (`crm.personal_data`), audit log, consent tracking, data export, mascaramento de PII | `SECURITY-CHECKLIST.md` L01-L07 |
| 10 | **Maintainability & Architecture** | CLAUDE.md rules, kebab-case, named exports, Drizzle typed queries, API envelope `{ data, meta, errors }`, glossário PT↔EN | `CLAUDE.md` |

### Checklist rápido antes de cada PR

- [ ] Pilar 1: Segue DS.md? Mobile responsive?
- [ ] Pilar 2: Security checklist P1 atendido?
- [ ] Pilar 3: RSC usado? Sem client JS desnecessário?
- [ ] Pilar 5: RLS + withTenantContext em toda query?
- [ ] Pilar 6: getTenantSession + permission check?
- [ ] Pilar 7: Testes escritos? Type-check limpo?
- [ ] Pilar 10: CLAUDE.md rules seguidas?

---

## 16. OWASP Agentic — Best Practices para Agent Teams

> Ambaril não é uma plataforma de AI agents, mas **usamos agent teams** para construir 100% do software. Estas best practices governam como orquestramos os agentes.

### OWASP Agentic Skills Top 10 — Aplicação ao nosso workflow

| Risk | Aplicação |
|------|-----------|
| **AST01: Malicious Skills** | Não instalar skills de fontes desconhecidas. Apenas Vercel Labs + OWASP verificados |
| **AST02: Supply Chain** | `pnpm audit`, lockfile commitado, dependências pinadas — nunca `*` ou `latest` |
| **AST03: Over-Privileged** | Agentes têm file ownership explícito (seção 4). Schema é READ-ONLY. Lead não implementa |
| **AST06: Weak Isolation** | Um arquivo, um dono. Sem conflito de arquivos entre teammates |
| **AST09: No Governance** | AGENT_TEAMS_GUIDE.md é o governance doc. Quality gates por Wave |

### OWASP Top 10 for Agentic Applications — Aplicação futura (Phase 15)

| Risk | Quando implementar |
|------|-------------------|
| Prompt Injection | Phase 15: sanitizar inputs antes de enviar ao Claude API |
| Sensitive Data Disclosure | Phase 15: mascarar PII (CPF, PIX) antes de enviar ao Claude API |
| Missing Guardrails | Phase 15: system prompts com regras rígidas |
| Resource Exhaustion | Phase 15: rate limiting em chamadas Claude API por tenant |

### Referências

- OWASP Agentic Skills Top 10: https://owasp.org/www-project-agentic-skills-top-10/
- OWASP Top 10 for Agentic Applications: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/

---

## 17. Integrações externas — Provider Abstraction

**Toda integração DEVE ser feita com APIs reais.** Sem dados fake, sem mocks.

### Regra fundamental: Capabilities, não Providers

Módulos consomem **capabilities** (interfaces abstratas), nunca providers específicos.
Tenant escolhe providers no catálogo de integrações (`/admin/settings/integrations`).

```
ERRADO (hardcoded):
  import { listDiscountCodes } from '@/lib/shopify'
  const coupons = await listDiscountCodes()

CERTO (capability):
  import { getEcommerceProvider } from '@ambaril/shared/integrations/registry'
  const ecommerce = await getEcommerceProvider(tenantId)
  const coupons = await ecommerce.listCoupons()
```

### Provider Layer

```
packages/shared/src/integrations/
  types.ts          — Capability interfaces (EcommerceProvider, CheckoutProvider, SocialProvider, etc.)
  registry.ts       — Resolve tenantId → active provider instance at runtime
  providers/
    shopify.ts      — implements EcommerceProvider
    yever.ts        — implements CheckoutProvider
    instagram.ts    — implements SocialProvider
    ...
```

### Regras

- Env vars de **infraestrutura** (R2, Sentry, Resend platform key) são pré-requisito — agentes NÃO iniciam sem `.env` completo
- Env vars de **tenant** (Shopify token, Yever API key) são armazenadas em `global.tenant_integrations` (encrypted), NÃO em `.env`
- Se uma env var de infra está ausente, o agente PARA e documenta em ISSUES.md
- **Nunca** importar provider diretamente em código de módulo — sempre via `getXxxProvider(tenantId)`
- Em testes, usar a API real (staging/sandbox quando disponível)
- Adicionar novo provider = implementar interface + registrar no catálogo. Zero mudanças no código dos módulos

---

## 18. Comunicação

### Quando enviar mensagem

- Tarefa concluída (resumo em 1-3 frases)
- Bloqueio encontrado (com contexto)
- Descoberta que afeta outras tarefas
- Decisão documentada em ISSUES.md

### Quando NÃO enviar mensagem

- Progresso parcial sem valor informativo
- Dúvidas que podem ser respondidas lendo o código
- Status que já está visível na task list

### Formato

- Mensagens curtas e diretas
- Resultados em 1-3 frases
- Use `summary` descritivo na preview da mensagem

---

## 19. Modo autônomo (sem supervisão)

### Pré-requisitos

- Todas as tarefas definidas com critérios de conclusão objetivos
- `.env` completo com todas as API keys necessárias
- `--dangerously-skip-permissions` ativado
- Sessão dentro de `tmux` para persistência
- `pnpm dev` roda sem erros
- Login funcional, admin layout renderiza

### Comportamento do lead

- Siga o plano de Waves estritamente — não improvise
- Se algo inesperado acontecer, documente em ISSUES.md e PARE
- Prefira não fazer nada a fazer algo errado

### Quality Gate entre Waves (TODAS devem passar)

```
=== CODE QUALITY ===
[ ] Todas as tarefas da Wave concluídas
[ ] Todas as tarefas revisadas por outro teammate (reviewer ≠ author)
[ ] pnpm type-check — ZERO erros TypeScript
[ ] pnpm vitest run — todos os testes passam
[ ] Sem TODO/FIXME/HACK nos arquivos tocados
[ ] Sem console.log abandonados (exceto error logging)

=== DESIGN SYSTEM (DS.md) ===
[ ] Cores usam tokens CSS (não hex hardcoded)
[ ] Fontes: DM Sans/Mono corretas
[ ] Ícones: lucide-react apenas
[ ] Componentes: shadcn/ui base
[ ] Charts: Recharts com gradiente 3-stop

=== SECURITY (SECURITY-CHECKLIST.md) ===
[ ] getTenantSession() em todo server action
[ ] Zod safeParse() em toda entrada
[ ] withTenantContext() em toda query
[ ] tenantId explícito em toda query ao banco
[ ] Nenhuma API key/secret hardcoded
[ ] Nenhum arquivo .env ou secret commitado
[ ] File uploads via presigned URL (não via server)
[ ] Dados pessoais em crm.personal_data (não na tabela principal)

=== DEFINITION OF DONE (seção 14) ===
[ ] Cada UI Component atende DoD de UI Component
[ ] Cada Server Action atende DoD de Server Action
[ ] Cada Page atende DoD de Page

=== INTEGRATION ABSTRACTION ===
[ ] Nenhum import direto de provider em código de módulo (use registry)
[ ] Todas as chamadas externas via capability interface (EcommerceProvider, CheckoutProvider, etc.)
[ ] Credentials de tenant lidas de DB (tenant_integrations), não de process.env
[ ] Novo provider? Implementou interface + registrou no catálogo + zero mudanças em módulos

=== HOUSEKEEPING ===
[ ] .env.example atualizado se novas vars adicionadas
[ ] Git: changes commitados com mensagens claras
[ ] ISSUES.md: decisões pendentes documentadas (não assumidas)
[ ] Shutdown de todos os teammates
[ ] Resumo da Wave documentado
[ ] Novos teammates spawnados para próxima Wave
```

---

## 20. Anti-patterns — O que NÃO fazer

| Anti-pattern | Por que é ruim | O que fazer |
|---|---|---|
| Lead executando tarefas | Consome contexto do orquestrador | Sempre delegue |
| Broadcast para tudo | Caro e polui contexto | Mensagem direta |
| Tarefas vagas ("melhorar o código") | Não sabem quando parar | Critérios objetivos |
| Muitos teammates (>5) | Overhead de coordenação | Use 3-5 por Wave |
| Mesmo arquivo, múltiplos donos | Sobrescrita | Um arquivo = um dono |
| Ignorar falhas de teste | Acumula entre Waves | Corrija antes de avançar |
| Mensagens longas | Desperdiça contexto | Referencie `arquivo:linha` |
| Pular revisão cruzada | Bugs despercebidos | Revise antes de avançar |
| Inventar padrão novo | Inconsistência com codebase | Copiar padrão existente |
| Hex hardcoded em UI | Viola DS.md | Usar tokens Tailwind |
| Modificar DB schema | Conflito de migrations | Schema é read-only |
| Assumir decisão de negócio | Pode estar errado | Documentar em ISSUES.md |
| Criar dados fake/mock | Não é o padrão do projeto | Integração real |
| Import direto de provider (`import { x } from '@/lib/shopify'`) | Acopla módulo a vendor específico | Usar capability via registry (`getEcommerceProvider(tenantId)`) |
| API keys de tenant em `.env` | Não escala multi-tenant | Credentials em `global.tenant_integrations` (encrypted) |
| Todas as features visíveis desde o dia 1 | Sobrecarrega PM/user, maioria vazia | Progressive disclosure: mostrar conforme dados existem |

---

# PARTE 2 — Phase 1: Creators

> Spec completa: `docs/modules/growth/creators.md` (2.279 linhas)
> Prioridade #1 (Marcus: "vai nos ajudar a faturar mais")
> Design System: `DS.md` (Moonstone)
> Database: `docs/architecture/DATABASE.md` + `packages/db/schema/creators.ts`
> Auth: `docs/architecture/AUTH.md`
> API: `docs/architecture/API.md`
> Glossário: `docs/dev/GLOSSARY.md`

---

## P2.1. Pré-requisitos (antes de spawnar agentes)

### Env vars obrigatórias no .env

```env
# Database (Neon) — JÁ CONFIGURADO
DATABASE_URL="postgresql://..."

# Cloudflare R2 (upload de fotos de creators)
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET_NAME=ambaril-assets
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# Resend (email de confirmação de cadastro)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@ciena.com.br

# Shopify Admin API (sync de cupons)
# Desde Jan 2026: OAuth Client Credentials (token 24h, sem shpat_ permanente)
SHOPIFY_STORE_URL=ciena-lab.myshopify.com
SHOPIFY_CLIENT_ID=xxxxx
SHOPIFY_CLIENT_SECRET=shpss_xxxxx

# Yever API (atribuição de vendas por cupom)
YEVER_API_URL=https://api.yever.com.br/v1
YEVER_API_KEY=xxxxx
```

### Verificações

```bash
pnpm dev            # Roda sem erros
# Testar login em http://localhost:3000/login
# Confirmar que admin layout renderiza
pnpm type-check     # Zero erros
```

---

## P2.2. Waves — Phase 1 Creators

### Wave 1: Fundação (paralelo, sem dependências)

**Objetivo:** UI components base + Zod schemas

| Agent | Tarefas | Arquivos PERMITIDOS |
|-------|---------|---------------------|
| **ui-components** | DataTable (sort, filter, pagination, bulk), Modal/Dialog, Sheet, Tabs | `packages/ui/src/components/data-table.tsx`, `modal.tsx`, `sheet.tsx`, `tabs.tsx`, `packages/ui/src/index.ts` |
| **ui-forms** | Select, DatePicker, FileUpload, Textarea, Avatar, StatusBadge, EmptyState, Skeleton | `packages/ui/src/components/form-select.tsx`, `form-date-picker.tsx`, `form-file-upload.tsx`, `form-textarea.tsx`, `avatar.tsx`, `status-badge.tsx`, `empty-state.tsx`, `skeleton.tsx`, `packages/ui/src/index.ts` |
| **schemas** | Extrair regras de validação de `creators.md` → Zod schemas (registration, profile, tier, challenge, payout, campaign) | `packages/shared/src/schemas/creators.ts`, `packages/shared/src/index.ts` |

**Critério de conclusão Wave 1:**
- `pnpm type-check` passa
- Todos os componentes exportados via `packages/ui/src/index.ts`
- Schemas exportados via `packages/shared/src/index.ts`
- Componentes seguem DS.md (tokens, shadcn/ui base, lucide-react)

**IMPORTANTE:** Ambos ui-components e ui-forms editam `packages/ui/src/index.ts`. O lead deve serializar: ui-components adiciona seus exports PRIMEIRO, depois ui-forms adiciona os seus.

---

### Wave 2: Backend (após Wave 1, paralelo)

**Objetivo:** Server actions CRUD + service clients para APIs externas

| Agent | Tarefas | Arquivos PERMITIDOS |
|-------|---------|---------------------|
| **backend-crud** | Server actions: CRUD creators, CRUD tiers, approve/reject/suspend creators, points ledger | `apps/web/src/app/actions/creators/crud.ts`, `tiers.ts`, `lifecycle.ts`, `points.ts` |
| **backend-business** | Server actions: payouts (calculate, approve, mark paid), sales attribution, challenges + submissions, campaigns | `apps/web/src/app/actions/creators/payouts.ts`, `sales.ts`, `challenges.ts`, `campaigns.ts` |
| **integrations** | Shopify client (create discount codes, validate coupons), Yever client (fetch orders by coupon), R2 upload service, Resend email service | `apps/web/src/lib/shopify.ts`, `apps/web/src/lib/yever.ts`, `apps/web/src/lib/storage.ts`, `apps/web/src/lib/email.ts` |

**Critério de conclusão Wave 2:**
- `pnpm type-check` passa
- Cada server action tem pelo menos 1 teste Vitest
- Shopify client cria discount code real via API
- Yever client busca pedidos reais
- R2 upload funciona com arquivo real
- Resend envia email real para endereço de teste

---

### Wave 3: Páginas (após Wave 2, paralelo)

**Objetivo:** Admin pages + Creator portal

| Agent | Tarefas | Arquivos PERMITIDOS |
|-------|---------|---------------------|
| **admin-list** | `/admin/creators` (lista com filtros, search, bulk actions), `/admin/creators/[id]` (perfil completo com tabs) | `apps/web/src/app/(admin)/admin/creators/page.tsx`, `[id]/page.tsx`, `[id]/layout.tsx`, `components/creator-list.tsx`, `components/creator-detail.tsx` |
| **admin-config** | `/admin/creators/tiers` (CRUD tiers), `/admin/creators/payouts` (lista + aprovação em lote), `/admin/creators/challenges` (lista + criação + revisão), `/admin/creators/campaigns` | `apps/web/src/app/(admin)/admin/creators/tiers/page.tsx`, `payouts/page.tsx`, `challenges/page.tsx`, `campaigns/page.tsx`, `components/tier-form.tsx`, `components/payout-table.tsx`, `components/challenge-form.tsx`, `components/campaign-form.tsx` |
| **admin-analytics** | `/admin/creators/analytics` — dashboard Beacon (Recharts): KPI cards, charts (vendas por creator, evolução mensal, tiers donut), top 10 ranking | `apps/web/src/app/(admin)/admin/creators/analytics/page.tsx`, `components/creator-kpi-cards.tsx`, `components/creator-charts.tsx` |
| **portal-public** | `/creators/apply` — formulário 3 etapas (dados, social, motivação), upload foto (R2), confirmação email (Resend) | `apps/web/src/app/creators/apply/page.tsx`, `apply/components/step-personal.tsx`, `step-social.tsx`, `step-motivation.tsx`, `apply/actions.ts` |
| **portal-logged** | `/creators/dashboard`, `/creators/sales`, `/creators/points`, `/creators/challenges`, `/creators/payouts`, `/creators/profile` | `apps/web/src/app/creators/(authenticated)/dashboard/page.tsx`, `sales/page.tsx`, `points/page.tsx`, `challenges/page.tsx`, `payouts/page.tsx`, `profile/page.tsx`, `layout.tsx` |

**Critério de conclusão Wave 3:**
- `pnpm type-check` passa
- Todas as páginas renderizam sem crash
- DataTable funciona com dados reais do banco
- Formulário de apply persiste no banco + envia email + faz upload
- Creator portal mostra dados reais do creator logado
- Charts Recharts seguem DS.md (monotone, 1.5px stroke, gradiente 3-stop)

---

### Wave 4: Integração e jobs (após Wave 3)

**Objetivo:** Background jobs + integração Shopify/Yever com dados reais

| Agent | Tarefas | Arquivos PERMITIDOS |
|-------|---------|---------------------|
| **jobs** | Vercel Cron jobs: tier-evaluation (mensal), payout-calculation (mensal), confirm-sales (diário), instagram-polling (15min) | `apps/web/src/app/api/cron/creators/tier-evaluation/route.ts`, `payout-calculation/route.ts`, `confirm-sales/route.ts`, `instagram-polling/route.ts`, `vercel.json` (crons config) |
| **integration-test** | Testar fluxo completo: creator se cadastra → admin aprova → cupom criado no Shopify → venda atribuída via Yever → comissão calculada → payout gerado | `apps/web/tests/creators/` (todos os arquivos de teste) |

**Critério de conclusão Wave 4:**
- Jobs executam sem erro
- Fluxo end-to-end funciona com dados reais

**Nota:** Instagram Graph API pode ser implementado nesta Wave se o token estiver disponível. Caso contrário, documentar em ISSUES.md e prosseguir.

---

### Wave 5: Review e polish (após Wave 4)

**Objetivo:** Cross-review, E2E tests, DS compliance audit

| Agent | Tarefas | Arquivos PERMITIDOS |
|-------|---------|---------------------|
| **reviewer-1** | Revisar código de admin-list + admin-config + portal-public | Pode ler tudo, editar apenas arquivos dos autores revisados |
| **reviewer-2** | Revisar código de backend-crud + backend-business + integrations + jobs | Pode ler tudo, editar apenas arquivos dos autores revisados |
| **polish** | DS compliance audit: verificar tokens, fontes, ícones em TODAS as páginas. Corrigir inconsistências | Todos os arquivos de páginas e componentes criados nas Waves anteriores |

**Critério de conclusão Wave 5:**
- ZERO rejeições pendentes
- `pnpm type-check` — zero erros
- `pnpm vitest run` — todos passam
- DS.md compliance 100%
- ISSUES.md revisado — nenhum item PENDENTE que bloqueia

---

## P2.3. Referências para agentes

| O que consultar | Onde |
|-----------------|------|
| Spec completa do módulo | `docs/modules/growth/creators.md` |
| Design System (cores, fonts, charts) | `DS.md` |
| Regras gerais do projeto | `CLAUDE.md` |
| Security checklist (60 checks) | `SECURITY-CHECKLIST.md` |
| Database schema | `docs/architecture/DATABASE.md` + `packages/db/schema/creators.ts` |
| Padrões de API | `docs/architecture/API.md` |
| Auth e RBAC | `docs/architecture/AUTH.md` |
| Glossário PT-BR ↔ EN | `docs/dev/GLOSSARY.md` |
| Padrão de server action | `apps/web/src/app/(auth)/login/actions.ts` |
| Padrão de página admin | `apps/web/src/app/(admin)/admin/creators/page.tsx` |
| Padrão de componente UI | `packages/ui/src/components/button.tsx` |
| Auth helpers | `apps/web/src/lib/auth.ts` + `apps/web/src/lib/tenant.ts` |
| Pilares Enterprise (10 pilares) | Seção 15 deste guia |
| OWASP Agentic best practices | Seção 16 deste guia |

---

## P2.4. Decisões já tomadas (NÃO rediscutir)

| Decisão | Valor |
|---------|-------|
| Attribution model | Cupom-only (v1.1) |
| Creator tiers | Configuráveis por tenant (seed/grow/bloom/core) |
| Commission rates | 8% / 10% / 12% / 15% (CIENA default) |
| Public registration | Formulário 3 etapas, sem convite |
| Portal pages | 8 páginas (dashboard, sales, points, challenges, payouts, profile, content, referrals) |
| Points system | Append-only ledger |
| Payout methods | PIX, bank_transfer, store_credit |
| Multi-tenancy | tenant_id + RLS (ADR-014) |
| Session | Custom, cookie `ambaril_session`, DB-backed |
