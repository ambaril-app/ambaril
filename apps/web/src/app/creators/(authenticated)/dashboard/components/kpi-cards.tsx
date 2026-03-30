import { DollarSign, ShoppingBag, Star } from "lucide-react";
import { formatBRL } from "@ambaril/shared/utils";
import { cn } from "@ambaril/ui/lib/utils";

interface KpiCardsProps {
  monthlyEarnings: number;
  monthlySalesCount: number;
  totalPoints: number;
}

interface KpiCardData {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isMono: boolean;
}

export function KpiCards({
  monthlyEarnings,
  monthlySalesCount,
  totalPoints,
}: KpiCardsProps) {
  const cards: KpiCardData[] = [
    {
      label: "Ganhos do Mes",
      value: formatBRL(monthlyEarnings),
      icon: DollarSign,
      isMono: true,
    },
    {
      label: "Vendas do Mes",
      value: monthlySalesCount.toLocaleString("pt-BR"),
      icon: ShoppingBag,
      isMono: true,
    },
    {
      label: "Pontos Totais",
      value: totalPoints.toLocaleString("pt-BR"),
      icon: Star,
      isMono: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-xl border border-border-default p-4 transition-shadow hover:shadow-[var(--shadow-md)]"
            style={{
              background:
                "linear-gradient(150deg, var(--color-bg-raised) 40%, var(--color-bg-surface))",
            }}
          >
            {/* Subtle glow overlay */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 90% 10%, rgba(247,248,250,0.025), transparent 60%)",
              }}
            />

            <div className="relative">
              <div className="flex items-center gap-2">
                <Icon size={14} className="text-text-muted" />
                <span className="text-xs font-medium uppercase tracking-[0.04em] text-text-muted">
                  {card.label}
                </span>
              </div>
              <p
                className={cn(
                  "mt-2 font-display text-2xl font-medium tabular-nums text-text-bright",
                )}
              >
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
