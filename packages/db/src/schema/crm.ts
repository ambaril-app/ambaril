import {
  pgSchema,
  pgEnum,
  pgPolicy,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  bigint,
  numeric,
  timestamp,
  date,
  jsonb,
  inet,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./global";

// ─── Schema ─────────────────────────────────────────────

export const crmSchema = pgSchema("crm");

// ─── Enums ──────────────────────────────────────────────

export const segmentTypeEnum = crmSchema.enum("segment_type", [
  "rfm",
  "custom",
  "cohort",
]);

export const automationTriggerEnum = crmSchema.enum("automation_trigger", [
  "order_approved",
  "order_shipped",
  "order_delivered",
  "cart_abandoned",
  "welcome",
  "post_purchase_review",
  "repurchase",
  "birthday",
  "inactivity",
  "vip_welcome",
  "custom",
  "product_recommendations",
  "cross_sell",
  "upsell",
  "price_drop",
  "back_in_stock",
]);

export const automationStatusEnum = crmSchema.enum("automation_status", [
  "draft",
  "active",
  "paused",
  "archived",
]);

export const automationRunStatusEnum = crmSchema.enum(
  "automation_run_status",
  ["pending", "running", "completed", "failed", "skipped"],
);

export const channelEnum = crmSchema.enum("channel", [
  "whatsapp",
  "email",
  "sms",
]);

export const consentTypeEnum = crmSchema.enum("consent_type", [
  "whatsapp",
  "email",
  "tracking",
]);

export const crmCampaignStatusEnum = crmSchema.enum("campaign_status", [
  "draft",
  "scheduled",
  "sending",
  "completed",
  "cancelled",
]);

export const crmWidgetTypeEnum = crmSchema.enum("widget_type", [
  "popup",
  "banner",
  "slider",
  "social_proof",
]);

export const crmWidgetStatusEnum = crmSchema.enum("widget_status", [
  "draft",
  "active",
  "paused",
  "archived",
]);

export const popupTriggerEnum = crmSchema.enum("popup_trigger", [
  "exit_intent",
  "scroll_percent",
  "time_delay",
  "click",
  "page_load",
]);

export const widgetEventTypeEnum = crmSchema.enum("widget_event_type", [
  "view",
  "click",
  "close",
  "auto_close",
  "subscribe_email",
  "subscribe_phone",
  "convert",
]);

export const widgetPlacementEnum = crmSchema.enum("widget_placement", [
  "overlay_center",
  "overlay_bottom",
  "top_bar",
  "inline",
  "sidebar",
  "toast_bottom_left",
  "toast_bottom_right",
  "slide_in_right",
]);

// ─── Tables ─────────────────────────────────────────────

// 0. crm.personal_data — LGPD-compliant PII storage (session 17 decision)
// On data deletion request: DELETE FROM crm.personal_data WHERE contact_id = ?
// This is INTENTIONAL — separating PII allows anonymization without losing order history.
export const personalData = crmSchema.table(
  "personal_data",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    contactId: uuid("contact_id").notNull(), // FK set after contacts table
    cpf: varchar("cpf", { length: 14 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    birthDate: date("birth_date"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_personal_data_contact").on(table.tenantId, table.contactId),
    uniqueIndex("idx_personal_data_cpf").on(table.tenantId, table.cpf),
    index("idx_personal_data_email")
      .on(table.email)
      .where(sql`email IS NOT NULL`),
    index("idx_personal_data_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 1. crm.contacts
export const contacts = crmSchema.table(
  "contacts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    name: varchar("name", { length: 255 }).notNull(),
    cpf: varchar("cpf", { length: 14 }), // Nullable — PII lives in crm.personal_data (LGPD)
    address: jsonb("address"), // { street, number, complement, neighborhood, city, state, zip_code }
    rfmScoreId: uuid("rfm_score_id"), // FK to crm.rfm_scores(id) — set after rfmScores table is created
    segmentIds: text("segment_ids")
      .array(), // UUID[] — array of segment IDs
    firstPurchaseAt: timestamp("first_purchase_at", { withTimezone: true }),
    lastPurchaseAt: timestamp("last_purchase_at", { withTimezone: true }),
    totalOrders: integer("total_orders").notNull().default(0),
    totalSpent: numeric("total_spent", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    averageOrderValue: numeric("average_order_value", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    ltv: numeric("ltv", { precision: 12, scale: 2 }).notNull().default("0"),
    acquisitionSource: varchar("acquisition_source", { length: 100 }),
    acquisitionUtm: jsonb("acquisition_utm"), // { source, medium, campaign, content }
    birthday: date("birthday"),
    isVip: boolean("is_vip").notNull().default(false),
    consentWhatsapp: boolean("consent_whatsapp").notNull().default(false),
    consentEmail: boolean("consent_email").notNull().default(false),
    consentTracking: boolean("consent_tracking").notNull().default(false),
    consentUpdatedAt: timestamp("consent_updated_at", { withTimezone: true }),
    tags: text("tags").array(), // TEXT[] — freeform tags
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
    // Partial unique index: cpf unique among non-deleted contacts per tenant
    uniqueIndex("idx_contacts_cpf")
      .on(table.tenantId, table.cpf)
      .where(sql`deleted_at IS NULL`),
    // Partial unique index: email unique among non-deleted contacts where email is set per tenant
    uniqueIndex("idx_contacts_email")
      .on(table.tenantId, table.email)
      .where(sql`email IS NOT NULL AND deleted_at IS NULL`),
    index("idx_contacts_phone")
      .on(table.phone)
      .where(sql`phone IS NOT NULL`),
    index("idx_contacts_is_vip")
      .on(table.isVip)
      .where(sql`is_vip = TRUE`),
    index("idx_contacts_acquisition").on(table.acquisitionSource),
    index("idx_contacts_last_purchase").on(table.lastPurchaseAt),
    index("idx_contacts_total_spent").on(table.totalSpent),
    // GIN indexes for array columns
    index("idx_contacts_tags").using("gin", table.tags),
    index("idx_contacts_segment_ids").using("gin", table.segmentIds),
    index("idx_contacts_not_deleted")
      .on(table.id)
      .where(sql`deleted_at IS NULL`),
    // Birthday index for automation (month + day extraction handled at query level)
    index("idx_contacts_birthday")
      .on(table.birthday)
      .where(sql`birthday IS NOT NULL`),
    index("idx_contacts_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 2. crm.segments
export const segments = crmSchema.table(
  "segments",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: segmentTypeEnum("type").notNull(),
    rules: jsonb("rules").notNull(), // { conditions: [...], logic: 'AND'/'OR' }
    contactCount: integer("contact_count").notNull().default(0),
    isDynamic: boolean("is_dynamic").notNull().default(true),
    lastCalculatedAt: timestamp("last_calculated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_segments_type").on(table.type),
    index("idx_segments_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 3. crm.rfm_scores
export const rfmScores = crmSchema.table(
  "rfm_scores",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id),
    recencyScore: integer("recency_score").notNull(), // CHECK (1-5) enforced at app layer
    frequencyScore: integer("frequency_score").notNull(), // CHECK (1-5) enforced at app layer
    monetaryScore: integer("monetary_score").notNull(), // CHECK (1-5) enforced at app layer
    rfmSegment: varchar("rfm_segment", { length: 50 }).notNull(), // e.g., 'champions', 'at_risk', 'hibernating'
    recencyDays: integer("recency_days").notNull(),
    frequencyCount: integer("frequency_count").notNull(),
    monetaryTotal: numeric("monetary_total", {
      precision: 12,
      scale: 2,
    }).notNull(),
    calculatedAt: timestamp("calculated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_rfm_scores_contact").on(table.contactId),
    index("idx_rfm_scores_segment").on(table.rfmSegment),
    index("idx_rfm_scores_calculated").on(table.calculatedAt),
    index("idx_rfm_scores_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 4. crm.automations
export const automations = crmSchema.table(
  "automations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    triggerType: automationTriggerEnum("trigger_type").notNull(),
    triggerConfig: jsonb("trigger_config").notNull(), // Trigger-specific settings (delays, conditions)
    channel: channelEnum("channel").notNull(),
    templateId: uuid("template_id"), // FK to whatsapp.templates or email template (cross-schema)
    emailTemplateKey: varchar("email_template_key", { length: 100 }),
    status: automationStatusEnum("status").notNull().default("draft"),
    segmentId: uuid("segment_id").references(() => segments.id),
    cooldownHours: integer("cooldown_hours").notNull().default(48),
    totalSent: integer("total_sent").notNull().default(0),
    totalConverted: integer("total_converted").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_automations_status").on(table.status),
    index("idx_automations_trigger").on(table.triggerType),
    index("idx_automations_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 5. crm.campaigns
export const crmCampaigns = crmSchema.table(
  "campaigns",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    segmentId: uuid("segment_id").references(() => segments.id),
    channel: channelEnum("channel").notNull(),
    templateId: uuid("template_id"), // FK to whatsapp.templates (cross-schema)
    emailTemplateKey: varchar("email_template_key", { length: 100 }),
    messageBody: text("message_body"),
    status: crmCampaignStatusEnum("status").notNull().default("draft"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    totalRecipients: integer("total_recipients").notNull().default(0),
    totalSent: integer("total_sent").notNull().default(0),
    totalDelivered: integer("total_delivered").notNull().default(0),
    totalOpened: integer("total_opened").notNull().default(0),
    totalClicked: integer("total_clicked").notNull().default(0),
    totalConverted: integer("total_converted").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_campaigns_status").on(table.status),
    index("idx_campaigns_segment").on(table.segmentId),
    index("idx_campaigns_scheduled")
      .on(table.scheduledAt)
      .where(sql`status = 'scheduled'`),
    index("idx_campaigns_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 6. crm.automation_runs
export const automationRuns = crmSchema.table(
  "automation_runs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    automationId: uuid("automation_id")
      .notNull()
      .references(() => automations.id),
    campaignId: uuid("campaign_id").references(() => crmCampaigns.id), // NULL for event-triggered runs
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id),
    status: automationRunStatusEnum("status").notNull().default("pending"),
    channel: channelEnum("channel").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_automation_runs_automation").on(table.automationId),
    index("idx_automation_runs_contact").on(table.contactId),
    index("idx_automation_runs_status").on(table.status),
    index("idx_automation_runs_scheduled")
      .on(table.scheduledAt)
      .where(sql`status = 'pending'`),
    index("idx_automation_runs_campaign")
      .on(table.campaignId)
      .where(sql`campaign_id IS NOT NULL`),
    index("idx_automation_runs_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 7. crm.consents (append-only LGPD consent log)
export const consents = crmSchema.table(
  "consents",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id),
    consentType: consentTypeEnum("consent_type").notNull(),
    granted: boolean("granted").notNull(), // TRUE = opted in, FALSE = opted out
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    source: varchar("source", { length: 100 }).notNull(), // 'checkout', 'profile', 'import', 'api'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(), // Immutable consent log
  },
  (table) => [
    index("idx_consents_contact").on(table.contactId),
    index("idx_consents_type").on(table.contactId, table.consentType),
    index("idx_consents_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 8. crm.cohorts
export const cohorts = crmSchema.table(
  "cohorts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    cohortPeriod: varchar("cohort_period", { length: 20 }).notNull(), // e.g., '2026-01', '2026-Q1', 'drop-10'
    contactCount: integer("contact_count").notNull().default(0),
    avgLtv: numeric("avg_ltv", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    repurchaseRate: numeric("repurchase_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    churnRate: numeric("churn_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    metadata: jsonb("metadata"),
    calculatedAt: timestamp("calculated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_cohorts_period").on(table.cohortPeriod),
    index("idx_cohorts_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 9. crm.widget_templates (Phase 2 — defined before widgets for FK reference)
export const widgetTemplates = crmSchema.table(
  "widget_templates",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    type: crmWidgetTypeEnum("type").notNull(),
    placement: widgetPlacementEnum("placement").notNull(),
    content: jsonb("content").notNull(), // Default content structure
    thumbnailUrl: text("thumbnail_url"),
    isSystem: boolean("is_system").notNull().default(false), // TRUE = pre-built
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_widget_templates_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 10. crm.widgets (Phase 2 — On-Site Widget Engine)
export const crmWidgets = crmSchema.table(
  "widgets",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    type: crmWidgetTypeEnum("type").notNull(),
    status: crmWidgetStatusEnum("status").notNull().default("draft"),
    placement: widgetPlacementEnum("placement").notNull(),
    triggerType: popupTriggerEnum("trigger_type"), // Only for popups
    triggerConfig: jsonb("trigger_config"), // { scroll_percent: 50, delay_seconds: 5 }
    content: jsonb("content").notNull(), // { title, body, image_url, cta_text, cta_url, fields[], colors, custom_css }
    targetingRules: jsonb("targeting_rules")
      .notNull()
      .default("{}"), // { pages, device, visitor_type, segment_id, url_contains, cart_value_min_cents }
    frequencyCap: jsonb("frequency_cap")
      .notNull()
      .default('{"type":"once_per_session"}'),
    priority: integer("priority").notNull().default(0), // Higher = shown first
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    totalViews: integer("total_views").notNull().default(0),
    totalClicks: integer("total_clicks").notNull().default(0),
    totalConversions: integer("total_conversions").notNull().default(0),
    totalRevenueCents: bigint("total_revenue_cents", { mode: "number" })
      .notNull()
      .default(0),
    templateId: uuid("template_id").references(() => widgetTemplates.id),
    createdBy: uuid("created_by").notNull(), // FK to global.users(id) — cross-schema, enforced at app layer
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_widgets_status").on(table.status),
    index("idx_widgets_type").on(table.type),
    index("idx_widgets_priority")
      .on(table.priority)
      .where(sql`status = 'active'`),
    index("idx_widgets_schedule")
      .on(table.startsAt, table.endsAt)
      .where(sql`status = 'active'`),
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

// 11. crm.widget_events (Phase 2)
export const widgetEvents = crmSchema.table(
  "widget_events",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    widgetId: uuid("widget_id")
      .notNull()
      .references(() => crmWidgets.id),
    eventType: widgetEventTypeEnum("event_type").notNull(),
    contactId: uuid("contact_id").references(() => contacts.id), // NULL for anonymous visitors
    sessionId: varchar("session_id", { length: 64 }).notNull(),
    pageUrl: text("page_url").notNull(),
    deviceType: varchar("device_type", { length: 20 }), // desktop, mobile, tablet
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_widget_events_widget").on(table.widgetId),
    index("idx_widget_events_type").on(table.eventType),
    index("idx_widget_events_created").on(table.createdAt),
    index("idx_widget_events_session").on(table.sessionId),
    index("idx_widget_events_contact")
      .on(table.contactId)
      .where(sql`contact_id IS NOT NULL`),
    index("idx_widget_events_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 12. crm.widget_metrics_daily (Phase 2)
export const widgetMetricsDaily = crmSchema.table(
  "widget_metrics_daily",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    widgetId: uuid("widget_id")
      .notNull()
      .references(() => crmWidgets.id),
    date: date("date").notNull(),
    views: integer("views").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    closes: integer("closes").notNull().default(0),
    subscriptions: integer("subscriptions").notNull().default(0), // Email + phone captures
    conversions: integer("conversions").notNull().default(0),
    revenueCents: bigint("revenue_cents", { mode: "number" })
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_widget_metrics_daily_widget_date").on(
      table.tenantId,
      table.widgetId,
      table.date,
    ),
    index("idx_widget_metrics_daily_date").on(table.date),
    index("idx_widget_metrics_daily_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();
