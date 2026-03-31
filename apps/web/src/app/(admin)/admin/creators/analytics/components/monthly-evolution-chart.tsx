"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyEvolutionEntry } from "@/app/actions/creators/analytics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MonthlyEvolutionChartProps {
  data: MonthlyEvolutionEntry[];
}

interface TooltipPayloadEntry {
  value: number;
  dataKey: string;
  payload: ChartDataPoint;
}

interface ChartDataPoint {
  label: string;
  gmv: number;
  month: string;
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
          color: "var(--text-secondary)",
          fontSize: 11,
          margin: 0,
        }}
      >
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
        R$&nbsp;{Number(entry.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom active dot (last data point highlight)
// ---------------------------------------------------------------------------

interface DotProps {
  cx?: number;
  cy?: number;
  index?: number;
  dataLength: number;
}

function ActiveDot({ cx, cy, index, dataLength }: DotProps) {
  // Only render the dot on the last data point
  if (index !== dataLength - 1) return null;
  if (cx === undefined || cy === undefined) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--text-white)"
      stroke="var(--bg-raised)"
      strokeWidth={2}
    />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function MonthlyEvolutionChart({ data }: MonthlyEvolutionChartProps) {
  const chartData: ChartDataPoint[] = data.map((entry) => ({
    label: entry.label,
    gmv: Number(entry.gmv),
    month: entry.month,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-text-ghost">
          Nenhuma venda registrada nos ultimos 6 meses
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 8, right: 16, bottom: 4, left: 4 }}
      >
        <defs>
          <linearGradient id="areaGradientEvolution" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-line)" stopOpacity={0.12} />
            <stop offset="50%" stopColor="var(--chart-line)" stopOpacity={0.04} />
            <stop offset="100%" stopColor="var(--chart-line)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          horizontal={true}
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
          fill="url(#areaGradientEvolution)"
          dot={(props: Record<string, unknown>) => (
            <ActiveDot
              key={`dot-${props.index}`}
              cx={props.cx as number | undefined}
              cy={props.cy as number | undefined}
              index={props.index as number | undefined}
              dataLength={chartData.length}
            />
          )}
          activeDot={{
            r: 3,
            fill: "var(--chart-line)",
            stroke: "var(--bg-raised)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export { MonthlyEvolutionChart };
