---
name: feature-code
description: Use when an approved implementation plan exists and a wave is ready to be executed slice by slice. Triggers on starting coding for a planned wave, continuing the next wave, or resuming execution after operator review.
---

# Feature Code

Executes an approved plan slice by slice with TDD, verification, regression, and controlled saturation. Human intervention at wave boundaries.

## Step 0 — Load Manifest

Read `project.yaml` from the project root. **If not found → STOP.** All paths, commands, and conventions below resolve from this manifest.

```
docs:       design_companion, change_safety, security_checklist, security,
            testing_strategy, release_checklist, release_approval, review_protocol,
            migration_safety, handoff_template, design_system
paths:      insights, handoffs
checks:     type_check, lint, test, test_fast, test_full, test_schemas,
            security_scan, state_scan, state_scan_cwd
conventions: copy_language, conversation_language, multi_tenant, design_lab,
             change_safety_classes, test_enforcement, schema_baseline_required
ceremony:   "full" | "standard" | "light" | "auto"
```

Resolve ceremony:

- `"auto"` → infer from change class: trivial/small → `"light"`, medium → `"standard"`, large/critical → `"full"`.
- `"light"` → skip INSIGHTS triage, skip handoff check, simplified auto-review (always quick), skip SEC gate, skip tracking, skip release package.
- `"standard"` → full procedure as documented below.
- `"full"` → full procedure + mandatory release package for ANY change class.

Language: Use `conventions.conversation_language` for all conversation. Commit messages always in English.

## When to Use

- Plan `status: approved`
- Continuing implementation ("next wave")

## When Not to Use

- No spec → `/feature-create-spec`
- Spec not validated → `/feature-review-spec`
- No plan → `/feature-implement`

## Required Inputs

- Plan with `status: approved` — if `draft`/`blocked` → STOP
- Target wave identified
- Real tenant data available
- If UI exists: `docs.design_companion` and Design Lab baseline read before the first visual slice _(skip if `docs.design_companion` is null)_
- If medium+: `docs.change_safety`, `docs.release_checklist`, `docs.release_approval` read _(skip any that are null; warn if `docs.release_checklist` is null)_
- If migration: `docs.migration_safety` read
- `docs.handoff_template` available _(if null → use simple handoff: what's done, what's next, blockers)_
- `docs.security_checklist` — load domains relevant to the plan's change*class *(skip if null; warn "no security checklist configured")\_
- **If plan declares `ai_security_helpers_required`** and helpers don't exist in code → STOP. Create helpers as Wave 0 prerequisite before any slice. _(Skip check entirely if `"agent-tool"` not in `conventions.change_safety_classes`)_

## Hard Gates

- Plan not approved → STOP
- No real data → STOP
- Medium+ without risk tier/blast radius/regression/rollback/observability → STOP
- `conventions.test_enforcement = "hard"` and `checks.test_fast` missing → STOP
- `conventions.test_enforcement = "hard"` and `checks.test_full`/`checks.test` missing → STOP
- Saturation: >15 files touched in session | >45 min elapsed → HARD STOP
- Visual slice touching more than 1 primary surface / archetype → STOP and split before continuing
- 3 consecutive errors → STOP, ask for help
- Spec error discovered → `paths.insights` + flag + STOP (do not fix in-place)

## Procedure

### Pre-Flight

1. **Artifact check** — Verify plan `status: approved`. Update to `in_execution`.
2. **INSIGHTS triage** — Read `paths.insights`. `critical` items for the module → STOP. `pending` items → report to operator. _(ceremony:light → skip)_
3. **Handoff check** — If a handoff from a previous session exists (see `docs.handoff_template`), read and resume. _(ceremony:light → skip)_
4. **Wave setup** — Read wave slices. Verify real data. Create task list.

### Slice Loop

5. **Plan** — Read slice in plan. Re-read spec section (§2 + §4). If UI: re-read `docs.design_companion` (relevant sections) and open Design Lab baseline _(skip if `docs.design_companion` is null)_. Map files. Check conflicts.

5.5 **State Scan — hotspot per slice** — Resolve `STATE_SCAN_CMD` (`checks.state_scan` if set, otherwise bundled fallback at `skills/state-scan/scripts/generic-scanner.sh`) and run it with the slice's files as input. If hard_block (a file already owned by another plan in_execution): STOP slice, report to operator which plan collides, decide together (wait for plan to finish / split slice / sequence).

6. **Scope Check** — Discoveries not foreseen? If exceeds appetite → read [scope-hammer.md](references/scope-hammer.md). Report Hill Chart (GOING UP / GOING DOWN).

7. **Implement + TDD** — Business logic: RED→GREEN→REFACTOR. Schema/validator changes: write contract tests first. **If slice contains FSM, calculation, scoring, or validation logic: write PBT tests (fast-check) alongside unit tests — derive properties from spec §4.6 Test Scenarios (Given/When/Then), not from implementation.** UI: implement, Playwright if interactions are testable.

8. **Auto-Check (early exit)**
   - If slice touches schema/validators and `checks.test_schemas` exists → run it first
   - `checks.test_fast` _(if null and `test_enforcement=hard` → STOP; otherwise warn)_
   - `checks.type_check` → `checks.lint` _(skip any that are null; warn if `checks.type_check` is null)_
   - If provider: verify sandbox, not production
   - Playwright smoke (if exists)
   - Tracking: grep §11 events for this slice _(ceremony:light → skip)_
   - If UI and `docs.design_companion` is not null: validate against `docs.design_companion` + Design Lab baseline + copy in `conventions.copy_language`
   - **Regression**: re-run tests from previous slices in this wave

9. **Auto-Review** — <50 LOC: quick (security triad, tenant*id *(skip tenant*id if `conventions.multi_tenant` is false)*, sensitive data). ≥50 LOC: full via subagents (spec compliance + code quality: N+1, select() without columns, components >300 LOC).

10. **Debug** — Read error. Hypothesis. Smallest fix. 3 attempts max → STOP.

11. **Commit** — `git add` slice files. `feat({module}): {what} [wave-X/slice-Y]`. Always in English.

12. **Insights** — Spec gap? Dependency? Security? → `paths.insights`. _(ceremony:light → skip)_

13. **Saturation** — If threshold → commit, generate handoff (`docs.handoff_template` or simple fallback), STOP.

### Wave End

14. **Cross-slice smoke** — Re-run tests from ALL slices in the wave + `checks.test_full` (fallback: `checks.test`).

15. **SEC Gate** — Run `checks.security_scan`. **Exit code != 0 → fix violations before proceeding.** Warnings are informational. Wave does not advance to human checklist with open violations. _(Skip entirely if `checks.security_scan` is null; warn "no security scan configured")_ _(ceremony:light → skip)_

16. **Human Checklist** — Read [wave-checklist-template.md](references/wave-checklist-template.md). Generate with hill chart, data, must-have, nice-to-have.

17. **Tracking** — Read [tracking-checklist-template.md](references/tracking-checklist-template.md). List events. _(ceremony:light → skip)_

18. **Release** — If medium+ (or ceremony:full for any class): prepare release package (`docs.release_checklist`, `docs.release_approval`). _(Skip if `docs.release_checklist` is null; warn "no release checklist configured")_

19. **Handoff** — Generate handoff using `docs.handoff_template`. _(If null → generate simple handoff: what's done, what's next, blockers.)_ The handoff MUST include a **Test Evidence** section with: `command_run`, `result_summary`, `tests_added`, `tests_updated`, `regression_rerun`, `remaining_manual_checks`, `uncovered_risk`. If `quality.implementation_pilot.enabled` is true, also include a **Pilot Signals** section listing: blockers encountered (with category from `blocker_categories`), waivers used, spec ambiguities found, and suggested skill adjustments. If final wave: plan → `status: completed`.

20. **STOP** — Operator tests via `docs.review_protocol`. _(If null → use default test protocol: operator manually tests each must-have item from checklist.)_ Next wave only with approval.

## Expected Output

- Code committed
- Human checklist + tracking checklist _(tracking only if ceremony != light)_
- Handoff document
- `paths.insights` updated (if applicable)
- Release package for medium+ (if applicable and `docs.release_checklist` exists)
- Plan with status updated

## Built-in Discipline

- Step 7 already implies RED → GREEN → REFACTOR. Do not skip the failing-test phase.
- Step 7 PBT rule: for any slice with business logic (FSM, money, scoring, validation), at least 2 property-based tests are required alongside example tests. Properties come from spec §4.6 Test Scenarios (Given/When/Then), not from looking at the implementation. See `docs/platform/TESTING.md §11`.
- Step 10 is the built-in debugging loop: read error, form hypothesis, apply smallest fix, stop after 3 attempts.
- Before reporting a wave complete, rerun the concrete verification commands from Steps 8, 14, and 15 in the same session.

## Operator Handoff

- Wave complete → operator tests (`docs.review_protocol` or default protocol)
- Medium+ → `docs.release_approval` before production (if configured)
- Before push/PR, run `/feature-verify`

## References

- [wave-checklist-template.md](references/wave-checklist-template.md) — Step 16
- [tracking-checklist-template.md](references/tracking-checklist-template.md) — Step 17
- [scope-hammer.md](references/scope-hammer.md) — when stuck (Step 6)
- [red-flags.md](references/red-flags.md) — if suspecting degradation
- [common-mistakes.md](references/common-mistakes.md) — if something seems wrong
