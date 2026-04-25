# E2E Tests (Playwright)

## Running locally

```bash
pnpm exec playwright test
```

## Running in CI

```bash
pnpm exec playwright test --reporter=json
```

## Writing new tests

- Place test files in this directory with `.spec.ts` extension
- Follow the pattern: `{module}.spec.ts` (e.g., `erp.spec.ts`, `auth.spec.ts`)
- Multi-tenant isolation tests are MANDATORY for every module
