---
name: state-scan
description: Use when proposing or reviewing feature slugs, tables, routes, permissions, events, providers, references, file ownership, or spec-vs-code drift in the feature pipeline.
---

# State Scan

Sub-routine of the `feature-*` skills. Detects structural collisions (duplicate tables, routes, permissions, events), slug conflicts, cross-module references, file ownership overlaps, and spec-vs-code drift.

**This skill is never invoked directly by the operator.** It is called by `feature-plan`, `feature-create-spec`, `feature-review-spec`, `feature-implement`, `feature-code`, and `feature-verify` at their respective gates.

## Scanner Resolution

The skill resolves which scanner to run from `project.yaml`:

1. If `checks.state_scan` has a value — use that command verbatim (custom scanner).
2. If `checks.state_scan` is null — use the **generic fallback scanner** bundled inside this skill at `skills/state-scan/scripts/generic-scanner.sh`.
3. If `checks.state_scan_cwd` has a value — `cd` into that directory before running the scanner.

```
# Custom scanner (project provides its own)
checks:
  state_scan: "bash scripts/state-scan.sh"
  state_scan_cwd: "apps/web/"

# Generic fallback (no custom scanner)
checks:
  state_scan: null          # skill uses skills/state-scan/scripts/generic-scanner.sh
  state_scan_cwd: null      # runs from project root
```

When using the generic fallback, the skill constructs the command as:

```
bash {feature-lifecycle-root}/skills/state-scan/scripts/generic-scanner.sh <mode> [args...]
```

The working directory is `checks.state_scan_cwd` if set, otherwise the project root.

## How to Run

Always run the scanner command via bash from the resolved working directory. Parse the JSON from stdout. Never read scanner internals or index files directly.

1. Parse the JSON output from stdout.
2. **Exit 1**: `hard_block` detected. STOP and surface all hits to the operator.
3. **Exit 0 + hits**: warning (near-match, provider already used, drift found).
4. **Exit 0 + empty hits**: clear, no issues.
5. **Exit 2**: internal error. STOP and report the exact stderr to the operator.

## Modes

| Mode               | Arguments                              | Purpose                                                               |
| ------------------ | -------------------------------------- | --------------------------------------------------------------------- |
| `similarity`       | `--slug X --module Y`                  | Check if a slug/module already exists or nearly matches               |
| `tables`           | `--input "name1,name2"`                | Collision check on table names across specs                           |
| `routes`           | `--input "GET /api/foo,POST /api/bar"` | Collision check on route definitions                                  |
| `perms`            | `--input "module:resource:action"`     | Collision check on permission identifiers                             |
| `events`           | `--input "module.event_name"`          | Collision check on event names                                        |
| `providers`        | `--input "provider1,provider2"`        | Check if a provider is already declared by another module             |
| `refs`             | `--target M --from N`                  | Cross-module reference check (does N declare a ref to M?)             |
| `files`            | `--input "path1,path2"`                | File ownership check vs in-flight plans                               |
| `drift`            | `--module M`                           | Spec vs code drift report for one module                              |
| `all`              | `--spec-file PATH`                     | Run tables+routes+perms+events+providers for one spec, excluding self |
| `refresh-if-stale` | _(none)_                               | Rebuild index if stale (custom scanners only; no-op for generic)      |

## Output Format

All modes output a single JSON object to stdout. Errors and diagnostics go to stderr.

### Standard output structure

```json
{
  "mode": "tables",
  "input_count": 2,
  "hit_count": 1,
  "hits": [
    {
      "id": "orders",
      "kind": "tables",
      "owner": "erp",
      "source": "docs/specs/erp/orders.md",
      "status": "approved",
      "severity": "hard_block"
    }
  ],
  "exit": 1
}
```

### Fields

| Field         | Type   | Description                       |
| ------------- | ------ | --------------------------------- |
| `mode`        | string | The scan mode that was run        |
| `input_count` | number | How many identifiers were checked |
| `hit_count`   | number | Number of collisions/findings     |
| `hits`        | array  | Each hit object (see below)       |
| `exit`        | number | Exit code (mirrors process exit)  |

### Hit object

| Field      | Type   | Values                                                                                         |
| ---------- | ------ | ---------------------------------------------------------------------------------------------- |
| `id`       | string | The identifier that matched                                                                    |
| `kind`     | string | `tables`, `routes`, `perms`, `events`, `providers`, `slug-exact`, `slug-near`, `drift`, `refs` |
| `owner`    | string | Module that owns the colliding identifier                                                      |
| `source`   | string | File path where the identifier was found                                                       |
| `status`   | string | Status of the owning spec (`draft`, `approved`, `in_execution`, etc.)                          |
| `severity` | string | `hard_block` or `warning`                                                                      |

### Mode-specific output variations

**`similarity`** adds `slug` and `module` fields at the top level.

**`drift`** uses a different structure:

```json
{
  "mode": "drift",
  "module": "erp",
  "in_code_not_spec": ["extra_table"],
  "in_spec_not_code": ["missing_table"],
  "exit": 0
}
```

**`all`** wraps sub-results:

```json
{
  "mode": "all",
  "spec_file": "docs/specs/erp/orders.md",
  "module": "erp",
  "self_excluded": true,
  "checks": {
    "tables": { ... },
    "routes": { ... },
    "perms": { ... },
    "events": { ... },
    "providers": { ... }
  },
  "hit_count": 0,
  "hits": [],
  "exit": 0
}
```

**`refs`** returns a `declared` boolean:

```json
{
  "mode": "refs",
  "from": "crm",
  "target": "erp",
  "declared": 1,
  "exit": 0
}
```

**`refresh-if-stale`** returns status:

```json
{
  "mode": "refresh-if-stale",
  "status": "ok",
  "exit": 0
}
```

## Exit Codes

| Code | Meaning                      | Skill behavior                                       |
| ---- | ---------------------------- | ---------------------------------------------------- |
| 0    | Clear or warning-only        | Continue; surface warnings to operator if hits exist |
| 1    | Hard block (exact collision) | STOP; surface hits and wait for operator decision    |
| 2    | Internal error               | STOP; report stderr to operator                      |

## Integration with feature-\* Skills

Each `feature-*` skill calls state-scan at specific gates:

| Skill                 | Step | Mode                                               | Purpose                                            |
| --------------------- | ---- | -------------------------------------------------- | -------------------------------------------------- |
| `feature-plan`        | 5.5  | `similarity`                                       | Slug conflict check before saving pitch            |
| `feature-create-spec` | 0.5  | `similarity`                                       | Slug conflict check before writing spec            |
| `feature-create-spec` | 4.5  | `tables`, `routes`, `perms`, `events`, `providers` | Structural collision check after approach approved |
| `feature-review-spec` | 2.5  | `all`, `drift`                                     | Cross-module scan + code drift detection           |
| `feature-implement`   | 3.5  | `files`                                            | File ownership check for planned waves             |
| `feature-code`        | 5.5  | `files` (per slice)                                | Hotspot check before implementing each slice       |
| `feature-verify`      | 3.5  | _(evidence gate)_                                  | Verify that prior scans were run; run drift check  |

### Ceremony interaction

| Ceremony     | Behavior                                                   |
| ------------ | ---------------------------------------------------------- |
| `"light"`    | Skip all state-scan gates                                  |
| `"standard"` | Run all applicable gates                                   |
| `"full"`     | Run all applicable gates (same as standard for state-scan) |

### When `checks.state_scan` is null

Skills that call state-scan still run the state-scan gate:

- The skill resolves to the bundled generic fallback scanner.
- The generic scanner parses markdown specs from `paths.specs` and ownership indexes from `paths.plans`.
- If those directories do not exist yet, the scanner returns empty results (exit 0, no hits) with a note.

## Custom Scanner Contract

Projects that need richer scanning (e.g., scanning code schemas, maintaining an index file) can provide a custom scanner. The custom scanner must:

1. Accept the same CLI interface: `<mode> [args...]`
2. Output valid JSON to stdout (same schema as above)
3. Send diagnostics/errors to stderr only
4. Exit with codes 0, 1, or 2 as defined above
5. Support all 11 modes (can return empty results for unimplemented modes)

See `state-scan/interface.md` for the full contract specification.
