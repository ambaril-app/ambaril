/**
 * IRON CORE — Transaction Patterns (ADR-016)
 * Created: 2026-04-24
 *
 * Why: Every multi-table mutation MUST be wrapped in db.transaction().
 * Without this, a failure mid-way leaves the database in an inconsistent state
 * (e.g., order marked as "separating" but inventory not reserved).
 * Delphi ERPs did this automatically via TDataSet.Post() transactions.
 *
 * Usage:
 *   import { withTenantTransaction } from '@ambaril/db/patterns/transaction';
 *
 *   const result = await withTenantTransaction(db, tenantId, userId, async (tx) => {
 *     await tx.update(orders).set({ status: 'in_picking' }).where(...);
 *     await tx.update(inventory).set({ ... }).where(...);
 *     return { success: true };
 *   });
 */

import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

/**
 * Wraps a multi-table mutation in a transaction with tenant context.
 * Sets `app.tenant_id` and `app.user_id` session variables so that:
 * 1. RLS policies filter by tenant
 * 2. Audit triggers capture who made the change
 *
 * @param db - Drizzle database instance
 * @param tenantId - UUID of the current tenant
 * @param userId - UUID of the current user (or null for system/cron)
 * @param fn - The transactional work to perform
 * @returns Whatever fn returns
 * @throws Rolls back entire transaction on any error
 */
export async function withTenantTransaction<T>(
  db: PostgresJsDatabase,
  tenantId: string,
  userId: string | null,
  fn: (tx: PostgresJsDatabase) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    // Set session context for RLS + audit triggers (ADR-015/019)
    await tx.execute(
      sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
    );
    if (userId) {
      await tx.execute(sql`SELECT set_config('app.user_id', ${userId}, true)`);
    }

    return fn(tx as unknown as PostgresJsDatabase);
  });
}

/**
 * System-level transaction (no user context).
 * For cron jobs, webhooks, and automated processes.
 * Audit triggers will record user as 00000000-... (system).
 */
export async function withSystemTransaction<T>(
  db: PostgresJsDatabase,
  tenantId: string,
  fn: (tx: PostgresJsDatabase) => Promise<T>,
): Promise<T> {
  return withTenantTransaction(db, tenantId, null, fn);
}
