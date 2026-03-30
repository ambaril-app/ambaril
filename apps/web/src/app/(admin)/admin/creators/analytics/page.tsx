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
import { ProductMixChart } from "./components/product-mix-chart";
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
        <h1 className="text-[32px] font-display font-medium leading-tight tracking-tight text-text-bright">
          Analytics — Creators
        </h1>
        <p className="text-sm text-text-secondary">
          Visao geral de performance do programa de creators
        </p>
      </div>

      {/* KPI Cards */}
      <KpiCards kpis={kpis} />

      {/* Charts Grid: 2x2 desktop, 1 column mobile */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top 10 Performers */}
        <div className="rounded-lg border border-border-default bg-bg-base p-4">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-base font-medium text-text-bright">
              Top 10 Performers
            </h2>
            <p className="text-xs text-text-muted">
              Vendas do mes atual por creator
            </p>
          </div>
          <div className="h-[320px]">
            <TopPerformersChart data={performers} />
          </div>
        </div>

        {/* Tier Distribution */}
        <div className="rounded-lg border border-border-default bg-bg-base p-4">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-base font-medium text-text-bright">
              Distribuicao por Tier
            </h2>
            <p className="text-xs text-text-muted">
              Quantidade de creators em cada tier
            </p>
          </div>
          <div className="h-[320px]">
            <TierDistributionChart data={tiers} />
          </div>
        </div>

        {/* Product Mix (Placeholder) */}
        <div className="rounded-lg border border-border-default bg-bg-base p-4">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-base font-medium text-text-bright">
              Mix de Produtos
            </h2>
            <p className="text-xs text-text-muted">
              Produtos mais vendidos por creators
            </p>
          </div>
          <div className="h-[320px]">
            <ProductMixChart />
          </div>
        </div>

        {/* Monthly Evolution */}
        <div className="rounded-lg border border-border-default bg-bg-base p-4">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-base font-medium text-text-bright">
              Evolucao Mensal
            </h2>
            <p className="text-xs text-text-muted">
              GMV atribuido a creators nos ultimos 6 meses
            </p>
          </div>
          <div className="h-[320px]">
            <MonthlyEvolutionChart data={evolution} />
          </div>
        </div>
      </div>
    </div>
  );
}
