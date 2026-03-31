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
}

export function KpiCards({
  monthlyEarnings,
  monthlySalesCount,
  totalPoints,
}: KpiCardsProps) {
  const cards: KpiCardData[] = [
    {
      label: "Ganhos do Mês",
      value: formatBRL(monthlyEarnings),
    },
    {
      label: "Vendas do Mês",
      value: monthlySalesCount.toLocaleString("pt-BR"),
    },
    {
      label: "Pontos Totais",
      value: totalPoints.toLocaleString("pt-BR"),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cards.map((card, index) => {
        const isPrimary = index === 0;
        return (
          <div
            key={card.label}
            className={cn(
              "relative overflow-hidden rounded-xl border transition-shadow",
              isPrimary
                ? "col-span-2 flex flex-col justify-between border-border-subtle bg-bg-elevated p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] sm:col-span-2 sm:row-span-2 sm:p-6"
                : "border-border-default bg-bg-raised p-4 hover:shadow-[var(--shadow-sm)]",
            )}
          >
            <span
              className={cn(
                "font-medium uppercase",
                isPrimary
                  ? "font-display text-[11px] tracking-[0.06em] text-text-secondary"
                  : "text-xs tracking-[0.04em] text-text-muted",
              )}
            >
              {card.label}
            </span>
            <p
              className={cn(
                "font-mono tabular-nums text-text-bright",
                isPrimary
                  ? "mt-6 text-[38px] font-medium leading-none"
                  : "mt-2 text-xl font-medium",
              )}
            >
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
