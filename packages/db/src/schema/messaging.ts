import {
  pgSchema,
  pgPolicy,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants, users } from "./global";

// ─── Schema ─────────────────────────────────────────────
// Unified messaging schema — merged from whatsapp + inbox
// Covers: WhatsApp (Meta Cloud API), Email (Resend), unified inbox

export const messagingSchema = pgSchema("messaging");

// ─── Enums ──────────────────────────────────────────────

export const messagingChannelEnum = messagingSchema.enum("channel", [
  "whatsapp",
  "email",
]);

export const templateStatusEnum = messagingSchema.enum("template_status", [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
]);

export const messageDirectionEnum = messagingSchema.enum("message_direction", [
  "inbound",
  "outbound",
]);

export const messageStatusEnum = messagingSchema.enum("message_status", [
  "pending",
  "sent",
  "delivered",
  "read",
  "failed",
]);

export const threadStatusEnum = messagingSchema.enum("thread_status", [
  "open",
  "pending",
  "resolved",
  "closed",
]);

// ─── Tables ─────────────────────────────────────────────

// 1. messaging.threads — unified conversation threads (WA + Email)
export const threads = messagingSchema
  .table(
    "threads",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      channel: messagingChannelEnum("channel").notNull(),
      contactId: uuid("contact_id"), // FK crm.contacts(id) — cross-schema
      contactName: varchar("contact_name", { length: 255 }),
      contactEmail: varchar("contact_email", { length: 255 }),
      contactPhone: varchar("contact_phone", { length: 50 }),
      status: threadStatusEnum("status").notNull().default("open"),
      assigneeId: uuid("assignee_id").references(() => users.id),
      lastMessageAt: timestamp("last_message_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      lastMessagePreview: text("last_message_preview"),
      unreadCount: integer("unread_count").notNull().default(0),
      tags: text("tags")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
      metadata: jsonb("metadata").notNull().default("{}"),
      closedAt: timestamp("closed_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_msg_threads_tenant").on(table.tenantId),
      index("idx_msg_threads_channel").on(table.channel),
      index("idx_msg_threads_contact").on(table.contactId),
      index("idx_msg_threads_contact_phone").on(table.contactPhone),
      index("idx_msg_threads_status").on(table.status),
      index("idx_msg_threads_assignee").on(table.assigneeId),
      index("idx_msg_threads_last_msg").on(table.lastMessageAt),
      index("idx_msg_threads_unread")
        .on(table.unreadCount)
        .where(sql`unread_count > 0`),
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

// 2. messaging.messages — all inbound/outbound messages across channels
export const messages = messagingSchema
  .table(
    "messages",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      threadId: uuid("thread_id")
        .notNull()
        .references(() => threads.id),
      direction: messageDirectionEnum("direction").notNull(),
      status: messageStatusEnum("status").notNull().default("pending"),
      templateId: uuid("template_id").references(() => templates.id),
      body: text("body").notNull(),
      bodyHtml: text("body_html"), // email HTML version
      mediaUrl: text("media_url"), // WhatsApp media
      attachments: jsonb("attachments").notNull().default("[]"), // email attachments
      externalMessageId: varchar("external_message_id", { length: 255 }), // Meta message ID or email Message-ID
      sentBy: uuid("sent_by").references(() => users.id), // null for inbound
      errorCode: varchar("error_code", { length: 50 }),
      errorMessage: text("error_message"),
      sentAt: timestamp("sent_at", { withTimezone: true }),
      deliveredAt: timestamp("delivered_at", { withTimezone: true }),
      readAt: timestamp("read_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_msg_messages_tenant").on(table.tenantId),
      index("idx_msg_messages_thread").on(table.threadId),
      index("idx_msg_messages_direction").on(table.direction),
      index("idx_msg_messages_status").on(table.status),
      index("idx_msg_messages_external")
        .on(table.externalMessageId)
        .where(sql`external_message_id IS NOT NULL`),
      index("idx_msg_messages_created").on(table.createdAt),
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

// 3. messaging.templates — WhatsApp message templates (Meta-approved)
export const templates = messagingSchema
  .table(
    "templates",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 255 }).notNull(),
      language: varchar("language", { length: 10 }).notNull().default("pt_BR"),
      category: varchar("category", { length: 50 }).notNull(), // 'transactional', 'marketing', 'utility'
      status: templateStatusEnum("status").notNull().default("draft"),
      headerText: text("header_text"),
      bodyText: text("body_text").notNull(),
      footerText: text("footer_text"),
      buttons: jsonb("buttons"),
      metaTemplateId: varchar("meta_template_id", { length: 255 }),
      variables: jsonb("variables"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_msg_templates_tenant").on(table.tenantId),
      index("idx_msg_templates_status").on(table.status),
      index("idx_msg_templates_category").on(table.category),
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

// 4. messaging.groups — WhatsApp group management (VIP, creators, B2B)
export const groups = messagingSchema
  .table(
    "groups",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      type: varchar("type", { length: 50 }).notNull(), // 'vip', 'creators', 'b2b', 'general'
      inviteLink: text("invite_link"),
      maxMembers: integer("max_members").notNull().default(256),
      currentMembers: integer("current_members").notNull().default(0),
      isActive: boolean("is_active").notNull().default(true),
      metadata: jsonb("metadata"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_msg_groups_tenant").on(table.tenantId),
      index("idx_msg_groups_type").on(table.type),
      index("idx_msg_groups_active").on(table.isActive),
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

// 5. messaging.quick_replies — canned responses for support
export const quickReplies = messagingSchema
  .table(
    "quick_replies",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      title: varchar("title", { length: 100 }).notNull(),
      content: text("content").notNull(),
      shortcut: varchar("shortcut", { length: 50 }),
      category: varchar("category", { length: 50 }),
      isActive: boolean("is_active").notNull().default(true),
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
      index("idx_msg_quick_replies_tenant").on(table.tenantId),
      index("idx_msg_quick_replies_active")
        .on(table.isActive)
        .where(sql`is_active = TRUE`),
      index("idx_msg_quick_replies_category").on(table.category),
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
