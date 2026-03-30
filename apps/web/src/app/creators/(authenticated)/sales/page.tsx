import { requireCreatorSession } from "@/lib/creator-auth";
import { SalesPageClient } from "./sales-page-client";

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function SalesPage() {
  const session = await requireCreatorSession();
  const creatorId = session.creatorId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-display font-medium leading-tight tracking-tight text-text-bright">Minhas Vendas</h1>
        <p className="text-sm text-text-secondary">
          Acompanhe suas vendas e comissões.
        </p>
      </div>

      <SalesPageClient creatorId={creatorId} />
    </div>
  );
}
