import { getTenantSession } from "@/lib/tenant";
import { hasRole } from "@ambaril/shared/utils";
import { MODULES } from "@ambaril/shared/constants";
import {
  getOverviewKPIs,
  getTopPerformers,
  getMonthlyEvolution,
  type OverviewKPIs,
  type TopPerformer,
  type MonthlyEvolutionEntry,
} from "@/app/actions/creators/analytics";
import { listCreators } from "@/app/actions/creators/crud";
import { BeaconHeader } from "./components/beacon-header";
import { CreatorsKpiRow } from "./components/creators-kpi-row";
import { CreatorsChartsRow } from "./components/creators-charts-row";
import { PendingApprovalsWidget } from "./components/pending-approvals-widget";
import { ModulePreviewGrid } from "./components/module-preview-grid";
import { QuickActionsBar } from "./components/quick-actions-bar";

// Default fallback KPIs for empty state
const DEFAULT_KPIS: OverviewKPIs = {
  totalGMV: "0.00",
  totalCommissions: "0.00",
  activeCreators: 0,
  avgCAC: "0.00",
};

// Minimal shape needed by PendingApprovalsWidget
type PendingCreatorItem = { id: string; name: string; createdAt: Date };

export default async function AdminHomePage() {
  const session = await getTenantSession();
  const isCreatorsRole = hasRole(session.effectiveRole, ["admin", "pm"]);

  // ---- Data fetching -------------------------------------------------------
  // Parallel fetch — only for roles with Creators access
  let kpis: OverviewKPIs = DEFAULT_KPIS;
  let topPerformers: TopPerformer[] = [];
  let evolution: MonthlyEvolutionEntry[] = [];
  let pendingCreators: PendingCreatorItem[] = [];
  let pendingTotal = 0;

  if (isCreatorsRole) {
    const [kpisRes, topRes, evolutionRes, pendingRes] = await Promise.all([
      getOverviewKPIs(),
      getTopPerformers(5),
      getMonthlyEvolution(),
      listCreators({ status: "pending", per_page: 5, page: 1 }),
    ]);

    if (kpisRes.data) kpis = kpisRes.data;
    if (topRes.data) topPerformers = topRes.data;
    if (evolutionRes.data) evolution = evolutionRes.data;
    if (pendingRes.data) {
      pendingCreators = pendingRes.data.creators.map((c) => ({
        id: c.id,
        name: c.name,
        createdAt: c.createdAt,
      }));
      pendingTotal = pendingRes.data.total;
    }
  }

  // ---- Module preview grid -------------------------------------------------
  // Filter coming_soon modules visible to this role
  const comingSoonModules = MODULES.filter(
    (mod) =>
      mod.status === "coming_soon" &&
      hasRole(session.effectiveRole, mod.requiredRoles),
  );

  // ---- Render --------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* Greeting + date + role badge */}
      <BeaconHeader session={session} />

      {isCreatorsRole ? (
        <>
          {/* Pending approvals — first when urgent */}
          <PendingApprovalsWidget
            creators={pendingCreators}
            total={pendingTotal}
          />

          {/* KPI overview */}
          <CreatorsKpiRow kpis={kpis} pendingCount={pendingTotal} />

          {/* Charts: GMV evolution + top performers */}
          <CreatorsChartsRow
            evolution={evolution}
            topPerformers={topPerformers}
          />

          {/* Quick actions */}
          <QuickActionsBar
            role={session.effectiveRole}
            pendingCount={pendingTotal}
          />
        </>
      ) : (
        /* Other roles: sector-specific quick actions (mostly disabled) */
        <QuickActionsBar role={session.effectiveRole} pendingCount={0} />
      )}

      {/* Coming soon modules — blurred preview cards */}
      <ModulePreviewGrid modules={comingSoonModules} />
    </div>
  );
}
