import {
  pgSchema,
  pgPolicy,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants, users } from "./global";

// ─── Schema ─────────────────────────────────────────────

export const erpSchema = pgSchema("erp");

// ─── Enums ──────────────────────────────────────────────

export const skuTierEnum = erpSchema.enum("sku_tier", [
  "gold",
  "silver",
  "bronze",
  "unranked",
]);

export const movementTypeEnum = erpSchema.enum("movement_type", [
  "sale",
  "return",
  "adjustment",
  "production_entry",
  "purchase",
  "loss",
  "tier_change",
]);

export const nfeTypeEnum = erpSchema.enum("nfe_type", ["sale", "return"]);

export const nfeStatusEnum = erpSchema.enum("nfe_status", [
  "pending",
  "authorized",
  "cancelled",
  "rejected",
]);

export const nfeProviderEnum = erpSchema.enum("nfe_provider", [
  "focus_nfe",
  "plugnotas",
]);

export const transactionTypeEnum = erpSchema.enum("transaction_type", [
  "sale",
  "refund",
  "chargeback",
  "fee",
  "pix_received",
  "bank_slip_received",
]);

export const transactionStatusEnum = erpSchema.enum("transaction_status", [
  "pending",
  "confirmed",
  "failed",
  "reversed",
]);

export const shippingLabelStatusEnum = erpSchema.enum(
  "shipping_label_status",
  ["pending", "generated", "printed", "in_transit", "delivered", "cancelled"],
);

// ─── Tables ─────────────────────────────────────────────

// 1. erp.products
export const products = erpSchema.table(
  "products",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_products_tenant").on(table.tenantId),
    // UNIQUE per tenant WHERE deleted_at IS NULL — partial unique index
    uniqueIndex("idx_products_slug")
      .on(table.tenantId, table.slug)
      .where(sql`deleted_at IS NULL`),
    index("idx_products_category").on(table.category),
    index("idx_products_active")
      .on(table.isActive)
      .where(sql`is_active = TRUE`),
    index("idx_products_not_deleted")
      .on(table.id)
      .where(sql`deleted_at IS NULL`),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 2. erp.skus
export const skus = erpSchema.table(
  "skus",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    skuCode: varchar("sku_code", { length: 50 }).notNull(),
    size: varchar("size", { length: 10 }).notNull(),
    color: varchar("color", { length: 50 }).notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    costPrice: numeric("cost_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    weightGrams: integer("weight_grams").notNull().default(0),
    dimensions: jsonb("dimensions"), // { length_cm, width_cm, height_cm }
    barcode: varchar("barcode", { length: 50 }),
    tier: skuTierEnum("tier").notNull().default("unranked"),
    tierUpdatedAt: timestamp("tier_updated_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_skus_tenant").on(table.tenantId),
    uniqueIndex("idx_skus_code").on(table.tenantId, table.skuCode),
    index("idx_skus_product").on(table.productId),
    index("idx_skus_size").on(table.size),
    index("idx_skus_color").on(table.color),
    index("idx_skus_active")
      .on(table.isActive)
      .where(sql`is_active = TRUE`),
    index("idx_skus_tier").on(table.tier),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 3. erp.inventory — one row per SKU (current stock state)
export const inventory = erpSchema.table(
  "inventory",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    skuId: uuid("sku_id")
      .notNull()
      .references(() => skus.id),
    quantityAvailable: integer("quantity_available").notNull().default(0),
    quantityReserved: integer("quantity_reserved").notNull().default(0),
    quantityInProduction: integer("quantity_in_production")
      .notNull()
      .default(0),
    quantityInTransit: integer("quantity_in_transit").notNull().default(0),
    reorderPoint: integer("reorder_point").notNull().default(5),
    depletionVelocity: numeric("depletion_velocity", {
      precision: 8,
      scale: 2,
    })
      .notNull()
      .default("0"),
    lastEntryAt: timestamp("last_entry_at", { withTimezone: true }),
    lastExitAt: timestamp("last_exit_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_inventory_tenant").on(table.tenantId),
    uniqueIndex("idx_inventory_sku").on(table.tenantId, table.skuId),
    index("idx_inventory_low_stock")
      .on(table.quantityAvailable)
      .where(sql`quantity_available <= 10`),
    index("idx_inventory_zero")
      .on(table.skuId)
      .where(sql`quantity_available = 0`),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 4. erp.inventory_movements — append-only movement log
export const inventoryMovements = erpSchema.table(
  "inventory_movements",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    skuId: uuid("sku_id")
      .notNull()
      .references(() => skus.id),
    movementType: movementTypeEnum("movement_type").notNull(),
    quantity: integer("quantity").notNull(), // positive = inbound, negative = outbound
    referenceType: varchar("reference_type", { length: 100 }), // 'order', 'exchange_request', 'production_order', 'manual'
    referenceId: uuid("reference_id"),
    notes: text("notes"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_inv_movements_tenant").on(table.tenantId),
    index("idx_inv_movements_sku").on(table.skuId),
    index("idx_inv_movements_type").on(table.movementType),
    index("idx_inv_movements_reference").on(
      table.referenceType,
      table.referenceId,
    ),
    index("idx_inv_movements_created").on(table.createdAt),
    index("idx_inv_movements_user").on(table.userId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 5. erp.nfe_documents — NF-e fiscal documents
export const nfeDocuments = erpSchema.table(
  "nfe_documents",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    orderId: uuid("order_id").notNull(), // FK to checkout.orders(id) — cross-schema, created later
    type: nfeTypeEnum("type").notNull(),
    nfeNumber: integer("nfe_number"), // sequential NF-e number from SEFAZ
    nfeKey: varchar("nfe_key", { length: 44 }).unique(), // 44-digit access key (chave de acesso) — globally unique (nationally unique)
    status: nfeStatusEnum("status").notNull().default("pending"),
    xmlUrl: text("xml_url"),
    pdfUrl: text("pdf_url"),
    apiProvider: nfeProviderEnum("api_provider").notNull(),
    apiResponse: jsonb("api_response"),
    emittedAt: timestamp("emitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_nfe_tenant").on(table.tenantId),
    index("idx_nfe_order").on(table.orderId),
    index("idx_nfe_status").on(table.status),
    index("idx_nfe_key")
      .on(table.nfeKey)
      .where(sql`nfe_key IS NOT NULL`),
    index("idx_nfe_type").on(table.type),
    index("idx_nfe_emitted")
      .on(table.emittedAt)
      .where(sql`emitted_at IS NOT NULL`),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 6. erp.financial_transactions
export const financialTransactions = erpSchema.table(
  "financial_transactions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    orderId: uuid("order_id"), // FK to checkout.orders(id) — cross-schema, nullable for fees
    type: transactionTypeEnum("type").notNull(),
    status: transactionStatusEnum("status").notNull().default("pending"),
    grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(),
    feeAmount: numeric("fee_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: varchar("payment_method", { length: 50 }), // checkout.payment_method — cross-schema enum, stored as varchar
    externalId: varchar("external_id", { length: 255 }), // Mercado Pago transaction ID
    externalStatus: varchar("external_status", { length: 100 }),
    metadata: jsonb("metadata"),
    reconciled: boolean("reconciled").notNull().default(false),
    reconciledAt: timestamp("reconciled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_fin_tx_tenant").on(table.tenantId),
    index("idx_fin_tx_order").on(table.orderId),
    index("idx_fin_tx_type").on(table.type),
    index("idx_fin_tx_status").on(table.status),
    index("idx_fin_tx_external").on(table.externalId),
    index("idx_fin_tx_reconciled")
      .on(table.reconciled)
      .where(sql`reconciled = FALSE`),
    index("idx_fin_tx_created").on(table.createdAt),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 7. erp.margin_calculations — per-SKU margin analysis
export const marginCalculations = erpSchema.table(
  "margin_calculations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    skuId: uuid("sku_id")
      .notNull()
      .references(() => skus.id),
    sellingPrice: numeric("selling_price", {
      precision: 12,
      scale: 2,
    }).notNull(),
    productionCost: numeric("production_cost", {
      precision: 12,
      scale: 2,
    }).notNull(),
    avgShippingCost: numeric("avg_shipping_cost", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    gatewayFeeRate: numeric("gateway_fee_rate", { precision: 5, scale: 4 })
      .notNull()
      .default("0.0600"),
    gatewayFeeAmount: numeric("gateway_fee_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),
    taxIcmsRate: numeric("tax_icms_rate", { precision: 5, scale: 4 })
      .notNull()
      .default("0"),
    taxPisRate: numeric("tax_pis_rate", { precision: 5, scale: 4 })
      .notNull()
      .default("0"),
    taxCofinsRate: numeric("tax_cofins_rate", { precision: 5, scale: 4 })
      .notNull()
      .default("0"),
    taxTotalAmount: numeric("tax_total_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),
    grossMargin: numeric("gross_margin", {
      precision: 12,
      scale: 2,
    }).notNull(),
    grossMarginPct: numeric("gross_margin_pct", {
      precision: 5,
      scale: 2,
    }).notNull(),
    netMargin: numeric("net_margin", { precision: 12, scale: 2 }).notNull(),
    netMarginPct: numeric("net_margin_pct", {
      precision: 5,
      scale: 2,
    }).notNull(),
    isSimulation: boolean("is_simulation").notNull().default(false),
    calculatedAt: timestamp("calculated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_margin_tenant").on(table.tenantId),
    index("idx_margin_sku").on(table.skuId),
    index("idx_margin_simulation").on(table.isSimulation),
    index("idx_margin_net")
      .on(table.netMarginPct)
      .where(sql`is_simulation = FALSE`),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 8. erp.shipping_labels
export const shippingLabels = erpSchema.table(
  "shipping_labels",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    orderId: uuid("order_id").notNull(), // FK to checkout.orders(id) — cross-schema, created later
    carrier: varchar("carrier", { length: 100 }).notNull(),
    trackingCode: varchar("tracking_code", { length: 100 }),
    status: shippingLabelStatusEnum("status").notNull().default("pending"),
    labelUrl: text("label_url"),
    cost: numeric("cost", { precision: 12, scale: 2 }).notNull().default("0"),
    estimatedDeliveryDays: integer("estimated_delivery_days"),
    melhorEnvioId: varchar("melhor_envio_id", { length: 255 }),
    apiResponse: jsonb("api_response"),
    printedAt: timestamp("printed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_shipping_labels_tenant").on(table.tenantId),
    index("idx_shipping_labels_order").on(table.orderId),
    index("idx_shipping_labels_tracking")
      .on(table.trackingCode)
      .where(sql`tracking_code IS NOT NULL`),
    index("idx_shipping_labels_status").on(table.status),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 9. erp.revenue_leak_daily — Pandora96-inspired daily revenue leak tracking
export const revenueLeakDaily = erpSchema.table(
  "revenue_leak_daily",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    skuId: uuid("sku_id")
      .notNull()
      .references(() => skus.id),
    date: date("date").notNull(),
    pageViews: integer("page_views").notNull().default(0),
    avgConversionRate: numeric("avg_conversion_rate", {
      precision: 5,
      scale: 4,
    })
      .notNull()
      .default("0"),
    avgOrderValue: numeric("avg_order_value", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    estimatedLostRevenue: numeric("estimated_lost_revenue", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_revenue_leak_tenant").on(table.tenantId),
    uniqueIndex("idx_revenue_leak_sku_date").on(table.tenantId, table.skuId, table.date),
    index("idx_revenue_leak_date").on(table.date),
    index("idx_revenue_leak_amount").on(table.estimatedLostRevenue),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();
