"use client";

import { useState, useCallback, useTransition } from "react";
import { DataTable } from "@ambaril/ui/components/data-table";
import type { DataTableColumn } from "@ambaril/ui/components/data-table";
import { Button } from "@ambaril/ui/components/button";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { FormSelect } from "@ambaril/ui/components/form-select";
import {
  Calculator,
  CheckCircle,
  CreditCard,
  Play,
  DollarSign,
} from "lucide-react";
import {
  listPayouts,
  calculatePayouts,
  approvePayout,
  processPayout,
  markPaid,
  setPayoutMethod,
} from "@/app/actions/creators/payouts";
import { CalculatePayoutsModal } from "./components/calculate-payouts-modal";
import { PayoutMethodSheet } from "./components/payout-method-sheet";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PayoutRow {
  id: string;
  tenantId: string;
  creatorId: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: string;
  irrfWithheld: string;
  issWithheld: string;
  netAmount: string;
  fiscalDocType: string;
  fiscalDocId: string | null;
  fiscalDocVerified: boolean;
  paymentMethod: string;
  status: string;
  pixKey: string | null;
  pixKeyType: string | null;
  pixTransactionId: string | null;
  storeCreditCode: string | null;
  storeCreditAmount: string | null;
  productItems: unknown;
  productTotalCost: string | null;
  paidAt: Date | null;
  failureReason: string | null;
  deductions: unknown;
  createdAt: Date;
  updatedAt: Date;
}

type PayoutTableRow = PayoutRow & Record<string, unknown>;

interface PayoutsClientProps {
  initialPayouts: PayoutRow[];
  initialTotal: number;
  initialError?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAYOUT_STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }> = {
  calculating: { label: "Calculando", variant: "info" },
  pending: { label: "Pendente", variant: "warning" },
  processing: { label: "Processando", variant: "info" },
  paid: { label: "Pago", variant: "success" },
  failed: { label: "Falhou", variant: "danger" },
};

const FISCAL_DOC_LABELS: Record<string, string> = {
  rpa: "RPA",
  nfse: "NFS-e",
  none: "-",
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Todos os Status" },
  { value: "calculating", label: "Calculando" },
  { value: "pending", label: "Pendente" },
  { value: "processing", label: "Processando" },
  { value: "paid", label: "Pago" },
  { value: "failed", label: "Falhou" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PayoutsClient({ initialPayouts, initialTotal, initialError }: PayoutsClientProps) {
  const [payouts, setPayouts] = useState<PayoutRow[]>(initialPayouts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | undefined>(initialError);
  const [isPending, startTransition] = useTransition();

  // Modals
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [isMethodSheetOpen, setIsMethodSheetOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Selection
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const refreshPayouts = useCallback(
    (newPage?: number, newStatus?: string) => {
      const p = newPage ?? page;
      const s = newStatus ?? statusFilter;

      startTransition(async () => {
        const input: Record<string, unknown> = { page: p, per_page: 25, sort_order: "desc" };
        if (s !== "all") input.status = s;

        const result = await listPayouts(input as Parameters<typeof listPayouts>[0]);
        if (result.data) {
          setPayouts(result.data.items as unknown as PayoutRow[]);
          setTotal(result.data.total);
          setError(undefined);
        } else {
          setError(result.error);
        }
      });
    },
    [page, statusFilter],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      refreshPayouts(newPage);
    },
    [refreshPayouts],
  );

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      setStatusFilter(value);
      setPage(1);
      refreshPayouts(1, value);
    },
    [refreshPayouts],
  );

  const handleCalculate = useCallback(
    async (periodStart: string, periodEnd: string) => {
      const result = await calculatePayouts({ periodStart, periodEnd });
      if (result.error) return { error: result.error };
      refreshPayouts();
      return { data: result.data };
    },
    [refreshPayouts],
  );

  const handleApprove = useCallback(
    (payoutId: string) => {
      startTransition(async () => {
        const result = await approvePayout(payoutId);
        if (result.error) {
          setError(result.error);
        } else {
          refreshPayouts();
        }
      });
    },
    [refreshPayouts],
  );

  const handleProcess = useCallback(
    (payoutId: string) => {
      startTransition(async () => {
        const result = await processPayout(payoutId);
        if (result.error) {
          setError(result.error);
        } else {
          refreshPayouts();
        }
      });
    },
    [refreshPayouts],
  );

  const handleMarkPaid = useCallback(
    (payoutId: string) => {
      startTransition(async () => {
        const result = await markPaid(payoutId);
        if (result.error) {
          setError(result.error);
        } else {
          refreshPayouts();
        }
      });
    },
    [refreshPayouts],
  );

  const handleBulkApprove = useCallback(() => {
    startTransition(async () => {
      const ids = Array.from(selectedKeys);
      const errors: string[] = [];
      for (const id of ids) {
        const result = await approvePayout(id);
        if (result.error) errors.push(result.error);
      }
      if (errors.length > 0) {
        setError(`${errors.length} erro(s): ${errors[0]}`);
      }
      setSelectedKeys(new Set());
      refreshPayouts();
    });
  }, [selectedKeys, refreshPayouts]);

  const handleOpenMethodSheet = useCallback((creatorId: string) => {
    setSelectedCreator({ id: creatorId, name: creatorId });
    setIsMethodSheetOpen(true);
  }, []);

  const handleSetMethod = useCallback(
    async (
      creatorId: string,
      data: {
        paymentMethod: string;
        pixKey?: string;
        storeCreditAmount?: string;
        productItems?: { productId: string; quantity: number }[];
      },
    ) => {
      const result = await setPayoutMethod(creatorId, {
        paymentMethod: data.paymentMethod as "pix" | "store_credit" | "product",
        pixKey: data.pixKey,
        storeCreditAmount: data.storeCreditAmount,
        productItems: data.productItems,
      });
      if (result.error) return { error: result.error };
      refreshPayouts();
      return {};
    },
    [refreshPayouts],
  );

  const columns: DataTableColumn<PayoutTableRow>[] = [
    {
      key: "creatorId",
      label: "Creator",
      render: (_value, row) => (
        <span className="max-w-[120px] truncate text-sm text-text-primary">
          {(row.creatorId as string).slice(0, 8)}...
        </span>
      ),
    },
    {
      key: "periodStart",
      label: "Período",
      render: (_value, row) => (
        <span className="text-sm text-text-ghost">
          {row.periodStart as string} - {row.periodEnd as string}
        </span>
      ),
    },
    {
      key: "grossAmount",
      label: "Bruto (R$)",
      render: (_value, row) => (
        <span className="font-mono text-sm text-text-primary">
          R$ {row.grossAmount as string}
        </span>
      ),
    },
    {
      key: "irrfWithheld",
      label: "IRRF (R$)",
      render: (_value, row) => (
        <span className="font-mono text-sm text-text-ghost">
          R$ {row.irrfWithheld as string}
        </span>
      ),
    },
    {
      key: "issWithheld",
      label: "ISS (R$)",
      render: (_value, row) => (
        <span className="font-mono text-sm text-text-ghost">
          R$ {row.issWithheld as string}
        </span>
      ),
    },
    {
      key: "netAmount",
      label: "Líquido (R$)",
      render: (_value, row) => (
        <span className="font-mono text-sm font-medium text-text-bright">
          R$ {row.netAmount as string}
        </span>
      ),
    },
    {
      key: "fiscalDocType",
      label: "Doc. Fiscal",
      render: (_value, row) => (
        <span className="text-sm text-text-ghost">
          {FISCAL_DOC_LABELS[row.fiscalDocType as string] ?? row.fiscalDocType}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_value, row) => (
        <StatusBadge status={row.status as string} statusMap={PAYOUT_STATUS_MAP} />
      ),
    },
    {
      key: "actions",
      label: "Ações",
      render: (_value, row) => {
        const status = row.status as string;
        return (
          <div className="flex items-center gap-1">
            {status === "pending" && (
              <Button
                variant="ghost"
                size="sm"
                onPress={() => handleApprove(row.id as string)}
                disabled={isPending}
                aria-label="Aprovar pagamento"
              >
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Aprovar
              </Button>
            )}
            {status === "processing" && (
              <Button
                variant="ghost"
                size="sm"
                onPress={() => handleProcess(row.id as string)}
                disabled={isPending}
                aria-label="Processar pagamento"
              >
                <Play className="mr-1 h-3.5 w-3.5" />
                Processar
              </Button>
            )}
            {(status === "pending" || status === "processing") && (
              <Button
                variant="ghost"
                size="sm"
                onPress={() => handleMarkPaid(row.id as string)}
                disabled={isPending}
                aria-label="Marcar como pago"
              >
                <DollarSign className="mr-1 h-3.5 w-3.5" />
                Pago
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onPress={() => handleOpenMethodSheet(row.creatorId as string)}
              aria-label="Método de pagamento"
            >
              <CreditCard className="mr-1 h-3.5 w-3.5" />
              Método
            </Button>
          </div>
        );
      },
    },
  ];

  const tableData: PayoutTableRow[] = payouts.map((p) => ({ ...p }));

  const pendingCount = Array.from(selectedKeys).filter((id) =>
    payouts.find((p) => p.id === id && p.status === "pending"),
  ).length;

  return (
    <>
      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FormSelect
            label="Status"
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="w-48"
          />

          {pendingCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onPress={handleBulkApprove}
              disabled={isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprovar Selecionados ({pendingCount})
            </Button>
          )}
        </div>

        <Button onPress={() => setIsCalcModalOpen(true)}>
          <Calculator className="mr-2 h-4 w-4" />
          Calcular Pagamentos
        </Button>
      </div>

      {payouts.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Nenhum pagamento encontrado"
          description="Calcule os pagamentos do período para gerar registros"
          action={{
            label: "Calcular Pagamentos",
            onPress: () => setIsCalcModalOpen(true),
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={tableData}
          isLoading={isPending}
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          pagination={{
            page,
            pageSize: 25,
            total,
            onPageChange: handlePageChange,
          }}
        />
      )}

      <CalculatePayoutsModal
        isOpen={isCalcModalOpen}
        onClose={() => {
          setIsCalcModalOpen(false);
          refreshPayouts();
        }}
        onCalculate={handleCalculate}
      />

      {selectedCreator && (
        <PayoutMethodSheet
          isOpen={isMethodSheetOpen}
          onClose={() => {
            setIsMethodSheetOpen(false);
            setSelectedCreator(null);
          }}
          creatorId={selectedCreator.id}
          creatorName={selectedCreator.name}
          onSubmit={handleSetMethod}
        />
      )}
    </>
  );
}
