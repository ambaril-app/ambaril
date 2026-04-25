/**
 * IRON CORE — Optimistic Locking (ADR-017)
 * Created: 2026-04-24
 *
 * Why: Ana Clara on mobile and Tavares on desktop can edit the same order.
 * Serverless = multiple Lambda instances = no shared locks.
 * Without optimistic locking, last-write-wins = silent data loss.
 *
 * Delphi solved this with TDataSet.Edit() + record locking.
 * Modern equivalent: version column + WHERE version = ? on updates.
 * If 0 rows affected, another user modified the record = ConflictError.
 *
 * Usage:
 *   import { optimisticUpdate, ConflictError } from '@ambaril/db/patterns/optimistic-lock';
 *
 *   try {
 *     const updated = await optimisticUpdate(tx, inventoryTable, recordId, currentVersion, {
 *       quantityAvailable: sql`quantity_available - 1`,
 *     });
 *   } catch (e) {
 *     if (e instanceof ConflictError) {
 *       // Tell user to refresh and retry
 *     }
 *   }
 */

import { eq, and, sql, type SQL } from "drizzle-orm";
import { type PgTable } from "drizzle-orm/pg-core";
import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";

/**
 * Thrown when an optimistic lock conflict is detected.
 * The record was modified by another user/process between read and write.
 */
export class ConflictError extends Error {
  public readonly recordId: string;
  public readonly expectedVersion: number;

  constructor(table: string, recordId: string, expectedVersion: number) {
    super(
      `Conflict: ${table} record ${recordId} was modified by another user. ` +
        `Expected version ${expectedVersion}. Refresh and retry.`,
    );
    this.name = "ConflictError";
    this.recordId = recordId;
    this.expectedVersion = expectedVersion;
  }
}

/**
 * Performs an UPDATE with optimistic locking.
 * Increments `version` column and uses WHERE version = expectedVersion.
 * Throws ConflictError if 0 rows affected (concurrent modification detected).
 *
 * @param tx - Drizzle transaction or db instance
 * @param table - The Drizzle table reference
 * @param id - Record UUID
 * @param expectedVersion - Version the client last read
 * @param updates - Column updates to apply
 * @returns The updated row
 * @throws ConflictError if version mismatch
 */
export async function optimisticUpdate<T extends PgTable>(
  tx: PostgresJsDatabase,
  table: T,
  id: string,
  expectedVersion: number,
  updates: Record<string, unknown>,
): Promise<unknown> {
  const result = await (tx as any)
    .update(table)
    .set({
      ...updates,
      version: sql`version + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq((table as any).id, id),
        eq((table as any).version, expectedVersion),
      ),
    )
    .returning();

  if (!result || result.length === 0) {
    throw new ConflictError(
      (table as any)[Symbol.for("drizzle:Name")] ?? "unknown",
      id,
      expectedVersion,
    );
  }

  return result[0];
}
