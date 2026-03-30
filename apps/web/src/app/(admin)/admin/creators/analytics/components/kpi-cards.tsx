import { DollarSign, Percent, Users, Target } from "lucide-react";
import type { OverviewKPIs } from "@/app/actions/creators/analytics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KpiCardsProps {
  kpis: OverviewKPIs;
}

interface KpiCardConfig {
  key: keyof OverviewKPIs;
  label: string;
  icon: typeof DollarSign;
  format: (value: string | number) => string;
  placeholder?: boolean;
}

// ---------------------------------------------------------------------------
// Card config
// ---------------------------------------------------------------------------

const CARDS: KpiCardConfig[] = [
  {
    key: "totalGMV",
    label: "GMV Total",
    icon: DollarSign,
    format: (v) =>
      `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    key: "totalCommissions",
    label: "Comissoes Totais",
    icon: Percent,
    format: (v) =>
      `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    key: "activeCreators",
    label: "Creators Ativos",
    icon: Users,
    format: (v) => String(v),
  },
  {
    key: "avgCAC",
    label: "CAC Medio",
    icon: Target,
    format: (v) => (Number(v) === 0 ? "R$ \u2014" : `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`),
    placeholder: true,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const value = kpis[card.key];

        return (
          <div
            key={card.key}
            className="kpi-card relative overflow-hidden rounded-lg border border-border-default p-4"
            style={{
              background:
                "linear-gradient(150deg, var(--bg-raised) 40%, var(--bg-surface))",
            }}
          >
            {/* Brilho — radial gradient ::after equivalent */}
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
                <Icon className="h-4 w-4 text-text-ghost" />
              </div>
              <div className="mt-3">
                <span
                  className="font-display text-2xl font-semibold tabular-nums text-text-bright"
                >
                  {card.format(value)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { KpiCards };
