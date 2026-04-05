/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@ambaril/ui/components/card";
import { useCountUp } from "@ambaril/shared/hooks/use-count-up";
import { Badge } from "@ambaril/ui/components/badge";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { FlareAlert } from "@ambaril/ui/components/flare-alert";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const REVENUE_DATA = [
  { day: "01", gmv: 14200 },
  { day: "02", gmv: 16800 },
  { day: "03", gmv: 12400 },
  { day: "04", gmv: 18300 },
  { day: "05", gmv: 21500 },
  { day: "06", gmv: 19200 },
  { day: "07", gmv: 15600 },
  { day: "08", gmv: 17800 },
  { day: "09", gmv: 20100 },
  { day: "10", gmv: 22400 },
  { day: "11", gmv: 18900 },
  { day: "12", gmv: 16200 },
  { day: "13", gmv: 14800 },
  { day: "14", gmv: 19700 },
  { day: "15", gmv: 23100 },
  { day: "16", gmv: 21800 },
  { day: "17", gmv: 17400 },
  { day: "18", gmv: 15900 },
  { day: "19", gmv: 18600 },
  { day: "20", gmv: 20800 },
  { day: "21", gmv: 24200 },
  { day: "22", gmv: 19500 },
  { day: "23", gmv: 16700 },
  { day: "24", gmv: 18100 },
  { day: "25", gmv: 21300 },
  { day: "26", gmv: 22900 },
  { day: "27", gmv: 17600 },
  { day: "28", gmv: 15200 },
  { day: "29", gmv: 19800 },
  { day: "30", gmv: 23400 },
];

const CHANNEL_DATA = [
  { channel: "Site", pedidos: 142, receita: 38400 },
  { channel: "Instagram", pedidos: 47, receita: 12800 },
  { channel: "WhatsApp", pedidos: 18, receita: 6200 },
  { channel: "B2B", pedidos: 11, receita: 14600 },
];

const ORDER_STATUS_MAP = {
  entregue: { label: "Entregue", variant: "success" as const },
  preparando: { label: "Preparando", variant: "warning" as const },
  enviado: { label: "Enviado", variant: "info" as const },
  cancelado: { label: "Cancelado", variant: "danger" as const },
  pendente: { label: "Pendente", variant: "default" as const },
};

const RECENT_ORDERS = [
  {
    id: "AM-4821",
    customer: "Lucas Ferreira",
    amount: "R$\u00a0489,90",
    status: "entregue",
    items: 3,
  },
  {
    id: "AM-4820",
    customer: "Beatriz Santos",
    amount: "R$\u00a0279,80",
    status: "preparando",
    items: 2,
  },
  {
    id: "AM-4819",
    customer: "Gabriel Oliveira",
    amount: "R$\u00a0159,90",
    status: "enviado",
    items: 1,
  },
  {
    id: "AM-4818",
    customer: "Mariana Costa",
    amount: "R$\u00a0349,70",
    status: "cancelado",
    items: 2,
  },
  {
    id: "AM-4817",
    customer: "Rafael Lima",
    amount: "R$\u00a0199,90",
    status: "pendente",
    items: 1,
  },
  {
    id: "AM-4816",
    customer: "Juliana Rocha",
    amount: "R$\u00a0520,00",
    status: "entregue",
    items: 4,
  },
  {
    id: "AM-4815",
    customer: "Carlos Mendes",
    amount: "R$\u00a0189,90",
    status: "enviado",
    items: 1,
  },
];

const TOP_PRODUCTS = [
  { name: "Camiseta Preta Básica", sold: 84, revenue: "R$\u00a015.036" },
  { name: "Moletom Oversize Cinza", sold: 42, revenue: "R$\u00a012.558" },
  { name: "Cap Ambaril Khaki", sold: 67, revenue: "R$\u00a06.566" },
  { name: "Calça Cargo Preta", sold: 31, revenue: "R$\u00a09.269" },
  { name: "Camiseta Listrada Navy", sold: 28, revenue: "R$\u00a05.012" },
];

const FUNNEL = [
  { label: "Sessões", value: "5.672", delta: "+14%" },
  { label: "Carrinho", value: "847", delta: "-3,2%" },
  { label: "Checkout", value: "312", delta: "+1,8%" },
  { label: "Pagamento", value: "248", delta: "+5,4%" },
  { label: "Concluído", value: "218", delta: "+8,1%" },
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function DeltaText({
  value,
  type,
}: {
  value: string;
  type: "positive" | "negative" | "neutral";
}) {
  const color =
    type === "positive"
      ? "text-success"
      : type === "negative"
        ? "text-danger"
        : "text-text-secondary";
  const arrow = type === "positive" ? "↑" : type === "negative" ? "↓" : "";
  return (
    <span
      className={`text-[12px] leading-normal tracking-[0.01em] font-medium ${color}`}
    >
      {arrow}
      {value}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
      {children}
    </p>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-[12px] shadow-lg"
      style={{
        backgroundColor: "var(--chart-tooltip-bg)",
        color: "var(--chart-tooltip-text)",
      }}
    >
      <p className="font-mono text-[13px] leading-normal tabular-nums">
        Dia {label} — R$&nbsp;{payload[0]?.value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI value with count-up animation
// ---------------------------------------------------------------------------

function KpiValue({ raw, display }: { raw: number; display: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const counted = useCountUp({
    end: raw,
    duration: 800,
    delay: 100,
    enabled: mounted,
  });

  // Determine format from the display string
  const hasPrefix = display.startsWith("R$");
  const hasPct = display.includes("%");
  const hasSku = display.includes("SKU");
  const hasPp = display.includes("pp");

  let formatted: string;
  if (hasPrefix) {
    formatted = `R$\u00a0${Math.round(counted).toLocaleString("pt-BR")}`;
  } else if (hasPct) {
    formatted = `${counted.toFixed(2).replace(".", ",")}%`;
  } else if (hasPp) {
    formatted = `+${counted.toFixed(1).replace(".", ",")}pp`;
  } else if (hasSku) {
    formatted = `${Math.round(counted)} SKUs`;
  } else {
    formatted = Math.round(counted).toLocaleString("pt-BR");
  }

  return (
    <p className="mt-0.5 font-mono text-[20px] leading-tight text-text-white tabular-nums animate-kpi-value">
      {formatted}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DesignLabDashboardPage() {
  const [chartPeriod, setChartPeriod] = useState<"7d" | "30d">("30d");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
              Bom dia, Marcus.
            </h1>
            <Badge variant="secondary">admin</Badge>
          </div>
          <p className="text-[12px] leading-normal tracking-[0.01em] text-text-secondary">
            Segunda-feira, 31 de março de 2026
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px] leading-normal tracking-[0.01em] text-text-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
          <span>Última sync: 2 min atrás</span>
        </div>
      </header>

      {/* Row 1: Broken Grid KPIs — Asymmetric Intention */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr_1fr]">
        {/* Hero KPI: GMV */}
        <Card className="p-5 shadow-[var(--shadow-md)] border-border-default bg-bg-base">
          <SectionLabel>Faturamento Mensal (GMV)</SectionLabel>
          <div className="mt-2 flex items-baseline gap-4">
            <p className="font-mono text-[40px] leading-tight text-text-white tabular-nums">
              R$&nbsp;523.400
            </p>
            <div className="flex flex-col">
              <DeltaText value="+8,2%" type="positive" />
              <span className="text-[10px] text-text-ghost">
                vs mês anterior
              </span>
            </div>
          </div>
          {/* Sparkline sutil - sensor vibe */}
          <div className="mt-4 h-[40px] opacity-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA.slice(-14)}>
                <Area
                  type="monotone"
                  dataKey="gmv"
                  stroke="var(--success)"
                  strokeWidth={1}
                  fill="transparent"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Secondary KPIs: Conversão e Pedidos */}
        <div className="flex flex-col gap-6">
          <Card className="flex-1 p-4 shadow-[var(--shadow-sm)] border-border-subtle hover:border-border-default transition-colors">
            <SectionLabel>Conversão</SectionLabel>
            <KpiValue raw={3.84} display="3,84%" />
            <DeltaText value="+0,3pp" type="positive" />
          </Card>
          <Card className="flex-1 p-4 shadow-[var(--shadow-sm)] border-border-subtle hover:border-border-default transition-colors">
            <SectionLabel>Pedidos</SectionLabel>
            <KpiValue raw={218} display="218" />
            <DeltaText value="+8,1%" type="positive" />
          </Card>
        </div>

        {/* Stats Column: CAC e Estoque */}
        <div className="flex flex-col gap-6">
          <Card className="flex-1 p-4 shadow-[var(--shadow-sm)] border-border-subtle hover:border-border-default transition-colors">
            <SectionLabel>CAC</SectionLabel>
            <KpiValue raw={28.4} display="R$ 28,40" />
            <DeltaText value="-4,7%" type="positive" />
          </Card>
          <Card className="flex-1 p-4 shadow-[var(--shadow-sm)] border-border-subtle hover:border-border-default transition-colors bg-danger-muted/5">
            <SectionLabel>Estoque Crítico</SectionLabel>
            <KpiValue raw={7} display="7 SKUs" />
            <DeltaText value="+2" type="negative" />
          </Card>
        </div>
      </div>

      {/* Row 2: Funnel (now secondary to broken KPIs) */}
      <Card className="p-0 shadow-[var(--shadow-sm)] border-border-subtle overflow-hidden">
        <div className="flex items-center gap-0 divide-x divide-border-subtle overflow-x-auto bg-bg-void/30">
          {FUNNEL.map((step, i) => {
            const isPositive = step.delta.startsWith("+");
            return (
              <div
                key={step.label}
                className="flex min-w-[120px] flex-1 flex-col px-5 py-4"
              >
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                  {step.label}
                </p>
                <p className="mt-0.5 font-mono text-[16px] leading-tight text-text-white tabular-nums">
                  {step.value}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <DeltaText
                    value={step.delta}
                    type={isPositive ? "positive" : "negative"}
                  />
                  {i < FUNNEL.length - 1 && (
                    <span className="text-[10px] text-text-ghost">→</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Row 3: Detail Charts — No full-width charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left: GMV Area Chart (Not full width) */}
        <Card className="p-5 shadow-[var(--shadow-sm)] border-border-subtle flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <SectionLabel>Performance de Vendas</SectionLabel>
            <div className="flex rounded-md border border-border-subtle overflow-hidden">
              {(["7d", "30d"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer ${p !== "7d" ? "border-l border-border-subtle" : ""} ${chartPeriod === p ? "bg-bg-raised text-text-white" : "text-text-muted hover:text-text-primary"}`}
                >
                  {p === "7d" ? "7d" : "30d"}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] mt-auto">
            <ResponsiveContainer key={chartPeriod} width="100%" height="100%">
              <AreaChart
                data={
                  chartPeriod === "7d" ? REVENUE_DATA.slice(-7) : REVENUE_DATA
                }
                margin={{ top: 4, right: 4, bottom: 0, left: -12 }}
              >
                <defs>
                  <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--chart-line)"
                      stopOpacity={0.08}
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
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 9,
                    fontFamily: "var(--font-mono)",
                    fill: "var(--text-ghost)",
                  }}
                  interval={chartPeriod === "7d" ? 0 : 5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 9,
                    fontFamily: "var(--font-mono)",
                    fill: "var(--text-ghost)",
                  }}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  width={36}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="gmv"
                  stroke="var(--chart-line)"
                  strokeWidth={1.5}
                  fill="url(#gmvGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Top: Bar Chart — Category breakdown */}
          <Card className="p-5 shadow-[var(--shadow-sm)] border-border-subtle">
            <SectionLabel>Canais de Conversão</SectionLabel>
            <div className="mt-4 h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={CHANNEL_DATA}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                  barSize={12}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="channel"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--text-primary)" }}
                    width={70}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded border border-border-subtle bg-bg-elevated px-2 py-1.5 text-[11px] shadow-lg">
                          <p className="font-mono tabular-nums text-text-white">
                            {payload[0]?.value} pedidos
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="pedidos"
                    fill="var(--chart-1)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Bottom: Top Produtos */}
          <Card className="p-4 shadow-[var(--shadow-sm)] border-border-subtle flex-1">
            <SectionLabel>Top produtos</SectionLabel>
            <div className="stagger-children mt-3 flex flex-col gap-3">
              {TOP_PRODUCTS.slice(0, 4).map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bg-raised text-[10px] font-medium text-text-muted">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] text-text-primary">
                        {p.name}
                      </p>
                      <span className="shrink-0 font-mono text-[12px] tabular-nums text-text-muted">
                        {p.revenue}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Row 4: Orders table + Alerts — 3:2 ratio */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Recent Orders */}
        <Card className="p-4 shadow-[var(--shadow-sm)]">
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>Pedidos recentes</SectionLabel>
            <button
              type="button"
              className="text-xs font-medium text-info hover:underline"
            >
              Ver todos →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-[14px] leading-[1.65]">
              <thead>
                <tr className="border-b border-border-subtle text-left">
                  <th className="px-3 py-2 font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                    #Pedido
                  </th>
                  <th className="px-3 py-2 font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                    Cliente
                  </th>
                  <th className="px-3 py-2 text-right font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                    Valor
                  </th>
                  <th className="px-3 py-2 font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                    Itens
                  </th>
                  <th className="px-3 py-2 font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="stagger-children">
                {RECENT_ORDERS.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border-subtle transition-colors last:border-0 hover:bg-[var(--table-row-hover)] cursor-pointer"
                  >
                    <td className="px-3 py-2 font-mono text-[13px] leading-normal text-text-muted tabular-nums">
                      {order.id}
                    </td>
                    <td className="min-w-0 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-raised text-[10px] font-medium text-text-secondary">
                          {order.customer.charAt(0)}
                        </span>
                        <span className="truncate text-text-primary">
                          {order.customer}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[13px] leading-normal tabular-nums text-text-white">
                      {order.amount}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {order.items}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        status={order.status}
                        statusMap={ORDER_STATUS_MAP}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Flare Alerts */}
        <div className="stagger-children flex flex-col gap-3">
          <SectionLabel>Alertas Flare</SectionLabel>
          <FlareAlert
            variant="warning"
            pulse
            message="Estoque crítico: Camiseta Preta P — 3 unidades restantes."
            actionLabel="Ver produto"
            onAction={() => {}}
          />
          <FlareAlert
            variant="danger"
            message="Pedido #AM-4799 atrasado há 48h. Transportadora sem atualização."
            actionLabel="Rastrear"
            onAction={() => {}}
          />
          <div className="flare-success">
            <FlareAlert
              variant="success"
              message={`Meta diária atingida: R$\u00a030.000 em vendas hoje.`}
            />
          </div>

          {/* Mini equipe stats — like dashboards-7 sidebar */}
          <Card className="mt-1 p-4 shadow-[var(--shadow-sm)]">
            <SectionLabel>Equipe hoje</SectionLabel>
            <div className="mt-3 flex flex-col gap-2">
              {[
                {
                  name: "Ana Clara",
                  role: "Logística",
                  metric: "12 envios",
                  status: "online",
                },
                {
                  name: "Slimgust",
                  role: "Suporte",
                  metric: "8 tickets",
                  status: "online",
                },
                {
                  name: "Tavares",
                  role: "PCP",
                  metric: "3 ordens",
                  status: "away",
                },
              ].map((member) => (
                <div key={member.name} className="flex items-center gap-3">
                  <div className="relative">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-raised text-[10px] font-medium text-text-secondary">
                      {member.name.charAt(0)}
                    </span>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-bg-base ${member.status === "online" ? "bg-success" : "bg-warning"}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium leading-[1.65] text-text-primary">
                      {member.name}
                    </p>
                    <p className="text-[12px] leading-normal tracking-[0.01em] text-text-muted">
                      {member.role} ·{" "}
                      <span className="font-mono text-[13px] tabular-nums">
                        {member.metric}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
