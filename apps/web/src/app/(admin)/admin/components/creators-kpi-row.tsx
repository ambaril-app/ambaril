import type { OverviewKPIs } from "@/app/actions/creators/analytics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatorsKpiRowProps {
  kpis: OverviewKPIs;
  pendingCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMoney(value: string): string {
  return `R$\u00a0${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreatorsKpiRow({ kpis, pendingCount }: CreatorsKpiRowProps) {
  const hasPending = pendingCount > 0;

  const cards = [
    {
      key: "gmv",
      label: "GMV Este Mês",
      value: formatMoney(kpis.totalGMV),
    },
    {
      key: "commissions",
      label: "Comissões",
      value: formatMoney(kpis.totalCommissions),
    },
    {
      key: "active",
      label: "Criadores Ativos",
      value: String(kpis.activeCreators),
    },
    {
      key: "pending",
      label: "Aprovações Pendentes",
      value: String(pendingCount),
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {cards.map((card, index) => {
        const isPrimary = index === 0;
        return (
          <div
            key={card.key}
            className={
              isPrimary
                ? "relative col-span-2 overflow-hidden rounded-lg border border-border-subtle bg-bg-elevated p-5 shadow-[var(--shadow-sm)] md:col-span-2"
                : "relative overflow-hidden rounded-lg border border-border-default bg-bg-raised p-4 shadow-[var(--shadow-sm)]"
            }
          >
            <div className="relative z-10">
              <div>
                <span
                  className={
                    isPrimary
                      ? "font-display text-[11px] font-medium uppercase tracking-[0.06em] text-text-ghost"
                      : "text-[11px] font-medium uppercase tracking-[0.04em] text-text-muted"
                  }
                  title={card.key === "gmv" ? "Gross Merchandise Value — total de vendas brutas atribuídas ao programa neste mês" : undefined}
                >
                  {card.label}
                  {card.key === "pending" && hasPending && (
                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-warning align-middle" />
                  )}
                </span>
              </div>
              <div className={isPrimary ? "mt-4" : "mt-3"}>
                <span
                  className={
                    isPrimary
                      ? "font-mono text-[32px] font-semibold leading-none tabular-nums text-text-bright"
                      : "font-mono text-2xl font-semibold tabular-nums text-text-bright"
                  }
                >
                  {card.value}
                </span>
              </div>
              {card.key === "pending" && hasPending && (
                <p className="mt-1 text-[11px] text-warning">
                  Requer atenção
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
