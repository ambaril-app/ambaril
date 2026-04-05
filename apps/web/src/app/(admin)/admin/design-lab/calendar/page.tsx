/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { Badge } from "@ambaril/ui/components/badge";
import { Button } from "@ambaril/ui/components/button";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  FileText,
  Phone,
  Mail,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrgColor =
  | "rose"
  | "violet"
  | "blue"
  | "cyan"
  | "emerald"
  | "orange"
  | "slate";

interface CalendarEvent {
  id: string;
  title: string;
  date: number;
  color: OrgColor;
  type: string;
  description: string;
  assignee: string;
  assigneeInitials: string;
  assigneeColor: string;
  time: string;
}

// ---------------------------------------------------------------------------
// Mock data — Março 2026
// ---------------------------------------------------------------------------

const EVENTS: CalendarEvent[] = [
  {
    id: "ev-1",
    title: "Drop Verão",
    date: 1,
    color: "rose",
    type: "Lançamento",
    description:
      "Drop de verão com 12 peças novas. Coordenar stories, reels e post no feed.",
    assignee: "Yuri",
    assigneeInitials: "Y",
    assigneeColor: "bg-org-rose-bg text-org-rose-text",
    time: "10:00",
  },
  {
    id: "ev-2",
    title: "Shooting KV",
    date: 5,
    color: "violet",
    type: "Produção",
    description:
      "Sessão de fotos para key visuals da coleção. Estúdio reservado.",
    assignee: "Sick",
    assigneeInitials: "S",
    assigneeColor: "bg-org-violet-bg text-org-violet-text",
    time: "14:00",
  },
  {
    id: "ev-3",
    title: "Post Instagram",
    date: 10,
    color: "blue",
    type: "Social",
    description: "Post carrossel com lookbook da coleção verão. 5 slides.",
    assignee: "Yuri",
    assigneeInitials: "Y",
    assigneeColor: "bg-org-rose-bg text-org-rose-text",
    time: "18:00",
  },
  {
    id: "ev-4",
    title: "Stories",
    date: 10,
    color: "cyan",
    type: "Social",
    description: "Sequência de 8 stories mostrando bastidores da produção.",
    assignee: "Sick",
    assigneeInitials: "S",
    assigneeColor: "bg-org-violet-bg text-org-violet-text",
    time: "12:00",
  },
  {
    id: "ev-5",
    title: "Campanha WA",
    date: 15,
    color: "emerald",
    type: "Marketing",
    description: "Disparo segmentado para base VIP. Desconto 15%.",
    assignee: "Caio",
    assigneeInitials: "C",
    assigneeColor: "bg-org-blue-bg text-org-blue-text",
    time: "09:00",
  },
  {
    id: "ev-6",
    title: "Drop Collab",
    date: 20,
    color: "orange",
    type: "Lançamento",
    description: "Collab com artista local. 5 peças limitadas.",
    assignee: "Yuri",
    assigneeInitials: "Y",
    assigneeColor: "bg-org-rose-bg text-org-rose-text",
    time: "11:00",
  },
  {
    id: "ev-7",
    title: "Review mensal",
    date: 25,
    color: "slate",
    type: "Planejamento",
    description: "Revisão de métricas: alcance, engajamento, conversão.",
    assignee: "Caio",
    assigneeInitials: "C",
    assigneeColor: "bg-org-blue-bg text-org-blue-text",
    time: "16:00",
  },
  {
    id: "ev-8",
    title: "Deadline NF-e",
    date: 31,
    color: "slate",
    type: "Fiscal",
    description: "Prazo final para emissão de notas fiscais do mês.",
    assignee: "Pedro",
    assigneeInitials: "P",
    assigneeColor: "bg-org-emerald-bg text-org-emerald-text",
    time: "23:59",
  },
  {
    id: "ev-9",
    title: "Reels making of",
    date: 7,
    color: "violet",
    type: "Social",
    description: "Vídeo de making of do shooting da coleção.",
    assignee: "Sick",
    assigneeInitials: "S",
    assigneeColor: "bg-org-violet-bg text-org-violet-text",
    time: "15:00",
  },
  {
    id: "ev-10",
    title: "Email base",
    date: 12,
    color: "blue",
    type: "Marketing",
    description: "Newsletter mensal com destaques e novos produtos.",
    assignee: "Caio",
    assigneeInitials: "C",
    assigneeColor: "bg-org-blue-bg text-org-blue-text",
    time: "10:00",
  },
];

const EVENT_DOT_COLOR: Record<OrgColor, string> = {
  rose: "bg-org-rose-text",
  violet: "bg-org-violet-text",
  blue: "bg-org-blue-text",
  cyan: "bg-org-cyan-text",
  emerald: "bg-org-emerald-text",
  orange: "bg-org-orange-text",
  slate: "bg-org-slate-text",
};

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOffset(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

// ---------------------------------------------------------------------------
// Page — following calendar-1 ref closely
// ---------------------------------------------------------------------------

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    EVENTS[EVENTS.length - 1] ?? null,
  );

  const year = 2026;
  const month = 2; // March
  const today = 31;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOffset = getFirstDayOffset(year, month);

  // Build grid (Mon-Fri only, like calendar-1 ref shows business days)
  // Actually calendar-1 shows Mon-Fri. Let me do full 5-day grid.
  // But the ref does show Mon-Fri only. Let me match that.
  const weeks: (number | null)[][] = [];
  const currentDay = 1;
  // Skip days before the first Monday
  const firstWeekday = firstDayOffset; // 0=Mon

  // Build week rows (Mon-Fri)
  let weekStart = 1 - firstWeekday;
  while (weekStart <= daysInMonth) {
    const week: (number | null)[] = [];
    for (let i = 0; i < 5; i++) {
      const d = weekStart + i;
      if (d >= 1 && d <= daysInMonth) {
        week.push(d);
      } else {
        week.push(null);
      }
    }
    weeks.push(week);
    weekStart += 7;
  }

  function getEventsForDay(day: number) {
    return EVENTS.filter((e) => e.date === day);
  }

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 flex flex-col h-[calc(100dvh-48px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border-subtle overflow-hidden">
            <button
              type="button"
              className="px-3 py-1.5 text-[12px] font-medium bg-bg-raised text-text-white cursor-pointer"
            >
              Mês
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-[12px] font-medium text-text-muted hover:text-text-primary border-l border-border-subtle cursor-pointer"
            >
              Semana
            </button>
          </div>
          {/* Month nav */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg-raised transition-colors cursor-pointer"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[120px] text-center text-[14px] font-medium text-text-primary">
              Março 2026
            </span>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg-raised transition-colors cursor-pointer"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="text-[12px] text-text-muted">Este mês</span>
        </div>
        <Button size="sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Evento
        </Button>
      </div>

      {/* Main: Calendar grid + detail panel (like calendar-1: grid left, detail right) */}
      <div className="flex flex-1 min-h-0 border-t border-border-subtle">
        {/* Calendar grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-5 border-b border-border-subtle">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="px-3 py-2 text-[12px] font-medium text-text-muted"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Week rows */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {weeks.map((week, wi) => (
              <div
                key={wi}
                className="grid grid-cols-5 flex-1 min-h-[120px] border-b border-border-subtle last:border-0"
              >
                {week.map((day, di) => {
                  const isToday = day === today;
                  const events = day ? getEventsForDay(day) : [];
                  return (
                    <div
                      key={di}
                      className={`border-r border-border-subtle last:border-0 px-2 py-1.5 transition-colors ${
                        !day ? "bg-bg-raised/20" : "hover:bg-bg-raised/30"
                      } ${isToday ? "bg-bg-raised" : ""}`}
                    >
                      {day && (
                        <>
                          <span
                            className={`inline-block text-[13px] font-mono tabular-nums mb-1 ${
                              isToday
                                ? "font-medium text-text-white animate-subtle-pulse"
                                : "text-text-secondary"
                            }`}
                          >
                            {day}
                          </span>
                          <div className="flex flex-col gap-1">
                            {events.map((ev) => (
                              <button
                                key={ev.id}
                                type="button"
                                onClick={() => setSelectedEvent(ev)}
                                className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors cursor-pointer hover:bg-bg-surface/50 ${
                                  selectedEvent?.id === ev.id
                                    ? "bg-bg-surface"
                                    : ""
                                }`}
                              >
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${ev.assigneeColor}`}
                                >
                                  {ev.assigneeInitials}
                                </span>
                                <span className="truncate text-[12px] text-text-primary">
                                  {ev.title}
                                </span>
                                <span className="ml-auto shrink-0 font-mono text-[10px] text-text-ghost">
                                  {ev.time}
                                </span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — event/contact detail (like calendar-1 right panel) */}
        <aside className="w-[300px] shrink-0 border-l border-border-subtle bg-bg-base overflow-y-auto scrollbar-thin">
          {selectedEvent ? (
            <div className="animate-slide-in-right">
              {/* Event header */}
              <div className="flex flex-col items-center border-b border-border-subtle px-5 py-6">
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-[18px] font-medium ${selectedEvent.assigneeColor}`}
                >
                  {selectedEvent.assigneeInitials}
                </span>
                <p className="mt-3 text-[15px] font-medium text-text-white">
                  {selectedEvent.assignee}
                </p>
                <p className="text-[12px] text-text-muted">
                  @{selectedEvent.assignee.toLowerCase()}
                </p>
                <Badge variant={selectedEvent.color} className="mt-2">
                  {selectedEvent.type}
                </Badge>
              </div>

              {/* Event details */}
              <div className="px-5 py-4 border-b border-border-subtle">
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-2">
                  Evento
                </p>
                <p className="text-[15px] font-medium text-text-white mb-1">
                  {selectedEvent.title}
                </p>
                <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                  <Clock className="h-3.5 w-3.5 text-text-ghost" />
                  <span>
                    {selectedEvent.date} de Março, 2026 · {selectedEvent.time}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="px-5 py-4 border-b border-border-subtle">
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-2">
                  Descrição
                </p>
                <p className="text-[13px] leading-[1.65] text-text-secondary">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Tabs (like calendar-1: Profile, Insights, Timeline, Team, Calls) */}
              <div className="flex border-b border-border-subtle px-5">
                {["Detalhes", "Timeline", "Equipe"].map((tab, i) => (
                  <button
                    key={tab}
                    type="button"
                    className={`px-3 py-2 text-[12px] font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                      i === 0
                        ? "border-text-white text-text-white"
                        : "border-transparent text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Contact info */}
              <div className="px-5 py-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-3.5 w-3.5 text-text-ghost" />
                    <span className="font-mono text-[12px] text-text-secondary">
                      (21) 99812-3456
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-3.5 w-3.5 text-text-ghost" />
                    <span className="text-[12px] text-text-secondary">
                      {selectedEvent.assignee.toLowerCase()}@ciena.com.br
                    </span>
                  </div>
                </div>

                {/* Related events timeline */}
                <div className="mt-5">
                  <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-3">
                    Próximos eventos
                  </p>
                  <div className="flex flex-col gap-2 stagger-children">
                    {EVENTS.filter(
                      (e) =>
                        e.assignee === selectedEvent.assignee &&
                        e.id !== selectedEvent.id,
                    )
                      .slice(0, 3)
                      .map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelectedEvent(ev)}
                          className="flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-bg-raised transition-colors cursor-pointer"
                        >
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${EVENT_DOT_COLOR[ev.color]}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-medium text-text-primary truncate">
                              {ev.title}
                            </p>
                            <p className="font-mono text-[10px] text-text-ghost">
                              {ev.date} Mar · {ev.time}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <FileText className="h-8 w-8 text-text-ghost opacity-40 mb-3" />
              <p className="text-[13px] text-text-muted">
                Clique em um evento no calendário para ver detalhes.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
