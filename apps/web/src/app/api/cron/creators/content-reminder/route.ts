import { NextResponse } from "next/server";
import { db, globalSchema } from "@ambaril/db";
import {
  creators,
  campaigns,
  campaignCreators,
  campaignBriefs,
} from "@ambaril/db/schema";
import { withTenantContext } from "@/lib/tenant";
import { eq, and, lte, inArray } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Daily (10am BRT = 13:00 UTC): Remind creators who haven't submitted
// content for active campaigns approaching their deadline (within 3 days).
// STUB — logs what would happen; real notifications come with WhatsApp/email.
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

  const results: Record<string, { reminders: number }> = {};

  for (const tenant of tenants) {
    const result = await withTenantContext(tenant.id, async (tx) => {
      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Find active campaigns with briefs that have a deadline within 3 days
      const urgentBriefs = await tx
        .select({
          campaignId: campaigns.id,
          campaignName: campaigns.name,
          briefTitle: campaignBriefs.title,
          deadline: campaignBriefs.deadline,
        })
        .from(campaigns)
        .innerJoin(
          campaignBriefs,
          and(
            eq(campaignBriefs.campaignId, campaigns.id),
            eq(campaignBriefs.tenantId, tenant.id),
          ),
        )
        .where(
          and(
            eq(campaigns.tenantId, tenant.id),
            eq(campaigns.status, "active"),
            lte(campaignBriefs.deadline, threeDaysFromNow),
          ),
        );

      if (urgentBriefs.length === 0) {
        return { reminders: 0 };
      }

      const urgentCampaignIds = urgentBriefs.map((b) => b.campaignId);

      // Find creators assigned to these campaigns who haven't submitted content yet.
      // deliveryStatus "pending" means product not shipped / no action yet.
      // "shipped" means product sent but content not yet posted.
      // We remind for both "pending" and "shipped" — only "delivered" and
      // "content_posted" indicate the creator has fulfilled their obligation.
      const pendingAssignments = await tx
        .select({
          creatorId: campaignCreators.creatorId,
          campaignId: campaignCreators.campaignId,
          deliveryStatus: campaignCreators.deliveryStatus,
        })
        .from(campaignCreators)
        .where(
          and(
            eq(campaignCreators.tenantId, tenant.id),
            inArray(campaignCreators.campaignId, urgentCampaignIds),
            inArray(campaignCreators.deliveryStatus, ["pending", "shipped"]),
          ),
        );

      let reminders = 0;

      for (const assignment of pendingAssignments) {
        // Fetch creator name for logging
        const [creator] = await tx
          .select({ name: creators.name })
          .from(creators)
          .where(
            and(
              eq(creators.id, assignment.creatorId),
              eq(creators.tenantId, tenant.id),
            ),
          )
          .limit(1);

        if (!creator) continue;

        const brief = urgentBriefs.find(
          (b) => b.campaignId === assignment.campaignId,
        );

        if (!brief) continue;

        // STUB: In production, this would send a WhatsApp template message
        // or email reminder to the creator.
        console.log(
          `[content-reminder] Would send content reminder to ${creator.name} for campaign "${brief.campaignName}" (deadline: ${brief.deadline?.toISOString() ?? "N/A"}, status: ${assignment.deliveryStatus}, tenant: ${tenant.name})`,
        );
        reminders++;
      }

      return { reminders };
    });

    results[tenant.name] = result;
  }

  return NextResponse.json({
    success: true,
    job: "content-reminder",
    timestamp: new Date().toISOString(),
    results,
  });
}
