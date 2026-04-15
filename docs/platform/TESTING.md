# TESTING.md — Testing Strategy

> Comnio (ex-Ambaril) -- Brazilian Streetwear SaaS
> Stack: Next.js 15, PostgreSQL (Neon), Vitest, Playwright, fast-check (PBT)
> Last updated: 2026-04-14

---

## 1. Philosophy

Testing at Ambaril is pragmatic, not dogmatic. Every test must justify its existence by protecting against a real regression that has happened or is likely to happen.

**Principles:**

- **Test what matters, skip the trivial.** A getter that returns a property does not need a test. A margin calculator that determines profitability does.
- **Schemas are first-class contracts.** Shared Zod schemas and validators define the inputs the product accepts; they must keep contract tests green before feature code can be considered safe.
- **Business logic is heavily tested.** Calculators, scoring algorithms, tier progression rules, state machines, and financial computations get 90%+ unit test coverage. These are where bugs cost real money.
- **API endpoints get integration tests.** Tested against a real PostgreSQL database (Neon test branch), not mocks. This catches query bugs, constraint violations, and migration issues that mocks would hide.
- **UI gets E2E tests for critical flows only.** The checkout purchase flow, order lifecycle, and exchange process are tested end-to-end with Playwright. We do not E2E test every button and dropdown.
- **No test for the sake of test.** If someone asks "what regression does this test prevent?" and the answer is "none, it just hits a coverage number," delete it.
- **Tests are documentation.** A well-written test file is the best specification of how a module's business logic works. Name tests as sentences that describe behavior.
- **Anti-tautologia obrigatória.** AI generates 1.7x more bugs than humans (CodeRabbit 2025). When the same LLM writes code AND tests, both share the same blind spots. Property-Based Testing (PBT) breaks this cycle by testing invariants derived from the SPEC, not from the implementation. New or modified business logic MUST have PBT tests alongside example-based tests.
- **Tests derive from specs, not from code.** Specs MUST include Given/When/Then scenarios that map mechanically to test cases. The LLM translates, it does not interpret.

---

## 2. Test Types and Tools

| Type           | Tool                           | Purpose                                                      | Coverage Target                                 | Runs On              |
| -------------- | ------------------------------ | ------------------------------------------------------------ | ----------------------------------------------- | -------------------- |
| Contract       | Vitest                         | Shared schema and validator contracts                        | 100% of shared schemas                          | Every PR + fast gate |
| Property (PBT) | Vitest + fast-check            | Invariants: FSMs, calculations, validators, tenant isolation | New/modified business logic                     | Every PR + PBT gate  |
| Unit           | Vitest                         | Pure business logic, utility functions, calculations         | 90%+ for business logic                         | Every PR             |
| Integration    | Vitest + real Neon DB          | API endpoints, DB queries, middleware, auth                  | Critical paths (target: 80%+ when modules ship) | Every PR             |
| E2E            | Playwright                     | Critical user flows across the full stack                    | Key paths only (no % target)                    | Staging deploy       |
| Component      | Vitest + React Testing Library | Complex interactive UI components                            | Complex components only                         | Every PR             |

### 2.1 Current Implementation Status

> What actually exists in the repo today vs what this strategy describes for the future.

| Layer                       | Status          | What exists                                                                                           | Where                       |
| --------------------------- | --------------- | ----------------------------------------------------------------------------------------------------- | --------------------------- |
| Contract tests              | **Implemented** | 46 tests — 18 validator schemas + 5 integration schemas                                               | `packages/shared`           |
| PBT (validators)            | **Implemented** | 15 tests — shared Zod validators                                                                      | `packages/shared`           |
| PBT (app security)          | **Implemented** | 3 tests — safe-fetch SSRF protection (private IPs, allowlist, acceptance)                             | `apps/web`                  |
| Unit (security utils)       | **Implemented** | 58 tests — maskForLLM, maskSensitive, sanitizePrompt                                                  | `packages/shared`           |
| Unit (app security)         | **Implemented** | 32 tests — validateExternalUrl + safeFetch (allowed domains, blocked IPs, protocols, timeout, signal) | `apps/web`                  |
| Integration (set_config)    | **Implemented** | 2 env-aware tests — withTenantContext set_config scoping + cross-call isolation                       | `apps/web`                  |
| Integration (RLS prereqs)   | **Implemented** | 4 env-aware tests — role exists, not BYPASSRLS, FORCE RLS on, policy clauses present                  | `apps/web`                  |
| Integration (RLS row-level) | **Implemented** | 3 env-aware tests — tenant A/B isolation + cross-tenant INSERT blocked (via SET LOCAL ROLE)           | `apps/web`                  |
| PBT (business logic)        | **Not yet**     | No FSMs, calculations, or scoring exist yet                                                           | Module-by-module when built |
| E2E (Playwright)            | **Implemented** | 2 smoke tests — login page renders + unauthenticated redirect                                         | `e2e/`                      |

**Always-on: 154 tests** (`@ambaril/shared` 119 + `@ambaril/web` 35 — integration excluded from always-on). **Env-aware: 9 integration tests** (separate lane via `pnpm test:integration`). **E2E: 2 smoke tests** (separate lane via `pnpm test:e2e:smoke`). Fast gate = 64. PBT = 18.

### Why Vitest over Jest

- Native ESM support (no transform headaches with Next.js)
- Faster execution (Vite-based, uses esbuild)
- Compatible API (easy migration from Jest if needed)
- Built-in UI for local debugging (`vitest --ui`)

### Why Playwright over Cypress

- Multi-browser support (Chromium, Firefox, WebKit)
- Better handling of iframes and multiple tabs
- Auto-waiting built in (fewer flaky tests)
- Native `async/await` (no Cypress command chain learning curve)

---

## 3. What to Test Per Module

For each of the 15 Ambaril modules, the following critical business logic MUST be unit tested. This is the non-negotiable minimum.

### 3.1 ERP (Gestao de Pedidos)

| Test Area           | What to Test                                                                                                                                                                                  | Why It Matters                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Margin calculator   | `calculateMargin(price, cost, discount, tax)` — verify formula produces correct gross and net margins for various scenarios including edge cases (zero price, 100% discount, negative margin) | Incorrect margins mean Ana Clara makes pricing decisions on wrong data |
| Depletion velocity  | `calculateDepletionVelocity(sku, salesHistory, period)` — verify calculation of units/day and projected stockout date from sales history                                                      | Drives reorder alerts; wrong velocity = stockout or overstock          |
| DRE generation      | `generateDRE(period)` — verify revenue, cost, expense, and profit lines aggregate correctly from order data                                                                                   | Financial reporting must be exactly correct. No rounding errors.       |
| Order state machine | Valid transitions: `pending → separating → shipped → delivered`. Invalid transitions: `shipped → pending`, `delivered → separating`. Test every valid path and every invalid transition.      | Prevents orders from reaching impossible states                        |
| Inventory movements | `applyInventoryMovement(sku, qty, type)` — verify stock increases on `purchase`/`return`, decreases on `sale`/`adjustment`, never goes negative without explicit override                     | Inventory accuracy is foundational to the entire business              |

```typescript
// Example: margin calculator tests
describe("calculateMargin", () => {
  it("calculates gross margin for a standard product", () => {
    const result = calculateMargin({
      price: 199.9,
      cost: 45.0,
      discount: 0,
      taxRate: 0.0925,
    });
    expect(result.grossMargin).toBeCloseTo(0.7746, 4);
    expect(result.netMargin).toBeCloseTo(0.6821, 4);
  });

  it("handles 100% discount as zero revenue", () => {
    const result = calculateMargin({
      price: 199.9,
      cost: 45.0,
      discount: 1.0,
      taxRate: 0.0925,
    });
    expect(result.grossMargin).toBe(-Infinity);
  });

  it("flags negative margin when cost exceeds discounted price", () => {
    const result = calculateMargin({
      price: 50.0,
      cost: 45.0,
      discount: 0.2,
      taxRate: 0.0925,
    });
    expect(result.netMargin).toBeLessThan(0);
  });
});
```

### 3.2 CRM (Gestao de Relacionamento)

| Test Area           | What to Test                                                                                                                                                                              | Why It Matters                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| RFM scoring         | `calculateRFM(contact)` — verify Recency (days since last purchase), Frequency (order count in period), Monetary (total spent in period) produce correct 1-5 scores and composite segment | RFM drives customer segmentation which drives marketing spend    |
| Segment matching    | `matchSegment(contact, segmentRules)` — verify AND/OR logic, comparison operators, nested conditions, edge cases (null fields, empty arrays)                                              | Wrong segments mean wrong people get wrong messages              |
| Automation triggers | `evaluateAutomationTrigger(event, rules)` — verify triggers fire correctly for matching events and do NOT fire for non-matching events                                                    | False triggers send unwanted WhatsApp messages to real customers |
| Cohort grouping     | `groupIntoCohorts(contacts, cohortConfig)` — verify grouping by first purchase month, acquisition channel, or custom field                                                                | Cohort analysis accuracy drives business strategy decisions      |

```typescript
// Example: RFM scoring
describe("calculateRFM", () => {
  it("assigns R=5 for purchase within last 7 days", () => {
    const contact = createContact({
      lastPurchaseDate: subDays(new Date(), 3),
    });
    expect(calculateRFM(contact).recency).toBe(5);
  });

  it("assigns R=1 for purchase over 180 days ago", () => {
    const contact = createContact({
      lastPurchaseDate: subDays(new Date(), 200),
    });
    expect(calculateRFM(contact).recency).toBe(1);
  });

  it('assigns segment "champions" for R=5, F=5, M=5', () => {
    const contact = createContact({
      lastPurchaseDate: subDays(new Date(), 2),
      orderCount: 15,
      totalSpent: 5000,
    });
    expect(calculateRFM(contact).segment).toBe("champions");
  });
});
```

### 3.3 Checkout (Experiencia de Compra) — EXTERNAL (Yever)

> **Note:** Checkout is handled externally by Yever. Ambaril reads checkout data for Dashboard/CRM but does not own checkout logic. These tests apply only if/when checkout is internalized.

| Test Area                | What to Test                                                                                                                                                        | Why It Matters                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Cart total calculation   | `calculateCartTotal(items, coupon, paymentMethod)` — verify subtotal, discount application (percentage and fixed), PIX discount (5%), installment fees, final total | Wrong totals = customer disputes, revenue loss, or giving away margin                               |
| CPF validation           | `validateCPF(cpf)` — verify checksum algorithm, reject known invalid CPFs (all same digits), handle formatting variations                                           | Invalid CPF means NF-e cannot be issued for the order                                               |
| UTM capture              | `captureUTM(url)` — verify extraction of `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` from URL query params and cookie fallback            | UTM data drives marketing attribution; wrong capture = bad decisions                                |
| Abandoned cart detection | `detectAbandonedCart(cart, lastActivityAt)` — verify timing logic: cart with items + no activity for 30 min = abandoned                                             | Triggers recovery automations; wrong timing = annoying active shoppers or missing recoverable carts |

```typescript
// Example: cart total with PIX discount
describe("calculateCartTotal", () => {
  it("applies 5% PIX discount to subtotal after coupon", () => {
    const result = calculateCartTotal({
      items: [{ sku: "SKU-001", price: 199.9, quantity: 2 }],
      coupon: { type: "percentage", value: 0.1 },
      paymentMethod: "pix",
    });
    // Subtotal: 399.80
    // After 10% coupon: 359.82
    // After 5% PIX: 341.83
    expect(result.total).toBeCloseTo(341.83, 2);
  });

  it("does not apply PIX discount when payment method is credit card", () => {
    const result = calculateCartTotal({
      items: [{ sku: "SKU-001", price: 199.9, quantity: 1 }],
      coupon: null,
      paymentMethod: "credit_card",
      installments: 3,
    });
    expect(result.total).toBeCloseTo(199.9, 2);
    expect(result.installmentValue).toBeCloseTo(66.63, 2);
  });
});
```

### 3.4 PLM (Product Lifecycle Management)

| Test Area                 | What to Test                                                                                                                                                                       | Why It Matters                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Safety margin alerts      | `checkSafetyMargin(material, currentStock, dailyConsumption, leadTimeDays)` — verify alert triggers when stock falls below `dailyConsumption * leadTimeDays * 1.2` (safety factor) | Prevents production stoppages from material stockout                               |
| Supplier reliability      | `calculateSupplierReliability(supplier, deliveryHistory)` — verify score from 0-100 based on on-time delivery rate, quality rejection rate, and average lead time variance         | Drives supplier selection and risk assessment                                      |
| Raw material requirements | `calculateMaterialRequirements(productionOrder, bom)` — verify bill-of-materials explosion: required quantities minus current stock = net requirements                             | Wrong calculations = order too much (waste money) or too little (production stops) |
| Stage deadline escalation | `checkStageDeadline(stage, startedAt, expectedDuration)` — verify: on-time (green), warning at 80% (yellow), overdue (red), escalation notification at overdue + 2h                | Keeps production schedule visible and accountable                                  |

### 3.5 Creators (Programa de Criadores)

| Test Area              | What to Test                                                                                                                                                                                                    | Why It Matters                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Commission calculation | `calculateCommission(order, creator, tier)` — verify commission is based on net revenue (after discount, after return adjustments), tier percentage is applied correctly, result is rounded to 2 decimal places | Creators are paid real money. Wrong calculation = overpay or underpay disputes.          |
| Tier progression       | `evaluateTierProgression(creator, salesHistory)` — verify: sales thresholds trigger tier upgrade, inactivity triggers tier downgrade, tier change takes effect on first of next month                           | Tier determines commission rate. Wrong progression = wrong payments for entire month.    |
| Points calculation     | `calculatePoints(action, metadata)` — verify points per action type: sale (10pts per R$100), social post (5pts), UGC featured (20pts), referral (50pts)                                                         | Points drive gamification engagement. Must be consistent and predictable.                |
| Payout calculation     | `calculatePayout(creator, period)` — verify: minimum R$50 to request payout, monthly cap R$3,000, deduct pending exchanges within 7-day window                                                                  | Financial accuracy. Cap and minimum protect business from edge cases.                    |
| Anti-fraud             | `validatePurchase(order, creator)` — verify: reject when buyer CPF matches creator CPF, reject when buyer email matches creator email, reject when shipping address matches creator address                     | Prevents creators from buying through their own links for commission. Real fraud vector. |

```typescript
// Example: commission with tier and exchange adjustment
describe("calculateCommission", () => {
  it("calculates 10% commission for Silver tier on net revenue", () => {
    const commission = calculateCommission({
      orderTotal: 300.0,
      discount: 30.0,
      creatorTier: "silver", // 10%
    });
    // Net revenue: 300 - 30 = 270
    // Commission: 270 * 0.10 = 27.00
    expect(commission).toBe(27.0);
  });

  it("adjusts commission when exchange happens within 7-day window", () => {
    const commission = calculateCommission({
      orderTotal: 300.0,
      discount: 0,
      creatorTier: "silver",
      exchangeAmount: 100.0, // partial exchange
      exchangeWithinWindow: true,
    });
    // Net revenue: 300 - 100 = 200
    // Commission: 200 * 0.10 = 20.00
    expect(commission).toBe(20.0);
  });

  it("does not adjust commission for exchange outside 7-day window", () => {
    const commission = calculateCommission({
      orderTotal: 300.0,
      discount: 0,
      creatorTier: "silver",
      exchangeAmount: 100.0,
      exchangeWithinWindow: false,
    });
    // Commission based on original: 300 * 0.10 = 30.00
    expect(commission).toBe(30.0);
  });
});
```

### 3.6 Trocas (Gestao de Trocas)

| Test Area                     | What to Test                                                                                                                                                                       | Why It Matters                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Exchange state machine        | Valid transitions: `requested → approved → label_generated → in_transit → received → restocked`. Invalid: `received → approved`, `restocked → in_transit`. Test all paths.         | Prevents exchanges from reaching impossible states |
| Creator commission adjustment | `adjustCommissionOnExchange(exchange, creator)` — verify: within 7-day window, commission is reduced proportionally. Outside window, no adjustment.                                | Financial accuracy for creator payouts             |
| Inventory reconciliation      | `reconcileReturnedProduct(exchange, inventory)` — verify: returned product quantity is added back to inventory, correct SKU variant is updated, damaged items go to separate count | Inventory accuracy after returns                   |

### 3.7 Tino (Assistente IA)

| Test Area               | What to Test                                                                                                                                                                       | Why It Matters                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Report SQL correctness  | Verify generated SQL queries against known test data produce expected results. Test: revenue by period, top SKUs, creator leaderboard, customer cohort metrics.                    | Wrong SQL = wrong business reports = wrong decisions  |
| LLM prompt construction | `buildPrompt(userQuery, context)` — verify: system prompt includes correct role, available tables are listed, user query is properly escaped, context window is within token limit | Bad prompts = irrelevant or hallucinated AI responses |

### 3.8 Dashboard (Painel Central)

| Test Area               | What to Test                                                                                                                                                      | Why It Matters                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Metric aggregation      | `aggregateMetrics(rawData, period, groupBy)` — verify: daily/weekly/monthly rollups, correct SUM/AVG/COUNT operations, timezone handling (America/Sao_Paulo)      | Dashboard is Ana Clara's primary decision-making tool                          |
| War Room transformation | `transformWarRoomData(alerts, metrics, thresholds)` — verify: alert priority sorting, threshold breach detection, metric delta calculations (vs. previous period) | War Room surfaces urgent issues. Wrong data = missed problems or false alarms. |

### 3.9 Other Modules (Minimum Test Requirements)

| Module           | Critical Test Areas                                                                |
| ---------------- | ---------------------------------------------------------------------------------- |
| **Auth**         | Role-permission matrix evaluation, session expiry logic, multi-module access rules |
| **Marketing**    | Coupon validation rules (expiry, min value, usage limit), UTM attribution logic    |
| **Config**       | Settings validation, feature flag evaluation                                       |
| **Financeiro**   | Reconciliation matching, PIX confirmation handling, fee calculations               |
| **Search**       | Index query construction, result ranking, section grouping                         |
| **Notificacoes** | Channel routing logic (WhatsApp vs Discord vs email), rate limiting, deduplication |
| **Relatorios**   | Report query correctness, export format generation (CSV/PDF)                       |

---

## 4. Test Data Strategy

### 4.1 Factories

Every domain entity has a factory function that generates realistic test data using `@faker-js/faker` with the PT-BR locale.

```typescript
// factories/contact.ts
import { faker } from "@faker-js/faker/locale/pt_BR";

export function createContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    cpf: generateValidCPF(),
    email: faker.internet.email(),
    phone: faker.phone.number("+55 ## #####-####"),
    instagram: `@${faker.internet.username()}`,
    address: {
      cep: faker.location.zipCode("#####-###"),
      street: faker.location.street(),
      number: faker.number.int({ min: 1, max: 9999 }).toString(),
      complement: faker.helpers.maybe(() => faker.location.secondaryAddress()),
      neighborhood: faker.location.county(),
      city: faker.location.city(),
      state: faker.helpers.arrayElement([
        "SP",
        "RJ",
        "MG",
        "RS",
        "PR",
        "SC",
        "BA",
      ]),
    },
    rfmScore: {
      recency: 3,
      frequency: 3,
      monetary: 3,
      segment: "potential_loyalists",
    },
    firstPurchaseDate: faker.date.past({ years: 2 }),
    lastPurchaseDate: faker.date.recent({ days: 30 }),
    totalOrders: faker.number.int({ min: 1, max: 50 }),
    totalSpent: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
    createdAt: faker.date.past({ years: 2 }),
    ...overrides,
  };
}
```

**Available factories:**

| Factory           | Function                    | Key Fields                              |
| ----------------- | --------------------------- | --------------------------------------- |
| Contact           | `createContact()`           | CPF, RFM score, purchase history        |
| Order             | `createOrder()`             | Status, items, payment method, shipping |
| SKU               | `createSku()`               | Price, cost, stock quantity, category   |
| Product           | `createProduct()`           | Name, SKUs, images, description         |
| Creator           | `createCreator()`           | Tier, commission rate, total sales, CPF |
| Coupon            | `createCoupon()`            | Type, value, expiry, usage limit        |
| ProductionOrder   | `createProductionOrder()`   | Stages, deadline, materials             |
| Exchange          | `createExchange()`          | Status, reason, original order          |
| Supplier          | `createSupplier()`          | Reliability score, lead time, materials |
| RawMaterial       | `createRawMaterial()`       | Stock, safety margin, unit cost         |
| Automation        | `createAutomation()`        | Trigger type, conditions, actions       |
| Segment           | `createSegment()`           | Rules, contact count                    |
| InventoryMovement | `createInventoryMovement()` | SKU, quantity, type, timestamp          |
| Payout            | `createPayout()`            | Creator, amount, status, period         |
| Notification      | `createNotification()`      | Channel, recipient, content, status     |

### 4.2 Deterministic seeds

For tests that depend on specific data patterns (e.g., RFM scoring thresholds), use deterministic seeds:

```typescript
// Set seed for reproducible random data
faker.seed(12345);

// This will always generate the same contact
const contact = createContact();
// contact.name will always be the same value for seed 12345
```

### 4.3 Test database

- **Provider:** Neon serverless PostgreSQL
- **Strategy:** A dedicated `test` branch is created per test suite run
- **Lifecycle:**
  1. Before suite: create Neon branch from `main` (instant, copy-on-write)
  2. Run migrations on the test branch
  3. Seed with factory data as needed per test
  4. After suite: delete the Neon branch
- **Advantages:** Tests run against real PostgreSQL (not SQLite or mocks), catches real constraint violations, migration issues, and query incompatibilities
- **Isolation:** Each test suite gets its own branch, so parallel test runs do not interfere

```typescript
// test/setup.ts
import { createBranch, deleteBranch } from "@/lib/neon";

let testBranchId: string;

beforeAll(async () => {
  testBranchId = await createBranch({
    parentBranch: "main",
    name: `test-${Date.now()}`,
  });
  await runMigrations(testBranchId);
});

afterAll(async () => {
  await deleteBranch(testBranchId);
});
```

### 4.4 Test data cleanup

Within a test suite, individual tests clean up after themselves using transactions:

```typescript
// Each test runs inside a transaction that is rolled back
beforeEach(async () => {
  await db.query("BEGIN");
});

afterEach(async () => {
  await db.query("ROLLBACK");
});
```

This ensures test isolation without the overhead of recreating the database for every test.

---

## 5. CI Integration

### 5.1 GitHub Actions workflow

```yaml
# .github/workflows/test.yml
name: Tests
on:
  pull_request:
    branches: [main]

jobs:
  unit-and-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm vitest run --reporter=verbose --coverage
      - name: Post coverage to PR
        uses: davelosert/vitest-coverage-report-action@v2

  e2e:
    runs-on: ubuntu-latest
    if: github.event.label.name == 'deploy-staging'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm exec playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 5.2 PR requirements

| Check                       | Blocking?     | Details                                                                      |
| --------------------------- | ------------- | ---------------------------------------------------------------------------- |
| Unit tests pass             | Yes           | All unit tests must pass to merge                                            |
| Integration tests pass      | Yes           | All integration tests must pass to merge                                     |
| E2E tests pass              | No            | Run on staging deploy only. Failures alert the team but do not block the PR. |
| Coverage report             | Informational | Posted as PR comment. No hard gate.                                          |
| Type check (`tsc --noEmit`) | Yes           | Must pass to merge                                                           |
| Lint (`eslint`)             | Yes           | Must pass to merge                                                           |

### 5.3 Coverage philosophy

There is no hard coverage gate. We do not enforce "80% or the PR is blocked." Instead:

- Business logic modules (calculators, state machines, scoring): aim for 90%+ and review any uncovered lines during PR review
- API routes: aim for 80%+ by writing integration tests for happy path and key error paths
- UI components: only test complex interactive ones (Gantt chart, Kanban board, data tables with inline editing). Simple display components do not need tests.
- Coverage report is posted on every PR for visibility, not enforcement
- Quality over quantity. 50 meaningful tests beat 200 trivial ones.

---

## 6. E2E Critical Flows

These are the Playwright test scenarios that protect the most important user journeys. Each test simulates a real user performing a complete workflow.

### 6.1 Checkout purchase flow

```
Steps:
1. Navigate to storefront
2. Add product to cart (select size, quantity)
3. Open cart → verify items and subtotal
4. Proceed to checkout
5. Enter CPF → verify validation
6. Enter CEP → verify address auto-fill (ViaCEP mocked)
7. Select PIX payment → verify 5% discount applied to total
8. Confirm order
9. Verify order confirmation page with PIX QR code
10. Simulate Mercado Pago webhook (payment confirmed)
11. Verify order status changes to "Pago"
```

### 6.2 ERP order lifecycle

```
Steps:
1. Log in as Ana Clara (admin role)
2. Navigate to ERP → Orders
3. Receive new order (from checkout E2E or seeded)
4. Change status: Pending → Separating
5. Verify inventory is reserved
6. Generate NF-e (Focus NFe mocked) → verify NF-e number appears
7. Generate shipping label (Melhor Envio mocked) → verify tracking code
8. Change status: Separating → Shipped
9. Verify order card moves to "Shipped" column in Kanban
10. Verify customer receives WhatsApp notification (mocked)
```

### 6.3 PCP production lifecycle

```
Steps:
1. Log in as Ana Clara
2. Navigate to PCP → Production Orders
3. Create new production order (select product, quantity, deadline)
4. Verify raw material requirements are calculated
5. Advance through stages: Cutting → Sewing → Finishing → Quality → Done
6. Simulate delay on Sewing stage (advance clock past deadline)
7. Verify stage turns red (overdue)
8. Verify escalation alert appears
9. Complete production order
10. Verify finished goods are added to inventory
```

### 6.4 Exchange (Trocas) flow

```
Steps:
1. Seed an order in "delivered" status
2. Navigate to Trocas → New Exchange Request
3. Select order and item to exchange
4. Choose reason (size, defect, etc.)
5. Approve exchange (as admin)
6. Generate return shipping label (Melhor Envio mocked)
7. Simulate product received
8. Verify inventory is updated (returned item restocked or marked damaged)
9. Verify creator commission adjustment (if exchange within 7-day window)
```

### 6.5 Creators lifecycle

```
Steps:
1. Navigate to creator registration page
2. Fill registration form (name, CPF, Instagram, address)
3. Submit → verify "pending approval" status
4. Log in as admin → approve creator
5. Verify creator receives welcome WhatsApp (mocked)
6. Simulate a sale through creator's link
7. Verify commission appears in creator dashboard
8. Verify commission amount is correct (tier rate * net revenue)
9. Request payout (if above R$50 minimum)
10. Verify payout appears as "pending" for admin review
```

### 6.6 CRM automation trigger

```
Steps:
1. Log in as admin
2. Navigate to CRM → Automations
3. Create automation: trigger = "order_delivered", action = "send_whatsapp", template = "review_request"
4. Activate automation
5. Seed/trigger an order delivery event
6. Verify automation fires
7. Verify WhatsApp message is queued (mocked, verify payload content)
8. Verify automation log shows successful execution
```

### 6.7 Auth and permissions

```
Steps:
1. Log in with a "creator" role user
2. Verify access to Creator Dashboard works
3. Navigate to /erp → verify 403 page is shown
4. Navigate to /pcp → verify 403 page is shown
5. Navigate to /crm → verify 403 page is shown
6. Log out → verify redirect to login
7. Try to access /dashboard without auth → verify redirect to login
8. Log in with admin role → verify access to all modules
```

### 6.8 Global search

```
Steps:
1. Log in as admin
2. Click global search (or press Cmd+K)
3. Type a product name
4. Verify results appear grouped by section (Products, Orders, Contacts)
5. Click on a product result → verify navigation to product detail
6. Search for an order number → verify order appears in results
7. Search for a contact CPF → verify contact appears
8. Search with no results → verify "Nenhum resultado encontrado" message
```

---

## 7. Mocking Strategy

### 7.1 External APIs: always mocked (MSW)

External service calls are intercepted by Mock Service Worker (MSW) in unit and integration tests. This ensures tests are fast, deterministic, and do not depend on third-party uptime.

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  // Mercado Pago - create payment
  http.post("https://api.mercadopago.com/v1/payments", () => {
    return HttpResponse.json({
      id: 123456789,
      status: "approved",
      status_detail: "accredited",
    });
  }),

  // Focus NFe - emit NF-e
  http.post("https://api.focusnfe.com.br/v2/nfe", () => {
    return HttpResponse.json({
      status: "autorizado",
      numero: "000001234",
      chave_nfe: "35260312345678000195550010000012341000012347",
    });
  }),

  // Melhor Envio - generate label
  http.post(
    "https://api.melhorenvio.com.br/api/v2/me/shipment/generate",
    () => {
      return HttpResponse.json({
        id: "label-uuid",
        tracking: "ME123456789BR",
        status: "generated",
      });
    },
  ),

  // ViaCEP
  http.get("https://viacep.com.br/ws/:cep/json", ({ params }) => {
    return HttpResponse.json({
      cep: params.cep,
      logradouro: "Rua Augusta",
      bairro: "Consolacao",
      localidade: "Sao Paulo",
      uf: "SP",
    });
  }),

  // WhatsApp (Z-API) - send message
  http.post(
    "https://api.z-api.io/instances/:instance/token/:token/send-text",
    () => {
      return HttpResponse.json({
        zapiMessageId: "msg-uuid",
        messageId: "wamid.xxx",
      });
    },
  ),

  // Claude API - chat completion
  http.post("https://api.anthropic.com/v1/messages", () => {
    return HttpResponse.json({
      content: [{ type: "text", text: "Mocked AI response for testing" }],
    });
  }),
];
```

**MSW setup:**

```typescript
// test/setup.ts
import { setupServer } from "msw/node";
import { handlers } from "./mocks/handlers";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

The `onUnhandledRequest: 'error'` setting ensures that any unmocked external call will fail the test immediately, preventing accidental real API calls.

### 7.2 Database: real test database (not mocked)

The database is never mocked. Tests run against a real PostgreSQL instance (Neon test branch) because:

- Mocking the database hides real bugs (constraint violations, incorrect SQL, missing indexes)
- Neon branches are instant to create (copy-on-write from main)
- Transaction rollback between tests keeps them isolated and fast

### 7.3 Time: fake timers for cron-dependent logic

> **Note:** Redis was eliminated in ADR-012. Queues use PostgreSQL + Vercel Cron.

Any test that depends on time (cron jobs, abandoned cart detection, deadline escalation, exchange window expiry) uses Vitest's fake timer:

```typescript
describe("abandoned cart detection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks cart as abandoned after 30 minutes of inactivity", () => {
    const cart = createCart({ lastActivityAt: new Date() });

    vi.advanceTimersByTime(29 * 60 * 1000); // 29 minutes
    expect(isAbandoned(cart)).toBe(false);

    vi.advanceTimersByTime(2 * 60 * 1000); // +2 minutes = 31 total
    expect(isAbandoned(cart)).toBe(true);
  });
});
```

### 7.5 WhatsApp and Discord: always mocked

Real messages must never be sent during tests. WhatsApp (Z-API) and Discord webhook calls are always intercepted by MSW. The test verifies the correct payload was constructed, not that the message was delivered.

```typescript
it("sends WhatsApp review request after order delivery", async () => {
  const messageSpy = vi.fn();

  server.use(
    http.post(
      "https://api.z-api.io/instances/:instance/token/:token/send-text",
      async ({ request }) => {
        const body = await request.json();
        messageSpy(body);
        return HttpResponse.json({ zapiMessageId: "msg-uuid" });
      },
    ),
  );

  await triggerAutomation("order_delivered", { orderId: "order-123" });

  expect(messageSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      phone: expect.stringMatching(/^\+55/),
      message: expect.stringContaining("avaliacao"),
    }),
  );
});
```

---

## 8. Test File Organization

```
src/
  modules/
    erp/
      calculators/
        margin.ts
        margin.test.ts          ← unit test co-located
        depletion.ts
        depletion.test.ts
      state-machines/
        order.ts
        order.test.ts
    crm/
      scoring/
        rfm.ts
        rfm.test.ts
      segments/
        matcher.ts
        matcher.test.ts
    checkout/
      cart/
        calculator.ts
        calculator.test.ts
      validation/
        cpf.ts
        cpf.test.ts
    creators/
      commission/
        calculator.ts
        calculator.test.ts
      tiers/
        progression.ts
        progression.test.ts
  api/
    orders/
      route.ts
      route.test.ts             ← integration test co-located
    contacts/
      route.ts
      route.test.ts

test/
  setup.ts                      ← global test setup (MSW, DB branch)
  mocks/
    handlers.ts                 ← MSW request handlers
  factories/
    contact.ts                  ← factory per domain entity
    order.ts
    sku.ts
    creator.ts
    ...
  e2e/
    checkout.spec.ts            ← Playwright E2E tests
    erp-order.spec.ts
    pcp-production.spec.ts
    exchange.spec.ts
    creators.spec.ts
    crm-automation.spec.ts
    auth-permissions.spec.ts
    global-search.spec.ts
```

**Convention:** Unit and integration tests are co-located next to the code they test (`*.test.ts`). E2E tests live in `test/e2e/` since they span multiple modules.

---

## 9. Running Tests Locally

### 9.1 Test Lanes

| Lane        | Command                     | Env required                           | Tests                                              | CI role                                        |
| ----------- | --------------------------- | -------------------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| **CI gate** | `./bin/ci` / `pnpm test:ci` | None (env-aware lanes skip gracefully) | All lanes below                                    | **Primary semaphore** — green = green baseline |
| Always-on   | `pnpm test`                 | None                                   | 154 (shared 119 + web 35) — integration excluded   | Step 3 of bin/ci                               |
| Fast gate   | `pnpm test:fast`            | None                                   | 64 (contracts + all PBT)                           | —                                              |
| Contracts   | `pnpm test:schemas`         | None                                   | 46                                                 | —                                              |
| PBT         | `pnpm test:pbt`             | None                                   | 18 (15 shared + 3 web)                             | —                                              |
| Integration | `pnpm test:integration`     | `DATABASE_URL`                         | 9 (prereq validation + set_config + RLS isolation) | Step 4 of bin/ci (env-aware)                   |
| E2E smoke   | `pnpm test:e2e:smoke`       | Dev server + Playwright browsers       | 2 (login render + root redirect)                   | Optional step in bin/ci                        |
| DB security | `pnpm db:secure`            | `DATABASE_URL` + `psql`                | N/A (DDL)                                          | Run after db:push or db:migrate                |

> **"Skipped" integration is not "enforced".** When `DATABASE_URL` is absent, integration tests skip. `bin/ci` prints explicit SKIP messages — never silent omission.

### 9.2 Commands

```bash
# ── Canonical CI gate ─────────────────────────────────────────
./bin/ci               # THE one command. Green = green baseline.
pnpm test:ci           # Same thing via pnpm.

# ── Always-on (no env required) ──────────────────────────────
pnpm test              # Full monorepo suite
pnpm test:fast         # Fast gate: contracts + PBT
pnpm test:schemas      # Schema/validator contracts only
pnpm test:pbt          # Property-based tests only

# ── Env-aware (requires DATABASE_URL) ────────────────────────
pnpm test:integration  # DB-backed integration

# ── E2E (requires dev server + Playwright) ───────────────────
pnpm test:e2e          # All Playwright tests
pnpm test:e2e:smoke    # Smoke only

# ── DB security ─────────────────────────────────────────────
pnpm db:secure         # Apply RLS bootstrap
```

### 9.3 CI Integration

The CI workflow (`.github/workflows/ci.yml`) runs `./bin/ci` as the single quality gate. `bin/ci` executes lint → type-check → test → integration (env-aware) → build, and prints explicit SKIP messages for env-dependent lanes.

The `DATABASE_URL` is injected from `secrets.NEON_TEST_DATABASE_URL`. When present, integration tests run. When absent, they skip with a visible message.

To enable DB-backed integration in CI:

1. Create a Neon test branch (or dedicated test project)
2. Add `NEON_TEST_DATABASE_URL` as a repository secret in GitHub
3. Run `pnpm db:secure` on the test branch to apply RLS bootstrap

See `docs/architecture/INFRA.md` for the documented secret name and Neon branch workflow.

---

## 10. Anti-Tautologia: LLM-Specific Testing Discipline

> AI-generated PRs contain 1.7x more bugs, 2.74x more security vulnerabilities, and 75% more logic errors than human-written code (CodeRabbit 2025). Tests written by the same LLM that wrote the code have a 33% drop in pass rate when the code behavior actually changes (arxiv 2603.23443). This section defines the countermeasures.

### 10.1 The Problem

When the same LLM writes code AND tests, both share the same misunderstanding. The test validates what the code DOES, not what it SHOULD do. This is called a **tautological test** — it always passes, even when the logic is wrong.

Example: LLM writes `calculateMargin(price, cost)` with a wrong formula. Then writes a test that calls `calculateMargin(200, 50)` and asserts the (wrong) result. Test passes. Bug ships.

### 10.2 The Four Countermeasures

| #   | Mechanism                        | What it breaks                                       | Where enforced                                 |
| --- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| 1   | **Property-Based Testing (PBT)** | Tests invariants from SPEC, not implementation       | `feature-code` Step 7                          |
| 2   | **Spec-Driven Test Derivation**  | Given/When/Then in specs → mechanical translation    | `feature-create-spec` §4.6                     |
| 3   | **Writer ≠ Reviewer**            | Fresh context reviews code it didn't write           | `feature-verify` Step 4                        |
| 4   | **Deterministic Verification**   | No self-reported "tests pass" — exit code 0 required | `feature-code` Step 8, `feature-verify` Step 3 |

### 10.3 Mutation Testing (periodic quality gate)

Use Stryker (JS/TS mutation testing) to validate that tests actually catch bugs:

- Stryker modifies code (flips `>` to `>=`, removes `if`, etc.) and checks if tests fail
- If tests DON'T fail after mutation → the test is weak (tautological)
- Run after each module is complete (not per commit — too slow)
- Target: >80% mutation score for business logic modules

```bash
# After completing a module
npx stryker run --mutate "packages/shared/src/business/erp/**/*.ts"
```

---

## 11. Property-Based Testing (PBT)

### 11.1 When PBT is mandatory

PBT tests are REQUIRED when writing new or modifying existing code in these categories:

- **FSMs** (state machines) — invariant: no invalid transitions, no backwards movement
- **Monetary calculations** — invariant: commutativity, non-negative results, precision
- **Zod validators** — invariant: valid inputs pass, invalid inputs fail (random generation)
- **Tenant-scoped queries** — invariant: results never contain data from other tenants
- **Scoring/ranking algorithms** — invariant: score within bounds, monotonicity

Under `test_enforcement: hard`, missing PBT for new/modified business logic blocks the push (red in `feature-verify`). For untouched legacy code, missing PBT is a yellow finding — operator decides priority.

PBT is OPTIONAL for:

- UI components (use Playwright E2E instead)
- Simple CRUD without business rules
- External API wrappers (use MSW mocks)

> **Current baseline (2026-04-14):** 15 PBT tests covering shared Zod validators (cpfSchema, emailSchema, passwordSchema, paginationSchema, updateOrderStatusSchema, addressSchema, createOrderSchema). Full business-logic PBT will be built module-by-module as implementation proceeds. **Next targets:** ERP order FSM + margin calculations, PLM stage transitions, CRM scoring algorithms.

### 11.2 How to write PBT

```typescript
import fc from "fast-check";

// 1. Identify the PROPERTY (from the spec, not the code)
// Spec says: "Order status never moves backwards except to cancelled"
const STATUS_ORDER = ["pending", "paid", "separating", "shipped", "delivered"];

// 2. Write the property test
describe("PBT: Order FSM", () => {
  it("forward transitions always increase status index (except cancelled)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...STATUS_ORDER),
        fc.constantFrom(...STATUS_ORDER),
        (from, to) => {
          if (canTransition(from, to)) {
            return (
              STATUS_ORDER.indexOf(to) > STATUS_ORDER.indexOf(from) ||
              to === "cancelled"
            );
          }
          return true; // blocked transitions are valid
        },
      ),
    );
  });

  it("cancelled is a terminal state (no outbound transitions)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...STATUS_ORDER), (to) => {
        return !canTransition("cancelled", to);
      }),
    );
  });
});
```

### 11.3 PBT patterns by domain

| Domain      | Property                 | fast-check pattern                                            |
| ----------- | ------------------------ | ------------------------------------------------------------- |
| FSM         | No backwards transitions | `fc.constantFrom(...states)` → check index order              |
| Money       | Commutative totals       | `fc.array(fc.record({qty, price}))` → compare forward/reverse |
| Money       | Non-negative margins     | `fc.record({price, cost, discount})` → margin ≥ threshold     |
| Validators  | Valid inputs accepted    | Custom arbitrary → `schema.safeParse().success === true`      |
| Validators  | Invalid inputs rejected  | Complementary arbitrary → `.success === false`                |
| Tenant      | No cross-tenant leaks    | `fc.constantFrom(...tenantIds)` → results filtered by caller  |
| Scoring     | Bounds respected         | `fc.record({...inputs})` → 0 ≤ score ≤ max                    |
| Idempotency | f(f(x)) = f(x)           | `fc.anything()` → apply twice, compare                        |

---

## 12. Tenant Isolation Testing

### 12.1 Three levels

| Level                      | Type            | Database  | What it catches                                                                         | Status                                             |
| -------------------------- | --------------- | --------- | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1. Query audit             | Static analysis | None      | Missing `tenantId` filter in queries                                                    | Partial (security-check.sh)                        |
| 2. Context verification    | Integration     | Real Neon | `withTenantContext` sets correct `app.tenant_id`                                        | **Implemented** (`tenant.integration.test.ts`)     |
| 3. RLS row-level isolation | Integration     | Real Neon | Tenant A seeing Tenant B's data via SELECT; tenant A writing tenant B's rows via INSERT | **Implemented** (`tenant-rls.integration.test.ts`) |

> **Level 3 implementation notes:**
>
> - Table tested: `global.module_setup_state` (enableRLS + pgPolicy with USING/WITH CHECK)
> - Tests use `SET LOCAL ROLE ambaril_app` to drop from BYPASSRLS owner to a non-privileged role
> - 4 preflight assertions validate security prerequisites — tests FAIL HARD if prerequisites are missing
> - All prerequisites are codified in `packages/db/sql/rls-bootstrap.sql` (idempotent, run after db:push or db:migrate)
> - Table migration codified in `packages/db/drizzle/0004_global_setup_tables.sql` (IF NOT EXISTS safe)
> - Cleanup via ON DELETE CASCADE from tenants table
>
> **Remaining gaps for broader RLS coverage:**
>
> - Other tables may have empty policy clauses — `rls-bootstrap.sql` repairs all automatically
> - Production app should connect as `ambaril_app` (not `neondb_owner`) — infra requirement
> - Multi-table cross-tenant tests blocked by FK chains requiring seed helpers
> - See `packages/db/SCHEMA-DRIFT.md` for full drift report

### 12.2 Level 1: Query audit (extends security-check.sh)

Every Drizzle query on a tenant-scoped table MUST include a `tenantId` filter. The security check script (S9) already warns about IDOR patterns. Extend to detect:

- `.from(orders)` without `.where(eq(orders.tenantId, ...))` in the same chain
- `.select()` from any table in a tenant-scoped schema without `tenantId`

### 12.3 Level 2: Context verification

```typescript
describe("withTenantContext", () => {
  it("sets app.tenant_id via set_config", async () => {
    const result = await withTenantContext("tenant-abc", async (tx) => {
      const [row] = await tx.execute(
        sql`SELECT current_setting('app.tenant_id') as tid`,
      );
      return row.tid;
    });
    expect(result).toBe("tenant-abc");
  });
});
```

### 12.4 Level 3: Cross-tenant leak tests

```typescript
describe("Tenant isolation", () => {
  it("tenant A cannot see tenant B orders", async () => {
    await seedOrder({ tenantId: "tenant-a", orderId: "order-1" });
    await seedOrder({ tenantId: "tenant-b", orderId: "order-2" });

    const result = await withTenantContext("tenant-a", async (tx) => {
      return tx.select({ id: orders.id }).from(orders);
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("order-1");
  });
});
```

---

## 13. Spec-Driven Test Derivation (Given/When/Then)

### 13.1 Why

When specs contain explicit test scenarios, the LLM translates them mechanically into code instead of interpreting the spec and potentially misunderstanding it. This is the primary defense against tautological tests.

### 13.2 Spec template

Every new or edited spec section that defines behavior-heavy logic (FSM, calculations, workflows, complex validations) MUST include a `Test Scenarios` subsection:

```markdown
## §X.Y [Feature Name]

### Test Scenarios

**Happy path**
GIVEN order with status "paid" and 3 items in stock
WHEN operator marks as "separating"
THEN status changes to "separating" AND inventory is reserved for all 3 items

**Edge case**
GIVEN order with status "paid" and 1 item out of stock
WHEN operator marks as "separating"
THEN error "Item SKU-001 sem estoque" is returned AND status remains "paid"

**Error path**
GIVEN order with status "delivered"
WHEN operator attempts to change to "pending"
THEN error "Transição inválida" is returned AND no side effects occur

**Concurrency**
GIVEN two operators viewing the same order with status "paid"
WHEN both attempt to mark as "separating" simultaneously
THEN exactly one succeeds AND the other receives a conflict error
```

### 13.3 Mapping to tests

Each Given/When/Then becomes exactly ONE test case:

```typescript
// Derived mechanically from spec §X.Y
it("changes status to separating and reserves inventory when paid with stock", async () => {
  // GIVEN
  const order = await seedOrder({ status: "paid", items: 3, allInStock: true });
  // WHEN
  const result = await markAsSeparating(order.id);
  // THEN
  expect(result.status).toBe("separating");
  expect(await getReservedInventory(order.id)).toHaveLength(3);
});
```

The LLM does NOT interpret what to test. It translates the spec scenario 1:1.

---

## Cross-References

- **ARCH.md** — System architecture, module boundaries
- **API.md** — API endpoint conventions, route patterns
- **ERROR-HANDLING.md** — Error codes, error response format (used in test assertions)
- **DS.md** — Microcopy rules (test user-facing strings match DS.md patterns)
- **INFRA.md** — Neon branching, CI/CD setup
- **Module docs** — Module-specific business rules and state machines
