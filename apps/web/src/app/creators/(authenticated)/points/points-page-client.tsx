"use client";

import * as React from "react";
import { DataTable, type DataTableColumn } from "@ambaril/ui/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@ambaril/ui/components/card";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { Star } from "lucide-react";
import { getPointsLedger } from "@/app/actions/creators/points";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LedgerRow {
  id: string;
  createdAt: string;
  actionType: string;
  description: string | null;
  points: number;
}

interface PointsPageClientProps {
  creatorId: string;
  totalPoints: number;
  thisMonthPoints: number;
  initialLedger: LedgerRow[];
  totalLedgerItems: number;
}

// ---------------------------------------------------------------------------
// Action type translations
// ---------------------------------------------------------------------------

const ACTION_TYPE_LABELS: Record<string, string> = {
  sale: "Venda confirmada",
  post_detected: "Post detectado",
  challenge_completed: "Desafio concluido",
  referral: "Indicacao",
  engagement: "Engajamento",
  manual_adjustment: "Ajuste manual",
  tier_bonus: "Bonus de tier",
  hashtag_detected: "Hashtag detectada",
  creator_of_month: "Creator do mes",
  product_redemption: "Resgate de produto",
};

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

function buildColumns(): DataTableColumn<Record<string, unknown>>[] {
  return [
    {
      key: "createdAt",
      label: "Data",
      render: (value) => {
        const date = new Date(value as string);
        return (
          <span className="text-xs text-text-secondary">
            {date.toLocaleDateString("pt-BR")}
          </span>
        );
      },
    },
    {
      key: "actionType",
      label: "Acao",
      render: (value) => (
        <span className="text-sm text-text-primary">
          {ACTION_TYPE_LABELS[value as string] ?? (value as string)}
        </span>
      ),
    },
    {
      key: "description",
      label: "Descricao",
      render: (value) => (
        <span className="text-sm text-text-secondary">
          {(value as string | null) ?? "-"}
        </span>
      ),
    },
    {
      key: "points",
      label: "Pontos",
      render: (value) => {
        const pts = value as number;
        const isPositive = pts > 0;
        return (
          <span
            className={`font-['DM_Mono',monospace] text-sm font-medium ${
              isPositive ? "text-success" : "text-danger"
            }`}
          >
            {isPositive ? `+${pts}` : pts}
          </span>
        );
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function PointsPageClient({
  creatorId,
  totalPoints,
  thisMonthPoints,
  initialLedger,
  totalLedgerItems,
}: PointsPageClientProps) {
  const [ledger, setLedger] = React.useState(initialLedger);
  const [total, setTotal] = React.useState(totalLedgerItems);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch when page changes (skip page 1 since we have initial data)
  React.useEffect(() => {
    if (page === 1) return;

    async function fetchPage() {
      setIsLoading(true);
      try {
        const result = await getPointsLedger(creatorId, { page, per_page: 25, sort_order: "desc" });
        if (result.data) {
          setLedger(
            result.data.items.map((item) => ({
              id: item.id,
              createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
              actionType: item.actionType,
              description: item.description,
              points: item.points,
            })),
          );
          setTotal(result.data.total);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchPage();
  }, [creatorId, page]);

  const columns = React.useMemo(() => buildColumns(), []);

  const tableData = React.useMemo(
    () =>
      ledger.map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        actionType: item.actionType,
        description: item.description,
        points: item.points,
      })) as Record<string, unknown>[],
    [ledger],
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">
              Pontos totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-['DM_Mono',monospace] text-3xl font-medium text-text-bright">
              {totalPoints.toLocaleString("pt-BR")}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">
              Pontos este mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-['DM_Mono',monospace] text-3xl font-medium text-success">
              +{thisMonthPoints.toLocaleString("pt-BR")}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Ledger table */}
      <div className="space-y-3">
        <h2 className="text-base font-medium text-text-bright">
          Historico de Pontos
        </h2>
        <DataTable
          columns={columns}
          data={tableData}
          isLoading={isLoading}
          pagination={{
            page,
            pageSize: 25,
            total,
            onPageChange: setPage,
          }}
          emptyState={
            <EmptyState
              icon={Star}
              title="Sem pontos ainda"
              description="Comece a acumular pontos com desafios e vendas."
            />
          }
        />
      </div>
    </div>
  );
}

export { PointsPageClient };
