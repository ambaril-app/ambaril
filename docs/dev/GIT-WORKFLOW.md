# GIT-WORKFLOW.md — Git Workflow & Branching Strategy

> Ambaril (Ambaril) -- Brazilian Streetwear SaaS
> Monorepo: Turborepo with `apps/web`, `apps/discord-bot`, `packages/db`, `packages/ui`, `packages/shared`, `packages/email`
> Last updated: 2026-03-17

---

## 1. Overview

Git-based workflow optimized for a small team (1-2 devs) building a modular SaaS monorepo. GitHub is the remote host.

**Goals:**

- **Clean history** — every commit on `develop` and `main` tells a coherent story.
- **Traceable changes** — every merge links back to a PR and issue.
- **Safe deployments** — `main` is always production-ready; `develop` is always staging-ready.
- **Low ceremony** — minimal process that stays out of the way when moving fast.

---

## 2. Branching Strategy

```
main (production — always deployable)
  └── develop (staging / integration)
       ├── feat/checkout/cart-flow
       ├── feat/erp/nfe-emission
       ├── fix/crm/rfm-calculation
       ├── chore/db/add-indexes
       └── docs/pcp/update-spec
```

### 2.1 Long-lived Branches

| Branch | Purpose | Deploys to |
|--------|---------|------------|
| `main` | Production-ready code | Production (Vercel) |
| `develop` | Integration branch, staging | Staging (Vercel preview) |

### 2.2 Short-lived Branches

Created from `develop`, merged back into `develop`, then deleted.

| Prefix | Use | Example |
|--------|-----|---------|
| `feat/` | New feature or module | `feat/pcp/production-orders` |
| `fix/` | Bug fix | `fix/erp/stock-negative-guard` |
| `chore/` | Tooling, config, deps | `chore/ci/add-playwright` |
| `refactor/` | Code restructure (no behavior change) | `refactor/crm/extract-rfm-service` |
| `docs/` | Documentation only | `docs/api/update-endpoints` |
| `hotfix/` | Urgent production fix (branches from `main`) | `hotfix/checkout/pix-timeout` |

### 2.3 Naming Convention

Format: `{type}/{module}/{short-description}`

**Module** matches the codebase domain:

| Category | Modules |
|----------|---------|
| Commerce | `checkout`, `b2b` |
| Operations | `erp`, `pcp`, `trocas` |
| Growth | `crm`, `creators`, `marketing-intel` |
| Communication | `whatsapp`, `clawdbot` |
| Team | `inbox`, `tarefas`, `dam` |
| Intelligence | `dashboard` |
| Platform | `auth`, `db`, `ui`, `shared`, `infra`, `ci`, `email` |

**Short description:** kebab-case, max 4 words.

**Examples:**

```
feat/pcp/supplier-scoring
feat/checkout/pix-qr-flow
fix/checkout/pix-qr-expiry
fix/erp/negative-stock-guard
chore/db/seed-dev-data
chore/ci/add-playwright
refactor/crm/extract-rfm-service
docs/api/update-endpoints
hotfix/checkout/pix-timeout
```

---

## 3. Commit Convention (Conventional Commits)

Every commit message follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### 3.1 Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 3.2 Types

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructure (no behavior change) |
| `style` | Formatting, whitespace, semicolons |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `chore` | Build, CI, deps, tooling |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |

### 3.3 Scope

The scope is the module name, matching the branch module: `checkout`, `erp`, `crm`, `pcp`, `db`, `ui`, `auth`, etc.

For cross-cutting changes, use a general scope: `shared`, `infra`, `deps`.

### 3.4 Rules

- **Subject line:** imperative mood, lowercase, no period, max 72 characters.
- **Body:** wrap at 72 characters, explain **why** not what.
- **Footer:** `Closes #123`, `Breaking: description`.
- **Language:** English always (code and commits). UI-facing strings are PT-BR, but commit messages are EN.

### 3.5 Examples

```
feat(pcp): add supplier reliability scoring

Calculate reliability score based on on-time delivery rate,
quality rating, and communication responsiveness. Score is
updated after each delivery is marked as received.

Closes #45
```

```
fix(erp): prevent negative stock on concurrent order processing

Add optimistic locking with version column to prevent race
condition where two simultaneous orders could both pass the
stock check and create negative inventory.
```

```
chore(db): add tsvector indexes for global search

Add GIN indexes on contacts, products, and orders tables
for Portuguese full-text search configuration.
```

```
refactor(crm): extract RFM scoring into standalone service

Move RFM calculation logic from API route handler into
dedicated service for reuse in scheduled jobs and reports.
```

```
perf(checkout): cache shipping quotes for 5 minutes

Melhor Envio API calls are slow (~800ms). Cache quotes by
zip+items hash in Redis to avoid redundant calls during
the same checkout session.
```

```
test(erp): add margin calculator edge cases

Cover negative margin, zero-cost, and multi-variant
weighted margin scenarios.
```

---

## 4. Workflow Steps

### 4.1 Starting Work

```bash
git checkout develop
git pull origin develop
git checkout -b feat/module/description
```

### 4.2 During Development

Commit frequently with meaningful messages. Keep commits atomic — one logical change per commit.

```bash
# Stage specific files (preferred over git add .)
git add apps/web/src/modules/pcp/services/supplier-scoring.ts
git add packages/db/src/schema/pcp.ts

git commit -m "feat(pcp): add supplier reliability scoring"
```

Rebase onto `develop` periodically to stay current and avoid painful merge conflicts later:

```bash
git fetch origin
git rebase origin/develop
```

If conflicts arise during rebase, resolve them file by file, then:

```bash
git add <resolved-file>
git rebase --continue
```

### 4.3 Before Opening a PR

Run the full check suite locally:

```bash
# Lint
pnpm lint

# Type check
pnpm typecheck

# Tests
pnpm test

# Build (catch import/export issues)
pnpm build
```

Rebase onto latest `develop` and push:

```bash
git fetch origin
git rebase origin/develop
git push origin feat/module/description
# If you've rebased and already pushed before:
git push origin feat/module/description --force-with-lease
```

> Use `--force-with-lease` instead of `--force`. It refuses to push if the remote has commits you haven't seen, preventing accidental overwrites.

### 4.4 Opening a Pull Request

Create a PR targeting `develop`:

```bash
gh pr create \
  --base develop \
  --title "feat(pcp): add supplier reliability scoring" \
  --body "$(cat <<'EOF'
## Summary
- Add supplier reliability scoring based on delivery, quality, and communication
- Score recalculated on each delivery receipt
- Visible in supplier detail page and PCP planning view

## Type
- [x] Feature

## Module(s) affected
PCP, ERP (supplier entity)

## Testing
- [x] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [x] Manually tested in development

## Checklist
- [x] TypeScript strict mode passes
- [x] No `any` types introduced
- [x] API follows envelope pattern (API.md)
- [x] PT-BR strings for UI, EN for code
EOF
)"
```

### 4.5 After Review

If changes are requested, push additional commits. Do not amend/squash during review — it makes re-review harder. The branch will be squash-merged anyway.

### 4.6 After Merge

```bash
git checkout develop
git pull origin develop
# The remote branch is auto-deleted after merge
git branch -d feat/module/description
```

---

## 5. PR Template

Save this as `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Summary
<!-- 1-3 bullet points describing the change -->

## Type
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Chore
- [ ] Docs

## Module(s) affected
<!-- e.g., ERP, PCP, CRM -->

## Screenshots / ASCII
<!-- UI changes: include screenshot or ASCII wireframe -->

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if UI change)
- [ ] Manually tested in development

## Checklist
- [ ] TypeScript strict mode passes
- [ ] No `any` types introduced
- [ ] API follows envelope pattern (API.md)
- [ ] UI follows DS.md patterns
- [ ] PT-BR strings for UI, EN for code
- [ ] Permissions checked (AUTH.md)
- [ ] Audit log events added (if data mutation)
- [ ] Flare notifications added (if user-facing event)
- [ ] Search index updated (if searchable entity)
- [ ] LGPD compliance verified (if personal data)
- [ ] Mobile responsive (if UI change)
- [ ] Migration is reversible
```

---

## 6. Merge Strategy

| Merge direction | Strategy | Reason |
|----------------|----------|--------|
| Feature branch -> `develop` | **Squash merge** | Keeps `develop` history clean; one commit per feature/fix |
| `develop` -> `main` | **Merge commit** | Preserves the release boundary; easy to diff releases |

**Rules:**

- Delete the source branch after every merge.
- Never force-push to `develop` or `main`.
- Never merge directly to `main` (except hotfixes).

---

## 7. Release Flow

```
feat/... ──squash──> develop ──merge commit──> main (tagged)
```

### 7.1 Creating a Release

```bash
git checkout develop
git pull origin develop

# Ensure CI is green, staging looks good
git checkout main
git pull origin main
git merge develop --no-ff
git tag v1.2.0
git push origin main --tags
```

### 7.2 Versioning (SemVer)

Follow [Semantic Versioning](https://semver.org/):

| Change | Version bump | Example |
|--------|-------------|---------|
| Breaking API change | MAJOR | `v1.0.0` -> `v2.0.0` |
| New feature or module | MINOR | `v1.0.0` -> `v1.1.0` |
| Bug fix | PATCH | `v1.0.0` -> `v1.0.1` |

**Tag format:** `v{major}.{minor}.{patch}`

**Phased rollout tags:**

| Phase | Module(s) | Tag |
|-------|-----------|-----|
| Phase 1 | CRM | `v0.1.0` |
| Phase 2 | ERP + Checkout | `v0.2.0` |
| Phase 3 | PCP + Trocas | `v0.3.0` |
| ... | ... | ... |

The version tracks the overall platform, not individual modules. Once the platform reaches GA, bump to `v1.0.0`.

### 7.3 After Release

Ensure `develop` has everything from `main` (including the merge commit and any hotfixes):

```bash
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

---

## 8. Hotfix Flow

Hotfixes bypass `develop` and go straight to `main` for urgent production issues.

```bash
# Branch from main
git checkout main
git pull origin main
git checkout -b hotfix/checkout/pix-timeout

# Fix the issue, write tests
git add .
git commit -m "fix(checkout): handle Pix QR code timeout after 30 minutes"

# Push and open PR to main
git push origin hotfix/checkout/pix-timeout
gh pr create --base main --title "fix(checkout): handle Pix QR code timeout"
```

After the hotfix PR is merged to `main`:

```bash
# Sync develop with the fix
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

---

## 9. CI/CD Integration

> See [INFRA.md](../architecture/INFRA.md) for full infrastructure details.

### 9.1 On PR to `develop`

Runs automatically via GitHub Actions on every push to a PR branch:

- ESLint check
- TypeScript type check (`tsc --noEmit`)
- Unit + integration tests (Vitest)
- Build check (`next build`)
- **Affected packages only** — Turborepo filters to changed packages for speed

### 9.2 On Merge to `develop`

- Deploy to staging (Vercel preview environment)
- Run E2E tests against staging (Playwright)
- Database migration dry-run against Neon staging branch
- Post result to Discord `#dev-log`

### 9.3 On Merge to `main`

- Deploy to production (Vercel production)
- Run database migrations (Drizzle)
- Create GitHub Release with auto-generated changelog
- Tag the release (`v{major}.{minor}.{patch}`)
- Notify Discord `#alertas` channel via Pulse bot

### 9.4 Turborepo Task Graph

CI leverages Turborepo's dependency graph to only run tasks for affected packages:

```bash
# Only lint/test/build packages that changed or depend on changed packages
turbo run lint test build --filter=...[origin/develop]
```

This keeps CI fast even as the monorepo grows.

---

## 10. Git Hooks (Husky + lint-staged)

Hooks run locally to catch issues before they reach CI.

### 10.1 Setup

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky init
```

### 10.2 Hook Configuration

| Hook | Action | Purpose |
|------|--------|---------|
| `pre-commit` | Run lint-staged (ESLint + Prettier on staged files) | Catch formatting and lint errors before commit |
| `commit-msg` | Validate conventional commit format (commitlint) | Enforce commit message convention |
| `pre-push` | Run typecheck + affected tests | Prevent pushing broken code |

### 10.3 lint-staged Config

In `package.json` or `.lintstagedrc`:

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

### 10.4 commitlint Config

In `commitlint.config.js`:

```js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "checkout", "b2b",
        "erp", "pcp", "trocas",
        "crm", "creators", "marketing-intel",
        "whatsapp", "clawdbot",
        "inbox", "tarefas", "dam",
        "dashboard",
        "auth", "db", "ui", "shared", "infra", "ci", "email",
        "deps",
      ],
    ],
    "subject-max-length": [2, "always", 72],
  },
};
```

### 10.5 Husky Hook Scripts

`.husky/pre-commit`:
```bash
pnpm lint-staged
```

`.husky/commit-msg`:
```bash
npx --no -- commitlint --edit $1
```

`.husky/pre-push`:
```bash
pnpm typecheck && pnpm test --filter=...[origin/develop]
```

---

## 11. .gitignore

Essential entries for the monorepo. Keep a root `.gitignore` and let packages inherit.

```gitignore
# Dependencies
node_modules/

# Build output
.next/
dist/
.turbo/

# Environment variables (NEVER commit)
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# Test output
coverage/
playwright-report/
test-results/

# Generated DB artifacts
drizzle/*.sql

# IDE
.vscode/settings.json
.idea/

# Vercel
.vercel/
```

> Secrets (`.env` files) are managed per environment in Vercel and Railway dashboards. Never commit them. See [INFRA.md](../architecture/INFRA.md).

---

## 12. Protected Branch Rules

Configure these in GitHub repository settings.

| Branch | Rule | Value |
|--------|------|-------|
| `main` | Require pull request | Yes |
| `main` | Require status checks to pass | `lint`, `typecheck`, `test`, `build` |
| `main` | Require approvals | 1 (when team grows beyond 1 dev) |
| `main` | No force push | Yes |
| `main` | No deletions | Yes |
| `develop` | Require pull request | Yes |
| `develop` | Require status checks to pass | `lint`, `typecheck`, `test`, `build` |
| `develop` | No force push | Yes |
| `develop` | No deletions | Yes |

For a solo dev phase, the approval requirement on `main` can be relaxed, but all CI checks must still pass.

---

## 13. Tips & Best Practices

### Commit Hygiene

- Write commit messages as if explaining to a teammate who will read them 6 months later.
- One logical change per commit. If you say "and" in the subject, it should probably be two commits.
- Reference issue numbers: `Closes #123`, `Refs #456`.

### PR Discipline

- One PR per feature/fix. Do not bundle unrelated changes.
- Keep PRs small: aim for <400 lines changed.
- If a feature is large, break it into stacked PRs that each deliver a working increment.
- PR title follows the same `type(scope): description` format as commits.

### Safety

- Never commit secrets (`.env` files, API keys, tokens). Use `.gitignore`.
- Use `--force-with-lease` instead of `--force` when you must force-push a feature branch.
- Never force-push to `develop` or `main`. Ever.

### Context Switching

- Use `git stash` when you need to switch branches mid-work:

```bash
git stash push -m "wip: cart validation logic"
git checkout fix/erp/stock-issue
# ... fix ...
git checkout feat/checkout/cart-flow
git stash pop
```

### Monorepo Considerations

- Turborepo handles build/test orchestration. You rarely need to think about package dependencies for CI.
- When making cross-package changes (e.g., `packages/db` schema change that affects `apps/web`), include all affected packages in a single PR.
- If a `packages/db` migration is required, the PR description must call it out explicitly.

---

## 14. Quick Reference

### Branch Cheat Sheet

```bash
# New feature
git checkout develop && git pull origin develop
git checkout -b feat/pcp/supplier-scoring

# Bug fix
git checkout develop && git pull origin develop
git checkout -b fix/erp/negative-stock-guard

# Hotfix (from main)
git checkout main && git pull origin main
git checkout -b hotfix/checkout/pix-timeout

# Stay current
git fetch origin && git rebase origin/develop
```

### Commit Cheat Sheet

```bash
# Feature
git commit -m "feat(pcp): add supplier reliability scoring"

# Fix
git commit -m "fix(erp): prevent negative stock on concurrent orders"

# Chore
git commit -m "chore(db): add tsvector indexes for global search"

# Refactor
git commit -m "refactor(crm): extract RFM scoring into standalone service"

# Test
git commit -m "test(checkout): add Pix payment timeout scenarios"

# With body (use editor)
git commit  # opens $EDITOR for multi-line message
```

### PR Cheat Sheet

```bash
# Open PR
gh pr create --base develop --title "feat(pcp): add supplier scoring"

# Check PR status
gh pr status

# View PR checks
gh pr checks

# Merge PR (squash)
gh pr merge --squash --delete-branch
```

---

## Related Docs

- [TESTING.md](../platform/TESTING.md) — Test strategy, what to test per module, coverage targets.
- [INFRA.md](../architecture/INFRA.md) — CI/CD pipeline details, hosting, deployment configuration.
- [API.md](../architecture/API.md) — API conventions, envelope pattern, error codes.
- [AUTH.md](../architecture/AUTH.md) — Authentication and authorization, permission model.
- [DATABASE.md](../architecture/DATABASE.md) — Schema conventions, migrations, Drizzle patterns.
