/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { Badge } from "@ambaril/ui/components/badge";
import { Button } from "@ambaril/ui/components/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------

type OrgColor =
  | "rose"
  | "violet"
  | "blue"
  | "cyan"
  | "emerald"
  | "orange"
  | "amber";
type Priority = "alta" | "media" | "baixa";

interface GanttTask {
  id: string;
  name: string;
  start: number;
  end: number;
  color: OrgColor;
  priority: Priority;
  progress: number;
  group: string;
  assignee: string;
}

const TASKS: GanttTask[] = [
  {
    id: "t1",
    name: "Corte Camiseta Preta",
    start: 1,
    end: 4,
    color: "rose",
    priority: "alta",
    progress: 100,
    group: "Lote 47",
    assignee: "Tavares",
  },
  {
    id: "t2",
    name: "Costura Camiseta Preta",
    start: 4,
    end: 9,
    color: "rose",
    priority: "alta",
    progress: 85,
    group: "Lote 47",
    assignee: "Tavares",
  },
  {
    id: "t3",
    name: "Estamparia Lote 47",
    start: 9,
    end: 14,
    color: "violet",
    priority: "alta",
    progress: 60,
    group: "Lote 47",
    assignee: "Tavares",
  },
  {
    id: "t4",
    name: "Embalagem Lote 47",
    start: 14,
    end: 17,
    color: "cyan",
    priority: "media",
    progress: 0,
    group: "Lote 47",
    assignee: "Ana Clara",
  },
  {
    id: "t5",
    name: "Corte Moletom Oversize",
    start: 6,
    end: 11,
    color: "emerald",
    priority: "media",
    progress: 70,
    group: "Lote 48",
    assignee: "Tavares",
  },
  {
    id: "t6",
    name: "Costura Moletom",
    start: 11,
    end: 18,
    color: "emerald",
    priority: "media",
    progress: 30,
    group: "Lote 48",
    assignee: "Tavares",
  },
  {
    id: "t7",
    name: "QC Lote 46",
    start: 2,
    end: 5,
    color: "orange",
    priority: "baixa",
    progress: 95,
    group: "Lote 46",
    assignee: "Ana Clara",
  },
  {
    id: "t8",
    name: "Expedição Lote 46",
    start: 5,
    end: 8,
    color: "orange",
    priority: "baixa",
    progress: 40,
    group: "Lote 46",
    assignee: "Ana Clara",
  },
];

const TOTAL_DAYS = 31;
const TODAY = 10;
const COL_W = 36;
const ROW_H = 44;
const GROUP_H = 28;

const PRIORITY_DOT: Record<Priority, string> = {
  alta: "bg-danger",
  media: "bg-warning",
  baixa: "bg-info",
};
const BAR_BG: Record<OrgColor, string> = {
  rose: "bg-org-rose-bg",
  violet: "bg-org-violet-bg",
  blue: "bg-org-blue-bg",
  cyan: "bg-org-cyan-bg",
  emerald: "bg-org-emerald-bg",
  orange: "bg-org-orange-bg",
  amber: "bg-org-amber-bg",
};
const BAR_FILL: Record<OrgColor, string> = {
  rose: "bg-org-rose-text",
  violet: "bg-org-violet-text",
  blue: "bg-org-blue-text",
  cyan: "bg-org-cyan-text",
  emerald: "bg-org-emerald-text",
  orange: "bg-org-orange-text",
  amber: "bg-org-amber-text",
};

const groups = [...new Set(TASKS.map((t) => t.group))];

// Build flat row list for syncing left & right panels
type Row = { type: "group"; group: string } | { type: "task"; task: GanttTask };
const ROWS: Row[] = [];
for (const g of groups) {
  ROWS.push({ type: "group", group: g });
  for (const t of TASKS.filter((t) => t.group === g)) {
    ROWS.push({ type: "task", task: t });
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GanttPage() {
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [tooltip, setTooltip] = React.useState<{
    task: GanttTask;
    x: number;
    y: number;
  } | null>(null);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  function handleBarEnter(e: React.MouseEvent, task: GanttTask) {
    setHovered(task.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ task, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
  }

  function handleBarLeave() {
    setHovered(null);
    setTooltip(null);
  }

  const gridW = TOTAL_DAYS * COL_W;

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 flex flex-col h-[calc(100dvh-48px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div>
          <h1 className="font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
            Timeline de Produção
          </h1>
          <p className="mt-0.5 text-[14px] text-text-secondary">
            PCP — Março 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border-subtle overflow-hidden">
            {(["Dia", "Semana", "Mês"] as const).map((label, i) => (
              <button
                key={label}
                type="button"
                className={`px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${i > 0 ? "border-l border-border-subtle" : ""} ${i === 0 ? "bg-bg-raised text-text-white" : "text-text-muted hover:text-text-primary"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg-raised transition-colors cursor-pointer"
              aria-label="Período anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg-raised transition-colors cursor-pointer"
              aria-label="Próximo período"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Tarefa
          </Button>
        </div>
      </div>

      {/* Chart container */}
      <div className="flex flex-1 min-h-0 bg-bg-base overflow-hidden">
        {/* LEFT: Task list */}
        <div className="w-[220px] shrink-0 border-r border-border-subtle flex flex-col">
          {/* Header */}
          <div
            className="flex items-center px-3 border-b border-border-subtle bg-bg-void"
            style={{ height: 36 }}
          >
            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
              Tarefa
            </span>
            <span className="ml-auto font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-ghost">
              Progresso
            </span>
          </div>
          {/* Rows */}
          <div
            className="flex-1 overflow-y-auto scrollbar-thin stagger-children"
            ref={timelineRef}
          >
            {ROWS.map((row, i) => {
              if (row.type === "group") {
                return (
                  <div
                    key={`g-${row.group}`}
                    className="flex items-center px-3 bg-bg-void/50 border-b border-border-subtle"
                    style={{ height: GROUP_H }}
                  >
                    <span className="text-[11px] font-medium text-text-muted">
                      {row.group}
                    </span>
                  </div>
                );
              }
              const t = row.task;
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-2 px-3 border-b border-border-subtle transition-colors ${hovered === t.id ? "bg-bg-raised/50" : ""}`}
                  style={{ height: ROW_H }}
                  onMouseEnter={() => setHovered(t.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`}
                  />
                  <span className="text-[13px] text-text-primary truncate min-w-0 flex-1">
                    {t.name}
                  </span>
                  <span className="font-mono text-[10px] text-text-ghost tabular-nums shrink-0">
                    {t.progress}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Timeline bars */}
        <div className="flex-1 overflow-auto scrollbar-thin flex flex-col">
          {/* Day header (sticky) */}
          <div
            className="sticky top-0 z-10 flex border-b border-border-subtle bg-bg-void shrink-0"
            style={{ height: 36, minWidth: gridW }}
          >
            {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((day) => {
              const d = new Date(2026, 2, day);
              const isWe = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div
                  key={day}
                  className={`flex items-center justify-center border-r border-border-subtle font-mono text-[10px] tabular-nums shrink-0 ${day === TODAY ? "text-danger font-medium" : isWe ? "text-text-ghost" : "text-text-muted"}`}
                  style={{ width: COL_W }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Rows synced with left panel */}
          <div className="relative" style={{ minWidth: gridW }}>
            {/* Grid background */}
            <div className="absolute inset-0 flex pointer-events-none">
              {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map(
                (day) => {
                  const d = new Date(2026, 2, day);
                  const isWe = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={day}
                      className={`border-r border-border-subtle shrink-0 ${isWe ? "bg-bg-raised/15" : ""}`}
                      style={{ width: COL_W }}
                    />
                  );
                },
              )}
            </div>

            {/* Today line */}
            <div
              className="absolute top-0 bottom-0 z-10 pointer-events-none"
              style={{ left: (TODAY - 0.5) * COL_W }}
            >
              <div className="h-full w-0.5 bg-danger/40" />
            </div>

            {/* Row-by-row bars */}
            {ROWS.map((row) => {
              if (row.type === "group") {
                return (
                  <div
                    key={`g-${row.group}`}
                    className="border-b border-border-subtle bg-bg-void/30"
                    style={{ height: GROUP_H }}
                  />
                );
              }
              const t = row.task;
              const left = (t.start - 1) * COL_W;
              const width = (t.end - t.start + 1) * COL_W;
              const isH = hovered === t.id;

              return (
                <div
                  key={t.id}
                  className={`relative border-b border-border-subtle transition-colors ${isH ? "bg-bg-raised/30" : ""}`}
                  style={{ height: ROW_H }}
                  onMouseEnter={() => setHovered(t.id)}
                  onMouseLeave={handleBarLeave}
                >
                  {/* Bar */}
                  <div
                    className={`absolute top-[7px] z-20 rounded-md overflow-hidden cursor-pointer animate-grow-width gantt-bar ${isH ? "shadow-[var(--shadow-md)]" : ""}`}
                    style={{ left, width, height: ROW_H - 14 }}
                    onMouseEnter={(e) => handleBarEnter(e, t)}
                    onMouseLeave={handleBarLeave}
                  >
                    {/* Background */}
                    <div className={`absolute inset-0 ${BAR_BG[t.color]}`} />
                    {/* Progress fill */}
                    <div
                      className={`absolute inset-y-0 left-0 ${BAR_FILL[t.color]} opacity-25`}
                      style={{ width: `${t.progress}%` }}
                    />
                    {/* Label */}
                    <span className="relative z-10 flex items-center h-full px-2 text-[11px] font-medium text-text-primary truncate">
                      {t.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-6 pb-4 text-[12px] text-text-muted stagger-children">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-danger" />
          Alta
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" />
          Média
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-info" />
          Baixa
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-danger/40" />
          Hoje
        </div>
      </div>

      {/* Fixed tooltip (rendered outside the scroll container) */}
      {tooltip && (
        <div
          className="fixed z-50 rounded-lg border border-border-default bg-bg-base shadow-[var(--shadow-lg)] px-3.5 py-3 min-w-[210px] animate-[fade-in_100ms_ease-out] pointer-events-none"
          style={{
            top: tooltip.y,
            left: tooltip.x,
            transform: "translateX(-50%)",
          }}
        >
          <p className="text-[13px] font-medium text-text-white">
            {tooltip.task.name}
          </p>
          <p className="text-[12px] text-text-muted mt-0.5">
            {tooltip.task.start} — {tooltip.task.end} Mar ·{" "}
            {tooltip.task.assignee}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1.5 flex-1 rounded-full bg-bg-raised overflow-hidden">
              <div
                className={`h-full rounded-full ${BAR_FILL[tooltip.task.color]}`}
                style={{ width: `${tooltip.task.progress}%` }}
              />
            </div>
            <span className="font-mono text-[11px] tabular-nums text-text-muted">
              {tooltip.task.progress}%
            </span>
          </div>
          <p className="text-[10px] text-text-ghost mt-1">
            {tooltip.task.group}
          </p>
        </div>
      )}
    </div>
  );
}
