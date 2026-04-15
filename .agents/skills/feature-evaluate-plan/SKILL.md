---
name: feature-evaluate-plan
description: Use when planning the next cycle or choosing what enters active commitment from available pitches and catalog items. Triggers on cycle planning, deciding what comes next, or re-evaluating priorities after a module finishes.
---

# Feature Evaluate Plan

Conduz a sessao de apostas do ciclo. Esta etapa decide no que o time realmente vai investir agora. O que nao for apostado nao ganha data.

## Step 0 — Load Manifest

Read `project.yaml` from the project root.

- If `project.yaml` is not found, stop and tell the operator: _"No project.yaml found. Run `/feature-plan` first to initialize the project manifest."_
- Parse all values used in subsequent steps. Where a key is null or missing, the corresponding check is skipped (see Conditional Checks below).
- Use `conventions.conversation_language` (from project.yaml) for all conversation output. Default to English if not set.

### Ceremony gate

Read `ceremony` from project.yaml (default: `"standard"`).

| Value        | Behavior                                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `"light"`    | Skip evaluation entirely — only pitches already marked `approval_path: direct` may go straight to spec. Tell the operator and exit.            |
| `"standard"` | Run the full procedure below.                                                                                                                  |
| `"full"`     | Run the full procedure below **plus** cross-reference every candidate against `docs.implementation` (from project.yaml) for roadmap alignment. |
| `"auto"`     | If there are <= 2 eligible pitches, treat as `"light"`. Otherwise treat as `"standard"`.                                                       |

## When to Use

- Inicio de ciclo.
- Encerramento de modulo com necessidade de decidir o proximo investimento.
- Mudanca de prioridade que exige reavaliacao do ciclo.

## When Not to Use

- A ideia ainda esta rough e sem pitch.
- O item ja tem aposta ativa e precisa apenas seguir o fluxo.
- O objetivo e detalhar implementacao, nao escolher prioridade.

## Required Inputs

- `docs.implementation` (from project.yaml) — if ceremony is `"full"`
- Pitches with `status: draft` or `status: approved` in `paths.pitches` (from project.yaml)
- Restricoes do ciclo atual
- Estado dos modulos ja em andamento
- Ciclo anterior, se existir

## Hard Gates

- Sem pitch elegivel com `status: draft` ou `status: approved` e appetite claro, parar.
- Nao apostar em item sem appetite claro.
- Nao apostar em item com rabbit hole critico nao resolvido.
- Maximo 2-3 apostas por ciclo.
- Item nao apostado = sem data.

## Procedure

1. Read pitches from `paths.pitches` (from project.yaml), cycle files from `paths.cycles` (from project.yaml), and the context of modules already in progress. If ceremony is `"full"`, also read `docs.implementation` (from project.yaml).

2. Listar 3-5 candidatos viaveis com appetite, dor resolvida, dependencias, estado do artefato e risco principal.

2.5 **State Scan — providers + refs (informacional)** — Resolver `STATE_SCAN_CMD` (`checks.state_scan` se configurado; senao fallback embutido em `skills/state-scan/scripts/generic-scanner.sh`). Para os candidatos shortlisted, rodar `STATE_SCAN_CMD` com working directory `checks.state_scan_cwd` (from project.yaml) usando argumento `providers --input "{providers-novos-csv}"` se algum candidato citar providers novos. Para cada candidato com cross-module ref: rodar `STATE_SCAN_CMD refs --target {referenced-module} --from {candidate-module}`. Findings entram como `risk note` na aposta — nao bloqueia, informa.

3. Avaliar impacto, dependencias, appetite, rabbit holes, sequencia logica, risco operacional e readiness real. Para candidatos com `change_class` sensivel, verificar informalmente:
   - **agent-tool risk** _(skip if `"agent-tool"` is not in `conventions.change_safety_classes` in project.yaml)_: Search the codebase for `maskForLLM`/`sanitizePrompt` helper functions. If not found, declare Wave 0 as risk in the bet.
   - **auth-tenant / financial-fiscal risk** _(skip if `docs.security_checklist` is null in project.yaml)_: Read `docs.security_checklist` (from project.yaml) — is there a P1 gap in the affected domain? If yes, register as risk note.
   - `change_class >= cross-module`: spec will need ASVS L2+ — register as requirement in the bet outcome.
   - **Design Lab archetype** _(skip if `conventions.design_lab` is false or null in project.yaml)_: If there is relevant UI, does a Design Lab archetype exist? If not, register `risk note` for design drift / new pattern.

   _(Informacional — nao bloqueia aposta. Informa risk notes do Step 4.)_

4. Escolher as apostas do ciclo, registrar `risk notes` por aposta e documentar o que ficou de fora como decisao consciente.

5. Read `references/cycle-template.md`, save to `paths.cycles` (from project.yaml) as `YYYY-MM-DD.md` with `status: active` and update selected pitches to `status: approved` with `approval_path: cycle`.

6. No fechamento do ciclo, atualizar o cycle file para `status: completed` com shipped, cortes e licao aprendida.

## Expected Output

- Cycle file saved under `paths.cycles` (from project.yaml) as `YYYY-MM-DD.md`
- Frontmatter with `status`, `owner`, `source_artifact`, `approved_by` and `supersedes`
- Cycle file with `status: active`

## Companion Skills

- Nenhuma obrigatoria

## Operator Handoff

- Item novo apostado sem spec: `/feature-create-spec`
- Item com spec pronta e aprovada: `/feature-implement`
- Item com plano aprovado: `/feature-code`
- Shape ainda insuficiente: `/feature-plan`

## References

- Template: `references/cycle-template.md`
- Change safety: `docs.change_safety` (from project.yaml) — if available
- Artifact lifecycle: `docs.artifact_state` (from project.yaml) — if available

## Conditional Checks Summary

| Manifest key                        | If null/missing                                                          | Effect                              |
| ----------------------------------- | ------------------------------------------------------------------------ | ----------------------------------- |
| `checks.state_scan`                 | Use bundled fallback scanner                                             | State scan remains available        |
| `docs.security_checklist`           | Skip security checklist gap checks in Step 3                             | No P1 gap check                     |
| `conventions.design_lab`            | Skip Design Lab archetype check in Step 3                                | No design drift note                |
| `conventions.change_safety_classes` | If `"agent-tool"` not listed, skip agent-tool Wave 0 risk note in Step 3 | No agent-tool risk                  |
| `docs.implementation`               | Only required when ceremony is `"full"`                                  | Roadmap cross-ref skipped otherwise |
