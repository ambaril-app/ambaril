import { formatBRL } from "@ambaril/shared/utils";

interface SaleRow {
  id: string;
  orderTotal: string;
  commissionAmount: string;
  status: "pending" | "confirmed" | "adjusted" | "cancelled";
  createdAt: Date;
}

interface RecentSalesProps {
  sales: SaleRow[];
}

const STATUS_LABELS: Record<SaleRow["status"], string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  adjusted: "Ajustada",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<SaleRow["status"], string> = {
  pending: "text-warning",
  confirmed: "text-success",
  adjusted: "text-info",
  cancelled: "text-danger",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function RecentSales({ sales }: RecentSalesProps) {
  if (sales.length === 0) {
    return (
      <div className="rounded-xl border border-border-default bg-bg-base p-6">
        <h3 className="text-sm font-medium uppercase tracking-[0.04em] text-text-muted">
          Vendas Recentes
        </h3>
        <p className="mt-4 text-center text-sm text-text-secondary">
          Nenhuma venda registrada ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-default bg-bg-base p-4">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.04em] text-text-muted">
        Vendas Recentes
      </h3>

      {/* Mobile: stacked cards / Desktop: table */}
      <div className="space-y-2">
        {sales.map((sale) => (
          <div
            key={sale.id}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--table-row-hover)]"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-sm tabular-nums text-text-primary">
                {formatBRL(parseFloat(sale.orderTotal))}
              </span>
              <span className="text-xs text-text-muted">
                {formatDate(sale.createdAt)}
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-mono text-sm tabular-nums text-success">
                +{formatBRL(parseFloat(sale.commissionAmount))}
              </span>
              <span className={`text-xs ${STATUS_COLORS[sale.status]}`}>
                {STATUS_LABELS[sale.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
