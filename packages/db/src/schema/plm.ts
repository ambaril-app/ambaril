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
// Renamed from pcp → plm (Product Lifecycle Management)
// Covers: concept → design → sampling → production → QC → launch → performance → retirement

export const plmSchema = pgSchema("plm");

// ─── Enums ──────────────────────────────────────────────

export const productionOrderStatusEnum = plmSchema.enum(
  "production_order_status",
  ["draft", "planned", "in_progress", "on_hold", "completed", "cancelled"],
);

export const stageStatusEnum = plmSchema.enum("stage_status", [
  "pending",
  "in_progress",
  "completed",
  "delayed",
  "blocked",
]);

export const reworkStatusEnum = plmSchema.enum("rework_status", [
  "pending",
  "in_progress",
  "resolved",
]);

export const sampleStatusEnum = plmSchema.enum("sample_status", [
  "requested",
  "in_production",
  "received",
  "approved",
  "rejected",
  "revision_needed",
]);

export const lifecyclePhaseEnum = plmSchema.enum("lifecycle_phase", [
  "concept",
  "design",
  "sampling",
  "approved",
  "production",
  "launched",
  "active",
  "restock",
  "discontinued",
]);

// ─── Tables ─────────────────────────────────────────────

// 1. plm.suppliers
export const suppliers = plmSchema
  .table(
    "suppliers",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 255 }).notNull(),
      contactName: varchar("contact_name", { length: 255 }),
      email: varchar("email", { length: 255 }),
      phone: varchar("phone", { length: 50 }),
      address: jsonb("address"),
      specialties: text("specialties").array(),
      isActive: boolean("is_active").notNull().default(true),
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
      index("idx_plm_suppliers_tenant").on(table.tenantId),
      index("idx_plm_suppliers_active")
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

// 2. plm.supplier_contacts
export const supplierContacts = plmSchema
  .table(
    "supplier_contacts",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      supplierId: uuid("supplier_id")
        .notNull()
        .references(() => suppliers.id),
      name: varchar("name", { length: 255 }).notNull(),
      role: varchar("role", { length: 100 }),
      phone: varchar("phone", { length: 50 }),
      email: varchar("email", { length: 255 }),
      isPrimary: boolean("is_primary").notNull().default(false),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_plm_supplier_contacts_tenant").on(table.tenantId),
      index("idx_plm_supplier_contacts_supplier").on(table.supplierId),
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

// 3. plm.production_orders
export const productionOrders = plmSchema
  .table(
    "production_orders",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      code: varchar("code", { length: 30 }).notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      collectionName: varchar("collection_name", { length: 255 }),
      status: productionOrderStatusEnum("status").notNull().default("draft"),
      lifecyclePhase: lifecyclePhaseEnum("lifecycle_phase")
        .notNull()
        .default("concept"),
      deadline: date("deadline"),
      startDate: date("start_date"),
      completedAt: timestamp("completed_at", { withTimezone: true }),
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
      index("idx_plm_production_orders_tenant").on(table.tenantId),
      uniqueIndex("idx_plm_production_orders_code")
        .on(table.tenantId, table.code)
        .where(sql`deleted_at IS NULL`),
      index("idx_plm_production_orders_status").on(table.status),
      index("idx_plm_production_orders_phase").on(table.lifecyclePhase),
      index("idx_plm_production_orders_deadline").on(table.deadline),
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

// 4. plm.production_stages
export const productionStages = plmSchema
  .table(
    "production_stages",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      productionOrderId: uuid("production_order_id")
        .notNull()
        .references(() => productionOrders.id),
      name: varchar("name", { length: 255 }).notNull(),
      sortOrder: integer("sort_order").notNull().default(0),
      status: stageStatusEnum("status").notNull().default("pending"),
      supplierId: uuid("supplier_id").references(() => suppliers.id),
      plannedStartDate: date("planned_start_date"),
      plannedEndDate: date("planned_end_date"),
      actualStartDate: date("actual_start_date"),
      actualEndDate: date("actual_end_date"),
      notes: text("notes"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_plm_production_stages_tenant").on(table.tenantId),
      index("idx_plm_production_stages_order").on(table.productionOrderId),
      index("idx_plm_production_stages_status").on(table.status),
      index("idx_plm_production_stages_supplier").on(table.supplierId),
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

// 5. plm.raw_materials
export const rawMaterials = plmSchema
  .table(
    "raw_materials",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 255 }).notNull(),
      unit: varchar("unit", { length: 20 }).notNull(),
      unitCost: numeric("unit_cost", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      currentStock: numeric("current_stock", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      minStock: numeric("min_stock", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      supplierId: uuid("supplier_id").references(() => suppliers.id),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (table) => [
      index("idx_plm_raw_materials_tenant").on(table.tenantId),
      index("idx_plm_raw_materials_supplier").on(table.supplierId),
      index("idx_plm_raw_materials_low_stock")
        .on(table.currentStock)
        .where(sql`current_stock <= min_stock`),
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

// 6. plm.material_requirements
export const materialRequirements = plmSchema
  .table(
    "material_requirements",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      productionOrderId: uuid("production_order_id")
        .notNull()
        .references(() => productionOrders.id),
      rawMaterialId: uuid("raw_material_id")
        .notNull()
        .references(() => rawMaterials.id),
      requiredQty: numeric("required_qty", {
        precision: 12,
        scale: 2,
      }).notNull(),
      allocatedQty: numeric("allocated_qty", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      notes: text("notes"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_plm_material_requirements_tenant").on(table.tenantId),
      index("idx_plm_material_requirements_order").on(table.productionOrderId),
      index("idx_plm_material_requirements_material").on(table.rawMaterialId),
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

// 7. plm.rework_log
export const reworkLog = plmSchema
  .table(
    "rework_log",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      productionOrderId: uuid("production_order_id")
        .notNull()
        .references(() => productionOrders.id),
      stageId: uuid("stage_id")
        .notNull()
        .references(() => productionStages.id),
      supplierId: uuid("supplier_id").references(() => suppliers.id),
      description: text("description").notNull(),
      status: reworkStatusEnum("status").notNull().default("pending"),
      resolvedAt: timestamp("resolved_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_plm_rework_log_tenant").on(table.tenantId),
      index("idx_plm_rework_log_order").on(table.productionOrderId),
      index("idx_plm_rework_log_stage").on(table.stageId),
      index("idx_plm_rework_log_status").on(table.status),
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

// ─── NEW PLM Tables (pre-production + post-launch) ─────

// 8. plm.tech_packs — product specifications / fichas técnicas
export const techPacks = plmSchema
  .table(
    "tech_packs",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      productionOrderId: uuid("production_order_id")
        .notNull()
        .references(() => productionOrders.id),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      measurements: jsonb("measurements"), // { size: { chest, length, sleeve, ... } }
      materials: jsonb("materials"), // [{ name, composition, weight, supplier }]
      constructionNotes: text("construction_notes"),
      referenceImages: jsonb("reference_images"), // [{ url, caption }] — stored in DAM
      version: integer("version").notNull().default(1),
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
      index("idx_plm_tech_packs_tenant").on(table.tenantId),
      index("idx_plm_tech_packs_order").on(table.productionOrderId),
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

// 9. plm.samples — proto, fit, pre-production, production samples
export const samples = plmSchema
  .table(
    "samples",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      productionOrderId: uuid("production_order_id")
        .notNull()
        .references(() => productionOrders.id),
      supplierId: uuid("supplier_id").references(() => suppliers.id),
      type: varchar("type", { length: 50 }).notNull(), // 'proto', 'fit', 'pre_production', 'production'
      status: sampleStatusEnum("status").notNull().default("requested"),
      requestedAt: timestamp("requested_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      receivedAt: timestamp("received_at", { withTimezone: true }),
      reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
      reviewedBy: uuid("reviewed_by").references(() => users.id),
      feedback: text("feedback"),
      photos: jsonb("photos"), // [{ url, caption }]
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_plm_samples_tenant").on(table.tenantId),
      index("idx_plm_samples_order").on(table.productionOrderId),
      index("idx_plm_samples_status").on(table.status),
      index("idx_plm_samples_supplier").on(table.supplierId),
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
