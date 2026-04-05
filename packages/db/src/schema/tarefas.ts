import {
  pgSchema,
  pgPolicy,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants, users } from "./global";

// ─── Schema ─────────────────────────────────────────────

export const tarefasSchema = pgSchema("tarefas");

// ─── Enums ──────────────────────────────────────────────

export const taskStatusEnum = tarefasSchema.enum("task_status", [
  "todo",
  "in_progress",
  "review",
  "done",
  "cancelled",
]);

export const taskPriorityEnum = tarefasSchema.enum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const projectStatusEnum = tarefasSchema.enum("project_status", [
  "active",
  "completed",
  "archived",
]);

// ─── Tables ─────────────────────────────────────────────

// 1. tarefas.projects
export const projects = tarefasSchema
  .table(
    "projects",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      status: projectStatusEnum("status").notNull().default("active"),
      startDate: date("start_date"),
      deadline: date("deadline"),
      ownerId: uuid("owner_id").references(() => users.id),
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
      index("idx_projects_tenant").on(table.tenantId),
      index("idx_projects_status").on(table.status),
      index("idx_projects_owner").on(table.ownerId),
      index("idx_projects_not_deleted")
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

// 2. tarefas.tasks
export const tasks = tarefasSchema
  .table(
    "tasks",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      projectId: uuid("project_id")
        .notNull()
        .references(() => projects.id),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      status: taskStatusEnum("status").notNull().default("todo"),
      priority: taskPriorityEnum("priority").notNull().default("medium"),
      assigneeId: uuid("assignee_id").references(() => users.id),
      parentTaskId: uuid("parent_task_id"),
      sortOrder: integer("sort_order").notNull().default(0),
      startDate: date("start_date"),
      dueDate: date("due_date"),
      completedAt: timestamp("completed_at", { withTimezone: true }),
      estimatedMinutes: integer("estimated_minutes"),
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
      index("idx_tasks_tenant").on(table.tenantId),
      index("idx_tasks_project").on(table.projectId),
      index("idx_tasks_status").on(table.status),
      index("idx_tasks_priority").on(table.priority),
      index("idx_tasks_assignee").on(table.assigneeId),
      index("idx_tasks_parent").on(table.parentTaskId),
      index("idx_tasks_due_date").on(table.dueDate),
      index("idx_tasks_not_deleted")
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

// 3. tarefas.task_comments
export const taskComments = tarefasSchema
  .table(
    "task_comments",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      taskId: uuid("task_id")
        .notNull()
        .references(() => tasks.id),
      authorId: uuid("author_id")
        .notNull()
        .references(() => users.id),
      content: text("content").notNull(),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_task_comments_tenant").on(table.tenantId),
      index("idx_task_comments_task").on(table.taskId),
      index("idx_task_comments_author").on(table.authorId),
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

// 4. tarefas.task_attachments
export const taskAttachments = tarefasSchema
  .table(
    "task_attachments",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      taskId: uuid("task_id")
        .notNull()
        .references(() => tasks.id),
      fileName: varchar("file_name", { length: 255 }).notNull(),
      fileUrl: text("file_url").notNull(),
      fileSizeBytes: integer("file_size_bytes").notNull(),
      mimeType: varchar("mime_type", { length: 100 }).notNull(),
      uploadedBy: uuid("uploaded_by")
        .notNull()
        .references(() => users.id),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_task_attachments_tenant").on(table.tenantId),
      index("idx_task_attachments_task").on(table.taskId),
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

// 5. tarefas.project_templates
export const projectTemplates = tarefasSchema
  .table(
    "project_templates",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      isDefault: boolean("is_default").notNull().default(false),
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
      index("idx_project_templates_tenant").on(table.tenantId),
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

// 6. tarefas.calendar_events — universal calendar with tags
export const calendarEvents = tarefasSchema
  .table(
    "calendar_events",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      startDate: timestamp("start_date", { withTimezone: true }).notNull(),
      endDate: timestamp("end_date", { withTimezone: true }),
      allDay: boolean("all_day").notNull().default(false),
      tags: text("tags")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
      moduleSource: varchar("module_source", { length: 50 }), // which module created this event
      linkedEntityType: varchar("linked_entity_type", { length: 50 }), // 'production_order', 'campaign', 'order', etc.
      linkedEntityId: uuid("linked_entity_id"),
      assigneeId: uuid("assignee_id").references(() => users.id),
      color: varchar("color", { length: 20 }),
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
      index("idx_calendar_events_tenant").on(table.tenantId),
      index("idx_calendar_events_dates").on(table.startDate, table.endDate),
      index("idx_calendar_events_module").on(table.moduleSource),
      index("idx_calendar_events_assignee").on(table.assigneeId),
      index("idx_calendar_events_linked").on(
        table.linkedEntityType,
        table.linkedEntityId,
      ),
      index("idx_calendar_events_not_deleted")
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

// 7. tarefas.template_tasks
export const templateTasks = tarefasSchema
  .table(
    "template_tasks",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      templateId: uuid("template_id")
        .notNull()
        .references(() => projectTemplates.id),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      sortOrder: integer("sort_order").notNull().default(0),
      offsetDays: integer("offset_days").notNull().default(0),
      estimatedMinutes: integer("estimated_minutes"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_template_tasks_tenant").on(table.tenantId),
      index("idx_template_tasks_template").on(table.templateId),
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
