"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@ambaril/ui/components/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RoiChartProps {
  totalCosts: number;
  totalRevenue: number;
  roi: number | null;
}

interface ChartDataItem {
  name: string;
  value: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadItem {
  value: number;
  payload: ChartDataItem;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  if (!item) return null;

  return (
    <div className="rounded-md border border-border-default bg-bg-elevated px-3 py-2 shadow-md">
      <p className="text-xs text-text-ghost">{item.payload.name}</p>
      <p className="font-mono text-sm font-medium text-text-bright">
        {formatCurrency(item.value)}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RoiChart({ totalCosts, totalRevenue, roi }: RoiChartProps) {
  const data: ChartDataItem[] = [
    { name: "Custos", value: totalCosts },
    { name: "Receita", value: totalRevenue },
  ];

  const colors = ["var(--danger)", "var(--success)"];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-medium text-text-bright">ROI da Campanha</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs text-text-ghost">Custo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-mono text-lg font-medium text-danger">
              {formatCurrency(totalCosts)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs text-text-ghost">
              Receita Atribuida (GMV)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-mono text-lg font-medium text-success">
              {formatCurrency(totalRevenue)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs text-text-ghost">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-mono text-lg font-medium text-text-bright">
              {roi !== null ? `${roi.toFixed(1)}%` : "N/A"}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="pt-4">
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
            >
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                tickFormatter={(v: number) =>
                  `R$ ${(v / 1000).toFixed(0)}k`
                }
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
