"use client";

import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyEvolutionEntry, TopPerformer } from "@/app/actions/creators/analytics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatorsChartsRowProps {
  evolution: MonthlyEvolutionEntry[];
  topPerformers: TopPerformer[];
}

interface ChartDataPoint {
  label: string;
  gmv: number;
  month: string;
}

interface TooltipPayloadEntry {
  value: number;
  dataKey: string;
  payload: ChartDataPoint;
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  if (!entry) return null;

  return (
    <div
      style={{
        background: "var(--chart-tooltip-bg)",
        border: "1px solid var(--border-default)",
        borderRadius: 8,
        padding: "8px 12px",
      }}
    >
      <p style={{ color: "var(--text-secondary)", fontSize: 11, margin: 0 }}>
        {entry.payload.month}
      </p>
      <p
        style={{
          color: "var(--chart-tooltip-text)",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          margin: "4px 0 0",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        R$&nbsp;
        {Number(entry.value).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreatorsChartsRow({
  evolution,
  topPerformers,
}: CreatorsChartsRowProps) {
  const chartData: ChartDataPoint[] = evolution.map((entry) => ({
    label: entry.label,
    gmv: Number(entry.gmv),
    month: entry.month,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Area chart — col-span-2 */}
      <div className="rounded-xl border border-border-default bg-bg-base p-5 shadow-[var(--shadow-sm)] lg:col-span-2">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-text-muted">
          Evolução GMV — Últimos 6 Meses
        </h2>
        <div className="h-[200px]">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-text-secondary">
                Nenhuma venda registrada nos últimos 6 meses
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 16, bottom: 4, left: 4 }}
              >
                <defs>
                  <linearGradient
                    id="beaconAreaGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--chart-line)"
                      stopOpacity={0.12}
                    />
                    <stop
                      offset="50%"
                      stopColor="var(--chart-line)"
                      stopOpacity={0.04}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--chart-line)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  horizontal
                  vertical={false}
                  stroke="var(--chart-grid)"
                  strokeWidth={0.5}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fill: "var(--text-ghost)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fill: "var(--text-ghost)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                  width={48}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: "var(--border-default)", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="gmv"
                  stroke="var(--chart-line)"
                  strokeWidth={1.5}
                  fill="url(#beaconAreaGradient)"
                  dot={false}
                  activeDot={{
                    r: 3,
                    fill: "var(--chart-line)",
                    stroke: "var(--bg-raised)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top 5 performers list — col-span-1 */}
      <div className="rounded-xl border border-border-default bg-bg-base p-5 shadow-[var(--shadow-sm)]">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-text-muted">
          Top Criadores — Este Mês
        </h2>

        {topPerformers.length === 0 ? (
          <p className="text-sm text-text-secondary">
            Nenhuma venda atribuída este mês.
          </p>
        ) : (
          <ol className="space-y-3">
            {topPerformers.map((performer, index) => (
              <li key={performer.id} className="flex items-center gap-3">
                {/* Rank */}
                <span className="w-4 shrink-0 text-center font-mono text-xs tabular-nums text-text-ghost">
                  {index + 1}
                </span>

                {/* Name */}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/creators/${performer.id}`}
                    className="block truncate text-sm font-medium text-text-bright transition-colors hover:text-info"
                  >
                    {performer.name}
                  </Link>
                  {performer.tierName && (
                    <span className="text-[10px] text-text-ghost">
                      {performer.tierName}
                    </span>
                  )}
                </div>

                {/* GMV */}
                <span className="shrink-0 font-mono text-xs tabular-nums text-text-secondary">
                  R$&nbsp;
                  {Number(
                    performer.currentMonthSalesAmount,
                  ).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-4 border-t border-border-default/60 pt-3">
          <Link
            href="/admin/creators/analytics"
            className="text-xs text-text-secondary transition-colors hover:text-text-bright"
          >
            Ver analytics completo →
          </Link>
        </div>
      </div>
    </div>
  );
}
