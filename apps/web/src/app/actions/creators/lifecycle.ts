"use server";

import { db } from "@ambaril/db";
import { eq, and, asc } from "drizzle-orm";
import { creators, creatorTiers, coupons, socialAccounts } from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import { generateCouponCode } from "./coupons";
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
// 1. approveCreator — Full approval workflow
// ---------------------------------------------------------------------------

export async function approveCreator(
  id: string,
): Promise<ActionResult<{ id: string; couponCode: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:write");

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return { error: "ID invalido" };
    }

    // Generate coupon code before the transaction (it uses its own DB calls)
    // We need the creator name first
    const creatorRow = await db
      .select({
        id: creators.id,
        name: creators.name,
        email: creators.email,
        status: creators.status,
        tierId: creators.tierId,
      })
      .from(creators)
      .where(
        and(eq(creators.id, id), eq(creators.tenantId, session.tenantId)),
      )
      .limit(1);

    const creator = creatorRow[0];
    if (!creator) {
      return { error: "Creator nao encontrado" };
    }
    if (creator.status === "active") {
      return { error: "Creator ja esta ativo" };
    }

    // Get default tier (lowest sortOrder) if creator has no tier assigned
    let assignedTierId = creator.tierId;
    let tierCommissionRate = "0.00";
    let tierDiscountPercent = 10; // default discount for coupon

    if (!assignedTierId) {
      const defaultTierRows = await db
        .select({
          id: creatorTiers.id,
          commissionRate: creatorTiers.commissionRate,
          benefits: creatorTiers.benefits,
        })
        .from(creatorTiers)
        .where(eq(creatorTiers.tenantId, session.tenantId))
        .orderBy(asc(creatorTiers.sortOrder))
        .limit(1);

      const defaultTier = defaultTierRows[0];
      if (defaultTier) {
        assignedTierId = defaultTier.id;
        tierCommissionRate = defaultTier.commissionRate;
        // Try to extract discount from tier benefits
        const benefits = defaultTier.benefits as Record<string, unknown> | null;
        if (benefits && typeof benefits === "object" && "discountPercent" in benefits) {
          const dp = benefits.discountPercent;
          if (typeof dp === "number") tierDiscountPercent = dp;
        }
      }
    } else {
      // Fetch the already-assigned tier's commission rate
      const tierRows = await db
        .select({
          commissionRate: creatorTiers.commissionRate,
          benefits: creatorTiers.benefits,
        })
        .from(creatorTiers)
        .where(eq(creatorTiers.id, assignedTierId))
        .limit(1);

      const tier = tierRows[0];
      if (tier) {
        tierCommissionRate = tier.commissionRate;
        const benefits = tier.benefits as Record<string, unknown> | null;
        if (benefits && typeof benefits === "object" && "discountPercent" in benefits) {
          const dp = benefits.discountPercent;
          if (typeof dp === "number") tierDiscountPercent = dp;
        }
      }
    }

    // Generate coupon code
    const codeResult = await generateCouponCode(creator.name, tierDiscountPercent);
    if (codeResult.error || !codeResult.data) {
      return { error: `Erro ao gerar cupom: ${codeResult.error ?? "desconhecido"}` };
    }
    const couponCode = codeResult.data.code;

    // Execute the approval in a single transaction
    await withTenantContext(session.tenantId, async (tx) => {
      // Create coupon
      const couponResult = await tx
        .insert(coupons)
        .values({
          tenantId: session.tenantId,
          creatorId: id,
          code: couponCode,
          type: "creator",
          discountType: "percent",
          discountPercent: String(tierDiscountPercent),
          isActive: true,
        })
        .returning({ id: coupons.id });

      const newCouponId = couponResult[0]?.id;
      if (!newCouponId) {
        throw new Error("Falha ao criar cupom");
      }

      // Update creator: status, joinedAt, tierId, commissionRate, couponId
      await tx
        .update(creators)
        .set({
          status: "active",
          joinedAt: new Date(),
          tierId: assignedTierId,
          commissionRate: tierCommissionRate,
          couponId: newCouponId,
          updatedAt: new Date(),
        })
        .where(
          and(eq(creators.id, id), eq(creators.tenantId, session.tenantId)),
        );
    });

    // TODO: Send welcome email via Resend (Phase 2)

    return { data: { id, couponCode } };
  } catch (err) {
    if (err instanceof Error && err.message === "Acesso negado") {
      return { error: "Acesso negado" };
    }
    console.error("[approveCreator]", err);
    return { error: "Erro ao aprovar creator" };
  }
}

// ---------------------------------------------------------------------------
// 2. rejectCreator — Set status = 'inactive', store reason
// ---------------------------------------------------------------------------

export async function rejectCreator(
  id: string,
  reason: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:write");

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return { error: "ID invalido" };
    }
    if (!reason || reason.trim().length === 0) {
      return { error: "Motivo da rejeicao e obrigatorio" };
    }

    await withTenantContext(session.tenantId, async (tx) => {
      const existing = await tx
        .select({ id: creators.id, status: creators.status })
        .from(creators)
        .where(
          and(eq(creators.id, id), eq(creators.tenantId, session.tenantId)),
        )
        .limit(1);

      if (!existing[0]) {
        throw new Error("Creator nao encontrado");
      }

      await tx
        .update(creators)
        .set({
          status: "inactive",
          suspensionReason: reason.trim(),
          updatedAt: new Date(),
        })
        .where(
          and(eq(creators.id, id), eq(creators.tenantId, session.tenantId)),
        );
    });

    return { data: { id } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Acesso negado") return { error: "Acesso negado" };
      if (err.message === "Creator nao encontrado") return { error: "Creator nao encontrado" };
    }
    console.error("[rejectCreator]", err);
    return { error: "Erro ao rejeitar creator" };
  }
}

// ---------------------------------------------------------------------------
// 3. suspendCreator — Set status = 'suspended', store reason
// ---------------------------------------------------------------------------

export async function suspendCreator(
  id: string,
  reason: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:write");

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return { error: "ID invalido" };
    }
    if (!reason || reason.trim().length === 0) {
      return { error: "Motivo da suspensao e obrigatorio" };
    }

    await withTenantContext(session.tenantId, async (tx) => {
      const existing = await tx
        .select({ id: creators.id, status: creators.status })
        .from(creators)
        .where(
          and(eq(creators.id, id), eq(creators.tenantId, session.tenantId)),
        )
        .limit(1);

      if (!existing[0]) {
        throw new Error("Creator nao encontrado");
      }

      if (existing[0].status !== "active") {
        throw new Error("Apenas creators ativos podem ser suspensos");
      }

      await tx
        .update(creators)
        .set({
          status: "suspended",
          suspensionReason: reason.trim(),
          updatedAt: new Date(),
        })
        .where(
          and(eq(creators.id, id), eq(creators.tenantId, session.tenantId)),
        );
    });

    return { data: { id } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Acesso negado") return { error: "Acesso negado" };
      if (err.message === "Creator nao encontrado") return { error: "Creator nao encontrado" };
      if (err.message === "Apenas creators ativos podem ser suspensos")
        return { error: err.message };
    }
    console.error("[suspendCreator]", err);
    return { error: "Erro ao suspender creator" };
  }
}

// ---------------------------------------------------------------------------
// 4. reactivateCreator — Set status = 'active', clear suspensionReason
// ---------------------------------------------------------------------------

export async function reactivateCreator(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:write");

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return { error: "ID invalido" };
    }

    await withTenantContext(session.tenantId, async (tx) => {
      const existing = await tx
        .select({ id: creators.id, status: creators.status })
        .from(creators)
        .where(
          and(eq(creators.id, id), eq(creators.tenantId, session.tenantId)),
        )
        .limit(1);

      if (!existing[0]) {
        throw new Error("Creator nao encontrado");
      }

      if (existing[0].status !== "suspended") {
        throw new Error("Apenas creators suspensos podem ser reativados");
      }

      await tx
        .update(creators)
        .set({
          status: "active",
          suspensionReason: null,
          updatedAt: new Date(),
        })
        .where(
          and(eq(creators.id, id), eq(creators.tenantId, session.tenantId)),
        );
    });

    return { data: { id } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Acesso negado") return { error: "Acesso negado" };
      if (err.message === "Creator nao encontrado") return { error: "Creator nao encontrado" };
      if (err.message === "Apenas creators suspensos podem ser reativados")
        return { error: err.message };
    }
    console.error("[reactivateCreator]", err);
    return { error: "Erro ao reativar creator" };
  }
}

// ---------------------------------------------------------------------------
// 5. ambassadorAutoApproval — Auto-approve if IG followers meet threshold
// ---------------------------------------------------------------------------

export async function ambassadorAutoApproval(
  id: string,
): Promise<ActionResult<{ id: string; approved: boolean; reason?: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:write");

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return { error: "ID invalido" };
    }

    // Fetch creator
    const creatorRow = await db
      .select({
        id: creators.id,
        status: creators.status,
        tierId: creators.tierId,
      })
      .from(creators)
      .where(
        and(eq(creators.id, id), eq(creators.tenantId, session.tenantId)),
      )
      .limit(1);

    const creator = creatorRow[0];
    if (!creator) {
      return { error: "Creator nao encontrado" };
    }

    if (creator.status === "active") {
      return { data: { id, approved: false, reason: "Creator ja esta ativo" } };
    }

    // Find the ambassador tier (lowest sortOrder, typically slug contains 'ambassador')
    // Fallback: use the tier with sortOrder 0
    const ambassadorTierRows = await db
      .select({
        id: creatorTiers.id,
        slug: creatorTiers.slug,
        minFollowers: creatorTiers.minFollowers,
      })
      .from(creatorTiers)
      .where(eq(creatorTiers.tenantId, session.tenantId))
      .orderBy(asc(creatorTiers.sortOrder))
      .limit(1);

    const ambassadorTier = ambassadorTierRows[0];
    if (!ambassadorTier) {
      return { error: "Nenhum tier configurado para auto-aprovacao" };
    }

    // Get creator's Instagram followers
    const igAccounts = await db
      .select({
        followers: socialAccounts.followers,
      })
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.creatorId, id),
          eq(socialAccounts.tenantId, session.tenantId),
          eq(socialAccounts.platform, "instagram"),
        ),
      )
      .limit(1);

    const igFollowers = igAccounts[0]?.followers ?? 0;

    // Check if meets threshold
    if (igFollowers < ambassadorTier.minFollowers) {
      return {
        data: {
          id,
          approved: false,
          reason: `Seguidores IG (${igFollowers}) abaixo do minimo (${ambassadorTier.minFollowers})`,
        },
      };
    }

    // Meets threshold — run full approval
    const approvalResult = await approveCreator(id);
    if (approvalResult.error) {
      return { error: approvalResult.error };
    }

    return {
      data: {
        id,
        approved: true,
      },
    };
  } catch (err) {
    if (err instanceof Error && err.message === "Acesso negado") {
      return { error: "Acesso negado" };
    }
    console.error("[ambassadorAutoApproval]", err);
    return { error: "Erro ao verificar auto-aprovacao" };
  }
}
