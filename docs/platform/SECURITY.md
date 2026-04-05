# Ambaril — Security Framework

> Circular security flow: every feature goes through security gates before, during, and after implementation.

## 1. Security Lifecycle (Circular Flow)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AMBARIL SECURITY LIFECYCLE                       │
│                                                                     │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│   │  DESIGN  │───▶│  BUILD   │───▶│  VERIFY  │───▶│ MONITOR  │    │
│   │  (Gate 1)│    │  (Gate 2)│    │  (Gate 3)│    │  (Gate 4)│    │
│   └────▲─────┘    └──────────┘    └──────────┘    └────┬─────┘    │
│        │                                                │          │
│        └────────────────────────────────────────────────┘          │
│                        FEEDBACK LOOP                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Gate 1 — DESIGN (Before Code)

Every new feature, endpoint, or data model MUST answer these questions:

1. **Authentication**: Does this require auth? What level (session, admin, MFA)?
2. **Authorization**: Which roles can access this? Use `resource:action` format
3. **Input Surface**: What user input does this accept? Define Zod schema BEFORE implementation
4. **Data Classification**: Does this handle PII? If yes, which LGPD legal basis applies?
5. **Trust Boundary**: Does this cross a trust boundary (public→auth, tenant→tenant, user→admin)?
6. **External Data**: Does this accept data from external sources (webhooks, APIs)? Define validation

**Deliverable**: Security section in the feature spec (1 paragraph minimum)

### Gate 2 — BUILD (During Code)

Mandatory patterns for every implementation:

#### 2.1 Server Actions & API Routes

```typescript
// PATTERN: Every server action starts with auth + permission check
export async function myAction(input: MyInput) {
  "use server";
  const session = await getTenantSession();

  // Permission check — NEVER skip
  if (!hasPermission(session, "module:action")) {
    return { success: false, error: "Permissão negada" };
  }

  // Zod validation — NEVER trust client input
  const parsed = mySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  // Business logic with validated data
  const result = await withTenantContext(session.tenantId, async (tx) => {
    // All DB operations within tenant context
  });

  return { success: true, data: result };
}
```

#### 2.2 Permission Check Helper

```typescript
// packages/shared/src/utils/permissions.ts
export function hasPermission(
  session: { effectiveRole: string; effectivePermissions: string[] },
  required: string,
): boolean {
  if (session.effectivePermissions.includes("*")) return true;
  return session.effectivePermissions.includes(required);
}
```

#### 2.3 Database Queries

```typescript
// ALWAYS: Select specific columns, never .select()
const result = await db
  .select({ id: users.id, name: users.name })
  .from(users)
  .where(eq(users.tenantId, session.tenantId));

// ALWAYS: Use withTenantContext for mutations
await withTenantContext(session.tenantId, async (tx) => {
  await tx.insert(orders).values({ ...data, tenantId: session.tenantId });
});

// NEVER: Raw SQL with string interpolation
// NEVER: .select() without column specification
// NEVER: Queries without tenantId filter
```

#### 2.4 External Data Handling

```typescript
// ALWAYS: Validate webhook signatures
// ALWAYS: Validate and sanitize external data with Zod
// ALWAYS: Block private IP ranges for outbound requests
// NEVER: Trust URLs from user input without validation
// NEVER: Interpolate user input into HTML without escaping
```

#### 2.5 HTML Output

```typescript
// ALWAYS use React JSX (auto-escaping)
// If raw HTML is necessary (emails, etc.), ALWAYS escape:
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

### Gate 3 — VERIFY (Before Merge)

Pre-merge checklist (enforced by CI and code review):

- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes (with eslint-plugin-security)
- [ ] `pnpm audit --audit-level=high` reports 0 HIGH/CRITICAL
- [ ] No secrets in code (gitleaks pre-commit hook)
- [ ] All server actions have auth + permission checks
- [ ] All user input validated with Zod schemas
- [ ] All DB queries use explicit column selection
- [ ] All mutations use withTenantContext()
- [ ] No dangerouslySetInnerHTML with user data
- [ ] No console.log with sensitive data (passwords, tokens, keys)
- [ ] Security headers present in next.config.ts

### Gate 4 — MONITOR (After Deploy)

Post-deploy security monitoring:

- [ ] Sentry error tracking active
- [ ] Audit logs recording mutations
- [ ] Session cleanup cron running
- [ ] LGPD data purge cron running (when applicable)
- [ ] Dependency audit scheduled weekly

---

## 2. Security Patterns Reference

### 2.1 Authentication Flow

```
User → Login (email+password or magic link)
  ├─ Rate limit check (5 attempts/15min for password, 3/10min for magic link)
  ├─ Argon2id password verification (memoryCost: 19456, timeCost: 2)
  ├─ Session created (32-byte token, 7-day TTL, httpOnly+secure+sameSite cookie)
  └─ Failed attempt recorded for rate limiting

User → Access protected route
  ├─ Middleware: check cookie presence → redirect to /login if missing
  ├─ Server component: getSession() → verify token against DB
  ├─ Permission check: hasPermission(session, "resource:action")
  └─ Tenant context: withTenantContext(session.tenantId, ...)
```

### 2.2 Credential Encryption

```
Save: plaintext → AES-256-GCM encrypt → "enc:v1:<base64>" → DB
Load: DB → strip prefix → decrypt with current key (or previous for rotation) → plaintext

Key rotation:
1. Set ENCRYPTION_KEY_PREVIOUS = current key
2. Set ENCRYPTION_KEY = new key
3. Run migration script to re-encrypt all credentials
4. After verification, remove ENCRYPTION_KEY_PREVIOUS
```

### 2.3 Multi-Tenant Isolation

```
Layer 1 (Application): session.tenantId in every query WHERE clause
Layer 2 (ORM): withTenantContext() sets app.tenant_id via set_config()
Layer 3 (Database): PostgreSQL RLS policies filter rows by tenant_id
Layer 4 (Credentials): Per-tenant encrypted credentials in global.tenant_integrations
Layer 5 (Storage): R2 paths prefixed with tenant UUID
```

### 2.4 Session Security

| Property     | Value                                        |
| ------------ | -------------------------------------------- |
| Token        | 32 bytes, crypto.getRandomValues             |
| Storage      | PostgreSQL sessions table                    |
| Transport    | httpOnly cookie (ambaril_session)            |
| Secure       | true in production                           |
| SameSite     | lax                                          |
| TTL          | 7 days (default), 30 days (remember me)      |
| Invalidation | DELETE from DB + cookie removal              |
| CSRF         | Next.js Server Actions (Origin header check) |

### 2.5 Security Headers

| Header                    | Value                                        | Purpose                  |
| ------------------------- | -------------------------------------------- | ------------------------ |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | Force HTTPS              |
| Content-Security-Policy   | default-src 'self'; ...                      | Prevent XSS, injection   |
| X-Content-Type-Options    | nosniff                                      | Prevent MIME sniffing    |
| X-Frame-Options           | DENY                                         | Prevent clickjacking     |
| Referrer-Policy           | strict-origin-when-cross-origin              | Control referrer leakage |
| Permissions-Policy        | camera=(), microphone=(), geolocation=()     | Disable unused APIs      |

---

## 3. OWASP Top 10 Coverage

| #   | Vulnerability             | Ambaril Control                                                     |
| --- | ------------------------- | ------------------------------------------------------------------- |
| A01 | Broken Access Control     | RBAC + RLS + tenant isolation + permission checks in server actions |
| A02 | Cryptographic Failures    | AES-256-GCM credentials, Argon2id passwords, HTTPS enforced         |
| A03 | Injection                 | Drizzle ORM (parameterized), Zod validation, React auto-escaping    |
| A04 | Insecure Design           | Security gates in lifecycle, threat modeling per feature            |
| A05 | Security Misconfiguration | Security headers, env separation, no debug in prod                  |
| A06 | Vulnerable Components     | pnpm audit in CI, pnpm.overrides for CVE fixes                      |
| A07 | Auth & Session            | Argon2id, rate limiting, session TTL, httpOnly cookies              |
| A08 | Data Integrity            | Zod schema validation, audit logs, soft deletes                     |
| A09 | Logging & Monitoring      | Sentry, audit_logs table, structured logging (pino)                 |
| A10 | SSRF                      | URL validation, domain whitelists, private IP blocking              |

---

## 4. LGPD Compliance Checklist

See `docs/platform/LGPD.md` for full compliance documentation.

| Requirement              | Implementation                     | Status       |
| ------------------------ | ---------------------------------- | ------------ |
| Consent collection       | crm.consents table                 | Schema ready |
| Data subject access      | /api/lgpd/data-export              | Planned      |
| Right to deletion        | /api/lgpd/deletion-request         | Planned      |
| Data minimization        | PII separated in crm.personal_data | Schema ready |
| Retention policy         | Automated purge cron               | Planned      |
| Data breach notification | Alert via Discord/email            | Planned      |

---

## 5. Incident Response

### Severity Levels

| Level | Definition                        | Response Time    | Example                         |
| ----- | --------------------------------- | ---------------- | ------------------------------- |
| P0    | Data breach, credentials exposed  | Immediate (< 1h) | DB dump, API key leaked         |
| P1    | Auth bypass, privilege escalation | < 4h             | IDOR, session hijack            |
| P2    | Information disclosure, XSS       | < 24h            | User enumeration, reflected XSS |
| P3    | Configuration weakness            | Next sprint      | Missing headers, weak defaults  |

### Response Steps

1. **Contain**: Disable affected endpoint/feature
2. **Assess**: Determine blast radius (which tenants, which data)
3. **Fix**: Patch the vulnerability
4. **Notify**: LGPD requires notification within 72h for data breaches
5. **Review**: Post-mortem, update security gates to prevent recurrence

---

## 6. Security Audit Schedule

| Frequency    | Action                                         |
| ------------ | ---------------------------------------------- |
| Every commit | Pre-commit: gitleaks (secrets scan)            |
| Every PR     | CI: tsc + eslint + pnpm audit                  |
| Weekly       | Dependency vulnerability scan                  |
| Monthly      | Review audit logs for anomalies                |
| Quarterly    | ESAA-Security protocol (95 checks, 16 domains) |
| Annually     | External penetration test                      |

---

## 7. Quick Reference — Do's and Don'ts

### DO

- Validate ALL input with Zod before processing
- Check permissions in EVERY server action
- Use withTenantContext() for all DB mutations
- Select specific columns in queries
- Escape HTML in email templates
- Rate limit all public endpoints
- Log security events to audit_logs
- Rotate encryption keys quarterly

### DON'T

- Accept IDs from client hidden fields
- Use .select() without column specification
- Log passwords, tokens, or secrets
- Skip permission checks ("only admin uses this")
- Trust client-side permission hiding as security
- Use dangerouslySetInnerHTML with user data
- Hardcode credentials in source code
- Commit .env files

---

## 8. Enforcement Mechanisms (How Security is Enforced Automatically)

The security framework operates as a **closed loop** — not just documentation, but active enforcement at every stage:

### Layer 1: CLAUDE.md Agent Directives (Design + Build time)

Claude Code reads `CLAUDE.md` at the start of EVERY conversation. The file contains **10 security directives (S1-S10)** that are marked as "invioláveis" (inviolable). These enforce:

- **S1**: Server action tríade (auth + permission + Zod) — Claude must write this pattern for every action
- **S2**: Tenant isolation + explicit columns — Claude cannot write bare `.select()`
- **S3**: Zod validation — Claude cannot process raw input
- **S4**: HTML escaping — Claude must use `escapeHtml()` outside React
- **S5**: SSRF protection — Claude must use `safeFetch()` for external URLs
- **S6**: Audit trail — Claude must add audit calls for sensitive mutations
- **S7**: Secret hygiene — Claude cannot log sensitive data
- **S8**: API route auth — Claude must add auth to every new route
- **S9**: Mental checklist — 6 questions before writing any endpoint
- **S10**: Post-implementation verification — checklist including `security-check.sh`

**How it works:** CLAUDE.md is injected into the system prompt. Claude is contractually bound to follow these rules. The `S10` directive requires running verification before reporting completion.

### Layer 2: security-check.sh (Verify time)

`scripts/security-check.sh` is an automated scanner that catches:

| Check | What it detects                                       | Exit      |
| ----- | ----------------------------------------------------- | --------- |
| S1    | Server actions without auth (excluding public routes) | VIOLATION |
| S2    | Bare `.select()` without column specification         | WARNING   |
| S3    | Console output containing password/secret/token/key   | VIOLATION |
| S4    | Multiple `dangerouslySetInnerHTML` usages             | WARNING   |
| S5    | Direct `fetch()` in provider code without `safeFetch` | WARNING   |
| S6    | Missing HSTS/CSP headers in `next.config.ts`          | VIOLATION |
| S7    | `.env` files tracked by git                           | VIOLATION |
| S8    | Source maps enabled in production                     | WARNING   |

**How it works:** Script returns exit code 0 (clean) or 1 (violations). Violations block completion. Warnings are informational.

**When it runs:**

- **During development:** Claude runs it via directive S10 before completing any task
- **Pre-commit:** `husky` runs `lint-staged` which catches linting issues
- **CI pipeline:** GitHub Actions runs `security-check.sh` on every push/PR

### Layer 3: CI/CD Pipeline (Verify time, automated)

`.github/workflows/ci.yml` runs on every push to `main`/`dev` and every PR:

```
quality:
  1. pnpm install --frozen-lockfile  (reproducible deps)
  2. pnpm type-check                 (TypeScript strict)
  3. pnpm lint                       (ESLint + security plugin)
  4. pnpm audit --audit-level=high   (CVE scan)
  5. bash scripts/security-check.sh  (ESAA patterns)

security:
  6. gitleaks                         (secrets in git history)
```

### Layer 4: Pre-commit Hooks (Build time, local)

`.husky/pre-commit` runs before every git commit:

- `eslint` with `eslint-plugin-security` (8 rules: eval detection, unsafe regex, child_process, timing attacks)
- Blocks commit on violations

### Layer 5: Runtime Enforcement (Monitor time)

- **RLS policies** in PostgreSQL prevent cross-tenant data access even if application code has bugs
- **Idle timeout** (2h) in `getSession()` auto-expires inactive sessions
- **Session cleanup cron** (`/api/cron/cleanup`) purges expired sessions/tokens
- **Audit logs** record all sensitive mutations with user, tenant, and action context
- **Structured logger** outputs JSON in production for log aggregation

### The Circular Flow in Practice

```
Developer (or Claude) wants to add a feature
    │
    ▼
┌──────────────────────────────────────────────────────┐
│ GATE 1: DESIGN (CLAUDE.md S9 — mental checklist)     │
│ - Who can access? What input? What data returns?     │
│ - Crosses tenant boundary? Destructive? External?    │
└──────────────┬───────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│ GATE 2: BUILD (CLAUDE.md S1-S8 — mandatory patterns) │
│ - getTenantSession() + hasPermission()               │
│ - Zod validation on ALL input                        │
│ - .select({columns}) + withTenantContext()            │
│ - escapeHtml() for non-React HTML                    │
│ - safeFetch() for external URLs                      │
│ - audit() for sensitive mutations                    │
└──────────────┬───────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│ GATE 3: VERIFY (automated checks)                    │
│ - pnpm type-check (TypeScript strict)                │
│ - bash scripts/security-check.sh (ESAA patterns)     │
│ - husky pre-commit (eslint-plugin-security)          │
│ - GitHub Actions CI (type, lint, audit, gitleaks)    │
└──────────────┬───────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│ GATE 4: MONITOR (runtime)                            │
│ - PostgreSQL RLS (tenant isolation)                  │
│ - Session idle timeout (2h auto-expire)              │
│ - Audit logs (DB + structured console)               │
│ - Cleanup cron (expired sessions/tokens)             │
│ - Security headers (CSP, HSTS, X-Frame, etc.)        │
└──────────────┬───────────────────────────────────────┘
               │
               ▼
         Feedback loop → next feature starts at GATE 1
```

### Quarterly: ESAA-Security Full Audit (95 checks, 16 domains)

Run the ESAA-Security protocol every quarter to measure score progression and catch drift. The protocol covers areas that automated checks cannot (e.g., SSRF in new integrations, MFA adoption, LGPD compliance status).
