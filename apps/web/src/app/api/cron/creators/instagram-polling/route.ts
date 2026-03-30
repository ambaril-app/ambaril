import { NextResponse } from "next/server";
import { db, globalSchema } from "@ambaril/db";
import {
  creators,
  socialAccounts,
  contentDetections,
  pointsLedger,
} from "@ambaril/db/schema";
import { withTenantContext } from "@/lib/tenant";
import { eq, and, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Every 15 minutes: Poll Instagram for new posts by active creators.
// STUB — logs what would happen; real Instagram Graph API integration later.
// ---------------------------------------------------------------------------

const POINTS_PER_POST_DETECTED = 5;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenants = await db
    .select({ id: globalSchema.tenants.id, name: globalSchema.tenants.name })
    .from(globalSchema.tenants)
    .where(eq(globalSchema.tenants.isActive, true));

  const results: Record<string, { polled: number; detected: number }> = {};

  for (const tenant of tenants) {
    const result = await withTenantContext(tenant.id, async (tx) => {
      // Get active creators with Instagram social accounts
      const instagramAccounts = await tx
        .select({
          creatorId: creators.id,
          creatorName: creators.name,
          handle: socialAccounts.handle,
          socialAccountId: socialAccounts.id,
        })
        .from(creators)
        .innerJoin(
          socialAccounts,
          and(
            eq(socialAccounts.creatorId, creators.id),
            eq(socialAccounts.tenantId, tenant.id),
            eq(socialAccounts.platform, "instagram"),
          ),
        )
        .where(
          and(
            eq(creators.tenantId, tenant.id),
            eq(creators.status, "active"),
          ),
        );

      let polled = 0;
      let detected = 0;

      for (const account of instagramAccounts) {
        // STUB: In production, this would call the Instagram Graph API
        // to fetch recent media for this user.
        console.log(
          `[instagram-polling] Would poll @${account.handle} (creator: ${account.creatorName}, tenant: ${tenant.name})`,
        );
        polled++;

        // STUB: Simulate that no new posts were found.
        // When the real API is wired, we would:
        // 1. Fetch recent posts from Instagram Graph API
        // 2. Check each post's platformPostId against contentDetections
        // 3. Insert new detections and award points
        //
        // Example of what the real insert would look like:
        // const newPost = { platformPostId: "stub_123", postUrl: "https://...", postType: "reel" };
        // const [existing] = await tx
        //   .select({ id: contentDetections.id })
        //   .from(contentDetections)
        //   .where(
        //     and(
        //       eq(contentDetections.tenantId, tenant.id),
        //       eq(contentDetections.platform, "instagram"),
        //       eq(contentDetections.platformPostId, newPost.platformPostId),
        //     ),
        //   )
        //   .limit(1);
        //
        // if (!existing) {
        //   await tx.insert(contentDetections).values({
        //     tenantId: tenant.id,
        //     creatorId: account.creatorId,
        //     platform: "instagram",
        //     platformPostId: newPost.platformPostId,
        //     postUrl: newPost.postUrl,
        //     postType: newPost.postType as "reel",
        //     caption: null,
        //   });
        //
        //   await tx.insert(pointsLedger).values({
        //     tenantId: tenant.id,
        //     creatorId: account.creatorId,
        //     points: POINTS_PER_POST_DETECTED,
        //     actionType: "post_detected",
        //     referenceType: "content_detection",
        //     referenceId: null,
        //     description: `Post detectado: @${account.handle}`,
        //   });
        //
        //   await tx
        //     .update(creators)
        //     .set({
        //       totalPoints: sql`${creators.totalPoints} + ${POINTS_PER_POST_DETECTED}`,
        //       updatedAt: new Date(),
        //     })
        //     .where(eq(creators.id, account.creatorId));
        //
        //   detected++;
        // }
      }

      return { polled, detected };
    });

    results[tenant.name] = result;
  }

  return NextResponse.json({
    success: true,
    job: "instagram-polling",
    timestamp: new Date().toISOString(),
    results,
  });
}
