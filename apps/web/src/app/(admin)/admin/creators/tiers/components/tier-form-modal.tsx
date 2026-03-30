"use client";

import { useState, useCallback, useTransition } from "react";
import { Modal } from "@ambaril/ui/components/modal";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";

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

interface TierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: TierRow | null;
  onSubmit: (data: Record<string, unknown>) => Promise<{ error?: string }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TierFormModal({ isOpen, onClose, tier, onSubmit }: TierFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(tier?.name ?? "");
  const [slug, setSlug] = useState(tier?.slug ?? "");
  const [commissionRate, setCommissionRate] = useState(tier?.commissionRate ?? "");
  const [minFollowers, setMinFollowers] = useState(String(tier?.minFollowers ?? "0"));
  const [benefits, setBenefits] = useState(
    tier?.benefits ? JSON.stringify(tier.benefits, null, 2) : "{}",
  );
  const [sortOrder, setSortOrder] = useState(String(tier?.sortOrder ?? "0"));

  // Field errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = useCallback(() => {
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Nome e obrigatorio";
    if (!slug.trim()) errors.slug = "Slug e obrigatorio";
    if (!commissionRate.trim()) errors.commissionRate = "Taxa de comissao e obrigatoria";
    if (!/^\d+\.\d{2}$/.test(commissionRate)) errors.commissionRate = "Use formato 0.00";

    let parsedBenefits: Record<string, unknown> = {};
    try {
      parsedBenefits = JSON.parse(benefits) as Record<string, unknown>;
    } catch {
      errors.benefits = "JSON invalido";
    }

    const parsedMinFollowers = parseInt(minFollowers, 10);
    if (isNaN(parsedMinFollowers) || parsedMinFollowers < 0) {
      errors.minFollowers = "Valor invalido";
    }

    const parsedSortOrder = parseInt(sortOrder, 10);
    if (isNaN(parsedSortOrder) || parsedSortOrder < 0) {
      errors.sortOrder = "Valor invalido";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      const result = await onSubmit({
        name: name.trim(),
        slug: slug.trim(),
        commissionRate,
        minFollowers: parsedMinFollowers,
        benefits: parsedBenefits,
        sortOrder: parsedSortOrder,
      });
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }, [name, slug, commissionRate, minFollowers, benefits, sortOrder, onSubmit, onClose]);

  const title = tier ? "Editar Tier" : "Novo Tier";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        <Input
          label="Nome"
          placeholder="Ex: Seed"
          value={name}
          onChange={(e) => setName(e.target.value)}
          errorMessage={fieldErrors.name}
          required
        />

        <Input
          label="Slug"
          placeholder="Ex: seed"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          errorMessage={fieldErrors.slug}
          required
        />

        <Input
          label="Taxa de Comissao (%)"
          placeholder="Ex: 8.00"
          value={commissionRate}
          onChange={(e) => setCommissionRate(e.target.value)}
          errorMessage={fieldErrors.commissionRate}
          required
        />

        <Input
          label="Seguidores Minimos"
          type="number"
          placeholder="0"
          value={minFollowers}
          onChange={(e) => setMinFollowers(e.target.value)}
          errorMessage={fieldErrors.minFollowers}
        />

        <div className="space-y-1">
          <label className="text-sm text-text-secondary">Beneficios (JSON)</label>
          <textarea
            className="w-full rounded-lg border border-border-default bg-bg-raised px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-ghost focus:border-border-strong focus:outline-none"
            rows={4}
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
            placeholder='{"free_shipping": true, "early_access": false}'
          />
          {fieldErrors.benefits && (
            <p className="text-xs text-danger">{fieldErrors.benefits}</p>
          )}
        </div>

        <Input
          label="Ordem"
          type="number"
          placeholder="0"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          errorMessage={fieldErrors.sortOrder}
        />

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onPress={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onPress={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando..." : tier ? "Salvar Alteracoes" : "Criar Tier"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
