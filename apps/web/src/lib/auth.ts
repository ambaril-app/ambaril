import { cookies } from "next/headers";
import { db } from "@ambaril/db";
import {
  sessions,
  users,
  permissions,
  roles,
  tenants,
  magicLinks,
} from "@ambaril/db/schema";
import { eq, and, gt, gte, isNull, sql } from "drizzle-orm";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_DEFAULT,
  SESSION_TTL_REMEMBER,
} from "@ambaril/shared/constants";
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
      lastActiveAt: sessions.lastActiveAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(tenants, eq(sessions.tenantId, tenants.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
    .limit(1);

  const row = result[0];
  if (!row || !row.userIsActive) return null;

  // Idle timeout: invalidate session if no activity for 2 hours
  const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;
  if (row.lastActiveAt) {
    const lastActive = new Date(row.lastActiveAt).getTime();
    if (now.getTime() - lastActive > IDLE_TIMEOUT_MS) {
      // Session idle too long — destroy it
      await db.delete(sessions).where(eq(sessions.id, row.sessionId));
      const cookieStore2 = await cookies();
      cookieStore2.delete(SESSION_COOKIE_NAME);
      return null;
    }
  }

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

// ===== Magic Links =====

/**
 * Rate limit: max 3 magic links per email in the last 10 minutes.
 * Returns true if allowed, false if limit exceeded.
 */
export async function checkMagicLinkRateLimit(email: string): Promise<boolean> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(magicLinks)
    .where(
      and(
        eq(magicLinks.email, email.toLowerCase()),
        gte(magicLinks.createdAt, tenMinutesAgo),
      ),
    );
  const count = Number(result[0]?.count ?? 0);
  return count < 3;
}

/**
 * Rate limit for password login: max 5 attempts per email in the last 15 minutes.
 * Uses magic_links table with type='login' and userId=null as a lightweight counter.
 * Returns true if allowed, false if limit exceeded.
 */
export async function checkLoginRateLimit(email: string): Promise<boolean> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(magicLinks)
    .where(
      and(
        eq(magicLinks.email, email.toLowerCase()),
        eq(magicLinks.type, "login"),
        isNull(magicLinks.userId),
        gte(magicLinks.createdAt, fifteenMinutesAgo),
      ),
    );
  const count = Number(result[0]?.count ?? 0);
  return count < 5;
}

/**
 * Record a failed login attempt for rate limiting purposes.
 * Stores as type='login' with userId=null to distinguish from real magic links.
 */
export async function recordFailedLogin(email: string): Promise<void> {
  await db.insert(magicLinks).values({
    email: email.toLowerCase(),
    token: generateToken(),
    type: "login",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    usedAt: new Date(),
  });
}

/**
 * Create a magic link: 32-byte hex token, 15-minute TTL.
 * Invalidates pending links for the same email + type.
 */
export async function createMagicLink(
  email: string,
  type: "login" | "signup" | "invite" | "password_reset",
  opts?: { userId?: string; tenantId?: string; role?: string },
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Invalidate pending links for the same email/type
  await db
    .update(magicLinks)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(magicLinks.email, email.toLowerCase()),
        eq(magicLinks.type, type),
        isNull(magicLinks.usedAt),
      ),
    );

  await db.insert(magicLinks).values({
    email: email.toLowerCase(),
    token,
    type,
    role: (opts?.role as typeof magicLinks.$inferInsert.role) ?? null,
    userId: opts?.userId ?? null,
    tenantId: opts?.tenantId ?? null,
    expiresAt,
  });

  return token;
}

/**
 * Check if a magic link token is valid WITHOUT consuming it.
 * Used by RSC pages that need to show a form before the action consumes the token.
 */
export async function peekMagicLink(token: string): Promise<{
  email: string;
  type: string;
  userId: string | null;
  tenantId: string | null;
  role: string | null;
} | null> {
  const now = new Date();

  const links = await db
    .select()
    .from(magicLinks)
    .where(
      and(
        eq(magicLinks.token, token),
        isNull(magicLinks.usedAt),
        gte(magicLinks.expiresAt, now),
      ),
    )
    .limit(1);

  const link = links[0];
  if (!link) return null;

  return {
    email: link.email,
    type: link.type,
    userId: link.userId,
    tenantId: link.tenantId,
    role: link.role ?? null,
  };
}

/**
 * Validate token: not expired, not used. Marks usedAt=now().
 * Returns null if invalid.
 */
export async function verifyMagicLink(token: string): Promise<{
  email: string;
  type: string;
  userId: string | null;
  tenantId: string | null;
  role: string | null;
} | null> {
  const now = new Date();

  const links = await db
    .select()
    .from(magicLinks)
    .where(
      and(
        eq(magicLinks.token, token),
        isNull(magicLinks.usedAt),
        gte(magicLinks.expiresAt, now),
      ),
    )
    .limit(1);

  const link = links[0];
  if (!link) return null;

  // Mark as used
  await db
    .update(magicLinks)
    .set({ usedAt: now })
    .where(eq(magicLinks.id, link.id));

  return {
    email: link.email,
    type: link.type,
    userId: link.userId,
    tenantId: link.tenantId,
    role: link.role ?? null,
  };
}
