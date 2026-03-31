"use server";

import { z } from "zod";
import { db, txDb } from "@ambaril/db";
import { users, tenants, userTenants } from "@ambaril/db/schema";
import { eq } from "drizzle-orm";
import { createMagicLink, checkMagicLinkRateLimit, hashPassword } from "@/lib/auth";
import { sendSignupEmail } from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const signupSchema = z.object({
  email: z.string().email("Email inválido."),
  companyName: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres."),
});

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function signupAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ sent?: boolean; email?: string; error?: string } | null> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    companyName: formData.get("companyName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }

  const { email, companyName } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Rate limit
  const allowed = await checkMagicLinkRateLimit(normalizedEmail);
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde alguns minutos." };
  }

  // Check if email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing.length > 0) {
    return { error: "Este email já está cadastrado. Faça login." };
  }

  // Generate unique slug
  let slug = slugify(companyName);
  const existingSlug = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (existingSlug.length > 0) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Generate a random password for the admin (12 chars: letters + digits)
  const randomPassword = Array.from(
    crypto.getRandomValues(new Uint8Array(12)),
    (b) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"[b % 56],
  ).join("");
  const passwordHash = await hashPassword(randomPassword);

  if (process.env.NODE_ENV !== "production") {
    console.info(`\n[Signup] Admin criado\n  Email: ${normalizedEmail}\n  Senha: ${randomPassword}\n`);
  }

  // Transaction: create tenant + user + user_tenant (txDb = WebSocket driver, supports transactions)
  const { userId, tenantId } = await txDb.transaction(async (tx) => {
    const [tenant] = await tx
      .insert(tenants)
      .values({
        name: companyName,
        slug,
        plan: "starter",
        settings: { currency: "BRL", timezone: "America/Sao_Paulo" },
      })
      .returning({ id: tenants.id });

    const [user] = await tx
      .insert(users)
      .values({
        email: normalizedEmail,
        name: companyName,
        role: "admin",
        passwordHash,
      })
      .returning({ id: users.id });

    await tx.insert(userTenants).values({
      userId: user!.id,
      tenantId: tenant!.id,
      role: "admin",
      isDefault: true,
    });

    return { userId: user!.id, tenantId: tenant!.id };
  });

  const token = await createMagicLink(normalizedEmail, "signup", { userId, tenantId });
  await sendSignupEmail(normalizedEmail, `${BASE_URL}/login/verify?token=${token}`, companyName);

  return { sent: true, email: normalizedEmail };
}
