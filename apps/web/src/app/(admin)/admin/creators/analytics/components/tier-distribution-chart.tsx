"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { TierDistributionEntry } from "@/app/actions/creators/analytics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TierDistributionChartProps {
  data: TierDistributionEntry[];
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  payload: { tierName: string; count: number; fill: string };
}

// ---------------------------------------------------------------------------
// Monocromatic shades (Moonstone tokens)
// ---------------------------------------------------------------------------

const PIE_COLORS = [
  "var(--text-tertiary)",
  "var(--text-secondary)",
  "var(--text-muted)",
  "var(--text-ghost)",
  "var(--border-default)",
];

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
        {entry.name}
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
        {entry.value} creator{entry.value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom label (inside donut)
// ---------------------------------------------------------------------------

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: LabelProps) {
  if (percent < 0.05) return null; // Skip labels for tiny slices
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="var(--chart-tooltip-text)"
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily="var(--font-mono)"
      fontSize={11}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function TierDistributionChart({ data }: TierDistributionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-text-ghost">
          Nenhum creator cadastrado
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="tierName"
            cx="50%"
            cy="50%"
            innerRadius="45%"
            outerRadius="80%"
            strokeWidth={0}
            labelLine={false}
            label={renderLabel}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 px-2 pb-1">
        {data.map((entry, index) => (
          <div key={entry.tierName} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-sm shrink-0"
              style={{
                backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
              }}
            />
            <span className="text-[11px] text-text-ghost">
              {entry.tierName}
              <span className="ml-1 text-text-ghost">({entry.count})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { TierDistributionChart };
