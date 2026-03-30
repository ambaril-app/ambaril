"use client";

import { useState, useCallback } from "react";
import { ShieldAlert, ShieldCheck, Ban, AlertTriangle, ShieldX } from "lucide-react";
import { DataTable } from "@ambaril/ui/components/data-table";
import type { DataTableColumn } from "@ambaril/ui/components/data-table";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import type { StatusBadgeProps } from "@ambaril/ui/components/status-badge";
import { Badge } from "@ambaril/ui/components/badge";
import { Button } from "@ambaril/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@ambaril/ui/components/card";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { ResolveFlagModal } from "./components/resolve-flag-modal";
import { listFlags } from "@/app/actions/creators/anti-fraud";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SalesAttribution extends Record<string, unknown> {
  id: string;
  creatorId: string;
  orderId: string;
  orderTotal: string;
  status: string;
  createdAt: Date | string;
  buyerCpfHash: string | null;
}

interface FlaggedAttribution {
  attribution: SalesAttribution;
  flagReasons: string[];
}

interface AntiFraudClientProps {
  initialFlags: FlaggedAttribution[];
  initialTotal: number;
}

// ---------------------------------------------------------------------------
// Status map
// ---------------------------------------------------------------------------

const ATTRIBUTION_STATUS_MAP: StatusBadgeProps["statusMap"] = {
  pending: { label: "Pendente", variant: "warning" },
  confirmed: { label: "Confirmada", variant: "success" },
  adjusted: { label: "Ajustada", variant: "info" },
  cancelled: { label: "Cancelada", variant: "danger" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateValue: Date | string | null): string {
  if (!dateValue) return "-";
  const d = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value: string): string {
  const num = parseFloat(value || "0");
  return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function classifyFlags(reasons: string[]): { hasSelfPurchase: boolean; hasCapExceeded: boolean } {
  return {
    hasSelfPurchase: reasons.some((r) => r.toLowerCase().includes("auto-compra")),
    hasCapExceeded: reasons.some((r) => r.toLowerCase().includes("limite")),
  };
}

// ---------------------------------------------------------------------------
// Row type for DataTable
// ---------------------------------------------------------------------------

interface FlagRow extends Record<string, unknown> {
  id: string;
  creatorId: string;
  flagType: string;
  date: string;
  details: string;
  status: string;
  orderTotal: string;
  attributionId: string;
}

function flagsToRows(flags: FlaggedAttribution[]): FlagRow[] {
  return flags.map((f) => {
    const { hasSelfPurchase, hasCapExceeded } = classifyFlags(f.flagReasons);
    let flagType = "Desconhecido";
    if (hasSelfPurchase && hasCapExceeded) flagType = "Auto-compra + Limite";
    else if (hasSelfPurchase) flagType = "Auto-compra";
    else if (hasCapExceeded) flagType = "Limite excedido";

    return {
      id: f.attribution.id,
      creatorId: f.attribution.creatorId,
      flagType,
      date: formatDate(f.attribution.createdAt),
      details: f.flagReasons.join("; "),
      status: f.attribution.status,
      orderTotal: f.attribution.orderTotal,
      attributionId: f.attribution.id,
    };
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AntiFraudClient({ initialFlags, initialTotal }: AntiFraudClientProps) {
  const [flags, setFlags] = useState<FlaggedAttribution[]>(initialFlags);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAttributionId, setSelectedAttributionId] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<"suspend" | "clear">("suspend");

  // --- Stats ---
  const selfPurchaseCount = flags.filter((f) =>
    f.flagReasons.some((r) => r.toLowerCase().includes("auto-compra")),
  ).length;
  const capExceededCount = flags.filter((f) =>
    f.flagReasons.some((r) => r.toLowerCase().includes("limite")),
  ).length;

  const handlePageChange = useCallback(async (newPage: number) => {
    setIsLoading(true);
    const result = await listFlags({ page: newPage, per_page: 25, sort_order: "desc" });
    if (result.data) {
      setFlags(result.data.items as unknown as FlaggedAttribution[]);
      setTotal(result.data.total);
      setPage(newPage);
    }
    setIsLoading(false);
  }, []);

  const openModal = useCallback((attributionId: string, action: "suspend" | "clear") => {
    setSelectedAttributionId(attributionId);
    setModalAction(action);
    setModalOpen(true);
  }, []);

  const rows = flagsToRows(flags);

  const columns: DataTableColumn<FlagRow>[] = [
    {
      key: "flagType",
      label: "Tipo",
      render: (value) => {
        const typeStr = String(value);
        const variant = typeStr.includes("Auto-compra") ? "danger" : "warning";
        return <Badge variant={variant}>{typeStr}</Badge>;
      },
    },
    {
      key: "creatorId",
      label: "Creator",
      render: (value) => (
        <span className="font-mono text-xs text-text-secondary">
          {String(value).substring(0, 8)}...
        </span>
      ),
    },
    {
      key: "date",
      label: "Data",
      render: (value) => (
        <span className="text-text-secondary">{String(value)}</span>
      ),
    },
    {
      key: "details",
      label: "Detalhes",
      render: (value) => (
        <span className="max-w-[250px] truncate text-sm text-text-primary">
          {String(value)}
        </span>
      ),
    },
    {
      key: "orderTotal",
      label: "Valor Pedido",
      render: (value) => (
        <span className="font-mono text-text-primary">
          {formatCurrency(String(value))}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <StatusBadge
          status={String(value)}
          statusMap={ATTRIBUTION_STATUS_MAP}
        />
      ),
    },
    {
      key: "actions",
      label: "Acoes",
      render: (_value, row) => (
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onPress={() => openModal(row.attributionId, "suspend")}
          >
            <Ban className="mr-1 h-3.5 w-3.5" />
            Suspender
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() => openModal(row.attributionId, "clear")}
          >
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            Liberar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-lg font-medium text-text-bright">Monitor Anti-Fraude</h1>
        <p className="text-sm text-text-secondary">
          Flags de auto-compra e limite mensal excedido
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <CardTitle className="text-xs text-text-secondary">Total de Flags</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <span className="font-mono text-2xl font-medium text-text-bright">
              {total}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldX className="h-4 w-4 text-danger" />
              <CardTitle className="text-xs text-text-secondary">Auto-compra</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <span className="font-mono text-2xl font-medium text-danger">
              {selfPurchaseCount}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-warning" />
              <CardTitle className="text-xs text-text-secondary">Limite Excedido</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <span className="font-mono text-2xl font-medium text-warning">
              {capExceededCount}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Flags table */}
      {rows.length === 0 && !isLoading ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhuma flag detectada"
          description="Tudo limpo! Nenhuma atividade suspeita encontrada."
        />
      ) : (
        <DataTable<FlagRow>
          columns={columns}
          data={rows}
          isLoading={isLoading}
          pagination={{
            page,
            pageSize: 25,
            total,
            onPageChange: handlePageChange,
          }}
        />
      )}

      {/* Resolve modal */}
      <ResolveFlagModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        attributionId={selectedAttributionId}
        action={modalAction}
      />
    </>
  );
}
