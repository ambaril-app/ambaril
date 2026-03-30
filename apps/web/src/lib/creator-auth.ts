import { cookies } from "next/headers";
import { db } from "@ambaril/db";
import { creators, creatorTiers } from "@ambaril/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CREATOR_COOKIE_NAME = "ambaril_creator";
const CREATOR_SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
const LOGIN_CODE_TTL = 15 * 60; // 15 minutes in seconds
const LOGIN_CODE_LENGTH = 6;

function getSessionSecret(): string {
  const secret = process.env.CREATOR_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CREATOR_SESSION_SECRET must be set in production (min 32 chars)",
      );
    }
    // Dev fallback — NEVER use in production
    return "dev-creator-session-secret-do-not-use-in-prod";
  }
  return secret;
}

// ---------------------------------------------------------------------------
// HMAC token utilities (stateless sessions, no external JWT library)
// ---------------------------------------------------------------------------

interface CreatorTokenPayload {
  /** Creator UUID */
  sub: string;
  /** Tenant UUID */
  tid: string;
  /** Creator email */
  email: string;
  /** Issued-at (unix seconds) */
  iat: number;
  /** Expires-at (unix seconds) */
  exp: number;
  /** When true, this is an admin previewing the creator portal */
  preview?: boolean;
}

function hmacSign(data: string): string {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(data)
    .digest("base64url");
}

function signToken(payload: CreatorTokenPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = hmacSign(data);
  return `${data}.${signature}`;
}

function verifyToken(token: string): CreatorTokenPayload | null {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return null;

  const data = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  if (!data || !signature) return null;

  // Constant-time comparison to prevent timing attacks
  const expectedSignature = hmacSign(data);
  if (expectedSignature.length !== signature.length) return null;

  const expectedBuf = Buffer.from(expectedSignature);
  const actualBuf = Buffer.from(signature);
  if (!crypto.timingSafeEqual(expectedBuf, actualBuf)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf-8"),
    ) as unknown;

    // Runtime shape validation (no `any`)
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("sub" in payload) ||
      !("tid" in payload) ||
      !("email" in payload) ||
      !("iat" in payload) ||
      !("exp" in payload)
    ) {
      return null;
    }

    const p = payload as Record<string, unknown>;
    if (
      typeof p.sub !== "string" ||
      typeof p.tid !== "string" ||
      typeof p.email !== "string" ||
      typeof p.iat !== "number" ||
      typeof p.exp !== "number"
    ) {
      return null;
    }

    const result: CreatorTokenPayload = {
      sub: p.sub,
      tid: p.tid,
      email: p.email,
      iat: p.iat,
      exp: p.exp,
      ...(p.preview === true ? { preview: true } : {}),
    };

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (result.exp < now) return null;

    return result;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Creator session data (returned to consuming components/pages)
// ---------------------------------------------------------------------------

export interface CreatorSessionData {
  creatorId: string;
  tenantId: string;
  email: string;
  name: string;
  status: "pending" | "active" | "suspended" | "inactive";
  tierId: string | null;
  tierName: string | null;
  profileImageUrl: string | null;
  /** True when admin is previewing this creator's portal */
  preview: boolean;
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

/**
 * Create a session for a creator by setting an HMAC-signed cookie.
 * Called after successful login code verification.
 */
export async function createCreatorSession(
  creatorId: string,
  tenantId: string,
  email: string,
  options?: { preview?: boolean },
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const token = signToken({
    sub: creatorId,
    tid: tenantId,
    email,
    iat: now,
    exp: now + CREATOR_SESSION_TTL,
    ...(options?.preview ? { preview: true } : {}),
  });

  const cookieStore = await cookies();
  cookieStore.set(CREATOR_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/creators",
    maxAge: CREATOR_SESSION_TTL,
  });
}

/**
 * Get the current creator session from the signed cookie.
 * Returns fresh data from DB (checks status=active).
 * Returns null if no valid session or creator is not active.
 */
export async function getCreatorSession(): Promise<CreatorSessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CREATOR_COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  // Fetch fresh creator data from DB to verify status
  const result = await db
    .select({
      id: creators.id,
      tenantId: creators.tenantId,
      email: creators.email,
      name: creators.name,
      status: creators.status,
      tierId: creators.tierId,
      profileImageUrl: creators.profileImageUrl,
    })
    .from(creators)
    .where(
      and(
        eq(creators.id, payload.sub),
        eq(creators.tenantId, payload.tid),
      ),
    )
    .limit(1);

  const creator = result[0];
  if (!creator) return null;

  // Only allow active creators
  if (creator.status !== "active") return null;

  // Fetch tier name if tierId exists
  let tierName: string | null = null;
  if (creator.tierId) {
    const tierResult = await db
      .select({ name: creatorTiers.name })
      .from(creatorTiers)
      .where(eq(creatorTiers.id, creator.tierId))
      .limit(1);

    tierName = tierResult[0]?.name ?? null;
  }

  return {
    creatorId: creator.id,
    tenantId: creator.tenantId,
    email: creator.email,
    name: creator.name,
    status: creator.status,
    tierId: creator.tierId,
    tierName,
    profileImageUrl: creator.profileImageUrl,
    preview: payload.preview === true,
  };
}

/**
 * Destroy the creator session (logout).
 */
export async function destroyCreatorSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: CREATOR_COOKIE_NAME,
    path: "/creators",
  });
}

// ---------------------------------------------------------------------------
// Login code utilities (stateless, HMAC-signed codes with expiry)
// ---------------------------------------------------------------------------

interface LoginCodePayload {
  /** Creator email */
  email: string;
  /** 6-digit code */
  code: string;
  /** Tenant ID */
  tid: string;
  /** Expires-at (unix seconds) */
  exp: number;
}

/**
 * Generate a 6-digit login code for a creator.
 * Returns the code (to be sent via email) and a signed verification token
 * (stored server-side or passed as a hidden field).
 *
 * The verification token is an HMAC-signed payload containing the code,
 * email, tenant, and expiry. This means we don't need a DB column --
 * the code is verified by re-signing and comparing.
 */
export function generateLoginCode(
  email: string,
  tenantId: string,
): { code: string; verificationToken: string } {
  // Generate cryptographically secure 6-digit code
  const codeBytes = crypto.getRandomValues(new Uint8Array(4));
  const codeNum =
    (codeBytes[0]! * 256 * 256 * 256 +
      codeBytes[1]! * 256 * 256 +
      codeBytes[2]! * 256 +
      codeBytes[3]!) %
    1000000;
  const code = codeNum.toString().padStart(LOGIN_CODE_LENGTH, "0");

  const now = Math.floor(Date.now() / 1000);
  const payload: LoginCodePayload = {
    email,
    code,
    tid: tenantId,
    exp: now + LOGIN_CODE_TTL,
  };

  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = hmacSign(data);
  const verificationToken = `${data}.${signature}`;

  return { code, verificationToken };
}

/**
 * Verify a login code against a verification token.
 * Returns the email and tenantId if valid, null otherwise.
 */
export function verifyLoginCode(
  inputCode: string,
  verificationToken: string,
): { email: string; tenantId: string } | null {
  const dotIndex = verificationToken.indexOf(".");
  if (dotIndex === -1) return null;

  const data = verificationToken.slice(0, dotIndex);
  const signature = verificationToken.slice(dotIndex + 1);

  if (!data || !signature) return null;

  // Constant-time comparison
  const expectedSignature = hmacSign(data);
  if (expectedSignature.length !== signature.length) return null;

  const expectedBuf = Buffer.from(expectedSignature);
  const actualBuf = Buffer.from(signature);
  if (!crypto.timingSafeEqual(expectedBuf, actualBuf)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf-8"),
    ) as unknown;

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("email" in payload) ||
      !("code" in payload) ||
      !("tid" in payload) ||
      !("exp" in payload)
    ) {
      return null;
    }

    const p = payload as Record<string, unknown>;
    if (
      typeof p.email !== "string" ||
      typeof p.code !== "string" ||
      typeof p.tid !== "string" ||
      typeof p.exp !== "number"
    ) {
      return null;
    }

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (p.exp < now) return null;

    // Constant-time code comparison
    if (inputCode.length !== p.code.length) return null;
    const inputBuf = Buffer.from(inputCode);
    const codeBuf = Buffer.from(p.code);
    if (!crypto.timingSafeEqual(inputBuf, codeBuf)) return null;

    return { email: p.email, tenantId: p.tid };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Convenience: require creator session or redirect
// ---------------------------------------------------------------------------

/**
 * Get creator session with redirect to login if not authenticated.
 * Use in server components / layouts that require authentication.
 */
export async function requireCreatorSession(): Promise<CreatorSessionData> {
  const session = await getCreatorSession();
  if (!session) {
    // Dynamic import to avoid making this file client-incompatible at module level.
    // redirect() from next/navigation throws internally and never returns,
    // but TypeScript can't infer `never` from a dynamic import, so we
    // re-throw to satisfy the return type.
    const { redirect } = await import("next/navigation");
    redirect("/creators/login");
    // redirect() throws — this line is unreachable but satisfies tsc
    throw new Error("unreachable");
  }
  return session;
}
