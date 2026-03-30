"use server";

import { db } from "@ambaril/db";
import {
  eq,
  and,
  desc,
} from "drizzle-orm";
import {
  creators,
  creatorTiers,
} from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

interface RankedCreator {
  id: string;
  name: string;
  totalSalesAmount: string;
  totalSalesCount: number;
  totalPoints: number;
  tierName: string | null;
  status: string;
}

interface CreatorOfMonth {
  id: string;
  name: string;
  currentMonthSalesAmount: string;
  currentMonthSalesCount: number;
  totalPoints: number;
  tierName: string | null;
}

// ---------------------------------------------------------------------------
// getRanking — Top creators by totalSalesAmount (lifetime)
// ---------------------------------------------------------------------------

export async function getRanking(
  limit: number = 20,
): Promise<ActionResult<RankedCreator[]>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:ranking:read")
  )
    return { error: "Acesso negado" };

  const safeLimit = Math.min(Math.max(limit, 1), 100);

  return withTenantContext(session.tenantId, async (tx) => {
    const rows = await tx
      .select({
        id: creators.id,
        name: creators.name,
        totalSalesAmount: creators.totalSalesAmount,
        totalSalesCount: creators.totalSalesCount,
        totalPoints: creators.totalPoints,
        tierName: creatorTiers.name,
        status: creators.status,
      })
      .from(creators)
      .leftJoin(creatorTiers, eq(creators.tierId, creatorTiers.id))
      .where(
        and(
          eq(creators.tenantId, session.tenantId),
          eq(creators.status, "active"),
        ),
      )
      .orderBy(desc(creators.totalSalesAmount))
      .limit(safeLimit);

    const result: RankedCreator[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      totalSalesAmount: row.totalSalesAmount,
      totalSalesCount: row.totalSalesCount,
      totalPoints: row.totalPoints,
      tierName: row.tierName,
      status: row.status,
    }));

    return { data: result };
  });
}

// ---------------------------------------------------------------------------
// getCreatorOfMonth — Creator with highest currentMonthSalesAmount
// ---------------------------------------------------------------------------

export async function getCreatorOfMonth(): Promise<
  ActionResult<CreatorOfMonth | null>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:ranking:read")
  )
    return { error: "Acesso negado" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [row] = await tx
      .select({
        id: creators.id,
        name: creators.name,
        currentMonthSalesAmount: creators.currentMonthSalesAmount,
        currentMonthSalesCount: creators.currentMonthSalesCount,
        totalPoints: creators.totalPoints,
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
      .limit(1);

    if (!row) return { data: null };

    // Only return if they actually have sales this month
    if (parseFloat(row.currentMonthSalesAmount) === 0) {
      return { data: null };
    }

    return {
      data: {
        id: row.id,
        name: row.name,
        currentMonthSalesAmount: row.currentMonthSalesAmount,
        currentMonthSalesCount: row.currentMonthSalesCount,
        totalPoints: row.totalPoints,
        tierName: row.tierName,
      },
    };
  });
}
