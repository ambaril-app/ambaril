"use server";

import { db } from "@ambaril/db";
import { creators } from "@ambaril/db/schema";
import { eq } from "drizzle-orm";
import {
  createCreatorSession,
  destroyCreatorSession,
  generateLoginCode,
  verifyLoginCode,
} from "@/lib/creator-auth";
import { sendCreatorLoginCodeEmail } from "@/lib/email";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: string };

// ---------------------------------------------------------------------------
// 1. requestCode — Generate and "send" a 6-digit login code
// ---------------------------------------------------------------------------

/**
 * Finds the creator by email, generates a 6-digit code, and returns the
 * verification token. In production this will also send the code via Resend.
 *
 * For MVP: the code is logged to console. The verification token is returned
 * to the client so it can be sent back with the code for verification.
 */
export async function requestLoginCodeAction(
  email: string,
): Promise<ActionResult<{ verificationToken: string }>> {
  try {
    // Validate email
    if (!email || typeof email !== "string") {
      return { error: "Email é obrigatório" };
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { error: "Email inválido" };
    }

    // Find creator by email (any tenant — login is cross-tenant by email)
    const result = await db
      .select({
        id: creators.id,
        tenantId: creators.tenantId,
        name: creators.name,
        status: creators.status,
      })
      .from(creators)
      .where(eq(creators.email, normalizedEmail))
      .limit(1);

    const creator = result[0];

    // Security: always return success to prevent email enumeration.
    // If the creator doesn't exist or isn't active, we still pretend we sent the code.
    if (!creator || creator.status !== "active") {
      // Log for debugging, but don't reveal to the user
      console.log(
        `[creator-auth] Login code requested for unknown/inactive email: ${normalizedEmail}`,
      );
      // Return a dummy verification token (it will fail on verification)
      return {
        data: {
          verificationToken: "invalid",
        },
      };
    }

    // Generate login code
    const { code, verificationToken } = generateLoginCode(
      normalizedEmail,
      creator.tenantId,
    );

    // Send login code via email
    await sendCreatorLoginCodeEmail(normalizedEmail, code);

    return { data: { verificationToken } };
  } catch (err) {
    console.error("[requestLoginCodeAction]", err);
    return { error: "Erro ao enviar codigo de acesso" };
  }
}

// ---------------------------------------------------------------------------
// 2. verifyCode — Verify the 6-digit code and create session
// ---------------------------------------------------------------------------

/**
 * Verifies the login code against the verification token.
 * On success, creates a creator session cookie.
 */
export async function verifyLoginCodeAction(
  code: string,
  verificationToken: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    // Validate inputs
    if (!code || typeof code !== "string") {
      return { error: "Código é obrigatório" };
    }

    if (!verificationToken || typeof verificationToken !== "string") {
      return { error: "Token de verificação inválido" };
    }

    const normalizedCode = code.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      return { error: "Código deve ter 6 dígitos" };
    }

    // Verify the code
    const verified = verifyLoginCode(normalizedCode, verificationToken);
    if (!verified) {
      return { error: "Código inválido ou expirado" };
    }

    // Find the creator to get their ID (we need it for the session)
    const result = await db
      .select({
        id: creators.id,
        tenantId: creators.tenantId,
        status: creators.status,
      })
      .from(creators)
      .where(eq(creators.email, verified.email))
      .limit(1);

    const creator = result[0];
    if (!creator) {
      return { error: "Conta não encontrada" };
    }

    if (creator.status !== "active") {
      const statusMessages: Record<string, string> = {
        pending: "Sua candidatura ainda está em análise",
        suspended: "Sua conta está temporariamente suspensa",
        inactive: "Sua conta está inativa",
      };
      return {
        error: statusMessages[creator.status] ?? "Conta não disponível",
      };
    }

    // Create session
    await createCreatorSession(creator.id, creator.tenantId, verified.email);

    return { data: { redirectTo: "/creators/dashboard" } };
  } catch (err) {
    console.error("[verifyLoginCodeAction]", err);
    return { error: "Erro ao verificar codigo" };
  }
}

// ---------------------------------------------------------------------------
// 3. logout — Destroy session
// ---------------------------------------------------------------------------

export async function logoutAction(): Promise<ActionResult<{ success: true }>> {
  try {
    await destroyCreatorSession();
    return { data: { success: true } };
  } catch (err) {
    console.error("[logoutAction]", err);
    return { error: "Erro ao sair" };
  }
}
