import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyMagicLink, hashPassword, createSession } from "@/lib/auth";
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

  if (password !== confirm) {
    redirect(`/login/reset-password?token=${token}&error=mismatch`);
  }

  // userId passed via hidden field (token already consumed on page render)
  const userId = formData.get("userId") as string;
  if (!userId) redirect("/forgot-password");

  const hash = await hashPassword(password);

  await db
    .update(users)
    .set({ passwordHash: hash })
    .where(eq(users.id, userId));

  // Invalidate all active sessions for this user
  await db
    .delete(sessions)
    .where(eq(sessions.userId, userId));

  // Find default tenant and create new session
  const tenantRows = await db
    .select()
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

  const link = await verifyMagicLink(token);

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
    <div className="flex min-h-dvh items-center justify-center bg-bg-void px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-text-bright">
            Ambaril
          </h1>
          <p className="mt-1 text-sm text-text-muted">Criar nova senha</p>
        </div>

        <form action={action} className="space-y-4">
          <input type="hidden" name="userId" value={link.userId} />
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
          {errorMsg && (
            <p className="text-sm text-danger">{errorMsg}</p>
          )}
          <Button type="submit" className="w-full">
            Salvar nova senha
          </Button>
        </form>
      </div>
    </div>
  );
}

function InvalidToken() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-void px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
            <XCircle className="h-6 w-6 text-danger" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-text-bright">
            Link inválido ou expirado
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Solicite um novo link de redefinição de senha.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Solicitar novo link</Link>
        </Button>
      </div>
    </div>
  );
}
