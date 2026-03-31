import {
  pgSchema,
  pgEnum,
  uuid,
  varchar,
  text,
  inet,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Schema ─────────────────────────────────────────────

export const marketingSchema = pgSchema("marketing");

// ─── Enums ──────────────────────────────────────────────

export const waitlistStatusEnum = marketingSchema.enum("waitlist_status", [
  "new",        // just submitted
  "contacted",  // team reached out
  "rejected",   // not a fit (revenue too low, wrong vertical, etc.)
  "onboarded",  // converted to tenant
]);

// ─── Tables ─────────────────────────────────────────────

// marketing.waitlist_entries — leads from ambaril.com/acesso
export const waitlistEntries = marketingSchema.table(
  "waitlist_entries",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // Contact
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    brand: varchar("brand", { length: 255 }).notNull(),

    // Qualification
    platform: varchar("platform", { length: 50 }).notNull(),
    revenue: varchar("revenue", { length: 30 }).notNull(),
    pain: text("pain"),

    // CRM
    status: waitlistStatusEnum("status").notNull().default("new"),
    notes: text("notes"), // internal notes from Marcus/Caio

    // Meta
    ipAddress: inet("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_waitlist_email").on(table.email),
    index("idx_waitlist_status").on(table.status),
    index("idx_waitlist_created_at").on(table.createdAt),
    index("idx_waitlist_revenue").on(table.revenue),
  ],
);
