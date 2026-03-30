"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@ambaril/db";
import { roles } from "@ambaril/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

const IMPERSONATE_COOKIE = "ambaril_impersonate";

/**
 * Start impersonating a role. Session stays as admin — only the
 * effectiveRole changes (read by getTenantSession via cookie).
 */
export async function startImpersonation(
  targetRole: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Sessao expirada" };

  // Only admin can impersonate (or anyone with system:impersonate)
  if (session.role !== "admin" && !session.permissions.includes("system:impersonate")) {
    return { error: "Sem permissao para impersonar" };
  }

  // Validate target role exists in the DB
  const roleResult = await db
    .select({ name: roles.name })
    .from(roles)
    .where(eq(roles.name, targetRole))
    .limit(1);

  if (!roleResult[0]) {
    return { error: "Role nao encontrada" };
  }

  // Set session-scoped cookie (no maxAge = dies on browser close)
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, targetRole, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
  });

  revalidatePath("/admin");
  return {};
}

/**
 * Stop impersonating — delete the cookie and restore admin view.
 */
export async function stopImpersonation(): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: IMPERSONATE_COOKIE,
    path: "/admin",
  });

  revalidatePath("/admin");
  return {};
}

/**
 * Load all roles from the DB for the impersonation dropdown.
 * Returns role name + displayName pairs.
 */
export async function loadRoles(): Promise<
  { name: string; displayName: string }[]
> {
  const result = await db
    .select({ name: roles.name, displayName: roles.displayName })
    .from(roles)
    .orderBy(roles.name);

  return result;
}
