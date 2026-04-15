---
name: feature-plan
description: Use when a rough idea needs shaping into a Shape Up pitch before any spec or code. Triggers on new ideas, appetite uncertainty, scoping doubts, or the start of a new functional area.
---

# Feature Plan

Transforms a rough idea into a Shape Up pitch. Output is a decision artifact, not a spec. Purpose: decide whether and how much to invest.

## When to Use

- New idea with nebulous scope
- Appetite not yet defined
- Enough rabbit holes to make a spec premature
- Evaluating whether something enters the next `/feature-evaluate-plan`

## When Not to Use

- Approved pitch already exists -> `/feature-create-spec`
- Feature < 1 day with clear appetite -> use the `approval_path: direct` variant of this skill, then `/feature-create-spec`
- Just discussing/researching -> no skill needed

## Required Inputs

- Business problem described (1-3 sentences)
- Who feels the pain
- Current tool or process
- If a prior pitch exists, it must have `status: draft` or not exist (`parked` is a legacy term, not a valid status)

## Hard Gates

- No appetite defined at the end -> STOP
- Solution doesn't fit the appetite -> simplify solution, don't increase appetite
- Appetite `unknown` is not a valid output — resolve it or recommend not proceeding

## Procedure

### Step 0 — Load Project Manifest

Read `project.yaml` from the project root.

- If found: load all paths, docs, checks, and conventions into context. These are referenced below as `{manifest:section.key}`.
- If not found: enter **Bootstrap Mode** (see section below).

Resolve **ceremony level** from `{manifest:ceremony}`:

- If `"auto"` or not set: use `"standard"` for most pitches; use `"full"` if the idea involves tech the project has never used.
- Ceremony affects which steps are mandatory vs. skipped (noted per step below).

Resolve **languages:**

- Conversation language: `{manifest:conventions.conversation_language}` (default: English)
- Output artifact language: `{manifest:conventions.copy_language}` (default: English)

### Step 1 — Context

Read the following docs from the manifest (skip any that are null or absent):

| Manifest key                     | Purpose                              |
| -------------------------------- | ------------------------------------ |
| `{manifest:docs.architecture}`   | Project architecture / gold standard |
| `{manifest:docs.implementation}` | Implementation guidelines            |
| `{manifest:docs.change_safety}`  | Change safety classes and rules      |
| `{manifest:docs.artifact_state}` | Artifact state definitions           |

Check related modules in the project.

**If the idea has relevant UI surface** and `{manifest:docs.design_companion}` is not null:

- Read the design companion doc at `{manifest:docs.design_companion}`.
- If `{manifest:conventions.design_lab}` is true: verify whether a corresponding archetype already exists in the Design Lab before proposing a new layout.

**If `{manifest:docs.design_companion}` is null:** skip all UI/design checks silently.

### Step 2 — Research (optional, max 30 min)

**Ceremony "light": skip this step entirely.**

**Ceremony "full": mandatory** if the solution involves any API/library/pattern never used in this project.

**Ceremony "standard": optional.** If the solution involves an API/library/pattern never used, research limits, auth, edge cases. Output: 3-5 bullets. Skip if only using tech already implemented.

### Step 3 — Problem

Define who suffers, current workaround, consequence.

Format: "[PERSONA] currently [WORKAROUND] when [SCENARIO]. This causes [PROBLEM]. Without a solution, [CONSEQUENCE]."

(Write this in the language defined by `{manifest:conventions.copy_language}`.)

### Step 4 — Appetite

Ask the operator: "How much time is this worth right now?" Small Batch (1-2 weeks) or Big Batch (6 weeks). Appetite is a constraint, not an estimate.

### Step 5 — Solution Rough

Breadboarding in text. No schema, wireframes, or routes. Ask: "Is there a simpler version?"

**If there is UI** and `{manifest:docs.design_companion}` is not null: explicitly record whether the feature reuses an existing archetype (`dashboard`, `table`, `form`, `detail`, etc.) or genuinely requires a new pattern.

### Step 5.5 — State Scan (similarity check)

Resolve `STATE_SCAN_CMD`:

- if `{manifest:checks.state_scan}` is set → use it verbatim
- otherwise → use the bundled fallback scanner at `skills/state-scan/scripts/generic-scanner.sh`

**Ceremony "light": skip this step.**

**Otherwise:** After the solution rough, run `STATE_SCAN_CMD similarity --slug {proposed-slug} --module {target-module}`.

- If `{manifest:checks.state_scan_cwd}` is set, run the command from that directory.
- If hard_block (slug-exact): warn the operator "There's a pitch/module Y with the same name — do you want to merge or continue as new?"
- If near-match: list findings and ask for a decision.

Do not block the pitch (it's still a decision), just inform.

### Step 6 — Rabbit Hole Hunt

**Ceremony "light": simplified hunt — 3 checks only:**

1. Unknown tech risk?
2. Undecided dependency on another module?
3. Disguised scope?

For each: ELIMINATE | OUT OF SCOPE | ACCEPT CONSCIOUSLY

**Ceremony "standard" / "full": full hunt — 5+ checks:**

1. Unknown tech? | 2. Risky integration? | 3. Decision not yet made? | 4. Dependency on another module? | 5. Disguised scope?

If the idea has UI and `{manifest:docs.design_companion}` is not null:

- Unnecessary new pattern? Drift from the Design Lab? Visual slice too large?

For each: ELIMINATE | OUT OF SCOPE | ACCEPT CONSCIOUSLY

### Step 7 — No-Gos

Features that this version will NOT have. Specific names.

### Step 8 — Safety Hint

If the pitch touches auth, tenant isolation, migrations, providers, financial, or fiscal concerns: record a Change Safety Hint.

**If `{manifest:docs.change_safety}` is null:** warn the operator "No change-safety doc configured — recording hint without class validation."

**If `agent-tool` is listed in `{manifest:conventions.change_safety_classes}`** and the pitch involves LLM/MCP/prompt/SDK work: declare explicitly in the hint that this pitch will need `maskForLLM`, `sanitizePrompt`, lethal trifecta check, and the security domains from `{manifest:docs.security_checklist}`.

**If `agent-tool` is NOT in `{manifest:conventions.change_safety_classes}`:** skip agent-tool specific advice.

**If `{manifest:docs.security_checklist}` is null:** skip security checklist reference.

### Step 9 — Save

Read [pitch-template.md](references/pitch-template.md).

Default save behavior:

- `standard` / `full` → save with `status: draft` and `approval_path: cycle`
- `light` + feature is clearly <1 day + operator explicitly wants to skip betting → save with `status: approved` and `approval_path: direct`

Save the pitch to `{manifest:paths.pitches}/{YYYY-MM-DD}-{slug}.md`.

(If `{manifest:paths.pitches}` is null, ask the operator where pitches should be saved.)

## Bootstrap Mode

If `project.yaml` is not found at the project root:

1. Inform the operator: "No project.yaml found. I'll ask a few questions to set up your project."

2. Ask sequentially:
   - **Project name** — What's the project called?
   - **Project type** — (e.g., SaaS, mobile app, CLI tool, library, monorepo)
   - **Language** — Primary programming language / framework
   - **Copy language** — What language should artifacts (pitches, specs) be written in? (default: English)
   - **Has UI?** — Does this project have a user-facing interface? (determines whether design checks apply)
   - **Multi-tenant?** — Is this a multi-tenant system? (affects safety hints)

3. Generate a minimal `project.yaml`:

```yaml
project:
  name: "{answer}"
  type: "{answer}"
  language: "{answer}"

paths:
  pitches: "docs/pitches"
  specs: "docs/specs"
  plans: "docs/plans"
  cycles: null
  insights: null
  handoffs: null

docs:
  architecture: null
  implementation: null
  change_safety: null
  artifact_state: null
  design_companion: null # set if has UI
  security_checklist: null

checks:
  state_scan: null
  state_scan_cwd: null

conventions:
  copy_language: "{answer}"
  conversation_language: "{answer}"
  multi_tenant: { true|false }
  design_lab: false
  change_safety_classes: []

ceremony: "standard"
```

4. Save to project root and inform the operator: "Created project.yaml with defaults. You can fill in doc paths and checks later. Continuing with the pitch."

5. Continue with Step 1 using the generated manifest (most doc/check values will be null, so those steps will be skipped with warnings).

## Expected Output

- Pitch at `{manifest:paths.pitches}/` with:
  - `status: draft`, `approval_path: cycle`, or
  - `status: approved`, `approval_path: direct` for the light direct-spec path

## Companion Skills

- None required

## Operator Handoff

- Pitch ready with `approval_path: cycle` -> `/feature-evaluate-plan`
- Pitch ready with `approval_path: direct` -> `/feature-create-spec`
- Appetite undefined -> do not proceed
- Rabbit hole too open -> research more

## References

- [pitch-template.md](references/pitch-template.md) — load when generating output (Step 9)
- [common-mistakes.md](references/common-mistakes.md) — consult if the result seems weak
