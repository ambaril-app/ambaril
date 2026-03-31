import {
  pgSchema,
  pgEnum,
  pgPolicy,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  inet,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Schema ─────────────────────────────────────────────

export const globalSchema = pgSchema("global");

// ─── Enums ──────────────────────────────────────────────

export const userRoleEnum = globalSchema.enum("user_role", [
  "admin",
  "pm",
  "creative",
  "operations",
  "support",
  "finance",
  "commercial",
]);

export const auditActionEnum = globalSchema.enum("audit_action", [
  "create",
  "update",
  "delete",
]);

export const notificationPriorityEnum = globalSchema.enum(
  "notification_priority",
  ["low", "medium", "high", "critical"],
);

export const jobStatusEnum = globalSchema.enum("job_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "dead",
]);

// ─── Tables ─────────────────────────────────────────────

// global.tenants — multi-tenant registry (ADR-014)
export const tenants = globalSchema.table(
  "tenants",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 50 }).notNull().unique(),
    domain: text("domain"),
    plan: varchar("plan", { length: 20 }).notNull().default("starter"),
    settings: jsonb("settings").notNull().default("{}"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_tenants_slug").on(table.slug),
    index("idx_tenants_active").on(table.isActive),
  ],
);

// global.users — internal team (global, not per-tenant)
export const users = globalSchema.table(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    role: userRoleEnum("role").notNull(),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_role").on(table.role),
  ],
);

// global.user_tenants — maps users to tenants with per-tenant roles
export const userTenants = globalSchema.table(
  "user_tenants",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_user_tenants_unique").on(table.userId, table.tenantId),
    index("idx_user_tenants_user").on(table.userId),
    index("idx_user_tenants_tenant").on(table.tenantId),
  ],
);

// global.roles — role definitions (system-wide, not per-tenant)
export const roles = globalSchema.table("roles", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// global.permissions — role → resource:action mappings (system-wide)
export const permissions = globalSchema.table(
  "permissions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    resource: varchar("resource", { length: 100 }).notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    conditions: jsonb("conditions"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_permissions_unique").on(
      table.roleId,
      table.resource,
      table.action,
    ),
    index("idx_permissions_role").on(table.roleId),
  ],
);

// ─── Tenant-scoped tables ───────────────────────────────
// RLS policy SQL: (SELECT ...) wrapper is CRITICAL for performance —
// PostgreSQL caches the value as initPlan. Without it, current_setting
// is called PER ROW. Ref: Supabase RLS Performance Best Practices.

// global.audit_logs — append-only audit trail (per-tenant)
export const auditLogs = globalSchema.table(
  "audit_logs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .notNull()
      .defaultNow(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    userRole: userRoleEnum("user_role").notNull(),
    action: auditActionEnum("action").notNull(),
    resourceType: varchar("resource_type", { length: 100 }).notNull(),
    resourceId: uuid("resource_id").notNull(),
    module: varchar("module", { length: 50 }).notNull(),
    changes: jsonb("changes").notNull(),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    requestId: uuid("request_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_audit_logs_tenant").on(table.tenantId),
    index("idx_audit_logs_user").on(table.userId),
    index("idx_audit_logs_resource").on(table.resourceType, table.resourceId),
    index("idx_audit_logs_module").on(table.module),
    index("idx_audit_logs_timestamp").on(table.timestamp),
    index("idx_audit_logs_action").on(table.action),
    index("idx_audit_logs_tenant_timestamp").on(table.tenantId, table.timestamp),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// global.notifications — Flare notification system (per-tenant)
export const notifications = globalSchema.table(
  "notifications",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    icon: varchar("icon", { length: 50 }),
    actionUrl: text("action_url"),
    priority: notificationPriorityEnum("priority").notNull().default("medium"),
    readAt: timestamp("read_at", { withTimezone: true }),
    module: varchar("module", { length: 50 }).notNull(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_notifications_tenant").on(table.tenantId),
    index("idx_notifications_user_unread").on(table.userId, table.createdAt),
    index("idx_notifications_module").on(table.module),
    index("idx_notifications_tenant_user").on(table.tenantId, table.userId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// global.search_index — full-text search across all modules (per-tenant)
export const searchIndex = globalSchema.table(
  "search_index",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    resourceType: varchar("resource_type", { length: 100 }).notNull(),
    resourceId: uuid("resource_id").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    metadata: jsonb("metadata"),
    module: varchar("module", { length: 50 }).notNull(),
    searchVector: text("search_vector").notNull(), // tsvector managed via trigger
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_search_index_tenant").on(table.tenantId),
    uniqueIndex("idx_search_index_resource").on(
      table.tenantId,
      table.resourceType,
      table.resourceId,
    ),
    index("idx_search_index_module").on(table.module),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// global.sessions — DB-backed sessions (replaces Redis per ADR-012)
// NOTE: No RLS on sessions — session lookup establishes tenant context.
export const sessions = globalSchema.table(
  "sessions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id").references(() => tenants.id),
    token: varchar("token", { length: 64 }).notNull().unique(),
    userRole: userRoleEnum("user_role").notNull(),
    userType: varchar("user_type", { length: 20 }).notNull().default("internal"), // internal | b2b | creator
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_sessions_token").on(table.token),
    index("idx_sessions_user").on(table.userId),
    index("idx_sessions_expires").on(table.expiresAt),
    index("idx_sessions_tenant").on(table.tenantId),
  ],
);

// global.job_queue — PostgreSQL queue (FOR UPDATE SKIP LOCKED) per ADR-012
// NOTE: No RLS on job_queue — cron handler processes jobs across all tenants.
export const jobQueue = globalSchema.table(
  "job_queue",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    queue: varchar("queue", { length: 100 }).notNull(),
    payload: jsonb("payload").notNull(),
    status: jobStatusEnum("status").notNull().default("pending"),
    priority: varchar("priority", { length: 10 }).notNull().default("normal"), // low, normal, high
    attempts: varchar("attempts", { length: 10 }).notNull().default("0"),
    maxAttempts: varchar("max_attempts", { length: 10 }).notNull().default("3"),
    lastError: text("last_error"),
    runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_job_queue_tenant").on(table.tenantId),
    index("idx_job_queue_pending").on(table.queue, table.runAt, table.status),
    index("idx_job_queue_status").on(table.status),
    index("idx_job_queue_tenant_status").on(table.tenantId, table.status),
  ],
);

// global.integration_providers — catalog of available integration providers
export const integrationProviders = globalSchema.table(
  "integration_providers",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    providerId: varchar("provider_id", { length: 50 }).notNull().unique(),
    capability: varchar("capability", { length: 50 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 50 }),
    configSchema: jsonb("config_schema").notNull().default("[]"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_integration_providers_provider_id").on(table.providerId),
    index("idx_integration_providers_capability").on(table.capability),
  ],
);

// global.tenant_integrations — per-tenant integration connections (RLS enabled)
export const tenantIntegrations = globalSchema.table(
  "tenant_integrations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    providerId: varchar("provider_id", { length: 50 })
      .notNull()
      .references(() => integrationProviders.providerId),
    capability: varchar("capability", { length: 50 }).notNull(),
    credentials: jsonb("credentials").notNull().default("{}"),
    isActive: boolean("is_active").notNull().default(true),
    lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_tenant_integrations_unique").on(table.tenantId, table.capability),
    index("idx_tenant_integrations_tenant").on(table.tenantId),
    index("idx_tenant_integrations_provider").on(table.providerId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// global.module_setup_state — setup wizard progress per module (RLS enabled)
export const moduleSetupState = globalSchema.table(
  "module_setup_state",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    moduleId: varchar("module_id", { length: 50 }).notNull(),
    isSetupComplete: boolean("is_setup_complete").notNull().default(false),
    currentStep: varchar("current_step", { length: 50 }),
    stepData: jsonb("step_data").notNull().default("{}"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedBy: uuid("completed_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_module_setup_unique").on(table.tenantId, table.moduleId),
    index("idx_module_setup_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// global.magic_links — passwordless authentication tokens
export const magicLinks = globalSchema.table("magic_links", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  type: varchar("type", { length: 20 }).notNull(), // 'login' | 'signup' | 'invite' | 'password_reset'
  role: userRoleEnum("role"),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  ipAddress: inet("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("idx_magic_links_token").on(t.token),
  index("idx_magic_links_email").on(t.email),
  index("idx_magic_links_expires").on(t.expiresAt),
]);
