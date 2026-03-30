import { NextResponse } from "next/server";
import { db, globalSchema } from "@ambaril/db";
import {
  creators,
  creatorTiers,
  salesAttributions,
  pointsLedger,
} from "@ambaril/db/schema";
import { withTenantContext } from "@/lib/tenant";
import { eq, and, gte, count, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Weekly: Auto-promote ambassadors who meet thresholds to 'seed' tier.
// Criteria: >= 3 confirmed sales in last 30 days OR >= 100 total points.
// ---------------------------------------------------------------------------

const MIN_SALES_FOR_PROMOTION = 3;
const MIN_POINTS_FOR_PROMOTION = 100;
const PROMOTION_BONUS_POINTS = 25;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenants = await db
    .select({ id: globalSchema.tenants.id, name: globalSchema.tenants.name })
    .from(globalSchema.tenants)
    .where(eq(globalSchema.tenants.isActive, true));

  const results: Record<string, { promoted: number; evaluated: number }> = {};

  for (const tenant of tenants) {
    const result = await withTenantContext(tenant.id, async (tx) => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find the ambassador tier
      const [ambassadorTier] = await tx
        .select()
        .from(creatorTiers)
        .where(
          and(
            eq(creatorTiers.tenantId, tenant.id),
            eq(creatorTiers.slug, "ambassador"),
          ),
        )
        .limit(1);

      if (!ambassadorTier) return { promoted: 0, evaluated: 0 };

      // Find the seed tier (promotion target)
      const [seedTier] = await tx
        .select()
        .from(creatorTiers)
        .where(
          and(
            eq(creatorTiers.tenantId, tenant.id),
            eq(creatorTiers.slug, "seed"),
          ),
        )
        .limit(1);

      if (!seedTier) return { promoted: 0, evaluated: 0 };

      // Get all active ambassadors
      const ambassadors = await tx
        .select()
        .from(creators)
        .where(
          and(
            eq(creators.tenantId, tenant.id),
            eq(creators.status, "active"),
            eq(creators.tierId, ambassadorTier.id),
          ),
        );

      let promoted = 0;

      for (const ambassador of ambassadors) {
        // Check confirmed sales in the last 30 days
        const [salesResult] = await tx
          .select({ total: count() })
          .from(salesAttributions)
          .where(
            and(
              eq(salesAttributions.tenantId, tenant.id),
              eq(salesAttributions.creatorId, ambassador.id),
              eq(salesAttributions.status, "confirmed"),
              gte(salesAttributions.confirmedAt, thirtyDaysAgo),
            ),
          );

        const recentSalesCount = salesResult?.total ?? 0;
        const meetsThreshold =
          recentSalesCount >= MIN_SALES_FOR_PROMOTION ||
          ambassador.totalPoints >= MIN_POINTS_FOR_PROMOTION;

        if (meetsThreshold) {
          // Promote to seed tier
          await tx
            .update(creators)
            .set({
              tierId: seedTier.id,
              commissionRate: seedTier.commissionRate,
              tierEvaluatedAt: now,
              updatedAt: now,
            })
            .where(eq(creators.id, ambassador.id));

          // Award promotion bonus points
          await tx.insert(pointsLedger).values({
            tenantId: tenant.id,
            creatorId: ambassador.id,
            points: PROMOTION_BONUS_POINTS,
            actionType: "tier_bonus",
            referenceType: "creator_tier",
            referenceId: seedTier.id,
            description: `Bonus por promocao de ambassador para ${seedTier.name}`,
          });

          await tx
            .update(creators)
            .set({
              totalPoints: sql`${creators.totalPoints} + ${PROMOTION_BONUS_POINTS}`,
            })
            .where(eq(creators.id, ambassador.id));

          promoted++;
        }
      }

      return { promoted, evaluated: ambassadors.length };
    });

    results[tenant.name] = result;
  }

  return NextResponse.json({
    success: true,
    job: "ambassador-promotion",
    timestamp: new Date().toISOString(),
    results,
  });
}
