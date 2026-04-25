# Ambaril — Codex Workflow Contract

This file is the Codex-first operating contract for the Shape Up workflow in this repository.

## Core Rules

- Operator-facing conversation, summaries, and checklists are in PT-BR.
- Code symbols, filenames, database entities, route segments, and internal IDs stay in English.
- The canonical skill family is `feature-*`. Source of truth: `.claude/skills/feature-*` plus `.claude/skills/state-scan`.
- Published consumers are synced from that source via `scripts/sync-consumers.sh` into `.agents/skills/feature-*`, `../.agents/skills/feature-*`, `~/.agents/skills/feature-*`, and `~/.claude/skills/feature-*`.
- Workflow rule changes must be applied to the canonical `.claude/skills/*` copy first, then propagated with `scripts/sync-consumers.sh`.
- `GOLD-STANDARD.md` is the permanent methodology source.
- `IMPLEMENTATION.md` is a catalog of possible bets, not a committed backlog.
- `docs/modules/` contains durable module context and long-lived module documentation.
- `docs/pitches/`, `docs/cycles/`, `docs/specs/`, and `docs/plans/` are operational artifacts for the feature skills.

## Canonical Skill Order

1. `/feature-plan` (`feature-plan`)
2. `/feature-evaluate-plan` (`feature-evaluate-plan`)
3. `/feature-create-spec` (`feature-create-spec`)
4. `/feature-review-spec` (`feature-review-spec`)
5. `/feature-implement` (`feature-implement`)
6. `/feature-code` (`feature-code`)
7. `/feature-verify` (`feature-verify`)

Do not skip stages unless the required artifact already exists and was approved.

## Legacy Aliases (deprecated — removed from repo 2026-04-15)

The `flow-*` skill family (`flow-01-shape` through `flow-06-spec-execute`) was removed. Use the canonical `/feature-*` family. The short aliases `shape`, `bet`, `spec-create`, `spec-review`, `spec-implement`, `spec-code` still work as invocations but resolve to `feature-*` skills.

## Hard Gates

- No appetite: no shaping decision, no spec, no implementation.
- No approved bet: no new spec.
- No approved spec: no implementation plan.
- No approved plan: no wave execution.
- No `feature-verify` green decision: no push/PR.
- No risk tier, blast radius, regression set, and rollback path: no medium+ execution.
- No real data for the target module: no UI-first implementation.
- No operator review at wave boundary: not done.
- If UI is involved, no execution without `DESIGN.md` (LLM-optimized tokens) + `DS.md` + relevant Design Lab baseline.

## Artifact Map

- `DESIGN.md` — Google spec design tokens, YAML frontmatter + 8 sections, read for all UI work

- `docs/pitches/YYYY-MM-DD-{slug}.md`
- `docs/cycles/YYYY-MM-DD.md`
- `docs/specs/{module-slug}/{feature-slug}.md`
- `docs/plans/{module-slug}/{feature-slug}.md`
- `INSIGHTS.md`

## Required References Before Execution

- `GOLD-STANDARD.md`
- `CLAUDE.md`
- `DESIGN.md` (LLM-optimized design tokens — Google spec format, YAML frontmatter + 8 sections) when UI is involved
- `DS.md` when UI is involved
- `apps/web/src/app/(admin)/admin/design-lab/*` matching page when UI is involved
- `docs/dev/CHANGE-SAFETY.md`
- `docs/dev/ARTIFACT-STATE.md`
- `docs/dev/HANDOFF-TEMPLATE.md`
- `docs/dev/RELEASE-CHECKLIST.md`
- `docs/dev/MIGRATION-SAFETY.md` when schema changes are involved
- `docs/dev/RELEASE-APPROVAL.md` for medium+ changes
- `docs/architecture/*` and `docs/platform/*` as needed by the module
- `docs/dev/REVIEW-PROTOCOL.md` before human review checklists

## Artifact Status Rules

- Every pitch, cycle, spec, and plan must declare `status`.
- Allowed statuses: `draft`, `active`, `approved`, `blocked`, `superseded`, `in_execution`, `completed`.
- `parked` is a legacy term and is not a valid status in this workflow.
- Execution may only consume specs and plans marked `approved`.
- Cycles may stay `active` until cycle closing.
- If an artifact supersedes another, it must point to the prior artifact explicitly.

## Change Safety Rules

- Every spec and plan must classify change safety for the work.
- Minimum fields for medium+ changes:
  - `change_class`
  - `risk_tier`
  - `blast_radius`
  - `regression_requirements`
  - `release_strategy`
  - `rollback_strategy`
  - `observability_checks`
- Wave approval is not the same as release approval.

## Operator Experience Standard

- Ask for one decision at a time when clarification is required.
- Prefer explicit recommendations, not open loops.
- Report blockers as hard gates, not soft suggestions.
- At the end of each stage, point to the next skill by official `/feature-*` name.
