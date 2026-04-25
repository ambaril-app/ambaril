# SSE Load Limits — War Room (T12)

> Drop launch monitoring via Server-Sent Events.

## Context

War Room is a tenant-scoped real-time dashboard for monitoring drop launches (sales events). It uses SSE to push live sales data, inventory updates, and alerts to connected clients. Vercel serverless functions impose hard constraints on connection duration and concurrency.

## Constraints

| Constraint                    | Value         | Reason                                                |
| ----------------------------- | ------------- | ----------------------------------------------------- |
| Max SSE per tenant            | 10            | Prevent a single tenant from monopolizing resources   |
| Max SSE per function instance | 50            | Vercel memory/CPU budget per instance                 |
| Heartbeat interval            | 30s           | Detect stale connections before Vercel kills them     |
| Idle auto-disconnect          | 5 min         | Free resources when War Room tab is backgrounded      |
| Vercel function timeout       | 300s          | Hard platform limit — client MUST handle reconnection |
| SSE retry field               | `retry: 5000` | Client reconnects 5s after disconnect                 |
| Write buffer backpressure     | 64KB          | Drop oldest events if buffer exceeds this             |

## Runtime Requirement

SSE routes **must** use the Node.js runtime. Edge Runtime does not support streaming responses.

```ts
// app/api/v1/war-room/stream/route.ts
export const runtime = "nodejs";
```

## Connection Lifecycle

```
Client opens /api/v1/war-room/stream
  → Validate session cookie (reject 401 if invalid)
  → Extract tenant_id from session
  → Check tenant connection count (<= 10) → reject 429 if exceeded
  → Check instance connection count (<= 50) → reject 503 if exceeded
  → Register in connectionMap
  → Send `retry: 5000\n\n`
  → Begin heartbeat loop (every 30s: `event: heartbeat\ndata: {}\n\n`)
  → Push events as they occur
  → On idle (no War Room open) for 5 min → close
  → On client disconnect → remove from connectionMap
  → On Vercel 300s timeout → client auto-reconnects via retry field
```

## Connection Tracking

Connections are tracked in an **in-memory Map per function instance**. Vercel is stateless — there is no global connection registry. Each instance independently enforces its own limits.

```ts
type ConnectionEntry = {
  tenantId: string;
  userId: string;
  connectedAt: Date;
  lastActivity: Date;
  controller: ReadableStreamDefaultController;
};

const connectionMap = new Map<string, ConnectionEntry>();
```

### Counting per tenant

```ts
function tenantConnectionCount(tenantId: string): number {
  let count = 0;
  for (const entry of connectionMap.values()) {
    if (entry.tenantId === tenantId) count++;
  }
  return count;
}
```

## Backpressure

If the write buffer for a connection exceeds 64KB, the handler drops the **oldest** queued events until the buffer is under the limit. This prevents a slow client from causing memory pressure on the function instance.

```ts
function enqueueEvent(connId: string, event: string) {
  const entry = connectionMap.get(connId);
  if (!entry) return;

  // Approximate buffer size check
  if (bufferedSize(entry) > 64 * 1024) {
    dropOldestEvents(entry);
  }

  entry.controller.enqueue(new TextEncoder().encode(event));
}
```

## Event Format

All events use typed event names so the client can register specific listeners.

```
event: sales\ndata: {"orderId":"abc","total":14990,"currency":"BRL"}\n\n
event: inventory\ndata: {"skuId":"xyz","remaining":12}\n\n
event: alert\ndata: {"type":"low_stock","skuId":"xyz","threshold":10}\n\n
event: heartbeat\ndata: {}\n\n
```

Client-side:

```ts
const es = new EventSource("/api/v1/war-room/stream");
es.addEventListener("sales", (e) => handleSale(JSON.parse(e.data)));
es.addEventListener("inventory", (e) => handleInventory(JSON.parse(e.data)));
es.addEventListener("alert", (e) => handleAlert(JSON.parse(e.data)));
```

## Authentication & Tenant Isolation

1. On connection open, validate the session cookie. If invalid or expired, respond with **401**.
2. Extract `tenant_id` from the validated session.
3. **Every database query** inside the SSE handler must include `WHERE tenant_id = $tenantId`. There is no exception to this rule.
4. The SSE handler must never accept `tenant_id` from query parameters or request body — it comes exclusively from the server-side session.

## Reconnection Handling

The `retry: 5000` field tells the browser to reconnect 5 seconds after a disconnect. Given Vercel's 300s function timeout, disconnections are expected and normal.

The client should:

- Track `Last-Event-ID` to resume from where it left off
- Show a subtle "Reconnecting..." indicator (not an error)
- Buffer local state during reconnection gap
- Reconcile state via a REST snapshot endpoint after reconnection

## Idle Detection

If the War Room tab is closed or hidden for 5 minutes (detected via `visibilitychange` event or lack of client heartbeat ACKs), the server closes the SSE connection to free resources. The client reopens when the tab becomes visible again.
