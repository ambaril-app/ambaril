"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { DataTable } from "@ambaril/ui/components/data-table";
import type { DataTableColumn } from "@ambaril/ui/components/data-table";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import type { StatusBadgeProps } from "@ambaril/ui/components/status-badge";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { FormSelect } from "@ambaril/ui/components/form-select";
import { Modal } from "@ambaril/ui/components/modal";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import {
  addCreatorToCampaign,
  removeCreatorFromCampaign,
  updateDeliveryStatus,
} from "@/app/actions/creators/campaigns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CampaignCreatorRow extends Record<string, unknown> {
  id: string;
  campaignId: string;
  creatorId: string;
  deliveryStatus: string | null;
  productCost: string | null;
  shippingCost: string | null;
  feeAmount: string | null;
  notes: string | null;
}

interface CampaignCreatorsTableProps {
  campaignId: string;
  creatorsInCampaign: CampaignCreatorRow[];
}

// ---------------------------------------------------------------------------
// Status map
// ---------------------------------------------------------------------------

const DELIVERY_STATUS_MAP: StatusBadgeProps["statusMap"] = {
  pending: { label: "Pendente", variant: "warning" },
  shipped: { label: "Enviado", variant: "info" },
  delivered: { label: "Entregue", variant: "success" },
  content_posted: { label: "Conteudo Postado", variant: "success" },
};

const DELIVERY_STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
  { value: "content_posted", label: "Conteudo Postado" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: string | null): string {
  if (!value) return "-";
  const num = parseFloat(value);
  return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CampaignCreatorsTable({
  campaignId,
  creatorsInCampaign,
}: CampaignCreatorsTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState<CampaignCreatorRow[]>(creatorsInCampaign);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Add creator form state
  const [newCreatorId, setNewCreatorId] = useState("");
  const [newProductCost, setNewProductCost] = useState("");
  const [newShippingCost, setNewShippingCost] = useState("");
  const [newFeeAmount, setNewFeeAmount] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!newCreatorId.trim()) {
      setAddError("ID do creator e obrigatorio");
      return;
    }
    setIsAdding(true);
    setAddError(null);

    const result = await addCreatorToCampaign(campaignId, newCreatorId.trim(), {
      productCost: newProductCost || undefined,
      shippingCost: newShippingCost || undefined,
      feeAmount: newFeeAmount || undefined,
      notes: newNotes || undefined,
    });

    setIsAdding(false);

    if (result.error) {
      setAddError(result.error);
      return;
    }

    setIsAddModalOpen(false);
    setNewCreatorId("");
    setNewProductCost("");
    setNewShippingCost("");
    setNewFeeAmount("");
    setNewNotes("");
    router.refresh();
  }, [campaignId, newCreatorId, newProductCost, newShippingCost, newFeeAmount, newNotes, router]);

  const handleRemove = useCallback(
    async (campaignCreatorId: string) => {
      setIsRemoving(campaignCreatorId);
      const result = await removeCreatorFromCampaign(campaignCreatorId);
      setIsRemoving(null);

      if (!result.error) {
        setRows((prev) => prev.filter((r) => r.id !== campaignCreatorId));
        router.refresh();
      }
    },
    [router],
  );

  const handleDeliveryStatusChange = useCallback(
    async (campaignCreatorId: string, newStatus: string) => {
      setIsUpdating(campaignCreatorId);
      const result = await updateDeliveryStatus(campaignCreatorId, {
        deliveryStatus: newStatus as "pending" | "shipped" | "delivered" | "content_posted",
      });
      setIsUpdating(null);

      if (!result.error) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === campaignCreatorId
              ? { ...r, deliveryStatus: newStatus }
              : r,
          ),
        );
      }
    },
    [],
  );

  const columns: DataTableColumn<CampaignCreatorRow>[] = [
    {
      key: "creatorId",
      label: "Creator ID",
      render: (value) => (
        <span className="font-mono text-xs text-text-secondary">
          {String(value).substring(0, 8)}...
        </span>
      ),
    },
    {
      key: "deliveryStatus",
      label: "Status de Entrega",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <StatusBadge
            status={String(value ?? "pending")}
            statusMap={DELIVERY_STATUS_MAP}
          />
          <FormSelect
            options={DELIVERY_STATUS_OPTIONS}
            value={String(value ?? "pending")}
            onChange={(v) => handleDeliveryStatusChange(row.id, v)}
            disabled={isUpdating === row.id}
            className="w-36"
          />
        </div>
      ),
    },
    {
      key: "productCost",
      label: "Custo Produto",
      render: (value) => (
        <span className="font-mono text-text-primary">
          {formatCurrency(value as string | null)}
        </span>
      ),
    },
    {
      key: "shippingCost",
      label: "Custo Frete",
      render: (value) => (
        <span className="font-mono text-text-primary">
          {formatCurrency(value as string | null)}
        </span>
      ),
    },
    {
      key: "feeAmount",
      label: "Fee",
      render: (value) => (
        <span className="font-mono text-text-primary">
          {formatCurrency(value as string | null)}
        </span>
      ),
    },
    {
      key: "notes",
      label: "Notas",
      render: (value) => (
        <span className="max-w-[200px] truncate text-text-secondary">
          {value ? String(value) : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (_value, row) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Remover creator"
          onPress={() => handleRemove(row.id)}
          disabled={isRemoving === row.id}
        >
          <Trash2 className="h-4 w-4 text-danger" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-text-bright">Creators na Campanha</h2>
        <Button variant="outline" onPress={() => setIsAddModalOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Adicionar Creator
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhum creator nesta campanha"
          description="Adicione creators para comecar a gerenciar entregas e custos."
          action={{
            label: "Adicionar Creator",
            onPress: () => setIsAddModalOpen(true),
          }}
        />
      ) : (
        <DataTable<CampaignCreatorRow> columns={columns} data={rows} />
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddError(null);
        }}
        title="Adicionar Creator a Campanha"
      >
        <div className="space-y-4">
          {addError && (
            <div className="rounded-md bg-[var(--danger-muted)] px-3 py-2 text-sm text-danger">
              {addError}
            </div>
          )}

          <Input
            label="ID do Creator"
            placeholder="UUID do creator"
            value={newCreatorId}
            onChange={(e) => setNewCreatorId(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Custo do produto (R$)"
              placeholder="0.00"
              value={newProductCost}
              onChange={(e) => setNewProductCost(e.target.value)}
            />
            <Input
              label="Custo de frete (R$)"
              placeholder="0.00"
              value={newShippingCost}
              onChange={(e) => setNewShippingCost(e.target.value)}
            />
          </div>

          <Input
            label="Fee do creator (R$)"
            placeholder="0.00"
            value={newFeeAmount}
            onChange={(e) => setNewFeeAmount(e.target.value)}
          />

          <Input
            label="Notas"
            placeholder="Observacoes opcionais"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onPress={() => {
                setIsAddModalOpen(false);
                setAddError(null);
              }}
            >
              Cancelar
            </Button>
            <Button onPress={handleAdd} disabled={isAdding}>
              {isAdding ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
