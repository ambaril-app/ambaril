# Pitch: {Feature Or Module Name}

---

status: draft
approval_path: cycle
owner: {name}
source_artifact: null
approved_by: pending
supersedes: null

---

**Date:** {YYYY-MM-DD}
**Appetite:** {1-2 weeks | 6 weeks}
**Change Safety Hint:** none | auth-tenant | schema-migration | provider-webhook | financial-fiscal | cross-module

## Problem

{Quem sofre, workaround atual, consequencia.
Formato: "[PERSONA] hoje [WORKAROUND] quando [CENARIO]. Isso causa [PROBLEMA]. Sem solucao, [CONSEQUENCIA]."}

## Solution Rough

{Breadboarding em texto. Sem schema, sem API, sem wireframe detalhado.}

## Rabbit Holes

1. {Nome}
   - Risk: {o que pode explodir}
   - Decision: ELIMINATE (solucao: X) | OUT OF SCOPE | ACCEPT CONSCIOUSLY (plano: Y)

## No-Gos

- {Feature especifica que NAO entra — motivo}

## Decision Notes

- Replacement baseline: {ferramenta atual}
- Real-data dependencies: {providers ou modulos}
- Technical research done: {sim/nao — resumo}
- Approval path: {cycle | direct}

## Next Step

- `/feature-evaluate-plan` | `/feature-create-spec` (apenas `approval_path: direct`)
