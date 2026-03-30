// Provider Layer — Capability interfaces and shared data types
// Modules consume capabilities, never providers directly.
// See CLAUDE.md "Provider Abstraction" for architecture rationale.

// ---------------------------------------------------------------------------
// Data types — used by capability interfaces
// ---------------------------------------------------------------------------

/** Normalized coupon representation across ecommerce providers */
export interface EcommerceCoupon {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  /** NUMERIC(12,2) string — never a float */
  discountValue: string;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
}

/** Input for creating a coupon via the ecommerce capability */
export interface CreateCouponInput {
  code: string;
  title: string;
  discountType: "percent" | "fixed";
  /** NUMERIC(12,2) string — never a float */
  discountValue: string;
  usageLimit?: number;
}

/** Normalized product representation across ecommerce providers */
export interface EcommerceProduct {
  id: string;
  title: string;
  handle: string;
  images?: string[];
  variants?: EcommerceProductVariant[];
}

export interface EcommerceProductVariant {
  id: string;
  title: string;
  /** NUMERIC(12,2) string — never a float */
  price: string;
  sku: string;
}

/** Normalized order from checkout providers */
export interface CheckoutOrder {
  id: string;
  orderNumber: string;
  /** NUMERIC(12,2) string — never a float */
  total: string;
  /** NUMERIC(12,2) string — never a float */
  discount: string;
  couponCode: string;
  customerCpf?: string;
  status: string;
  createdAt: string;
}

/** Options for sending an email via the messaging capability */
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/** Normalized social media profile */
export interface SocialProfile {
  id: string;
  handle: string;
  displayName: string;
  followerCount: number;
  avatarUrl?: string;
}

/** Normalized social media mention / post */
export interface SocialMention {
  id: string;
  mediaUrl: string;
  caption?: string;
  timestamp: string;
  mediaType: "image" | "video" | "carousel";
}

// ---------------------------------------------------------------------------
// Capability interfaces — what modules consume
// ---------------------------------------------------------------------------

/**
 * Ecommerce capability — product catalog, coupons, inventory.
 * Based on apps/web/src/lib/shopify.ts (createDiscountCode, getProducts).
 */
export interface EcommerceProvider {
  listCoupons(): Promise<EcommerceCoupon[]>;
  createCoupon(input: CreateCouponInput): Promise<{ id: string }>;
  listProducts(limit?: number): Promise<EcommerceProduct[]>;
}

/**
 * Checkout capability — order lookup and sale attribution.
 * Based on apps/web/src/lib/yever.ts (getOrdersByCoupon, getOrderById).
 */
export interface CheckoutProvider {
  listOrdersByCoupon(
    couponCode: string,
    since?: Date,
  ): Promise<CheckoutOrder[]>;
  getOrder(orderId: string): Promise<CheckoutOrder | null>;
}

/**
 * Messaging capability — transactional and marketing emails.
 * Based on apps/web/src/lib/email.ts (sendEmail + templates).
 */
export interface MessagingProvider {
  sendEmail(options: EmailOptions): Promise<{ id: string }>;
}

/**
 * Storage capability — file uploads and public URL generation.
 * Based on apps/web/src/lib/storage.ts (presigned URLs).
 */
export interface StorageProvider {
  getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<{ url: string; key: string }>;
  getPublicUrl(key: string): string;
}

/**
 * Social capability — profile and mention tracking.
 * Stub for future Instagram Graph API integration.
 */
export interface SocialProvider {
  getProfile(handle: string): Promise<SocialProfile | null>;
  searchMentions(hashtag: string, since?: Date): Promise<SocialMention[]>;
}

// ---------------------------------------------------------------------------
// Capability map and factory
// ---------------------------------------------------------------------------

/** All supported capability keys */
export type Capability =
  | "ecommerce"
  | "checkout"
  | "messaging"
  | "storage"
  | "social";

/** Maps each capability key to its provider interface */
export interface CapabilityMap {
  ecommerce: EcommerceProvider;
  checkout: CheckoutProvider;
  messaging: MessagingProvider;
  storage: StorageProvider;
  social: SocialProvider;
}

/**
 * Factory function that resolves a provider for a given tenant.
 * Tenant-specific credentials are loaded from `global.tenant_integrations`.
 */
export type ProviderFactory<K extends Capability> = (
  tenantId: string,
) => Promise<CapabilityMap[K]>;
