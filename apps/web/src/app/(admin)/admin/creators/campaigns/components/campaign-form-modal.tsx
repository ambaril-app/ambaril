"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@ambaril/ui/components/modal";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { FormSelect } from "@ambaril/ui/components/form-select";
import { FormDatePicker } from "@ambaril/ui/components/form-date-picker";
import { createCampaign } from "@/app/actions/creators/campaigns";
import type { CampaignCrudInput } from "@ambaril/shared/schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CampaignType = CampaignCrudInput["campaignType"];

interface CampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Values must match campaignCrudSchema enum (shared/schemas/creators.ts)
const CAMPAIGN_TYPE_OPTIONS = [
  { value: "launch", label: "Lançamento" },
  { value: "seasonal", label: "Sazonal" },
  { value: "collab", label: "Colaboração" },
  { value: "organic", label: "Orgânica" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CampaignFormModal({ isOpen, onClose }: CampaignFormModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [campaignType, setCampaignType] = useState<CampaignType>("launch");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [costProduct, setCostProduct] = useState("");
  const [costShipping, setCostShipping] = useState("");
  const [costCreator, setCostCreator] = useState("");
  const [costOther, setCostOther] = useState("");

  const resetForm = useCallback(() => {
    setName("");
    setCampaignType("launch");
    setStartDate(null);
    setEndDate(null);
    setCostProduct("");
    setCostShipping("");
    setCostCreator("");
    setCostOther("");
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError("Nome da campanha é obrigatório");
      return;
    }
    if (!startDate) {
      setError("Data de início é obrigatória");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const result = await createCampaign({
      name: name.trim(),
      campaignType,
      startDate: formatDate(startDate),
      endDate: endDate ? formatDate(endDate) : undefined,
      costProduct: costProduct || "0.00",
      costShipping: costShipping || undefined,
      costCreator: costCreator || undefined,
      costOther: costOther || undefined,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    handleClose();
    router.refresh();
  }, [
    name,
    campaignType,
    startDate,
    endDate,
    costProduct,
    costShipping,
    costCreator,
    costOther,
    handleClose,
    router,
  ]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nova Campanha" size="lg">
      <div className="space-y-6">
        {error && (
          <div className="rounded-md bg-[var(--danger-muted)] px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Section: Campanha */}
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-ghost">
            Campanha
          </p>
          <Input
            label="Nome da campanha"
            placeholder="Ex: Drop Inverno 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <FormSelect
            label="Tipo"
            options={CAMPAIGN_TYPE_OPTIONS}
            value={campaignType}
            onChange={(v) => setCampaignType(v as CampaignType)}
          />
        </div>

        {/* Section: Período */}
        <div className="space-y-3 border-t border-border-default/60 pt-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-ghost">
            Período
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FormDatePicker
              label="Data de início"
              value={startDate ?? undefined}
              onChange={(d) => setStartDate(d)}
              required
            />
            <FormDatePicker
              label="Data de fim"
              value={endDate ?? undefined}
              onChange={(d) => setEndDate(d)}
            />
          </div>
        </div>

        {/* Section: Custos */}
        <div className="space-y-3 border-t border-border-default/60 pt-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-ghost">
            Custos (R$)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Produto"
              placeholder="0.00"
              value={costProduct}
              onChange={(e) => setCostProduct(e.target.value)}
            />
            <Input
              label="Frete"
              placeholder="0.00"
              value={costShipping}
              onChange={(e) => setCostShipping(e.target.value)}
            />
            <Input
              label="Creator"
              placeholder="0.00"
              value={costCreator}
              onChange={(e) => setCostCreator(e.target.value)}
            />
            <Input
              label="Outros"
              placeholder="0.00"
              value={costOther}
              onChange={(e) => setCostOther(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border-default/60 pt-4">
          <Button variant="ghost" onPress={handleClose}>
            Cancelar
          </Button>
          <Button onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar Campanha"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
