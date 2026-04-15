---
name: feature-create-spec
description: Use when an approved bet now needs a full implementation-ready specification. Triggers on creating a new spec for an approved module or feature that is no longer in the shaping stage.
---

# Feature Create Spec

Cria spec completa de item apostado. Conversa e de produto; saida tecnica precisa ser precisa para planejamento.

## When to Use

- Bet aprovado, spec nao existe
- Formalizando decisao em spec implementation-ready

## When Not to Use

- Ideia rough sem appetite → `/feature-plan`
- Spec existe, precisa review → `/feature-review-spec`
- Spec aprovada, precisa plano → `/feature-implement`

## Required Inputs

- One of:
  - approved cycle bet referenced from `paths.cycles`
  - approved pitch with `approval_path: direct`
- Appetite definido
- Se nao tem artefato aprovado → STOP
- Se nao tem appetite → STOP, `/feature-plan`

## Hard Gates

- Sem pitch/bet aprovado no caminho correto → STOP
- Sem appetite → STOP
- Zero placeholders na versao final
- Toda regra de negocio testavel
- Mudanca de schema sem casos de contrato em §4.6 Test Matrix → STOP
- Se houver UI nova ou alterada, §8 precisa declarar archetype, `energy level`, baseline do Design Lab, estados e copy contract aplicavel — **only enforced when `docs.design_companion` is not null OR feature explicitly has UI**
- §12 Change Safety concreto (nao generico)
- §9 Security: depth scales with ceremony level (see Ceremony section below)
  - **"full":** sem citacao OWASP Top 10 2025 E ASVS v5 coerente com change_class → STOP
  - **"standard":** ASVS only for change_class medium+; OWASP required for all
  - **"light":** minimal security review, skip ASVS mapping

## Procedure

**Step 0 — Load Manifest**

Read `project.yaml` from the project root. If not found → **STOP**: "No `project.yaml` found. Run `/feature-plan` to initialize your project first."

Parse the manifest and resolve all paths/configs used in subsequent steps. Store:

- `CEREMONY` ← `ceremony` value (default: `"standard"` if missing or `"auto"`)
- `LANG_CONV` ← `conventions.conversation_language` (default: `"en"`)
- `LANG_COPY` ← `conventions.copy_language` (default: `"en"`)
- `MULTI_TENANT` ← `conventions.multi_tenant` (default: `false`)
- `DESIGN_LAB` ← `conventions.design_lab` (default: `false`)
- `SAFETY_CLASSES` ← `conventions.change_safety_classes` (default: `[]`)

If `ceremony` is `"auto"`, infer from appetite: ≤2 weeks → `"light"`, ≤6 weeks → `"standard"`, >6 weeks → `"full"`.

---

**Step 0.5 — State Scan: similarity (gate inicial)**

Resolve `STATE_SCAN_CMD`:

- if `checks.state_scan` is set → use it verbatim
- otherwise → use the bundled fallback scanner at `skills/state-scan/scripts/generic-scanner.sh`

Run `STATE_SCAN_CMD similarity --slug {slug-proposto} --module {modulo-alvo}`.
If exit 1 (slug-exact): STOP, reportar ao operador qual spec ja existe e perguntar se e update vs novo. Se hits near-match: listar e pedir confirmacao antes de seguir.

---

**Step 1 — Context**

Read available docs from manifest. For each key below, read the file **only if the value is not null**:

- `docs.agents`
- `docs.architecture`
- `docs.change_safety`
- `docs.artifact_state`
- `docs.design_companion`
- `docs.design_system`
- `docs.auth`
- `docs.database`
- `docs.security_checklist`
- `docs.security`
- `docs.testing_strategy`

Read 2-3 existing specs from `paths.specs` (if the directory exists and has specs).

If CEREMONY is `"full"` or `"standard"`:

- Read `docs.security_checklist` (dominios relevantes ao change_class esperado).
- Read `docs.change_safety` (if it has ASVS mapping sections).

If feature has UI AND `docs.design_companion` is not null:

- Open the corresponding Design Lab page and note which archetype will be reused.

### Progressive Doc Generation

After attempting to read docs, check if the feature **needs** a doc that is null in the manifest:

1. **AUTH** — If the feature involves authentication, permissions, or RBAC, and `docs.auth` is null:
   → Interview the operator about auth patterns (provider, session strategy, RBAC model, token handling).
   → Generate an auth doc at a sensible path, update `docs.auth` in `project.yaml`.

2. **DATABASE** — If the feature needs a data model, and `docs.database` is null:
   → Interview the operator about schema conventions (naming, ID format, timestamps, soft delete, multi-tenant column).
   → Generate a database conventions doc, update `docs.database` in `project.yaml`.

3. **SECURITY** — If the expected change_class is `medium+`, and `docs.security_checklist` is null:
   → Warn: "No security checklist configured — creating minimal one."
   → Interview the operator about security posture (PII handling, rate limiting policy, audit logging expectations).
   → Generate a minimal security checklist doc, update `docs.security_checklist` in `project.yaml`.

---

**Step 2 — Appetite Gate**

Confirm appetite with operator.

---

**Step 3 — Interview**

Language: `LANG_CONV`. Tom de PM. Uma pergunta por vez com recomendacao.

If CEREMONY is `"light"`:
5 areas: proposito, usuarios, jornadas core, dados, edge cases.

If CEREMONY is `"standard"` or `"full"`:
9 areas: proposito, usuarios, substituicao, jornadas core, dados, integracoes, permissoes, edge cases, contrato de UI (archetype, role principal, acao principal, estados, mobile).

Contrato de UI question: only ask if `docs.design_companion` is not null OR the operator indicates UI is involved.

---

**Step 4 — Approaches**

2-3 abordagens com trade-offs. Recomendar uma.

---

**Step 4.5 — State Scan: colisao estrutural (gate antes de escrever spec)**

If CEREMONY is `"light"`: skip this gate.

Otherwise, after the operator approves the approach, extract all proposed structural identifiers and run:

- `STATE_SCAN_CMD tables --input "{schema.tabela1,schema.tabela2,...}"`
- `STATE_SCAN_CMD routes --input "{METHOD /path1,METHOD /path2,...}"` (if new routes)
- `STATE_SCAN_CMD perms --input "{module:resource:action,...}"` (if new perms)
- `STATE_SCAN_CMD events --input "{module.event,...}"` (if new events)
- `STATE_SCAN_CMD providers --input "{provider1,...}"` (if new providers)

For EACH scan returning exit 1 (hard_block): **STOP**, surface hits to operator:

> **Colisao detectada** — `{id}` ja declarado em `{owner_module}` (status: {status}, fonte: {source}). Opcoes: (a) reusar o existente, (b) renomear o que estamos criando, (c) abortar e revisar abordagem.

Wait for decision. Do not write spec until ALL collisions are resolved.

---

**Step 5 — Write Spec**

Read [spec-template.md](references/spec-template.md). Language for spec content: `LANG_COPY`. Schema, code, endpoints always in EN.

### Section count by ceremony

- **"light":** 9 sections — §1 Vision, §2 User Journeys, §3 Data Model, §4 Business Rules, §4.6 Test Matrix, §5 Permissions, §7 Interfaces, §9 Security (minimal), §12 Change Safety.
- **"standard"** or **"full":** all 12 sections.

### Conditional sections

**§3 Data Model:**

- If `MULTI_TENANT` is true: enforce `tenant_id` conventions on all new tables.
- If `MULTI_TENANT` is false: omit tenant_id requirements.

**§8 UI Notes** — Include only if `docs.design_companion` is not null OR the feature explicitly has UI.
When included, it **MUST** declare:

- archetype da tela
- `energy level`
- role principal
- acao principal
- Design Lab baseline (`path`) — only if `DESIGN_LAB` is true; otherwise mark N/A
- estados obrigatorios (loading, empty, error, success, permission quando aplicavel)
- regras de copy / tom relevantes
- se reusa pattern existente ou justifica pattern novo

**§9 Security** — Depth depends on ceremony:

- **"light":** Minimal security checklist (PII, rate limiting, input validation, permissions). No OWASP/ASVS mapping required.

- **"standard":**
  - Lista das categorias **OWASP Top 10 2025** aplicaveis a esta feature.
  - ASVS v5 controls: only for change_class `medium+`.
  - If `agent-tool` in `SAFETY_CLASSES` AND the feature's change_class includes `agent-tool`: add checklist from `docs.security_checklist` Domains 11+12 + reference `docs.security` §9 (if those docs exist). Add `maskForLLM`/`sanitizePrompt` as `ai_security_helpers_required`.
  - If `docs.security_checklist` is null: include OWASP mapping but skip ASVS.
  - Example minimum: "OWASP: A01 (RBAC enforcado), A03 (Zod schema). ASVS L2: V4.1 (access control), V5.1 (input validation)."

- **"full":**
  - Everything from "standard" plus:
  - ASVS v5 controls required for ALL change_classes (not just medium+).
  - Mandatory OWASP + ASVS mapping regardless of change_class.

**§12 Change Safety** — Always concrete. If `agent-tool` in `SAFETY_CLASSES` AND change_class includes `agent-tool`:

- Require lethal trifecta analysis.
- Require `maskForLLM`/`sanitizePrompt` declaration.

**§4.6 Test Matrix** — Required for all ceremonies:

- **Must-pass scenarios:** happy-path assertions that prove the feature works end-to-end.
- **Must-fail scenarios:** negative cases that prove invalid input, unauthorized access, or constraint violations are caught. At minimum: one invalid input, one permission-denied, one boundary violation.
- **Regression-sensitive areas:** list existing tests or journeys that could break as a side effect of this feature. If the feature touches a journey from `quality.critical_journeys` (in `project.yaml`), name it explicitly.
- **Observability expectations:** what logs, audit events, or metrics this feature emits and how to verify them.
- For schema-affecting changes: declare canonical valid payload, invalid payloads, coercions/defaults, and cross-field rules that must be covered by contract tests.
- For logic changes: declare unit/property/integration coverage.
- For bug-prone flows: declare the regression that must fail before the fix and pass after it.
- For behavior-heavy sections (FSM, calculations, workflows, complex validations): include explicit **Test Scenarios** in Given/When/Then form. These scenarios are mechanically translated to tests — the LLM translates, it does not interpret. See `docs/platform/TESTING.md §13`.

---

**Step 6 — Auto-Validate**

Schema refs corretas, roles validas, cross-module bidirecional, zero placeholders.

If feature has UI: verificar que §8 inclui archetype + `energy level` + estados. If `DESIGN_LAB` is true: verify Design Lab baseline path is present.

Security validation (scales with ceremony):

- **"light":** verify §9 has minimal checklist items.
- **"standard":** verify §9 cites OWASP Top 10 2025 categories. If change_class is medium+, verify ASVS chapters present.
- **"full":** verify §9 cites OWASP Top 10 2025 categories AND ASVS v5 chapters regardless of change_class.

If validation fails → correct before saving.

Testing validation:

- verify §4.6 exists
- verify §4.6 has at least one must-pass and one must-fail scenario
- if the spec changes schema, verify §4.6 includes contract cases
- if the spec changes business logic, verify §4.6 names the automated gate that will cover it
- if the spec includes behavior-heavy logic (FSM, calculations, workflows), verify §4.6 has Given/When/Then test scenarios
- if the spec touches regression-sensitive areas, verify §4.6 lists them
- if the spec emits events or audit entries, verify §4.6 has observability expectations

---

**Step 7 — Save**

Save to `{paths.specs}/{module-slug}/{feature-slug}.md` with `status: draft`.

The saved spec must carry `source_artifact` pointing to the approved pitch or cycle entry that authorized this work.

---

**Step 8 — Present + Security Sign-Off**

Highlight decisions and cross-module impacts.

If CEREMONY is `"light"`: skip security sign-off. Present spec and suggest `/feature-review-spec`.

If CEREMONY is `"standard"`: security sign-off only if `change_class >= cross-module`.

If CEREMONY is `"full"`: always show security sign-off.

When security sign-off is required, display before suggesting `/feature-review-spec`:

> **Checklist de Seguranca — `change_class: {class}` / ASVS target: {level}**
> Confirme (sim/nao) antes de chamar `/feature-review-spec`:
>
> 1. §9 lista categorias OWASP Top 10 2025 aplicaveis?
> 2. §9 lista controles ASVS {level} por capitulo?
> 3. §12 Change Safety tem risk_tier, blast_radius, rollback e observability concretos?
> 4. [SE `agent-tool` in SAFETY_CLASSES] §9 declara `maskForLLM`/`sanitizePrompt` como `ai_security_helpers_required`?
>
> Item com "nao" → yellow finding (nao bloqueia). Spec ja salva. Operador corrige antes ou durante `/feature-review-spec`.

## Expected Output

- Spec em `{paths.specs}/` com `status: draft`

## Companion Skills

- Nenhuma obrigatoria

## Operator Handoff

- Spec pronta → `/feature-review-spec`

## References

- [spec-template.md](references/spec-template.md) — carregar ao escrever spec (Step 5)
- [common-mistakes.md](references/common-mistakes.md) — consultar se resultado parecer fraco
