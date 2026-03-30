"use server";

import { db } from "@ambaril/db";
import { eq, and } from "drizzle-orm";
import { creators, coupons, referrals, pointsLedger } from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import type { TenantSessionData } from "@ambaril/shared/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

function assertPermission(session: TenantSessionData, perm: string) {
  if (session.permissions.includes("*")) return;
  if (!session.permissions.includes(perm)) throw new Error("Acesso negado");
}

// ---------------------------------------------------------------------------
// 1. getReferralLink — Returns referral code for a creator
//    Uses the creator's coupon code, or generates a name-based one.
// ---------------------------------------------------------------------------

export async function getReferralLink(
  creatorId: string,
): Promise<ActionResult<{ referralCode: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:read");

    if (!creatorId || !/^[0-9a-f-]{36}$/i.test(creatorId)) {
      return { error: "ID invalido" };
    }

    // Fetch creator with coupon
    const creatorRow = await db
      .select({
        id: creators.id,
        name: creators.name,
        couponId: creators.couponId,
      })
      .from(creators)
      .where(
        and(
          eq(creators.id, creatorId),
          eq(creators.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    const creator = creatorRow[0];
    if (!creator) {
      return { error: "Creator nao encontrado" };
    }

    // If creator has a coupon, use the coupon code as referral code
    if (creator.couponId) {
      const couponRow = await db
        .select({ code: coupons.code })
        .from(coupons)
        .where(eq(coupons.id, creator.couponId))
        .limit(1);

      if (couponRow[0]) {
        return { data: { referralCode: couponRow[0].code } };
      }
    }

    // Fallback: generate a name-based code
    const referralCode = creator.name
      .trim()
      .split(/\s+/)[0]!
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]/g, "");

    return { data: { referralCode } };
  } catch (err) {
    if (err instanceof Error && err.message === "Acesso negado") {
      return { error: "Acesso negado" };
    }
    console.error("[getReferralLink]", err);
    return { error: "Erro ao obter link de indicacao" };
  }
}

// ---------------------------------------------------------------------------
// 2. trackReferral — Create a referral entry
//    Validates referrer exists and referred is different.
// ---------------------------------------------------------------------------

export async function trackReferral(
  referrerCode: string,
  referredCreatorId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:referrals:write");

    if (!referrerCode || referrerCode.trim().length === 0) {
      return { error: "Codigo de indicacao e obrigatorio" };
    }
    if (!referredCreatorId || !/^[0-9a-f-]{36}$/i.test(referredCreatorId)) {
      return { error: "ID do creator indicado e invalido" };
    }

    const referralId = await withTenantContext(session.tenantId, async (tx) => {
      // Find the referrer by coupon code
      const couponRow = await tx
        .select({ creatorId: coupons.creatorId, code: coupons.code })
        .from(coupons)
        .where(
          and(
            eq(coupons.tenantId, session.tenantId),
            eq(coupons.code, referrerCode.toUpperCase()),
            eq(coupons.type, "creator"),
          ),
        )
        .limit(1);

      if (!couponRow[0] || !couponRow[0].creatorId) {
        throw new Error("Codigo de indicacao invalido");
      }

      const referrerId = couponRow[0].creatorId;

      // Validate referrer is different from referred
      if (referrerId === referredCreatorId) {
        throw new Error("Creator nao pode indicar a si mesmo");
      }

      // Validate referred creator exists
      const referredExists = await tx
        .select({ id: creators.id })
        .from(creators)
        .where(
          and(
            eq(creators.id, referredCreatorId),
            eq(creators.tenantId, session.tenantId),
          ),
        )
        .limit(1);

      if (!referredExists[0]) {
        throw new Error("Creator indicado nao encontrado");
      }

      // Check for duplicate referral
      const existingReferral = await tx
        .select({ id: referrals.id })
        .from(referrals)
        .where(
          and(
            eq(referrals.tenantId, session.tenantId),
            eq(referrals.referrerId, referrerId),
            eq(referrals.referredId, referredCreatorId),
          ),
        )
        .limit(1);

      if (existingReferral[0]) {
        throw new Error("Indicacao ja registrada");
      }

      // Create referral
      const result = await tx
        .insert(referrals)
        .values({
          tenantId: session.tenantId,
          referrerId,
          referredId: referredCreatorId,
          referralCode: referrerCode.toUpperCase(),
          status: "pending",
          pointsAwarded: false,
        })
        .returning({ id: referrals.id });

      const newId = result[0]?.id;
      if (!newId) {
        throw new Error("Falha ao criar indicacao");
      }

      // Also update the referred creator's referredByCreatorId
      await tx
        .update(creators)
        .set({
          referredByCreatorId: referrerId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(creators.id, referredCreatorId),
            eq(creators.tenantId, session.tenantId),
          ),
        );

      return newId;
    });

    return { data: { id: referralId } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Acesso negado") return { error: "Acesso negado" };
      if (err.message === "Codigo de indicacao invalido") return { error: "Codigo de indicacao invalido" };
      if (err.message === "Creator nao pode indicar a si mesmo") return { error: err.message };
      if (err.message === "Creator indicado nao encontrado") return { error: err.message };
      if (err.message === "Indicacao ja registrada") return { error: "Indicacao ja registrada" };
    }
    console.error("[trackReferral]", err);
    return { error: "Erro ao registrar indicacao" };
  }
}

// ---------------------------------------------------------------------------
// 3. checkReferralReward — Check if referred creator made first sale
//    If yes, award points to referrer.
// ---------------------------------------------------------------------------

const REFERRAL_POINTS = 100; // Points awarded for successful referral

export async function checkReferralReward(
  referralId: string,
): Promise<ActionResult<{ rewarded: boolean; pointsAwarded: number }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:referrals:write");

    if (!referralId || !/^[0-9a-f-]{36}$/i.test(referralId)) {
      return { error: "ID invalido" };
    }

    const result = await withTenantContext(session.tenantId, async (tx) => {
      // Fetch referral
      const referralRow = await tx
        .select({
          id: referrals.id,
          referrerId: referrals.referrerId,
          referredId: referrals.referredId,
          pointsAwarded: referrals.pointsAwarded,
          status: referrals.status,
        })
        .from(referrals)
        .where(
          and(
            eq(referrals.id, referralId),
            eq(referrals.tenantId, session.tenantId),
          ),
        )
        .limit(1);

      const referral = referralRow[0];
      if (!referral) {
        throw new Error("Indicacao nao encontrada");
      }

      // Already rewarded
      if (referral.pointsAwarded) {
        return { rewarded: false, pointsAwarded: 0 };
      }

      // Check if referred creator has made at least one sale
      const referredCreator = await tx
        .select({
          totalSalesCount: creators.totalSalesCount,
          lastSaleAt: creators.lastSaleAt,
        })
        .from(creators)
        .where(
          and(
            eq(creators.id, referral.referredId),
            eq(creators.tenantId, session.tenantId),
          ),
        )
        .limit(1);

      if (!referredCreator[0] || referredCreator[0].totalSalesCount === 0) {
        return { rewarded: false, pointsAwarded: 0 };
      }

      // First sale exists — award points to referrer
      const now = new Date();

      // Update referral
      await tx
        .update(referrals)
        .set({
          pointsAwarded: true,
          referredFirstSaleAt: referredCreator[0].lastSaleAt ?? now,
          status: "active",
        })
        .where(eq(referrals.id, referralId));

      // Add points to referrer's ledger
      await tx.insert(pointsLedger).values({
        tenantId: session.tenantId,
        creatorId: referral.referrerId,
        points: REFERRAL_POINTS,
        actionType: "referral",
        referenceType: "referral",
        referenceId: referralId,
        description: `Pontos por indicacao de creator (referral ID: ${referralId})`,
      });

      // Update referrer's total points
      const referrerRow = await tx
        .select({ totalPoints: creators.totalPoints })
        .from(creators)
        .where(eq(creators.id, referral.referrerId))
        .limit(1);

      const currentPoints = referrerRow[0]?.totalPoints ?? 0;

      await tx
        .update(creators)
        .set({
          totalPoints: currentPoints + REFERRAL_POINTS,
          updatedAt: now,
        })
        .where(eq(creators.id, referral.referrerId));

      return { rewarded: true, pointsAwarded: REFERRAL_POINTS };
    });

    return { data: result };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Acesso negado") return { error: "Acesso negado" };
      if (err.message === "Indicacao nao encontrada") return { error: "Indicacao nao encontrada" };
    }
    console.error("[checkReferralReward]", err);
    return { error: "Erro ao verificar recompensa de indicacao" };
  }
}
