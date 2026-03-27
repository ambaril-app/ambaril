import {
  pgSchema,
  pgEnum,
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
import { users } from "./global";
import { tenants } from "./global";

// ─── Schema ─────────────────────────────────────────────

export const creatorsSchema = pgSchema("creators");

// ─── Enums ──────────────────────────────────────────────

// NOTE: creator_tier enum REMOVED — tiers are now configurable per tenant
// via the creators.creator_tiers table (decision session 17).

export const creatorStatusEnum = creatorsSchema.enum("creator_status", [
  "pending",
  "active",
  "suspended",
  "inactive",
]);

export const pixKeyTypeEnum = creatorsSchema.enum("pix_key_type", [
  "cpf",
  "email",
  "phone",
  "random",
]);

export const paymentMethodEnum = creatorsSchema.enum("payment_method", [
  "pix",
  "store_credit",
  "product",
]);

export const paymentPreferenceEnum = creatorsSchema.enum(
  "payment_preference",
  ["pix", "store_credit", "product"],
);

export const socialPlatformEnum = creatorsSchema.enum("social_platform", [
  "instagram",
  "tiktok",
  "youtube",
  "pinterest",
  "twitter",
  "other",
]);

export const contentPostTypeEnum = creatorsSchema.enum("content_post_type", [
  "post",
  "story",
  "reel",
  "tiktok",
  "youtube",
  "live",
]);

export const pointsActionEnum = creatorsSchema.enum("points_action", [
  "sale",
  "post",
  "challenge",
  "referral",
  "engagement",
  "manual_adjustment",
  "tier_bonus",
  "hashtag_detected",
  "creator_of_month",
]);

export const payoutStatusEnum = creatorsSchema.enum("payout_status", [
  "pending",
  "processing",
  "paid",
  "failed",
]);

export const challengeTypeEnum = creatorsSchema.enum("challenge_type", [
  "drop",
  "style",
  "community",
  "viral",
  "surprise",
]);

export const challengeStatusEnum = creatorsSchema.enum("challenge_status", [
  "draft",
  "active",
  "completed",
  "cancelled",
]);

export const submissionStatusEnum = creatorsSchema.enum("submission_status", [
  "pending",
  "approved",
  "rejected",
]);

export const couponTypeEnum = creatorsSchema.enum("coupon_type", [
  "creator",
  "campaign",
  "vip",
]);

export const campaignTypeEnum = creatorsSchema.enum("campaign_type", [
  "seeding",
  "paid",
  "gifting",
  "reward",
]);

export const campaignStatusEnum = creatorsSchema.enum("campaign_status", [
  "draft",
  "active",
  "completed",
  "cancelled",
]);

export const deliveryStatusEnum = creatorsSchema.enum("delivery_status", [
  "pending",
  "shipped",
  "delivered",
  "returned",
]);

// ─── Tables ─────────────────────────────────────────────

// 0. creators.creator_tiers — configurable per tenant (session 17 decision)
// CIENA seed: seed (8%), grow (10%), bloom (12%), core (15%)
export const creatorTiers = creatorsSchema.table(
  "creator_tiers",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 50 }).notNull(),
    commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull(),
    minFollowers: integer("min_followers").notNull().default(0),
    benefits: jsonb("benefits").notNull().default("{}"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_creator_tiers_slug").on(table.tenantId, table.slug),
    index("idx_creator_tiers_sort").on(table.sortOrder),
    index("idx_creator_tiers_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 1. creators.coupons
export const coupons = creatorsSchema.table(
  "coupons",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    code: varchar("code", { length: 50 }).notNull(),
    type: couponTypeEnum("type").notNull(),
    discountPercent: numeric("discount_percent", {
      precision: 5,
      scale: 2,
    }),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }),
    maxUses: integer("max_uses"),
    currentUses: integer("current_uses").notNull().default(0),
    minOrderValue: numeric("min_order_value", { precision: 12, scale: 2 }),
    validFrom: timestamp("valid_from", { withTimezone: true })
      .notNull()
      .defaultNow(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_coupons_code_tenant").on(table.tenantId, table.code),
    index("idx_coupons_type").on(table.type),
    index("idx_coupons_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 2. creators.creators
export const creators = creatorsSchema.table(
  "creators",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    userId: uuid("user_id").references(() => users.id),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    cpf: varchar("cpf", { length: 14 }).notNull(),
    bio: text("bio"),
    profileImageUrl: text("profile_image_url"),
    tierId: uuid("tier_id").references(() => creatorTiers.id),
    commissionRate: numeric("commission_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("8.00"),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id),
    totalSalesAmount: numeric("total_sales_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    totalSalesCount: integer("total_sales_count").notNull().default(0),
    totalPoints: integer("total_points").notNull().default(0),
    currentMonthSales: numeric("current_month_sales", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    status: creatorStatusEnum("status").notNull().default("pending"),
    managedByStaff: boolean("managed_by_staff").notNull().default(false),
    paymentPreference: paymentPreferenceEnum("payment_preference")
      .notNull()
      .default("pix"),
    pixKey: varchar("pix_key", { length: 255 }),
    pixKeyType: pixKeyTypeEnum("pix_key_type"),
    clothingSize: varchar("clothing_size", { length: 5 }),
    birthDate: date("birth_date"),
    discoverySource: varchar("discovery_source", { length: 100 }),
    motivation: text("motivation"),
    contentNiches: jsonb("content_niches"),
    contentTypes: jsonb("content_types"),
    address: jsonb("address"),
    contentRightsAccepted: boolean("content_rights_accepted")
      .notNull()
      .default(false),
    monthlyCap: numeric("monthly_cap", { precision: 12, scale: 2 })
      .notNull()
      .default("3000"),
    referredByCreatorId: uuid("referred_by_creator_id"),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    lastSaleAt: timestamp("last_sale_at", { withTimezone: true }),
    tierEvaluatedAt: timestamp("tier_evaluated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_creators_cpf").on(table.tenantId, table.cpf),
    index("idx_creators_user").on(table.userId),
    index("idx_creators_tier").on(table.tierId),
    index("idx_creators_status").on(table.status),
    index("idx_creators_coupon").on(table.couponId),
    index("idx_creators_total_sales").on(table.totalSalesAmount),
    index("idx_creators_referred_by").on(table.referredByCreatorId),
    index("idx_creators_managed").on(table.managedByStaff),
    index("idx_creators_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 3. creators.sales_attributions
export const salesAttributions = creatorsSchema.table(
  "sales_attributions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => creators.id),
    orderId: uuid("order_id").notNull(), // FK to checkout.orders (created later)
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id),
    orderTotal: numeric("order_total", { precision: 12, scale: 2 }).notNull(),
    discountGiven: numeric("discount_given", {
      precision: 12,
      scale: 2,
    }).notNull(),
    commissionBase: numeric("commission_base", {
      precision: 12,
      scale: 2,
    }).notNull(),
    commissionRate: numeric("commission_rate", {
      precision: 5,
      scale: 2,
    }).notNull(),
    commissionAmount: numeric("commission_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),
    buyerCpfHash: varchar("buyer_cpf_hash", { length: 64 }).notNull(),
    isValid: boolean("is_valid").notNull().default(true),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    invalidationReason: text("invalidation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_sales_attr_creator").on(table.creatorId),
    index("idx_sales_attr_order").on(table.orderId),
    index("idx_sales_attr_valid").on(table.isValid, table.validatedAt),
    index("idx_sales_attr_created").on(table.createdAt),
    index("idx_sales_attr_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 4. creators.points_ledger (append-only)
export const pointsLedger = creatorsSchema.table(
  "points_ledger",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => creators.id),
    points: integer("points").notNull(),
    actionType: pointsActionEnum("action_type").notNull(),
    referenceType: varchar("reference_type", { length: 100 }),
    referenceId: uuid("reference_id"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_points_ledger_creator").on(table.creatorId),
    index("idx_points_ledger_action").on(table.actionType),
    index("idx_points_ledger_created").on(table.createdAt),
    index("idx_points_ledger_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 5. creators.challenges
export const challenges = creatorsSchema.table(
  "challenges",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    type: challengeTypeEnum("type").notNull(),
    status: challengeStatusEnum("status").notNull().default("draft"),
    pointsReward: integer("points_reward").notNull(),
    requirements: jsonb("requirements").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    maxWinners: integer("max_winners"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_challenges_status").on(table.status),
    index("idx_challenges_dates").on(table.startsAt, table.endsAt),
    index("idx_challenges_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 6. creators.challenge_submissions
export const challengeSubmissions = creatorsSchema.table(
  "challenge_submissions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => creators.id),
    status: submissionStatusEnum("status").notNull().default("pending"),
    proofUrl: text("proof_url").notNull(),
    proofMetadata: jsonb("proof_metadata"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_challenge_subs_challenge").on(table.challengeId),
    index("idx_challenge_subs_creator").on(table.creatorId),
    index("idx_challenge_subs_status").on(table.status),
    uniqueIndex("idx_challenge_subs_unique").on(
      table.tenantId,
      table.challengeId,
      table.creatorId,
    ),
    index("idx_challenge_subs_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 7. creators.payouts
export const payouts = creatorsSchema.table(
  "payouts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => creators.id),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(),
    deductions: jsonb("deductions").notNull().default("{}"),
    netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method")
      .notNull()
      .default("pix"),
    status: payoutStatusEnum("status").notNull().default("pending"),
    pixKey: varchar("pix_key", { length: 255 }),
    pixKeyType: pixKeyTypeEnum("pix_key_type"),
    pixTransactionId: varchar("pix_transaction_id", { length: 255 }),
    storeCreditCode: varchar("store_credit_code", { length: 50 }),
    storeCreditAmount: numeric("store_credit_amount", {
      precision: 12,
      scale: 2,
    }),
    productItems: jsonb("product_items"),
    productTotalCost: numeric("product_total_cost", {
      precision: 12,
      scale: 2,
    }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_payouts_creator").on(table.creatorId),
    index("idx_payouts_status").on(table.status),
    index("idx_payouts_method").on(table.paymentMethod),
    index("idx_payouts_period").on(table.periodStart, table.periodEnd),
    uniqueIndex("idx_payouts_unique_period").on(
      table.tenantId,
      table.creatorId,
      table.periodStart,
      table.periodEnd,
    ),
    index("idx_payouts_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 8. creators.referrals
export const referrals = creatorsSchema.table(
  "referrals",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    referrerId: uuid("referrer_id")
      .notNull()
      .references(() => creators.id),
    referredId: uuid("referred_id")
      .notNull()
      .references(() => creators.id),
    referralCode: varchar("referral_code", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_referrals_referrer").on(table.referrerId),
    index("idx_referrals_referred").on(table.referredId),
    uniqueIndex("idx_referrals_unique").on(table.tenantId, table.referrerId, table.referredId),
    index("idx_referrals_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 9. creators.social_accounts
export const socialAccounts = creatorsSchema.table(
  "social_accounts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => creators.id),
    platform: socialPlatformEnum("platform").notNull(),
    handle: varchar("handle", { length: 100 }).notNull(),
    url: varchar("url", { length: 500 }),
    followers: integer("followers"),
    isPrimary: boolean("is_primary").notNull().default(false),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_social_accounts_platform_handle").on(
      table.tenantId,
      table.platform,
      table.handle,
    ),
    index("idx_social_accounts_creator").on(table.creatorId),
    index("idx_social_accounts_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 10. creators.content_detections
export const contentDetections = creatorsSchema.table(
  "content_detections",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => creators.id),
    platform: socialPlatformEnum("platform").notNull(),
    platformPostId: varchar("platform_post_id", { length: 255 }).notNull(),
    postUrl: text("post_url").notNull(),
    postType: contentPostTypeEnum("post_type").notNull(),
    caption: text("caption"),
    likes: integer("likes").default(0),
    comments: integer("comments").default(0),
    shares: integer("shares").default(0),
    hashtagMatched: varchar("hashtag_matched", { length: 100 }),
    detectedAt: timestamp("detected_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_content_detect_post").on(
      table.tenantId,
      table.platform,
      table.platformPostId,
    ),
    index("idx_content_detect_creator").on(table.creatorId),
    index("idx_content_detect_platform").on(table.platform, table.detectedAt),
    index("idx_content_detect_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();

// 11. creators.campaigns
export const campaigns = creatorsSchema.table(
  "campaigns",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    campaignType: campaignTypeEnum("campaign_type").notNull(),
    status: campaignStatusEnum("status").notNull().default("draft"),
    brief: jsonb("brief"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    totalProductCost: numeric("total_product_cost", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    totalShippingCost: numeric("total_shipping_cost", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    totalFeeCost: numeric("total_fee_cost", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    totalRewardCost: numeric("total_reward_cost", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
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
    index("idx_campaigns_status").on(table.status),
    index("idx_campaigns_type").on(table.campaignType),
    index("idx_campaigns_dates").on(table.startDate, table.endDate),
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

// 12. creators.campaign_creators
export const campaignCreators = creatorsSchema.table(
  "campaign_creators",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => creators.id),
    productId: uuid("product_id"), // FK to erp.products (created later)
    deliveryStatus: deliveryStatusEnum("delivery_status").default("pending"),
    productCost: numeric("product_cost", { precision: 12, scale: 2 }).default(
      "0",
    ),
    shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }).default(
      "0",
    ),
    feeAmount: numeric("fee_amount", { precision: 12, scale: 2 }).default("0"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_campaign_creators_unique").on(
      table.tenantId,
      table.campaignId,
      table.creatorId,
    ),
    index("idx_campaign_creators_campaign").on(table.campaignId),
    index("idx_campaign_creators_creator").on(table.creatorId),
    index("idx_campaign_creators_delivery").on(table.deliveryStatus),
    index("idx_campaign_creators_tenant").on(table.tenantId),
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
      withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
    }),
  ],
).enableRLS();
