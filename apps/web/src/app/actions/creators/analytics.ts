"use server";

import { db } from "@ambaril/db";
import {
  eq,
  and,
  desc,
  sql,
  count,
  sum,
} from "drizzle-orm";
import {
  creators,
  creatorTiers,
  salesAttributions,
  payouts,
} from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

export interface OverviewKPIs {
  totalGMV: string;
  totalCommissions: string;
  activeCreators: number;
  avgCAC: string;
}

export interface TopPerformer {
  id: string;
  name: string;
  currentMonthSalesAmount: string;
  currentMonthSalesCount: number;
  tierName: string | null;
}

export interface TierDistributionEntry {
  tierName: string;
  count: number;
}

export interface MonthlyEvolutionEntry {
  month: string; // "YYYY-MM"
  label: string; // "Jan", "Fev", etc.
  gmv: string;
}

// ---------------------------------------------------------------------------
// getOverviewKPIs — High-level KPIs for the Creators module
// ---------------------------------------------------------------------------

export async function getOverviewKPIs(): Promise<ActionResult<OverviewKPIs>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:analytics:read")
  )
    return { error: "Acesso negado" };

  return withTenantContext(session.tenantId, async (tx) => {
    // Total GMV from confirmed sales attributions
    const [gmvResult] = await tx
      .select({
        total: sum(salesAttributions.netRevenue).as("total"),
      })
      .from(salesAttributions)
      .where(
        and(
          eq(salesAttributions.tenantId, session.tenantId),
          eq(salesAttributions.status, "confirmed"),
        ),
      );

    // Total commissions from paid payouts
    const [commissionsResult] = await tx
      .select({
        total: sum(payouts.grossAmount).as("total"),
      })
      .from(payouts)
      .where(
        and(
          eq(payouts.tenantId, session.tenantId),
          eq(payouts.status, "paid"),
        ),
      );

    // Active creators count
    const [creatorsResult] = await tx
      .select({ total: count() })
      .from(creators)
      .where(
        and(
          eq(creators.tenantId, session.tenantId),
          eq(creators.status, "active"),
        ),
      );

    return {
      data: {
        totalGMV: gmvResult?.total ?? "0.00",
        totalCommissions: commissionsResult?.total ?? "0.00",
        activeCreators: creatorsResult?.total ?? 0,
        avgCAC: "0.00", // Placeholder — requires marketing spend data
      },
    };
  });
}

// ---------------------------------------------------------------------------
// getTopPerformers — Top N creators by sales this month
// ---------------------------------------------------------------------------

export async function getTopPerformers(
  limit: number = 10,
): Promise<ActionResult<TopPerformer[]>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:analytics:read")
  )
    return { error: "Acesso negado" };

  const safeLimit = Math.min(Math.max(limit, 1), 50);

  return withTenantContext(session.tenantId, async (tx) => {
    const rows = await tx
      .select({
        id: creators.id,
        name: creators.name,
        currentMonthSalesAmount: creators.currentMonthSalesAmount,
        currentMonthSalesCount: creators.currentMonthSalesCount,
        tierName: creatorTiers.name,
      })
      .from(creators)
      .leftJoin(creatorTiers, eq(creators.tierId, creatorTiers.id))
      .where(
        and(
          eq(creators.tenantId, session.tenantId),
          eq(creators.status, "active"),
        ),
      )
      .orderBy(desc(creators.currentMonthSalesAmount))
      .limit(safeLimit);

    const result: TopPerformer[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      currentMonthSalesAmount: row.currentMonthSalesAmount,
      currentMonthSalesCount: row.currentMonthSalesCount,
      tierName: row.tierName,
    }));

    return { data: result };
  });
}

// ---------------------------------------------------------------------------
// getProductMix — Placeholder (needs ERP module)
// ---------------------------------------------------------------------------

export async function getProductMix(): Promise<
  ActionResult<Record<string, unknown>[]>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:analytics:read")
  )
    return { error: "Acesso negado" };

  // Placeholder — requires ERP module integration for product data
  return { data: [] };
}

// ---------------------------------------------------------------------------
// getTierDistribution — Count of creators per tier
// ---------------------------------------------------------------------------

export async function getTierDistribution(): Promise<
  ActionResult<TierDistributionEntry[]>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:analytics:read")
  )
    return { error: "Acesso negado" };

  return withTenantContext(session.tenantId, async (tx) => {
    const rows = await tx
      .select({
        tierName: creatorTiers.name,
        count: count().as("count"),
      })
      .from(creators)
      .leftJoin(creatorTiers, eq(creators.tierId, creatorTiers.id))
      .where(eq(creators.tenantId, session.tenantId))
      .groupBy(creatorTiers.name);

    const result: TierDistributionEntry[] = rows.map((row) => ({
      tierName: row.tierName ?? "Sem tier",
      count: row.count,
    }));

    return { data: result };
  });
}

// ---------------------------------------------------------------------------
// getMonthlyEvolution — GMV per month for the last 6 months
// ---------------------------------------------------------------------------

const MONTH_LABELS_PT: Record<number, string> = {
  1: "Jan",
  2: "Fev",
  3: "Mar",
  4: "Abr",
  5: "Mai",
  6: "Jun",
  7: "Jul",
  8: "Ago",
  9: "Set",
  10: "Out",
  11: "Nov",
  12: "Dez",
};

export async function getMonthlyEvolution(): Promise<
  ActionResult<MonthlyEvolutionEntry[]>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:analytics:read")
  )
    return { error: "Acesso negado" };

  return withTenantContext(session.tenantId, async (tx) => {
    // Aggregate confirmed sales by month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const rows = await tx
      .select({
        month: sql<string>`to_char(${salesAttributions.createdAt}, 'YYYY-MM')`.as(
          "month",
        ),
        monthNum: sql<number>`EXTRACT(MONTH FROM ${salesAttributions.createdAt})::int`.as(
          "month_num",
        ),
        gmv: sum(salesAttributions.netRevenue).as("gmv"),
      })
      .from(salesAttributions)
      .where(
        and(
          eq(salesAttributions.tenantId, session.tenantId),
          eq(salesAttributions.status, "confirmed"),
          sql`${salesAttributions.createdAt} >= ${sixMonthsAgo.toISOString()}`,
        ),
      )
      .groupBy(
        sql`to_char(${salesAttributions.createdAt}, 'YYYY-MM')`,
        sql`EXTRACT(MONTH FROM ${salesAttributions.createdAt})::int`,
      )
      .orderBy(sql`to_char(${salesAttributions.createdAt}, 'YYYY-MM')`);

    const result: MonthlyEvolutionEntry[] = rows.map((row) => ({
      month: row.month,
      label: MONTH_LABELS_PT[row.monthNum] ?? row.month,
      gmv: row.gmv ?? "0.00",
    }));

    return { data: result };
  });
}
