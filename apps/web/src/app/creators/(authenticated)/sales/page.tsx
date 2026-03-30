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
        <h1 className="text-lg font-medium text-text-bright">Minhas Vendas</h1>
        <p className="text-sm text-text-secondary">
          Acompanhe suas vendas e comissoes.
        </p>
      </div>

      <SalesPageClient creatorId={creatorId} />
    </div>
  );
}
