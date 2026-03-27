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

// Module registry — sidebar renders this
// Each module adds its own entry. Only Creators for now.
export const MODULES: ModuleConfig[] = [
  {
    id: "creators",
    label: "Creators",
    icon: "Users",
    basePath: "/admin/creators",
    requiredRoles: ["admin", "pm"],
    subroutes: [
      { id: "creators-list", label: "Lista", path: "/admin/creators" },
      {
        id: "creators-challenges",
        label: "Desafios",
        path: "/admin/creators/challenges",
        requiredPermission: "creators:challenges:read",
      },
      {
        id: "creators-campaigns",
        label: "Campanhas",
        path: "/admin/creators/campaigns",
        requiredPermission: "creators:campaigns:read",
      },
      {
        id: "creators-payouts",
        label: "Pagamentos",
        path: "/admin/creators/payouts",
        requiredPermission: "creators:payouts:read",
      },
      {
        id: "creators-analytics",
        label: "Analytics",
        path: "/admin/creators/analytics",
        requiredPermission: "creators:analytics:read",
      },
    ],
  },
  // Checkout module
  {
    id: "checkout",
    label: "Checkout",
    icon: "ShoppingCart",
    basePath: "/admin/checkout",
    requiredRoles: ["admin", "pm"],
    subroutes: [
      { id: "checkout-orders", label: "Pedidos", path: "/admin/checkout/orders" },
      { id: "checkout-carts", label: "Carrinhos", path: "/admin/checkout/carts", requiredPermission: "checkout:carts:read" },
      { id: "checkout-abandoned", label: "Abandonados", path: "/admin/checkout/abandoned", requiredPermission: "checkout:abandoned:read" },
      { id: "checkout-ab-tests", label: "Testes A/B", path: "/admin/checkout/ab-tests", requiredPermission: "checkout:ab_tests:read" },
    ],
  },
  // CRM module
  {
    id: "crm",
    label: "CRM",
    icon: "Users",
    basePath: "/admin/crm",
    requiredRoles: ["admin", "pm", "support"],
    subroutes: [
      { id: "crm-contacts", label: "Contatos", path: "/admin/crm/contacts" },
      { id: "crm-segments", label: "Segmentos", path: "/admin/crm/segments", requiredPermission: "crm:segments:read" },
      { id: "crm-automations", label: "Automações", path: "/admin/crm/automations", requiredPermission: "crm:automations:read" },
      { id: "crm-campaigns", label: "Campanhas", path: "/admin/crm/campaigns", requiredPermission: "crm:campaigns:read" },
    ],
  },
  // ERP module
  {
    id: "erp",
    label: "ERP",
    icon: "Package",
    basePath: "/admin/erp",
    requiredRoles: ["admin", "operations", "finance"],
    subroutes: [
      { id: "erp-products", label: "Produtos", path: "/admin/erp/products" },
      { id: "erp-inventory", label: "Estoque", path: "/admin/erp/inventory", requiredPermission: "erp:inventory:read" },
      { id: "erp-nfe", label: "Notas Fiscais", path: "/admin/erp/nfe", requiredPermission: "erp:nfe:read" },
      { id: "erp-finance", label: "Financeiro", path: "/admin/erp/finance", requiredPermission: "erp:finance:read" },
      { id: "erp-shipping", label: "Frete", path: "/admin/erp/shipping", requiredPermission: "erp:shipping:read" },
    ],
  },
  // WhatsApp module
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "MessageCircle",
    basePath: "/admin/whatsapp",
    requiredRoles: ["admin", "pm", "support"],
    subroutes: [
      { id: "whatsapp-conversations", label: "Conversas", path: "/admin/whatsapp/conversations" },
      { id: "whatsapp-templates", label: "Templates", path: "/admin/whatsapp/templates", requiredPermission: "whatsapp:templates:read" },
      { id: "whatsapp-groups", label: "Grupos", path: "/admin/whatsapp/groups", requiredPermission: "whatsapp:groups:read" },
    ],
  },
  // Dashboard module
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    basePath: "/admin/dashboard",
    requiredRoles: ["admin", "pm", "creative", "operations", "finance"],
    subroutes: [
      { id: "dashboard-overview", label: "Visão Geral", path: "/admin/dashboard" },
      { id: "dashboard-war-room", label: "War Room", path: "/admin/dashboard/war-room", requiredPermission: "dashboard:war_room:read" },
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

// ─── Creator Statuses ──────────────────────────────────
// Tiers are configurable per tenant — no hardcoded tier list here.
// See creators.creator_tiers table for tenant-specific tier definitions.
export const CREATOR_STATUSES = ["pending", "active", "suspended", "inactive"] as const;

// ─── Order Statuses ────────────────────────────────────
export const ORDER_STATUSES = ["pending", "paid", "separating", "shipped", "delivered", "cancelled", "returned"] as const;
export const PAYMENT_METHODS = ["credit_card", "pix", "bank_slip"] as const;

// ─── Contact Sources ───────────────────────────────────
export const CONTACT_SOURCES = ["checkout", "crm_import", "whatsapp", "manual", "creator_referral"] as const;

// ─── WhatsApp ──────────────────────────────────────────
export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export const MESSAGE_STATUSES = ["pending", "sent", "delivered", "read", "failed"] as const;
export const CONVERSATION_STATUSES = ["open", "closed", "archived"] as const;

// ─── Sidebar Module Groups ─────────────────────────────
export const MODULE_GROUPS = [
  { id: "commerce", label: "Comércio", moduleIds: ["checkout"] },
  { id: "operations", label: "Operações", moduleIds: ["erp"] },
  { id: "growth", label: "Crescimento", moduleIds: ["crm", "creators"] },
  { id: "communication", label: "Comunicação", moduleIds: ["whatsapp"] },
  { id: "intelligence", label: "Inteligência", moduleIds: ["dashboard"] },
] as const;
