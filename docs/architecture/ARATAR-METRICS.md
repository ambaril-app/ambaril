# Aratar Metrics — Agent Quality Monitoring (T16)

> Track and alert on AI development pipeline quality.

## Purpose

Measure the quality, cost, and reliability of the Aratar agent ecosystem so we can detect regressions early, control spend, and improve the pipeline over time.

## What to Track

| Metric                     | Source                                         | Why                                        |
| -------------------------- | ---------------------------------------------- | ------------------------------------------ |
| Agent rejection rate       | Nienna RED/YELLOW per agent per module         | Detect agents producing low-quality output |
| Quality debt               | Count of YELLOW findings not yet fixed         | Prevent debt accumulation                  |
| Sprint velocity            | Tasks completed per sprint, avg time per task  | Measure throughput trends                  |
| Cost per sprint            | Tokens consumed, API cost (OpenRouter billing) | Budget control                             |
| Safety gate blocks         | Count and type of blocked commands             | Detect unsafe patterns                     |
| Schema drift               | Output of schema validation script             | Catch unintended DB changes                |
| Test coverage trend        | Test count per module over time                | Ensure coverage grows with code            |
| Context overflow incidents | Gateway crashes or context compactions         | Identify prompt engineering issues         |

## Storage Format

Lightweight daily JSONL files in `~/logs/aratar-metrics/`. JSONL is greppable, appendable, and requires no database.

```
~/logs/aratar-metrics/
  2026-04-24-rejections.jsonl
  2026-04-24-sprints.jsonl
  2026-04-24-costs.jsonl
  2026-04-24-safety.jsonl
```

### Rejection Record

```jsonl
{"ts":"2026-04-24T14:32:00Z","agent":"aule","module":"catalog","severity":"RED","finding":"Missing tenant_id filter in product query","task":"T08"}
{"ts":"2026-04-24T14:35:00Z","agent":"ulmo","module":"orders","severity":"YELLOW","finding":"No index on orders.created_at used in export query","task":"T13"}
```

### Sprint Record

```jsonl
{
  "ts": "2026-04-24T18:00:00Z",
  "sprint": "S03",
  "tasks_completed": 6,
  "tasks_planned": 8,
  "avg_minutes_per_task": 47,
  "agents": {
    "aule": 3,
    "ulmo": 2,
    "yavanna": 1
  }
}
```

### Cost Record

```jsonl
{
  "ts": "2026-04-24T18:00:00Z",
  "sprint": "S03",
  "total_tokens": 1842000,
  "prompt_tokens": 1200000,
  "completion_tokens": 642000,
  "cost_usd": 11.4,
  "model": "claude-sonnet-4-20250514",
  "provider": "openrouter"
}
```

### Safety Record

```jsonl
{"ts":"2026-04-24T10:15:00Z","agent":"aule","command":"rm -rf /","action":"blocked","gate":"destructive_command","task":"T08"}
{"ts":"2026-04-24T11:22:00Z","agent":"ulmo","command":"git push --force origin main","action":"blocked","gate":"force_push_main","task":"T13"}
```

## Alert Thresholds

| Condition        | Threshold                            | Action                                               |
| ---------------- | ------------------------------------ | ---------------------------------------------------- |
| Rejection rate   | > 30% for any agent in a sprint      | Alert — investigate agent prompt or task scoping     |
| Quality debt     | > 10 open YELLOWs                    | Alert — schedule debt reduction sprint               |
| Sprint cost      | > $15                                | Alert — review model selection and prompt efficiency |
| Schema drift     | Any unplanned diff detected          | Alert — block deploy until reviewed                  |
| Test coverage    | Decreasing for 2 consecutive sprints | Warning — review test discipline                     |
| Context overflow | > 3 incidents per sprint             | Alert — refactor agent context strategy              |

## Integration Points

| Agent                          | Writes                      | When                                            |
| ------------------------------ | --------------------------- | ----------------------------------------------- |
| **Nienna**                     | `*-rejections.jsonl`        | After each code review cycle                    |
| **Manwe**                      | `*-sprints.jsonl`           | At sprint close                                 |
| **Varda**                      | Weekly aggregation report   | End of week (reads all JSONL, produces summary) |
| **Safety gate** (CEO Protocol) | `*-safety.jsonl`            | On every blocked command                        |
| **Schema validator**           | Triggers schema drift alert | On each migration run                           |

### Writing a Record (Bash)

```bash
echo '{"ts":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'","agent":"aule","module":"catalog","severity":"RED","finding":"Missing index","task":"T08"}' \
  >> ~/logs/aratar-metrics/$(date -u +%Y-%m-%d)-rejections.jsonl
```

### Writing a Record (TypeScript — from agent code)

```ts
import { appendFileSync } from "fs";
import { resolve } from "path";

function logMetric(category: string, data: Record<string, unknown>) {
  const date = new Date().toISOString().slice(0, 10);
  const file = resolve(
    process.env.HOME!,
    `logs/aratar-metrics/${date}-${category}.jsonl`,
  );
  const record = { ts: new Date().toISOString(), ...data };
  appendFileSync(file, JSON.stringify(record) + "\n");
}
```

## Querying

Simple bash scripts using `grep` and `jq`.

### Rejection rate for an agent in a date range

```bash
cat ~/logs/aratar-metrics/2026-04-2*-rejections.jsonl \
  | jq -r 'select(.agent == "aule") | .severity' \
  | sort | uniq -c | sort -rn
```

### Total cost this week

```bash
cat ~/logs/aratar-metrics/2026-04-2*-costs.jsonl \
  | jq -s '[.[].cost_usd] | add'
```

### Open quality debt (YELLOWs not fixed)

```bash
# Assumes a "fixed" field is added when resolved
cat ~/logs/aratar-metrics/*-rejections.jsonl \
  | jq -r 'select(.severity == "YELLOW" and (.fixed // false) == false) | .finding'
```

### Safety blocks by type

```bash
cat ~/logs/aratar-metrics/*-safety.jsonl \
  | jq -r '.gate' \
  | sort | uniq -c | sort -rn
```

## Dashboard (Future)

Not in scope for this sprint. Options for later:

- **Simple HTML page**: Reads JSONL via a lightweight API, renders charts with Chart.js
- **Grafana**: Push JSONL data to a Prometheus-compatible endpoint
- **Varda weekly digest**: Markdown summary posted to a shared channel

## Directory Bootstrap

```bash
mkdir -p ~/logs/aratar-metrics
```

This directory should be created on the VPS during initial setup. It is gitignored — metrics are local to the deployment environment.
