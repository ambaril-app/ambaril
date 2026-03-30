"use client";

import { useState, useCallback, useTransition } from "react";
import { DataTable } from "@ambaril/ui/components/data-table";
import type { DataTableColumn } from "@ambaril/ui/components/data-table";
import { Button } from "@ambaril/ui/components/button";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { Layers, Pencil, Trash2, Plus } from "lucide-react";
import { listTiers, createTier, updateTier, deleteTier } from "@/app/actions/creators/tiers";
import { TierFormModal } from "./components/tier-form-modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TierRow {
  id: string;
  name: string;
  slug: string;
  commissionRate: string;
  minFollowers: number;
  benefits: unknown;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

type TierTableRow = TierRow & Record<string, unknown>;

interface TiersClientProps {
  initialTiers: TierRow[];
  initialError?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TiersClient({ initialTiers, initialError }: TiersClientProps) {
  const [tiers, setTiers] = useState<TierRow[]>(initialTiers);
  const [error, setError] = useState<string | undefined>(initialError);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<TierRow | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refreshTiers = useCallback(() => {
    startTransition(async () => {
      const result = await listTiers();
      if (result.data) {
        setTiers(result.data);
        setError(undefined);
      } else {
        setError(result.error);
      }
    });
  }, []);

  const handleCreate = useCallback(() => {
    setEditingTier(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((tier: TierRow) => {
    setEditingTier(tier);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingTier(null);
  }, []);

  const handleModalSubmit = useCallback(
    async (data: Record<string, unknown>): Promise<{ error?: string }> => {
      if (editingTier) {
        const result = await updateTier(editingTier.id, data);
        if (result.error) return { error: result.error };
      } else {
        const result = await createTier(data);
        if (result.error) return { error: result.error };
      }
      refreshTiers();
      return {};
    },
    [editingTier, refreshTiers],
  );

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        const result = await deleteTier(id);
        if (result.error) {
          setError(result.error);
        } else {
          setDeleteConfirmId(null);
          refreshTiers();
        }
      });
    },
    [refreshTiers],
  );

  const columns: DataTableColumn<TierTableRow>[] = [
    {
      key: "name",
      label: "Nome",
      sortable: true,
      render: (_value, row) => (
        <span className="font-medium text-text-bright">{row.name as string}</span>
      ),
    },
    {
      key: "slug",
      label: "Slug",
      render: (_value, row) => (
        <code className="rounded bg-bg-surface px-1.5 py-0.5 font-mono text-xs text-text-secondary">
          {row.slug as string}
        </code>
      ),
    },
    {
      key: "commissionRate",
      label: "Comissao (%)",
      render: (_value, row) => (
        <span className="font-mono text-sm">{row.commissionRate as string}%</span>
      ),
    },
    {
      key: "minFollowers",
      label: "Seg. Minimos",
      render: (_value, row) => (
        <span className="font-mono text-sm">
          {(row.minFollowers as number).toLocaleString("pt-BR")}
        </span>
      ),
    },
    {
      key: "benefits",
      label: "Beneficios",
      render: (_value, row) => {
        const b = row.benefits;
        if (!b || (typeof b === "object" && Object.keys(b as object).length === 0)) {
          return <span className="text-text-muted">-</span>;
        }
        return (
          <pre className="max-w-[200px] truncate font-mono text-xs text-text-secondary">
            {JSON.stringify(b)}
          </pre>
        );
      },
    },
    {
      key: "sortOrder",
      label: "Ordem",
      sortable: true,
    },
    {
      key: "actions",
      label: "Acoes",
      render: (_value, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar tier"
            onPress={() => handleEdit(row as unknown as TierRow)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {deleteConfirmId === (row.id as string) ? (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onPress={() => handleDelete(row.id as string)}
              >
                Confirmar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setDeleteConfirmId(null)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Excluir tier"
              onPress={() => setDeleteConfirmId(row.id as string)}
            >
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const tableData: TierTableRow[] = tiers.map((t) => ({
    ...t,
  }));

  return (
    <>
      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button onPress={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Tier
        </Button>
      </div>

      {tiers.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Nenhum tier configurado"
          description="Crie o primeiro tier de comissao para os creators"
          action={{ label: "Criar Tier", onPress: handleCreate }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={tableData}
          isLoading={isPending}
        />
      )}

      <TierFormModal
        key={editingTier?.id ?? "new"}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        tier={editingTier}
        onSubmit={handleModalSubmit}
      />
    </>
  );
}
