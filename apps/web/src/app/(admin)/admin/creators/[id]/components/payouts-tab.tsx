"use client";

import * as React from "react";
import { DataTable, type DataTableColumn } from "@ambaril/ui/components/data-table";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { Wallet } from "lucide-react";
import { listPayouts } from "@/app/actions/creators/payouts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PayoutsTabProps {
  creatorId: string;
}

// ---------------------------------------------------------------------------
// Status map for payouts
// ---------------------------------------------------------------------------

const PAYOUT_STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }> = {
  calculating: { label: "Calculando", variant: "default" },
  pending: { label: "Pendente", variant: "warning" },
  processing: { label: "Processando", variant: "info" },
  paid: { label: "Pago", variant: "success" },
  failed: { label: "Falhou", variant: "danger" },
};

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const COLUMNS: DataTableColumn<Record<string, unknown>>[] = [
  {
    key: "periodStart",
    label: "Periodo",
    render: (_value, row) => {
      const start = row["periodStart"] as string;
      const end = row["periodEnd"] as string;
      return (
        <span className="text-sm text-text-primary">
          {new Date(start).toLocaleDateString("pt-BR")} - {new Date(end).toLocaleDateString("pt-BR")}
        </span>
      );
    },
  },
  {
    key: "grossAmount",
    label: "Bruto",
    render: (value) => (
      <span className="font-mono text-sm">
        R$ {Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: "irrfWithheld",
    label: "IRRF",
    render: (value) => (
      <span className="font-mono text-sm text-text-secondary">
        R$ {Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: "netAmount",
    label: "Liquido",
    render: (value) => (
      <span className="font-mono text-sm text-success">
        R$ {Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (value) => <StatusBadge status={value as string} statusMap={PAYOUT_STATUS_MAP} />,
  },
  {
    key: "createdAt",
    label: "Criado em",
    render: (value) => {
      const date = value instanceof Date ? value : new Date(value as string);
      return (
        <span className="text-xs text-text-secondary">
          {date.toLocaleDateString("pt-BR")}
        </span>
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function PayoutsTab({ creatorId }: PayoutsTabProps) {
  const [data, setData] = React.useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchPayouts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listPayouts({ page, per_page: 15, creatorId, sort_order: "desc" });
      if (result.data) {
        setData(result.data.items as unknown as Record<string, unknown>[]);
        setTotal(result.data.total);
      }
    } finally {
      setIsLoading(false);
    }
  }, [creatorId, page]);

  React.useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  return (
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
          icon={Wallet}
          title="Nenhum pagamento registrado"
          description="Os pagamentos aparecerão aqui após cálculo do período."
        />
      }
    />
  );
}

export { PayoutsTab };
