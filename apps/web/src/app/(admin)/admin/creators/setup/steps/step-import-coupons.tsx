"use client";

import { useState, useTransition } from "react";
import { Button } from "@ambaril/ui/components/button";
import { Download, Ticket, Check } from "lucide-react";
import { importCouponsFromProvider } from "@/app/actions/creators/setup";
import { cn } from "@ambaril/ui/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportedCoupon {
  code: string;
  discountType: string;
  discountValue: string;
  isActive: boolean;
}

interface StepImportCouponsProps {
  onImported: (coupons: ImportedCoupon[]) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepImportCoupons({ onImported }: StepImportCouponsProps) {
  const [isPending, startTransition] = useTransition();
  const [coupons, setCoupons] = useState<ImportedCoupon[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [imported, setImported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    setError(null);
    startTransition(async () => {
      const result = await importCouponsFromProvider();
      if (result.error) {
        setError(result.error);
        return;
      }
      const importedCoupons = result.data?.coupons ?? [];
      setCoupons(importedCoupons);
      // Select all by default
      const allCodes = new Set(importedCoupons.map((c) => c.code));
      setSelected(allCodes);
      onImported(importedCoupons);
      setImported(true);
    });
  };

  const toggleCoupon = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      // Notify parent with updated selection
      const selectedCoupons = coupons.filter((c) => next.has(c.code));
      onImported(selectedCoupons);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Importe cupons existentes da sua plataforma de e-commerce para vincular
        a creators.
      </p>

      {!imported ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <Download className="h-10 w-10 text-text-muted" strokeWidth={1.5} />
          <p className="text-sm text-text-secondary">
            Clique para buscar cupons da sua loja
          </p>
          <Button onPress={handleImport} disabled={isPending}>
            {isPending ? "Importando..." : "Importar Cupons"}
          </Button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      ) : (
        <>
          <p className="text-sm text-text-secondary">
            {coupons.length} cupons encontrados. Selecione os que deseja
            vincular a creators.
          </p>

          {coupons.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-ghost">
              Nenhum cupom encontrado. Voce pode pular esta etapa e criar cupons
              manualmente.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {coupons.map((coupon) => {
                const isSelected = selected.has(coupon.code);
                return (
                  <button
                    key={coupon.code}
                    type="button"
                    onClick={() => toggleCoupon(coupon.code)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      isSelected
                        ? "border-text-tertiary bg-bg-raised"
                        : "border-border-default bg-bg-base hover:border-border-strong",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                        isSelected
                          ? "border-text-tertiary bg-text-tertiary"
                          : "border-border-default",
                      )}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-bg-base" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm text-text-bright">
                        {coupon.code}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {coupon.discountType === "percent"
                          ? `${coupon.discountValue}% off`
                          : `R$\u00a0${coupon.discountValue} off`}
                      </p>
                    </div>
                    <Ticket className="h-4 w-4 shrink-0 text-text-ghost" />
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-xs text-text-ghost">
            {selected.size} de {coupons.length} selecionados
          </p>
        </>
      )}
    </div>
  );
}
