# Implementation Plan: {Module Or Feature Name}

---

status: draft
owner: {name}
source_artifact: {spec path}
approved_by: pending
supersedes: null

---

## Executive Summary

> {2-4 sentences in copy_language. What each wave delivers for the business. Zero jargon.}

## Overview

- **Spec:** {path}
- **Appetite:** {1-2 weeks | 6 weeks}
- **Total waves:** {N}
- **Total slices:** {X}
- **Sessions estimated:** {Y}
- **Provider dependencies:** {list}
- **Baseline comparison:** {current tool}
- **Design baseline (if UI):** `{manifest:docs.design_companion}` + {Design Lab path / N/A}

## Execution Readiness

- **Change class:** {class}
- **Risk tier:** {tier}
- **Blast radius:** {affected}
- **Regression requirements:** {what to test}
- **Release strategy:** {strategy}
- **Rollback strategy:** {path}
- **Observability checks:** {signals}
- **Final integrator:** {who validates multi-agent output}

---

## Wave 0: Data Foundation

### Slice 0.1: {Name}

- **Journey:** {1 sentence}
- **Role:** {who}
- **Complexity:** simple | medium | complex
- **Files:** {files}
- **Contracts:** {schema, action, endpoint}
- **new_tests:** {tests to add for this slice}
- **updated_tests:** {existing tests to modify}
- **regression_tests_to_rerun:** {tests from previous slices | none}
- **manual_checks:** {what operator must verify by hand}
- **observability_assertions:** {logs/events/metrics this slice emits}
- **not_automated_because:** {if any check is manual, explain why}
- **residual_risk:** {what this slice does NOT cover yet}
- **Fast gate:** {command}
- **Full gate:** {command}
- **Time:** ~{20|30|45} min

### Rabbit Holes — Wave 0

- {risk and decision}

### Verification Gate — Wave 0

1. [ ] {operator check}

---

## Wave 1: {Theme}

### Slice 1.1: {Name}

- **Journey:** {1 sentence}
- **Role:** {who}
- **Complexity:** {level}
- **Files:** {paths}
- **Contracts:** {changes}
- **new_tests:** {tests to add}
- **updated_tests:** {tests to modify}
- **regression_tests_to_rerun:** {list}
- **manual_checks:** {operator verification}
- **observability_assertions:** {logs/events/metrics}
- **not_automated_because:** {justification for manual checks}
- **residual_risk:** {uncovered areas}
- **Fast gate:** {command}
- **Full gate:** {command}
- **Accessibility:** {if UI: labels, ARIA, touch targets}
- **UI baseline:** {archetype + Design Lab path + primary action + states — if design_companion is set}
- **Time:** ~{20|30|45} min

### Ownership Map — Wave 1

| File   | Slice Owner |
| ------ | ----------- |
| {path} | Slice 1.1   |

### Regression Set — Wave 1

- Re-run: {tests from Wave 0 that must pass}

### Rabbit Holes — Wave 1

- [ ] Unknown tech? | Risky integration? | Pending decision? | Fragile dependency? | Disguised scope?

### Verification Gate — Wave 1

1. [ ] {device + compare + criteria}

---

## Constraints

- Max 5 slices/wave, 5 files/slice (3 slices/wave if ceremony "light")
- Wave 0 never skipped when external data
- No-Gos from pitch absent
- Medium+ requires complete Execution Readiness (all classes if ceremony "full")

## State Scan Ownership Index

### Wave 0 / Slice 0.1

- `{path/to/file-a}`

### Wave 1 / Slice 1.1

- `{path/to/file-b}`
- `{path/to/file-c}`
