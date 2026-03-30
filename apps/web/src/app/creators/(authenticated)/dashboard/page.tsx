import { requireCreatorSession } from "@/lib/creator-auth";
import { db } from "@ambaril/db";
import { eq, and, desc } from "drizzle-orm";
import {
  creators,
  creatorTiers,
  coupons,
  salesAttributions,
  challenges,
} from "@ambaril/db/schema";
import { TierProgress } from "./components/tier-progress";
import { KpiCards } from "./components/kpi-cards";
import { RecentSales } from "./components/recent-sales";
import { ActiveChallenges } from "./components/active-challenges";

// Fetch creator data for portal dashboard
async function getCreatorForPortal(creatorId: string) {
  const [creator] = await db
    .select({
      id: creators.id,
      name: creators.name,
      tierId: creators.tierId,
      tierName: creatorTiers.name,
      tierSlug: creatorTiers.slug,
      commissionRate: creators.commissionRate,
      totalSalesAmount: creators.totalSalesAmount,
      totalSalesCount: creators.totalSalesCount,
      totalPoints: creators.totalPoints,
      currentMonthSalesAmount: creators.currentMonthSalesAmount,
      currentMonthSalesCount: creators.currentMonthSalesCount,
      couponCode: coupons.code,
      tenantId: creators.tenantId,
    })
    .from(creators)
    .leftJoin(creatorTiers, eq(creators.tierId, creatorTiers.id))
    .leftJoin(coupons, eq(creators.couponId, coupons.id))
    .where(eq(creators.id, creatorId))
    .limit(1);

  return creator ?? null;
}

async function getRecentSales(creatorId: string, tenantId: string) {
  const rows = await db
    .select({
      id: salesAttributions.id,
      orderTotal: salesAttributions.orderTotal,
      commissionAmount: salesAttributions.commissionAmount,
      status: salesAttributions.status,
      createdAt: salesAttributions.createdAt,
    })
    .from(salesAttributions)
    .where(
      and(
        eq(salesAttributions.creatorId, creatorId),
        eq(salesAttributions.tenantId, tenantId),
      ),
    )
    .orderBy(desc(salesAttributions.createdAt))
    .limit(5);

  return rows;
}

async function getActiveChallenges(tenantId: string) {
  const now = new Date();
  const rows = await db
    .select({
      id: challenges.id,
      name: challenges.name,
      description: challenges.description,
      pointsReward: challenges.pointsReward,
      endsAt: challenges.endsAt,
      category: challenges.category,
    })
    .from(challenges)
    .where(
      and(
        eq(challenges.tenantId, tenantId),
        eq(challenges.status, "active"),
      ),
    )
    .orderBy(desc(challenges.endsAt))
    .limit(4);

  return rows;
}

async function getNextTier(tenantId: string, currentSortOrder: number | null) {
  if (currentSortOrder === null) {
    // No current tier — get the first tier
    const [firstTier] = await db
      .select({
        name: creatorTiers.name,
        sortOrder: creatorTiers.sortOrder,
      })
      .from(creatorTiers)
      .where(eq(creatorTiers.tenantId, tenantId))
      .orderBy(creatorTiers.sortOrder)
      .limit(1);

    return firstTier ?? null;
  }

  // Get the next tier by sort order
  const allTiers = await db
    .select({
      name: creatorTiers.name,
      sortOrder: creatorTiers.sortOrder,
    })
    .from(creatorTiers)
    .where(eq(creatorTiers.tenantId, tenantId))
    .orderBy(creatorTiers.sortOrder);

  const currentIdx = allTiers.findIndex((t) => t.sortOrder === currentSortOrder);
  if (currentIdx === -1 || currentIdx >= allTiers.length - 1) {
    return null; // Already at max tier
  }

  return allTiers[currentIdx + 1] ?? null;
}

export default async function CreatorDashboardPage() {
  const session = await requireCreatorSession();
  const creatorId = session.creatorId;

  const creator = await getCreatorForPortal(creatorId);

  if (!creator) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-text-secondary">Creator nao encontrado.</p>
      </div>
    );
  }

  // Fetch all data in parallel
  const [recentSales, activeChallenges, currentTierData] = await Promise.all([
    getRecentSales(creator.id, creator.tenantId),
    getActiveChallenges(creator.tenantId),
    creator.tierId
      ? db
          .select({ sortOrder: creatorTiers.sortOrder })
          .from(creatorTiers)
          .where(eq(creatorTiers.id, creator.tierId))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const currentSortOrder = currentTierData[0]?.sortOrder ?? null;
  const nextTier = await getNextTier(creator.tenantId, currentSortOrder);

  // Calculate monthly earnings from commissions
  // For simplicity, sum commissions from current month sales
  const monthlyEarnings = recentSales.reduce((acc, sale) => {
    return acc + parseFloat(sale.commissionAmount);
  }, 0);

  // Tier point thresholds — placeholder mapping based on sort order
  // In production these would come from tier configuration
  const nextTierThreshold = nextTier ? (nextTier.sortOrder + 1) * 500 : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page title */}
      <h1 className="text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
        Painel
      </h1>

      {/* Tier progress */}
      <TierProgress
        tierName={creator.tierName}
        tierSlug={creator.tierSlug}
        totalPoints={creator.totalPoints}
        nextTierThreshold={nextTierThreshold}
        nextTierName={nextTier?.name ?? null}
      />

      {/* KPI cards */}
      <KpiCards
        monthlyEarnings={monthlyEarnings}
        monthlySalesCount={creator.currentMonthSalesCount}
        totalPoints={creator.totalPoints}
      />

      {/* Recent sales */}
      <RecentSales sales={recentSales} />

      {/* Active challenges */}
      <ActiveChallenges challenges={activeChallenges} />
    </div>
  );
}
