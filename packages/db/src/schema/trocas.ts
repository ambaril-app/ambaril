import {
  pgSchema,
  pgPolicy,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants, users } from "./global";

// ─── Schema ─────────────────────────────────────────────

export const trocasSchema = pgSchema("trocas");

// ─── Enums ──────────────────────────────────────────────

export const exchangeStatusEnum = trocasSchema.enum("exchange_status", [
  "requested",
  "approved",
  "label_generated",
  "shipped_back",
  "received",
  "refunded",
  "store_credit_issued",
  "denied",
  "cancelled",
]);

export const exchangeReasonEnum = trocasSchema.enum("exchange_reason", [
  "wrong_size",
  "defective",
  "not_as_described",
  "changed_mind",
  "other",
]);

export const returnMethodEnum = trocasSchema.enum("return_method", [
  "melhor_envio",
  "loggi",
  "in_store",
  "other",
]);

// ─── Tables ─────────────────────────────────────────────

// 1. trocas.exchange_requests
export const exchangeRequests = trocasSchema
  .table(
    "exchange_requests",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      orderId: varchar("order_id", { length: 100 }).notNull(), // external order ref from ERP
      customerName: varchar("customer_name", { length: 255 }).notNull(),
      customerEmail: varchar("customer_email", { length: 255 }).notNull(),
      customerPhone: varchar("customer_phone", { length: 50 }),
      status: exchangeStatusEnum("status").notNull().default("requested"),
      reason: exchangeReasonEnum("reason").notNull(),
      reasonDetail: text("reason_detail"),
      returnMethod: returnMethodEnum("return_method"),
      trackingCode: varchar("tracking_code", { length: 100 }),
      shippingLabelUrl: text("shipping_label_url"),
      refundAmount: numeric("refund_amount", { precision: 12, scale: 2 }),
      storeCreditAmount: numeric("store_credit_amount", {
        precision: 12,
        scale: 2,
      }),
      notes: text("notes"),
      resolvedBy: uuid("resolved_by").references(() => users.id),
      resolvedAt: timestamp("resolved_at", { withTimezone: true }),
      createdBy: uuid("created_by")
        .notNull()
        .references(() => users.id),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_exchange_requests_tenant").on(table.tenantId),
      index("idx_exchange_requests_order").on(table.orderId),
      index("idx_exchange_requests_status").on(table.status),
      index("idx_exchange_requests_reason").on(table.reason),
      index("idx_exchange_requests_tracking")
        .on(table.trackingCode)
        .where(sql`tracking_code IS NOT NULL`),
      index("idx_exchange_requests_created").on(table.createdAt),
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

// 2. trocas.exchange_items
export const exchangeItems = trocasSchema
  .table(
    "exchange_items",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      exchangeRequestId: uuid("exchange_request_id")
        .notNull()
        .references(() => exchangeRequests.id),
      skuCode: varchar("sku_code", { length: 50 }).notNull(),
      productName: varchar("product_name", { length: 255 }).notNull(),
      quantity: integer("quantity").notNull(),
      reason: text("reason"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_exchange_items_tenant").on(table.tenantId),
      index("idx_exchange_items_request").on(table.exchangeRequestId),
      index("idx_exchange_items_sku").on(table.skuCode),
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

// 3. trocas.exchange_status_history
export const exchangeStatusHistory = trocasSchema
  .table(
    "exchange_status_history",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      exchangeRequestId: uuid("exchange_request_id")
        .notNull()
        .references(() => exchangeRequests.id),
      fromStatus: varchar("from_status", { length: 50 }).notNull(),
      toStatus: varchar("to_status", { length: 50 }).notNull(),
      changedBy: uuid("changed_by")
        .notNull()
        .references(() => users.id),
      notes: text("notes"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_exchange_status_history_tenant").on(table.tenantId),
      index("idx_exchange_status_history_request").on(table.exchangeRequestId),
      index("idx_exchange_status_history_created").on(table.createdAt),
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
