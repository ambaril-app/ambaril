"use server";

import { db } from "@ambaril/db";
import { eq, and } from "drizzle-orm";
import { coupons, creators } from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import { couponCrudSchema } from "@ambaril/shared/schemas";
import type { TenantSessionData } from "@ambaril/shared/types";
import { ZodError } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

function assertPermission(session: TenantSessionData, perm: string) {
  if (session.permissions.includes("*")) return;
  if (!session.permissions.includes(perm)) throw new Error("Acesso negado");
}

function formatZodError(err: ZodError): string {
  return err.errors.map((e) => e.message).join("; ");
}

// ---------------------------------------------------------------------------
// 1. createCoupon — Validates with couponCrudSchema, code unique per tenant
// ---------------------------------------------------------------------------

interface CreateCouponInput {
  creatorId?: string;
  code: string;
  type: "creator" | "campaign" | "vip";
  discountType: "percent" | "fixed";
  discountPercent?: number;
  discountAmount?: string;
  maxUses?: number;
  minOrderValue?: string;
  validFrom?: string;
  validUntil?: string;
}

export async function createCoupon(
  input: CreateCouponInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:coupons:write");

    // Validate via couponCrudSchema (code, discountType, discountPercent, discountAmount)
    const parsed = couponCrudSchema.safeParse({
      code: input.code,
      discountType: input.discountType,
      discountPercent: input.discountPercent,
      discountAmount: input.discountAmount,
    });
    if (!parsed.success) {
      return { error: formatZodError(parsed.error) };
    }

    const couponId = await withTenantContext(session.tenantId, async (tx) => {
      // Check code uniqueness per tenant
      const existing = await tx
        .select({ id: coupons.id })
        .from(coupons)
        .where(
          and(
            eq(coupons.tenantId, session.tenantId),
            eq(coupons.code, parsed.data.code),
          ),
        )
        .limit(1);

      if (existing[0]) {
        throw new Error("Codigo de cupom ja existe para este tenant");
      }

      // If creatorId provided, verify creator exists
      if (input.creatorId) {
        const creatorExists = await tx
          .select({ id: creators.id })
          .from(creators)
          .where(
            and(
              eq(creators.id, input.creatorId),
              eq(creators.tenantId, session.tenantId),
            ),
          )
          .limit(1);

        if (!creatorExists[0]) {
          throw new Error("Creator nao encontrado");
        }
      }

      const result = await tx
        .insert(coupons)
        .values({
          tenantId: session.tenantId,
          creatorId: input.creatorId ?? null,
          code: parsed.data.code,
          type: input.type,
          discountType: parsed.data.discountType,
          discountPercent: parsed.data.discountPercent !== undefined
            ? String(parsed.data.discountPercent)
            : null,
          discountAmount: parsed.data.discountAmount ?? null,
          maxUses: input.maxUses ?? null,
          minOrderValue: input.minOrderValue ?? null,
          validFrom: input.validFrom ? new Date(input.validFrom) : new Date(),
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          isActive: true,
        })
        .returning({ id: coupons.id });

      const newId = result[0]?.id;
      if (!newId) {
        throw new Error("Falha ao criar cupom");
      }

      return newId;
    });

    return { data: { id: couponId } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Acesso negado") return { error: "Acesso negado" };
      if (err.message === "Codigo de cupom ja existe para este tenant")
        return { error: "Codigo de cupom ja existe" };
      if (err.message === "Creator nao encontrado")
        return { error: "Creator nao encontrado" };
    }
    console.error("[createCoupon]", err);
    return { error: "Erro ao criar cupom" };
  }
}

// ---------------------------------------------------------------------------
// 2. updateCoupon — Update coupon fields
// ---------------------------------------------------------------------------

interface UpdateCouponInput {
  code?: string;
  discountType?: "percent" | "fixed";
  discountPercent?: number;
  discountAmount?: string;
  maxUses?: number;
  minOrderValue?: string;
  validFrom?: string;
  validUntil?: string;
}

export async function updateCoupon(
  id: string,
  input: UpdateCouponInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:coupons:write");

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return { error: "ID invalido" };
    }

    await withTenantContext(session.tenantId, async (tx) => {
      // Verify coupon exists
      const existing = await tx
        .select({ id: coupons.id, code: coupons.code })
        .from(coupons)
        .where(
          and(eq(coupons.id, id), eq(coupons.tenantId, session.tenantId)),
        )
        .limit(1);

      if (!existing[0]) {
        throw new Error("Cupom nao encontrado");
      }

      // If code is being changed, check uniqueness
      if (input.code && input.code !== existing[0].code) {
        const codeConflict = await tx
          .select({ id: coupons.id })
          .from(coupons)
          .where(
            and(
              eq(coupons.tenantId, session.tenantId),
              eq(coupons.code, input.code.toUpperCase()),
            ),
          )
          .limit(1);

        if (codeConflict[0]) {
          throw new Error("Codigo de cupom ja existe para este tenant");
        }
      }

      // Build update data
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (input.code !== undefined) updateData.code = input.code.toUpperCase();
      if (input.discountType !== undefined) updateData.discountType = input.discountType;
      if (input.discountPercent !== undefined) updateData.discountPercent = String(input.discountPercent);
      if (input.discountAmount !== undefined) updateData.discountAmount = input.discountAmount;
      if (input.maxUses !== undefined) updateData.maxUses = input.maxUses;
      if (input.minOrderValue !== undefined) updateData.minOrderValue = input.minOrderValue;
      if (input.validFrom !== undefined) updateData.validFrom = new Date(input.validFrom);
      if (input.validUntil !== undefined) updateData.validUntil = new Date(input.validUntil);

      await tx
        .update(coupons)
        .set(updateData)
        .where(
          and(eq(coupons.id, id), eq(coupons.tenantId, session.tenantId)),
        );
    });

    return { data: { id } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Acesso negado") return { error: "Acesso negado" };
      if (err.message === "Cupom nao encontrado") return { error: "Cupom nao encontrado" };
      if (err.message === "Codigo de cupom ja existe para este tenant")
        return { error: "Codigo de cupom ja existe" };
    }
    console.error("[updateCoupon]", err);
    return { error: "Erro ao atualizar cupom" };
  }
}

// ---------------------------------------------------------------------------
// 3. deactivateCoupon — Set isActive = false
// ---------------------------------------------------------------------------

export async function deactivateCoupon(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:coupons:write");

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return { error: "ID invalido" };
    }

    await withTenantContext(session.tenantId, async (tx) => {
      const existing = await tx
        .select({ id: coupons.id })
        .from(coupons)
        .where(
          and(eq(coupons.id, id), eq(coupons.tenantId, session.tenantId)),
        )
        .limit(1);

      if (!existing[0]) {
        throw new Error("Cupom nao encontrado");
      }

      await tx
        .update(coupons)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(eq(coupons.id, id), eq(coupons.tenantId, session.tenantId)),
        );
    });

    return { data: { id } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Acesso negado") return { error: "Acesso negado" };
      if (err.message === "Cupom nao encontrado") return { error: "Cupom nao encontrado" };
    }
    console.error("[deactivateCoupon]", err);
    return { error: "Erro ao desativar cupom" };
  }
}

// ---------------------------------------------------------------------------
// 4. generateCouponCode — Generate code: FIRSTNAME + discount percent
//    E.g., "MARCUS10". On collision, append random 2 digits.
// ---------------------------------------------------------------------------

export async function generateCouponCode(
  creatorName: string,
  discountPercent: number = 10,
): Promise<ActionResult<{ code: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:coupons:write");

    if (!creatorName || creatorName.trim().length === 0) {
      return { error: "Nome do creator e obrigatorio" };
    }

    // Extract first name and make it uppercase
    const firstName = creatorName
      .trim()
      .split(/\s+/)[0]!
      .toUpperCase()
      // Remove accents/diacritics
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Remove non-alphanumeric
      .replace(/[^A-Z0-9]/g, "");

    const baseCode = `${firstName}${discountPercent}`;

    // Check if base code is available
    const existing = await db
      .select({ id: coupons.id })
      .from(coupons)
      .where(
        and(
          eq(coupons.tenantId, session.tenantId),
          eq(coupons.code, baseCode),
        ),
      )
      .limit(1);

    if (!existing[0]) {
      return { data: { code: baseCode } };
    }

    // Collision: append random 2 digits and retry (up to 10 attempts)
    for (let i = 0; i < 10; i++) {
      const suffix = String(Math.floor(Math.random() * 100)).padStart(2, "0");
      const candidateCode = `${baseCode}${suffix}`;

      const conflict = await db
        .select({ id: coupons.id })
        .from(coupons)
        .where(
          and(
            eq(coupons.tenantId, session.tenantId),
            eq(coupons.code, candidateCode),
          ),
        )
        .limit(1);

      if (!conflict[0]) {
        return { data: { code: candidateCode } };
      }
    }

    return { error: "Nao foi possivel gerar um codigo unico. Tente novamente." };
  } catch (err) {
    if (err instanceof Error && err.message === "Acesso negado") {
      return { error: "Acesso negado" };
    }
    console.error("[generateCouponCode]", err);
    return { error: "Erro ao gerar codigo de cupom" };
  }
}
