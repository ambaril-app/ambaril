import Link from "next/link";
import { getTenantSession } from "@/lib/tenant";
import { listTiers } from "@/app/actions/creators/tiers";
import { ArrowLeft } from "lucide-react";
import { NewCreatorForm } from "./new-creator-form";

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function NewCreatorPage() {
  await getTenantSession();

  const tiersResult = await listTiers();
  const tiers = (tiersResult.data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    commissionRate: t.commissionRate,
  }));

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/creators"
        className="inline-flex items-center gap-1.5 text-sm text-text-ghost hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para lista de creators
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-[32px] font-display font-medium leading-tight tracking-[-0.02em] text-text-bright">
          Novo Creator (Cadastro Manual)
        </h1>
        <p className="text-sm text-text-ghost">
          Preencha os dados para cadastrar um creator gerenciado pela equipe.
        </p>
      </div>

      {/* Form */}
      <NewCreatorForm tiers={tiers} />
    </div>
  );
}
