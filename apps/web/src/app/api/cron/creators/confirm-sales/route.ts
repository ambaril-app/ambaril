import { NextResponse } from "next/server";
import { db, globalSchema } from "@ambaril/db";
import {
  creators,
  salesAttributions,
  pointsLedger,
} from "@ambaril/db/schema";
import { withTenantContext } from "@/lib/tenant";
import { eq, and, lte, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Daily: Confirm pending sales attributions past the 7-day exchange window
// and award points to creators for each confirmed sale.
// ---------------------------------------------------------------------------

const POINTS_PER_CONFIRMED_SALE = 10;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenants = await db
    .select({ id: globalSchema.tenants.id, name: globalSchema.tenants.name })
    .from(globalSchema.tenants)
    .where(eq(globalSchema.tenants.isActive, true));

  const results: Record<string, { confirmed: number }> = {};

  for (const tenant of tenants) {
    const result = await withTenantContext(tenant.id, async (tx) => {
      const now = new Date();

      // Find all pending attributions past exchange window
      const pendingAttributions = await tx
        .select()
        .from(salesAttributions)
        .where(
          and(
            eq(salesAttributions.tenantId, tenant.id),
            eq(salesAttributions.status, "pending"),
            lte(salesAttributions.exchangeWindowEndsAt, now),
          ),
        );

      let confirmed = 0;

      for (const attr of pendingAttributions) {
        // Update attribution status to confirmed
        await tx
          .update(salesAttributions)
          .set({
            status: "confirmed",
            confirmedAt: now,
            updatedAt: now,
          })
          .where(eq(salesAttributions.id, attr.id));

        // Award points via pointsLedger
        await tx.insert(pointsLedger).values({
          tenantId: tenant.id,
          creatorId: attr.creatorId,
          points: POINTS_PER_CONFIRMED_SALE,
          actionType: "sale",
          referenceType: "sales_attribution",
          referenceId: attr.id,
          description: "Pontos por venda confirmada",
        });

        // Update creator totalPoints
        await tx
          .update(creators)
          .set({
            totalPoints: sql`${creators.totalPoints} + ${POINTS_PER_CONFIRMED_SALE}`,
            updatedAt: now,
          })
          .where(eq(creators.id, attr.creatorId));

        confirmed++;
      }

      return { confirmed };
    });

    results[tenant.name] = result;
  }

  return NextResponse.json({
    success: true,
    job: "confirm-sales",
    timestamp: new Date().toISOString(),
    results,
  });
}
