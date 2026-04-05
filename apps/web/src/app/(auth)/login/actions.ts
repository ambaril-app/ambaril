"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@ambaril/db";
import { users, userTenants } from "@ambaril/db/schema";
import { eq } from "drizzle-orm";
import {
  createSession,
  verifyPassword,
  checkMagicLinkRateLimit,
  createMagicLink,
} from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import { loginSchema } from "@ambaril/shared/validators";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const emailSchema = z.object({
  email: z.string().email("Email inválido."),
});

// Magic link action
export async function sendMagicLinkAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ sent?: boolean; email?: string; error?: string } | null> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Email inválido." };
  }

  const { email } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Rate limit
  const allowed = await checkMagicLinkRateLimit(normalizedEmail);
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde alguns minutos." };
  }

  // Find user
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  // Enumeration prevention: always return success
  if (result.length === 0) {
    return { sent: true, email: normalizedEmail };
  }

  const user = result[0]!;

  // Find default tenant
  const tenantRows = await db
    .select({ tenantId: userTenants.tenantId })
    .from(userTenants)
    .where(eq(userTenants.userId, user.id))
    .limit(1);

  const tenantId = tenantRows[0]?.tenantId ?? undefined;

  const token = await createMagicLink(normalizedEmail, "login", {
    userId: user.id,
    tenantId,
  });

  await sendMagicLinkEmail(
    normalizedEmail,
    `${BASE_URL}/login/verify?token=${token}`,
  );

  return { sent: true, email: normalizedEmail };
}

// Password login action (kept as fallback)
export async function loginWithPasswordAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    remember: false,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Email ou senha inválidos." };
  }

  const { email, password } = parsed.data;

  // Rate limit: max 5 password attempts per email in 15 minutes
  const { checkLoginRateLimit, recordFailedLogin } = await import("@/lib/auth");
  const loginAllowed = await checkLoginRateLimit(email);
  if (!loginAllowed) {
    return { error: "Muitas tentativas. Aguarde 15 minutos." };
  }

  // Find user by email
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = result[0];
  if (!user || !user.isActive) {
    return { error: "Email ou senha inválidos." };
  }

  // passwordHash may be null for magic-link-only users
  if (!user.passwordHash) {
    return {
      error: 'Esta conta usa login por link. Use a aba "Link de acesso".',
    };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await recordFailedLogin(email);

    // Audit: failed login attempt
    const { auditAnonymous: auditFailed } = await import("@/lib/audit");
    auditFailed(null, {
      action: "login_failed",
      resourceType: "session",
      email: email,
    });

    return { error: "Email ou senha inválidos." };
  }

  // Find user's tenant(s)
  const tenantRows = await db
    .select({
      tenantId: userTenants.tenantId,
      role: userTenants.role,
      isDefault: userTenants.isDefault,
    })
    .from(userTenants)
    .where(eq(userTenants.userId, user.id));

  if (tenantRows.length === 0) {
    return { error: "Nenhuma organização vinculada a este usuário." };
  }

  // Select tenant: use default, or first available
  const defaultTenant = tenantRows.find((t) => t.isDefault) ?? tenantRows[0]!;

  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  // Create session with tenant context
  await createSession(
    user.id,
    defaultTenant.tenantId,
    defaultTenant.role,
    false,
  );

  // Audit: successful login
  const { auditAnonymous } = await import("@/lib/audit");
  auditAnonymous(defaultTenant.tenantId, {
    action: "login",
    resourceType: "session",
    resourceId: user.id,
    email: email,
  });

  redirect("/admin");
}
