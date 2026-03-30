import { NextResponse } from "next/server";
import { db, globalSchema } from "@ambaril/db";
import {
  creators,
  contentDetections,
  salesAttributions,
} from "@ambaril/db/schema";
import { withTenantContext } from "@/lib/tenant";
import { eq, and, gte, sql, count } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Weekly (Monday): Find inactive creators and generate alerts per inactivity
// tier (30-60 days: gentle reminder, 60-90 days: escalation, >90 days: flag
// for suspension).
// STUB — logs what would happen; real notifications come with WhatsApp/email.
// ---------------------------------------------------------------------------

interface InactivityResult {
  gentleReminder: number;
  escalation: number;
  flaggedForSuspension: number;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenants = await db
    .select({ id: globalSchema.tenants.id, name: globalSchema.tenants.name })
    .from(globalSchema.tenants)
    .where(eq(globalSchema.tenants.isActive, true));

  const results: Record<string, InactivityResult> = {};

  for (const tenant of tenants) {
    const result = await withTenantContext(tenant.id, async (tx) => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Get all active creators for this tenant
      const activeCreators = await tx
        .select({
          id: creators.id,
          name: creators.name,
          email: creators.email,
          phone: creators.phone,
          lastSaleAt: creators.lastSaleAt,
          createdAt: creators.createdAt,
        })
        .from(creators)
        .where(
          and(
            eq(creators.tenantId, tenant.id),
            eq(creators.status, "active"),
          ),
        );

      let gentleReminder = 0;
      let escalation = 0;
      let flaggedForSuspension = 0;

      for (const creator of activeCreators) {
        // Check for content detections in the last 30 days
        const [contentResult] = await tx
          .select({ total: count() })
          .from(contentDetections)
          .where(
            and(
              eq(contentDetections.tenantId, tenant.id),
              eq(contentDetections.creatorId, creator.id),
              gte(contentDetections.detectedAt, thirtyDaysAgo),
            ),
          );

        const hasRecentContent = (contentResult?.total ?? 0) > 0;

        // Check for sales in the last 30 days
        const [salesResult] = await tx
          .select({ total: count() })
          .from(salesAttributions)
          .where(
            and(
              eq(salesAttributions.tenantId, tenant.id),
              eq(salesAttributions.creatorId, creator.id),
              gte(salesAttributions.createdAt, thirtyDaysAgo),
            ),
          );

        const hasRecentSales = (salesResult?.total ?? 0) > 0;

        // Skip creators with recent activity
        if (hasRecentContent || hasRecentSales) continue;

        // Determine inactivity duration using last sale date or creation date
        const lastActivity = creator.lastSaleAt
          ? new Date(creator.lastSaleAt)
          : new Date(creator.createdAt);

        if (lastActivity <= ninetyDaysAgo) {
          // Inactive > 90 days: flag for potential suspension
          console.log(
            `[inactive-alerter] Would flag ${creator.name} for potential suspension (>90 days inactive, tenant: ${tenant.name})`,
          );
          flaggedForSuspension++;
        } else if (lastActivity <= sixtyDaysAgo) {
          // Inactive 60-90 days: send escalation to admin
          console.log(
            `[inactive-alerter] Would send escalation to admin for ${creator.name} (60-90 days inactive, tenant: ${tenant.name})`,
          );
          escalation++;
        } else if (lastActivity <= thirtyDaysAgo) {
          // Inactive 30-60 days: send gentle reminder
          console.log(
            `[inactive-alerter] Would send gentle reminder to ${creator.name} (30-60 days inactive, tenant: ${tenant.name})`,
          );
          gentleReminder++;
        }
      }

      return { gentleReminder, escalation, flaggedForSuspension };
    });

    results[tenant.name] = result;
  }

  return NextResponse.json({
    success: true,
    job: "inactive-alerter",
    timestamp: new Date().toISOString(),
    results,
  });
}
