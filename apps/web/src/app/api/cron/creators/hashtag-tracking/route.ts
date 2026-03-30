import { NextResponse } from "next/server";
import { db, globalSchema } from "@ambaril/db";
import {
  creators,
  socialAccounts,
  campaigns,
  campaignBriefs,
  contentDetections,
  pointsLedger,
} from "@ambaril/db/schema";
import { withTenantContext } from "@/lib/tenant";
import { eq, and, sql, isNotNull } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Daily: Search for posts containing campaign hashtags.
// STUB — logs what would happen; real search comes with Instagram Graph API.
// ---------------------------------------------------------------------------

const POINTS_PER_HASHTAG_DETECTED = 3;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenants = await db
    .select({ id: globalSchema.tenants.id, name: globalSchema.tenants.name })
    .from(globalSchema.tenants)
    .where(eq(globalSchema.tenants.isActive, true));

  const results: Record<
    string,
    { campaignsScanned: number; hashtagsSearched: number; detected: number }
  > = {};

  for (const tenant of tenants) {
    const result = await withTenantContext(tenant.id, async (tx) => {
      // Get active campaigns with briefs that have hashtags defined
      const activeBriefs = await tx
        .select({
          campaignId: campaigns.id,
          campaignName: campaigns.name,
          hashtags: campaignBriefs.hashtags,
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
            isNotNull(campaignBriefs.hashtags),
          ),
        );

      let campaignsScanned = 0;
      let hashtagsSearched = 0;
      let detected = 0;

      // Collect all unique hashtags across active campaigns
      const campaignHashtags = new Map<string, { campaignId: string; campaignName: string }>();

      for (const brief of activeBriefs) {
        campaignsScanned++;
        const tags = brief.hashtags;
        if (!tags || !Array.isArray(tags)) continue;

        for (const tag of tags) {
          if (typeof tag === "string" && tag.trim().length > 0) {
            const normalized = tag.trim().replace(/^#/, "").toLowerCase();
            if (!campaignHashtags.has(normalized)) {
              campaignHashtags.set(normalized, {
                campaignId: brief.campaignId,
                campaignName: brief.campaignName,
              });
            }
          }
        }
      }

      // Get all active creators with Instagram handles for matching
      const creatorHandles = await tx
        .select({
          creatorId: creators.id,
          creatorName: creators.name,
          handle: socialAccounts.handle,
          platform: socialAccounts.platform,
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

      for (const [hashtag, campaign] of campaignHashtags) {
        // STUB: In production, this would search the Instagram Hashtag API
        // or TikTok Search API for recent posts containing #hashtag.
        console.log(
          `[hashtag-tracking] Would search #${hashtag} for campaign "${campaign.campaignName}" (tenant: ${tenant.name})`,
        );
        hashtagsSearched++;

        // STUB: Simulate that no matching posts were found.
        // When the real API is wired, we would:
        // 1. Search for recent posts with this hashtag
        // 2. Match post author handles against creatorHandles
        // 3. Insert into contentDetections if not already detected
        //
        // Example of what the real flow would look like:
        // for (const post of searchResults) {
        //   const matchingCreator = creatorHandles.find(
        //     (c) => c.handle.toLowerCase() === post.authorHandle.toLowerCase(),
        //   );
        //   if (!matchingCreator) continue;
        //
        //   const [existing] = await tx
        //     .select({ id: contentDetections.id })
        //     .from(contentDetections)
        //     .where(
        //       and(
        //         eq(contentDetections.tenantId, tenant.id),
        //         eq(contentDetections.platform, matchingCreator.platform),
        //         eq(contentDetections.platformPostId, post.id),
        //       ),
        //     )
        //     .limit(1);
        //
        //   if (!existing) {
        //     await tx.insert(contentDetections).values({
        //       tenantId: tenant.id,
        //       creatorId: matchingCreator.creatorId,
        //       platform: matchingCreator.platform,
        //       platformPostId: post.id,
        //       postUrl: post.url,
        //       postType: post.type as "image",
        //       caption: post.caption ?? null,
        //       hashtagMatched: hashtag,
        //     });
        //
        //     await tx.insert(pointsLedger).values({
        //       tenantId: tenant.id,
        //       creatorId: matchingCreator.creatorId,
        //       points: POINTS_PER_HASHTAG_DETECTED,
        //       actionType: "hashtag_detected",
        //       referenceType: "content_detection",
        //       referenceId: null,
        //       description: `Hashtag #${hashtag} detectada em post de @${matchingCreator.handle}`,
        //     });
        //
        //     await tx
        //       .update(creators)
        //       .set({
        //         totalPoints: sql`${creators.totalPoints} + ${POINTS_PER_HASHTAG_DETECTED}`,
        //         updatedAt: new Date(),
        //       })
        //       .where(eq(creators.id, matchingCreator.creatorId));
        //
        //     detected++;
        //   }
        // }
      }

      return { campaignsScanned, hashtagsSearched, detected };
    });

    results[tenant.name] = result;
  }

  return NextResponse.json({
    success: true,
    job: "hashtag-tracking",
    timestamp: new Date().toISOString(),
    results,
  });
}
