import { NextResponse } from "next/server";
import { db, globalSchema } from "@ambaril/db";
import {
  creators,
  socialAccounts,
} from "@ambaril/db/schema";
import { withTenantContext } from "@/lib/tenant";
import { eq, and } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Daily: Sync follower counts and engagement rates from social platforms.
// STUB — logs what would happen; real API integration comes later.
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

  const results: Record<string, { accountsSynced: number }> = {};

  for (const tenant of tenants) {
    const result = await withTenantContext(tenant.id, async (tx) => {
      // Get all active creators with their social accounts
      const accounts = await tx
        .select({
          creatorId: creators.id,
          creatorName: creators.name,
          socialAccountId: socialAccounts.id,
          platform: socialAccounts.platform,
          handle: socialAccounts.handle,
          currentFollowers: socialAccounts.followers,
        })
        .from(creators)
        .innerJoin(
          socialAccounts,
          and(
            eq(socialAccounts.creatorId, creators.id),
            eq(socialAccounts.tenantId, tenant.id),
          ),
        )
        .where(
          and(
            eq(creators.tenantId, tenant.id),
            eq(creators.status, "active"),
          ),
        );

      let accountsSynced = 0;

      for (const account of accounts) {
        // STUB: In production, this would call the appropriate platform API:
        // - Instagram: Graph API /me?fields=followers_count,media_count
        // - TikTok: User Info endpoint
        // - YouTube: Channels API
        console.log(
          `[social-sync] Would sync ${account.platform} @${account.handle} for creator ${account.creatorName} (tenant: ${tenant.name})`,
        );
        accountsSynced++;

        // When the real API is wired, we would:
        // const apiData = await fetchPlatformData(account.platform, account.handle);
        // await tx
        //   .update(socialAccounts)
        //   .set({
        //     followers: apiData.followers,
        //     updatedAt: new Date(),
        //   })
        //   .where(eq(socialAccounts.id, account.socialAccountId));
      }

      return { accountsSynced };
    });

    results[tenant.name] = result;
  }

  return NextResponse.json({
    success: true,
    job: "social-sync",
    timestamp: new Date().toISOString(),
    results,
  });
}
