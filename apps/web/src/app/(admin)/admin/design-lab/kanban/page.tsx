"use client";

import * as React from "react";
import {
  Plus,
  Columns3,
  List,
  Calendar,
  Check,
  GripVertical,
} from "lucide-react";
import { Badge } from "@ambaril/ui/components/badge";
import { Button } from "@ambaril/ui/components/button";
import { Sheet } from "@ambaril/ui/components/sheet";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Priority = "urgente" | "alta" | "normal" | "baixa";
type ColumnId = "backlog" | "todo" | "in_progress" | "review" | "done";

interface Assignee {
  id: string;
  name: string;
  initials: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  priority: Priority;
  assignee: Assignee;
  dueDate: string;
  column: ColumnId;
  labels: string[];
  description: string;
  subtasks: { text: string; done: boolean }[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MARCUS: Assignee = {
  id: "marcus",
  name: "Marcus",
  initials: "M",
  color: "bg-org-blue-bg text-org-blue-text",
};
const CAIO: Assignee = {
  id: "caio",
  name: "Caio",
  initials: "C",
  color: "bg-org-violet-bg text-org-violet-text",
};
const TAVARES: Assignee = {
  id: "tavares",
  name: "Tavares",
  initials: "T",
  color: "bg-org-emerald-bg text-org-emerald-text",
};
const ASSIGNEES: Assignee[] = [MARCUS, CAIO, TAVARES];

const COLUMNS: { id: ColumnId; title: string; dotColor: string }[] = [
  { id: "backlog", title: "Backlog", dotColor: "bg-text-ghost" },
  { id: "todo", title: "A fazer", dotColor: "bg-info" },
  { id: "in_progress", title: "Em progresso", dotColor: "bg-warning" },
  { id: "review", title: "Revisão", dotColor: "bg-org-violet-text" },
  { id: "done", title: "Concluído", dotColor: "bg-success" },
];

const PRIORITY_VARIANT: Record<Priority, "danger" | "warning" | "secondary"> = {
  urgente: "danger",
  alta: "warning",
  normal: "secondary",
  baixa: "secondary",
};
const PRIORITY_LABEL: Record<Priority, string> = {
  urgente: "Urgente",
  alta: "Alta",
  normal: "Normal",
  baixa: "Baixa",
};

const LABEL_COLORS: Record<string, string> = {
  erp: "bg-org-blue-bg",
  shopify: "bg-org-emerald-bg",
  ui: "bg-org-violet-bg",
  docs: "bg-org-slate-bg",
  integration: "bg-org-cyan-bg",
  db: "bg-org-orange-bg",
  ds: "bg-org-rose-bg",
  infra: "bg-org-orange-bg",
  auth: "bg-org-orange-bg",
};

const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    title: "Migrar schema de produtos Shopify",
    priority: "alta",
    assignee: MARCUS,
    dueDate: "05 Abr",
    column: "backlog",
    labels: ["erp", "shopify"],
    description:
      "Mapear todos os campos do schema de produtos do Shopify para o modelo Drizzle do Ambaril.",
    subtasks: [
      { text: "Mapear campos obrigatórios", done: false },
      { text: "Definir relações com variantes", done: false },
      { text: "Criar migration Drizzle", done: false },
    ],
  },
  {
    id: "t2",
    title: "Criar tela de inventário",
    priority: "normal",
    assignee: TAVARES,
    dueDate: "08 Abr",
    column: "backlog",
    labels: ["erp"],
    description:
      "Tela de listagem do inventário com filtros por SKU, produto e localização.",
    subtasks: [
      { text: "Layout da tabela", done: false },
      { text: "Filtros por SKU", done: false },
    ],
  },
  {
    id: "t3",
    title: "Documentar API de pedidos",
    priority: "baixa",
    assignee: CAIO,
    dueDate: "10 Abr",
    column: "backlog",
    labels: ["docs"],
    description: "Documentar todos os endpoints de pedidos.",
    subtasks: [
      { text: "Listar endpoints", done: true },
      { text: "Escrever exemplos", done: false },
    ],
  },
  {
    id: "t4",
    title: "Implementar listagem de pedidos",
    priority: "urgente",
    assignee: MARCUS,
    dueDate: "01 Abr",
    column: "todo",
    labels: ["erp", "ui"],
    description:
      "Criar a página de listagem de pedidos com paginação server-side.",
    subtasks: [
      { text: "Server action", done: true },
      { text: "DataTable", done: false },
      { text: "Filtros", done: false },
    ],
  },
  {
    id: "t5",
    title: "Criar filtros de pedidos",
    priority: "alta",
    assignee: CAIO,
    dueDate: "02 Abr",
    column: "todo",
    labels: ["erp", "ui"],
    description:
      "Filtros avançados: status, data, valor, canal. Persistir na URL.",
    subtasks: [
      { text: "Componente filtros", done: true },
      { text: "URL params", done: false },
    ],
  },
  {
    id: "t6",
    title: "Adicionar paginação cursor-based",
    priority: "normal",
    assignee: TAVARES,
    dueDate: "03 Abr",
    column: "todo",
    labels: ["ui"],
    description: "Paginação cursor-based com TanStack Query e prefetch.",
    subtasks: [
      { text: "Component", done: true },
      { text: "Cursor query", done: true },
      { text: "Prefetch", done: false },
    ],
  },
  {
    id: "t7",
    title: "Integrar StatusBadge nos pedidos",
    priority: "normal",
    assignee: MARCUS,
    dueDate: "04 Abr",
    column: "todo",
    labels: ["ui"],
    description: "Usar Badge do DS para status com cores semânticas.",
    subtasks: [
      { text: "Mapear status → variant", done: true },
      { text: "Aplicar na tabela", done: false },
    ],
  },
  {
    id: "t8",
    title: "Setup provider Shopify",
    priority: "urgente",
    assignee: MARCUS,
    dueDate: "31 Mar",
    column: "in_progress",
    labels: ["integration", "shopify"],
    description: "OAuth, webhook handlers e rate limiting.",
    subtasks: [
      { text: "OAuth flow", done: true },
      { text: "Webhook handler", done: true },
      { text: "Rate limiter", done: false },
    ],
  },
  {
    id: "t9",
    title: "Sync de produtos bidirecional",
    priority: "alta",
    assignee: TAVARES,
    dueDate: "01 Abr",
    column: "in_progress",
    labels: ["erp", "shopify"],
    description: "Webhook para tempo real, cron para reconciliação.",
    subtasks: [
      { text: "Webhook listener", done: true },
      { text: "Cron reconciliation", done: false },
    ],
  },
  {
    id: "t10",
    title: "Page de detalhes do pedido",
    priority: "alta",
    assignee: CAIO,
    dueDate: "02 Abr",
    column: "in_progress",
    labels: ["erp", "ui"],
    description: "Detalhe com timeline, itens, pagamento e envio.",
    subtasks: [
      { text: "Layout", done: true },
      { text: "Timeline", done: false },
      { text: "Pagamento", done: false },
    ],
  },
  {
    id: "t11",
    title: "Schema de pedidos (Drizzle)",
    priority: "alta",
    assignee: MARCUS,
    dueDate: "30 Mar",
    column: "review",
    labels: ["erp", "db"],
    description: "Schema com relações: items, payments, shipments.",
    subtasks: [
      { text: "orders", done: true },
      { text: "order_items", done: true },
      { text: "order_payments", done: true },
    ],
  },
  {
    id: "t12",
    title: "Layout sidebar polido",
    priority: "normal",
    assignee: CAIO,
    dueDate: "30 Mar",
    column: "review",
    labels: ["ui", "ds"],
    description: "Rail 64px com expand on hover 240px. Linear-style.",
    subtasks: [
      { text: "Rail 64px", done: true },
      { text: "Hover expand", done: true },
      { text: "Active state", done: false },
    ],
  },
  {
    id: "t13",
    title: "Setup monorepo Turborepo",
    priority: "normal",
    assignee: MARCUS,
    dueDate: "20 Mar",
    column: "done",
    labels: ["infra"],
    description: "apps/web, packages/db, packages/ui, packages/shared.",
    subtasks: [
      { text: "Config", done: true },
      { text: "Structure", done: true },
      { text: "Pipeline", done: true },
    ],
  },
  {
    id: "t14",
    title: "Auth system + RBAC",
    priority: "urgente",
    assignee: MARCUS,
    dueDate: "22 Mar",
    column: "done",
    labels: ["auth"],
    description: "Cookie ambaril_session, 9 roles, permission matrix.",
    subtasks: [
      { text: "Login/logout", done: true },
      { text: "Session cookie", done: true },
      { text: "RBAC", done: true },
    ],
  },
  {
    id: "t15",
    title: "Integration settings UI",
    priority: "alta",
    assignee: CAIO,
    dueDate: "28 Mar",
    column: "done",
    labels: ["integration", "ui"],
    description: "Catálogo estilo app store com toggle on/off.",
    subtasks: [
      { text: "Catálogo", done: true },
      { text: "Toggle", done: true },
      { text: "Credential form", done: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function KanbanPage() {
  const [tasks, setTasks] = React.useState<Task[]>(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [activeView, setActiveView] = React.useState<
    "kanban" | "list" | "calendar"
  >("kanban");
  const [assigneeFilter, setAssigneeFilter] = React.useState<string | null>(
    null,
  );
  const [priorityFilter, setPriorityFilter] = React.useState<
    "todas" | Priority
  >("todas");
  const [dragOverColumn, setDragOverColumn] = React.useState<ColumnId | null>(
    null,
  );
  const [dragTaskId, setDragTaskId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    return tasks.filter((t) => {
      if (assigneeFilter && t.assignee.id !== assigneeFilter) return false;
      if (priorityFilter !== "todas" && t.priority !== priorityFilter)
        return false;
      return true;
    });
  }, [tasks, assigneeFilter, priorityFilter]);

  // Drag handlers
  const [justDropped, setJustDropped] = React.useState<string | null>(null);

  function onDragStart(e: React.DragEvent, taskId: string) {
    setDragTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add("kanban-card-dragging");
    }
  }

  function onDragEnd(e: React.DragEvent) {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove("kanban-card-dragging");
    }
    if (dragTaskId) {
      setJustDropped(dragTaskId);
      setTimeout(() => setJustDropped(null), 400);
    }
    setDragTaskId(null);
    setDragOverColumn(null);
  }

  function onDragOverColumn(e: React.DragEvent, columnId: ColumnId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  }

  function onDropColumn(columnId: ColumnId) {
    if (!dragTaskId) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === dragTaskId ? { ...t, column: columnId } : t)),
    );
    setDragTaskId(null);
    setDragOverColumn(null);
  }

  function handleQuickAdd(columnId: ColumnId, title: string) {
    setTasks((prev) => [
      ...prev,
      {
        id: `t${Date.now()}`,
        title,
        priority: "normal",
        assignee: MARCUS,
        dueDate: "TBD",
        column: columnId,
        labels: [],
        description: "",
        subtasks: [],
      },
    ]);
  }

  // Toggle subtask in sheet
  function toggleSubtask(taskId: string, index: number) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = t.subtasks.map((s, i) =>
          i === index ? { ...s, done: !s.done } : s,
        );
        return { ...t, subtasks };
      }),
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => {
        if (!prev) return prev;
        const subtasks = prev.subtasks.map((s, i) =>
          i === index ? { ...s, done: !s.done } : s,
        );
        return { ...prev, subtasks };
      });
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4">
        <div>
          <h1 className="font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
            Tarefas
          </h1>
          <p className="mt-0.5 text-[14px] leading-[1.65] text-text-secondary">
            Sprint 1 — ERP Core
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            Nova tarefa
          </Button>
          <div className="flex items-center border border-border-subtle rounded-lg overflow-hidden">
            {[
              { id: "kanban" as const, icon: Columns3, label: "Kanban" },
              { id: "list" as const, icon: List, label: "Lista" },
              { id: "calendar" as const, icon: Calendar, label: "Calendário" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveView(id)}
                aria-label={`Visualizar como ${label}`}
                aria-pressed={activeView === id}
                className={`h-8 w-8 inline-flex items-center justify-center transition-colors cursor-pointer ${activeView === id ? "bg-bg-surface text-text-white" : "text-text-muted hover:text-text-primary hover:bg-bg-raised"}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 px-6 pb-4">
        <div className="flex items-center gap-1.5">
          {ASSIGNEES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() =>
                setAssigneeFilter((p) => (p === a.id ? null : a.id))
              }
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium transition-all duration-150 cursor-pointer ${a.color} ${assigneeFilter === a.id ? "ring-2 ring-info ring-offset-2 ring-offset-bg-void" : "hover:ring-1 hover:ring-border-default"}`}
            >
              {a.initials}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-border-subtle" />
        {(["todas", "urgente", "alta", "normal"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPriorityFilter(p)}
            className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer min-h-[32px] inline-flex items-center ${priorityFilter === p ? "bg-bg-surface text-text-white" : "text-text-muted hover:text-text-primary hover:bg-bg-raised"}`}
          >
            {p === "todas" ? "Todas" : PRIORITY_LABEL[p]}
          </button>
        ))}
        {(assigneeFilter || priorityFilter !== "todas") && (
          <button
            type="button"
            onClick={() => {
              setAssigneeFilter(null);
              setPriorityFilter("todas");
            }}
            className="text-[11px] text-danger hover:underline cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto px-6 pb-6 flex-1 min-h-0">
        {COLUMNS.map((column) => {
          const colTasks = filtered.filter((t) => t.column === column.id);
          const isDragOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className={`min-w-[260px] w-[260px] flex flex-col shrink-0 rounded-xl transition-colors duration-150 ${isDragOver ? "bg-bg-raised/50" : ""}`}
              onDragOver={(e) => onDragOverColumn(e, column.id)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={() => onDropColumn(column.id)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className={`h-2 w-2 rounded-full ${column.dotColor}`} />
                <span className="text-[13px] font-medium text-text-primary">
                  {column.title}
                </span>
                <span className="font-mono text-[11px] text-text-ghost tabular-nums">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards container */}
              <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto scrollbar-thin pr-0.5 max-h-[calc(100dvh-280px)] stagger-children">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id)}
                    onDragEnd={onDragEnd}
                    onClick={() => setSelectedTask(task)}
                    className={`group w-full text-left bg-bg-base border border-border-subtle rounded-lg p-3 cursor-pointer transition-all duration-150 hover:shadow-[var(--shadow-md)] hover:border-border-default ${dragTaskId === task.id ? "opacity-50" : ""} ${justDropped === task.id ? "animate-spring-settle" : ""}`}
                  >
                    {/* Drag handle + labels */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1">
                        {task.labels.map((l) => (
                          <span
                            key={l}
                            className={`w-2 h-2 rounded-full ${LABEL_COLORS[l] ?? "bg-org-slate-bg"}`}
                            title={l}
                          />
                        ))}
                      </div>
                      <GripVertical className="h-3 w-3 text-text-ghost opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Title */}
                    <p className="text-[13px] font-medium leading-[1.4] text-text-primary line-clamp-2">
                      {task.title}
                    </p>

                    {/* Subtask progress (if any) */}
                    {task.subtasks.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="h-1 flex-1 rounded-full bg-bg-raised overflow-hidden">
                          <div
                            className="h-full rounded-full bg-success transition-all duration-300"
                            style={{
                              width: `${(task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-text-ghost tabular-nums">
                          {task.subtasks.filter((s) => s.done).length}/
                          {task.subtasks.length}
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <Badge
                        variant={PRIORITY_VARIANT[task.priority]}
                        className={`text-[10px] px-1.5 py-0 ${task.priority === "baixa" ? "text-text-ghost" : ""}`}
                      >
                        {PRIORITY_LABEL[task.priority]}
                      </Badge>
                      <span className="flex-1" />
                      <span className="font-mono text-[10px] text-text-muted">
                        {task.dueDate}
                      </span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${task.assignee.color}`}
                        title={task.assignee.name}
                      >
                        {task.assignee.initials}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Drop zone indicator */}
                {isDragOver && (
                  <div className="rounded-lg border-2 border-dashed border-info/30 bg-info-muted/30 h-16 flex items-center justify-center animate-drop-zone">
                    <span className="text-[11px] text-info">Soltar aqui</span>
                  </div>
                )}
              </div>

              {/* Quick add */}
              <QuickAdd onAdd={(title) => handleQuickAdd(column.id, title)} />
            </div>
          );
        })}
      </div>

      {/* Task detail sheet */}
      <Sheet
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.title ?? ""}
        width="md"
      >
        {selectedTask && (
          <div className="flex flex-col gap-6 stagger-children">
            {/* Status + Priority row */}
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                {COLUMNS.find((c) => c.id === selectedTask.column)?.title}
              </Badge>
              <Badge
                variant={PRIORITY_VARIANT[selectedTask.priority]}
                className={
                  selectedTask.priority === "baixa" ? "text-text-ghost" : ""
                }
              >
                {PRIORITY_LABEL[selectedTask.priority]}
              </Badge>
            </div>

            {/* Metadata grid (consistent layout) */}
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-border-subtle bg-bg-void p-4">
              <div>
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-1">
                  Responsável
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium ${selectedTask.assignee.color}`}
                  >
                    {selectedTask.assignee.initials}
                  </span>
                  <span className="text-[14px] text-text-primary">
                    {selectedTask.assignee.name}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-1">
                  Prazo
                </p>
                <span className="font-mono text-[14px] text-text-primary">
                  {selectedTask.dueDate}
                </span>
              </div>
            </div>

            {/* Labels */}
            {selectedTask.labels.length > 0 && (
              <div>
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-2">
                  Labels
                </p>
                <div className="flex items-center gap-1.5">
                  {selectedTask.labels.map((l) => (
                    <Badge key={l} variant="secondary" className="text-[11px]">
                      {l}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-2">
                Descrição
              </p>
              <p className="text-[14px] leading-[1.65] text-text-secondary">
                {selectedTask.description}
              </p>
            </div>

            {/* Subtasks */}
            {selectedTask.subtasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                    Subtarefas
                  </p>
                  <span className="font-mono text-[11px] text-text-ghost tabular-nums">
                    {selectedTask.subtasks.filter((s) => s.done).length}/
                    {selectedTask.subtasks.length}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-bg-raised mb-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-300"
                    style={{
                      width: `${(selectedTask.subtasks.filter((s) => s.done).length / selectedTask.subtasks.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  {selectedTask.subtasks.map((sub, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleSubtask(selectedTask.id, i)}
                      className="flex items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-bg-raised cursor-pointer"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${sub.done ? "bg-success border-success text-white animate-pop-in" : "border-border-default"}`}
                      >
                        {sub.done && <Check className="h-2.5 w-2.5" />}
                      </span>
                      <span
                        className={`text-[13px] ${sub.done ? "line-through text-text-muted" : "text-text-primary"}`}
                      >
                        {sub.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick Add (extracted for cleanliness)
// ---------------------------------------------------------------------------

function QuickAdd({ onAdd }: { onAdd: (title: string) => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-1.5 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] text-text-muted hover:bg-bg-raised hover:text-text-primary transition-colors cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar
      </button>
    );
  }

  return (
    <div className="mt-1.5">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onAdd(value.trim());
            setValue("");
            setIsOpen(false);
          }
          if (e.key === "Escape") {
            setValue("");
            setIsOpen(false);
          }
        }}
        onBlur={() => {
          if (!value.trim()) setIsOpen(false);
        }}
        placeholder="Título da tarefa…"
        className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-ghost outline-none focus:border-input-focus transition-colors"
      />
    </div>
  );
}
