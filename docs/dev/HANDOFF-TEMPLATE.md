# Handoff — {Module} Wave {N}

**Date:** {YYYY-MM-DD}
**Session ended by:** saturation | wave-complete | blocker | operator-request
**Plan:** {path to plan file}
**Plan status:** in_execution | completed

## Progress

| Slice     | Status                | Commit |
| --------- | --------------------- | ------ |
| {slice 1} | done                  | {hash} |
| {slice 2} | done                  | {hash} |
| {slice 3} | in-progress / blocked | —      |
| {slice 4} | pending               | —      |

## Wave Status

- **Slices completed:** {X}/{Y}
- **SEC gate:** passed | not-yet
- **Cross-slice smoke:** passed | not-yet
- **Human checklist:** sent | not-yet

## Test Evidence

| Field                       | Value                                                 |
| --------------------------- | ----------------------------------------------------- |
| **command_run**             | `{pnpm test / checks.ci / specific command}`          |
| **result_summary**          | `{N passed, M skipped, 0 failed}`                     |
| **tests_added**             | {list of new test files or "none"}                    |
| **tests_updated**           | {list of modified test files or "none"}               |
| **regression_rerun**        | {test commands re-run from previous slices or "none"} |
| **remaining_manual_checks** | {what operator must verify by hand or "none"}         |
| **uncovered_risk**          | {what is NOT tested yet and why}                      |

## Regression Set (accumulated)

- {test file or command}

## INSIGHTS.md Updates

- {count} items added this session
- Critical items: {list or "none"}

## Risk & Safety

- **Risk tier:** {tier}
- **Release strategy:** {strategy}
- **Blockers:** {list or "none"}

## Next Action

- [ ] {Exatamente o que a proxima sessao deve fazer primeiro}
- [ ] {Segundo passo}

## Context for Next Session

{1-3 frases de contexto que a proxima sessao precisa saber para nao perder tempo redescobrindo.}

## Pilot Signals

_(Include when `quality.implementation_pilot.enabled` is true. Remove this section after pilot period ends.)_

- **Blockers:** {category: description — resolved/waived/escalated, or "none"}
- **Waivers used:** {what was waived and why, or "none"}
- **Spec ambiguities:** {what was unclear and how resolved, or "none"}
- **Suggested skill adjustment:** {what should change in feature-\* skills, or "none"}
