"use client";

import { Card, CardContent } from "@ambaril/ui/components/card";

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
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepTiers({ tiers }: StepTiersProps) {
  const sorted = [...tiers].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Seus tiers de creators ja estao configurados. Voce pode editar tiers
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
              <p className="mt-1 text-xs text-text-secondary">
                Min. {tier.minFollowers.toLocaleString("pt-BR")} seguidores
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {tiers.length === 0 && (
        <p className="text-sm text-yellow-500">
          Nenhum tier configurado. Crie tiers em Creators &rarr; Tiers antes de
          continuar.
        </p>
      )}
    </div>
  );
}
