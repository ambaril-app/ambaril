import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyMagicLink, createSession } from "@/lib/auth";
import { db } from "@ambaril/db";
import { userTenants, users } from "@ambaril/db/schema";
import { eq } from "drizzle-orm";
import { XCircle } from "lucide-react";
import { Button } from "@ambaril/ui/components/button";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidToken />;
  }

  const link = await verifyMagicLink(token);

  if (!link) {
    return <InvalidToken />;
  }

  const userId = link.userId;
  let tenantId = link.tenantId;
  let role = link.role ?? "admin";

  if (!userId) {
    // signup: user should already have been created in signup/actions.ts
    return <InvalidToken />;
  }

  // For login: find default tenant if not in the link
  if (!tenantId) {
    const tenantRows = await db
      .select({ tenantId: userTenants.tenantId, role: userTenants.role })
      .from(userTenants)
      .where(eq(userTenants.userId, userId))
      .limit(1);

    tenantId = tenantRows[0]?.tenantId ?? null;
    role = tenantRows[0]?.role ?? "admin";
  }

  if (!tenantId) {
    return <InvalidToken />;
  }

  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, userId));

  await createSession(
    userId,
    tenantId,
    role as Parameters<typeof createSession>[2],
    false,
  );

  redirect("/admin");
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
              Este link de acesso já foi usado ou expirou. Solicite um novo
              link.
            </p>
          </div>
          <div className="mt-5">
            <Button asChild className="login-btn w-full">
              <Link href="/login">Solicitar novo link</Link>
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
              href="/login"
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
