"use server";

import { db } from "@ambaril/db";
import {
  eq,
  and,
  count,
  max,
  sql,
} from "drizzle-orm";
import {
  creators,
  challengeSubmissions,
  socialAccounts,
} from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import { uuidSchema } from "@ambaril/shared/validators";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

interface ScoreBreakdown {
  conversion: number;
  contentQuality: number;
  engagement: number;
  brandAlignment: number;
  followers: number;
}

interface CompositeScore {
  total: number;
  breakdown: ScoreBreakdown;
}

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

const WEIGHTS = {
  conversion: 0.35,
  contentQuality: 0.25,
  engagement: 0.2,
  brandAlignment: 0.15,
  followers: 0.05,
} as const;

// ---------------------------------------------------------------------------
// calculateCompositeScore — Weighted composite score for a creator
// ---------------------------------------------------------------------------

export async function calculateCompositeScore(
  creatorId: string,
): Promise<ActionResult<CompositeScore>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:analytics:read")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(creatorId);
  if (!idParsed.success) return { error: "ID do creator invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    // Get creator data
    const [creator] = await tx
      .select()
      .from(creators)
      .where(
        and(
          eq(creators.id, idParsed.data),
          eq(creators.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!creator) return { error: "Creator nao encontrado" };

    // --- Conversion score ---
    // (totalSalesCount / months_active) normalized to 0-100
    const joinedAt = creator.joinedAt ?? creator.createdAt;
    const monthsActive = Math.max(
      1,
      Math.ceil(
        (Date.now() - new Date(joinedAt).getTime()) / (30 * 24 * 60 * 60 * 1000),
      ),
    );
    const salesPerMonth = creator.totalSalesCount / monthsActive;
    // Normalize: assume 10 sales/month = 100 score
    const conversionRaw = Math.min((salesPerMonth / 10) * 100, 100);

    // --- Content quality score ---
    // (approved submissions / total submissions) * 100
    const [totalSubs] = await tx
      .select({ total: count() })
      .from(challengeSubmissions)
      .where(
        and(
          eq(challengeSubmissions.creatorId, idParsed.data),
          eq(challengeSubmissions.tenantId, session.tenantId),
        ),
      );

    const [approvedSubs] = await tx
      .select({ total: count() })
      .from(challengeSubmissions)
      .where(
        and(
          eq(challengeSubmissions.creatorId, idParsed.data),
          eq(challengeSubmissions.tenantId, session.tenantId),
          eq(challengeSubmissions.status, "approved"),
        ),
      );

    const totalSubsCount = totalSubs?.total ?? 0;
    const approvedSubsCount = approvedSubs?.total ?? 0;
    const contentQualityRaw =
      totalSubsCount > 0 ? (approvedSubsCount / totalSubsCount) * 100 : 50; // Default 50 if no submissions

    // --- Engagement score ---
    // (totalPoints / max(totalPoints across creators)) * 100
    const [maxPointsResult] = await tx
      .select({
        maxPoints: max(creators.totalPoints).as("max_points"),
      })
      .from(creators)
      .where(eq(creators.tenantId, session.tenantId));

    const maxPoints = maxPointsResult?.maxPoints ?? 0;
    const engagementRaw =
      maxPoints > 0 ? (creator.totalPoints / maxPoints) * 100 : 0;

    // --- Brand alignment score ---
    // Placeholder value
    const brandAlignmentRaw = 50;

    // --- Followers score ---
    // min(totalFollowers / 100000, 1) * 100
    const socialAccountRows = await tx
      .select({ followers: socialAccounts.followers })
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.creatorId, idParsed.data),
          eq(socialAccounts.tenantId, session.tenantId),
        ),
      );

    const totalFollowers = socialAccountRows.reduce(
      (sum, row) => sum + (row.followers ?? 0),
      0,
    );
    const followersRaw = Math.min(totalFollowers / 100000, 1) * 100;

    // --- Calculate weighted total ---
    const breakdown: ScoreBreakdown = {
      conversion: Math.round(conversionRaw * 100) / 100,
      contentQuality: Math.round(contentQualityRaw * 100) / 100,
      engagement: Math.round(engagementRaw * 100) / 100,
      brandAlignment: Math.round(brandAlignmentRaw * 100) / 100,
      followers: Math.round(followersRaw * 100) / 100,
    };

    const total =
      breakdown.conversion * WEIGHTS.conversion +
      breakdown.contentQuality * WEIGHTS.contentQuality +
      breakdown.engagement * WEIGHTS.engagement +
      breakdown.brandAlignment * WEIGHTS.brandAlignment +
      breakdown.followers * WEIGHTS.followers;

    return {
      data: {
        total: Math.round(total * 100) / 100,
        breakdown,
      },
    };
  });
}
