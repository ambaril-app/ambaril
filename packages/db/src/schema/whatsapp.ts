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
import { tenants } from "./global";

// ─── Schema ─────────────────────────────────────────────

export const whatsappSchema = pgSchema("whatsapp");

// ─── Enums ──────────────────────────────────────────────

export const templateStatusEnum = whatsappSchema.enum("template_status", [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
]);

export const messageDirectionEnum = whatsappSchema.enum("message_direction", [
  "inbound",
  "outbound",
]);

export const messageStatusEnum = whatsappSchema.enum("message_status", [
  "pending",
  "sent",
  "delivered",
  "read",
  "failed",
]);

export const conversationStatusEnum = whatsappSchema.enum(
  "conversation_status",
  ["open", "closed", "expired"],
);

// ─── Tables ─────────────────────────────────────────────

// whatsapp.templates — WhatsApp message templates (Meta-approved)
export const templates = whatsappSchema.table(
  "templates",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    language: varchar("language", { length: 10 }).notNull().default("pt_BR"),
    category: varchar("category", { length: 50 }).notNull(), // 'transactional', 'marketing', 'utility'
    status: templateStatusEnum("status").notNull().default("draft"),
    headerText: text("header_text"),
    bodyText: text("body_text").notNull(), // Template body with {{variables}}
    footerText: text("footer_text"),
    buttons: jsonb("buttons"), // [{ type, text, url/phone }]
    metaTemplateId: varchar("meta_template_id", { length: 255 }), // Meta-approved template ID
    variables: jsonb("variables"), // [{ index, description, example }]
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_wa_templates_status").on(table.status),
    index("idx_wa_templates_category").on(table.category),
    index("idx_wa_templates_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// whatsapp.message_logs — all inbound/outbound WhatsApp messages
export const messageLogs = whatsappSchema.table(
  "message_logs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    conversationId: uuid("conversation_id").references(
      () => conversations.id,
    ), // FK whatsapp.conversations(id)
    contactId: uuid("contact_id"), // FK crm.contacts(id) — cross-schema, no .references()
    phone: varchar("phone", { length: 20 }).notNull(),
    direction: messageDirectionEnum("direction").notNull(),
    status: messageStatusEnum("status").notNull().default("pending"),
    templateId: uuid("template_id").references(() => templates.id), // FK whatsapp.templates(id)
    body: text("body").notNull(),
    mediaUrl: text("media_url"),
    metaMessageId: varchar("meta_message_id", { length: 255 }), // Meta Cloud API message ID
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
    index("idx_wa_messages_conversation").on(table.conversationId),
    index("idx_wa_messages_contact").on(table.contactId),
    index("idx_wa_messages_phone").on(table.phone),
    index("idx_wa_messages_status").on(table.status),
    index("idx_wa_messages_created").on(table.createdAt),
    index("idx_wa_messages_meta_id").on(table.metaMessageId),
    index("idx_wa_messages_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// whatsapp.conversations — chat threads with contacts
export const conversations = whatsappSchema.table(
  "conversations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    contactId: uuid("contact_id").notNull(), // FK crm.contacts(id) — cross-schema, no .references()
    phone: varchar("phone", { length: 20 }).notNull(),
    status: conversationStatusEnum("status").notNull().default("open"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastMessagePreview: text("last_message_preview"), // Truncated preview
    unreadCount: integer("unread_count").notNull().default(0),
    assignedUserId: uuid("assigned_user_id"), // FK global.users(id) — cross-schema, no .references()
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_wa_conversations_contact").on(table.contactId),
    index("idx_wa_conversations_status").on(table.status),
    index("idx_wa_conversations_assigned").on(table.assignedUserId),
    index("idx_wa_conversations_last_msg").on(table.lastMessageAt),
    index("idx_wa_conversations_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// whatsapp.groups — WhatsApp group management (VIP, creators, B2B)
export const groups = whatsappSchema.table(
  "groups",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(), // e.g., 'VIP Drop 13'
    description: text("description"),
    type: varchar("type", { length: 50 }).notNull(), // 'vip', 'creators', 'b2b', 'general'
    inviteLink: text("invite_link"), // Smart rotation link
    maxMembers: integer("max_members").notNull().default(256), // WhatsApp group limit
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
    index("idx_wa_groups_type").on(table.type),
    index("idx_wa_groups_active").on(table.isActive),
    index("idx_wa_groups_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();
