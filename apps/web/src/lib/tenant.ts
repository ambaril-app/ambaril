import { redirect } from "next/navigation";
import { db } from "@ambaril/db";
import { sql } from "drizzle-orm";
import { getSession } from "./auth";
import type { TenantSessionData } from "@ambaril/shared/types";
import type { Database } from "@ambaril/db";

// Wraps a callback in a transaction with tenant RLS context.
// Sets app.tenant_id for the transaction so RLS policies can filter rows.
// The (SELECT ...) wrapper in policies + set_config(..., true) ensures
// the setting is scoped to this transaction only.
export async function withTenantContext<T>(
  tenantId: string,
  callback: (tx: Parameters<Parameters<Database["transaction"]>[0]>[0]) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
    );
    return callback(tx);
  });
}

// Shortcut: get session with tenant assertion, redirect to login if missing
export async function getTenantSession(): Promise<TenantSessionData> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.tenantId) redirect("/login");
  return session;
}
