import { redirect } from "next/navigation";
import Link from "next/link";
import {
  peekMagicLink,
  verifyMagicLink,
  hashPassword,
  createSession,
} from "@/lib/auth";
import { db } from "@ambaril/db";
import { users, userTenants, sessions } from "@ambaril/db/schema";
import { eq } from "drizzle-orm";
import { XCircle } from "lucide-react";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";

interface Props {
  searchParams: Promise<{ token?: string; error?: string }>;
}

async function resetPasswordAction(token: string, formData: FormData) {
  "use server";

  const password = formData.get("password") as string;
  const confirm = formData.get("confirmPassword") as string;

  if (!password || password.length < 8) {
    redirect(`/login/reset-password?token=${token}&error=short`);
  }

  // eslint-disable-next-line security/detect-possible-timing-attacks
  if (password !== confirm) {
    redirect(`/login/reset-password?token=${token}&error=mismatch`);
  }

  // Verify and consume the token server-side — userId comes from DB, NOT from client
  const link = await verifyMagicLink(token);
  if (!link || link.type !== "password_reset" || !link.userId) {
    redirect("/forgot-password?error=expired");
  }

  const userId = link.userId;
  const hash = await hashPassword(password);

  await db
    .update(users)
    .set({ passwordHash: hash })
    .where(eq(users.id, userId));

  // Invalidate all active sessions for this user
  await db.delete(sessions).where(eq(sessions.userId, userId));

  // Find default tenant and create new session
  const tenantRows = await db
    .select({ tenantId: userTenants.tenantId, role: userTenants.role })
    .from(userTenants)
    .where(eq(userTenants.userId, userId))
    .limit(1);

  if (!tenantRows[0]) redirect("/login");

  const { tenantId, role } = tenantRows[0];
  await createSession(
    userId,
    tenantId,
    role as Parameters<typeof createSession>[2],
    false,
  );

  redirect("/admin");
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, error } = await searchParams;

  if (!token) {
    return <InvalidToken />;
  }

  // Peek at the token without consuming it — action will consume it
  const link = await peekMagicLink(token);

  if (!link || link.type !== "password_reset" || !link.userId) {
    return <InvalidToken />;
  }

  const errorMsg =
    error === "mismatch"
      ? "As senhas não coincidem."
      : error === "short"
        ? "A senha deve ter pelo menos 8 caracteres."
        : null;

  const action = resetPasswordAction.bind(null, token);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg-void px-4">
      <div className="login-silmaril" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="login-fade-1 mb-10 text-center">
          <h1 className="login-wordmark font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
            Ambaril
          </h1>
          <p className="mt-3 text-base text-text-muted">Criar nova senha</p>
        </div>

        <form action={action} className="login-fade-2 flex flex-col">
          <div className="flex flex-col gap-3">
            <Input
              name="password"
              type="password"
              label="Nova senha"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <Input
              name="confirmPassword"
              type="password"
              label="Confirmar senha"
              placeholder="Repita a senha"
              autoComplete="new-password"
              required
            />
          </div>
          {errorMsg && (
            <p className="login-error-enter mt-3 text-sm text-danger">
              {errorMsg}
            </p>
          )}
          <div className="mt-5">
            <Button type="submit" className="login-btn w-full">
              Salvar nova senha
            </Button>
          </div>
        </form>

        <div className="login-fade-3 mt-10">
          <div className="mb-5 h-px bg-border-subtle" />
          <p className="text-center text-sm text-text-muted">
            Lembrou sua senha?
          </p>
          <p className="mt-2 text-center">
            <Link
              href="/login"
              className="login-signup-link text-sm font-medium text-text-secondary underline underline-offset-4 hover:text-text-primary"
            >
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function InvalidToken() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg-void px-4">
      <div className="login-silmaril" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="login-wordmark font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
            Ambaril
          </h1>
        </div>

        <div className="login-sent-enter text-center">
          <div className="flex justify-center">
            <div className="login-sent-icon flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
              <XCircle className="h-6 w-6 text-danger" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-base font-medium text-text-bright">
              Link inválido ou expirado
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Solicite um novo link de redefinição de senha.
            </p>
          </div>
          <div className="mt-5">
            <Button asChild className="login-btn w-full">
              <Link href="/forgot-password">Solicitar novo link</Link>
            </Button>
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-5 h-px bg-border-subtle" />
          <p className="text-center text-sm text-text-muted">
            Precisa de ajuda?
          </p>
          <p className="mt-2 text-center">
            <Link
              href="/forgot-password"
              className="login-signup-link text-sm font-medium text-text-secondary underline underline-offset-4 hover:text-text-primary"
            >
              Solicitar novo link
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
