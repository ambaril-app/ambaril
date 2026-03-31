"use server";

import { z } from "zod";
import { db } from "@ambaril/db";
import { users } from "@ambaril/db/schema";
import { eq } from "drizzle-orm";
import { createMagicLink, checkMagicLinkRateLimit } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const emailSchema = z.object({
  email: z.string().email("Email inválido."),
});

export async function forgotPasswordAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ sent?: boolean; error?: string } | null> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Email inválido." };
  }

  const { email } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const allowed = await checkMagicLinkRateLimit(normalizedEmail);
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde alguns minutos." };
  }

  // Find user — silent if not found (enumeration prevention)
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  // Always return success
  if (result.length > 0) {
    const userId = result[0]!.id;
    const token = await createMagicLink(normalizedEmail, "password_reset", { userId });
    await sendPasswordResetEmail(
      normalizedEmail,
      `${BASE_URL}/login/reset-password?token=${token}`,
    );
  }

  return { sent: true };
}
