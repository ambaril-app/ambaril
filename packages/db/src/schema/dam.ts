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
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants, users } from "./global";

// ─── Schema ─────────────────────────────────────────────

export const damSchema = pgSchema("dam");

// ─── Enums ──────────────────────────────────────────────

export const assetTypeEnum = damSchema.enum("asset_type", [
  "image",
  "video",
  "document",
  "font",
  "other",
]);

export const assetStatusEnum = damSchema.enum("asset_status", [
  "draft",
  "active",
  "archived",
]);

// ─── Tables ─────────────────────────────────────────────

// 1. dam.collections
export const collections = damSchema
  .table(
    "collections",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      coverAssetId: uuid("cover_asset_id"), // no FK to avoid circular reference
      isPublic: boolean("is_public").notNull().default(false),
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
      index("idx_collections_tenant").on(table.tenantId),
      index("idx_collections_not_deleted")
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

// 2. dam.assets
export const assets = damSchema
  .table(
    "assets",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      collectionId: uuid("collection_id").references(() => collections.id),
      fileName: varchar("file_name", { length: 255 }).notNull(),
      originalFileName: varchar("original_file_name", {
        length: 255,
      }).notNull(),
      fileUrl: text("file_url").notNull(),
      thumbnailUrl: text("thumbnail_url"),
      mimeType: varchar("mime_type", { length: 100 }).notNull(),
      fileSizeBytes: integer("file_size_bytes").notNull(),
      width: integer("width"),
      height: integer("height"),
      assetType: assetTypeEnum("asset_type").notNull(),
      status: assetStatusEnum("status").notNull().default("active"),
      metadata: jsonb("metadata").notNull().default("{}"),
      uploadedBy: uuid("uploaded_by")
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
      index("idx_assets_tenant").on(table.tenantId),
      index("idx_assets_collection").on(table.collectionId),
      index("idx_assets_type").on(table.assetType),
      index("idx_assets_status").on(table.status),
      index("idx_assets_mime_type").on(table.mimeType),
      index("idx_assets_not_deleted")
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

// 3. dam.asset_versions
export const assetVersions = damSchema
  .table(
    "asset_versions",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      assetId: uuid("asset_id")
        .notNull()
        .references(() => assets.id),
      versionNumber: integer("version_number").notNull(),
      fileUrl: text("file_url").notNull(),
      fileSizeBytes: integer("file_size_bytes").notNull(),
      uploadedBy: uuid("uploaded_by")
        .notNull()
        .references(() => users.id),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_asset_versions_tenant").on(table.tenantId),
      index("idx_asset_versions_asset").on(table.assetId),
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

// 4. dam.asset_tags
export const assetTags = damSchema
  .table(
    "asset_tags",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      assetId: uuid("asset_id")
        .notNull()
        .references(() => assets.id),
      tag: varchar("tag", { length: 100 }).notNull(),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_asset_tags_tenant").on(table.tenantId),
      index("idx_asset_tags_asset").on(table.assetId),
      uniqueIndex("idx_asset_tags_unique").on(
        table.tenantId,
        table.assetId,
        table.tag,
      ),
      index("idx_asset_tags_tag").on(table.tag),
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
