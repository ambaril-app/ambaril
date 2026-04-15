---
name: feature-review-spec
description: Use when an existing spec needs validation before planning or implementation. Triggers on checking completeness, consistency, security, cross-module fit, or readiness to build.
---

# Feature Review Spec

Revisa spec com analise tecnica interna e saida em linguagem de produto. Operador sai sabendo se spec esta pronta.

## When to Use

- Spec nova acabou de ser escrita
- Duvida sobre lacunas ou conflitos
- Antes de `/feature-implement`

## When Not to Use

- Spec nao existe → `/feature-create-spec`
- Entrevista de requisitos → `/grill-me`
- Planejar waves → `/feature-implement`

## Required Inputs

- Caminho da spec alvo
- Se spec `status: blocked` → reportar ao operador
- Se spec `status: superseded` → STOP, usar versao mais recente

## Hard Gates

- Nao emitir verde se houver bloqueador real
- Relatorio final na lingua definida por `conventions.conversation_language`, sem jargao de implementacao
- So ler specs de outros modulos se dependencia detectada
- Spec §9 sem mapeamento ASVS coerente com change_class (per `docs.change_safety`) → 🔴 `status: blocked` — **only enforced when `docs.change_safety` is not null AND `docs.security_checklist` is not null**
- Spec com UI nova/alterada e §8 sem archetype + `energy level` + baseline do Design Lab + estados obrigatorios → 🔴 `status: blocked` — **only enforced when `docs.design_companion` is not null OR `conventions.design_lab` is true**

## Procedure

### Step 0 — Load Manifest

Read `project.yaml` from the project root. If not found → **STOP**: "No `project.yaml` found. Run `/feature-plan` to initialize your project first."

Parse the manifest and resolve all paths/configs used in subsequent steps. Store:

- `CEREMONY` ← `ceremony` value (default: `"standard"` if missing or `"auto"`)
- `LANG_CONV` ← `conventions.conversation_language` (default: `"en"`)
- `MULTI_TENANT` ← `conventions.multi_tenant` (default: `false`)
- `DESIGN_LAB` ← `conventions.design_lab` (default: `false`)
- `SAFETY_CLASSES` ← `conventions.change_safety_classes` (default: `[]`)

If `ceremony` is `"auto"`, infer from the spec's change_class: `low` → `"light"`, `medium` or `cross-module` → `"standard"`, `critical` or `agent-tool` → `"full"`.

### Ceremony gate

| Value        | Behavior                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `"light"`    | 4 dimensions only (Schema, Auth, Completeness, Change Safety). Skip state-scan. Skip cross-module analysis. |
| `"standard"` | All 7 dimensions. State-scan. Cross-module analysis.                                                        |
| `"full"`     | All 7 dimensions + mandatory grill even if no findings.                                                     |

---

### Step 1 — Read

Read spec alvo.

Read available docs from manifest. For each key below, read the file **only if the value is not null**:

- `docs.auth`
- `docs.database`
- `docs.api`
- `docs.change_safety`
- `docs.security_checklist`
- `docs.design_companion`
- `docs.design_system`

If feature has UI AND `docs.design_companion` is not null: read the corresponding Design Lab page.

---

### Step 2 — Analyze (interno)

Dimensions scale with ceremony level:

**Ceremony "light" — 4 dimensions:**

- **A. Schema**: campos existem/novos? Tipos corretos? timestamps? soft delete? — If `docs.database` is not null: deep field analysis against conventions. If null: basic field analysis only (check internal consistency). If `MULTI_TENANT` is true: check `tenant_id` presence.
- **B. Auth**: toda acao tem permissao? Roles validas? Menor privilegio? Audit log? — **Skip entirely if `docs.auth` is null** (warn: "No auth doc configured — skipping auth dimension").
- **F. Completude**: 12 secoes? Zero TBD? Regras testaveis? `§4.6 Test Matrix` presente com must-pass + must-fail scenarios? Behavior-heavy sections have `Test Scenarios` (Given/When/Then)? Regression-sensitive areas identified? Observability expectations for risky flows? Wireframes? Edge cases? For agent/auth-tenant flows: source priority, block/confirm behavior, and audit expectations declared?
- **G. §12 Change Safety**: risk tier coerente? Blast radius explicito? Regression faz sentido? Release/rollback definidos para medium+? — If `docs.change_safety` is not null: map against §10.5 rules. If null: basic risk assessment only (check internal coherence of §12).

**Ceremony "standard" or "full" — all 7 dimensions:**

All 4 above, plus:

- **C. Security**: §9 cita categorias OWASP Top 10 2025 aplicaveis? — If `docs.security_checklist` is not null: §9 cita controles ASVS v5 coerentes com change_class (per `docs.change_safety`). If `docs.security_checklist` is null: skip ASVS mapping, do basic security only (OWASP check + internal consistency). — Triade auth+permission+validation? Zod? Sandbox vs production? PII+LGPD? — If `agent-tool` in `SAFETY_CLASSES`: §9 menciona lethal trifecta + helpers obrigatorios (`maskForLLM`, `sanitizePrompt`)? **Skip lethal trifecta checks if `agent-tool` not in `SAFETY_CLASSES`.**
- **D. API**: padrao URL? Envelope? Paginacao? Erros? — **Skip entirely if `docs.api` is null** (warn: "No API doc configured — skipping API dimension").
- **E. UI Contract (quando aplicavel)**: §8 define archetype, `energy level`, role principal, acao principal, baseline do Design Lab, estados e tom de copy? Reusa pattern existente ou inventa layout sem necessidade? — **Skip entirely if `docs.design_companion` is null AND `DESIGN_LAB` is false.**

---

### Step 2.5 — State Scan

Resolve `STATE_SCAN_CMD`:

- if `checks.state_scan` is set → use it verbatim
- otherwise → use the bundled fallback scanner at `skills/state-scan/scripts/generic-scanner.sh`

**Ceremony "light": skip this step.**

Otherwise, run:

- `STATE_SCAN_CMD all --spec-file {path-da-spec}` — cross-module scan of tables/routes/perms/events/providers excluding the spec's own module.
- `STATE_SCAN_CMD drift --module {modulo-da-spec}` — code↔spec drift detection.

If `checks.state_scan_cwd` is set, run from that directory.

For each `hard_block` hit in `all`: mark the spec as **🔴 red** automatico no relatorio (nao negociavel).

For drift code↔spec encontrado: mark as **🟡 yellow finding** com a lista de tabelas faltantes na spec ou no codigo (operador decide se atualiza spec ou aceita drift).

Se qualquer scan retornar exit 2: STOP, reportar erro do scan ao operador.

---

### Step 3 — Cross-module Detection

**Ceremony "light": skip this step.**

Escanear por refs a outros modulos. Se nao encontrar → pular Step 4.

---

### Step 4 — Cross-module Analysis (se necessario)

**Ceremony "light": skip this step.**

Para cada modulo referenciado: bidirecionalidade, nomenclatura, fluxos completos, dados existem, permissoes compativeis, contratos de evento.

---

### Step 4.5 — Auto-Corrigir

Para cada achado com resposta objetivamente correta (sem tradeoff de design), corrigir direto na spec antes de continuar. Criterios para auto-fix:

- Tipo de dado incorreto sem ambiguidade (ex: `text` onde deveria ser `uuid`, `int` onde deveria ser `boolean`)
- FK referenciada na narrativa mas ausente no schema
- Mudanca de schema sem casos de contrato em `§4.6 Test Matrix`
- `updated_at` / `created_at` / `deleted_at` ausentes onde o modulo claramente usa soft delete ou audit
- Naming inconsistente com o resto da spec (ex: mesmo conceito com dois nomes diferentes na mesma secao)
- Campo listado em duas secoes com tipos conflitantes
- Permissao definida mas nunca usada, ou usada mas nunca definida
- Referencia a enum cujos valores nao foram declarados em lugar nenhum
- **If `MULTI_TENANT` is true:** Campo `tenant_id` faltando em tabela que claramente deve ser multi-tenant. **Skip this check if `MULTI_TENANT` is false.**

Cada fix: aplicar na spec + anotar internamente como `[AUTO-FIXED: motivo]` para incluir no relatorio.

---

### Step 4.6 — Grill dos Achados

**Ceremony "full": run this step even if no findings remain** (grill for design confidence).

For "light" and "standard": run only if there are findings that require a design decision.

Para cada finding remanescente que exige decisao de design (nao tem resposta objetivamente correta), fazer uma pergunta por vez ao operador:

- Formular a pergunta em linguagem de produto, nao de implementacao
- Language: `LANG_CONV`
- Apresentar recomendacao propria com justificativa em uma linha
- Aguardar resposta antes de avancar para o proximo finding
- Aplicar a decisao diretamente na spec antes de passar para a proxima pergunta
- Se a resposta puder ser inferida explorando o codebase ou outras specs, explorar primeiro e so perguntar se ainda houver ambiguidade
- Exemplos de achados que exigem grill: escopo de feature (incluir ou nao), fluxo alternativo sem spec (qual deve ser o comportamento), conflito de regra de negocio entre secoes, decisao arquitetural com tradeoffs claros

---

### Step 5 — Report

Read [review-template.md](references/review-template.md). Gerar relatorio com semaforo + findings. Incluir secao de auto-fixes aplicados.

**Atualizar artifact state:**

- 🟢 → `status: approved`
- 🔴 → `status: blocked` com motivo
- 🟡 → mantem `status: draft`, findings listados

---

### Step 6 — INSIGHTS

Se durante a review registrar findings relevantes para o projeto como um todo, registrar em `INSIGHTS.md` (at project root or `paths.insights` from project.yaml if set).

## Expected Output

- Relatorio com semaforo + findings
- Spec com `status` atualizado

## Companion Skills

- Nenhuma obrigatoria

## Operator Handoff

- 🟢/🟡 sem bloqueadores → `/feature-implement`
- 🔴 → corrigir spec antes

## References

- [review-template.md](references/review-template.md) — carregar ao gerar relatorio (Step 5)

## Conditional Checks Summary

| Manifest key                                       | If null/missing                                                    | Effect                                 |
| -------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------- |
| `docs.auth`                                        | Skip dimension B (Auth) entirely                                   | Warn operator                          |
| `docs.database`                                    | Basic field analysis only in dimension A                           | No convention validation               |
| `docs.api`                                         | Skip dimension D (API) entirely                                    | Warn operator                          |
| `docs.change_safety`                               | Skip §10.5 mapping in dimension G                                  | Basic risk assessment only             |
| `docs.security_checklist`                          | Skip ASVS mapping in dimension C                                   | Basic security only (OWASP + internal) |
| `docs.design_companion` + `conventions.design_lab` | Both null/false → skip dimension E (UI Contract)                   | No UI contract check                   |
| `checks.state_scan`                                | Use bundled fallback scanner                                       | State scan stays available             |
| `conventions.multi_tenant`                         | false → skip tenant_id auto-fix in Step 4.5                        | No multi-tenant checks                 |
| `conventions.change_safety_classes`                | If `"agent-tool"` not listed → skip lethal trifecta in dimension C | No agent-tool security                 |
