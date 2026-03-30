import { requireCreatorSession } from "@/lib/creator-auth";
import { getRanking, getCreatorOfMonth } from "@/app/actions/creators/ranking";
import { RankingList } from "./components/ranking-list";

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function RankingPage() {
  const session = await requireCreatorSession();
  const creatorId = session.creatorId;

  // Fetch ranking and creator of month in parallel
  const [rankingResult, cotmResult] = await Promise.all([
    getRanking(20),
    getCreatorOfMonth(),
  ]);

  const rankedCreators = (rankingResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    totalSalesAmount: c.totalSalesAmount,
    tierName: c.tierName,
  }));

  const creatorOfMonth = cotmResult.data
    ? {
        id: cotmResult.data.id,
        name: cotmResult.data.name,
        currentMonthSalesAmount: cotmResult.data.currentMonthSalesAmount,
        tierName: cotmResult.data.tierName,
      }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-text-bright">Ranking</h1>
        <p className="text-sm text-text-secondary">
          Veja sua posicao entre os creators e quem esta no topo.
        </p>
      </div>

      <RankingList
        creators={rankedCreators}
        currentCreatorId={creatorId}
        creatorOfMonth={creatorOfMonth}
      />
    </div>
  );
}
