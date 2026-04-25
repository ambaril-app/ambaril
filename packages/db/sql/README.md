# Iron Core — Database Safety Layer

> **Created:** 2026-04-24
> **ADRs:** 015 (DB constraints), 016 (transactions), 017 (optimistic locking), 018 (worker), 019 (audit triggers)
> **Status:** Active

## Why This Exists

Ambaril is an ERP built via vibe-coding. ERPs handle money, taxes, and inventory — areas where subtle bugs cause real financial damage. Historically, Delphi-era ERPs achieved extreme reliability by making **the database enforce all business rules**, not just the application.

Iron Core brings this philosophy to our modern stack: **PostgreSQL doesn't trust the app.**

## What It Protects

| Layer                   | What                                                                   | How                                                                |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Constraints**         | Inventory never negative, prices never negative, NF-e never duplicated | `CHECK` constraints + partial `UNIQUE` indexes                     |
| **FSM Triggers**        | Order status transitions follow strict pipeline                        | `BEFORE UPDATE` triggers validate transitions                      |
| **Audit Triggers**      | Every mutation to financial/inventory tables is logged                 | `AFTER INSERT/UPDATE/DELETE` triggers write to `global.audit_logs` |
| **Ledger Immutability** | Inventory movements and financial transactions are append-only         | `BEFORE UPDATE/DELETE` triggers block mutations                    |
| **Inventory Sync**      | Every inventory_movement auto-updates inventory balance                | `AFTER INSERT` trigger on movements                                |
| **NF-e Protection**     | Authorized NF-e documents are immutable                                | `BEFORE UPDATE` trigger blocks changes                             |

## Files

```
packages/db/sql/
├── rls-bootstrap.sql           # RLS security (pre-existing)
├── iron-core-constraints.sql   # CHECK + partial UNIQUE
├── iron-core-audit.sql         # Audit trigger function + attachments
├── iron-core-fsm.sql           # FSM enforcement triggers
├── iron-core-double-entry.sql  # Financial integrity + ledger immutability
└── iron-core-runner.sh         # Runs all scripts in order

packages/db/src/patterns/
├── transaction.ts              # withTenantTransaction() utility
└── optimistic-lock.ts          # Optimistic locking with ConflictError
```

## Running

```bash
# Apply all Iron Core protections
cd ~/projects/ambaril-web
chmod +x packages/db/sql/iron-core-runner.sh
./packages/db/sql/iron-core-runner.sh

# Or individually
psql $DATABASE_URL -f packages/db/sql/iron-core-constraints.sql
```

## Using Transaction Patterns

```typescript
import { withTenantTransaction } from '@ambaril/db/patterns/transaction';

// Every multi-table mutation MUST use this
const result = await withTenantTransaction(db, tenantId, userId, async (tx) => {
  await tx.update(orders).set({ status: 'in_picking' }).where(...);
  await tx.update(inventory).set({ ... }).where(...);
  await tx.insert(inventoryMovements).values({ ... });
  return { success: true };
});
```

## Using Optimistic Locking

```typescript
import {
  optimisticUpdate,
  ConflictError,
} from "@ambaril/db/patterns/optimistic-lock";

try {
  await optimisticUpdate(tx, inventoryTable, recordId, currentVersion, {
    quantityAvailable: sql`quantity_available - 1`,
  });
} catch (e) {
  if (e instanceof ConflictError) {
    return { error: "Record modified by another user. Refresh and retry." };
  }
}
```

## ADR Summary

| ADR     | Decision                                                           | Date       |
| ------- | ------------------------------------------------------------------ | ---------- |
| ADR-015 | PostgreSQL enforces business invariants via constraints + triggers | 2026-04-24 |
| ADR-016 | `db.transaction()` mandatory for multi-table writes                | 2026-04-24 |
| ADR-017 | Optimistic locking via `version` column on concurrent tables       | 2026-04-24 |
| ADR-018 | Worker on Hetzner VPS (graphile-worker) for long-running ERP jobs  | 2026-04-24 |
| ADR-019 | DB-level audit triggers (impossible to bypass)                     | 2026-04-24 |
