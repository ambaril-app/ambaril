import { NextResponse } from "next/server";
import { db, globalSchema } from "@ambaril/db";
import { creators } from "@ambaril/db/schema";
import { withTenantContext } from "@/lib/tenant";
import { eq, and, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Monthly (1st): Reset monthly sales cap tracking for all creators.
// Sets currentMonthSalesAmount to 0 and currentMonthSalesCount to 0.
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenants = await db
    .select({ id: globalSchema.tenants.id, name: globalSchema.tenants.name })
    .from(globalSchema.tenants)
    .where(eq(globalSchema.tenants.isActive, true));

  const results: Record<string, { reset: number }> = {};

  for (const tenant of tenants) {
    const result = await withTenantContext(tenant.id, async (tx) => {
      const now = new Date();

      // Reset all creators' monthly counters for this tenant
      const updated = await tx
        .update(creators)
        .set({
          currentMonthSalesAmount: "0",
          currentMonthSalesCount: 0,
          updatedAt: now,
        })
        .where(
          and(
            eq(creators.tenantId, tenant.id),
            eq(creators.status, "active"),
          ),
        )
        .returning({ id: creators.id });

      return { reset: updated.length };
    });

    results[tenant.name] = result;
  }

  return NextResponse.json({
    success: true,
    job: "monthly-cap-reset",
    timestamp: new Date().toISOString(),
    results,
  });
}
