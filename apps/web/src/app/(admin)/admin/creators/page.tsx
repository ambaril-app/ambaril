import Link from "next/link";
import { getTenantSession } from "@/lib/tenant";
import { listCreators } from "@/app/actions/creators/crud";
import { listTiers } from "@/app/actions/creators/tiers";
import { Plus, Download } from "lucide-react";
import { Button } from "@ambaril/ui/components/button";
import { db } from "@ambaril/db";
import { eq, and } from "drizzle-orm";
import { moduleSetupState } from "@ambaril/db/schema";
import { CreatorsTable } from "./components/creators-table";
import type { CreatorStats } from "./components/creator-summary-cards";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeStats(
  allResult: Awaited<ReturnType<typeof listCreators>>,
): CreatorStats {
  const creators = allResult.data?.creators ?? [];
  let active = 0;
  let pending = 0;
  let suspended = 0;

  for (const c of creators) {
    if (c.status === "active") active++;
    else if (c.status === "pending") pending++;
    else if (c.status === "suspended") suspended++;
  }

  return {
    total: allResult.data?.total ?? 0,
    active,
    pending,
    suspended,
  };
}

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function CreatorsPage() {
  const session = await getTenantSession();

  // Check setup state
  const [setupRow] = await db
    .select({ isSetupComplete: moduleSetupState.isSetupComplete })
    .from(moduleSetupState)
    .where(
      and(
        eq(moduleSetupState.tenantId, session.tenantId),
        eq(moduleSetupState.moduleId, "creators"),
      ),
    )
    .limit(1);

  const isSetupComplete = setupRow?.isSetupComplete ?? false;

  // Fetch initial data in parallel
  const [creatorsResult, tiersResult] = await Promise.all([
    listCreators({ page: 1, per_page: 25 }),
    listTiers(),
  ]);

  // Compute summary stats from initial fetch
  // For accurate stats, fetch all statuses separately
  const [pendingResult, activeResult, suspendedResult] = await Promise.all([
    listCreators({ page: 1, per_page: 1, status: "pending" }),
    listCreators({ page: 1, per_page: 1, status: "active" }),
    listCreators({ page: 1, per_page: 1, status: "suspended" }),
  ]);

  const stats: CreatorStats = {
    total: creatorsResult.data?.total ?? 0,
    active: activeResult.data?.total ?? 0,
    pending: pendingResult.data?.total ?? 0,
    suspended: suspendedResult.data?.total ?? 0,
  };

  const tiers = (tiersResult.data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
  }));

  const initialData = creatorsResult.data ?? {
    creators: [],
    total: 0,
    page: 1,
    pageSize: 25,
  };

  return (
    <div className="space-y-6">
      {/* Setup banner */}
      {!isSetupComplete && (
        <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning-muted px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text-bright">Configuração pendente</p>
            <p className="text-xs text-text-ghost">
              Configure as integrações e importe dados existentes para ativar o programa.
            </p>
          </div>
          <Button size="sm" asChild>
            <Link href="/admin/creators/setup">
              Configurar
            </Link>
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[32px] font-medium leading-tight tracking-[-0.02em] text-text-bright">Creators</h1>
          <p className="mt-1 text-sm text-text-ghost">
            Gerencie os creators e seus perfis, vendas e comissões.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSetupComplete && stats.total > 0 && (
            <Button variant="secondary" asChild>
              <Link href="/admin/creators/setup?step=import-coupons">
                <Download className="h-4 w-4" />
                Importar cupons
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/admin/creators/new">
              <Plus className="h-4 w-4" />
              Novo Creator
            </Link>
          </Button>
        </div>
      </div>

      {/* Client-side interactive table */}
      <CreatorsTable
        initialData={initialData}
        tiers={tiers}
        stats={stats}
      />
    </div>
  );
}
