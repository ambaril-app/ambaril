/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import {
  Search,
  ChevronDown,
  Download,
  Printer,
  Archive,
  Filter,
  X,
  SlidersHorizontal,
  Bookmark,
} from "lucide-react";
import { cn } from "@ambaril/ui/lib/utils";
import {
  DataTable,
  type DataTableColumn,
} from "@ambaril/ui/components/data-table";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { Badge } from "@ambaril/ui/components/badge";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { Sheet } from "@ambaril/ui/components/sheet";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Order extends Record<string, unknown> {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  phone: string;
  date: string;
  total: number;
  status: string;
  channel: string;
  items: number;
  products: { name: string; qty: number; price: number }[];
  tracking: string | null;
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Status map for StatusBadge
// ---------------------------------------------------------------------------

const ORDER_STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "danger" | "default" | "info";
  }
> = {
  entregue: { label: "Entregue", variant: "success" },
  preparando: { label: "Preparando", variant: "warning" },
  enviado: { label: "Enviado", variant: "info" },
  cancelado: { label: "Cancelado", variant: "danger" },
  pendente: { label: "Pendente", variant: "default" },
};

// ---------------------------------------------------------------------------
// Channel badge variant map
// ---------------------------------------------------------------------------

const CHANNEL_VARIANT: Record<string, "slate" | "blue" | "violet" | "emerald"> =
  {
    Site: "slate",
    Instagram: "violet",
    WhatsApp: "emerald",
    B2B: "blue",
  };

// ---------------------------------------------------------------------------
// Avatar color map (deterministic by first letter)
// ---------------------------------------------------------------------------

const AVATAR_COLORS: Record<string, string> = {
  A: "bg-org-violet-bg text-org-violet-text",
  B: "bg-org-blue-bg text-org-blue-text",
  C: "bg-org-cyan-bg text-org-cyan-text",
  D: "bg-org-emerald-bg text-org-emerald-text",
  E: "bg-org-orange-bg text-org-orange-text",
  F: "bg-org-rose-bg text-org-rose-text",
  G: "bg-org-slate-bg text-org-slate-text",
  H: "bg-org-slate-bg text-org-slate-text",
  I: "bg-org-violet-bg text-org-violet-text",
  J: "bg-org-blue-bg text-org-blue-text",
  K: "bg-org-cyan-bg text-org-cyan-text",
  L: "bg-org-emerald-bg text-org-emerald-text",
  M: "bg-org-orange-bg text-org-orange-text",
  N: "bg-org-rose-bg text-org-rose-text",
  O: "bg-org-slate-bg text-org-slate-text",
  P: "bg-org-slate-bg text-org-slate-text",
  R: "bg-org-blue-bg text-org-blue-text",
  S: "bg-org-violet-bg text-org-violet-text",
  T: "bg-org-cyan-bg text-org-cyan-text",
  V: "bg-org-emerald-bg text-org-emerald-text",
  Y: "bg-org-orange-bg text-org-orange-text",
};

function getAvatarColor(name: string): string {
  const letter = name.charAt(0).toUpperCase();
  return AVATAR_COLORS[letter] ?? "bg-org-slate-bg text-org-slate-text";
}

// ---------------------------------------------------------------------------
// FilterDropdown — custom styled dropdown replacing native <select>
// ---------------------------------------------------------------------------

function FilterDropdown({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] transition-all duration-150 cursor-pointer",
          open
            ? "border-input-focus bg-bg-base shadow-[var(--shadow-sm)]"
            : value !== "all" && value !== "30d"
              ? "border-border-strong bg-bg-base text-text-white"
              : "border-border-default bg-bg-base text-text-primary hover:border-border-strong",
        )}
      >
        <span>{selected?.label ?? label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-text-ghost transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-40 mt-1 min-w-[160px] rounded-lg border border-border-default bg-bg-base py-1 shadow-[var(--shadow-lg)] animate-slide-in-up">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-[13px] text-left transition-colors cursor-pointer",
                value === opt.value
                  ? "bg-bg-raised text-text-white font-medium"
                  : "text-text-secondary hover:bg-bg-raised hover:text-text-primary",
              )}
            >
              {value === opt.value && (
                <span className="h-1.5 w-1.5 rounded-full bg-text-white" />
              )}
              {value !== opt.value && <span className="h-1.5 w-1.5" />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mock data — 15 streetwear orders
// ---------------------------------------------------------------------------

const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    orderNumber: "AM-4821",
    customer: "Lucas Ferreira",
    email: "lucas.ferreira@gmail.com",
    phone: "(21) 99812-3456",
    date: "28/03/2026",
    total: 459.9,
    status: "entregue",
    channel: "Site",
    items: 3,
    products: [
      { name: "Camiseta Oversized Noir", qty: 1, price: 189.9 },
      { name: "Bucket Hat Concrete", qty: 1, price: 129.9 },
      { name: "Meia Pack x3 Essentials", qty: 1, price: 89.9 },
    ],
    tracking: "BR123456789LP",
    tags: ["VIP", "Recorrente"],
  },
  {
    id: "2",
    orderNumber: "AM-4822",
    customer: "Ana Santos",
    email: "ana.santos@outlook.com",
    phone: "(11) 98765-4321",
    date: "28/03/2026",
    total: 349.9,
    status: "preparando",
    channel: "Instagram",
    items: 2,
    products: [
      { name: "Moletom Cropped Urban", qty: 1, price: 259.9 },
      { name: "Scrunchie Pack Velvet", qty: 1, price: 49.9 },
    ],
    tracking: null,
    tags: ["Novo"],
  },
  {
    id: "3",
    orderNumber: "AM-4823",
    customer: "Pedro Oliveira",
    email: "pedro.oliveira@icloud.com",
    phone: "(21) 97654-3210",
    date: "27/03/2026",
    total: 720.0,
    status: "enviado",
    channel: "Site",
    items: 4,
    products: [
      { name: "Jaqueta Corta-Vento Storm", qty: 1, price: 389.9 },
      { name: "Calça Cargo Tech", qty: 1, price: 229.9 },
      { name: "Bone 5-Panel Slate", qty: 1, price: 99.9 },
    ],
    tracking: "BR987654321LP",
  },
  {
    id: "4",
    orderNumber: "AM-4824",
    customer: "Maria Silva",
    email: "maria.silva@gmail.com",
    phone: "(31) 99123-4567",
    date: "27/03/2026",
    total: 189.9,
    status: "entregue",
    channel: "WhatsApp",
    items: 1,
    products: [{ name: "Camiseta Oversized Noir", qty: 1, price: 189.9 }],
    tracking: "BR456789123LP",
  },
  {
    id: "5",
    orderNumber: "AM-4825",
    customer: "Gabriel Costa",
    email: "gabriel.costa@hotmail.com",
    phone: "(21) 98234-5678",
    date: "26/03/2026",
    total: 539.8,
    status: "cancelado",
    channel: "Site",
    items: 2,
    products: [
      { name: "Moletom Hoodie Phantom", qty: 1, price: 299.9 },
      { name: "Calça Jogger Stealth", qty: 1, price: 199.9 },
    ],
    tracking: null,
  },
  {
    id: "6",
    orderNumber: "AM-4826",
    customer: "Juliana Mendes",
    email: "juliana.m@gmail.com",
    phone: "(11) 97345-6789",
    date: "26/03/2026",
    total: 89.9,
    status: "pendente",
    channel: "Instagram",
    items: 1,
    products: [{ name: "Meia Pack x3 Essentials", qty: 1, price: 89.9 }],
    tracking: null,
  },
  {
    id: "7",
    orderNumber: "AM-4827",
    customer: "Rafael Almeida",
    email: "rafael.almeida@yahoo.com",
    phone: "(21) 96456-7890",
    date: "25/03/2026",
    total: 429.8,
    status: "entregue",
    channel: "B2B",
    items: 2,
    products: [
      { name: "Camiseta Oversized Noir", qty: 2, price: 189.9 },
      { name: "Bone 5-Panel Slate", qty: 1, price: 99.9 },
    ],
    tracking: "BR321654987LP",
  },
  {
    id: "8",
    orderNumber: "AM-4828",
    customer: "Camila Rocha",
    email: "camila.rocha@gmail.com",
    phone: "(41) 99567-8901",
    date: "25/03/2026",
    total: 259.9,
    status: "preparando",
    channel: "Site",
    items: 1,
    products: [{ name: "Moletom Cropped Urban", qty: 1, price: 259.9 }],
    tracking: null,
  },
  {
    id: "9",
    orderNumber: "AM-4829",
    customer: "Thiago Barbosa",
    email: "thiago.barbosa@gmail.com",
    phone: "(21) 98678-9012",
    date: "24/03/2026",
    total: 619.7,
    status: "enviado",
    channel: "WhatsApp",
    items: 3,
    products: [
      { name: "Jaqueta Corta-Vento Storm", qty: 1, price: 389.9 },
      { name: "Bucket Hat Concrete", qty: 1, price: 129.9 },
      { name: "Bone 5-Panel Slate", qty: 1, price: 99.9 },
    ],
    tracking: "BR654321789LP",
  },
  {
    id: "10",
    orderNumber: "AM-4830",
    customer: "Fernanda Lima",
    email: "fernanda.lima@icloud.com",
    phone: "(11) 97789-0123",
    date: "24/03/2026",
    total: 379.8,
    status: "entregue",
    channel: "Site",
    items: 2,
    products: [
      { name: "Camiseta Oversized Noir", qty: 1, price: 189.9 },
      { name: "Calça Jogger Stealth", qty: 1, price: 199.9 },
    ],
    tracking: "BR789123456LP",
  },
  {
    id: "11",
    orderNumber: "AM-4831",
    customer: "Vinícius Souza",
    email: "vinicius.souza@outlook.com",
    phone: "(21) 96890-1234",
    date: "23/03/2026",
    total: 299.9,
    status: "preparando",
    channel: "Instagram",
    items: 1,
    products: [{ name: "Moletom Hoodie Phantom", qty: 1, price: 299.9 }],
    tracking: null,
  },
  {
    id: "12",
    orderNumber: "AM-4832",
    customer: "Beatriz Nunes",
    email: "beatriz.nunes@gmail.com",
    phone: "(51) 98901-2345",
    date: "22/03/2026",
    total: 489.8,
    status: "entregue",
    channel: "Site",
    items: 3,
    products: [
      { name: "Moletom Cropped Urban", qty: 1, price: 259.9 },
      { name: "Bucket Hat Concrete", qty: 1, price: 129.9 },
      { name: "Bone 5-Panel Slate", qty: 1, price: 99.9 },
    ],
    tracking: "BR147258369LP",
  },
  {
    id: "13",
    orderNumber: "AM-4833",
    customer: "Diego Martins",
    email: "diego.martins@hotmail.com",
    phone: "(21) 97012-3456",
    date: "21/03/2026",
    total: 189.9,
    status: "cancelado",
    channel: "WhatsApp",
    items: 1,
    products: [{ name: "Camiseta Oversized Noir", qty: 1, price: 189.9 }],
    tracking: null,
  },
  {
    id: "14",
    orderNumber: "AM-4834",
    customer: "Sofia Cardoso",
    email: "sofia.cardoso@gmail.com",
    phone: "(11) 96123-4567",
    date: "20/03/2026",
    total: 159.8,
    status: "entregue",
    channel: "B2B",
    items: 2,
    products: [
      { name: "Meia Pack x3 Essentials", qty: 1, price: 89.9 },
      { name: "Scrunchie Pack Velvet", qty: 1, price: 49.9 },
    ],
    tracking: "BR369258147LP",
  },
  {
    id: "15",
    orderNumber: "AM-4835",
    customer: "Henrique Dias",
    email: "henrique.dias@yahoo.com",
    phone: "(21) 95234-5678",
    date: "19/03/2026",
    total: 529.8,
    status: "pendente",
    channel: "Site",
    items: 3,
    products: [
      { name: "Calça Cargo Tech", qty: 1, price: 229.9 },
      { name: "Moletom Hoodie Phantom", qty: 1, price: 299.9 },
    ],
    tracking: null,
  },
];

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

// Add tags to orders that don't have them yet
const TAG_MAP: Record<string, string[]> = {
  "AM-4821": ["VIP", "Recorrente"],
  "AM-4822": ["Novo"],
  "AM-4823": ["VIP"],
  "AM-4824": ["Recorrente"],
  "AM-4825": [],
  "AM-4826": ["Novo"],
  "AM-4827": ["B2B", "Atacado"],
  "AM-4828": ["Novo"],
  "AM-4829": ["VIP", "Frete grátis"],
  "AM-4830": ["Recorrente"],
  "AM-4831": ["Novo"],
  "AM-4832": ["VIP", "Recorrente"],
  "AM-4833": [],
  "AM-4834": ["B2B"],
  "AM-4835": ["Novo"],
};

// Ensure all orders have tags
for (const order of MOCK_ORDERS) {
  if (!order.tags || order.tags.length === 0) {
    order.tags = TAG_MAP[order.orderNumber] ?? [];
  }
}

function formatCurrency(value: number): string {
  return `R$\u00a0${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const columns: DataTableColumn<Order>[] = [
  {
    key: "orderNumber",
    label: "Pedido",
    sortable: true,
    className: "w-[120px]",
    render: (value) => (
      <span className="font-mono text-[13px] text-text-muted">
        #{String(value)}
      </span>
    ),
  },
  {
    key: "customer",
    label: "Cliente",
    sortable: true,
    className: "w-[200px]",
    render: (value) => {
      const name = String(value);
      const letter = name.charAt(0).toUpperCase();
      return (
        <span className="inline-flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${getAvatarColor(name)}`}
          >
            {letter}
          </span>
          <span className="truncate text-[13px] text-text-primary">{name}</span>
        </span>
      );
    },
  },
  {
    key: "date",
    label: "Data",
    sortable: true,
    className: "w-[110px]",
    render: (value) => (
      <span className="font-mono text-[13px] text-text-secondary">
        {String(value)}
      </span>
    ),
  },
  {
    key: "total",
    label: "Valor",
    sortable: true,
    className: "w-[130px]",
    render: (value) => (
      <span className="font-mono text-[13px] tabular-nums text-text-primary">
        {formatCurrency(value as number)}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    className: "w-[130px]",
    render: (value) => (
      <StatusBadge status={String(value)} statusMap={ORDER_STATUS_MAP} />
    ),
  },
  {
    key: "channel",
    label: "Canal",
    className: "w-[110px]",
    render: (value) => {
      const ch = String(value);
      const variant = CHANNEL_VARIANT[ch] ?? "slate";
      return <Badge variant={variant}>{ch}</Badge>;
    },
  },
  {
    key: "items",
    label: "Itens",
    className: "w-[70px]",
    render: (value) => (
      <span className="font-mono text-[13px] text-text-secondary tabular-nums">
        {String(value)}
      </span>
    ),
  },
  {
    key: "tags",
    label: "Tags",
    className: "w-[160px]",
    render: (value) => {
      const tags = value as string[];
      if (!tags || tags.length === 0)
        return <span className="text-text-ghost">—</span>;
      const TAG_VARIANT: Record<
        string,
        "violet" | "emerald" | "blue" | "orange" | "rose" | "cyan" | "slate"
      > = {
        VIP: "violet",
        Recorrente: "emerald",
        Novo: "blue",
        B2B: "cyan",
        Atacado: "orange",
        "Frete grátis": "rose",
      };
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant={TAG_VARIANT[tag] ?? "slate"}
              className="text-[10px] px-1.5 py-0"
            >
              {tag}
            </Badge>
          ))}
        </div>
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function TablesPage() {
  // Selection state
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(
    () => new Set(),
  );

  // Sort state
  const [sortKey, setSortKey] = React.useState<string>("orderNumber");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "desc",
  );

  // Pagination state
  const [page, setPage] = React.useState(1);

  // Sheet state
  const [sheetOrder, setSheetOrder] = React.useState<Order | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter states
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [channelFilter, setChannelFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<string>("30d");
  const [activePreset, setActivePreset] = React.useState<string | null>(null);

  // Filter presets (saved filters like tables-3)
  const FILTER_PRESETS = [
    {
      id: "pending",
      label: "Pendentes",
      filters: { status: "pendente", channel: "all" },
    },
    {
      id: "delayed",
      label: "Atrasados",
      filters: { status: "preparando", channel: "all" },
    },
    { id: "b2b", label: "B2B", filters: { status: "all", channel: "B2B" } },
    {
      id: "instagram",
      label: "Instagram",
      filters: { status: "all", channel: "Instagram" },
    },
  ];

  // Sort handler
  const handleSort = React.useCallback(
    (key: string, direction: "asc" | "desc") => {
      setSortKey(key);
      setSortDirection(direction);
    },
    [],
  );

  // Filtered + sorted data
  const sortedData = React.useMemo(() => {
    let filtered = [...MOCK_ORDERS];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    // Channel filter
    if (channelFilter !== "all") {
      filtered = filtered.filter((o) => o.channel === channelFilter);
    }

    const sorted = filtered;
    sorted.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let cmp = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal), "pt-BR");
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [sortKey, sortDirection, searchQuery, statusFilter, channelFilter]);

  // Paginated data
  const pageSize = 10;
  const paginatedData = React.useMemo(
    () => sortedData.slice((page - 1) * pageSize, page * pageSize),
    [sortedData, page],
  );

  // Bulk actions
  const bulkActions = (
    <>
      <Button variant="outline" size="sm">
        <Download className="mr-1.5 h-3.5 w-3.5" />
        Exportar
      </Button>
      <Button variant="outline" size="sm">
        <Printer className="mr-1.5 h-3.5 w-3.5" />
        Imprimir NF-e
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-danger hover:text-danger"
      >
        <Archive className="mr-1.5 h-3.5 w-3.5" />
        Arquivar
      </Button>
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div>
        <h1 className="font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
          Pedidos
        </h1>
        <p className="mt-1 text-sm text-text-secondary">234 pedidos no total</p>
      </div>

      {/* Filter presets row (saved filters like tables-3) */}
      <div className="flex items-center gap-2 stagger-children">
        <Bookmark className="h-3.5 w-3.5 text-text-ghost" />
        <span className="text-[12px] text-text-muted">Filtros salvos:</span>
        {FILTER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              if (activePreset === preset.id) {
                setActivePreset(null);
                setStatusFilter("all");
                setChannelFilter("all");
              } else {
                setActivePreset(preset.id);
                setStatusFilter(preset.filters.status);
                setChannelFilter(preset.filters.channel);
              }
              setPage(1);
            }}
            className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer min-h-[32px] inline-flex items-center ${
              activePreset === preset.id
                ? "bg-bg-surface text-text-white"
                : "bg-bg-raised text-text-secondary hover:bg-bg-surface"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="w-[260px]">
          <Input
            placeholder="Buscar pedido, cliente, email…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            startContent={
              <Search className="h-4 w-4 shrink-0 text-text-ghost" />
            }
            endContent={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="cursor-pointer text-text-ghost hover:text-text-primary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Status filter */}
        <FilterDropdown
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setActivePreset(null);
            setPage(1);
          }}
          label="Todos os status"
          options={[
            { value: "all", label: "Todos os status" },
            { value: "entregue", label: "Entregue" },
            { value: "preparando", label: "Preparando" },
            { value: "enviado", label: "Enviado" },
            { value: "pendente", label: "Pendente" },
            { value: "cancelado", label: "Cancelado" },
          ]}
        />

        {/* Channel filter */}
        <FilterDropdown
          value={channelFilter}
          onChange={(v) => {
            setChannelFilter(v);
            setActivePreset(null);
            setPage(1);
          }}
          label="Todos os canais"
          options={[
            { value: "all", label: "Todos os canais" },
            { value: "Site", label: "Site" },
            { value: "Instagram", label: "Instagram" },
            { value: "WhatsApp", label: "WhatsApp" },
            { value: "B2B", label: "B2B" },
          ]}
        />

        {/* Date filter */}
        <FilterDropdown
          value={dateFilter}
          onChange={(v) => setDateFilter(v)}
          label="Últimos 30 dias"
          options={[
            { value: "7d", label: "Últimos 7 dias" },
            { value: "30d", label: "Últimos 30 dias" },
            { value: "90d", label: "Últimos 90 dias" },
            { value: "all", label: "Todo o período" },
          ]}
        />

        {/* Active filter indicators */}
        {(statusFilter !== "all" || channelFilter !== "all" || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setChannelFilter("all");
              setSearchQuery("");
              setActivePreset(null);
              setPage(1);
            }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-danger hover:bg-danger-muted transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </button>
        )}

        {/* Right side: Export + Filter icon */}
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="sm">
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            Mais filtros
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-[12px] text-text-muted">
        {sortedData.length === MOCK_ORDERS.length
          ? `${MOCK_ORDERS.length} pedidos`
          : `${sortedData.length} de ${MOCK_ORDERS.length} pedidos`}
      </div>

      {/* Data table */}
      <DataTable<Order>
        columns={columns}
        data={paginatedData}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        pagination={{
          page,
          pageSize,
          total: sortedData.length,
          onPageChange: setPage,
        }}
        onRowClick={(row) => setSheetOrder(row)}
        bulkActions={bulkActions}
      />

      {/* Detail sheet */}
      <Sheet
        isOpen={sheetOrder !== null}
        onClose={() => setSheetOrder(null)}
        title={sheetOrder ? `Pedido #${sheetOrder.orderNumber}` : ""}
        width="md"
      >
        {sheetOrder && (
          <div className="flex flex-col gap-6 stagger-children">
            {/* Status */}
            <div>
              <p className="mb-2 font-display text-[10px] uppercase tracking-[0.12em] text-text-muted">
                Status
              </p>
              <StatusBadge
                status={sheetOrder.status}
                statusMap={ORDER_STATUS_MAP}
              />
            </div>

            {/* Cliente */}
            <div>
              <p className="mb-2 font-display text-[10px] uppercase tracking-[0.12em] text-text-muted">
                Cliente
              </p>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-text-primary">
                  {sheetOrder.customer}
                </span>
                <span className="text-sm text-text-secondary">
                  {sheetOrder.email}
                </span>
                <span className="font-mono text-sm text-text-secondary">
                  {sheetOrder.phone}
                </span>
              </div>
            </div>

            {/* Itens */}
            <div>
              <p className="mb-2 font-display text-[10px] uppercase tracking-[0.12em] text-text-muted">
                Itens
              </p>
              <div className="flex flex-col gap-2">
                {sheetOrder.products.map((product, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md border border-border-subtle px-3 py-2"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-sm text-text-primary">
                        {product.name}
                      </span>
                      <span className="text-xs text-text-muted">
                        Qtd: {product.qty}
                      </span>
                    </div>
                    <span className="ml-3 shrink-0 font-mono text-sm tabular-nums text-text-secondary">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div>
              <p className="mb-2 font-display text-[10px] uppercase tracking-[0.12em] text-text-muted">
                Total
              </p>
              <span className="font-mono text-lg font-bold tabular-nums text-text-primary">
                {formatCurrency(sheetOrder.total)}
              </span>
            </div>

            {/* Rastreio */}
            <div>
              <p className="mb-2 font-display text-[10px] uppercase tracking-[0.12em] text-text-muted">
                Rastreio
              </p>
              {sheetOrder.tracking ? (
                <span className="font-mono text-sm text-text-primary">
                  {sheetOrder.tracking}
                </span>
              ) : (
                <span className="text-sm text-text-ghost">
                  Aguardando envio
                </span>
              )}
            </div>

            {/* Action */}
            <div className="mt-2">
              <Button variant="outline" className="w-full">
                Editar pedido
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
