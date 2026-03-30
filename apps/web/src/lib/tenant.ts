import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, txDb } from "@ambaril/db";
import { sql, eq } from "drizzle-orm";
import { permissions, roles } from "@ambaril/db/schema";
import { getSession } from "./auth";
import type { TenantSessionData, RoleCode } from "@ambaril/shared/types";
import type { TxDatabase } from "@ambaril/db";

const IMPERSONATE_COOKIE = "ambaril_impersonate";

// Wraps a callback in a transaction with tenant RLS context.
// Sets app.tenant_id for the transaction so RLS policies can filter rows.
// The (SELECT ...) wrapper in policies + set_config(..., true) ensures
// the setting is scoped to this transaction only.
// Uses the WebSocket-based txDb client because neon-http does not support transactions.
export async function withTenantContext<T>(
  tenantId: string,
  callback: (tx: Parameters<Parameters<TxDatabase["transaction"]>[0]>[0]) => Promise<T>,
): Promise<T> {
  return txDb.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
    );
    return callback(tx);
  });
}

// Load display name for a role from the roles table
async function getRoleDisplayName(roleName: string): Promise<string> {
  const result = await db
    .select({ displayName: roles.displayName })
    .from(roles)
    .where(eq(roles.name, roleName))
    .limit(1);
  return result[0]?.displayName ?? roleName;
}

// Load permissions for a role from the DB
async function loadPermissionsForRole(roleName: string): Promise<string[]> {
  if (roleName === "admin") return ["*"];

  const roleResult = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, roleName))
    .limit(1);

  if (!roleResult[0]) return [];

  const perms = await db
    .select({ resource: permissions.resource, action: permissions.action })
    .from(permissions)
    .where(eq(permissions.roleId, roleResult[0].id));

  return perms.map((p) => `${p.resource}:${p.action}`);
}

// Shortcut: get session with tenant assertion + impersonation, redirect to login if missing
export async function getTenantSession(): Promise<TenantSessionData> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.tenantId) redirect("/login");

  // Get role display name
  const roleDisplayName = await getRoleDisplayName(session.role);

  // Check impersonation cookie
  const cookieStore = await cookies();
  const impersonateValue = cookieStore.get(IMPERSONATE_COOKIE)?.value;

  // Only admin (or anyone with system:impersonate permission) can impersonate
  const canImpersonate =
    session.role === "admin" || session.permissions.includes("system:impersonate");

  if (impersonateValue && canImpersonate) {
    const impersonatingRole = impersonateValue as RoleCode;
    const effectivePermissions = await loadPermissionsForRole(impersonatingRole);

    return {
      ...session,
      roleDisplayName,
      impersonatingRole,
      effectiveRole: impersonatingRole,
      effectivePermissions,
      isImpersonating: true,
    };
  }

  return {
    ...session,
    roleDisplayName,
    effectiveRole: session.role,
    effectivePermissions: session.permissions,
    isImpersonating: false,
  };
}
