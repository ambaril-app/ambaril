/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import {
  Bell,
  Check,
  Package,
  AlertTriangle,
  MessageCircle,
  TrendingUp,
  Clock,
  Filter,
  MoreHorizontal,
  Archive,
  RefreshCw,
} from "lucide-react";
import { cn } from "@ambaril/ui/lib/utils";
import { Button } from "@ambaril/ui/components/button";
import { Badge } from "@ambaril/ui/components/badge";

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------

type NotificationType =
  | "alert"
  | "system"
  | "social"
  | "production"
  | "logistics";
type NotificationStatus = "unread" | "read" | "archived";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  status: NotificationStatus;
  module: string;
  actionLabel?: string;
  meta?: string;
}

const NOTIFICATIONS: Notification[] = [
  // Today
  {
    id: "n1",
    type: "alert",
    module: "ERP",
    title: "Estoque Crítico: Camiseta Oversized Noir",
    description:
      "Apenas 3 unidades restantes no tamanho M. Previsão de esgotamento em 2 dias.",
    timestamp: "10 min atrás",
    status: "unread",
    actionLabel: "Ver produto",
    meta: "SKU: TS-NOIR-M",
  },
  {
    id: "n2",
    type: "production",
    module: "PLM",
    title: "Atraso reportado: Estamparia Lote 47",
    description:
      "Fornecedor 'Silk&Co' reportou atraso de 2 dias na entrega. Novo prazo: 15/04.",
    timestamp: "2h atrás",
    status: "unread",
    actionLabel: "Ajustar OP",
  },
  {
    id: "n3",
    type: "logistics",
    module: "ERP",
    title: "Lote de etiquetas Melhor Envio gerado",
    description: "42 etiquetas prontas para impressão e expedição.",
    timestamp: "4h atrás",
    status: "unread",
    actionLabel: "Imprimir",
  },
  // Yesterday
  {
    id: "n4",
    type: "social",
    module: "CRM",
    title: "Novo Creator atingiu Tier BLOOM",
    description:
      "Lucas Ferreira bateu R$ 10k em vendas geradas e subiu de tier.",
    timestamp: "Ontem, 16:45",
    status: "read",
    actionLabel: "Ver perfil",
    meta: "Tier anterior: GROW",
  },
  {
    id: "n5",
    type: "system",
    module: "Astro",
    title: "Insight: Pico de vendas detectado",
    description:
      "Aumento de 340% nas vendas do 'Bucket Hat Concrete' nas últimas 4 horas. Origem: TikTok orgânico.",
    timestamp: "Ontem, 14:20",
    status: "read",
    actionLabel: "Ver relatório",
  },
  {
    id: "n6",
    type: "alert",
    module: "Trocas",
    title: "Devolução pendente de análise",
    description:
      "Pedido #AM-4788 chegou ao centro de distribuição e aguarda conferência (Ana Santos).",
    timestamp: "Ontem, 10:15",
    status: "read",
    actionLabel: "Analisar",
  },
  // Older
  {
    id: "n7",
    type: "system",
    module: "Integrações",
    title: "Focus NFe autenticado com sucesso",
    description:
      "A integração fiscal está ativa. Certificado digital válido até 10/2027.",
    timestamp: "28 Mar, 09:00",
    status: "archived",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  alert: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning-muted" },
  production: { icon: RefreshCw, color: "text-info", bg: "bg-info-muted" },
  social: {
    icon: MessageCircle,
    color: "text-org-violet-text",
    bg: "bg-org-violet-bg",
  },
  system: { icon: TrendingUp, color: "text-success", bg: "bg-success-muted" },
  logistics: {
    icon: Package,
    color: "text-org-cyan-text",
    bg: "bg-org-cyan-bg",
  },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
        {children}
      </p>
      <div className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = React.useState<"inbox" | "archived">(
    "inbox",
  );
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Filter data based on tab
  const displayData = React.useMemo(() => {
    return NOTIFICATIONS.filter((n) =>
      activeTab === "inbox" ? n.status !== "archived" : n.status === "archived",
    );
  }, [activeTab]);

  // Group by time roughly (Today, Yesterday, Older)
  const groupedData = React.useMemo(() => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const older: Notification[] = [];

    for (const item of displayData) {
      if (item.timestamp.includes("atrás")) today.push(item);
      else if (item.timestamp.includes("Ontem")) yesterday.push(item);
      else older.push(item);
    }

    return { Hoje: today, Ontem: yesterday, Anteriores: older };
  }, [displayData]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const markAllRead = () => {
    // Implement mutation logic
    setSelectedIds((newSet) => new Set());
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 flex flex-col h-[calc(100dvh-64px)]">
      {/* Header — Linear style, very clean */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-raised border border-border-subtle">
              <Bell className="h-5 w-5 text-text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-[28px] font-medium leading-[1.2] tracking-tight text-text-white">
              Inbox
            </h1>
            {/* Unread badge */}
            <span className="flex h-5 items-center justify-center rounded-full bg-btn-primary-bg px-2 text-[11px] font-mono font-medium text-btn-primary-text">
              3
            </span>
          </div>
          <p className="mt-2 text-[13px] text-text-secondary">
            Alertas do sistema, atualizações de módulos e mensagens não lidas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Marcar tudo como lido
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Filtros
          </Button>
        </div>
      </header>

      {/* Main Layout — Asymmetric Break (List 3fr | Summary 1fr) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 min-h-0 flex-1">
        {/* Left Column: Notification Feed */}
        <div className="flex flex-col min-h-0 overflow-hidden rounded-xl border border-border-subtle bg-bg-base shadow-[var(--shadow-sm)]">
          {/* Tabs bar */}
          <div className="flex items-center justify-between border-b border-border-subtle px-2 bg-bg-void/50">
            <div className="flex">
              <button
                onClick={() => setActiveTab("inbox")}
                className={cn(
                  "relative px-4 py-3 text-[13px] font-medium transition-colors cursor-pointer",
                  activeTab === "inbox"
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-primary",
                )}
              >
                Caixa de entrada
                {activeTab === "inbox" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("archived")}
                className={cn(
                  "relative px-4 py-3 text-[13px] font-medium transition-colors cursor-pointer",
                  activeTab === "archived"
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-primary",
                )}
              >
                Arquivados
                {activeTab === "archived" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary" />
                )}
              </button>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 px-2 animate-fade-in">
                <span className="text-[12px] text-text-muted font-mono">
                  {selectedIds.size} selecionadas
                </span>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* List content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
            {displayData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-8">
                <Bell
                  className="mb-4 h-8 w-8 text-text-ghost opacity-40"
                  strokeWidth={1}
                />
                <h3 className="font-display text-[18px] font-medium text-text-primary">
                  Tudo limpo por aqui
                </h3>
                <p className="mt-1 text-[13px] text-text-secondary">
                  Você não tem novas notificações no momento.
                </p>
              </div>
            ) : (
              <div className="stagger-children flex flex-col pb-4">
                {Object.entries(groupedData).map(([group, items]) => {
                  if (items.length === 0) return null;
                  return (
                    <div key={group}>
                      <div className="px-3">
                        <SectionLabel>{group}</SectionLabel>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {items.map((item) => {
                          const conf = TYPE_CONFIG[item.type];
                          const Icon = conf.icon;
                          const isUnread = item.status === "unread";
                          const isSelected = selectedIds.has(item.id);

                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "group relative flex items-start gap-4 rounded-lg p-3 transition-colors",
                                isSelected
                                  ? "bg-bg-raised"
                                  : "hover:bg-bg-raised/50",
                                isUnread ? "bg-bg-void" : "opacity-80",
                              )}
                            >
                              {/* Selection overlay (Linear style: appears on hover or active) */}
                              <div className="pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => toggleSelection(item.id)}
                                  className={cn(
                                    "flex h-4 w-4 items-center justify-center rounded border transition-colors cursor-pointer",
                                    isSelected
                                      ? "border-btn-primary-bg bg-btn-primary-bg text-btn-primary-text"
                                      : "border-border-strong hover:border-text-muted",
                                  )}
                                >
                                  {isSelected && (
                                    <Check
                                      className="h-3 w-3"
                                      strokeWidth={3}
                                    />
                                  )}
                                </button>
                              </div>

                              {/* Icon indicator */}
                              <div
                                className={cn(
                                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                                  conf.bg,
                                )}
                              >
                                <Icon
                                  className={cn("h-3.5 w-3.5", conf.color)}
                                  strokeWidth={2}
                                />
                              </div>

                              {/* Content */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  {isUnread && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-info" />
                                  )}
                                  <span className="text-[10px] font-mono text-text-ghost uppercase tracking-wider">
                                    {item.module}
                                  </span>
                                  <span className="ml-auto text-[11px] font-mono text-text-ghost tabular-nums">
                                    {item.timestamp}
                                  </span>
                                </div>

                                <p
                                  className={cn(
                                    "mt-1 text-[14px] leading-snug",
                                    isUnread
                                      ? "font-medium text-text-primary"
                                      : "text-text-secondary",
                                  )}
                                >
                                  {item.title}
                                </p>

                                <p className="mt-1 text-[13px] leading-relaxed text-text-secondary line-clamp-2">
                                  {item.description}
                                </p>

                                {/* Meta & Actions */}
                                {(item.meta || item.actionLabel) && (
                                  <div className="mt-3 flex items-center gap-3">
                                    {item.actionLabel && (
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        className="h-7 text-[11px]"
                                      >
                                        {item.actionLabel}
                                      </Button>
                                    )}
                                    {item.meta && (
                                      <span className="font-mono text-[11px] text-text-muted border-l border-border-subtle pl-3">
                                        {item.meta}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Hover actions (Archive, Mark read) */}
                              <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-bg-raised/80 backdrop-blur-sm rounded-md border border-border-subtle p-0.5">
                                <button
                                  title="Arquivar"
                                  className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-surface cursor-pointer"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  title="Mais opções"
                                  className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-surface cursor-pointer"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Context/Summary Panel */}
        <div className="hidden lg:flex flex-col gap-4">
          <div className="rounded-xl border border-border-subtle bg-bg-base p-4 shadow-[var(--shadow-sm)]">
            <h3 className="font-display text-[14px] font-medium text-text-primary mb-3">
              Resumo do dia
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-[12px]">
                <span className="flex items-center gap-2 text-text-secondary">
                  <AlertTriangle
                    className="h-3.5 w-3.5 text-warning"
                    strokeWidth={1.5}
                  />
                  Avisos críticos
                </span>
                <span className="font-mono font-medium text-text-primary">
                  2
                </span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="flex items-center gap-2 text-text-secondary">
                  <TrendingUp
                    className="h-3.5 w-3.5 text-success"
                    strokeWidth={1.5}
                  />
                  Insights Astro
                </span>
                <span className="font-mono font-medium text-text-primary">
                  1
                </span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="flex items-center gap-2 text-text-secondary">
                  <Package
                    className="h-3.5 w-3.5 text-info"
                    strokeWidth={1.5}
                  />
                  Logística/PCP
                </span>
                <span className="font-mono font-medium text-text-primary">
                  3
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-bg-void p-4">
            <h3 className="font-display text-[12px] uppercase tracking-wider font-semibold text-text-muted mb-2">
              Configurações
            </h3>
            <p className="text-[12px] leading-relaxed text-text-secondary mb-3">
              Você pode ajustar quais eventos geram notificações no seu painel
              ou via Discord (Pulse).
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-[12px]"
            >
              <Bell className="mr-2 h-3.5 w-3.5" />
              Preferências de alerta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
