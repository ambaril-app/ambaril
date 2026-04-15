---
name: feature-fix
description: Use when a bug needs fixing without the full pitch-bet-spec-plan pipeline. Triggers on bug reports, broken behavior, regressions, or production incidents that need a targeted fix.
---

# Feature Fix

Lightweight path for bug fixes. Skips shaping, betting, and full spec — goes straight from bug report to verified fix with a mini-spec for traceability.

## Step 0 — Load Manifest

Read `project.yaml` from the project root. **If not found → STOP.** All paths, commands, and conventions below resolve from this manifest.

```
paths:      specs
checks:     type_check, lint, test, build, security_scan, state_scan, state_scan_cwd
conventions: copy_language, conversation_language, multi_tenant
```

**Ceremony is always `"light"` for fixes** — regardless of what `project.yaml` declares. Fixes are inherently scoped and should not carry full-ceremony overhead.

Language: Use `conventions.conversation_language` for all conversation. Commit messages always in English.

## When to Use

- Something is broken in production or staging
- A regression was introduced by a recent change
- Behavior doesn't match the spec
- A user reported a bug with reproduction steps

## When Not to Use

- The "bug" is actually a missing feature → `/feature-plan`
- The fix requires changing the spec → `/feature-review-spec` first, then come back
- The fix touches more than 5 files → this isn't a fix, it's a feature. Use the full pipeline.
- Root cause is unclear after investigation → `/feature-plan` to shape the solution properly

## Required Inputs

- Bug description: what's broken (user-facing behavior)
- Expected behavior: what should happen
- Reproduction steps: how to trigger the bug (or "unable to reproduce" with context)

## Hard Gates

- **Max 5 files changed.** If the fix requires more, STOP — this is not a bug fix. Use `/feature-create-spec` → `/feature-implement` → `/feature-code`.
- **3 consecutive errors → STOP.** Ask for help. The bug may be deeper than expected.
- **No spec modification allowed.** If the spec is wrong, that's a separate issue — file it in `paths.insights` and use `/feature-review-spec`.
- **No new tables, no new routes, no new permissions.** If the fix needs these, it's a feature.

## Procedure

### Step 1 — Bug Report

Operator describes the bug. Capture:

- **What's broken:** User-facing symptom
- **Expected behavior:** What should happen instead
- **Reproduction:** Steps to trigger
- **Affected module:** Which module owns this behavior
- **Severity:** `critical` (data loss / security / blocking) | `high` (broken flow, workaround exists) | `low` (cosmetic / edge case)

If severity is `critical`: note that this fix should be prioritized and deployed as soon as verified.

### Step 2 — Targeted State Scan

Resolve `STATE_SCAN_CMD`:

- if `checks.state_scan` is set → use it verbatim
- otherwise → use the bundled fallback scanner at `skills/state-scan/scripts/generic-scanner.sh`

Run `STATE_SCAN_CMD drift --module {affected-module}` to check whether the spec and code are aligned in the affected area.

If `checks.state_scan_cwd` is set, run from that directory.

Possible outcomes:

- **No drift:** Bug is likely an implementation error. Proceed.
- **Drift detected:** Report drift findings to operator. The bug may stem from spec-code misalignment. Operator decides: fix the code to match spec, or flag for `/feature-review-spec` first.

### Step 3 — Mini-Spec

Read [fix-template.md](references/fix-template.md). Generate a 3-section document:

1. **Problem** — What's broken, from the user's perspective. Include reproduction steps.
2. **Fix approach** — What to change, technically. List specific files and the nature of each change.
3. **Regression risk** — What could break as a side effect. Define the test plan to cover it.

Save to `{paths.specs}/{module}/fix-{slug}.md` with frontmatter:

```yaml
---
status: approved
type: fix
severity: { critical | high | low }
module: { module }
owner: { operator }
source: bug-report
---
```

Status is `approved` immediately — fixes don't need a review cycle. The mini-spec exists for traceability, not for gatekeeping.

### Step 4 — Implement with TDD

Write the fix using RED → GREEN → REFACTOR:

1. **RED** — Write a failing test that reproduces the bug. If the bug is not unit-testable (UI-only, timing, environment), document why and proceed without a red test. **If the bug involves business logic (FSM, calculation, validation): also write a PBT property that would have caught this class of bug** (e.g., "margin is never negative", "status never goes backwards"). This prevents the entire class of bug, not just this instance.
2. **GREEN** — Implement the minimal fix that makes the test pass.
3. **REFACTOR** — Clean up only what the fix touched. Do not refactor adjacent code.

After implementation, run available checks:

- `checks.type_check` — if null, skip and warn
- `checks.lint` — if null, skip and warn
- `checks.test` — if null, skip and warn

If any check fails: fix it. 3 attempts max per issue → STOP.

### Step 5 — Quick Verify

Simplified verification — no ASVS, no lethal trifecta, no UI validation, no release package.

Run available checks:

- `checks.type_check` — pass/fail/skipped
- `checks.lint` — pass/fail/skipped
- `checks.test` — pass/fail/skipped
- `checks.build` — pass/fail/skipped
- `checks.security_scan` — pass/fail/skipped (if null, skip and warn)

**Report format:**

```
Fix Verify: {module} / fix-{slug}
─────────────────────────────────
Severity: {critical | high | low}
Files changed: {N}/5

Checks:
  Type check:     {pass | fail | skipped}
  Lint:           {pass | fail | skipped}
  Tests:          {pass | fail | skipped}
  Build:          {pass | fail | skipped}
  Security scan:  {pass | fail | skipped}

Result: {GREEN — safe to commit | RED — fix before committing}
Failing checks: {list, if any}
```

- All available checks pass → GREEN. Proceed to commit.
- Any check fails → RED. Fix and re-verify. 3 attempts max → STOP.

### Step 6 — Commit

Stage only the files touched by the fix (max 5).

Commit message format: `fix({module}): {what was broken}`

Examples:

- `fix(erp): inventory count not updating after manual adjustment`
- `fix(plm): color swatch rendering blank on Safari`
- `fix(auth): session not clearing on tenant switch`

Always in English.

## Expected Output

- Mini-spec at `{paths.specs}/{module}/fix-{slug}.md` with `status: approved`
- Bug fix committed with passing checks
- Quick verify report (green/red)

## Built-in Discipline

- Step 4 is mandatory RED → GREEN → REFACTOR.
- If the root cause is not obvious, use the same small-hypothesis debug loop described in `feature-code`.
- Before declaring the fix complete, rerun the quick verify commands from Step 5 in the same session.

## Operator Handoff

- GREEN verify → operator tests the fix manually, then pushes
- RED verify after 3 attempts → escalate. Consider whether this is actually a feature, not a fix.
- Spec drift detected in Step 2 → operator decides: fix code or update spec via `/feature-review-spec`

## References

- [fix-template.md](references/fix-template.md) — template for the mini-spec (Step 3)
