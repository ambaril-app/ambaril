"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TopPerformer } from "@/app/actions/creators/analytics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopPerformersChartProps {
  data: TopPerformer[];
}

interface TooltipPayloadEntry {
  value: number;
  dataKey: string;
  payload: ChartDataPoint;
}

interface ChartDataPoint {
  name: string;
  amount: number;
  sales: number;
  tier: string;
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
      <p
        style={{
          color: "var(--chart-tooltip-text)",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          margin: 0,
        }}
      >
        {entry.payload.name}
      </p>
      <p
        style={{
          color: "var(--text-tertiary)",
          fontSize: 12,
          margin: "4px 0 0",
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        R$&nbsp;{Number(entry.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </p>
      <p style={{ color: "var(--text-muted)", fontSize: 11, margin: "2px 0 0" }}>
        {entry.payload.sales} venda{entry.payload.sales !== 1 ? "s" : ""} · {entry.payload.tier}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function TopPerformersChart({ data }: TopPerformersChartProps) {
  const chartData: ChartDataPoint[] = data.map((performer) => ({
    name: performer.name.length > 18
      ? performer.name.slice(0, 18) + "..."
      : performer.name,
    amount: Number(performer.currentMonthSalesAmount),
    sales: performer.currentMonthSalesCount,
    tier: performer.tierName ?? "Sem tier",
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-text-ghost">
          Nenhum creator com vendas este mes
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
      >
        <defs>
          <linearGradient id="barGradientPerformers" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--chart-bar-bottom)" />
            <stop offset="100%" stopColor="var(--chart-bar-top)" />
          </linearGradient>
        </defs>
        <XAxis
          type="number"
          tick={{
            fill: "var(--text-ghost)",
            fontFamily: "var(--font-mono)",
            fontSize: 9,
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) =>
            `R$ ${(v / 1000).toFixed(0)}k`
          }
        />
        <YAxis
          dataKey="name"
          type="category"
          width={120}
          tick={{
            fill: "var(--text-ghost)",
            fontFamily: "var(--font-mono)",
            fontSize: 9,
          }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: "var(--table-row-hover)" }}
        />
        <Bar
          dataKey="amount"
          fill="url(#barGradientPerformers)"
          radius={[0, 5, 5, 0]}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export { TopPerformersChart };
