"use client";

import * as React from "react";
import { DataTable, type DataTableColumn } from "@ambaril/ui/components/data-table";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { Wallet } from "lucide-react";
import { BalanceCard } from "./components/balance-card";
import { PaymentPreferenceForm } from "./components/payment-preference-form";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PayoutRow {
  id: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: string;
  irrfWithheld: string;
  issWithheld: string;
  netAmount: string;
  paymentMethod: string;
  status: string;
  paidAt: string | null;
}

interface EarningsPageClientProps {
  creatorId: string;
  grossTotal: string;
  irrfTotal: string;
  issTotal: string;
  netTotal: string;
  currentMethod: "pix" | "store_credit" | "product" | null;
  currentPixKey: string | null;
  initialPayouts: PayoutRow[];
  totalPayouts: number;
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

function formatPeriod(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return `${s.toLocaleDateString("pt-BR")} - ${e.toLocaleDateString("pt-BR")}`;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "PIX",
  store_credit: "Credito",
  product: "Produto",
};

// ---------------------------------------------------------------------------
// Status map
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

function buildColumns(): DataTableColumn<Record<string, unknown>>[] {
  return [
    {
      key: "period",
      label: "Periodo",
      render: (_value, row) => (
        <span className="text-xs text-text-secondary">
          {formatPeriod(row["periodStart"] as string, row["periodEnd"] as string)}
        </span>
      ),
    },
    {
      key: "grossAmount",
      label: "Bruto (R$)",
      render: (value) => (
        <span className="font-['DM_Mono',monospace] text-sm text-text-primary">
          R$ {formatCurrency(value as string)}
        </span>
      ),
    },
    {
      key: "irrfWithheld",
      label: "IRRF",
      render: (value) => (
        <span className="font-['DM_Mono',monospace] text-sm text-text-secondary">
          R$ {formatCurrency(value as string)}
        </span>
      ),
    },
    {
      key: "issWithheld",
      label: "ISS",
      render: (value) => (
        <span className="font-['DM_Mono',monospace] text-sm text-text-secondary">
          R$ {formatCurrency(value as string)}
        </span>
      ),
    },
    {
      key: "netAmount",
      label: "Liquido (R$)",
      render: (value) => (
        <span className="font-['DM_Mono',monospace] text-sm font-medium text-success">
          R$ {formatCurrency(value as string)}
        </span>
      ),
    },
    {
      key: "paymentMethod",
      label: "Metodo",
      render: (value) => (
        <span className="text-xs text-text-secondary">
          {PAYMENT_METHOD_LABELS[value as string] ?? (value as string)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <StatusBadge status={value as string} statusMap={PAYOUT_STATUS_MAP} />
      ),
    },
    {
      key: "paidAt",
      label: "Pago em",
      render: (value) => {
        const v = value as string | null;
        if (!v) return <span className="text-text-ghost">-</span>;
        const date = new Date(v);
        return (
          <span className="text-xs text-text-secondary">
            {date.toLocaleDateString("pt-BR")}
          </span>
        );
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function EarningsPageClient({
  creatorId,
  grossTotal,
  irrfTotal,
  issTotal,
  netTotal,
  currentMethod,
  currentPixKey,
  initialPayouts,
  totalPayouts,
}: EarningsPageClientProps) {
  const [page, setPage] = React.useState(1);
  const columns = React.useMemo(() => buildColumns(), []);

  const tableData = React.useMemo(
    () =>
      initialPayouts.map((p) => ({
        id: p.id,
        period: `${p.periodStart} - ${p.periodEnd}`,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        grossAmount: p.grossAmount,
        irrfWithheld: p.irrfWithheld,
        issWithheld: p.issWithheld,
        netAmount: p.netAmount,
        paymentMethod: p.paymentMethod,
        status: p.status,
        paidAt: p.paidAt,
      })) as Record<string, unknown>[],
    [initialPayouts],
  );

  return (
    <div className="space-y-6">
      {/* Balance summary */}
      <BalanceCard
        grossAmount={grossTotal}
        irrfWithheld={irrfTotal}
        issWithheld={issTotal}
        netAmount={netTotal}
      />

      {/* Payment preference */}
      <PaymentPreferenceForm
        creatorId={creatorId}
        currentMethod={currentMethod}
        currentPixKey={currentPixKey}
      />

      {/* Payout history */}
      <div className="space-y-3">
        <h2 className="text-base font-medium text-text-bright">
          Historico de Pagamentos
        </h2>
        <DataTable
          columns={columns}
          data={tableData}
          pagination={{
            page,
            pageSize: 25,
            total: totalPayouts,
            onPageChange: setPage,
          }}
          emptyState={
            <EmptyState
              icon={Wallet}
              title="Nenhum ganho registrado"
              description="Seus ganhos aparecerao quando vendas forem confirmadas."
            />
          }
        />
      </div>
    </div>
  );
}

export { EarningsPageClient };
