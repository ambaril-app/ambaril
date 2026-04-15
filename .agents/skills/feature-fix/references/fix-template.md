# Fix: {module} / {slug}

---

status: approved
type: fix
severity: {critical | high | low}
module: {module}
owner: {operator}
source: bug-report

---

## Problem

{What's broken, from the user's perspective.}

**bug_trigger:** {exact input or sequence that causes the bug}
**expected_behavior:** {what should happen instead}
**related_journey:** {which critical journey is affected, from project.yaml quality.critical_journeys}

**Reproduction:**

1. {Step 1}
2. {Step 2}
3. {Observe: what happens vs. what should happen}

**Affected area:** {module} — {specific screen, flow, or function}

## Fix Approach

**fix_strategy:** {one sentence: what the fix does at a technical level}
**root_cause:** {one sentence explaining why the bug exists}

| File             | Change                |
| ---------------- | --------------------- |
| `{path/to/file}` | {what to fix and why} |

## Regression Risk

**regression_target:** {existing tests or areas that must be re-verified after the fix}

**failing_test:** {the RED test that reproduces the bug — file:name or "not unit-testable: {reason}"}

**Test plan:**

- [ ] {Fast gate command that must pass}
- [ ] {RED test that reproduces the bug, then passes after fix}
- [ ] {Test that adjacent behavior still works}
- [ ] {PBT property if business logic — see feature-fix Step 4}
- [ ] {Test edge case if applicable}
