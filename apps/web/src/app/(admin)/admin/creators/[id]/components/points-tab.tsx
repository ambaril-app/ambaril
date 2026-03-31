"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@ambaril/ui/components/card";
import { DataTable, type DataTableColumn } from "@ambaril/ui/components/data-table";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { Star } from "lucide-react";
import { getPointsLedger, getPointsBalance } from "@/app/actions/creators/points";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PointsTabProps {
  creatorId: string;
}

// ---------------------------------------------------------------------------
// Action type labels
// ---------------------------------------------------------------------------

const ACTION_TYPE_LABELS: Record<string, string> = {
  sale: "Venda",
  post_detected: "Post detectado",
  challenge_completed: "Desafio completado",
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

const COLUMNS: DataTableColumn<Record<string, unknown>>[] = [
  {
    key: "actionType",
    label: "Tipo",
    render: (value) => (
      <span className="text-sm text-text-primary">
        {ACTION_TYPE_LABELS[value as string] ?? (value as string)}
      </span>
    ),
  },
  {
    key: "points",
    label: "Pontos",
    render: (value) => {
      const pts = Number(value);
      const isPositive = pts > 0;
      return (
        <span className={`font-mono text-sm ${isPositive ? "text-success" : "text-danger"}`}>
          {isPositive ? "+" : ""}{pts}
        </span>
      );
    },
  },
  {
    key: "description",
    label: "Descricao",
    render: (value) => (
      <span className="text-sm text-text-ghost">{value as string}</span>
    ),
  },
  {
    key: "createdAt",
    label: "Data",
    render: (value) => {
      const date = value instanceof Date ? value : new Date(value as string);
      return (
        <span className="text-xs text-text-ghost">
          {date.toLocaleDateString("pt-BR")} {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function PointsTab({ creatorId }: PointsTabProps) {
  const [data, setData] = React.useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [balance, setBalance] = React.useState<{ total: number; thisMonth: number } | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [ledgerResult, balanceResult] = await Promise.all([
        getPointsLedger(creatorId, { page, per_page: 15, sort_order: "desc" }),
        page === 1 ? getPointsBalance(creatorId) : Promise.resolve(null),
      ]);

      if (ledgerResult.data) {
        setData(ledgerResult.data.items as unknown as Record<string, unknown>[]);
        setTotal(ledgerResult.data.total);
      }
      if (balanceResult && "data" in balanceResult && balanceResult.data) {
        setBalance(balanceResult.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [creatorId, page]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Balance cards */}
      {balance && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-ghost">
                Saldo Total
              </span>
            </CardHeader>
            <CardContent>
              <span className="font-display text-2xl font-semibold text-text-bright">
                {balance.total.toLocaleString("pt-BR")}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-ghost">
                Pontos este mês
              </span>
            </CardHeader>
            <CardContent>
              <span className="font-display text-2xl font-semibold text-success">
                +{balance.thisMonth.toLocaleString("pt-BR")}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ledger table */}
      <DataTable
        columns={COLUMNS}
        data={data}
        isLoading={isLoading}
        pagination={{
          page,
          pageSize: 15,
          total,
          onPageChange: setPage,
        }}
        emptyState={
          <EmptyState
            icon={Star}
            title="Nenhum registro de pontos"
            description="O histórico de pontos aparecerá aqui conforme forem atribuídos."
          />
        }
      />
    </div>
  );
}

export { PointsTab };
