---
name: feature-verify
description: Use after feature-code and before push or PR to run a final technical verification gate with auto-fix loops, release-safety checks, and a go/no-go integration decision.
---

# Feature Verify

Executes the final technical verification gate before pushing a branch or opening a PR.
This step does not replace wave approval or release approval. It validates that the branch is technically safe for integration.

## Step 0 — Load Project Manifest

Read `project.yaml` from the repository root.
If not found → **STOP. Cannot run feature-verify without a project manifest.**

Extract and bind:

- `docs.*` → document paths (all nullable)
- `checks.*` → command strings (all nullable)
- `conventions.*` → project conventions
- `ceremony` → verification depth: `"full"` | `"standard"` | `"light"` | `"auto"`

When `ceremony` is `"auto"` or absent, infer from `change_class`:

- `low` risk → `"light"`
- `medium` risk → `"standard"`
- `high` / `critical` risk → `"full"`

## When to Use

- A wave or relevant adjustment was just implemented in `/feature-code`.
- There is intent to push, PR, or local merge.
- There is doubt whether the current diff is ready for integration.

## When Not to Use

- No approved spec/plan.
- In the middle of implementing an unstable slice.
- Without minimal context on risk and regression set.

## Required Inputs

- Path to the approved plan and associated spec.
- Target comparison branch (`main` or equivalent base branch).
- Current change safety state (`change_class`, `risk_tier`, `blast_radius`, `regression requirements`).
- `docs.change_safety` — if available
- `docs.security` (especially agent/LLM and fail-secure sections if applicable) — if available
- `docs.security_checklist` (domains relevant to the change_class — load before Step 5) — if available
- `docs.release_checklist` — if available
- `docs.release_approval` (for medium+) — if available
- `docs.review_protocol` — if available
- `docs.design_companion` when there are UI changes — if available
- Design Lab baseline when there are UI changes — if applicable
- `docs.design_system` when there are UI changes — if available

## Hard Gates

- No approved artifacts (`spec` and `plan`) → STOP.
- No fresh verification evidence (same session) → STOP.
- If medium+ without minimum release package (and `docs.release_checklist` is defined) → STOP.
- If UI change without validation against design docs (when `docs.design_companion` and/or `docs.design_system` are defined and `conventions.design_lab` is true) → STOP.
- Do not approve push/PR with an open blocker.
- **`checks.security_scan` with exit code != 0 → STOP (red).** Violations must be fixed before any status other than red. _(Skip gate if `checks.security_scan` is null — warn "no security scan configured — manual review required")_
- **Spec security section without coherent ASVS v5 mapping for change_class on medium+ → STOP (red).** _(Skip if `docs.security_checklist` is null — basic security only)_
- **`ai_security_helpers_required` in plan with helpers absent in code → STOP (red).** _(Only when `agent-tool` is in change classes)_

## Ceremony Levels

### CI entrypoint preference

When `checks.ci` is set, use it as the primary verification command for `"standard"` and `"full"` ceremony. It consolidates lint + type-check + test + build into one auditable pass.

- **`"standard"` or `"full"`** without `checks.ci` defined → **red / blocked** "no CI entrypoint configured — add checks.ci to project.yaml".
- **`"light"`** does not require `checks.ci`.

### `"light"`

Run only: `checks.type_check` + `checks.lint` + `checks.test`.
Skip: security scan, ASVS, lethal trifecta, UI validation, release safety.
Decision: simple green/red based on checks passing. No detailed report — just pass/fail summary.

### `"standard"`

Full procedure. ASVS evidence gate only for medium+ risk tiers. Prefer `checks.ci` when set.

### `"full"`

Everything mandatory including ASVS for all risk levels. Prefer `checks.ci` when set.

## Procedure

### 1. Pre-flight

Confirm artifact state, diff scope, and risk tier.

### 2. Baseline diff scan

Compare against base branch and map affected files by category: logic, schema, provider, auth, UI.

### 3. Run technical checks

**When `checks.ci` exists (standard/full ceremony):**
Run `checks.ci` as the primary technical gate. It consolidates lint, type-check, test, build, and env-aware lanes into one pass. If `checks.ci` exits non-zero → `red`.

Then run supplemental checks NOT covered by `checks.ci`:

- `checks.security_scan` — **exit code 0 required for any status other than red.** If exit != 0, record violations and go directly to Decision Report as `red`. If null → warn "no security scan configured — manual review required".

**When `checks.ci` is absent (light ceremony, or missing from manifest):**
Run individual checks:

- `checks.type_check` — if null, skip and warn
- `checks.lint` — if null, skip and warn
- `checks.test` — if null and `test_enforcement=hard`, STOP
- `checks.build` — if null, skip and warn
- `checks.security_scan` — same rules as above

### 3.5 State Scan — evidence gate (audit)

Resolve `STATE_SCAN_CMD`:

- if `checks.state_scan` is set → use it verbatim
- otherwise → use the bundled fallback scanner at `skills/state-scan/scripts/generic-scanner.sh`

When available:

- In `feature-create-spec`: Step 0.5 (similarity) AND Step 4.5 (collision) must have been run.
- In `feature-review-spec`: Step 2.5 (full + drift) must have been run.
- If no evidence (no log in handoff, no hits documented in spec): register as **yellow finding** "state-scan missing in critical step — operator must run manually before push: `STATE_SCAN_CMD`"
- Does not block push if other checks are green, but alerts operator.
- Additionally: run `STATE_SCAN_CMD drift --module {module-from-spec-or-plan}` to confirm documented drift still matches code (new drift = yellow).

### 4. Run targeted regression

Execute the regression set defined in the plan and smoke tests for the main affected path.

**Critical journey check:** If the diff touches a journey listed in `quality.critical_journeys` (from `project.yaml`), verify that a smoke or regression test covers it. If no automated coverage exists for the affected journey → register as **yellow finding** with the specific journey name.

**PBT coverage check:** If the diff includes business logic (FSM, calculations, scoring, validators), verify that `*.pbt.test.ts` or PBT `describe` blocks exist for those modules. Enforcement depends on whether the business logic is new/modified vs untouched legacy:

- **New or modified** business logic in the current diff AND `conventions.test_enforcement = "hard"` → missing PBT is a **red finding** "PBT required for new/modified business logic in {file}" (blocks push).
- **Untouched legacy** business logic outside the current diff → missing PBT is a **yellow finding** "PBT missing for legacy business logic in {file}" (operator decides).
  See `docs/platform/TESTING.md §11`.

### 5. Safety review

Structured security review by sub-steps:

#### 5.1. ASVS Evidence Gate

**Skip if `docs.security_checklist` is null.** Warn "no security checklist — basic security review only".

When available: Load `docs.security_checklist` domains mapped to the plan's `change_class`. For each ASVS control cited in the spec's security section (level derived from `docs.change_safety`): verify evidence (test reference, implemented code path, or explicit operator waiver with justification).

- If no ASVS control cited in the spec's security section for medium+ → `red`.
- If control cited without evidence → register as yellow finding.

**Ceremony gate:** In `"standard"` mode, only enforce for medium+ risk tiers. In `"full"` mode, enforce for all levels.

#### 5.2. Lethal Trifecta (if `change_class` includes `agent-tool`)

**Skip entirely if `agent-tool` is not in change classes.**
**If `docs.security` is null:** Still check the 3 questions conceptually, but warn "no security doc reference — applying trifecta check from first principles".

- (a) Does the agent have access to private tenant data?
- (b) Is the agent exposed to untrusted external content (user input, webhook, scraped content)?
- (c) Does the agent have an outbound channel (HTTP, email, MCP tool that writes)?
- If 3/3 true → mandatory human gate before release. Register as `red` if gate does not exist in the plan.

#### 5.3. AI Helpers Gate (if `ai_security_helpers_required` in plan)

**Skip entirely if `agent-tool` is not in change classes.**

For each declared helper (`maskForLLM`, `sanitizePrompt`, etc.): verify it exists in code AND is used in relevant LLM/MCP calls. Absent → `red`.

#### 5.4. Standard safety checks

- Tenant isolation — **skip if `conventions.multi_tenant` is false**
- Auth triad
- Provider sandbox vs production
- Migration safety
- Tracking
- Observability

### 6. UI verification (when applicable)

**Skip if `docs.design_companion` is null AND `conventions.design_lab` is false.** Warn "no design docs configured — skipping UI verification".

When available: Validate adherence to `docs.design_companion`, Design Lab baseline, `docs.design_system`, responsiveness rules, copy contract per `conventions.copy_language`, and accessibility requirements for the flow.

### 7. Auto-fix loop

When the problem is technical and unambiguous, fix it, re-run checks, and update evidence. Limit of 3 cycles per issue.

### 8. Escalation rule

If there is product ambiguity, risk trade-off, or recurring failure after 3 cycles, stop and escalate for operator decision.

### 9. Decision report

Read `references/verify-report-template.md` and publish final decision.

The report language MUST follow `conventions.conversation_language`. Default: English.

The report MUST include:

- Final status (`green|yellow|red`)
- `checks.security_scan` result: violations count + warnings count _(or "N/A — not configured" if null)_
- ASVS coverage of change*class: controls with evidence / total required *(or "N/A — no security checklist" if null)\_
- Lethal trifecta status (N/A if not agent-tool; or result 0/3 / 1/3 / 2/3 / **3/3→BLOCKED**)
- Issues found and automatic corrections performed
- Pending items requiring human decision
- Final recommendation: `push`, `PR`, or `block`

**Pilot Assessment** (when `quality.implementation_pilot.enabled` is true):

- If this is within the first N runs (`implementation_pilot.first_n_runs`): instruct the operator to log the run in `implementation_pilot.log_path` using the template.
- If any blocker category from `implementation_pilot.blocker_categories` appeared, list it.
- If any threshold from `implementation_pilot.thresholds` is reached (same issue ≥2x across runs): emit finding "skill/process adjustment recommended: {category}".

For each violation/warning in the report, use exact instruction format:

```
❌ {check} — `{file}:{line}`: {problem description}
   → Fix: {exact instruction — file, line, what to add/change}
   → Reference: {relevant doc section}
```

Never use generic language ("review this file"). Without file:line + specific fix → do not report as violation, report as "verify manually".

## Expected Output

- Verification report with:
  - Final status (`green|yellow|red`)
  - Checks executed with summarized evidence
  - Security scan result + ASVS coverage + lethal trifecta status
  - Issues found and automatic corrections performed
  - Pending items requiring human decision
  - Final recommendation: `push`, `PR`, or `block`

## Companion Skills

- `verification-before-completion`
- `systematic-debugging`
- `test-driven-development` (when fix requires a new test)

## Operator Handoff

- `green`: safe to push/PR.
- `yellow`: operator decides whether to accept pending items with known risk.
- `red`: return to `/feature-code` (or `/feature-review-spec` if the problem is specification-level).

## References

- Template: `references/verify-report-template.md`
- Common mistakes: `references/common-mistakes.md`
- All document references loaded dynamically from `project.yaml` → `docs.*`
