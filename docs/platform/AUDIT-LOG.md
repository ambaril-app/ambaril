# AUDIT-LOG.md -- Global Audit Log System

> Ambaril (Ambaril) audit log architecture and implementation.
> Last updated: 2026-03-17

---

## 1. Scope

### What Gets Logged

Every state-changing operation in the system produces an audit log entry.

| Category                   | Examples                                                                                    | Logged |
| -------------------------- | ------------------------------------------------------------------------------------------- | ------ |
| **Data mutations**         | CREATE, UPDATE, DELETE on any table across all 15 modules                                   | Yes    |
| **Authentication events**  | Login (success and failure), logout, session expiry, password change, password reset        | Yes    |
| **Permission changes**     | Role assignment, role removal, permission grant, permission revoke                          | Yes    |
| **NF-e emissions**         | NF-e creation, authorization, cancellation, correction letter                               | Yes    |
| **Financial transactions** | Payment received, refund issued, chargeback, payout to creator, B2B invoice                 | Yes    |
| **Setting changes**        | Any change to system settings, module configuration, integration credentials (value masked) | Yes    |
| **Data exports**           | LGPD data export requests, CSV/report exports                                               | Yes    |
| **Bulk operations**        | Bulk status updates, bulk deletions, bulk imports                                           | Yes    |
| **Consent changes**        | Consent granted, consent revoked                                                            | Yes    |
| **Integration events**     | Webhook received (Mercado Pago, Melhor Envio, WhatsApp), API key rotation                   | Yes    |

### What Does NOT Get Logged

| Category                                      | Reason                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Read operations**                           | Too high volume; would overwhelm storage. Access control is enforced at the application layer.                      |
| **Search queries**                            | Not state-changing. Search analytics are handled by the Analytics module separately.                                |
| **Health check requests**                     | Automated monitoring noise (`GET /api/health`).                                                                     |
| **SSE (Server-Sent Events) connections**      | Connection lifecycle is not a data mutation. Real-time event payloads are already logged as their source mutations. |
| **Static asset requests**                     | Handled by CDN (Cloudflare). Not application-level events.                                                          |
| **Background job internal state transitions** | Job queue has its own lifecycle tracking. Only the business outcome of a job (e.g., "NF-e emitted") is logged.      |

---

## 2. Schema

The audit log table lives in the `global` schema. Full schema is defined in `DATABASE.md`; this section provides the complete reference.

### Table: `global.audit_logs`

```sql
CREATE TABLE global.audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id         UUID REFERENCES global.users(id),       -- NULL for system/webhook actions
    user_role       TEXT,                                     -- Role at time of action (denormalized)
    action          TEXT NOT NULL CHECK (action IN (
                        'create', 'update', 'delete',
                        'login', 'login_failed', 'logout',
                        'export', 'import',
                        'permission_change',
                        'consent_change',
                        'nfe_emission', 'nfe_cancellation',
                        'setting_change',
                        'bulk_operation'
                    )),
    resource_type   TEXT NOT NULL,                            -- e.g., 'erp.orders', 'crm.contacts'
    resource_id     UUID,                                     -- NULL for bulk operations or login events
    module          TEXT NOT NULL,                            -- e.g., 'erp', 'crm', 'financial', 'auth'
    changes         JSONB,                                    -- {before: {...}, after: {...}} for updates
    ip_address      INET,
    user_agent      TEXT,
    request_id      TEXT,                                     -- Correlation ID from request header
    metadata        JSONB DEFAULT '{}'::jsonb,               -- Additional context (e.g., bulk count, export format)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_audit_logs_timestamp ON global.audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_module ON global.audit_logs(module);
CREATE INDEX idx_audit_logs_resource_type ON global.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_user_id ON global.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON global.audit_logs(action);
CREATE INDEX idx_audit_logs_request_id ON global.audit_logs(request_id);
CREATE INDEX idx_audit_logs_resource_lookup ON global.audit_logs(resource_type, resource_id);

-- Composite index for common query patterns
CREATE INDEX idx_audit_logs_module_timestamp ON global.audit_logs(module, timestamp DESC);
CREATE INDEX idx_audit_logs_user_timestamp ON global.audit_logs(user_id, timestamp DESC);
```

### Field Details

| Field           | Type             | Description                                                                                                                                                                                                                             |
| --------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | UUID             | Unique identifier for the audit entry.                                                                                                                                                                                                  |
| `timestamp`     | TIMESTAMPTZ      | When the action occurred. Server-side, not client-supplied.                                                                                                                                                                             |
| `user_id`       | UUID (nullable)  | The user who performed the action. NULL for system-initiated actions (cron jobs, webhooks, automated processes).                                                                                                                        |
| `user_role`     | TEXT (nullable)  | The user's role at the time of action (e.g., `admin`, `operator`, `creator`). Denormalized to preserve historical accuracy even if the role changes later.                                                                              |
| `action`        | TEXT (enum)      | The type of action performed. See enum values in schema above.                                                                                                                                                                          |
| `resource_type` | TEXT             | The schema-qualified table or resource (e.g., `erp.orders`, `crm.contacts`, `global.settings`). For login events: `auth.session`.                                                                                                       |
| `resource_id`   | UUID (nullable)  | The ID of the specific resource affected. NULL for bulk operations, login events, or setting changes that affect multiple resources.                                                                                                    |
| `module`        | TEXT             | The module that owns this resource (e.g., `erp`, `crm`, `financial`, `fiscal`, `auth`, `catalog`, `analytics`, `dam`, `checkout`, `creators`, `b2b`, `community`, `ai`, `notifications`, `settings`).                                   |
| `changes`       | JSONB (nullable) | For `update` actions: contains `{before, after}` diff (see Section 4). For `create`: contains `{after: {...}}` with the created record. For `delete`: contains `{before: {...}}` with the deleted record. NULL for login/logout events. |
| `ip_address`    | INET (nullable)  | Client IP address. Extracted from `x-forwarded-for` header (Vercel) or direct connection.                                                                                                                                               |
| `user_agent`    | TEXT (nullable)  | Client user agent string.                                                                                                                                                                                                               |
| `request_id`    | TEXT (nullable)  | Correlation ID propagated from the incoming request (`x-request-id` header). Links this audit entry to logs, traces, and other audit entries from the same request.                                                                     |
| `metadata`      | JSONB            | Additional context. Examples: `{"bulk_count": 25}` for bulk operations, `{"export_format": "json"}` for exports, `{"nfe_number": "123456"}` for NF-e events.                                                                            |

---

## 3. Implementation Pattern

### 3.1 ORM-Level Hooks (Drizzle)

Audit logging is implemented at the ORM level using Drizzle lifecycle hooks, ensuring that every database mutation is captured regardless of which API route or service triggers it.

```typescript
// src/lib/audit/hooks.ts

import { type AuditLogEntry } from "@/types/audit";
import { auditQueue } from "@/lib/queues/audit";

/**
 * Creates a Drizzle hook wrapper that captures mutations for audit logging.
 * Attach to each table's query builder.
 */
export function withAuditLog(tableName: string, module: string) {
  return {
    $onInsert: async (ctx: {
      values: Record<string, unknown>;
      userId?: string;
    }) => {
      const entry: AuditLogEntry = {
        action: "create",
        resourceType: tableName,
        resourceId: ctx.values.id as string,
        module,
        changes: { after: sanitize(ctx.values) },
        userId: ctx.userId,
      };
      await auditQueue.add("log", entry);
    },

    $onUpdate: async (ctx: {
      before: Record<string, unknown>;
      after: Record<string, unknown>;
      userId?: string;
    }) => {
      const diff = computeDiff(ctx.before, ctx.after);
      if (Object.keys(diff.before).length === 0) return; // No actual changes

      const entry: AuditLogEntry = {
        action: "update",
        resourceType: tableName,
        resourceId: ctx.after.id as string,
        module,
        changes: diff,
        userId: ctx.userId,
      };
      await auditQueue.add("log", entry);
    },

    $onDelete: async (ctx: {
      before: Record<string, unknown>;
      userId?: string;
    }) => {
      const entry: AuditLogEntry = {
        action: "delete",
        resourceType: tableName,
        resourceId: ctx.before.id as string,
        module,
        changes: { before: sanitize(ctx.before) },
        userId: ctx.userId,
      };
      await auditQueue.add("log", entry);
    },
  };
}
```

### 3.2 Before-State Capture

For UPDATE operations, the before-state must be captured BEFORE the mutation executes.

```typescript
// Pattern for update operations:

async function updateOrder(
  orderId: string,
  data: Partial<Order>,
  userId: string,
) {
  // 1. Capture before state
  const before = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  // 2. Execute mutation
  const after = await db
    .update(orders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();

  // 3. Audit hook fires with before + after (handled by $onUpdate)
  // Or manually enqueue if not using ORM hooks:
  await auditQueue.add("log", {
    action: "update",
    resourceType: "erp.orders",
    resourceId: orderId,
    module: "erp",
    changes: computeDiff(before, after[0]),
    userId,
  });

  return after[0];
}
```

### 3.3 Async Write via BullMQ

<!-- TODO: Per ADR-012, Redis and BullMQ were eliminated from the stack.
     This section should be rewritten to use PostgreSQL queues + Vercel Cron
     (FOR UPDATE SKIP LOCKED pattern). The code examples below referencing
     bullmq and redis imports are outdated. -->

Audit log inserts are **asynchronous** to avoid slowing down the main request path. Entries are pushed to a BullMQ queue and written to the database by the worker.

```typescript
// src/lib/queues/audit.ts

import { Queue, Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { auditLogs } from "@/db/schema/global";

// Queue definition
export const auditQueue = new Queue("audit-log", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 1000, // Keep last 1000 failed for debugging
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  },
});

// Worker definition (runs on Railway/Fly.io)
export const auditWorker = new Worker(
  "audit-log",
  async (job) => {
    await processBatch(job.data);
  },
  {
    connection: redis,
    concurrency: 5,
  },
);
```

### 3.4 Batch Inserts

To minimize database write overhead, audit entries are batched before insertion.

```typescript
// src/workers/audit-batch.ts

const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 100;

let buffer: AuditLogEntry[] = [];
let flushTimer: NodeJS.Timeout | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
}

async function flush() {
  flushTimer = null;
  if (buffer.length === 0) return;

  const batch = buffer.splice(0, BATCH_SIZE);

  await db.insert(auditLogs).values(
    batch.map((entry) => ({
      userId: entry.userId,
      userRole: entry.userRole,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      module: entry.module,
      changes: entry.changes,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      requestId: entry.requestId,
      metadata: entry.metadata ?? {},
    })),
  );

  // If more entries remain, schedule another flush
  if (buffer.length > 0) {
    scheduleFlush();
  }
}

export function enqueue(entry: AuditLogEntry) {
  buffer.push(entry);
  if (buffer.length >= BATCH_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}
```

**Flush triggers:**

- Every 100ms (timer-based)
- Every 50 entries (size-based)
- Whichever comes first

This ensures audit entries are written within 100ms of creation while minimizing the number of database round-trips.

### 3.5 Request Context Propagation

Every incoming request generates (or inherits) a correlation ID that flows through to audit entries.

```typescript
// src/middleware.ts (Next.js middleware)

import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export function middleware(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? uuid();
  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);

  // Store in AsyncLocalStorage for access in audit hooks
  requestContext.run(
    {
      requestId,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    },
    () => {
      return response;
    },
  );

  return response;
}
```

---

## 4. Diff Calculation

For `update` actions, the `changes` field stores only the fields that actually changed, not the full row. This minimizes storage and makes diffs easy to read.

### Algorithm

```typescript
// src/lib/audit/diff.ts

type DiffResult = {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};

/**
 * Computes a minimal diff between two states of a record.
 * Only includes fields that changed.
 * Excludes internal fields (created_at, updated_at are included since they indicate timing).
 */
export function computeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): DiffResult {
  const diff: DiffResult = { before: {}, after: {} };

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    // Skip internal-only fields that are never meaningful in a diff
    if (key === "created_at") continue;

    const beforeVal = before[key];
    const afterVal = after[key];

    if (!deepEqual(beforeVal, afterVal)) {
      diff.before[key] = beforeVal;
      diff.after[key] = afterVal;
    }
  }

  return diff;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}
```

### Example: Order Status Change

```json
{
  "before": {
    "status": "pending",
    "updated_at": "2026-03-16T10:00:00.000Z"
  },
  "after": {
    "status": "paid",
    "updated_at": "2026-03-17T14:30:00.000Z"
  }
}
```

### Example: Contact Update (Multiple Fields)

```json
{
  "before": {
    "email": "old@example.com",
    "phone": "+5511888888888",
    "updated_at": "2026-03-10T08:00:00.000Z"
  },
  "after": {
    "email": "new@example.com",
    "phone": "+5511999999999",
    "updated_at": "2026-03-17T14:30:00.000Z"
  }
}
```

### Example: Product Creation

```json
{
  "after": {
    "id": "prod_abc123",
    "name": "Camiseta Oversized Preta",
    "sku": "CAM-OVS-PRT-M",
    "price": 14900,
    "status": "draft",
    "created_at": "2026-03-17T14:30:00.000Z"
  }
}
```

### Example: Record Deletion

```json
{
  "before": {
    "id": "seg_xyz789",
    "name": "VIP Customers",
    "contact_count": 150,
    "created_at": "2026-01-15T10:00:00.000Z"
  }
}
```

### Sensitive Data Handling

Certain fields are sanitized before being stored in the diff:

```typescript
const SENSITIVE_FIELDS = [
  "password_hash",
  "cpf",
  "access_token",
  "api_key",
  "secret_key",
  "webhook_secret",
  "bank_account",
];

function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }
  return sanitized;
}
```

For CPF specifically, the diff stores `[REDACTED]` but notes that the field changed. For password changes, only the fact that the password changed is logged, never the hash.

---

## 5. Querying and UI

### Admin Page: `/admin/audit-log`

Accessible only to users with the `admin` role. Provides a comprehensive view of all system activity.

### Filters

| Filter            | Type                      | Description                                                                                                                                                                                                |
| ----------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**          | Dropdown (searchable)     | Filter by the user who performed the action. Includes "System" for automated actions.                                                                                                                      |
| **Module**        | Multi-select              | Filter by module: `erp`, `crm`, `financial`, `fiscal`, `catalog`, `analytics`, `dam`, `checkout`, `creators`, `b2b`, `community`, `ai`, `notifications`, `settings`, `auth`.                               |
| **Resource Type** | Text input (autocomplete) | Filter by specific resource type (e.g., `erp.orders`, `crm.contacts`).                                                                                                                                     |
| **Action**        | Multi-select              | Filter by action type: `create`, `update`, `delete`, `login`, `logout`, `export`, `import`, `permission_change`, `consent_change`, `nfe_emission`, `nfe_cancellation`, `setting_change`, `bulk_operation`. |
| **Date Range**    | Date picker (start + end) | Filter by timestamp range. Defaults to last 24 hours.                                                                                                                                                      |
| **Resource ID**   | UUID input                | Look up all audit entries for a specific resource.                                                                                                                                                         |
| **Request ID**    | Text input                | Trace all actions from a single request (correlation ID).                                                                                                                                                  |

### Table View

```
+------+---------------------+--------------+--------+------------------+------------------+--------+--------+
| #    | Timestamp           | User         | Action | Resource Type    | Resource ID      | Module | Expand |
+------+---------------------+--------------+--------+------------------+------------------+--------+--------+
| 1    | 2026-03-17 14:30:02 | admin@ambaril   | update | erp.orders       | ord_abc123       | erp    |   [+]  |
| 2    | 2026-03-17 14:29:58 | system       | create | fiscal.nfe       | nfe_xyz456       | fiscal |   [+]  |
| 3    | 2026-03-17 14:28:10 | op@ambaril      | delete | crm.segments     | seg_789          | crm    |   [+]  |
+------+---------------------+--------------+--------+------------------+------------------+--------+--------+
```

### Expandable Diff Viewer

Clicking the `[+]` expand button on any row reveals the changes diff in a side-by-side or inline format:

```
 Order: ord_abc123
 -------------------------------------------------
 | Field       | Before          | After          |
 |-------------|-----------------|----------------|
 | status      | pending         | paid           |
 | updated_at  | 2026-03-16T...  | 2026-03-17T... |
 -------------------------------------------------
 IP: 189.40.xx.xx | UA: Mozilla/5.0... | Request ID: req_abc123
```

For `create` actions, only the "After" column is shown. For `delete` actions, only the "Before" column is shown.

### Export

- **CSV Export**: Filtered results exported as CSV. Columns match the table view plus the full `changes` JSON serialized.
- **JSON Export**: Full structured export with all fields, suitable for programmatic analysis.
- Export is itself logged as an audit event (`action: 'export'`, `resource_type: 'global.audit_logs'`).

### Performance

The audit log table is designed for fast querying at scale:

- **Pagination**: Cursor-based pagination using `(timestamp, id)` for consistent ordering. Page size: 50 entries.
- **Indexes**: Composite indexes on `(timestamp DESC)`, `(module, timestamp DESC)`, `(user_id, timestamp DESC)`, `(resource_type, resource_id)` ensure fast filtered queries.
- **Query timeout**: All audit log queries have a 5-second timeout to prevent slow queries from affecting the application.
- **Count estimation**: Total count uses `EXPLAIN` row estimation instead of `COUNT(*)` for large result sets.

### API Endpoints

```
GET  /api/admin/audit-logs           -- List with filters (paginated)
GET  /api/admin/audit-logs/:id       -- Single entry detail
GET  /api/admin/audit-logs/export    -- Export filtered results (CSV or JSON)
GET  /api/admin/audit-logs/stats     -- Aggregated stats (actions per module, per day)
```

---

## 6. Retention

Audit logs follow a three-phase retention strategy to balance query performance with long-term compliance.

### Phase 1: Active (0-6 months)

- **Table**: `global.audit_logs` (main table, partitioned by month)
- **Performance**: Full indexing, fast queries, real-time access.
- **Use case**: Day-to-day operations, debugging, compliance checks.

### Phase 2: Archive (6-24 months)

- **Table**: `global.audit_logs_archive` (partitioned by month)
- **Performance**: Reduced indexing (only timestamp + module + resource_type). Queries are slower but still possible.
- **Migration**: A monthly cron job moves partitions older than 6 months from the active table to the archive table.
- **Use case**: Historical investigations, legal requests, compliance audits.

### Phase 3: Delete (after 24 months)

- **Action**: Archive partitions older than 24 months are dropped.
- **Exception**: NF-e-related audit entries are retained for 5 years (moved to a separate `audit_logs_fiscal_archive` table).
- **Use case**: N/A (data is gone).

### Partitioning Strategy

The audit log table is partitioned by month using PostgreSQL declarative partitioning:

```sql
-- Parent table (already defined above, add partitioning)
CREATE TABLE global.audit_logs (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- ... all other columns ...
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (timestamp);

-- Monthly partitions (created automatically by a cron job or migration)
CREATE TABLE global.audit_logs_2026_01 PARTITION OF global.audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE global.audit_logs_2026_02 PARTITION OF global.audit_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE global.audit_logs_2026_03 PARTITION OF global.audit_logs
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- ... future partitions created by scheduled job
```

### Partition Management Job

A Vercel Cron job (`audit:partition-manager`) runs on the 1st of every month:

1. **Create next month's partition** (e.g., on March 1st, create `audit_logs_2026_04`).
2. **Move partitions older than 6 months to archive** (detach from `audit_logs`, attach to `audit_logs_archive`).
3. **Drop archive partitions older than 24 months** (unless they contain NF-e entries).
4. **Log the operation** in the audit log itself.

### Storage Estimation

| Traffic               | Entries/day | Monthly Storage | 6-month Active | 24-month Total |
| --------------------- | ----------- | --------------- | -------------- | -------------- |
| Low (500 orders/mo)   | ~2,000      | ~50 MB          | ~300 MB        | ~1.2 GB        |
| Medium (5k orders/mo) | ~20,000     | ~500 MB         | ~3 GB          | ~12 GB         |
| High (50k orders/mo)  | ~200,000    | ~5 GB           | ~30 GB         | ~120 GB        |

At high scale, partitioning and archival become critical for maintaining query performance.

---

## 7. Critical Events

Some audit events are classified as **critical** and trigger additional actions beyond the standard log entry.

### Event Definitions

| Event                            | Trigger Condition                                                         | Additional Action                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Permission change**            | Any modification to `global.user_roles` or role assignments               | Notification to all admin users via Discord `#alertas`. Email to the affected user confirming the change.                                                                             |
| **Bulk deletion**                | DELETE action where `metadata.bulk_count > 10`                            | Admin alert via Discord `#alertas` with details (who, what module, how many records). Requires admin confirmation for >100 items.                                                     |
| **NF-e emission**                | `action: 'nfe_emission'`                                                  | Audit entry is marked as **immutable** (cannot be deleted from the audit log, even during retention cleanup). The NF-e number, DANFE URL, and XML reference are stored in `metadata`. |
| **NF-e cancellation**            | `action: 'nfe_cancellation'`                                              | Same immutability as emission. Additionally, the cancellation reason is required in `metadata.reason`. Admin notification via Discord.                                                |
| **Financial transaction change** | Any UPDATE on `financial.transactions` where `status` or `amount` changes | Notification to finance team (Discord `#financeiro`). If amount changes, flag for manual review.                                                                                      |
| **Login failure spike**          | More than 5 failed login attempts for the same user within 10 minutes     | Account temporarily locked (30 minutes). Admin notification. IP logged for potential blocking.                                                                                        |
| **Setting change**               | Any modification to `global.settings`                                     | Admin notification. Before/after values logged (secrets masked).                                                                                                                      |
| **LGPD data deletion**           | Execution of a data subject deletion request                              | Immutable audit entry. Confirmation email to the data subject. Report to DPO.                                                                                                         |
| **API key rotation**             | Change of any integration credential                                      | Admin notification. Old key hash stored in `metadata` for forensics.                                                                                                                  |
| **Bulk import**                  | Import of >100 records                                                    | Admin notification with import summary (records created, updated, failed).                                                                                                            |

### Implementation

Critical event detection runs as a post-processing step in the audit worker:

```typescript
// src/workers/audit-critical.ts

import { criticalEventHandlers } from "@/lib/audit/critical-handlers";

export async function processAuditEntry(entry: AuditLogEntry) {
  // 1. Write to database (standard flow)
  await writeToDb(entry);

  // 2. Check if this is a critical event
  for (const handler of criticalEventHandlers) {
    if (handler.matches(entry)) {
      await handler.execute(entry);
    }
  }
}

// Example handler: Permission change notification
const permissionChangeHandler = {
  matches: (entry: AuditLogEntry) => entry.action === "permission_change",

  execute: async (entry: AuditLogEntry) => {
    await sendDiscordAlert({
      channel: "alertas",
      title: "Permission Change",
      description: `User ${entry.userId} changed permissions on ${entry.resourceType}`,
      fields: [
        { name: "Before", value: JSON.stringify(entry.changes?.before) },
        { name: "After", value: JSON.stringify(entry.changes?.after) },
      ],
      severity: "warning",
    });

    // Email the affected user
    if (entry.resourceId) {
      await sendEmail({
        to: await getUserEmail(entry.resourceId),
        template: "permission-change",
        data: { changes: entry.changes },
      });
    }
  },
};
```

### Immutability Rules

Certain audit entries are protected from deletion, even during retention cleanup:

| Entry Type                                       | Immutable Until                        |
| ------------------------------------------------ | -------------------------------------- |
| NF-e emission                                    | 5 years from emission date             |
| NF-e cancellation                                | 5 years from cancellation date         |
| LGPD data deletion                               | Permanent (proof of compliance)        |
| Consent changes                                  | Permanent (proof of lawful processing) |
| Financial transaction changes involving disputes | Until dispute is resolved + 2 years    |

The partition cleanup job checks for the `immutable` flag (stored in `metadata.immutable: true`) before dropping any partition. Immutable entries from expired partitions are moved to `audit_logs_fiscal_archive` before the partition is dropped.

### Monitoring the Audit System Itself

The audit system has its own health checks:

| Check           | Condition                                                        | Alert                                    |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| Queue depth     | Audit queue > 1000 pending jobs                                  | Warning: audit writes are falling behind |
| Write latency   | Batch insert takes > 1 second                                    | Warning: database performance issue      |
| Missing entries | Gap detected between expected and actual entries (sampled)       | Critical: audit entries may be lost      |
| Partition check | Next month's partition does not exist within 7 days of month end | Warning: partition must be created       |
