import { TrendingUp, DollarSign, Users, UserCheck } from "lucide-react";
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
      icon: TrendingUp,
      iconColor: "text-info",
    },
    {
      key: "commissions",
      label: "Comissões",
      value: formatMoney(kpis.totalCommissions),
      icon: DollarSign,
      iconColor: "text-success",
    },
    {
      key: "active",
      label: "Criadores Ativos",
      value: String(kpis.activeCreators),
      icon: Users,
      iconColor: "text-text-ghost",
    },
    {
      key: "pending",
      label: "Aprovações Pendentes",
      value: String(pendingCount),
      icon: UserCheck,
      iconColor: hasPending ? "text-warning" : "text-text-ghost",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            className="relative overflow-hidden rounded-lg border border-border-default p-4 shadow-[var(--shadow-sm)]"
            style={{
              background:
                "linear-gradient(150deg, var(--bg-raised) 40%, var(--bg-surface))",
            }}
          >
            {/* Brilho — DS.md §5 */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 90% 10%, rgba(247,248,250,0.025) 0%, transparent 60%)",
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-muted">
                  {card.label}
                </span>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
              <div className="mt-3">
                <span className="font-display text-2xl font-semibold tabular-nums text-text-bright">
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
