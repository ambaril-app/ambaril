import type { ModuleConfig, RoleCode } from "../types/index";

// All roles in the system (9 total)
export const ROLES: readonly RoleCode[] = [
  "admin",
  "pm",
  "creative",
  "operations",
  "support",
  "finance",
  "commercial",
  "b2b_retailer",
  "creator",
] as const;

// Internal team roles (excludes external users)
export const INTERNAL_ROLES: readonly RoleCode[] = [
  "admin",
  "pm",
  "creative",
  "operations",
  "support",
  "finance",
  "commercial",
] as const;

// Module registry — single source of truth for sidebar, home page, and catch-all routes.
// When a module is implemented, change its status from "coming_soon" to "active" here.
// Sidebar, home page, and catch-all placeholder all react automatically.
export const MODULES: ModuleConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Visão geral e War Room",
    icon: "LayoutDashboard",
    basePath: "/admin/dashboard",
    status: "coming_soon",
    requiredRoles: ["admin", "pm", "creative", "operations", "finance"],
    subroutes: [
      {
        id: "dashboard-overview",
        label: "Visão Geral",
        path: "/admin/dashboard",
      },
      {
        id: "dashboard-war-room",
        label: "War Room",
        path: "/admin/dashboard/war-room",
        requiredPermission: "dashboard:war_room:read",
      },
    ],
  },
  {
    id: "erp",
    label: "ERP",
    description: "Produtos, estoque, NF-e e frete",
    icon: "Package",
    basePath: "/admin/erp",
    status: "coming_soon",
    requiredRoles: ["admin", "operations", "finance"],
    subroutes: [
      { id: "erp-orders", label: "Pedidos", path: "/admin/erp/orders" },
      { id: "erp-products", label: "Produtos", path: "/admin/erp/products" },
      {
        id: "erp-inventory",
        label: "Estoque",
        path: "/admin/erp/inventory",
        requiredPermission: "erp:inventory:read",
      },
      {
        id: "erp-nfe",
        label: "Notas Fiscais",
        path: "/admin/erp/nfe",
        requiredPermission: "erp:nfe:read",
      },
      {
        id: "erp-finance",
        label: "Financeiro",
        path: "/admin/erp/finance",
        requiredPermission: "erp:finance:read",
      },
    ],
  },
  {
    id: "plm",
    label: "PLM",
    description: "Produção, coleções e fornecedores",
    icon: "ClipboardList",
    basePath: "/admin/plm",
    status: "coming_soon",
    requiredRoles: ["admin", "operations", "creative"],
    subroutes: [
      {
        id: "plm-production",
        label: "Produção",
        path: "/admin/plm/production",
      },
      {
        id: "plm-suppliers",
        label: "Fornecedores",
        path: "/admin/plm/suppliers",
      },
      { id: "plm-materials", label: "Insumos", path: "/admin/plm/materials" },
      { id: "plm-costs", label: "Custos", path: "/admin/plm/costs" },
    ],
  },
  {
    id: "tarefas",
    label: "Tarefas",
    description: "Projetos, dailies e editorial",
    icon: "CheckSquare",
    basePath: "/admin/tarefas",
    status: "coming_soon",
    requiredRoles: [
      "admin",
      "pm",
      "creative",
      "operations",
      "support",
      "finance",
    ],
    subroutes: [
      { id: "tarefas-gantt", label: "Gantt", path: "/admin/tarefas/gantt" },
      { id: "tarefas-kanban", label: "Kanban", path: "/admin/tarefas/kanban" },
      {
        id: "tarefas-calendar",
        label: "Editorial",
        path: "/admin/tarefas/calendar",
      },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    description: "Contatos, segmentos e automações",
    icon: "Users",
    basePath: "/admin/crm",
    status: "coming_soon",
    requiredRoles: ["admin", "pm", "support"],
    subroutes: [
      { id: "crm-contacts", label: "Contatos", path: "/admin/crm/contacts" },
      {
        id: "crm-segments",
        label: "Segmentos",
        path: "/admin/crm/segments",
        requiredPermission: "crm:segments:read",
      },
      {
        id: "crm-automations",
        label: "Automações",
        path: "/admin/crm/automations",
        requiredPermission: "crm:automations:read",
      },
      {
        id: "crm-campaigns",
        label: "Campanhas",
        path: "/admin/crm/campaigns",
        requiredPermission: "crm:campaigns:read",
      },
    ],
  },
  {
    id: "mensageria",
    label: "Mensageria",
    description: "WhatsApp, email e Inbox",
    icon: "MessageCircle",
    basePath: "/admin/mensageria",
    status: "coming_soon",
    requiredRoles: ["admin", "pm", "support"],
    subroutes: [
      {
        id: "mensageria-inbox",
        label: "Inbox",
        path: "/admin/mensageria/inbox",
      },
      {
        id: "mensageria-broadcasts",
        label: "Broadcasts",
        path: "/admin/mensageria/broadcasts",
        requiredPermission: "messaging:broadcasts:read",
      },
      {
        id: "mensageria-templates",
        label: "Templates",
        path: "/admin/mensageria/templates",
        requiredPermission: "messaging:templates:read",
      },
    ],
  },
  {
    id: "trocas",
    label: "Trocas",
    description: "Reversa, créditos e devoluções",
    icon: "RefreshCw",
    basePath: "/admin/trocas",
    status: "coming_soon",
    requiredRoles: ["admin", "support", "operations"],
    subroutes: [
      {
        id: "trocas-requests",
        label: "Solicitações",
        path: "/admin/trocas/requests",
      },
      {
        id: "trocas-logistics",
        label: "Logística Reversa",
        path: "/admin/trocas/logistics",
      },
    ],
  },
  {
    id: "creators",
    label: "Creators",
    description: "Programa de influenciadores",
    icon: "Star",
    basePath: "/admin/creators",
    status: "coming_soon",
    requiredRoles: ["admin", "pm"],
    subroutes: [
      { id: "creators-list", label: "Creators", path: "/admin/creators" },
      {
        id: "creators-challenges",
        label: "Desafios",
        path: "/admin/creators/challenges",
        requiredPermission: "creators:challenges:read",
      },
      {
        id: "creators-payouts",
        label: "Pagamentos",
        path: "/admin/creators/payouts",
        requiredPermission: "creators:payouts:read",
      },
    ],
  },
  {
    id: "dam",
    label: "DAM",
    description: "Repositório de assets",
    icon: "Image",
    basePath: "/admin/dam",
    status: "coming_soon",
    requiredRoles: ["admin", "creative", "pm"],
    subroutes: [
      { id: "dam-assets", label: "Assets", path: "/admin/dam/assets" },
      {
        id: "dam-collections",
        label: "Coleções",
        path: "/admin/dam/collections",
      },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Inteligência e Ads",
    icon: "Megaphone",
    basePath: "/admin/marketing",
    status: "coming_soon",
    requiredRoles: ["admin", "pm", "creative"],
    subroutes: [
      {
        id: "marketing-ugc",
        label: "UGC Monitor",
        path: "/admin/marketing/ugc",
      },
      {
        id: "marketing-competitors",
        label: "Competitor Watch",
        path: "/admin/marketing/competitors",
      },
      {
        id: "marketing-ads",
        label: "Ads Reporting",
        path: "/admin/marketing/ads",
      },
    ],
  },
  {
    id: "b2b",
    label: "B2B",
    description: "Atacado e Portal",
    icon: "Briefcase",
    basePath: "/admin/b2b",
    status: "coming_soon",
    requiredRoles: ["admin", "commercial"],
    subroutes: [
      { id: "b2b-orders", label: "Pedidos B2B", path: "/admin/b2b/orders" },
      { id: "b2b-retailers", label: "Lojistas", path: "/admin/b2b/retailers" },
    ],
  },
  {
    id: "pulse",
    label: "Pulse",
    description: "Discord Bot e Relatórios",
    icon: "Radio",
    basePath: "/admin/pulse",
    status: "coming_soon",
    requiredRoles: ["admin"],
    subroutes: [
      { id: "pulse-channels", label: "Canais", path: "/admin/pulse/channels" },
    ],
  },
  {
    id: "astro",
    label: "Astro",
    description: "AI Brain",
    icon: "Sparkles",
    basePath: "/admin/astro",
    status: "coming_soon",
    requiredRoles: ["admin"],
    subroutes: [
      { id: "astro-brain", label: "Brand Brain", path: "/admin/astro/brain" },
    ],
  },
];

// Session config
export const SESSION_COOKIE_NAME = "ambaril_session";
export const SESSION_TTL_DEFAULT = 7 * 24 * 60 * 60; // 7 days in seconds
export const SESSION_TTL_REMEMBER = 30 * 24 * 60 * 60; // 30 days in seconds

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// ─── SKU Tiers ─────────────────────────────────────────
export const SKU_TIERS = ["gold", "silver", "bronze"] as const;

// ─── Order Statuses ────────────────────────────────────
export const ORDER_STATUSES = [
  "pending",
  "paid",
  "separating",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
export const PAYMENT_METHODS = ["credit_card", "pix", "bank_slip"] as const;

// ─── Contact Sources ───────────────────────────────────
export const CONTACT_SOURCES = [
  "checkout",
  "crm_import",
  "whatsapp",
  "manual",
  "creator_referral",
] as const;

// ─── Messaging (unified WhatsApp + Email) ─────────────
export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export const MESSAGE_STATUSES = [
  "pending",
  "sent",
  "delivered",
  "read",
  "failed",
] as const;
export const THREAD_STATUSES = [
  "open",
  "pending",
  "resolved",
  "closed",
] as const;
export const MESSAGING_CHANNELS = ["whatsapp", "email"] as const;

// ─── Sidebar Module Groups ─────────────────────────────
export const MODULE_GROUPS = [
  {
    id: "core",
    label: "Operação",
    moduleIds: ["dashboard", "erp", "plm", "tarefas"],
  },
  {
    id: "growth",
    label: "Retenção & Crescimento",
    moduleIds: ["crm", "mensageria", "trocas", "creators", "marketing"],
  },
  {
    id: "infra",
    label: "Inteligência & B2B",
    moduleIds: ["dam", "b2b", "pulse", "astro"],
  },
] as const;
