"use server";

import { redirect } from "next/navigation";
import { db } from "@ambaril/db";
import { users, userTenants } from "@ambaril/db/schema";
import { eq, and } from "drizzle-orm";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@ambaril/shared/validators";

interface LoginState {
  error?: string;
}

export async function login(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember") === "on",
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Email ou senha invalidos." };
  }

  const { email, password, remember } = parsed.data;

  // Find user by email
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = result[0];
  if (!user || !user.isActive) {
    return { error: "Email ou senha invalidos." };
  }

  // Verify password
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Email ou senha invalidos." };
  }

  // Find user's tenant(s)
  const tenantRows = await db
    .select()
    .from(userTenants)
    .where(eq(userTenants.userId, user.id));

  if (tenantRows.length === 0) {
    return { error: "Nenhuma organizacao vinculada a este usuario." };
  }

  // Select tenant: use default, or first available
  const defaultTenant = tenantRows.find((t) => t.isDefault) ?? tenantRows[0]!;

  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  // Create session with tenant context
  await createSession(user.id, defaultTenant.tenantId, defaultTenant.role, remember);

  redirect("/admin/creators");
}
