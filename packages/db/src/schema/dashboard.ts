import {
  pgSchema,
  pgPolicy,
  uuid,
  varchar,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./global";

// ─── Schema ─────────────────────────────────────────────

export const dashboardSchema = pgSchema("dashboard");

// ─── Enums ──────────────────────────────────────────────

export const dashboardWidgetTypeEnum = dashboardSchema.enum("widget_type", [
  "metric_card",
  "line_chart",
  "bar_chart",
  "donut_chart",
  "table",
  "sparkline",
  "custom",
]);

export const warRoomStatusEnum = dashboardSchema.enum("war_room_status", [
  "scheduled",
  "active",
  "ended",
]);

// ─── Tables ─────────────────────────────────────────────

// 1. dashboard.dashboard_configs — personalized dashboard layouts per user
export const dashboardConfigs = dashboardSchema.table(
  "dashboard_configs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    userId: uuid("user_id").notNull(), // FK to global.users(id) — cross-schema, added later
    name: varchar("name", { length: 255 }).notNull(),
    layout: jsonb("layout").notNull(), // [{ widget_id, x, y, w, h }]
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_dashboard_configs_user").on(table.userId),
    index("idx_dashboard_configs_default")
      .on(table.userId)
      .where(sql`is_default = TRUE`),
    index("idx_dashboard_configs_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 2. dashboard.widgets — individual widgets within a dashboard
export const dashboardWidgets = dashboardSchema.table(
  "widgets",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    dashboardId: uuid("dashboard_id")
      .notNull()
      .references(() => dashboardConfigs.id, { onDelete: "cascade" }),
    type: dashboardWidgetTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    dataSource: varchar("data_source", { length: 255 }).notNull(),
    config: jsonb("config").notNull(), // widget-specific config: filters, time range, colors
    refreshIntervalSeconds: integer("refresh_interval_seconds")
      .notNull()
      .default(300),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_widgets_dashboard").on(table.dashboardId),
    index("idx_widgets_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 3. dashboard.war_room_sessions — real-time drop monitoring sessions
export const warRoomSessions = dashboardSchema.table(
  "war_room_sessions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    dropId: uuid("drop_id"), // FK to pcp.drops(id) — cross-schema, added later
    status: warRoomStatusEnum("status").notNull().default("scheduled"),
    activatedBy: uuid("activated_by").notNull(), // FK to global.users(id) — cross-schema, added later
    config: jsonb("config").notNull(), // { sku_ids, comparison_drop_id, alert_thresholds }
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }), // NULL = still active
    totalRevenue: numeric("total_revenue", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    totalOrders: integer("total_orders").notNull().default(0),
    peakOrdersPerMinute: integer("peak_orders_per_minute").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_war_room_status").on(table.status),
    index("idx_war_room_drop").on(table.dropId),
    index("idx_war_room_dates").on(table.startsAt),
    index("idx_war_room_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();
