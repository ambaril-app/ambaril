import {
  pgSchema,
  pgPolicy,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  serial,
  numeric,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./global";

// ─── Schema ─────────────────────────────────────────────

export const checkoutSchema = pgSchema("checkout");

// ─── Enums ──────────────────────────────────────────────

export const cartStatusEnum = checkoutSchema.enum("cart_status", [
  "active",
  "converted",
  "abandoned",
]);

export const orderStatusEnum = checkoutSchema.enum("order_status", [
  "pending",
  "paid",
  "separating",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);

export const checkoutPaymentMethodEnum = checkoutSchema.enum("payment_method", [
  "credit_card",
  "pix",
  "bank_slip",
]);

export const abTestStatusEnum = checkoutSchema.enum("ab_test_status", [
  "draft",
  "running",
  "completed",
  "cancelled",
]);

// ─── Tables ─────────────────────────────────────────────

// checkout.carts
export const carts = checkoutSchema.table(
  "carts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    sessionId: varchar("session_id", { length: 255 }).notNull(),
    contactId: uuid("contact_id"), // FK to crm.contacts(id) — cross-schema, added later
    status: cartStatusEnum("status").notNull().default("active"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }),
    total: numeric("total", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    couponId: uuid("coupon_id"), // FK to creators.coupons(id) — cross-schema, added later
    utmSource: varchar("utm_source", { length: 255 }),
    utmMedium: varchar("utm_medium", { length: 255 }),
    utmCampaign: varchar("utm_campaign", { length: 255 }),
    utmContent: varchar("utm_content", { length: 255 }),
    shippingAddress: jsonb("shipping_address"), // { street, number, complement, neighborhood, city, state, zip_code }
    billingCpf: varchar("billing_cpf", { length: 14 }),
    metadata: jsonb("metadata"), // AB test variant, referrer, etc.
    abandonedAt: timestamp("abandoned_at", { withTimezone: true }),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_carts_tenant").on(table.tenantId),
    index("idx_carts_session").on(table.sessionId),
    index("idx_carts_contact").on(table.contactId),
    index("idx_carts_status").on(table.status),
    index("idx_carts_abandoned").on(table.abandonedAt),
    // Partial index WHERE status = 'abandoned' — applied via migration SQL
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// checkout.cart_items
export const cartItems = checkoutSchema.table(
  "cart_items",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    skuId: uuid("sku_id").notNull(), // FK to erp.skus(id) — cross-schema, added later
    quantity: integer("quantity").notNull(), // CHECK (quantity > 0) — applied via migration SQL
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_cart_items_tenant").on(table.tenantId),
    index("idx_cart_items_cart").on(table.cartId),
    index("idx_cart_items_sku").on(table.skuId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// checkout.orders
export const orders = checkoutSchema.table(
  "orders",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    orderNumber: serial("order_number").notNull(),
    contactId: uuid("contact_id").notNull(), // FK to crm.contacts(id) — cross-schema, added later
    status: orderStatusEnum("status").notNull().default("pending"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: checkoutPaymentMethodEnum("payment_method").notNull(),
    paymentId: varchar("payment_id", { length: 255 }), // Mercado Pago payment ID
    installments: integer("installments").notNull().default(1),
    pixDiscountApplied: boolean("pix_discount_applied")
      .notNull()
      .default(false),
    couponId: uuid("coupon_id"), // FK to creators.coupons(id) — cross-schema, added later
    utmSource: varchar("utm_source", { length: 255 }),
    utmMedium: varchar("utm_medium", { length: 255 }),
    utmCampaign: varchar("utm_campaign", { length: 255 }),
    utmContent: varchar("utm_content", { length: 255 }),
    shippingAddress: jsonb("shipping_address").notNull(), // { street, number, complement, neighborhood, city, state, zip_code }
    billingCpf: varchar("billing_cpf", { length: 14 }).notNull(),
    nfeId: uuid("nfe_id"), // FK to erp.nfe_documents(id) — cross-schema, added later
    trackingCode: varchar("tracking_code", { length: 100 }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_orders_tenant").on(table.tenantId),
    uniqueIndex("idx_orders_number").on(table.tenantId, table.orderNumber),
    index("idx_orders_contact").on(table.contactId),
    index("idx_orders_status").on(table.status),
    index("idx_orders_coupon").on(table.couponId),
    // Partial index WHERE coupon_id IS NOT NULL — applied via migration SQL
    index("idx_orders_nfe").on(table.nfeId),
    // Partial index WHERE nfe_id IS NOT NULL — applied via migration SQL
    index("idx_orders_created").on(table.createdAt),
    index("idx_orders_payment_method").on(table.paymentMethod),
    index("idx_orders_shipped").on(table.shippedAt),
    // Partial index WHERE shipped_at IS NOT NULL — applied via migration SQL
    index("idx_orders_utm").on(
      table.utmSource,
      table.utmMedium,
      table.utmCampaign,
    ),
    index("idx_orders_not_deleted").on(table.id),
    // Partial index WHERE deleted_at IS NULL — applied via migration SQL
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// checkout.order_items
export const orderItems = checkoutSchema.table(
  "order_items",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    skuId: uuid("sku_id").notNull(), // FK to erp.skus(id) — cross-schema, added later
    productName: varchar("product_name", { length: 255 }).notNull(),
    skuCode: varchar("sku_code", { length: 50 }).notNull(),
    size: varchar("size", { length: 10 }).notNull(),
    color: varchar("color", { length: 50 }).notNull(),
    quantity: integer("quantity").notNull(), // CHECK (quantity > 0) — applied via migration SQL
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_order_items_tenant").on(table.tenantId),
    index("idx_order_items_order").on(table.orderId),
    index("idx_order_items_sku").on(table.skuId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// checkout.abandoned_carts
export const abandonedCarts = checkoutSchema.table(
  "abandoned_carts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id),
    contactId: uuid("contact_id"), // FK to crm.contacts(id) — cross-schema, added later
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    totalValue: numeric("total_value", { precision: 12, scale: 2 }).notNull(),
    recoveryStatus: varchar("recovery_status", { length: 50 })
      .notNull()
      .default("pending"), // pending, contacted_30m, contacted_2h, contacted_24h, recovered, expired
    recoveredOrderId: uuid("recovered_order_id").references(() => orders.id),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_abandoned_carts_tenant").on(table.tenantId),
    index("idx_abandoned_carts_cart").on(table.cartId),
    index("idx_abandoned_carts_contact").on(table.contactId),
    index("idx_abandoned_carts_status").on(table.recoveryStatus),
    index("idx_abandoned_carts_created").on(table.createdAt),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// checkout.utm_tracking
export const utmTracking = checkoutSchema.table(
  "utm_tracking",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    sessionId: varchar("session_id", { length: 255 }).notNull(),
    contactId: uuid("contact_id"), // FK to crm.contacts(id) — cross-schema, added later
    utmSource: varchar("utm_source", { length: 255 }),
    utmMedium: varchar("utm_medium", { length: 255 }),
    utmCampaign: varchar("utm_campaign", { length: 255 }),
    utmContent: varchar("utm_content", { length: 255 }),
    utmTerm: varchar("utm_term", { length: 255 }),
    referrer: text("referrer"),
    landingPage: text("landing_page"),
    converted: boolean("converted").notNull().default(false),
    orderId: uuid("order_id").references(() => orders.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_utm_tracking_tenant").on(table.tenantId),
    index("idx_utm_tracking_session").on(table.sessionId),
    index("idx_utm_tracking_contact").on(table.contactId),
    index("idx_utm_tracking_source").on(
      table.utmSource,
      table.utmMedium,
      table.utmCampaign,
    ),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// checkout.ab_tests
export const abTests = checkoutSchema.table(
  "ab_tests",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: abTestStatusEnum("status").notNull().default("draft"),
    variantA: jsonb("variant_a").notNull(), // { name, config }
    variantB: jsonb("variant_b").notNull(), // { name, config }
    trafficSplit: numeric("traffic_split", { precision: 3, scale: 2 })
      .notNull()
      .default("0.50"),
    variantASessions: integer("variant_a_sessions").notNull().default(0),
    variantBSessions: integer("variant_b_sessions").notNull().default(0),
    variantAConversions: integer("variant_a_conversions").notNull().default(0),
    variantBConversions: integer("variant_b_conversions").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    winner: varchar("winner", { length: 1 }), // 'A' or 'B'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_ab_tests_tenant").on(table.tenantId),
    index("idx_ab_tests_status").on(table.status),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();
