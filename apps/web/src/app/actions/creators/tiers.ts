"use server";

import { db } from "@ambaril/db";
import { eq, and, asc, count } from "drizzle-orm";
import { creatorTiers, creators } from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import { tierConfigSchema } from "@ambaril/shared/schemas";
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
// Tier row type
// ---------------------------------------------------------------------------

interface TierRow {
  id: string;
  name: string;
  slug: string;
  commissionRate: string;
  minFollowers: number;
  benefits: unknown;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// 1. listTiers — All tiers for current tenant, ordered by sortOrder
// ---------------------------------------------------------------------------

export async function listTiers(): Promise<ActionResult<TierRow[]>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:read");

    const rows = await db
      .select({
        id: creatorTiers.id,
        name: creatorTiers.name,
        slug: creatorTiers.slug,
        commissionRate: creatorTiers.commissionRate,
        minFollowers: creatorTiers.minFollowers,
        benefits: creatorTiers.benefits,
        sortOrder: creatorTiers.sortOrder,
        createdAt: creatorTiers.createdAt,
        updatedAt: creatorTiers.updatedAt,
      })
      .from(creatorTiers)
      .where(eq(creatorTiers.tenantId, session.tenantId))
      .orderBy(asc(creatorTiers.sortOrder));

    return { data: rows };
  } catch (err) {
    if (err instanceof Error && err.message === "Acesso negado") {
      return { error: "Acesso negado" };
    }
    console.error("[listTiers]", err);
    return { error: "Erro ao listar tiers" };
  }
}

// ---------------------------------------------------------------------------
// 2. createTier — Validates with tierConfigSchema, check unique slug
// ---------------------------------------------------------------------------

export async function createTier(
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:tiers:write");

    const parsed = tierConfigSchema.safeParse(input);
    if (!parsed.success) {
      return { error: formatZodError(parsed.error) };
    }

    const { name, slug, commissionRate, minFollowers, benefits, sortOrder } = parsed.data;

    const tierId = await withTenantContext(session.tenantId, async (tx) => {
      // Check unique slug per tenant
      const existing = await tx
        .select({ id: creatorTiers.id })
        .from(creatorTiers)
        .where(
          and(
            eq(creatorTiers.tenantId, session.tenantId),
            eq(creatorTiers.slug, slug),
          ),
        )
        .limit(1);

      if (existing[0]) {
        throw new Error("Slug ja existe para este tenant");
      }

      const result = await tx
        .insert(creatorTiers)
        .values({
          tenantId: session.tenantId,
          name,
          slug,
          commissionRate,
          minFollowers,
          benefits,
          sortOrder,
        })
        .returning({ id: creatorTiers.id });

      const newId = result[0]?.id;
      if (!newId) {
        throw new Error("Falha ao criar tier");
      }

      return newId;
    });

    return { data: { id: tierId } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Acesso negado") return { error: "Acesso negado" };
      if (err.message === "Slug ja existe para este tenant") return { error: "Slug ja existe para este tenant" };
    }
    console.error("[createTier]", err);
    return { error: "Erro ao criar tier" };
  }
}

// ---------------------------------------------------------------------------
// 3. updateTier — Update tier fields
// ---------------------------------------------------------------------------

export async function updateTier(
  id: string,
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:tiers:write");

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return { error: "ID invalido" };
    }

    const parsed = tierConfigSchema.partial().safeParse(input);
    if (!parsed.success) {
      return { error: formatZodError(parsed.error) };
    }

    const updateData = parsed.data;

    // Remove undefined fields
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }

    if (Object.keys(cleanData).length === 0) {
      return { error: "Nenhum campo para atualizar" };
    }

    cleanData.updatedAt = new Date();

    await withTenantContext(session.tenantId, async (tx) => {
      // Verify tier exists and belongs to tenant
      const existing = await tx
        .select({ id: creatorTiers.id })
        .from(creatorTiers)
        .where(
          and(
            eq(creatorTiers.id, id),
            eq(creatorTiers.tenantId, session.tenantId),
          ),
        )
        .limit(1);

      if (!existing[0]) {
        throw new Error("Tier nao encontrado");
      }

      // If slug is being updated, check uniqueness
      if (cleanData.slug && typeof cleanData.slug === "string") {
        const slugConflict = await tx
          .select({ id: creatorTiers.id })
          .from(creatorTiers)
          .where(
            and(
              eq(creatorTiers.tenantId, session.tenantId),
              eq(creatorTiers.slug, cleanData.slug),
            ),
          )
          .limit(1);

        if (slugConflict[0] && slugConflict[0].id !== id) {
          throw new Error("Slug ja existe para este tenant");
        }
      }

      await tx
        .update(creatorTiers)
        .set(cleanData)
        .where(
          and(
            eq(creatorTiers.id, id),
            eq(creatorTiers.tenantId, session.tenantId),
          ),
        );
    });

    return { data: { id } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Acesso negado") return { error: "Acesso negado" };
      if (err.message === "Tier nao encontrado") return { error: "Tier nao encontrado" };
      if (err.message === "Slug ja existe para este tenant") return { error: "Slug ja existe para este tenant" };
    }
    console.error("[updateTier]", err);
    return { error: "Erro ao atualizar tier" };
  }
}

// ---------------------------------------------------------------------------
// 4. deleteTier — Soft check: fail if any creators use this tier
// ---------------------------------------------------------------------------

export async function deleteTier(
  id: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:tiers:write");

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return { error: "ID invalido" };
    }

    await withTenantContext(session.tenantId, async (tx) => {
      // Verify tier exists
      const existing = await tx
        .select({ id: creatorTiers.id })
        .from(creatorTiers)
        .where(
          and(
            eq(creatorTiers.id, id),
            eq(creatorTiers.tenantId, session.tenantId),
          ),
        )
        .limit(1);

      if (!existing[0]) {
        throw new Error("Tier nao encontrado");
      }

      // Check if any creators are using this tier
      const usageResult = await tx
        .select({ count: count() })
        .from(creators)
        .where(
          and(
            eq(creators.tierId, id),
            eq(creators.tenantId, session.tenantId),
          ),
        );

      const usageCount = usageResult[0]?.count ?? 0;
      if (usageCount > 0) {
        throw new Error(
          `Nao e possivel excluir: ${usageCount} creator(s) estao usando este tier`,
        );
      }

      await tx
        .delete(creatorTiers)
        .where(
          and(
            eq(creatorTiers.id, id),
            eq(creatorTiers.tenantId, session.tenantId),
          ),
        );
    });

    return { data: { deleted: true } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Acesso negado") return { error: "Acesso negado" };
      if (err.message === "Tier nao encontrado") return { error: "Tier nao encontrado" };
      if (err.message.startsWith("Nao e possivel excluir")) return { error: err.message };
    }
    console.error("[deleteTier]", err);
    return { error: "Erro ao excluir tier" };
  }
}
