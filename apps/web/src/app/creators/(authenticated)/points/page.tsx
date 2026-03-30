import { requireCreatorSession } from "@/lib/creator-auth";
import { getPointsBalance, getPointsLedger } from "@/app/actions/creators/points";
import { PointsPageClient } from "./points-page-client";

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function PointsPage() {
  const session = await requireCreatorSession();
  const creatorId = session.creatorId;

  // Fetch points data in parallel
  const [balanceResult, ledgerResult] = await Promise.all([
    getPointsBalance(creatorId),
    getPointsLedger(creatorId, { page: 1, per_page: 25, sort_order: "desc" }),
  ]);

  const balance = balanceResult.data ?? { total: 0, thisMonth: 0 };
  const ledgerData = ledgerResult.data ?? { items: [], total: 0, page: 1, perPage: 25 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-display font-medium leading-tight tracking-tight text-text-bright">Meus Pontos</h1>
        <p className="text-sm text-text-secondary">
          Acompanhe seus pontos acumulados e histórico de atividades.
        </p>
      </div>

      <PointsPageClient
        creatorId={creatorId}
        totalPoints={balance.total}
        thisMonthPoints={balance.thisMonth}
        initialLedger={ledgerData.items.map((item) => ({
          id: item.id,
          createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
          actionType: item.actionType,
          description: item.description,
          points: item.points,
        }))}
        totalLedgerItems={ledgerData.total}
      />
    </div>
  );
}
