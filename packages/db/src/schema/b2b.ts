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
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants, users } from "./global";

// ─── Schema ─────────────────────────────────────────────

export const b2bSchema = pgSchema("b2b");

// ─── Enums ──────────────────────────────────────────────

export const retailerStatusEnum = b2bSchema.enum("retailer_status", [
  "pending",
  "active",
  "suspended",
  "inactive",
]);

export const b2bOrderStatusEnum = b2bSchema.enum("b2b_order_status", [
  "draft",
  "submitted",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
]);

// ─── Tables ─────────────────────────────────────────────

// 1. b2b.retailers
export const retailers = b2bSchema
  .table(
    "retailers",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      companyName: varchar("company_name", { length: 255 }).notNull(),
      tradeName: varchar("trade_name", { length: 255 }),
      cnpj: varchar("cnpj", { length: 18 }).notNull(),
      contactName: varchar("contact_name", { length: 255 }).notNull(),
      email: varchar("email", { length: 255 }).notNull(),
      phone: varchar("phone", { length: 50 }).notNull(),
      address: jsonb("address"),
      status: retailerStatusEnum("status").notNull().default("pending"),
      inviteToken: varchar("invite_token", { length: 100 }),
      invitedAt: timestamp("invited_at", { withTimezone: true }),
      activatedAt: timestamp("activated_at", { withTimezone: true }),
      notes: text("notes"),
      createdBy: uuid("created_by")
        .notNull()
        .references(() => users.id),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (table) => [
      index("idx_retailers_tenant").on(table.tenantId),
      index("idx_retailers_status").on(table.status),
      index("idx_retailers_cnpj").on(table.cnpj),
      uniqueIndex("idx_retailers_invite_token")
        .on(table.tenantId, table.inviteToken)
        .where(sql`invite_token IS NOT NULL`),
      index("idx_retailers_not_deleted")
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
  )
  .enableRLS();

// 2. b2b.b2b_price_tables
export const b2bPriceTables = b2bSchema
  .table(
    "b2b_price_tables",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 100 }).notNull(),
      description: text("description"),
      markupPercent: numeric("markup_percent", {
        precision: 5,
        scale: 2,
      }).notNull(), // e.g. -30 for 30% discount from retail
      minOrderAmount: numeric("min_order_amount", { precision: 12, scale: 2 })
        .notNull()
        .default("2000"),
      isDefault: boolean("is_default").notNull().default(false),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_b2b_price_tables_tenant").on(table.tenantId),
      index("idx_b2b_price_tables_active")
        .on(table.isActive)
        .where(sql`is_active = TRUE`),
      pgPolicy("tenant_isolation", {
        as: "permissive",
        for: "all",
        to: "public",
        using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
        withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      }),
    ],
  )
  .enableRLS();

// 3. b2b.b2b_orders
export const b2bOrders = b2bSchema
  .table(
    "b2b_orders",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      retailerId: uuid("retailer_id")
        .notNull()
        .references(() => retailers.id),
      priceTableId: uuid("price_table_id").references(() => b2bPriceTables.id),
      orderNumber: varchar("order_number", { length: 30 }).notNull(),
      status: b2bOrderStatusEnum("status").notNull().default("draft"),
      subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
      discount: numeric("discount", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      total: numeric("total", { precision: 12, scale: 2 }).notNull(),
      paymentMethod: varchar("payment_method", { length: 50 }),
      notes: text("notes"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_b2b_orders_tenant").on(table.tenantId),
      index("idx_b2b_orders_retailer").on(table.retailerId),
      uniqueIndex("idx_b2b_orders_number").on(
        table.tenantId,
        table.orderNumber,
      ),
      index("idx_b2b_orders_status").on(table.status),
      index("idx_b2b_orders_created").on(table.createdAt),
      pgPolicy("tenant_isolation", {
        as: "permissive",
        for: "all",
        to: "public",
        using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
        withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      }),
    ],
  )
  .enableRLS();

// 4. b2b.b2b_order_items
export const b2bOrderItems = b2bSchema
  .table(
    "b2b_order_items",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      orderId: uuid("order_id")
        .notNull()
        .references(() => b2bOrders.id),
      skuCode: varchar("sku_code", { length: 50 }).notNull(),
      productName: varchar("product_name", { length: 255 }).notNull(),
      quantity: integer("quantity").notNull(),
      unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
      total: numeric("total", { precision: 12, scale: 2 }).notNull(),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_b2b_order_items_tenant").on(table.tenantId),
      index("idx_b2b_order_items_order").on(table.orderId),
      index("idx_b2b_order_items_sku").on(table.skuCode),
      pgPolicy("tenant_isolation", {
        as: "permissive",
        for: "all",
        to: "public",
        using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
        withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      }),
    ],
  )
  .enableRLS();
