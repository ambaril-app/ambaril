---
name: feature-implement
description: Use when an approved spec needs to be broken into waves and vertical slices before coding starts. Triggers on implementation planning, wave decomposition, or converting a spec into an execution plan.
---

# Feature Implement

Transforms an approved spec into an executable plan organized by waves and vertical slices. Converts WHAT into HOW.

## When to Use

- Spec `status: approved`
- Ready to break into executable chunks

## When Not to Use

- Spec does not exist → `/feature-create-spec`
- Spec needs validation → `/feature-review-spec`
- Plan exists and ready → `/feature-code`

## Required Inputs

- Spec with `status: approved` — if not → STOP, `/feature-review-spec`
- `project.yaml` at the project root
- Current code and provider state

## Hard Gates

- Spec without `approved` → STOP
- Wave 0 mandatory when external data is involved
- Max 5 slices/wave, max 5 files/slice (adjustable by ceremony — see below)
- UI slice: max 1 primary surface / 1 archetype per slice. If multiple screens need touching to "close the design", split.
- No-Gos from the pitch must not appear in slices
- Medium+ without complete Execution Readiness → STOP before `/feature-code`

## Procedure

### Step 0 — Load Project Manifest

Read `project.yaml` from the project root.

- If not found → **STOP**: _"No `project.yaml` found. Run `/feature-plan` to initialize your project first."_

Parse the manifest and resolve all paths/configs used in subsequent steps. Store:

- `CEREMONY` ← `ceremony` value (default: `"standard"` if missing or `"auto"`)
- `LANG_CONV` ← `conventions.conversation_language` (default: `"en"`)
- `LANG_COPY` ← `conventions.copy_language` (default: `"en"`)
- `DESIGN_LAB` ← `conventions.design_lab` (default: `false`)
- `SAFETY_CLASSES` ← `conventions.change_safety_classes` (default: `[]`)

### Ceremony gate

| Value        | Behavior                                                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"light"`    | Max 3 slices/wave. Skip ownership map. Skip rabbit hole pass. Simplified gates (1 operator check per wave). Skip Execution Readiness for risk_tier `low`. |
| `"standard"` | Full procedure. Max 5 slices/wave, max 5 files/slice.                                                                                                     |
| `"full"`     | Full procedure **plus** mandatory Execution Readiness for ALL change classes (not just medium+).                                                          |
| `"auto"`     | If appetite ≤ 2 weeks → `"light"`. If appetite ≤ 6 weeks → `"standard"`. If > 6 weeks → `"full"`.                                                         |

**Language:** Use `LANG_CONV` for all conversation. Plan output: executive summary in `LANG_COPY`, technical content in English.

---

### Step 1 — Context

Read available docs from the manifest. For each key below, read the file **only if the value is not null**:

| Manifest key            | Purpose                              |
| ----------------------- | ------------------------------------ |
| `docs.architecture`     | Project architecture / gold standard |
| `docs.design_companion` | Design system / companion doc        |
| `docs.change_safety`    | Change safety classes and rules      |
| `docs.artifact_state`   | Artifact state definitions           |
| `docs.testing_strategy` | Testing strategy / enforcement model |

Read the spec. Check schema, providers, and reusable code.

**If there is UI** and `{manifest:docs.design_companion}` is not null:

- Open the corresponding Design Lab baseline before breaking into slices.
- If `DESIGN_LAB` is true: verify which archetype applies.

**If `{manifest:docs.design_companion}` is null:** skip all Design Lab references silently.

---

### Step 2 — Appetite Check

Verify appetite in spec §1. No appetite → STOP.

---

### Step 3 — Extract Journeys

From §2: role, complexity (simple ~20min / medium ~30min / complex ~45min), dependencies, priority.

---

### Step 3.5 — State Scan: file ownership

Resolve `STATE_SCAN_CMD`:

- if `{manifest:checks.state_scan}` is set → use it verbatim
- otherwise → use the bundled fallback scanner at `skills/state-scan/scripts/generic-scanner.sh`

**If CEREMONY is `"light"`:** skip this step.

**Otherwise:** For the likely files each wave will touch (extract from each slice), run:
`STATE_SCAN_CMD files --input "{path1,path2,...}"`

- If `{manifest:checks.state_scan_cwd}` is set, run the command from that directory.

When plans are in-flight from other features, this step detects conflicts. Findings enter as `risk note` in the corresponding wave.

---

### Step 4 — Organize Waves

Wave 0 first (data foundation, no UI). Waves 1-N: 3-5 slices (3 max if CEREMONY is `"light"`), dependencies, critical paths first, reads before writes.

**Wave 0 testing foundation:** When the module touches critical areas (`auth-tenant`, `financial-fiscal`, `schema-migration`, `agent-tool`), Wave 0 must include setup for: test fixtures/seeds for the domain, mock/stub configuration if external providers are involved (with justification), audit log verification helpers if the module emits audit events, and a smoke test for the primary journey.

---

### Step 5 — Detail Slices

Read [plan-template.md](references/plan-template.md). For each slice:

- Journey, role, complexity, files, contracts, accessibility, time.
- Declare `new_tests`, `updated_tests`, `regression_tests_to_rerun`, `manual_checks`, `observability_assertions`, `not_automated_because`, `residual_risk`.
- Declare `fast_gate` and `full_gate` commands.

**If there is UI** and `{manifest:docs.design_companion}` is not null:

- Declare `archetype`, Design Lab baseline, primary role, primary action, and states covered by the slice.
- If `DESIGN_LAB` is false or null: skip archetype/baseline declaration.

**Ownership map:** Generate per wave. Flag file conflicts across slices.

- If CEREMONY is `"light"`: skip ownership map.

---

### Step 6 — Regression Set

For waves after Wave 0: list tests from previous waves that must be re-run before the human checklist.

---

### Step 7 — Rabbit Hole Pass (per wave)

**If CEREMONY is `"light"`:** skip this step entirely.

**Otherwise**, 6 checks per wave:

1. Unknown tech?
2. Risky integration?
3. Decision not yet made?
4. Cross-module dependency?
5. Disguised scope?
6. **If `"agent-tool"` is in `SAFETY_CLASSES`:** lethal trifecta present? prompt injection vector? exfiltration channel possible?

   **If `"agent-tool"` is NOT in `SAFETY_CLASSES`:** skip check 6.

Confirm No-Gos have not reappeared.

---

### Step 8 — Gates

Verification gate per wave: prerequisites, manual tests (device + comparison + criteria), what NOT to test.

If CEREMONY is `"light"`: simplified gate — 1 operator check per wave.

---

### Step 9 — Execution Readiness

**If CEREMONY is `"light"` and risk_tier is `low`:** skip this step.

**If `{manifest:docs.change_safety}` is not null:** full Execution Readiness block:

- change class, risk tier, blast radius, regression, release, rollback, observability.
- `asvs_level_target` — derived from change_class via the change safety doc.
- `ai_security_helpers_required` — mandatory list IF `"agent-tool"` is in `SAFETY_CLASSES` AND change_class includes `agent-tool` (e.g., `["maskForLLM", "sanitizePrompt"]`). If those helpers don't exist in code → Wave 0 of helpers is a prerequisite before any slice.

**If `{manifest:docs.change_safety}` is null:** simplified Execution Readiness:

- risk tier + regression requirements only.
- Skip ASVS mapping, skip blast radius analysis, skip rollback strategy.
- Warn the operator: "No change-safety doc configured — Execution Readiness is simplified."

**If CEREMONY is `"full"`:** Execution Readiness is mandatory for ALL change classes (not just medium+).

---

### Step 10 — Save

Save to `{manifest:paths.plans}/{module-slug}/{feature-slug}.md` with `status: draft`.
The plan must include a `State Scan Ownership Index` section listing every file claimed by each slice.

(If `{manifest:paths.plans}` is null, ask the operator where plans should be saved.)

Indicate: `/feature-code {path}`.

## Expected Output

- Plan at `{manifest:paths.plans}/` with `status: draft`

## Companion Skills

- None required

## Operator Handoff

- Approved plan → `/feature-code {path}`

## References

- [plan-template.md](references/plan-template.md) — load when detailing slices (Step 5)
- [common-mistakes.md](references/common-mistakes.md) — consult if the result seems weak
- Change safety: `{manifest:docs.change_safety}` — if available
- Artifact lifecycle: `{manifest:docs.artifact_state}` — if available

## Conditional Checks Summary

| Manifest key                        | If null/missing                                                                                                | Effect                                |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `docs.design_companion`             | Skip all Design Lab / UI baseline references                                                                   | No archetype checks                   |
| `conventions.design_lab`            | Skip archetype/baseline in slice detail                                                                        | No Design Lab cross-ref               |
| `checks.state_scan`                 | Use bundled fallback scanner                                                                                   | Conflict detection stays available    |
| `docs.change_safety`                | Simplified Execution Readiness (risk tier + regression only)                                                   | No ASVS, no blast radius, no rollback |
| `conventions.change_safety_classes` | If `"agent-tool"` not listed, skip lethal trifecta in rabbit hole pass and skip `ai_security_helpers_required` | No agent-tool checks                  |
| `docs.architecture`                 | Skip architecture read in Step 1                                                                               | Context may be incomplete             |
| `docs.artifact_state`               | Skip artifact state read in Step 1                                                                             | No lifecycle reference                |
