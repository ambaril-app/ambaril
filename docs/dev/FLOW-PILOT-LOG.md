# Flow Pilot Log

> Tracking the first `quality.implementation_pilot.first_n_runs` real implementations through the `feature-*` lifecycle to detect friction and suggest adjustments.
>
> When `quality.implementation_pilot.enabled` is true, `feature-code` handoffs include a `Pilot Signals` section and `feature-verify` reports include a `Pilot Assessment`.
>
> **Threshold alerts:** If the same blocker/waiver/finding/manual-check appears `≥2` times across runs, a skill/process adjustment is recommended.

---

## Run Template

Copy this block for each implementation run:

```markdown
### Run N — {module} / {feature}

| Field        | Value                     |
| ------------ | ------------------------- |
| date         | YYYY-MM-DD                |
| module       | {module}                  |
| feature      | {feature name or slug}    |
| spec_path    | {path to spec}            |
| plan_path    | {path to plan}            |
| handoff_path | {path to handoff}         |
| change_class | {class}                   |
| risk_tier    | {tier}                    |
| ceremony     | {light / standard / full} |

**Commands run:**

- `{command}` → {pass / fail / skip}

**Tests:**

- added: {list or "none"}
- updated: {list or "none"}

**Blockers encountered:**

- {category}: {description} — {resolved / waived / escalated}

**Waivers used:**

- {what was waived and why}

**Auto-fix loops:**

- {count} loops in feature-code Step 10 / feature-verify Step 7

**Manual checks remaining:**

- {what operator must verify by hand}

**Uncovered risk:**

- {what is not tested yet and why}

**Spec ambiguities found:**

- {what was unclear in the spec and how it was resolved}

**Suggested skill adjustment:**

- {what should change in the feature-\* skills based on this run, or "none"}
```

---

## Runs

_(entries will be added as real implementations are executed)_
