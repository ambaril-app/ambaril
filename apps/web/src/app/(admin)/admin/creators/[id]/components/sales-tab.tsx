"use client";

import * as React from "react";
import { DataTable, type DataTableColumn } from "@ambaril/ui/components/data-table";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { ShoppingBag } from "lucide-react";
import { listSalesForCreator } from "@/app/actions/creators/sales";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SalesTabProps {
  creatorId: string;
}

// ---------------------------------------------------------------------------
// Status map for sales
// ---------------------------------------------------------------------------

const SALES_STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }> = {
  pending: { label: "Pendente", variant: "warning" },
  confirmed: { label: "Confirmada", variant: "success" },
  adjusted: { label: "Ajustada", variant: "info" },
  cancelled: { label: "Cancelada", variant: "danger" },
};

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const COLUMNS: DataTableColumn<Record<string, unknown>>[] = [
  {
    key: "orderId",
    label: "Pedido",
    render: (value) => (
      <span className="font-mono text-xs text-text-ghost">{(value as string).slice(0, 8)}...</span>
    ),
  },
  {
    key: "orderTotal",
    label: "Total do Pedido",
    render: (value) => (
      <span className="font-mono text-sm">
        R$ {Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: "commissionAmount",
    label: "Comissao",
    render: (value) => (
      <span className="font-mono text-sm text-success">
        R$ {Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (value) => <StatusBadge status={value as string} statusMap={SALES_STATUS_MAP} />,
  },
  {
    key: "createdAt",
    label: "Data",
    render: (value) => {
      const date = value instanceof Date ? value : new Date(value as string);
      return (
        <span className="text-xs text-text-ghost">
          {date.toLocaleDateString("pt-BR")}
        </span>
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function SalesTab({ creatorId }: SalesTabProps) {
  const [data, setData] = React.useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchSales = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listSalesForCreator(creatorId, { page, per_page: 15, sort_order: "desc" });
      if (result.data) {
        setData(result.data.items as unknown as Record<string, unknown>[]);
        setTotal(result.data.total);
      }
    } finally {
      setIsLoading(false);
    }
  }, [creatorId, page]);

  React.useEffect(() => {
    fetchSales();
  }, [fetchSales]);

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
          icon={ShoppingBag}
          title="Nenhuma venda registrada"
          description="As vendas aparecerão aqui conforme forem atribuídas via cupom."
        />
      }
    />
  );
}

export { SalesTab };
