// API envelope type — every API response uses this format
export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
  errors?: ApiError[];
}

export interface ApiMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

// RBAC types
export type RoleCode =
  | "admin"
  | "pm"
  | "creative"
  | "operations"
  | "support"
  | "finance"
  | "commercial"
  | "b2b_retailer"
  | "creator";

// Permission format: {module}:{resource}:{action}
export type Permission = string;

// Session data (stored in DB, attached to request context)
export interface SessionData {
  userId: string;
  role: RoleCode;
  permissions: Permission[];
  name: string;
  email: string;
}

// Module registry for sidebar
export interface ModuleConfig {
  id: string;
  label: string;
  icon: string;
  basePath: string;
  requiredRoles: RoleCode[];
  subroutes: SubRoute[];
}

export interface SubRoute {
  id: string;
  label: string;
  path: string;
  requiredPermission?: Permission;
}

// Notification priority
export type NotificationPriority = "low" | "medium" | "high" | "critical";

// Audit action
export type AuditAction = "create" | "update" | "delete";

// ─── Tenant (prepare for ADR-014) ──────────────────────

export interface TenantData {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  plan: "starter" | "pro" | "enterprise";
  settings: Record<string, unknown>;
}

// Expanded session with tenant context
export interface TenantSessionData extends SessionData {
  tenantId: string;
  tenantSlug: string;
}

// ─── Checkout ──────────────────────────────────────────

export type CartStatus = "active" | "converted" | "abandoned";

export type OrderStatus =
  | "pending"
  | "paid"
  | "separating"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentMethod = "credit_card" | "pix" | "bank_slip";

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  total: string; // NUMERIC(12,2) as string
  paymentMethod: PaymentMethod;
  contactName: string;
  createdAt: string;
}

// ─── CRM ───────────────────────────────────────────────

export type ContactSource =
  | "checkout"
  | "crm_import"
  | "whatsapp"
  | "manual"
  | "creator_referral";

export interface ContactSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: ContactSource;
  totalOrders: number;
  totalSpent: string; // NUMERIC(12,2) as string
  lastOrderAt: string | null;
  tags: string[];
}

// ─── ERP ───────────────────────────────────────────────

export type SkuTier = "gold" | "silver" | "bronze";

export type MovementType =
  | "purchase"
  | "sale"
  | "return"
  | "adjustment"
  | "transfer"
  | "production"
  | "damage"
  | "gifting";

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  isActive: boolean;
  totalSkus: number;
  totalStock: number;
}

export interface SkuSummary {
  id: string;
  skuCode: string;
  productName: string;
  size: string;
  color: string;
  sellPrice: string; // NUMERIC(12,2) as string
  currentStock: number;
  tier: SkuTier | null;
}

// ─── Creators ──────────────────────────────────────────

// Tiers are configurable per tenant (stored in creators.creator_tiers table).
// CIENA defaults: seed (8%), grow (10%), bloom (12%), core (15%).
export type CreatorStatus = "pending" | "active" | "suspended" | "inactive";

export interface CreatorTierConfig {
  id: string;
  name: string;
  slug: string;
  commissionRate: string; // NUMERIC(5,2) as string
  minFollowers: number;
  benefits: Record<string, unknown>;
  sortOrder: number;
}

export interface CreatorSummary {
  id: string;
  name: string;
  instagramHandle: string;
  tierName: string; // Dynamic — comes from creator_tiers table
  status: CreatorStatus;
  totalSales: string; // NUMERIC(12,2) as string
  totalEarnings: string; // NUMERIC(12,2) as string
  couponCode: string | null;
}

// ─── WhatsApp ──────────────────────────────────────────

export type MessageDirection = "inbound" | "outbound";
export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";
export type ConversationStatus = "open" | "closed" | "archived";

// ─── Dashboard ─────────────────────────────────────────

export type WarRoomStatus = "scheduled" | "active" | "ended";

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  dataSource: string;
  config: Record<string, unknown>;
}
