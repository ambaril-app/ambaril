import { NextResponse } from "next/server";
import { db, globalSchema } from "@ambaril/db";
import {
  creators,
  creatorTiers,
  salesAttributions,
  challengeSubmissions,
  socialAccounts,
  pointsLedger,
} from "@ambaril/db/schema";
import { withTenantContext } from "@/lib/tenant";
import { eq, and, gte, asc, sql, count, sum, max } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Monthly (1st): Evaluate each active creator's tier based on composite score.
// Skip ambassadors. Award bonus points on upgrade.
// ---------------------------------------------------------------------------

const TIER_UPGRADE_BONUS_POINTS = 50;

const WEIGHTS = {
  conversion: 0.35,
  contentQuality: 0.25,
  engagement: 0.2,
  brandAlignment: 0.15,
  followers: 0.05,
} as const;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenants = await db
    .select({ id: globalSchema.tenants.id, name: globalSchema.tenants.name })
    .from(globalSchema.tenants)
    .where(eq(globalSchema.tenants.isActive, true));

  const results: Record<string, { evaluated: number; upgraded: number; downgraded: number }> = {};

  for (const tenant of tenants) {
    const result = await withTenantContext(tenant.id, async (tx) => {
      const now = new Date();

      // Load all tiers ordered by sortOrder (ascending: ambassador=0, seed=1, ...)
      const tiers = await tx
        .select()
        .from(creatorTiers)
        .where(eq(creatorTiers.tenantId, tenant.id))
        .orderBy(asc(creatorTiers.sortOrder));

      if (tiers.length === 0) return { evaluated: 0, upgraded: 0, downgraded: 0 };

      // Find the ambassador tier to skip
      const ambassadorTier = tiers.find((t) => t.slug === "ambassador");

      // Get all active creators (excluding ambassadors)
      const activeCreators = await tx
        .select()
        .from(creators)
        .where(
          and(
            eq(creators.tenantId, tenant.id),
            eq(creators.status, "active"),
          ),
        );

      // Max points across all creators for engagement normalization
      const [maxPointsResult] = await tx
        .select({ maxPoints: max(creators.totalPoints).as("max_points") })
        .from(creators)
        .where(eq(creators.tenantId, tenant.id));

      const maxPoints = maxPointsResult?.maxPoints ?? 0;

      // Three months ago for sales window
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      let evaluated = 0;
      let upgraded = 0;
      let downgraded = 0;

      for (const creator of activeCreators) {
        // Skip ambassadors
        if (ambassadorTier && creator.tierId === ambassadorTier.id) continue;

        // --- Conversion score ---
        const joinedAt = creator.joinedAt ?? creator.createdAt;
        const monthsActive = Math.max(
          1,
          Math.ceil(
            (now.getTime() - new Date(joinedAt).getTime()) / (30 * 24 * 60 * 60 * 1000),
          ),
        );
        const salesPerMonth = creator.totalSalesCount / monthsActive;
        const conversionRaw = Math.min((salesPerMonth / 10) * 100, 100);

        // --- Content quality score ---
        const [totalSubs] = await tx
          .select({ total: count() })
          .from(challengeSubmissions)
          .where(
            and(
              eq(challengeSubmissions.creatorId, creator.id),
              eq(challengeSubmissions.tenantId, tenant.id),
            ),
          );

        const [approvedSubs] = await tx
          .select({ total: count() })
          .from(challengeSubmissions)
          .where(
            and(
              eq(challengeSubmissions.creatorId, creator.id),
              eq(challengeSubmissions.tenantId, tenant.id),
              eq(challengeSubmissions.status, "approved"),
            ),
          );

        const totalSubsCount = totalSubs?.total ?? 0;
        const approvedSubsCount = approvedSubs?.total ?? 0;
        const contentQualityRaw =
          totalSubsCount > 0 ? (approvedSubsCount / totalSubsCount) * 100 : 50;

        // --- Engagement score ---
        const engagementRaw =
          maxPoints > 0 ? (creator.totalPoints / maxPoints) * 100 : 0;

        // --- Brand alignment (placeholder) ---
        const brandAlignmentRaw = 50;

        // --- Followers score ---
        const socialAccountRows = await tx
          .select({ followers: socialAccounts.followers })
          .from(socialAccounts)
          .where(
            and(
              eq(socialAccounts.creatorId, creator.id),
              eq(socialAccounts.tenantId, tenant.id),
            ),
          );

        const totalFollowers = socialAccountRows.reduce(
          (s, row) => s + (row.followers ?? 0),
          0,
        );
        const followersRaw = Math.min(totalFollowers / 100000, 1) * 100;

        // --- Weighted composite score ---
        const compositeScore =
          conversionRaw * WEIGHTS.conversion +
          contentQualityRaw * WEIGHTS.contentQuality +
          engagementRaw * WEIGHTS.engagement +
          brandAlignmentRaw * WEIGHTS.brandAlignment +
          followersRaw * WEIGHTS.followers;

        // --- Determine best matching tier ---
        // Tiers sorted by sortOrder ascending; pick the highest tier whose
        // minFollowers threshold the creator meets and whose sortOrder > ambassador.
        // We use composite score to pick: higher score = higher tier.
        // Strategy: iterate tiers descending, pick first where score >= tier threshold.
        // We define threshold as: (sortOrder / maxSortOrder) * 100
        const nonAmbassadorTiers = tiers.filter((t) => t.slug !== "ambassador");
        if (nonAmbassadorTiers.length === 0) continue;

        const maxSortOrder = Math.max(...nonAmbassadorTiers.map((t) => t.sortOrder));
        let newTier = nonAmbassadorTiers[0]; // Default to lowest non-ambassador tier

        // Iterate from highest to lowest tier
        for (let i = nonAmbassadorTiers.length - 1; i >= 0; i--) {
          const tier = nonAmbassadorTiers[i]!;
          const threshold = maxSortOrder > 0
            ? ((tier.sortOrder - 1) / maxSortOrder) * 100
            : 0;

          if (compositeScore >= threshold && totalFollowers >= tier.minFollowers) {
            newTier = tier;
            break;
          }
        }

        if (!newTier) continue;

        const currentTier = tiers.find((t) => t.id === creator.tierId);
        const currentSortOrder = currentTier?.sortOrder ?? 0;
        const isUpgrade = newTier.sortOrder > currentSortOrder;
        const isDowngrade = newTier.sortOrder < currentSortOrder;

        if (newTier.id !== creator.tierId) {
          // Update creator tier and commission rate
          await tx
            .update(creators)
            .set({
              tierId: newTier.id,
              commissionRate: newTier.commissionRate,
              tierEvaluatedAt: now,
              updatedAt: now,
            })
            .where(eq(creators.id, creator.id));

          if (isUpgrade) {
            // Award tier upgrade bonus points
            await tx.insert(pointsLedger).values({
              tenantId: tenant.id,
              creatorId: creator.id,
              points: TIER_UPGRADE_BONUS_POINTS,
              actionType: "tier_bonus",
              referenceType: "creator_tier",
              referenceId: newTier.id,
              description: `Bonus por subir para tier ${newTier.name}`,
            });

            await tx
              .update(creators)
              .set({
                totalPoints: sql`${creators.totalPoints} + ${TIER_UPGRADE_BONUS_POINTS}`,
              })
              .where(eq(creators.id, creator.id));

            upgraded++;
          } else if (isDowngrade) {
            downgraded++;
          }
        } else {
          // Same tier, just update evaluation timestamp
          await tx
            .update(creators)
            .set({ tierEvaluatedAt: now, updatedAt: now })
            .where(eq(creators.id, creator.id));
        }

        evaluated++;
      }

      return { evaluated, upgraded, downgraded };
    });

    results[tenant.name] = result;
  }

  return NextResponse.json({
    success: true,
    job: "tier-evaluation",
    timestamp: new Date().toISOString(),
    results,
  });
}
