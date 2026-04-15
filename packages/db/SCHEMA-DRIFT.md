# Schema Drift Report

> Generated: 2026-04-15

## Source of Truth

This project uses **two deployment mechanisms**:

1. **Drizzle migrations** (`packages/db/drizzle/*.sql`) — versioned SQL applied via `pnpm db:migrate`
2. **Drizzle db:push** (`pnpm db:push`) — direct schema push to database, no migration file generated

The TS schema files in `packages/db/src/schema/*.ts` are the **canonical schema definition**. The migration history is incomplete because `db:push` was used during development.

## Known Drift: Tables in TS Schema Without Migrations

The following tables exist in the Drizzle TS schema and were deployed to Neon via `db:push`, but had no corresponding migration file:

| Table                          | Schema File     | Migration                  |
| ------------------------------ | --------------- | -------------------------- |
| `global.integration_providers` | `global.ts:378` | **0004** (added this pass) |
| `global.tenant_integrations`   | `global.ts:405` | **0004** (added this pass) |
| `global.module_setup_state`    | `global.ts:443` | **0004** (added this pass) |

Migration `0004_global_setup_tables.sql` uses `IF NOT EXISTS` so it is safe on databases where `db:push` already created these tables.

## Known Drift: Schema Renames

| Migration name | TS Schema name | Status                                                                                                                                                     |
| -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `whatsapp.*`   | `messaging.*`  | Schema was renamed in TS. Migration `0000` uses `whatsapp`. `drizzle-kit generate` detects this as a rename prompt. Not yet resolved in migration history. |

## Known Drift: RLS Policy Clauses

When `db:push` creates tables with `pgPolicy(...)` + `.enableRLS()`, Drizzle can generate policies with **empty USING/WITH CHECK clauses**. This was observed on `global.module_setup_state`.

**Fix:** `packages/db/sql/rls-bootstrap.sql` detects and repairs empty policy clauses. Run it after any `db:push`.

## Known Drift: FORCE ROW LEVEL SECURITY

Drizzle's `.enableRLS()` generates `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` but does NOT generate `FORCE ROW LEVEL SECURITY`. Without FORCE, the table owner (`neondb_owner` on Neon) bypasses all policies.

**Fix:** `packages/db/sql/rls-bootstrap.sql` applies FORCE to all RLS tables. Migration `0004` includes FORCE for the 3 newly migrated tables.

## Migration Journal Gap

The journal (`drizzle/meta/_journal.json`) skips `idx: 2` — file `0002_waitlist_entries.sql` exists but is not in the journal. This was pre-existing before this pass.

## Recommended Workflow

1. **Schema changes:** Edit TS schema files, then run `pnpm db:push` for rapid dev
2. **Before deploy:** Generate migration via `drizzle-kit generate` or write manually
3. **After db:push or db:migrate:** Run `psql $DATABASE_URL -f packages/db/sql/rls-bootstrap.sql`
4. **Periodically:** Check this file and resolve remaining drift items
