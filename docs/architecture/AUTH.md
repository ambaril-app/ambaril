# Ambaril — Authentication & Authorization

> **Version:** 1.0
> **Date:** March 2026
> **Status:** Approved
> **References:** [STACK.md](./STACK.md), [GLOSSARY.md](../dev/GLOSSARY.md)

---

## 1. Authentication Flows

### 1.1 Internal Users (9 team members)

| Property | Value |
|----------|-------|
| Login method | Email + password |
| Session type | httpOnly cookie (session-based) |
| Session store | PostgreSQL (`global.sessions` table, `user_type = 'internal'`) |
| Session TTL | 7 days, sliding window (refreshed on each request) |
| "Remember me" | Extends session TTL to 30 days |
| Password hashing | Argon2id |
| SSO / OAuth | Not needed (single org, 9 users) |
| Password reset | Email via Resend with signed token (1-hour expiry) |
| MFA | Not required (small trusted team; can be added later) |

**Flow:**

```
1. User submits email + password
2. Server verifies password against Argon2id hash
3. On success: insert session row in `global.sessions` (with `user_type = 'internal'`), set httpOnly cookie
4. On failure: increment failed attempt counter (see brute force protection)
5. Subsequent requests: middleware reads cookie → fetches session from `global.sessions` via token → attaches to request context
```

### 1.2 B2B Retailers (external)

| Property | Value |
|----------|-------|
| Registration | Manual — created by Guilherme (`commercial` role). **No self-registration.** |
| Login method | Email + password |
| Session store | PostgreSQL (`global.sessions` table, `user_type = 'b2b'`) |
| Session TTL | 7 days, sliding window |
| Account status | Must be `approved` to login |
| Access scope | B2B portal routes only (`(b2b)/*`) |

**Account status flow:**

```
created (by Guilherme) → approved → active login allowed
                       → suspended → login blocked (can be reactivated)
```

**Login guard:** If `retailer.status !== 'approved'`, return `403` with message: "Sua conta ainda nao foi aprovada. Entre em contato com o comercial."

### 1.3 Creators (external)

| Property | Value |
|----------|-------|
| Registration | Self-registration |
| Required fields | Name, email, Instagram handle, CPF, PIX key |
| Email verification | Required before account activation |
| Session store | PostgreSQL (`global.sessions` table, `user_type = 'creator'`) |
| Session TTL | 7 days, sliding window |
| Access scope | Creators portal routes only (`(creators)/*`) |

**Account status flow:**

```
self-register → pending (email verified) → admin approves → active
                                         → admin rejects → rejected
```

Only `active` creators can log in. Pending and rejected accounts receive a descriptive error message.

### 1.4 Public Checkout

| Property | Value |
|----------|-------|
| Authentication | **None required** |
| Identification | Guest checkout with CPF |
| Contact linking | Optional — if CPF matches an existing `crm.contacts` record, associate the order |
| Session | Anonymous session cookie for cart persistence only (no auth data) |

No login wall. No account creation required. The checkout must be as frictionless as possible.

### 1.5 "Meu Pedido" Page (expansion E5)

| Property | Value |
|----------|-------|
| Authentication | **None** |
| Lookup method | Order number + CPF (both required) |
| Rate limiting | 10 attempts per IP per hour |
| Data returned | Order status, tracking info, items — read-only |

**Rate limit implementation:** In-memory counter (per-process `Map<ip, { count, resetAt }>`) with 1-hour window. On serverless (Vercel), each cold start resets counters — this is acceptable for a low-traffic public page. For stricter enforcement, a `global.rate_limits` table can be used with a periodic cleanup cron. On 11th attempt, return `429 Too Many Requests`.

---

## 2. Session Management

### 2.1 PostgreSQL Session Store

All sessions are stored in the `global.sessions` PostgreSQL table (per ADR-012 — no Redis). The `user_type` column differentiates between internal, B2B, and creator sessions within the same table.

**Table: `global.sessions`**

```sql
-- Columns (from Drizzle schema: packages/db/src/schema/global.ts)
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID NOT NULL REFERENCES global.users(id) ON DELETE CASCADE
tenant_id     UUID REFERENCES global.tenants(id)
token         VARCHAR(64) NOT NULL UNIQUE     -- cryptographically random hex token
user_role     user_role NOT NULL              -- enum: admin | pm | creative | operations | support | finance | commercial
user_type     VARCHAR(20) NOT NULL DEFAULT 'internal'  -- 'internal' | 'b2b' | 'creator'
expires_at    TIMESTAMPTZ NOT NULL
last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
ip_address    INET
user_agent    TEXT
created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
```

**Session data returned to request context (resolved at read time, not stored):**

```typescript
// Returned by getSession() after joining sessions + users + tenants + permissions
interface TenantSessionData {
  userId: string;          // UUID
  role: RoleCode;          // 'admin' | 'pm' | 'creative' | 'operations' | 'support' | 'finance' | 'commercial'
  permissions: string[];   // ['erp:orders:read', 'erp:orders:write', ...] — resolved from global.permissions table
  name: string;            // from global.users
  email: string;           // from global.users
  tenantId: string;        // from global.tenants
  tenantSlug: string;      // from global.tenants
}
```

> **Note:** Permissions are NOT stored in the session row. They are fetched fresh from `global.permissions` on each `getSession()` call, joined via `global.roles`. This means permission changes take effect immediately without requiring re-login.

### 2.2 Cookie Configuration

```typescript
const SESSION_COOKIE_OPTIONS = {
  name: 'ambaril_session',
  httpOnly: true,
  secure: true,             // HTTPS only
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days (default), 30 days (remember me)
};
```

### 2.3 Session Middleware

```typescript
// Pseudocode — runs on every request to protected routes
// Actual implementation: apps/web/src/lib/auth.ts → getSession()
async function sessionMiddleware(req: NextRequest) {
  const token = req.cookies.get('ambaril_session')?.value;

  if (!token) {
    return redirectToLogin(req);
  }

  // Fetch session from PostgreSQL, joining users + tenants
  // WHERE token = :token AND expires_at > now()
  const session = await db
    .select({ /* sessionId, userId, userRole, userName, userEmail, tenantId, tenantSlug */ })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(tenants, eq(sessions.tenantId, tenants.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
    .limit(1);

  if (!session || !session.userIsActive) {
    return redirectToLogin(req);
  }

  // Sliding window: update last_active_at on each request
  await db.update(sessions)
    .set({ lastActiveAt: new Date() })
    .where(eq(sessions.id, session.sessionId));

  // Fetch permissions from global.roles + global.permissions
  const permissions = await resolvePermissions(session.userRole);

  // Attach session to request context
  req.session = { ...session, permissions };

  return NextResponse.next();
}
```

### 2.4 CSRF Protection

- **Server Actions (mutations):** Next.js App Router handles CSRF natively via `Origin` header validation on POST requests to Server Actions.
- **API Routes:** Verify `Origin` and `Referer` headers against allowed domains.
- **External webhooks:** Use signature verification per provider (not CSRF-based).

### 2.5 Session Invalidation

| Trigger | Action |
|---------|--------|
| Logout | `DELETE FROM global.sessions WHERE token = :token`, clear cookie |
| Password change | `DELETE FROM global.sessions WHERE user_id = :userId` |
| Account suspended/deactivated | `DELETE FROM global.sessions WHERE user_id = :userId` |
| Admin force-logout | `DELETE FROM global.sessions WHERE id = :sessionId` |
| Expired session cleanup | Vercel Cron (daily): `DELETE FROM global.sessions WHERE expires_at < now()` |

---

## 3. RBAC Model

### 3.1 Roles

| Role | Code | Type | People | Description |
|------|------|------|--------|-------------|
| Administrator | `admin` | Internal | Marcus | Full access to everything. System owner. |
| Product Manager | `pm` | Internal | Caio | Strategic oversight — CRM, Creators, Marketing, Tasks, Dashboard, DAM. |
| Creative | `creative` | Internal | Yuri, Sick | **Limited creative workspace only** — DAM, own tasks, editorial calendar, marketing intel (read-only), marketing dashboard panel. |
| Operations | `operations` | Internal | Tavares, Ana Clara | Operational modules — ERP, PCP, Trocas, inventory management. |
| Support | `support` | Internal | Slimgust | Customer support — Inbox, Trocas, CRM (read-only). |
| Finance | `finance` | Internal | Pedro | Financial views — ERP financial tabs (read-only for operational), DRE, Margin Calculator (interactive). |
| Commercial | `commercial` | Internal | Guilherme | B2B management — B2B Portal admin, retailer management. |
| B2B Retailer | `b2b_retailer` | External | Lojistas | B2B Portal only — their own orders, catalog browsing. |
| Creator | `creator` | External | Influenciadores | Creators Portal only — their own dashboard, sales, points, challenges. |

### 3.2 Permission Format

```
{module}:{resource}:{action}
```

**Actions:**

| Action | Meaning |
|--------|---------|
| `read` | View / list data |
| `write` | Create + update records |
| `delete` | Soft-delete records |
| `admin` | Module-level settings and configuration |

**Hierarchy:** `admin` implies `delete` implies `write` implies `read`. A user with `write` automatically has `read`. A user with `admin` has all four.

### 3.3 Special Access Rules

Before the permission matrix, note these **critical rules** that override simple permission checks:

| Rule | Description | Implementation |
|------|-------------|----------------|
| Creative task filtering | `creative` users can only see tasks assigned to them, not all tasks in the system | Query filter: `WHERE assignee_id = session.userId` |
| Creative dashboard restriction | `creative` users can only access the Marketing panel in the dashboard, not Financial, Operational, or Executive panels | Frontend: hide panels. Backend: `dashboard:panels:read` scoped to `marketing` only. |
| Creative marketing read-only | `creative` users can view marketing intel data but cannot create, edit, or delete | Only `marketing:*:read` granted. |
| Support CRM read-only | `support` can view contacts and their data but cannot create, edit, or delete contacts | Only `crm:contacts:read` granted. |
| Finance ERP read-only (operational) | `finance` can view orders, products, inventory but cannot modify them | `erp:orders:read`, `erp:products:read` etc. No write/delete. |
| Finance financial interactive | `finance` CAN interact with financial-specific views: DRE, margin calculator, financial transactions | `erp:financial_transactions:write`, `erp:margin_calculations:write`, `erp:income_statements:write` |
| B2B own-data scoping | `b2b_retailer` can only access their own orders and retailer profile | Query filter: `WHERE retailer_id = session.userId` |
| Creator own-data scoping | `creator` can only access their own dashboard, sales, points, and challenges | Query filter: `WHERE creator_id = session.userId` |

### 3.4 Complete Permission Matrix

Legend: **Y** = allowed, **--** = denied

#### 3.4.1 Global Module (`global`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `global:users:read` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `global:users:write` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `global:users:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `global:users:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `global:roles:read` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `global:roles:write` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `global:roles:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `global:roles:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `global:audit_logs:read` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `global:audit_logs:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `global:notifications:read` | Y | Y | Y | Y | Y | Y | Y | -- | -- |
| `global:notifications:write` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `global:notifications:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `global:settings:read` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `global:settings:write` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `global:settings:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> All internal users can read their own notifications. Only `admin` can manage system settings, users, roles, and audit logs.

#### 3.4.2 Checkout Module (`checkout`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `checkout:orders:read` | Y | Y | -- | Y | Y | Y | -- | -- | -- |
| `checkout:orders:write` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `checkout:orders:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `checkout:ab_tests:read` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `checkout:ab_tests:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `checkout:ab_tests:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `checkout:ab_tests:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `checkout:checkout_config:read` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `checkout:checkout_config:write` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `checkout:checkout_config:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> The public checkout itself requires no auth. These permissions control the **admin analytics/configuration views** of checkout data.

#### 3.4.3 CRM Module (`crm`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `crm:contacts:read` | Y | Y | -- | -- | Y | -- | -- | -- | -- |
| `crm:contacts:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:contacts:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `crm:contacts:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `crm:segments:read` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:segments:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:segments:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `crm:segments:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `crm:automations:read` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:automations:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:automations:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `crm:automations:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `crm:campaigns:read` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:campaigns:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:campaigns:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `crm:campaigns:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `crm:consents:read` | Y | Y | -- | -- | Y | -- | -- | -- | -- |
| `crm:consents:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:consents:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `crm:cohorts:read` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:cohorts:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `crm:cohorts:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> `support` (Slimgust) has **read-only** access to contacts and consents. No write, delete, or admin on any CRM resource.

#### 3.4.4 ERP Module (`erp`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `erp:orders:read` | Y | Y | -- | Y | Y | Y | -- | -- | -- |
| `erp:orders:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `erp:orders:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:orders:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:products:read` | Y | Y | -- | Y | -- | Y | -- | -- | -- |
| `erp:products:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `erp:products:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:products:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:skus:read` | Y | Y | -- | Y | -- | Y | -- | -- | -- |
| `erp:skus:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `erp:skus:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:skus:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:inventory:read` | Y | Y | -- | Y | -- | Y | -- | -- | -- |
| `erp:inventory:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `erp:inventory:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:nfe_documents:read` | Y | -- | -- | Y | -- | Y | -- | -- | -- |
| `erp:nfe_documents:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `erp:nfe_documents:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:financial_transactions:read` | Y | -- | -- | -- | -- | Y | -- | -- | -- |
| `erp:financial_transactions:write` | Y | -- | -- | -- | -- | Y | -- | -- | -- |
| `erp:financial_transactions:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:margin_calculations:read` | Y | Y | -- | -- | -- | Y | -- | -- | -- |
| `erp:margin_calculations:write` | Y | -- | -- | -- | -- | Y | -- | -- | -- |
| `erp:margin_calculations:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:income_statements:read` | Y | Y | -- | -- | -- | Y | -- | -- | -- |
| `erp:income_statements:write` | Y | -- | -- | -- | -- | Y | -- | -- | -- |
| `erp:income_statements:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `erp:shipping_labels:read` | Y | -- | -- | Y | Y | -- | -- | -- | -- |
| `erp:shipping_labels:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `erp:shipping_labels:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> `finance` (Pedro) can read operational ERP data but can only **write** to financial-specific resources: `financial_transactions`, `margin_calculations`, `income_statements`. `operations` (Tavares, Ana Clara) can write to operational resources but have no access to financial views. `support` (Slimgust) can read orders and shipping labels for customer support context.

#### 3.4.5 PCP Module (`pcp`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `pcp:production_orders:read` | Y | Y | -- | Y | -- | -- | -- | -- | -- |
| `pcp:production_orders:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `pcp:production_orders:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `pcp:production_orders:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `pcp:production_stages:read` | Y | Y | -- | Y | -- | -- | -- | -- | -- |
| `pcp:production_stages:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `pcp:production_stages:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `pcp:suppliers:read` | Y | Y | -- | Y | -- | -- | -- | -- | -- |
| `pcp:suppliers:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `pcp:suppliers:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `pcp:suppliers:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `pcp:raw_materials:read` | Y | Y | -- | Y | -- | -- | -- | -- | -- |
| `pcp:raw_materials:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `pcp:raw_materials:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `pcp:raw_materials:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `pcp:cost_analyses:read` | Y | Y | -- | Y | -- | Y | -- | -- | -- |
| `pcp:cost_analyses:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `pcp:cost_analyses:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `pcp:rework_orders:read` | Y | Y | -- | Y | -- | -- | -- | -- | -- |
| `pcp:rework_orders:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `pcp:rework_orders:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `pcp:collections:read` | Y | Y | -- | Y | -- | -- | -- | -- | -- |
| `pcp:collections:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `pcp:collections:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `pcp:collections:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `pcp:drops:read` | Y | Y | -- | Y | -- | -- | -- | -- | -- |
| `pcp:drops:write` | Y | -- | -- | Y | -- | -- | -- | -- | -- |
| `pcp:drops:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `pcp:drops:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> `pm` (Caio) has read access for strategic oversight. `operations` (Tavares, Ana Clara) are the primary writers. `finance` (Pedro) can read cost analyses for margin context.

#### 3.4.6 WhatsApp Module (`whatsapp`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `whatsapp:templates:read` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `whatsapp:templates:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `whatsapp:templates:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `whatsapp:templates:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `whatsapp:campaigns:read` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `whatsapp:campaigns:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `whatsapp:campaigns:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `whatsapp:campaigns:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `whatsapp:conversations:read` | Y | Y | -- | -- | Y | -- | -- | -- | -- |
| `whatsapp:conversations:write` | Y | Y | -- | -- | Y | -- | -- | -- | -- |
| `whatsapp:conversations:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> `support` (Slimgust) can read and respond to WhatsApp conversations for customer support. Template and campaign management is restricted to `admin` and `pm`.

#### 3.4.7 Trocas Module (`trocas`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `trocas:exchange_requests:read` | Y | -- | -- | Y | Y | -- | -- | -- | -- |
| `trocas:exchange_requests:write` | Y | -- | -- | Y | Y | -- | -- | -- | -- |
| `trocas:exchange_requests:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `trocas:exchange_requests:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `trocas:reverse_logistics:read` | Y | -- | -- | Y | Y | -- | -- | -- | -- |
| `trocas:reverse_logistics:write` | Y | -- | -- | Y | Y | -- | -- | -- | -- |
| `trocas:reverse_logistics:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> `operations` and `support` both handle exchanges and returns. `support` initiates from customer requests; `operations` manages the logistics side.

#### 3.4.8 Inbox Module (`inbox`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `inbox:tickets:read` | Y | Y | -- | -- | Y | -- | -- | -- | -- |
| `inbox:tickets:write` | Y | -- | -- | -- | Y | -- | -- | -- | -- |
| `inbox:tickets:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `inbox:tickets:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `inbox:messages:read` | Y | Y | -- | -- | Y | -- | -- | -- | -- |
| `inbox:messages:write` | Y | -- | -- | -- | Y | -- | -- | -- | -- |
| `inbox:messages:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `inbox:quick_replies:read` | Y | -- | -- | -- | Y | -- | -- | -- | -- |
| `inbox:quick_replies:write` | Y | -- | -- | -- | Y | -- | -- | -- | -- |
| `inbox:quick_replies:delete` | Y | -- | -- | -- | Y | -- | -- | -- | -- |
| `inbox:quick_replies:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `inbox:metrics:read` | Y | Y | -- | -- | Y | -- | -- | -- | -- |
| `inbox:metrics:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> `support` (Slimgust) is the primary operator. `pm` (Caio) has read access for oversight and metrics.

#### 3.4.9 B2B Module (`b2b`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `b2b:retailers:read` | Y | -- | -- | -- | -- | -- | Y | -- | -- |
| `b2b:retailers:write` | Y | -- | -- | -- | -- | -- | Y | -- | -- |
| `b2b:retailers:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `b2b:retailers:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `b2b:b2b_orders:read` | Y | -- | -- | -- | -- | -- | Y | Y* | -- |
| `b2b:b2b_orders:write` | Y | -- | -- | -- | -- | -- | Y | Y* | -- |
| `b2b:b2b_orders:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `b2b:b2b_catalog:read` | Y | -- | -- | -- | -- | -- | Y | Y | -- |
| `b2b:b2b_catalog:write` | Y | -- | -- | -- | -- | -- | Y | -- | -- |
| `b2b:b2b_catalog:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> **Y*** = `b2b_retailer` can read/write orders but **scoped to their own orders only** (`WHERE retailer_id = session.userId`). They cannot see other retailers' orders. `commercial` (Guilherme) sees all retailers and all orders.

#### 3.4.10 Creators Module (`creators`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `creators:creators:read` | Y | Y | -- | -- | -- | -- | -- | -- | Y* |
| `creators:creators:write` | Y | Y | -- | -- | -- | -- | -- | -- | Y* |
| `creators:creators:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `creators:creators:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `creators:coupons:read` | Y | Y | -- | -- | -- | -- | -- | -- | Y* |
| `creators:coupons:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `creators:coupons:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `creators:coupons:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `creators:challenges:read` | Y | Y | -- | -- | -- | -- | -- | -- | Y* |
| `creators:challenges:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `creators:challenges:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `creators:challenges:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `creators:payouts:read` | Y | Y | -- | -- | -- | Y | -- | -- | Y* |
| `creators:payouts:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `creators:payouts:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `creators:points:read` | Y | Y | -- | -- | -- | -- | -- | -- | Y* |
| `creators:points:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `creators:points:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> **Y*** = `creator` can read/write their own profile and read their own coupons, challenges, payouts, and points — **scoped to their own data only** (`WHERE creator_id = session.userId`). `finance` (Pedro) can read payouts for reconciliation.

#### 3.4.11 Marketing Module (`marketing`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `marketing:ugc_posts:read` | Y | Y | Y | -- | -- | -- | -- | -- | -- |
| `marketing:ugc_posts:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `marketing:ugc_posts:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `marketing:ugc_posts:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `marketing:competitor_ads:read` | Y | Y | Y | -- | -- | -- | -- | -- | -- |
| `marketing:competitor_ads:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `marketing:competitor_ads:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `marketing:campaign_metrics:read` | Y | Y | Y | -- | -- | -- | -- | -- | -- |
| `marketing:campaign_metrics:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `marketing:campaign_metrics:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `marketing:creator_scouts:read` | Y | Y | Y | -- | -- | -- | -- | -- | -- |
| `marketing:creator_scouts:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `marketing:creator_scouts:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> `creative` (Yuri, Sick) has **read-only** access across all marketing intel resources. They can view UGC, competitor ads, campaign metrics, and creator scouts but cannot create, modify, or delete anything.

#### 3.4.12 Tarefas Module (`tarefas`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `tarefas:projects:read` | Y | Y | -- | Y | Y | Y | Y | -- | -- |
| `tarefas:projects:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `tarefas:projects:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `tarefas:projects:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `tarefas:tasks_all:read` | Y | Y | -- | Y | Y | Y | Y | -- | -- |
| `tarefas:tasks_all:write` | Y | Y | -- | Y | Y | Y | Y | -- | -- |
| `tarefas:tasks_all:delete` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `tarefas:tasks_all:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `tarefas:tasks_own:read` | Y | Y | Y | Y | Y | Y | Y | -- | -- |
| `tarefas:tasks_own:write` | Y | Y | Y | Y | Y | Y | Y | -- | -- |
| `tarefas:tasks_own:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `tarefas:calendar_events:read` | Y | Y | Y | Y | Y | Y | Y | -- | -- |
| `tarefas:calendar_events:write` | Y | Y | Y | -- | -- | -- | -- | -- | -- |
| `tarefas:calendar_events:delete` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `tarefas:calendar_events:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> **Critical distinction:** `creative` has `tasks_own` (read + write) but NOT `tasks_all`. This means Yuri and Sick can only view and update tasks assigned to them. They cannot browse the full task board or see other people's tasks. All other internal roles have `tasks_all` access. `creative` can also read and write to `calendar_events` (editorial calendar) since content planning is part of their workflow.

#### 3.4.13 Dashboard Module (`dashboard`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `dashboard:panels_all:read` | Y | Y | -- | Y | -- | Y | -- | -- | -- |
| `dashboard:panels_all:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `dashboard:panels_marketing:read` | Y | Y | Y | -- | -- | -- | -- | -- | -- |
| `dashboard:panels_marketing:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `dashboard:war_room:read` | Y | Y | -- | Y | -- | -- | -- | -- | -- |
| `dashboard:war_room:write` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `dashboard:war_room:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `dashboard:settings:read` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `dashboard:settings:write` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `dashboard:settings:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> **Critical distinction:** `creative` has `panels_marketing:read` but NOT `panels_all:read`. When a creative user opens the dashboard, they see ONLY the marketing panel. Financial, operational, executive, and other panels are hidden and inaccessible. `operations` and `finance` have `panels_all:read` to see their relevant data across panels. `pm` sees everything for strategic oversight.

#### 3.4.14 DAM Module (`dam`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `dam:assets:read` | Y | Y | Y | -- | -- | -- | -- | -- | -- |
| `dam:assets:write` | Y | Y | Y | -- | -- | -- | -- | -- | -- |
| `dam:assets:delete` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `dam:assets:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `dam:asset_versions:read` | Y | Y | Y | -- | -- | -- | -- | -- | -- |
| `dam:asset_versions:write` | Y | Y | Y | -- | -- | -- | -- | -- | -- |
| `dam:asset_versions:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `dam:tags:read` | Y | Y | Y | -- | -- | -- | -- | -- | -- |
| `dam:tags:write` | Y | Y | Y | -- | -- | -- | -- | -- | -- |
| `dam:tags:delete` | Y | Y | -- | -- | -- | -- | -- | -- | -- |
| `dam:tags:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> `creative` (Yuri, Sick) has full read/write access to assets, versions, and tags. This is their primary workspace. They can upload, edit, and tag assets but cannot delete them (prevents accidental loss). `pm` (Caio) can also delete assets and tags.

#### 3.4.15 ClawdBot Module (`clawdbot`)

| Permission | admin | pm | creative | operations | support | finance | commercial | b2b_retailer | creator |
|------------|-------|----|----------|------------|---------|---------|------------|--------------|---------|
| `clawdbot:report_config:read` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `clawdbot:report_config:write` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `clawdbot:report_config:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `clawdbot:chat_config:read` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `clawdbot:chat_config:write` | Y | -- | -- | -- | -- | -- | -- | -- | -- |
| `clawdbot:chat_config:admin` | Y | -- | -- | -- | -- | -- | -- | -- | -- |

> ClawdBot configuration is admin-only. The bot itself operates on Discord and is not gated by the web app RBAC. These permissions control the web UI for configuring reports and chat behavior.

### 3.5 Role-to-Permission Summary

For implementation, each role maps to a static array of permissions. This is the source of truth loaded into the session on login:

```typescript
const ROLE_PERMISSIONS: Record<RoleCode, string[]> = {
  admin: ['*'], // Wildcard — admin bypasses all permission checks

  pm: [
    'global:notifications:read',
    'checkout:orders:read', 'checkout:ab_tests:read', 'checkout:ab_tests:write', 'checkout:checkout_config:read',
    'crm:contacts:read', 'crm:contacts:write', 'crm:segments:read', 'crm:segments:write',
    'crm:automations:read', 'crm:automations:write', 'crm:campaigns:read', 'crm:campaigns:write',
    'crm:consents:read', 'crm:consents:write', 'crm:cohorts:read', 'crm:cohorts:write',
    'erp:orders:read', 'erp:products:read', 'erp:skus:read', 'erp:inventory:read',
    'erp:margin_calculations:read', 'erp:income_statements:read',
    'pcp:production_orders:read', 'pcp:production_stages:read', 'pcp:suppliers:read',
    'pcp:raw_materials:read', 'pcp:cost_analyses:read', 'pcp:rework_orders:read',
    'pcp:collections:read', 'pcp:drops:read',
    'whatsapp:templates:read', 'whatsapp:templates:write', 'whatsapp:campaigns:read',
    'whatsapp:campaigns:write', 'whatsapp:conversations:read', 'whatsapp:conversations:write',
    'inbox:tickets:read', 'inbox:messages:read', 'inbox:metrics:read',
    'creators:creators:read', 'creators:creators:write', 'creators:coupons:read', 'creators:coupons:write',
    'creators:challenges:read', 'creators:challenges:write', 'creators:payouts:read', 'creators:payouts:write',
    'creators:points:read', 'creators:points:write',
    'marketing:ugc_posts:read', 'marketing:ugc_posts:write', 'marketing:competitor_ads:read',
    'marketing:competitor_ads:write', 'marketing:campaign_metrics:read', 'marketing:campaign_metrics:write',
    'marketing:creator_scouts:read', 'marketing:creator_scouts:write',
    'tarefas:projects:read', 'tarefas:projects:write', 'tarefas:tasks_all:read', 'tarefas:tasks_all:write',
    'tarefas:tasks_own:read', 'tarefas:tasks_own:write', 'tarefas:calendar_events:read',
    'tarefas:calendar_events:write', 'tarefas:calendar_events:delete',
    'dashboard:panels_all:read', 'dashboard:panels_marketing:read',
    'dashboard:war_room:read', 'dashboard:war_room:write',
    'dam:assets:read', 'dam:assets:write', 'dam:assets:delete',
    'dam:asset_versions:read', 'dam:asset_versions:write',
    'dam:tags:read', 'dam:tags:write', 'dam:tags:delete',
  ],

  creative: [
    'global:notifications:read',
    'marketing:ugc_posts:read', 'marketing:competitor_ads:read',
    'marketing:campaign_metrics:read', 'marketing:creator_scouts:read',
    'tarefas:tasks_own:read', 'tarefas:tasks_own:write',
    'tarefas:calendar_events:read', 'tarefas:calendar_events:write',
    'dashboard:panels_marketing:read',
    'dam:assets:read', 'dam:assets:write',
    'dam:asset_versions:read', 'dam:asset_versions:write',
    'dam:tags:read', 'dam:tags:write',
  ],

  operations: [
    'global:notifications:read',
    'checkout:orders:read',
    'erp:orders:read', 'erp:orders:write', 'erp:products:read', 'erp:products:write',
    'erp:skus:read', 'erp:skus:write', 'erp:inventory:read', 'erp:inventory:write',
    'erp:nfe_documents:read', 'erp:nfe_documents:write',
    'erp:shipping_labels:read', 'erp:shipping_labels:write',
    'pcp:production_orders:read', 'pcp:production_orders:write',
    'pcp:production_stages:read', 'pcp:production_stages:write',
    'pcp:suppliers:read', 'pcp:suppliers:write',
    'pcp:raw_materials:read', 'pcp:raw_materials:write',
    'pcp:cost_analyses:read', 'pcp:cost_analyses:write',
    'pcp:rework_orders:read', 'pcp:rework_orders:write',
    'pcp:collections:read', 'pcp:collections:write',
    'pcp:drops:read', 'pcp:drops:write',
    'trocas:exchange_requests:read', 'trocas:exchange_requests:write',
    'trocas:reverse_logistics:read', 'trocas:reverse_logistics:write',
    'tarefas:projects:read', 'tarefas:tasks_all:read', 'tarefas:tasks_all:write',
    'tarefas:tasks_own:read', 'tarefas:tasks_own:write',
    'tarefas:calendar_events:read',
    'dashboard:panels_all:read', 'dashboard:war_room:read',
  ],

  support: [
    'global:notifications:read',
    'checkout:orders:read',
    'crm:contacts:read', 'crm:consents:read',
    'erp:orders:read', 'erp:shipping_labels:read',
    'whatsapp:conversations:read', 'whatsapp:conversations:write',
    'trocas:exchange_requests:read', 'trocas:exchange_requests:write',
    'trocas:reverse_logistics:read', 'trocas:reverse_logistics:write',
    'inbox:tickets:read', 'inbox:tickets:write',
    'inbox:messages:read', 'inbox:messages:write',
    'inbox:quick_replies:read', 'inbox:quick_replies:write', 'inbox:quick_replies:delete',
    'inbox:metrics:read',
    'tarefas:projects:read', 'tarefas:tasks_all:read', 'tarefas:tasks_all:write',
    'tarefas:tasks_own:read', 'tarefas:tasks_own:write',
    'tarefas:calendar_events:read',
  ],

  finance: [
    'global:notifications:read',
    'checkout:orders:read',
    'erp:orders:read', 'erp:products:read', 'erp:skus:read', 'erp:inventory:read',
    'erp:nfe_documents:read',
    'erp:financial_transactions:read', 'erp:financial_transactions:write',
    'erp:margin_calculations:read', 'erp:margin_calculations:write',
    'erp:income_statements:read', 'erp:income_statements:write',
    'pcp:cost_analyses:read',
    'creators:payouts:read',
    'tarefas:projects:read', 'tarefas:tasks_all:read', 'tarefas:tasks_all:write',
    'tarefas:tasks_own:read', 'tarefas:tasks_own:write',
    'tarefas:calendar_events:read',
    'dashboard:panels_all:read',
  ],

  commercial: [
    'global:notifications:read',
    'b2b:retailers:read', 'b2b:retailers:write',
    'b2b:b2b_orders:read', 'b2b:b2b_orders:write',
    'b2b:b2b_catalog:read', 'b2b:b2b_catalog:write',
    'tarefas:projects:read', 'tarefas:tasks_all:read', 'tarefas:tasks_all:write',
    'tarefas:tasks_own:read', 'tarefas:tasks_own:write',
    'tarefas:calendar_events:read',
  ],

  b2b_retailer: [
    'b2b:b2b_orders:read', 'b2b:b2b_orders:write',  // scoped to own data
    'b2b:b2b_catalog:read',
  ],

  creator: [
    'creators:creators:read', 'creators:creators:write',   // scoped to own data
    'creators:coupons:read',                                // scoped to own data
    'creators:challenges:read',                             // scoped to own data
    'creators:payouts:read',                                // scoped to own data
    'creators:points:read',                                 // scoped to own data
  ],
};
```

---

## 4. Route Protection

### 4.1 Middleware Pattern

```typescript
// lib/auth/middleware.ts

import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/rbac';

type AuthOptions = {
  permission?: string;      // e.g., 'erp:orders:read'
  roles?: RoleCode[];       // Alternative: check by role directly
  allowExternal?: boolean;  // Allow b2b_retailer or creator
};

export function withAuth(handler: AuthHandler, options: AuthOptions) {
  return async (req: NextRequest) => {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (options.roles && !options.roles.includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (options.permission && !hasPermission(session.permissions, options.permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return handler(req, session);
  };
}

// Permission checker supporting wildcard for admin
export function hasPermission(userPermissions: string[], required: string): boolean {
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(required);
}
```

### 4.2 Data Scoping Middleware

For roles with own-data-only access, a scoping layer is applied after auth:

```typescript
// lib/auth/scope.ts

export function scopeQuery(session: SessionData, baseQuery: Query) {
  switch (session.role) {
    case 'b2b_retailer':
      return baseQuery.where('retailer_id', '=', session.userId);
    case 'creator':
      return baseQuery.where('creator_id', '=', session.userId);
    case 'creative':
      // For tasks module: scope to own tasks only
      if (baseQuery.table === 'tasks') {
        return baseQuery.where('assignee_id', '=', session.userId);
      }
      return baseQuery;
    default:
      return baseQuery;
  }
}
```

### 4.3 Route Groups and Protection

#### Next.js Middleware (`middleware.ts`)

The top-level Next.js middleware handles route-group-level protection:

```typescript
// middleware.ts

const ROUTE_PROTECTION: Record<string, RouteRule> = {
  // --- Public (no auth) ---
  '(checkout)':    { auth: false },

  // --- External portals ---
  '(b2b)':         { auth: true, roles: ['b2b_retailer'] },
  '(creators)':    { auth: true, roles: ['creator'] },

  // --- Internal admin (any internal role can reach the group) ---
  '(admin)':       { auth: true, roles: ['admin', 'pm', 'creative', 'operations', 'support', 'finance', 'commercial'] },
};
```

#### Per-Module Route Permissions

Within the `(admin)` route group, each module enforces granular permissions:

| Route Pattern | Allowed Roles | Permission Check | Notes |
|---------------|---------------|------------------|-------|
| `(admin)/dashboard` | admin, pm, creative, operations, finance | `dashboard:panels_all:read` or `dashboard:panels_marketing:read` | Creative sees only marketing panel |
| `(admin)/dashboard/war-room` | admin, pm, operations | `dashboard:war_room:read` | Real-time drop monitoring |
| `(admin)/erp` | admin, pm, operations, finance | `erp:orders:read` (minimum) | Finance sees financial tabs only |
| `(admin)/erp/financeiro` | admin, finance | `erp:financial_transactions:read` | DRE, margin calculator, reconciliation |
| `(admin)/pcp` | admin, pm, operations | `pcp:production_orders:read` (minimum) | PM has read-only |
| `(admin)/crm` | admin, pm, support | `crm:contacts:read` (minimum) | Support is read-only |
| `(admin)/creators` | admin, pm | `creators:creators:read` (minimum) | Full creator program management |
| `(admin)/marketing` | admin, pm, creative | `marketing:ugc_posts:read` (minimum) | Creative is read-only |
| `(admin)/tarefas` | all internal | `tarefas:tasks_own:read` (minimum) | Creative sees filtered view (own tasks only) |
| `(admin)/tarefas/calendario` | all internal | `tarefas:calendar_events:read` | Editorial calendar visible to creative |
| `(admin)/inbox` | admin, pm, support | `inbox:tickets:read` (minimum) | PM has read-only |
| `(admin)/whatsapp` | admin, pm, support | `whatsapp:conversations:read` (minimum) | Support can read/write conversations only |
| `(admin)/trocas` | admin, operations, support | `trocas:exchange_requests:read` (minimum) | Both operations and support handle exchanges |
| `(admin)/b2b` | admin, commercial | `b2b:retailers:read` (minimum) | B2B management |
| `(admin)/dam` | admin, pm, creative | `dam:assets:read` (minimum) | Creative workspace |
| `(admin)/clawdbot` | admin | `clawdbot:report_config:read` | Admin-only bot config |
| `(admin)/settings` | admin | `global:settings:read` | System settings, user management |
| `(checkout)/*` | public | None | Guest checkout, no auth |
| `(b2b)/*` | b2b_retailer | B2B session required | Own-data scoped |
| `(creators)/*` | creator | Creator session required | Own-data scoped |

### 4.4 Sidebar Visibility

The sidebar dynamically renders navigation items based on the logged-in user's permissions. If a user lacks permission for a module, the corresponding sidebar item is not rendered:

```typescript
// Sidebar item visibility based on permission check
const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard',  href: '/dashboard',  permission: 'dashboard:panels_all:read',       alternatePermission: 'dashboard:panels_marketing:read' },
  { label: 'ERP',        href: '/erp',        permission: 'erp:orders:read' },
  { label: 'PCP',        href: '/pcp',        permission: 'pcp:production_orders:read' },
  { label: 'CRM',        href: '/crm',        permission: 'crm:contacts:read' },
  { label: 'Creators',   href: '/creators',   permission: 'creators:creators:read',          excludeRoles: ['creator'] },
  { label: 'Marketing',  href: '/marketing',  permission: 'marketing:ugc_posts:read' },
  { label: 'Tarefas',    href: '/tarefas',    permission: 'tarefas:tasks_own:read' },
  { label: 'Inbox',      href: '/inbox',      permission: 'inbox:tickets:read' },
  { label: 'WhatsApp',   href: '/whatsapp',   permission: 'whatsapp:conversations:read' },
  { label: 'Trocas',     href: '/trocas',     permission: 'trocas:exchange_requests:read' },
  { label: 'B2B',        href: '/b2b',        permission: 'b2b:retailers:read',              excludeRoles: ['b2b_retailer'] },
  { label: 'DAM',        href: '/dam',        permission: 'dam:assets:read' },
  { label: 'ClawdBot',   href: '/clawdbot',   permission: 'clawdbot:report_config:read' },
  { label: 'Settings',   href: '/settings',   permission: 'global:settings:read' },
];
```

**What each role sees in the sidebar:**

| Role | Sidebar Items |
|------|---------------|
| `admin` | All 14 items |
| `pm` | Dashboard, ERP (read), PCP (read), CRM, Creators, Marketing, Tarefas, Inbox (read), WhatsApp, DAM |
| `creative` | Dashboard (marketing panel), Marketing (read), Tarefas (own), DAM |
| `operations` | Dashboard, ERP, PCP, Trocas, Tarefas |
| `support` | ERP (orders read), CRM (read), Inbox, WhatsApp (conversations), Trocas, Tarefas |
| `finance` | Dashboard, ERP (financial focus), Tarefas |
| `commercial` | B2B, Tarefas |

---

## 5. API Key Management

### 5.1 Incoming Webhooks

External services send webhooks to Ambaril. Each provider uses signature verification:

| Provider | Endpoint | Verification Method |
|----------|----------|---------------------|
| Mercado Pago | `/api/webhooks/mercado-pago` | HMAC-SHA256 signature in `x-signature` header, verified against `MP_WEBHOOK_SECRET` |
| Melhor Envio | `/api/webhooks/melhor-envio` | Signature in `x-hub-signature` header, verified against `ME_WEBHOOK_SECRET` |
| Instagram (Graph API) | `/api/webhooks/instagram` | SHA1 signature verification against `IG_APP_SECRET` |
| Meta (WhatsApp Cloud API) | `/api/webhooks/whatsapp` | SHA256 signature in `x-hub-signature-256`, verified against `WA_APP_SECRET` |

### 5.2 Secret Storage

All API keys and secrets are stored as environment variables. They are **never** stored in the database.

```bash
# .env (never committed)

# Mercado Pago
MP_ACCESS_TOKEN=...
MP_WEBHOOK_SECRET=...

# Focus NFe
FOCUS_NFE_API_KEY=...

# Melhor Envio
ME_CLIENT_ID=...
ME_CLIENT_SECRET=...
ME_WEBHOOK_SECRET=...

# WhatsApp Cloud API
WA_PHONE_NUMBER_ID=...
WA_ACCESS_TOKEN=...
WA_APP_SECRET=...

# Instagram Graph API
IG_APP_ID=...
IG_APP_SECRET=...
IG_ACCESS_TOKEN=...

# Discord
DISCORD_BOT_TOKEN=...

# Resend
RESEND_API_KEY=...

# Claude API
CLAUDE_API_KEY=...

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...

# Session
SESSION_SECRET=...           # Used to sign session cookies
```

### 5.3 Webhook Verification Pattern

```typescript
// lib/webhooks/verify.ts

export function verifyMercadoPagoSignature(req: NextRequest): boolean {
  const signature = req.headers.get('x-signature');
  const requestId = req.headers.get('x-request-id');
  if (!signature || !requestId) return false;

  const [ts, hash] = parseSignature(signature);
  const expected = hmacSHA256(
    `id:${requestId};ts:${ts};`,
    process.env.MP_WEBHOOK_SECRET!
  );
  return timingSafeEqual(hash, expected);
}
```

### 5.4 Secret Rotation Procedure

1. Generate new secret/key in the provider dashboard.
2. Update the environment variable in Vercel/Railway (production + staging).
3. Deploy — the new secret is picked up on next cold start.
4. Verify webhook delivery succeeds with new secret.
5. Revoke the old secret in the provider dashboard.
6. Log the rotation in the internal audit channel (`#ops-log` on Discord).

---

## 6. Password Policy

### 6.1 Requirements

| Property | Internal Users | External Users (B2B, Creators) |
|----------|---------------|-------------------------------|
| Minimum length | 8 characters | 6 characters |
| Complexity | No forced complexity rules (length is the primary security factor) | No forced complexity rules |
| Hashing algorithm | Argon2id | Argon2id |

### 6.2 Argon2id Configuration

```typescript
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,   // 64 MB
  timeCost: 3,         // 3 iterations
  parallelism: 4,      // 4 threads
};
```

### 6.3 Brute Force Protection

| Parameter | Value |
|-----------|-------|
| Max failed attempts | 5 |
| Lockout duration | 15 minutes |
| Lockout scope | Per IP **and** per email (both tracked independently) |
| Implementation | PostgreSQL table `global.login_attempts` with columns: `id`, `identifier` (IP or email), `identifier_type` ('ip' \| 'email'), `attempted_at`. Cleanup cron deletes rows older than 15 minutes. |

**Flow on failed login:**

```
1. INSERT INTO global.login_attempts (identifier, identifier_type, attempted_at) VALUES (:ip, 'ip', now())
2. INSERT INTO global.login_attempts (identifier, identifier_type, attempted_at) VALUES (:email, 'email', now())
3. SELECT COUNT(*) FROM global.login_attempts WHERE identifier = :ip AND attempted_at > now() - interval '15 minutes'
4. SELECT COUNT(*) FROM global.login_attempts WHERE identifier = :email AND attempted_at > now() - interval '15 minutes'
5. If either count >= 5, block login attempt
6. Return generic error: "Email ou senha incorretos" (never reveal which is wrong)
7. On successful login: DELETE FROM global.login_attempts WHERE identifier IN (:ip, :email)
```

> **Cleanup:** A Vercel Cron job (runs every 15 minutes) executes `DELETE FROM global.login_attempts WHERE attempted_at < now() - interval '15 minutes'` to prevent table bloat.

### 6.4 Password Reset

| Step | Detail |
|------|--------|
| 1. Request | User submits email on `/forgot-password` |
| 2. Token generation | Generate cryptographically random token, insert into `global.password_reset_tokens` table with columns: `id`, `user_id`, `token` (unique), `expires_at` (1 hour from now), `created_at` |
| 3. Email | Send reset email via Resend with link: `https://app.ambaril.app/reset-password?token={token}` |
| 4. Validation | User clicks link, frontend sends token + new password |
| 5. Reset | `SELECT * FROM global.password_reset_tokens WHERE token = :token AND expires_at > now()`. If found: hash new password, update user record, delete token row, invalidate all existing sessions (`DELETE FROM global.sessions WHERE user_id = :userId`) |
| 6. Confirmation | Send confirmation email, redirect to login |

> **Cleanup:** Expired tokens are deleted by the same Vercel Cron that cleans up `login_attempts`: `DELETE FROM global.password_reset_tokens WHERE expires_at < now()`.

> The reset email is sent regardless of whether the email exists in the system (prevents email enumeration).

---

## 7. Security Headers

Applied via Next.js `next.config.js` headers configuration:

```typescript
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];
```

### 7.1 Content-Security-Policy (per route group)

| Route Group | CSP Notes |
|-------------|-----------|
| `(admin)` | Strict: `default-src 'self'`; allow Recharts charts (`unsafe-inline` for styles), Lucide icons, DM Sans/DM Mono font CDN (Google Fonts), Cloudflare R2 for DAM images |
| `(checkout)` | Allow Mercado Pago JS SDK (`js.mercadopago.com`), ViaCEP API |
| `(b2b)` | Same as admin but scoped to B2B resources |
| `(creators)` | Same as admin but scoped to Creators resources |
| Webhooks (`/api/webhooks/*`) | No CSP needed (not serving HTML) |

---

## 8. Audit Logging

Every authenticated mutation is logged for accountability:

```typescript
interface AuditLogEntry {
  id: string;               // UUID
  timestamp: string;        // ISO 8601
  userId: string;           // Who performed the action
  role: RoleCode;           // Their role at time of action
  action: string;           // 'create' | 'update' | 'delete'
  module: string;           // 'erp' | 'crm' | 'pcp' | ...
  resource: string;         // 'orders' | 'contacts' | ...
  resourceId: string;       // ID of the affected record
  diff: object | null;      // JSONB: { field: { old: X, new: Y } }
  ip: string;               // Request IP
  userAgent: string;        // Request user agent
}
```

Audit logs are immutable (insert-only, no updates or deletes). Admin can read and search them via `(admin)/settings/audit-log`. Monthly archival job moves old entries to cold storage.

---

## 9. Implementation Checklist

| # | Task | Priority | Module |
|---|------|----------|--------|
| 1 | ~~PostgreSQL session store (`global.sessions`) — DONE (session 18)~~ | P0 | Auth |
| 2 | Implement Argon2id password hashing | P0 | Auth |
| 3 | Build login page + session creation flow | P0 | Auth |
| 4 | Implement Next.js middleware for route-group-level auth | P0 | Auth |
| 5 | Define `ROLE_PERMISSIONS` map (from section 3.5) | P0 | RBAC |
| 6 | Build `hasPermission()` utility with wildcard support | P0 | RBAC |
| 7 | Build `withAuth()` wrapper for API routes | P0 | RBAC |
| 8 | Implement data scoping for `b2b_retailer`, `creator`, `creative` | P0 | RBAC |
| 9 | Build sidebar permission filtering | P1 | UI |
| 10 | Implement brute force protection (`global.login_attempts` table + cleanup cron) | P1 | Auth |
| 11 | Build password reset flow (Resend email + `global.password_reset_tokens` table) | P1 | Auth |
| 12 | Implement B2B retailer account creation by commercial role | P1 | Auth |
| 13 | Implement Creator self-registration + approval flow | P1 | Auth |
| 14 | Add webhook signature verification per provider | P1 | Webhooks |
| 15 | Configure security headers in `next.config.js` | P1 | Security |
| 16 | Implement audit logging middleware | P2 | Audit |
| 17 | Build "Meu Pedido" lookup with rate limiting | P2 | Public |
| 18 | Build admin force-logout + session management UI | P2 | Admin |

---

*This document is the single source of truth for authentication and authorization in Ambaril. Any changes to roles, permissions, or auth flows must be reflected here first, then implemented in code.*
