"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@ambaril/ui/components/data-table";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { Badge } from "@ambaril/ui/components/badge";
import { Button } from "@ambaril/ui/components/button";
import { Modal } from "@ambaril/ui/components/modal";
import { FormTextarea } from "@ambaril/ui/components/form-textarea";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { ShieldAlert, CheckCircle, Ban } from "lucide-react";
import { listFlags, resolveFlag } from "@/app/actions/creators/anti-fraud";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AntiFraudTabProps {
  creatorId: string;
}

interface FlaggedItem {
  attribution: Record<string, unknown>;
  flagReasons: string[];
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

function buildColumns(onResolve: (id: string) => void): DataTableColumn<Record<string, unknown>>[] {
  return [
    {
      key: "attribution",
      label: "Pedido",
      render: (value) => {
        const attr = value as Record<string, unknown>;
        const orderId = attr["orderId"] as string;
        return (
          <span className="font-mono text-xs text-text-ghost">
            {orderId.slice(0, 8)}...
          </span>
        );
      },
    },
    {
      key: "attribution",
      label: "Valor",
      render: (value) => {
        const attr = value as Record<string, unknown>;
        return (
          <span className="font-mono text-sm">
            R$ {Number(attr["orderTotal"]).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      key: "flagReasons",
      label: "Flags",
      render: (value) => {
        const reasons = value as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {reasons.map((r, i) => (
              <Badge key={i} variant="danger">
                {r}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "attribution",
      label: "Status",
      render: (value) => {
        const attr = value as Record<string, unknown>;
        return <StatusBadge status={attr["status"] as string} />;
      },
    },
    {
      key: "id",
      label: "Acoes",
      render: (_value, row) => {
        const attr = row["attribution"] as Record<string, unknown>;
        const id = attr["id"] as string;
        const status = attr["status"] as string;
        if (status !== "pending") return <span className="text-text-ghost">-</span>;
        return (
          <Button variant="outline" size="sm" onPress={() => onResolve(id)}>
            Resolver
          </Button>
        );
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function AntiFraudTab({ creatorId }: AntiFraudTabProps) {
  const router = useRouter();
  const [data, setData] = React.useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  // Resolve modal state
  const [resolveId, setResolveId] = React.useState<string | null>(null);
  const [resolveAction, setResolveAction] = React.useState<"suspend" | "clear">("clear");
  const [resolveReason, setResolveReason] = React.useState("");
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchFlags = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listFlags({ page, per_page: 15, sort_order: "desc" });
      if (result.data) {
        setData(result.data.items as unknown as Record<string, unknown>[]);
        setTotal(result.data.total);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  React.useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  async function handleResolve() {
    if (!resolveId || resolveReason.trim().length < 10) return;
    setProcessing(true);
    setError(null);

    const result = await resolveFlag(resolveId, {
      action: resolveAction,
      reason: resolveReason.trim(),
    });

    setProcessing(false);

    if (result.error) {
      setError(result.error);
    } else {
      setResolveId(null);
      setResolveReason("");
      setResolveAction("clear");
      fetchFlags();
      router.refresh();
    }
  }

  const columns = React.useMemo(() => buildColumns(setResolveId), []);

  return (
    <>
      <DataTable
        columns={columns}
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
            icon={ShieldAlert}
            title="Nenhuma flag de fraude"
            description="Quando transações suspeitas forem detectadas, elas aparecerão aqui."
          />
        }
      />

      {/* Resolve modal */}
      <Modal
        isOpen={resolveId !== null}
        onClose={() => {
          setResolveId(null);
          setResolveReason("");
          setError(null);
        }}
        title="Resolver Flag"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-ghost">
            Escolha uma ação para resolver esta flag de fraude.
          </p>

          <div className="flex gap-2">
            <Button
              variant={resolveAction === "clear" ? "default" : "ghost"}
              size="sm"
              onPress={() => setResolveAction("clear")}
            >
              <CheckCircle className="mr-1 h-3.5 w-3.5" />
              Liberar
            </Button>
            <Button
              variant={resolveAction === "suspend" ? "destructive" : "ghost"}
              size="sm"
              onPress={() => setResolveAction("suspend")}
            >
              <Ban className="mr-1 h-3.5 w-3.5" />
              Suspender
            </Button>
          </div>

          <FormTextarea
            label="Motivo (minimo 10 caracteres)"
            placeholder="Descreva o motivo da resolucao..."
            value={resolveReason}
            onChange={(e) => setResolveReason(e.target.value)}
            required
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onPress={() => {
                setResolveId(null);
                setResolveReason("");
                setError(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant={resolveAction === "suspend" ? "destructive" : "default"}
              onPress={handleResolve}
              disabled={processing || resolveReason.trim().length < 10}
            >
              {processing ? "Processando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export { AntiFraudTab };
