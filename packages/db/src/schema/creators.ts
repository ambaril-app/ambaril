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

export const paymentPreferenceEnum = creatorsSchema.enum("payment_preference", [
  "pix",
  "store_credit",
  "product",
]);

export const discountTypeEnum = creatorsSchema.enum("discount_type", [
  "percent",
  "fixed",
]);

export const socialPlatformEnum = creatorsSchema.enum("social_platform", [
  "instagram",
  "tiktok",
  "youtube",
  "pinterest",
  "twitter",
  "other",
]);

export const contentPostTypeEnum = creatorsSchema.enum("content_post_type", [
  "image",
  "video",
  "carousel",
  "story",
  "reel",
  "short",
]);

export const pointsActionEnum = creatorsSchema.enum("points_action", [
  "sale",
  "post_detected",
  "challenge_completed",
  "referral",
  "engagement",
  "manual_adjustment",
  "tier_bonus",
  "hashtag_detected",
  "creator_of_month",
  "product_redemption",
]);

export const attributionStatusEnum = creatorsSchema.enum("attribution_status", [
  "pending",
  "confirmed",
  "adjusted",
  "cancelled",
]);

export const payoutStatusEnum = creatorsSchema.enum("payout_status", [
  "calculating",
  "pending",
  "processing",
  "paid",
  "failed",
]);

export const challengeCategoryEnum = creatorsSchema.enum("challenge_category", [
  "drop",
  "style",
  "community",
  "viral",
  "surprise",
]);

export const challengeStatusEnum = creatorsSchema.enum("challenge_status", [
  "draft",
  "active",
  "judging",
  "completed",
  "cancelled",
]);

export const submissionStatusEnum = creatorsSchema.enum("submission_status", [
  "pending",
  "approved",
  "rejected",
]);

export const proofTypeEnum = creatorsSchema.enum("proof_type", [
  "instagram_post",
  "instagram_story",
  "tiktok",
  "youtube",
  "other",
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
  "content_posted",
]);

export const referralStatusEnum = creatorsSchema.enum("referral_status", [
  "pending",
  "active",
  "expired",
]);

export const taxpayerTypeEnum = creatorsSchema.enum("taxpayer_type", [
  "pf",
  "mei",
  "pj",
]);

export const fiscalDocTypeEnum = creatorsSchema.enum("fiscal_doc_type", [
  "rpa",
  "nfse",
  "none",
]);

export const giftingStatusEnum = creatorsSchema.enum("gifting_status", [
  "suggested",
  "approved",
  "rejected",
  "ordered",
  "shipped",
  "delivered",
]);

// ─── Tables ─────────────────────────────────────────────

// 0. creators.creator_tiers — configurable per tenant (session 17 decision)
// CIENA seed: ambassador (0%), seed (8%), grow (10%), bloom (12%), core (15%)
export const creatorTiers = creatorsSchema
  .table(
    "creator_tiers",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 100 }).notNull(),
      slug: varchar("slug", { length: 50 }).notNull(),
      commissionRate: numeric("commission_rate", {
        precision: 5,
        scale: 2,
      }).notNull(),
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
  )
  .enableRLS();

// 1. creators.coupons
export const coupons = creatorsSchema
  .table(
    "coupons",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      creatorId: uuid("creator_id"), // FK to creators.creators — no formal ref (circular dependency)
      code: varchar("code", { length: 50 }).notNull(),
      type: couponTypeEnum("type").notNull(),
      discountType: discountTypeEnum("discount_type")
        .notNull()
        .default("percent"),
      discountPercent: numeric("discount_percent", {
        precision: 5,
        scale: 2,
      }),
      discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }),
      maxUses: integer("max_uses"),
      usageCount: integer("usage_count").notNull().default(0),
      totalRevenueGenerated: numeric("total_revenue_generated", {
        precision: 12,
        scale: 2,
      })
        .notNull()
        .default("0"),
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
      index("idx_coupons_creator").on(table.creatorId),
      index("idx_coupons_active").on(table.isActive),
      index("idx_coupons_tenant").on(table.tenantId),
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

// 2. creators.creators
export const creators = creatorsSchema
  .table(
    "creators",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
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
        .default("0.00"),
      couponId: uuid("coupon_id").references(() => coupons.id),
      totalSalesAmount: numeric("total_sales_amount", {
        precision: 12,
        scale: 2,
      })
        .notNull()
        .default("0"),
      totalSalesCount: integer("total_sales_count").notNull().default(0),
      totalPoints: integer("total_points").notNull().default(0),
      currentMonthSalesAmount: numeric("current_month_sales_amount", {
        precision: 12,
        scale: 2,
      })
        .notNull()
        .default("0"),
      currentMonthSalesCount: integer("current_month_sales_count")
        .notNull()
        .default(0),
      status: creatorStatusEnum("status").notNull().default("pending"),
      managedByStaff: boolean("managed_by_staff").notNull().default(false),
      paymentPreference: paymentPreferenceEnum("payment_preference"),
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
      suspensionReason: varchar("suspension_reason", { length: 500 }),
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
      index("idx_creators_total_sales").on(table.totalSalesCount),
      index("idx_creators_total_points").on(table.totalPoints),
      index("idx_creators_current_month").on(table.currentMonthSalesAmount),
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
  )
  .enableRLS();

// 3. creators.sales_attributions
export const salesAttributions = creatorsSchema
  .table(
    "sales_attributions",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      creatorId: uuid("creator_id")
        .notNull()
        .references(() => creators.id),
      orderId: uuid("order_id").notNull(), // FK to checkout.orders (created later)
      couponId: uuid("coupon_id")
        .notNull()
        .references(() => coupons.id),
      orderTotal: numeric("order_total", { precision: 12, scale: 2 }).notNull(),
      discountAmount: numeric("discount_amount", {
        precision: 12,
        scale: 2,
      }).notNull(),
      netRevenue: numeric("net_revenue", {
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
      status: attributionStatusEnum("status").notNull().default("pending"),
      confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
      exchangeWindowEndsAt: timestamp("exchange_window_ends_at", {
        withTimezone: true,
      }).notNull(),
      exchangeAdjusted: boolean("exchange_adjusted").notNull().default(false),
      adjustmentReason: varchar("adjustment_reason", { length: 500 }),
      buyerCpfHash: varchar("buyer_cpf_hash", { length: 64 }),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      uniqueIndex("idx_attributions_order").on(table.tenantId, table.orderId),
      index("idx_attributions_creator").on(table.creatorId),
      index("idx_attributions_status").on(table.status),
      index("idx_attributions_pending_window").on(table.exchangeWindowEndsAt),
      index("idx_attributions_creator_month").on(
        table.creatorId,
        table.createdAt,
      ),
      index("idx_attributions_tenant").on(table.tenantId),
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

// 4. creators.points_ledger (append-only)
export const pointsLedger = creatorsSchema
  .table(
    "points_ledger",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
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
      index("idx_points_ledger_reference").on(
        table.referenceType,
        table.referenceId,
      ),
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
  )
  .enableRLS();

// 5. creators.challenges
export const challenges = creatorsSchema
  .table(
    "challenges",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description").notNull(),
      category: challengeCategoryEnum("category").notNull(),
      month: integer("month").notNull(),
      year: integer("year").notNull(),
      status: challengeStatusEnum("status").notNull().default("draft"),
      pointsReward: integer("points_reward").notNull(),
      requirements: jsonb("requirements").notNull(),
      maxParticipants: integer("max_participants"),
      startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
      endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
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
      index("idx_challenges_status").on(table.status),
      index("idx_challenges_month_year").on(table.year, table.month),
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
  )
  .enableRLS();

// 6. creators.challenge_submissions
export const challengeSubmissions = creatorsSchema
  .table(
    "challenge_submissions",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      challengeId: uuid("challenge_id")
        .notNull()
        .references(() => challenges.id),
      creatorId: uuid("creator_id")
        .notNull()
        .references(() => creators.id),
      proofUrl: text("proof_url").notNull(),
      proofType: proofTypeEnum("proof_type").notNull(),
      caption: text("caption"),
      status: submissionStatusEnum("status").notNull().default("pending"),
      reviewedBy: uuid("reviewed_by").references(() => users.id),
      reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
      pointsAwarded: integer("points_awarded"),
      rejectionReason: varchar("rejection_reason", { length: 500 }),
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
  )
  .enableRLS();

// 7. creators.payouts
export const payouts = creatorsSchema
  .table(
    "payouts",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      creatorId: uuid("creator_id")
        .notNull()
        .references(() => creators.id),
      periodStart: date("period_start").notNull(),
      periodEnd: date("period_end").notNull(),
      grossAmount: numeric("gross_amount", {
        precision: 12,
        scale: 2,
      }).notNull(),
      irrfWithheld: numeric("irrf_withheld", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      issWithheld: numeric("iss_withheld", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      deductions: jsonb("deductions"),
      netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
      fiscalDocType: fiscalDocTypeEnum("fiscal_doc_type")
        .notNull()
        .default("none"),
      fiscalDocId: varchar("fiscal_doc_id", { length: 255 }),
      fiscalDocVerified: boolean("fiscal_doc_verified")
        .notNull()
        .default(false),
      paymentMethod: paymentMethodEnum("payment_method")
        .notNull()
        .default("pix"),
      status: payoutStatusEnum("status").notNull().default("calculating"),
      pixKey: varchar("pix_key", { length: 255 }),
      pixKeyType: pixKeyTypeEnum("pix_key_type"),
      pixTransactionId: varchar("pix_transaction_id", { length: 255 }),
      storeCreditCode: varchar("store_credit_code", { length: 100 }),
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
      failureReason: varchar("failure_reason", { length: 500 }),
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
  )
  .enableRLS();

// 8. creators.referrals
export const referrals = creatorsSchema
  .table(
    "referrals",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      referrerId: uuid("referrer_id")
        .notNull()
        .references(() => creators.id),
      referredId: uuid("referred_id")
        .notNull()
        .references(() => creators.id),
      referralCode: varchar("referral_code", { length: 50 }).notNull(),
      status: referralStatusEnum("status").notNull().default("pending"),
      pointsAwarded: boolean("points_awarded").notNull().default(false),
      referredFirstSaleAt: timestamp("referred_first_sale_at", {
        withTimezone: true,
      }),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_referrals_referrer").on(table.referrerId),
      index("idx_referrals_referred").on(table.referredId),
      uniqueIndex("idx_referrals_unique").on(
        table.tenantId,
        table.referrerId,
        table.referredId,
      ),
      index("idx_referrals_pending").on(table.status),
      index("idx_referrals_tenant").on(table.tenantId),
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

// 9. creators.social_accounts
export const socialAccounts = creatorsSchema
  .table(
    "social_accounts",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
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
  )
  .enableRLS();

// 10. creators.content_detections
export const contentDetections = creatorsSchema
  .table(
    "content_detections",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
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
      pointsAwarded: boolean("points_awarded").notNull().default(false),
      detectedAt: timestamp("detected_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
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
      index("idx_content_detect_hashtag").on(table.hashtagMatched),
      index("idx_content_detect_tenant").on(table.tenantId),
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

// 11. creators.campaigns
export const campaigns = creatorsSchema
  .table(
    "campaigns",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 255 }).notNull(),
      campaignType: campaignTypeEnum("campaign_type").notNull(),
      status: campaignStatusEnum("status").notNull().default("draft"),
      brief: jsonb("brief"),
      startDate: date("start_date").notNull(),
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
  )
  .enableRLS();

// 12. creators.campaign_creators
export const campaignCreators = creatorsSchema
  .table(
    "campaign_creators",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      campaignId: uuid("campaign_id")
        .notNull()
        .references(() => campaigns.id),
      creatorId: uuid("creator_id")
        .notNull()
        .references(() => creators.id),
      productId: uuid("product_id"), // FK to erp.products (created later)
      deliveryStatus: deliveryStatusEnum("delivery_status").default("pending"),
      productCost: numeric("product_cost", { precision: 12, scale: 2 }),
      shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }),
      feeAmount: numeric("fee_amount", { precision: 12, scale: 2 }),
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
  )
  .enableRLS();

// 13. creators.campaign_briefs — structured content guidelines for creators
export const campaignBriefs = creatorsSchema
  .table(
    "campaign_briefs",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      campaignId: uuid("campaign_id")
        .notNull()
        .references(() => campaigns.id),
      title: varchar("title", { length: 255 }).notNull(),
      contentMd: text("content_md").notNull(),
      hashtags: text("hashtags").array(),
      deadline: timestamp("deadline", { withTimezone: true }),
      examplesJson: jsonb("examples_json"),
      targetTiers: varchar("target_tiers", { length: 50 }).array(),
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
      index("idx_campaign_briefs_campaign").on(table.campaignId),
      index("idx_campaign_briefs_deadline").on(table.deadline),
      index("idx_campaign_briefs_tenant").on(table.tenantId),
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

// 14. creators.gifting_log — tracks gifting decisions and deliveries
export const giftingLog = creatorsSchema
  .table(
    "gifting_log",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      creatorId: uuid("creator_id")
        .notNull()
        .references(() => creators.id),
      campaignId: uuid("campaign_id").references(() => campaigns.id),
      productId: uuid("product_id"), // FK to erp.products (created later)
      productName: varchar("product_name", { length: 255 }).notNull(),
      productCost: numeric("product_cost", {
        precision: 12,
        scale: 2,
      }).notNull(),
      shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      reason: text("reason").notNull(),
      status: giftingStatusEnum("status").notNull().default("suggested"),
      erpOrderId: uuid("erp_order_id"), // FK to erp.orders (created later)
      approvedBy: uuid("approved_by").references(() => users.id),
      approvedAt: timestamp("approved_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_gifting_log_creator").on(table.creatorId),
      index("idx_gifting_log_campaign").on(table.campaignId),
      index("idx_gifting_log_status").on(table.status),
      index("idx_gifting_log_created").on(table.createdAt),
      index("idx_gifting_log_tenant").on(table.tenantId),
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

// 15. creators.creator_kit_downloads — tracks asset downloads from Creator Kit
export const creatorKitDownloads = creatorsSchema
  .table(
    "creator_kit_downloads",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      creatorId: uuid("creator_id")
        .notNull()
        .references(() => creators.id),
      assetId: uuid("asset_id").notNull(), // FK to dam.assets (created later)
      assetName: varchar("asset_name", { length: 255 }).notNull(),
      downloadedAt: timestamp("downloaded_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("idx_kit_downloads_creator").on(table.creatorId),
      index("idx_kit_downloads_asset").on(table.assetId),
      index("idx_kit_downloads_date").on(table.downloadedAt),
      index("idx_kit_downloads_tenant").on(table.tenantId),
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

// 16. creators.tax_profiles — fiscal compliance data per creator
export const taxProfiles = creatorsSchema
  .table(
    "tax_profiles",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      creatorId: uuid("creator_id")
        .notNull()
        .references(() => creators.id),
      taxpayerType: taxpayerTypeEnum("taxpayer_type").notNull().default("pf"),
      cpf: varchar("cpf", { length: 14 }).notNull(),
      cnpj: varchar("cnpj", { length: 18 }),
      meiActive: boolean("mei_active"),
      meiValidatedAt: timestamp("mei_validated_at", { withTimezone: true }),
      municipalityCode: varchar("municipality_code", { length: 10 }),
      municipalityName: varchar("municipality_name", { length: 255 }),
      issRate: numeric("iss_rate", { precision: 5, scale: 2 }),
      hasNfCapability: boolean("has_nf_capability").notNull().default(false),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      uniqueIndex("idx_tax_profiles_creator").on(
        table.tenantId,
        table.creatorId,
      ),
      index("idx_tax_profiles_type").on(table.taxpayerType),
      index("idx_tax_profiles_cnpj").on(table.cnpj),
      index("idx_tax_profiles_tenant").on(table.tenantId),
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
