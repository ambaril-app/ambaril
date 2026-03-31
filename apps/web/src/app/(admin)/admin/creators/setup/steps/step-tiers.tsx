"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@ambaril/ui/components/card";
import { Button } from "@ambaril/ui/components/button";
import { Plus } from "lucide-react";
import { createTier } from "@/app/actions/creators/tiers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tier {
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

interface StepTiersProps {
  tiers: Tier[];
  onTiersChanged?: (tiers: Tier[]) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepTiers({ tiers: initialTiers, onTiersChanged }: StepTiersProps) {
  const [tiers, setTiers] = useState<Tier[]>(initialTiers);
  const [name, setName] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sorted = [...tiers].sort((a, b) => a.sortOrder - b.sortOrder);

  function slugify(str: string) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleAddTier() {
    setError(null);
    const trimmedName = name.trim();
    const trimmedRate = commissionRate.trim();

    if (!trimmedName) {
      setError("Nome do tier é obrigatório");
      return;
    }
    if (!trimmedRate || Number.isNaN(Number(trimmedRate))) {
      setError("Comissão inválida");
      return;
    }

    const rateFormatted = Number(trimmedRate).toFixed(2);
    const slug = slugify(trimmedName) || `tier-${tiers.length + 1}`;

    startTransition(async () => {
      const result = await createTier({
        name: trimmedName,
        slug,
        commissionRate: rateFormatted,
        minFollowers: 0,
        benefits: {},
        sortOrder: tiers.length,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      const newId = result.data?.id;
      if (!newId) return;

      const newTier: Tier = {
        id: newId,
        name: trimmedName,
        slug,
        commissionRate: rateFormatted,
        minFollowers: 0,
        benefits: {},
        sortOrder: tiers.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updated = [...tiers, newTier];
      setTiers(updated);
      onTiersChanged?.(updated);
      setName("");
      setCommissionRate("");
    });
  }

  // Mode B — no tiers yet
  if (tiers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-border-default bg-bg-surface p-4">
          <p className="text-sm font-medium text-text-bright">Nenhum tier configurado</p>
          <p className="mt-1 text-sm text-text-ghost">
            Tiers definem os níveis e comissões dos creators. Adicione pelo menos um tier para continuar.
          </p>
        </div>

        {/* Inline quick-create */}
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-ghost">Criar tier</p>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <label htmlFor="tier-name" className="text-xs text-text-ghost">
                Nome
              </label>
              <input
                id="tier-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Seed, Grow, Bloom…"
                className="w-full rounded-md border border-border-default bg-input-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-input-focus"
                disabled={isPending}
              />
            </div>
            <div className="w-32 space-y-1">
              <label htmlFor="tier-commission" className="text-xs text-text-ghost">
                Comissão (%)
              </label>
              <input
                id="tier-commission"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder="10"
                className="w-full rounded-md border border-border-default bg-input-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-input-focus"
                disabled={isPending}
              />
            </div>
            <Button
              onPress={handleAddTier}
              disabled={isPending || !name.trim() || !commissionRate.trim()}
            >
              <Plus size={16} />
              {isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </div>
    );
  }

  // Mode A — tiers exist
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-ghost">
        Seus tiers de creators já estão configurados. Você pode editar tiers
        depois em Creators &rarr; Tiers.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((tier) => (
          <Card key={tier.id} className="p-0">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-text-bright">
                {tier.name}
              </p>
              <p className="mt-1 font-mono text-lg tabular-nums text-text-bright">
                {tier.commissionRate}%
              </p>
              <p className="mt-1 text-xs text-text-ghost">
                Min. {tier.minFollowers.toLocaleString("pt-BR")} seguidores
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Allow adding more tiers inline */}
      <div className="border-t border-border-default pt-5">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-text-ghost">Adicionar tier</p>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1">
            <label htmlFor="tier-name-extra" className="text-xs text-text-ghost">
              Nome
            </label>
            <input
              id="tier-name-extra"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Core, Pro…"
              className="w-full rounded-md border border-border-default bg-input-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-input-focus"
              disabled={isPending}
            />
          </div>
          <div className="w-32 space-y-1">
            <label htmlFor="tier-commission-extra" className="text-xs text-text-ghost">
              Comissão (%)
            </label>
            <input
              id="tier-commission-extra"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="15"
              className="w-full rounded-md border border-border-default bg-input-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-input-focus"
              disabled={isPending}
            />
          </div>
          <Button
            variant="secondary"
            onPress={handleAddTier}
            disabled={isPending || !name.trim() || !commissionRate.trim()}
          >
            <Plus size={16} />
            {isPending ? "Salvando..." : "Adicionar"}
          </Button>
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
