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
  abbrTitle?: string;
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
    abbrTitle: "Gross Merchandise Value — total de vendas brutas geradas pelo programa de criadores",
    format: (v) =>
      `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    key: "totalCommissions",
    label: "Comissões Totais",
    format: (v) =>
      `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    key: "activeCreators",
    label: "Creators Ativos",
    format: (v) => String(v),
  },
  {
    key: "avgCAC",
    label: "CAC Médio",
    abbrTitle: "Custo de Aquisição de Criador — comissão média paga por cada novo criador ativo",
    format: (v) => (Number(v) === 0 ? "R$ \u2014" : `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`),
    placeholder: true,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {CARDS.map((card, index) => {
        const value = kpis[card.key];
        const isPrimary = index === 0;

        return (
          <div
            key={card.key}
            className={
              isPrimary
                ? "col-span-2 flex flex-col justify-between rounded-lg border border-border-subtle bg-bg-elevated p-5 shadow-[var(--shadow-sm)] lg:col-span-2"
                : "rounded-lg border border-border-default bg-bg-raised p-4"
            }
          >
            <span
              className={
                isPrimary
                  ? "font-display text-[11px] font-medium uppercase tracking-[0.06em] text-text-ghost"
                  : "text-[11px] font-medium uppercase tracking-[0.04em] text-text-muted"
              }
              title={card.abbrTitle}
            >
              {card.label}
            </span>
            <span
              className={
                isPrimary
                  ? "mt-4 block font-mono text-[32px] font-semibold leading-none tabular-nums text-text-bright"
                  : "mt-3 block font-mono text-2xl font-semibold tabular-nums text-text-bright"
              }
            >
              {card.format(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export { KpiCards };
