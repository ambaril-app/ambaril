import { NextResponse } from "next/server";
import { db, globalSchema } from "@ambaril/db";
import { referrals } from "@ambaril/db/schema";
import { withTenantContext } from "@/lib/tenant";
import { eq, and, lte, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Daily: Expire pending referrals older than 30 days.
// The referrals table has no expiresAt column, so we expire based on
// createdAt + 30 days.
// ---------------------------------------------------------------------------

const REFERRAL_EXPIRY_DAYS = 30;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenants = await db
    .select({ id: globalSchema.tenants.id, name: globalSchema.tenants.name })
    .from(globalSchema.tenants)
    .where(eq(globalSchema.tenants.isActive, true));

  const results: Record<string, { expired: number }> = {};

  for (const tenant of tenants) {
    const result = await withTenantContext(tenant.id, async (tx) => {
      const expiryThreshold = new Date();
      expiryThreshold.setDate(expiryThreshold.getDate() - REFERRAL_EXPIRY_DAYS);

      // Find all pending referrals older than 30 days
      const pendingReferrals = await tx
        .select({ id: referrals.id })
        .from(referrals)
        .where(
          and(
            eq(referrals.tenantId, tenant.id),
            eq(referrals.status, "pending"),
            lte(referrals.createdAt, expiryThreshold),
          ),
        );

      let expired = 0;

      for (const ref of pendingReferrals) {
        await tx
          .update(referrals)
          .set({ status: "expired" })
          .where(eq(referrals.id, ref.id));

        expired++;
      }

      return { expired };
    });

    results[tenant.name] = result;
  }

  return NextResponse.json({
    success: true,
    job: "referral-expiry",
    timestamp: new Date().toISOString(),
    results,
  });
}
