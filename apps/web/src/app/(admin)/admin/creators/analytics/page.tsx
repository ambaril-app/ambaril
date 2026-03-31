import { getTenantSession } from "@/lib/tenant";
import {
  getOverviewKPIs,
  getTopPerformers,
  getTierDistribution,
  getMonthlyEvolution,
} from "@/app/actions/creators/analytics";
import { KpiCards } from "./components/kpi-cards";
import { TopPerformersChart } from "./components/top-performers-chart";
import { TierDistributionChart } from "./components/tier-distribution-chart";
import { MonthlyEvolutionChart } from "./components/monthly-evolution-chart";

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function CreatorsAnalyticsPage() {
  await getTenantSession();

  // Fetch all analytics data in parallel
  const [kpisResult, performersResult, tierResult, evolutionResult] =
    await Promise.all([
      getOverviewKPIs(),
      getTopPerformers(10),
      getTierDistribution(),
      getMonthlyEvolution(),
    ]);

  // Fallback to safe defaults on error
  const kpis = kpisResult.data ?? {
    totalGMV: "0.00",
    totalCommissions: "0.00",
    activeCreators: 0,
    avgCAC: "0.00",
  };
  const performers = performersResult.data ?? [];
  const tiers = tierResult.data ?? [];
  const evolution = evolutionResult.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-[32px] font-medium leading-tight tracking-[-0.02em] text-text-bright">
          Analytics
        </h1>
      </div>

      {/* KPI Cards */}
      <KpiCards kpis={kpis} />

      {/* Hero chart — Monthly Evolution */}
      <div className="rounded-lg border border-border-default bg-bg-base p-5">
        <h2 className="mb-5 text-[11px] font-medium uppercase tracking-[0.06em] text-text-ghost">
          Evolução Mensal de GMV
        </h2>
        <div className="h-[260px]">
          <MonthlyEvolutionChart data={evolution} />
        </div>
      </div>

      {/* Supporting charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top 10 Performers */}
        <div className="rounded-lg border border-border-default bg-bg-base p-5">
          <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.06em] text-text-ghost">
            Top 10 Performers — Este Mês
          </h2>
          <div className="h-[280px]">
            <TopPerformersChart data={performers} />
          </div>
        </div>

        {/* Tier Distribution */}
        <div className="rounded-lg border border-border-default bg-bg-base p-5">
          <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.06em] text-text-ghost">
            Distribuição por Tier
          </h2>
          <div className="h-[280px]">
            <TierDistributionChart data={tiers} />
          </div>
        </div>
      </div>
    </div>
  );
}
