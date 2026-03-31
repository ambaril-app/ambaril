"use client";

import * as React from "react";
import { DataTable, type DataTableColumn } from "@ambaril/ui/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@ambaril/ui/components/card";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { ShoppingBag } from "lucide-react";
import { listSalesForCreator } from "@/app/actions/creators/sales";
import { SalesFilters, type SalesFiltersState } from "./components/sales-filters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SalesPageClientProps {
  creatorId: string;
}

interface SaleRow {
  id: string;
  createdAt: Date;
  orderId: string;
  orderTotal: string;
  discountAmount: string;
  commissionAmount: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: string | number): string {
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function truncateUuid(uuid: string): string {
  return uuid.length > 8 ? `${uuid.slice(0, 8)}...` : uuid;
}

// ---------------------------------------------------------------------------
// Status map
// ---------------------------------------------------------------------------

const SALE_STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }> = {
  pending: { label: "Pendente", variant: "warning" },
  confirmed: { label: "Confirmada", variant: "success" },
  adjusted: { label: "Ajustada", variant: "info" },
  cancelled: { label: "Cancelada", variant: "danger" },
};

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

function buildColumns(): DataTableColumn<Record<string, unknown>>[] {
  return [
    {
      key: "createdAt",
      label: "Data",
      sortable: true,
      render: (value) => {
        const date = value instanceof Date ? value : new Date(value as string);
        return (
          <span className="text-xs text-text-secondary">
            {date.toLocaleDateString("pt-BR")}
          </span>
        );
      },
    },
    {
      key: "orderId",
      label: "Pedido",
      render: (value) => (
        <span className="font-mono text-xs text-text-secondary" title={value as string}>
          {truncateUuid(value as string)}
        </span>
      ),
    },
    {
      key: "orderTotal",
      label: "Total (R$)",
      render: (value) => (
        <span className="font-['DM_Mono',monospace] text-sm text-text-primary">
          R$ {formatCurrency(value as string)}
        </span>
      ),
    },
    {
      key: "discountAmount",
      label: "Desconto (R$)",
      render: (value) => (
        <span className="font-['DM_Mono',monospace] text-sm text-text-secondary">
          R$ {formatCurrency(value as string)}
        </span>
      ),
    },
    {
      key: "commissionAmount",
      label: "Comissao (R$)",
      render: (value) => (
        <span className="font-['DM_Mono',monospace] text-sm text-text-bright">
          R$ {formatCurrency(value as string)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <StatusBadge status={value as string} statusMap={SALE_STATUS_MAP} />
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function SalesPageClient({ creatorId }: SalesPageClientProps) {
  const [data, setData] = React.useState<{
    items: SaleRow[];
    total: number;
    page: number;
    perPage: number;
  }>({ items: [], total: 0, page: 1, perPage: 25 });
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [filters, setFilters] = React.useState<SalesFiltersState>({
    status: "",
    dateFrom: "",
    dateTo: "",
  });

  // Summary stats for current month
  const [summary, setSummary] = React.useState({
    totalSales: 0,
    totalCommission: 0,
    avgTicket: 0,
  });

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const statusFilter = filters.status || undefined;
      const result = await listSalesForCreator(creatorId, {
        page,
        per_page: 25,
        sort_order: "desc",
        status: statusFilter as "pending" | "confirmed" | "adjusted" | "cancelled" | undefined,
      });

      if (result.data) {
        const items = result.data.items.map((item) => ({
          id: item.id,
          createdAt: item.createdAt,
          orderId: item.orderId,
          orderTotal: item.orderTotal,
          discountAmount: item.discountAmount,
          commissionAmount: item.commissionAmount,
          status: item.status,
        }));
        setData({
          items,
          total: result.data.total,
          page: result.data.page,
          perPage: result.data.perPage,
        });

        // Calculate summary from current page data (basic approximation)
        const monthItems = items.filter((item) => {
          const date = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
          const now = new Date();
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        });

        const totalSales = monthItems.reduce(
          (sum, item) => sum + Number(item.orderTotal),
          0,
        );
        const totalCommission = monthItems.reduce(
          (sum, item) => sum + Number(item.commissionAmount),
          0,
        );
        const avgTicket = monthItems.length > 0 ? totalSales / monthItems.length : 0;

        setSummary({ totalSales, totalCommission, avgTicket });
      }
    } finally {
      setIsLoading(false);
    }
  }, [creatorId, page, filters.status]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filters.status, filters.dateFrom, filters.dateTo]);

  const columns = React.useMemo(() => buildColumns(), []);

  const tableData = React.useMemo(
    () =>
      data.items.map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        orderId: item.orderId,
        orderTotal: item.orderTotal,
        discountAmount: item.discountAmount,
        commissionAmount: item.commissionAmount,
        status: item.status,
      })) as Record<string, unknown>[],
    [data.items],
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">
              Vendas do mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-['DM_Mono',monospace] text-2xl font-medium text-text-bright">
              R$ {formatCurrency(summary.totalSales)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">
              Comissao do mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-['DM_Mono',monospace] text-2xl font-medium text-success">
              R$ {formatCurrency(summary.totalCommission)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">
              Ticket medio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-['DM_Mono',monospace] text-2xl font-medium text-text-bright">
              R$ {formatCurrency(summary.avgTicket)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <SalesFilters filters={filters} onFiltersChange={setFilters} />

      {/* Data table */}
      <DataTable
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        pagination={{
          page: data.page,
          pageSize: data.perPage,
          total: data.total,
          onPageChange: setPage,
        }}
        emptyState={
          <EmptyState
            icon={ShoppingBag}
            title="Nenhuma venda ainda"
            description="Compartilhe seu cupom de desconto para começar a gerar vendas."
            action={{
              label: "Ver meu cupom",
              onPress: () => { window.location.href = "/creators/coupons"; },
            }}
          />
        }
      />
    </div>
  );
}

export { SalesPageClient };
