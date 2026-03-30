import { cookies } from "next/headers";
import { db } from "@ambaril/db";
import { sessions, users, permissions, roles, tenants, userTenants } from "@ambaril/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { SESSION_COOKIE_NAME, SESSION_TTL_DEFAULT, SESSION_TTL_REMEMBER } from "@ambaril/shared/constants";
import type { BaseTenantSessionData, RoleCode } from "@ambaril/shared/types";
import { hash, verify } from "@node-rs/argon2";

// Generate a cryptographically secure session token
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Hash password with Argon2id
export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

// Verify password against Argon2id hash
export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return verify(passwordHash, password);
}

// Create a new session for a user with tenant context
export async function createSession(
  userId: string,
  tenantId: string,
  userRole: string,
  remember: boolean = false,
): Promise<string> {
  const token = generateToken();
  const ttl = remember ? SESSION_TTL_REMEMBER : SESSION_TTL_DEFAULT;
  const expiresAt = new Date(Date.now() + ttl * 1000);

  await db.insert(sessions).values({
    userId,
    tenantId,
    token,
    userRole: userRole as typeof sessions.$inferInsert.userRole,
    userType: "internal",
    expiresAt,
  });

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttl,
  });

  return token;
}

// Get the current session from cookie (returns base tenant-aware session)
export async function getSession(): Promise<BaseTenantSessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const now = new Date();

  // Fetch session + user + tenant in one query
  const result = await db
    .select({
      sessionId: sessions.id,
      userId: sessions.userId,
      userRole: sessions.userRole,
      expiresAt: sessions.expiresAt,
      userName: users.name,
      userEmail: users.email,
      userIsActive: users.isActive,
      tenantId: tenants.id,
      tenantSlug: tenants.slug,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(tenants, eq(sessions.tenantId, tenants.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
    .limit(1);

  const row = result[0];
  if (!row || !row.userIsActive) return null;

  // Fetch permissions for this role
  const roleResult = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, row.userRole))
    .limit(1);

  let userPermissions: string[] = [];
  if (roleResult[0]) {
    const perms = await db
      .select({ resource: permissions.resource, action: permissions.action })
      .from(permissions)
      .where(eq(permissions.roleId, roleResult[0].id));

    userPermissions = perms.map((p) => `${p.resource}:${p.action}`);
  }

  // Admin gets wildcard
  if (row.userRole === "admin") {
    userPermissions = ["*"];
  }

  // Sliding window: update lastActiveAt
  await db
    .update(sessions)
    .set({ lastActiveAt: now })
    .where(eq(sessions.id, row.sessionId));

  return {
    userId: row.userId,
    role: row.userRole as RoleCode,
    permissions: userPermissions,
    name: row.userName,
    email: row.userEmail,
    tenantId: row.tenantId,
    tenantSlug: row.tenantSlug,
  };
}

// Destroy session (logout)
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}
