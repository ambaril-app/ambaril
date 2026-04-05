"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Table2,
  FileText,
  MessageCircle,
  Columns3,
  Calendar,
  GanttChart,
  Inbox,
  ClipboardList,
  Settings,
  Bell,
} from "lucide-react";
import { Badge } from "@ambaril/ui/components/badge";

const cards = [
  {
    title: "Dashboard",
    description: "KPI cards, charts, alerts, F-pattern",
    href: "/admin/design-lab/dashboard",
    icon: LayoutDashboard,
    level: "Level 1",
    levelVariant: "info" as const,
  },
  {
    title: "Tabelas",
    description: "Data tables, filtros, paginação, sheets",
    href: "/admin/design-lab/tables",
    icon: Table2,
    level: "Level 0",
    levelVariant: "secondary" as const,
  },
  {
    title: "Formulários",
    description: "Form Shopify-style, modais, step wizard",
    href: "/admin/design-lab/forms",
    icon: FileText,
    level: "Level 0",
    levelVariant: "secondary" as const,
  },
  {
    title: "Chat & Inbox",
    description: "Inbox unificado, AI chat, threads",
    href: "/admin/design-lab/chat",
    icon: MessageCircle,
    level: "Level 1",
    levelVariant: "info" as const,
  },
  {
    title: "Kanban",
    description: "Board, drag-drop, cards, swimlanes",
    href: "/admin/design-lab/kanban",
    icon: Columns3,
    level: "Level 0-1",
    levelVariant: "secondary" as const,
  },
  {
    title: "Calendário",
    description: "Mês/semana, eventos, sheets laterais",
    href: "/admin/design-lab/calendar",
    icon: Calendar,
    level: "Level 1",
    levelVariant: "info" as const,
  },
  {
    title: "Gantt",
    description: "Timeline, barras, dependências, zoom",
    href: "/admin/design-lab/gantt",
    icon: GanttChart,
    level: "Level 0-1",
    levelVariant: "secondary" as const,
  },
  {
    title: "Notificações",
    description: "Inbox, alertas globais, unread states",
    href: "/admin/design-lab/notifications",
    icon: Bell,
    level: "Level 1",
    levelVariant: "info" as const,
  },
  {
    title: "Empty States",
    description: "Zero data, upsell, onboarding, first-run",
    href: "/admin/design-lab/empty-states",
    icon: Inbox,
    level: "Level 2",
    levelVariant: "warning" as const,
  },
  {
    title: "Detail Page",
    description: "Pedido full-page, timeline, metadata",
    href: "/admin/design-lab/detail",
    icon: ClipboardList,
    level: "Level 0",
    levelVariant: "secondary" as const,
  },
  {
    title: "Configurações",
    description: "Settings, integrações, toggles, tabs",
    href: "/admin/design-lab/settings",
    icon: Settings,
    level: "Level 0",
    levelVariant: "secondary" as const,
  },
] as const;

export default function DesignLabPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
          Design Lab
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Referência viva de componentes e patterns do Ambaril.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="group">
              <div className="bg-bg-base border border-border-subtle rounded-xl p-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-border-default hover:-translate-y-px transition-all duration-200 cursor-pointer h-full flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <Icon className="h-5 w-5 text-text-muted" />
                  <Badge variant={card.levelVariant}>{card.level}</Badge>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-medium text-text-bright">
                    {card.title}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {card.description}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
