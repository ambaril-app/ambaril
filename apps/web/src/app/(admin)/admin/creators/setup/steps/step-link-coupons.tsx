"use client";

import { useState } from "react";
import { Input } from "@ambaril/ui/components/input";
import { Card, CardContent } from "@ambaril/ui/components/card";
import { Ticket } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tier {
  id: string;
  name: string;
  slug: string;
  commissionRate: string;
}

interface LinkEntry {
  couponCode: string;
  creatorName: string;
  creatorEmail: string;
  tierId: string;
}

interface StepLinkCouponsProps {
  importedCoupons: Array<{ code: string }>;
  tiers: Tier[];
  onLinked: (links: LinkEntry[]) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepLinkCoupons({
  importedCoupons,
  tiers,
  onLinked,
}: StepLinkCouponsProps) {
  const [links, setLinks] = useState<LinkEntry[]>(
    importedCoupons.map((c) => ({
      couponCode: c.code,
      creatorName: "",
      creatorEmail: "",
      tierId: tiers[0]?.id ?? "",
    })),
  );

  const updateLink = (
    index: number,
    field: keyof LinkEntry,
    value: string,
  ) => {
    setLinks((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) return prev;
      next[index] = { ...current, [field]: value };
      onLinked(next.filter((l) => l.creatorName && l.creatorEmail));
      return next;
    });
  };

  if (importedCoupons.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Nenhum cupom importado na etapa anterior. Voce pode pular esta etapa e
          vincular creators manualmente depois.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Para cada cupom, informe o creator responsavel. Deixe em branco para
        pular.
      </p>

      <div className="space-y-3">
        {links.map((link, index) => (
          <Card key={link.couponCode} className="p-0">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-text-ghost" />
                <span className="font-mono text-sm font-medium text-text-bright">
                  {link.couponCode}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Nome do Creator"
                  placeholder="Ex: Maria Silva"
                  value={link.creatorName}
                  onChange={(e) =>
                    updateLink(index, "creatorName", e.target.value)
                  }
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="creator@email.com"
                  value={link.creatorEmail}
                  onChange={(e) =>
                    updateLink(index, "creatorEmail", e.target.value)
                  }
                />
              </div>

              {tiers.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-secondary">
                    Tier
                  </label>
                  <select
                    value={link.tierId}
                    onChange={(e) =>
                      updateLink(index, "tierId", e.target.value)
                    }
                    className="w-full rounded-md border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary transition-colors focus:border-input-focus focus:outline-none"
                  >
                    {tiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.name} ({tier.commissionRate}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-text-ghost">
        {links.filter((l) => l.creatorName && l.creatorEmail).length} de{" "}
        {links.length} preenchidos
      </p>
    </div>
  );
}
