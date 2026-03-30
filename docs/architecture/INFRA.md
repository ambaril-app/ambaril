# INFRA.md -- Infrastructure, Deployment & CI/CD

> Ambaril (Ambaril) infrastructure reference.
> Last updated: 2026-03-29

---

## 1. Hosting Architecture

| Component | Service | Rationale |
|-----------|---------|-----------|
| **Web App (Next.js)** | Vercel (recommended) | Zero-config Next.js hosting, edge functions, preview deploys, built-in analytics. Self-hosted alternatives: Coolify, Docker on Fly.io, or AWS Amplify. |
| **Background Jobs** | Vercel Cron + PostgreSQL queues | Scheduled via `vercel.json` cron config, job state in PostgreSQL `global.job_queue` table. No separate worker process needed. |
| **Database** | Neon PostgreSQL (serverless) | Serverless scaling, instant branching per PR, point-in-time recovery, connection pooling built in. |
| **File Storage** | Cloudflare R2 | S3-compatible object storage with zero egress fees. Powers the DAM module (product images, brand assets, UGC). |
| **Email** | Resend | Transactional and marketing emails. React Email templates, high deliverability, webhook tracking. |
| **DNS** | Cloudflare | DNS, CDN, DDoS protection, custom domain routing, R2 custom domain for asset CDN. |

### Architecture Diagram

```
                          +------------------+
                          |   Cloudflare     |
                          |   DNS + CDN      |
                          +--------+---------+
                                   |
                    +--------------+--------------+
                    |                             |
            +-------+--------+          +---------+---------+
            |  Vercel         |          |  assets.ambaril.app|
            |  Next.js + Cron |          |  Cloudflare R2     |
            +--+-----+----+--+          +--------------------+
               |     |    |
     +---------+     |    +------------+
     |               |                 |
+----+--------+ +----+----------+ +----+-------------+
| Neon        | | Vercel Cron   | | External APIs    |
| PostgreSQL  | | (job_queue)   | | - Mercado Pago   |
| + job_queue | +---------------+ | - Focus NF-e     |
+-------------+                   | - Melhor Envio   |
                                  | - WhatsApp/Meta  |
                                  | - Instagram      |
                                  | - Discord        |
                                  | - Resend         |
                                  | - Claude AI      |
                                  | - Sentry         |
                                  +------------------+

Flow:
  User --> Cloudflare --> Vercel (Next.js SSR/API) --> Neon (PG + job_queue) + R2 (files)
  Vercel Cron --> /api/cron/* routes --> Neon (process pending jobs) + External APIs
  External webhooks --> Vercel API routes --> job_queue (INSERT) --> next cron tick processes
```

---

## 2. Environments

| Environment | DB Branch | URL | Purpose |
|-------------|-----------|-----|---------|
| **Development** | `dev` (branched from `main`) | `localhost:3000` | Local development. Each developer can create personal Neon branches from `dev`. Hot reload, seed data, mocked external APIs where possible. |
| **Staging** | `staging` (branched from `main`) | `staging.ambaril.app` | Pre-production validation. Connected to sandbox/test accounts for Mercado Pago, Focus NF-e (homologacao), Melhor Envio (sandbox). Used for QA, client demos, and UAT. Mirrors production config with test credentials. |
| **Production** | `main` | `app.ambaril.app` | Live environment. Real payment processing, real NF-e emission, real shipping quotes. Zero-downtime deploys via Vercel. Database migrations run post-deploy with automatic rollback capability. |

**PR Preview Environments:**
- Every pull request automatically gets a Vercel preview URL (`pr-{number}.ambaril.vercel.app`).
- A dedicated Neon branch is created from `staging` for each PR.
- Preview environments are ephemeral and destroyed when the PR is closed or merged.

---

## 3. Environment Variables

All environment variables required by the system. Store in Vercel environment settings (per environment).

### Database & Jobs

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string (pooled) | `postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/ambaril?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | Direct connection (for migrations only) | `postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/ambaril?sslmode=require` |
| `CRON_SECRET` | Secret token to authenticate Vercel Cron requests | `openssl rand -base64 32` |

### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `SESSION_SECRET` | Random 32+ char secret for session token signing | `openssl rand -base64 32` |
| `APP_URL` | Canonical URL of the application | `https://app.ambaril.app` |

### Payments (Mercado Pago)

| Variable | Description | Example |
|----------|-------------|---------|
| `MERCADO_PAGO_ACCESS_TOKEN` | Production/sandbox access token | `APP_USR-xxx` |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Secret for webhook signature validation | `whsec_xxx` |

### Fiscal (Focus NF-e)

| Variable | Description | Example |
|----------|-------------|---------|
| `FOCUS_NFE_API_KEY` | API token for Focus NF-e service | `xxx` |
| `FOCUS_NFE_BASE_URL` | Base URL (production vs. homologacao) | `https://api.focusnfe.com.br/v2` or `https://homologacao.focusnfe.com.br/v2` |

### Shipping (Melhor Envio)

| Variable | Description | Example |
|----------|-------------|---------|
| `MELHOR_ENVIO_TOKEN` | OAuth bearer token | `eyJhbG...` |
| `MELHOR_ENVIO_WEBHOOK_SECRET` | Webhook signature secret | `whsec_xxx` |

### WhatsApp (Meta Cloud API)

| Variable | Description | Example |
|----------|-------------|---------|
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID from Meta Business | `1234567890` |
| `WHATSAPP_ACCESS_TOKEN` | Permanent system user token | `EAAx...` |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Custom string for webhook verification | `ambaril_wh_verify_xxx` |

### Instagram (Meta Graph API)

| Variable | Description | Example |
|----------|-------------|---------|
| `INSTAGRAM_APP_ID` | Meta App ID for Instagram integration | `123456789` |
| `INSTAGRAM_APP_SECRET` | Meta App Secret | `abc123...` |

### Discord

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_BOT_TOKEN` | Bot token for the Ambaril Discord bot | `MTIz...` |
| `DISCORD_GUILD_ID` | Server (guild) ID | `987654321` |
| `DISCORD_CHANNEL_ALERTAS` | Channel ID for critical alerts | `111111111` |
| `DISCORD_CHANNEL_PEDIDOS` | Channel ID for order notifications | `222222222` |
| `DISCORD_CHANNEL_FINANCEIRO` | Channel ID for financial notifications | `333333333` |
| `DISCORD_CHANNEL_CREATORS` | Channel ID for creator activity | `444444444` |
| `DISCORD_CHANNEL_B2B` | Channel ID for B2B activity | `555555555` |

### Email (Resend)

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key | `re_xxx` |

### AI (Claude)

| Variable | Description | Example |
|----------|-------------|---------|
| `CLAUDE_API_KEY` | Anthropic API key for Claude integration | `sk-ant-xxx` |

### File Storage (Cloudflare R2)

| Variable | Description | Example |
|----------|-------------|---------|
| `R2_ACCOUNT_ID` | Cloudflare account ID | `abc123` |
| `R2_ACCESS_KEY_ID` | R2 S3-compatible access key | `xxx` |
| `R2_SECRET_ACCESS_KEY` | R2 S3-compatible secret key | `xxx` |
| `R2_BUCKET_NAME` | Bucket name | `ambaril-assets` |
| `R2_PUBLIC_URL` | Public CDN URL for the bucket | `https://assets.ambaril.app` |

### Monitoring

| Variable | Description | Example |
|----------|-------------|---------|
| `SENTRY_DSN` | Sentry Data Source Name | `https://xxx@o123.ingest.sentry.io/456` |
| `SENTRY_AUTH_TOKEN` | Sentry auth token (for source maps) | `sntrys_xxx` |

### Application

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL (available client-side) | `https://app.ambaril.app` |
| `NEXT_PUBLIC_CHECKOUT_URL` | Checkout domain | `https://checkout.ambaril.app` |
| `NODE_ENV` | Node environment | `production` |

> **Security notes:**
> - Never commit `.env` files. Use `.env.example` with placeholder values.
> - All secrets must be stored in the hosting platform's secret manager.
> - Rotate `SESSION_SECRET` and API keys quarterly.
> - Use separate API keys/tokens per environment (dev/staging/prod).

---

## 4. CI/CD Pipeline

### GitHub Actions Workflow

The pipeline runs on every push and pull request against `main`.

#### On Pull Request

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      # Step 1: Lint
      - run: pnpm lint

      # Step 2: Type-check
      - run: pnpm type-check

      # Step 3: Test
      - run: pnpm test
        env:
          DATABASE_URL: ${{ secrets.NEON_TEST_DATABASE_URL }}

      # Step 4: Build
      - run: pnpm build

  neon-branch:
    runs-on: ubuntu-latest
    steps:
      # Create a Neon branch for this PR
      - uses: neondatabase/create-branch-action@v5
        with:
          project_id: ${{ secrets.NEON_PROJECT_ID }}
          parent: staging
          branch_name: pr-${{ github.event.pull_request.number }}
          api_key: ${{ secrets.NEON_API_KEY }}

      # Run migrations on the PR branch
      - run: pnpm db:migrate
        env:
          DATABASE_URL: ${{ steps.neon.outputs.db_url }}

  # Step 5: Preview deploy (handled by Vercel GitHub integration)
  # Vercel auto-deploys preview for every PR commit
```

#### On Merge to Main (Production Deploy)

```yaml
# .github/workflows/deploy.yml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      # Step 1: Lint
      - run: pnpm lint

      # Step 2: Type-check
      - run: pnpm type-check

      # Step 3: Test
      - run: pnpm test

      # Step 4: Build
      - run: pnpm build

      # Step 5: Deploy to Vercel Production
      - run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}

      # Step 6: Run database migrations on production
      - run: pnpm db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_UNPOOLED }}

  cleanup-neon-branches:
    runs-on: ubuntu-latest
    steps:
      # Delete the Neon branch for the merged PR
      - uses: neondatabase/delete-branch-action@v3
        with:
          project_id: ${{ secrets.NEON_PROJECT_ID }}
          branch: pr-${{ github.event.pull_request.number }}
          api_key: ${{ secrets.NEON_API_KEY }}
```

#### PR Preview Flow

1. Developer opens a PR.
2. GitHub Actions runs lint, type-check, test, build.
3. Neon branch `pr-{number}` is auto-created from `staging`.
4. Migrations run on the PR branch.
5. Vercel deploys a preview URL with the PR branch database.
6. QA team reviews at the preview URL.
7. On merge: PR branch is deleted, production deploy triggers.
8. On close (without merge): PR branch is deleted, preview is removed.

---

## 5. Monitoring

### Error & Performance Tracking

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Sentry** | Error tracking, performance monitoring, session replay | Installed in Next.js (client + server + edge). Source maps uploaded during CI. Alert rules for new errors, error spikes, and performance regressions. |
| **Vercel Analytics** | Web Vitals (LCP, FID, CLS, TTFB, INP) | Enabled in `next.config.js`. Tracks Core Web Vitals per route. Alerts on degradation. |
| **Vercel Cron Dashboard** | Background job monitoring | Cron execution logs visible in Vercel dashboard (Logs tab). Job history queryable via `global.job_queue` table in admin UI at `/admin/jobs`. |

### Uptime Monitoring

| Check | Endpoint | Interval | Timeout | Alert |
|-------|----------|----------|---------|-------|
| App health | `GET /api/health` | 60s | 10s | Discord #alertas |
| Checkout health | `GET /api/health` on checkout domain | 60s | 10s | Discord #alertas |
| Cron health | Query `job_queue` for stale jobs (`status = 'processing'` older than 10 min) | 300s | 10s | Discord #alertas |
| Database | Connection pool check via health endpoint | 60s | 5s | Discord #alertas |

Use an external uptime service (e.g., BetterUptime, UptimeRobot, or Checkly) for these checks.

### Structured Logging

All logs are JSON-formatted with the following fields:

```json
{
  "timestamp": "2026-03-17T14:30:00.000Z",
  "level": "info",
  "message": "Order created",
  "module": "erp",
  "requestId": "req_abc123",
  "userId": "usr_xyz",
  "metadata": {
    "orderId": "ord_456",
    "total": 29900
  }
}
```

- **Correlation IDs**: Every incoming request gets a `requestId` (generated or from `x-request-id` header). This ID propagates to all downstream calls, database queries, background jobs, and audit logs.
- **Log levels**: `debug` (dev only), `info`, `warn`, `error`, `fatal`.
- **Sensitive data**: Never log passwords, tokens, CPF numbers, or full credit card numbers.

### Alert Channels

| Severity | Channel | Examples |
|----------|---------|----------|
| **Critical** | Discord `#alertas` + SMS (optional) | App down, database unreachable, payment webhook failures, cron route returning 5xx |
| **Warning** | Discord `#alertas` | Error rate spike, slow queries (>2s), job_queue backup (>100 pending jobs) |
| **Non-critical** | Sentry dashboard | Individual errors, deprecation warnings, minor performance issues |

---

## 6. Backup & Disaster Recovery

### Database (Neon PostgreSQL)

| Feature | Detail |
|---------|--------|
| **PITR (Point-in-Time Recovery)** | Neon provides continuous backup with point-in-time recovery. Restore to any second within the retention window. |
| **Retention** | 7 days (free tier) / 30 days (Pro). Upgrade to Pro for production. |
| **Branch restore** | Create a new branch from any point in time. Test the restore before promoting. |
| **Procedure** | 1. Identify the timestamp before the incident. 2. Create a new branch from that timestamp. 3. Verify data integrity. 4. Promote the branch to `main` (or update the connection string). |

### File Storage (Cloudflare R2)

| Feature | Detail |
|---------|--------|
| **Object versioning** | Enabled on the `ambaril-assets` bucket. Every overwrite preserves the previous version. |
| **Lifecycle rules** | Delete non-current versions after 90 days. |
| **Cross-region** | R2 is automatically distributed. No additional replication needed. |

### Background Jobs (PostgreSQL job_queue)

| Feature | Detail |
|---------|--------|
| **Durable by design** | Job state lives in PostgreSQL (`global.job_queue` table), backed up via Neon PITR alongside all other data. |
| **Retry built-in** | Failed jobs are retried up to `max_attempts` (default 3). Jobs use `FOR UPDATE SKIP LOCKED` to prevent double-processing. |
| **No separate backup needed** | Job queue is part of the database -- covered by Neon's continuous backup and point-in-time recovery. |

### Recovery Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **RPO (Recovery Point Objective)** | 1 hour (database) | Neon PITR allows recovery to any second, but we target validating within 1 hour of an incident. |
| **RTO (Recovery Time Objective)** | 30 minutes | Time from incident detection to full service restoration. Vercel redeploy: ~3 min. Neon branch restore: ~5 min. DNS propagation: ~15 min. |

### Disaster Recovery Runbook

1. **App outage**: Vercel auto-recovers. If persistent, redeploy last known good commit.
2. **Database corruption**: Create Neon branch from PITR timestamp. Verify. Promote.
3. **Cron jobs not running**: Check Vercel dashboard Logs tab for cron execution errors. Verify `CRON_SECRET` env var. Manually trigger `/api/cron/*` routes if needed. Stale jobs in `job_queue` can be reset to `pending` status.
4. **R2 outage**: Cloudflare SLA. Fallback: serve placeholder images, queue uploads for retry.
5. **DNS failure**: Cloudflare SLA. Fallback: direct IP access for critical operations.

---

## 7. Domain Structure

| Domain | Purpose | Hosting | Notes |
|--------|---------|---------|-------|
| `app.ambaril.app` | Admin dashboard (main application) | Vercel | Protected by custom auth (PostgreSQL sessions). All 15 modules accessible here. |
| `checkout.ambaril.app` | Public-facing checkout flow | Vercel (same project, route group) | Minimal UI, optimized for conversion. No auth required for browsing. |
| `api.ambaril.app` | Public API (if separated) | Vercel or dedicated service | Optional. Initially, API routes live inside the Next.js app. Separate only if needed for third-party integrations or rate limiting isolation. |
| `creators.ambaril.app` | Creators portal | Vercel (same project, route group) | Separate auth scope for creators. Content submission, commission tracking, profile management. |
| `b2b.ambaril.app` | B2B wholesale portal | Vercel (same project, route group) | Separate auth scope for retailers. Wholesale catalog, bulk ordering, pricing tiers. |
| `assets.ambaril.app` | CDN for DAM/R2 assets | Cloudflare R2 custom domain | Product images, brand assets, UGC. Served via Cloudflare CDN with caching. |

### DNS Configuration (Cloudflare)

```
app.ambaril.app        CNAME  cname.vercel-dns.com    (proxied)
checkout.ambaril.app    CNAME  cname.vercel-dns.com    (proxied)
creators.ambaril.app    CNAME  cname.vercel-dns.com    (proxied)
b2b.ambaril.app         CNAME  cname.vercel-dns.com    (proxied)
api.ambaril.app         CNAME  cname.vercel-dns.com    (proxied)
assets.ambaril.app      CNAME  <r2-custom-domain>      (proxied)
```

---

## 8. Cost Estimation

Monthly cost estimates in USD based on traffic and usage tiers.

### Low Tier (Launch: ~500 orders/month, ~10k visitors)

| Service | Plan | Est. Cost/mo |
|---------|------|--------------|
| Vercel | Pro | $20 |
| Neon PostgreSQL | Launch (1 project, 10 GiB) | $19 |
| Cloudflare R2 | Pay-as-you-go (~10 GB stored) | $2 |
| Cloudflare DNS/CDN | Free | $0 |
| Resend | Free tier (3k emails/mo) | $0 |
| Sentry | Developer (5k errors) | $0 |
| BetterUptime | Free tier | $0 |
| **Total** | | **~$41/mo** |

### Medium Tier (Growth: ~5k orders/month, ~100k visitors)

| Service | Plan | Est. Cost/mo |
|---------|------|--------------|
| Vercel | Pro (extra bandwidth) | $40 |
| Neon PostgreSQL | Scale (50 GiB, more compute) | $69 |
| Cloudflare R2 | ~100 GB stored, moderate egress | $10 |
| Cloudflare DNS/CDN | Free | $0 |
| Resend | Pro (50k emails/mo) | $20 |
| Sentry | Team (50k errors) | $26 |
| BetterUptime | Pro | $20 |
| Claude API | Moderate usage | $50 |
| **Total** | | **~$235/mo** |

### High Tier (Scale: ~50k orders/month, ~1M visitors)

| Service | Plan | Est. Cost/mo |
|---------|------|--------------|
| Vercel | Enterprise or Pro (extra) | $100 |
| Neon PostgreSQL | Business (autoscaling) | $200 |
| Cloudflare R2 | ~1 TB stored | $50 |
| Cloudflare DNS/CDN | Pro ($20) | $20 |
| Resend | Business (500k emails/mo) | $80 |
| Sentry | Business (500k errors) | $80 |
| BetterUptime | Business | $40 |
| Claude API | Heavy usage | $200 |
| **Total** | | **~$770/mo** |

> **Notes:**
> - Mercado Pago, Focus NF-e, and Melhor Envio are pay-per-transaction (not monthly infrastructure costs).
> - WhatsApp Business API: Meta charges per conversation (~$0.03-0.08 per conversation, varies by category).
> - These estimates exclude developer salaries and third-party SaaS tools outside infrastructure.

---

## 9. Scaling Considerations

### When and How to Scale Each Component

#### Vercel (Next.js)

| Signal | Action |
|--------|--------|
| Response times > 1s on API routes | Optimize queries, consider ISR for static-ish pages, add PostgreSQL materialized views for heavy reads. |
| Serverless function cold starts | Use Vercel Edge Functions for latency-sensitive routes. Pre-warm critical paths. |
| Build times > 10 minutes | Split into smaller deployments, use `turbo` for incremental builds. |
| Need WebSockets | Vercel does not support persistent WebSockets. Use SSE (Server-Sent Events) per ADR-013, or move real-time features to a separate service if needed. |

#### Neon PostgreSQL

| Signal | Action |
|--------|--------|
| Query latency > 200ms on indexed queries | Review query plans (`EXPLAIN ANALYZE`), add missing indexes, optimize joins. |
| Connection pool exhaustion | Increase Neon compute size. Ensure connection pooling (`?pgbouncer=true`). |
| Storage approaching plan limit | Upgrade plan tier. Archive old audit logs and analytics data. |
| Need read replicas | Neon supports read replicas on Business plan. Route read-heavy queries (analytics, reports) to replicas. |

#### Vercel Cron + PostgreSQL Job Queue

| Signal | Action |
|--------|--------|
| Job processing lag > 5 minutes | Increase cron frequency (e.g., from every 5 min to every 1 min). Optimize job handler execution time. Process more jobs per tick (`LIMIT` in the `FOR UPDATE SKIP LOCKED` query). |
| `job_queue` table growing large | Archive completed/failed jobs older than 30 days to `global.job_queue_archive`. Add index on `(status, scheduled_at)`. |
| Cron timeout (Vercel 60s limit on Pro) | Break large jobs into smaller chunks. Use a "continuation" pattern: process N items, re-queue remaining. |
| Need sub-minute scheduling | Vercel Cron minimum is 1 minute. For near-real-time processing, use Server Actions that INSERT + immediately process inline, falling back to cron for retries. |

#### Cloudflare R2

| Signal | Action |
|--------|--------|
| Upload latency > 2s | Use multipart uploads for files > 5 MB. Use presigned URLs for direct client uploads. |
| Serving bottleneck | Cloudflare CDN handles this automatically. Ensure proper cache headers. |
| Storage costs growing | Implement lifecycle rules. Move infrequently accessed assets to cheaper storage class. Compress images on upload. |

#### Database Schema Scaling

| Signal | Action |
|--------|--------|
| Tables > 10M rows | Implement table partitioning (already planned for `audit_logs`, `analytics_events`). |
| Complex queries slowing down | Materialize views for dashboards. Pre-aggregate analytics. Consider read replicas. |
| Multi-tenant data isolation | Already using schema-per-module. If needed, add row-level security or separate databases per tenant (future multi-tenancy). |

#### General Scaling Milestones

| Orders/month | Key Actions |
|--------------|-------------|
| **0 - 1k** | Single Vercel deployment with Cron jobs. Default plans. Focus on feature development. |
| **1k - 10k** | Upgrade Neon to Scale. Increase cron frequency for critical jobs. Optimize queries. Add monitoring dashboards. |
| **10k - 50k** | Neon read replicas. CDN optimization. Consider separating checkout into its own service for isolation. Archive old job_queue rows. |
| **50k+** | Enterprise plans across the board. Multi-region consideration. Dedicated support contracts. Evaluate self-hosting for cost optimization. |
