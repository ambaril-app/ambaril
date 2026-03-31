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
      .select()
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
            Este link de acesso já foi usado ou expirou. Solicite um novo link.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Solicitar novo link</Link>
        </Button>
      </div>
    </div>
  );
}
