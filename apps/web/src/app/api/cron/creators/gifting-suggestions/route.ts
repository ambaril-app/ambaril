import { NextResponse } from "next/server";
import { db, globalSchema } from "@ambaril/db";
import {
  creators,
  creatorTiers,
  salesAttributions,
  giftingLog,
} from "@ambaril/db/schema";
import { withTenantContext } from "@/lib/tenant";
import { eq, and, gte, desc, sql, sum, notInArray } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Monthly (15th): Suggest top-performing creators for gifting who haven't
// been gifted recently. Inserts suggestions into giftingLog with
// status = 'suggested' for admin review.
// ---------------------------------------------------------------------------

const MAX_SUGGESTIONS_PER_TENANT = 10;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenants = await db
    .select({ id: globalSchema.tenants.id, name: globalSchema.tenants.name })
    .from(globalSchema.tenants)
    .where(eq(globalSchema.tenants.isActive, true));

  const results: Record<string, { suggested: number }> = {};

  for (const tenant of tenants) {
    const result = await withTenantContext(tenant.id, async (tx) => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Find creators who have been gifted in the last 60 days (to exclude)
      const recentlyGifted = await tx
        .select({ creatorId: giftingLog.creatorId })
        .from(giftingLog)
        .where(
          and(
            eq(giftingLog.tenantId, tenant.id),
            gte(giftingLog.createdAt, sixtyDaysAgo),
          ),
        );

      const recentlyGiftedIds = recentlyGifted.map((r) => r.creatorId);

      // Find top-performing active creators by confirmed sales in the last 30 days.
      // We rank by total sales revenue, then by tier sort order (higher tiers first).
      const topCreatorsQuery = tx
        .select({
          creatorId: creators.id,
          creatorName: creators.name,
          tierId: creators.tierId,
          totalRevenue: sum(salesAttributions.netRevenue).as("total_revenue"),
        })
        .from(creators)
        .innerJoin(
          salesAttributions,
          and(
            eq(salesAttributions.creatorId, creators.id),
            eq(salesAttributions.tenantId, tenant.id),
            eq(salesAttributions.status, "confirmed"),
            gte(salesAttributions.createdAt, thirtyDaysAgo),
          ),
        )
        .where(
          and(
            eq(creators.tenantId, tenant.id),
            eq(creators.status, "active"),
            // Exclude recently gifted creators (if any exist)
            ...(recentlyGiftedIds.length > 0
              ? [notInArray(creators.id, recentlyGiftedIds)]
              : []),
          ),
        )
        .groupBy(creators.id, creators.name, creators.tierId)
        .orderBy(desc(sql`total_revenue`))
        .limit(MAX_SUGGESTIONS_PER_TENANT);

      const topCreators = await topCreatorsQuery;

      // Load tiers for priority sorting context
      const tiers = await tx
        .select({
          id: creatorTiers.id,
          name: creatorTiers.name,
          sortOrder: creatorTiers.sortOrder,
        })
        .from(creatorTiers)
        .where(eq(creatorTiers.tenantId, tenant.id));

      const tierMap = new Map(tiers.map((t) => [t.id, t]));

      // Sort by tier priority (higher sortOrder = higher tier = more priority),
      // then by total revenue descending.
      const sorted = [...topCreators].sort((a, b) => {
        const aTier = a.tierId ? tierMap.get(a.tierId) : null;
        const bTier = b.tierId ? tierMap.get(b.tierId) : null;
        const aTierOrder = aTier?.sortOrder ?? 0;
        const bTierOrder = bTier?.sortOrder ?? 0;

        // Higher tier first
        if (bTierOrder !== aTierOrder) return bTierOrder - aTierOrder;

        // Then by revenue descending
        const aRev = parseFloat(a.totalRevenue ?? "0");
        const bRev = parseFloat(b.totalRevenue ?? "0");
        return bRev - aRev;
      });

      let suggested = 0;

      for (const creator of sorted) {
        const tier = creator.tierId ? tierMap.get(creator.tierId) : null;
        const tierName = tier?.name ?? "sem tier";
        const revenue = creator.totalRevenue ?? "0";

        // Insert gifting suggestion into giftingLog
        await tx.insert(giftingLog).values({
          tenantId: tenant.id,
          creatorId: creator.creatorId,
          productName: "A definir", // Placeholder — admin picks the product
          productCost: "0",
          reason: `Top performer: R$${revenue} em vendas nos ultimos 30 dias (tier: ${tierName})`,
          status: "suggested",
        });

        console.log(
          `[gifting-suggestions] Suggested gifting for ${creator.creatorName} — R$${revenue} revenue, tier: ${tierName} (tenant: ${tenant.name})`,
        );

        suggested++;
      }

      return { suggested };
    });

    results[tenant.name] = result;
  }

  return NextResponse.json({
    success: true,
    job: "gifting-suggestions",
    timestamp: new Date().toISOString(),
    results,
  });
}
