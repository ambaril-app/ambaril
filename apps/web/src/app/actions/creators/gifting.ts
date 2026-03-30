"use server";

import { db } from "@ambaril/db";
import {
  eq,
  and,
  desc,
  sql,
  count,
  inArray,
} from "drizzle-orm";
import {
  creators,
  giftingLog,
} from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import {
  giftingConfigSchema,
  giftingApproveSchema,
} from "@ambaril/shared/schemas";
import { paginationSchema } from "@ambaril/shared/validators";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const listGiftingInput = paginationSchema.extend({
  status: z
    .enum(["suggested", "approved", "rejected", "ordered", "shipped", "delivered"])
    .optional(),
  creatorId: z.string().uuid().optional(),
});

// ---------------------------------------------------------------------------
// generateSuggestions — Rank top N creators and create gifting suggestions
// ---------------------------------------------------------------------------

export async function generateSuggestions(
  input: z.infer<typeof giftingConfigSchema>,
): Promise<ActionResult<{ suggestions: number; totalCost: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:gifting:write")
  )
    return { error: "Acesso negado" };

  const parsed = giftingConfigSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { topN, productPool, monthlyBudget } = parsed.data;
  const budgetLimit = parseFloat(monthlyBudget);

  return withTenantContext(session.tenantId, async (tx) => {
    // 1. Rank top N creators by currentMonthSalesAmount
    const topCreators = await tx
      .select()
      .from(creators)
      .where(
        and(
          eq(creators.tenantId, session.tenantId),
          eq(creators.status, "active"),
        ),
      )
      .orderBy(desc(creators.currentMonthSalesAmount))
      .limit(topN);

    let suggestions = 0;
    let totalCost = 0;

    for (const creator of topCreators) {
      // Pick a random product from pool (simple round-robin for now)
      const productId = productPool[suggestions % productPool.length]!;

      // Use a placeholder product cost (actual cost would come from ERP module)
      const productCost = 100; // placeholder R$100
      const shippingCost = 25; // placeholder R$25

      // Respect monthly budget
      if (totalCost + productCost + shippingCost > budgetLimit) break;

      await tx.insert(giftingLog).values({
        tenantId: session.tenantId,
        creatorId: creator.id,
        productId,
        productName: `Produto ${productId.substring(0, 8)}`, // Placeholder name
        productCost: productCost.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        reason: `Top ${topN} creators do mes — ranking por vendas`,
        status: "suggested",
      });

      totalCost += productCost + shippingCost;
      suggestions++;
    }

    return {
      data: {
        suggestions,
        totalCost: totalCost.toFixed(2),
      },
    };
  });
}

// ---------------------------------------------------------------------------
// approveSuggestions — Batch approve
// ---------------------------------------------------------------------------

export async function approveSuggestions(
  input: z.infer<typeof giftingApproveSchema>,
): Promise<ActionResult<{ approved: number }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:gifting:write")
  )
    return { error: "Acesso negado" };

  const parsed = giftingApproveSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  return withTenantContext(session.tenantId, async (tx) => {
    const now = new Date();
    let approved = 0;

    for (const giftingId of parsed.data.giftingIds) {
      const [existing] = await tx
        .select()
        .from(giftingLog)
        .where(
          and(
            eq(giftingLog.id, giftingId),
            eq(giftingLog.tenantId, session.tenantId),
            eq(giftingLog.status, "suggested"),
          ),
        )
        .limit(1);

      if (!existing) continue;

      await tx
        .update(giftingLog)
        .set({
          status: "approved",
          approvedBy: session.userId,
          approvedAt: now,
          updatedAt: now,
        })
        .where(eq(giftingLog.id, giftingId));

      approved++;
    }

    return { data: { approved } };
  });
}

// ---------------------------------------------------------------------------
// rejectSuggestions — Batch reject
// ---------------------------------------------------------------------------

export async function rejectSuggestions(
  input: z.infer<typeof giftingApproveSchema>,
): Promise<ActionResult<{ rejected: number }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:gifting:write")
  )
    return { error: "Acesso negado" };

  const parsed = giftingApproveSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  return withTenantContext(session.tenantId, async (tx) => {
    const now = new Date();
    let rejected = 0;

    for (const giftingId of parsed.data.giftingIds) {
      const [existing] = await tx
        .select()
        .from(giftingLog)
        .where(
          and(
            eq(giftingLog.id, giftingId),
            eq(giftingLog.tenantId, session.tenantId),
            eq(giftingLog.status, "suggested"),
          ),
        )
        .limit(1);

      if (!existing) continue;

      await tx
        .update(giftingLog)
        .set({
          status: "rejected",
          updatedAt: now,
        })
        .where(eq(giftingLog.id, giftingId));

      rejected++;
    }

    return { data: { rejected } };
  });
}

// ---------------------------------------------------------------------------
// configureGifting — Placeholder for tenant gifting configuration
// ---------------------------------------------------------------------------

export async function configureGifting(
  input: z.infer<typeof giftingConfigSchema>,
): Promise<ActionResult<{ configured: boolean }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:gifting:write")
  )
    return { error: "Acesso negado" };

  const parsed = giftingConfigSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  // TODO: Store gifting config in tenant settings when tenant settings module is built
  // For now, return success — the config is used at call time via generateSuggestions
  return { data: { configured: true } };
}

// ---------------------------------------------------------------------------
// listGiftingHistory — Paginated gifting log
// ---------------------------------------------------------------------------

export async function listGiftingHistory(
  input?: z.infer<typeof listGiftingInput>,
): Promise<
  ActionResult<{
    items: (typeof giftingLog.$inferSelect)[];
    total: number;
    page: number;
    perPage: number;
  }>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:gifting:read")
  )
    return { error: "Acesso negado" };

  const parsed = listGiftingInput.safeParse(input ?? {});
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  const { page, per_page, status, creatorId } = parsed.data;

  return withTenantContext(session.tenantId, async (tx) => {
    const conditions = [eq(giftingLog.tenantId, session.tenantId)];

    if (status) conditions.push(eq(giftingLog.status, status));
    if (creatorId) conditions.push(eq(giftingLog.creatorId, creatorId));

    const where = and(...conditions);

    const [totalResult] = await tx
      .select({ total: count() })
      .from(giftingLog)
      .where(where);

    const items = await tx
      .select()
      .from(giftingLog)
      .where(where)
      .orderBy(desc(giftingLog.createdAt))
      .limit(per_page)
      .offset((page - 1) * per_page);

    return {
      data: {
        items,
        total: totalResult?.total ?? 0,
        page,
        perPage: per_page,
      },
    };
  });
}
