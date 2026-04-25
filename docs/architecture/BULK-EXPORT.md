# Bulk Export — Async Job Pattern (T13)

> Async export of orders, products, and contacts to CSV/XLSX.

## Problem

Vercel serverless functions have a **300-second timeout**. Large exports (50K+ rows) cannot be streamed synchronously within this window. A synchronous approach would also block the function instance and degrade performance for other requests.

## Solution: Async Job → Object Storage → Presigned URL

```
POST /api/v1/exports → 202 { jobId }
  ↓
Background worker processes job (cron / Inngest)
  ↓ streams rows in batches of 1000
  ↓ writes CSV/XLSX to Vercel Blob (or R2)
  ↓ updates job status
  ↓
GET /api/v1/exports/:id → { status, url, progress }
```

## API

### Create Export

```
POST /api/v1/exports
Content-Type: application/json

{
  "resource": "orders" | "products" | "contacts",
  "filters": { ... },          // same filter shape as list endpoints
  "format": "csv" | "xlsx",    // default: csv
  "columns": ["id", "name", "created_at"]  // optional subset
}

→ 202 Accepted
{
  "id": "exp_abc123",
  "status": "pending",
  "createdAt": "2026-04-24T12:00:00Z"
}
```

### Check Export Status

```
GET /api/v1/exports/:id

→ 200 OK
{
  "id": "exp_abc123",
  "status": "processing",       // pending | processing | ready | expired | failed
  "resource": "orders",
  "format": "csv",
  "processedRows": 34000,
  "totalRows": 52000,
  "url": null,                  // presigned URL, null until ready
  "expiresAt": null,            // URL expiry timestamp
  "createdAt": "2026-04-24T12:00:00Z"
}
```

When `status === "ready"`:

```json
{
  "id": "exp_abc123",
  "status": "ready",
  "processedRows": 52000,
  "totalRows": 52000,
  "url": "https://blob.vercel-storage.com/exports/...",
  "expiresAt": "2026-04-24T13:00:00Z"
}
```

## Job Lifecycle

| Status       | Meaning                                              |
| ------------ | ---------------------------------------------------- |
| `pending`    | Job created, waiting for worker pickup               |
| `processing` | Worker is streaming rows and writing to blob storage |
| `ready`      | File is uploaded, presigned URL is available         |
| `expired`    | Presigned URL has expired (1 hour after ready)       |
| `failed`     | Worker encountered an error (logged, retryable)      |

## Limits

| Limit                             | Value      | Reason                                           |
| --------------------------------- | ---------- | ------------------------------------------------ |
| Max rows per export               | 100,000    | Safety limit to prevent runaway queries          |
| Presigned URL expiry              | 1 hour     | Security — short-lived access                    |
| File retention                    | 24 hours   | Cron deletes expired files to save storage costs |
| Max concurrent exports per tenant | 3          | Prevent abuse and resource hogging               |
| Batch size (DB reads)             | 1,000 rows | Balance between query count and memory usage     |

## Background Worker

The worker runs as either a **Vercel Cron** job or an **Inngest** function (preferred for retries and observability).

```ts
// inngest/functions/process-export.ts
export const processExport = inngest.createFunction(
  { id: "process-export", retries: 3 },
  { event: "export/created" },
  async ({ event, step }) => {
    const job = event.data;

    await step.run("stream-and-upload", async () => {
      await updateExportStatus(job.id, "processing");

      const stream = createExportStream(job);
      const blob = await uploadToVercelBlob(stream, job);

      await updateExportStatus(job.id, "ready", {
        url: blob.url,
        expiresAt: addHours(new Date(), 1),
      });
    });
  },
);
```

### Streaming Rows

```ts
async function* streamRows(job: ExportJob) {
  let offset = 0;
  const batchSize = 1000;

  while (offset < job.totalRows) {
    const rows = await db
      .select()
      .from(targetTable(job.resource))
      .where(
        and(
          eq(targetTable(job.resource).tenantId, job.tenantId),
          ...buildFilters(job.filters),
        ),
      )
      .limit(batchSize)
      .offset(offset);

    if (rows.length === 0) break;

    for (const row of rows) {
      yield formatRow(row, job.format, job.columns);
    }

    offset += batchSize;
    await updateExportProgress(job.id, offset);
  }
}
```

## Formats

- **CSV** (default): Streamed directly. Lightweight, universal.
- **XLSX** (optional): Use a streaming XLSX library (e.g., `ExcelJS` in streaming mode) to avoid loading the entire file in memory.

## Tenant Isolation

1. Export job record includes `tenant_id` set from the server-side session at creation time.
2. All database queries within the worker filter by `tenant_id`.
3. The presigned URL is scoped to a tenant-specific blob path: `exports/{tenant_id}/{job_id}.csv`.
4. `GET /api/v1/exports/:id` validates that the requesting user's `tenant_id` matches the job's `tenant_id`.

## Rate Limiting

Before creating an export, check:

```ts
const activeExports = await db
  .select({ count: count() })
  .from(exports)
  .where(
    and(
      eq(exports.tenantId, session.tenantId),
      inArray(exports.status, ["pending", "processing"]),
    ),
  );

if (activeExports[0].count >= 3) {
  return NextResponse.json(
    { error: "Max 3 concurrent exports. Wait for one to finish." },
    { status: 429 },
  );
}
```

## Cleanup

A daily cron job deletes exports older than 24 hours:

```ts
// app/api/cron/cleanup-exports/route.ts
export async function GET() {
  const cutoff = subHours(new Date(), 24);

  const expired = await db
    .select()
    .from(exports)
    .where(lt(exports.createdAt, cutoff));

  for (const job of expired) {
    if (job.blobUrl) await deleteFromVercelBlob(job.blobUrl);
    await db.delete(exports).where(eq(exports.id, job.id));
  }

  return NextResponse.json({ deleted: expired.length });
}
```

## UI Progress Bar

The frontend polls `GET /api/v1/exports/:id` every 2-3 seconds while `status` is `pending` or `processing`. The `processedRows / totalRows` ratio drives the progress bar.

```ts
// Polling hook
function useExportProgress(jobId: string) {
  const { data } = useSWR(`/api/v1/exports/${jobId}`, fetcher, {
    refreshInterval: (data) =>
      data?.status === "ready" || data?.status === "failed" ? 0 : 3000,
  });
  return data;
}
```
