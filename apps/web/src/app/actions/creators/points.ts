"use server";

import { db } from "@ambaril/db";
import {
  eq,
  and,
  desc,
  sql,
  gte,
  count,
  sum,
} from "drizzle-orm";
import {
  creators,
  pointsLedger,
} from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import { pointsAdjustmentSchema } from "@ambaril/shared/schemas";
import { uuidSchema, paginationSchema } from "@ambaril/shared/validators";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

type PointsActionType =
  | "sale"
  | "post_detected"
  | "challenge_completed"
  | "referral"
  | "engagement"
  | "manual_adjustment"
  | "tier_bonus"
  | "hashtag_detected"
  | "creator_of_month"
  | "product_redemption";

// ---------------------------------------------------------------------------
// awardPoints — Insert points entry and update creator total
// ---------------------------------------------------------------------------

export async function awardPoints(
  creatorId: string,
  points: number,
  actionType: PointsActionType,
  description: string,
  referenceType?: string,
  referenceId?: string,
): Promise<ActionResult<{ ledgerId: string; newTotal: number }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:points:write")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(creatorId);
  if (!idParsed.success) return { error: "ID do creator invalido" };

  if (points === 0) return { error: "Pontos devem ser diferentes de zero" };

  return withTenantContext(session.tenantId, async (tx) => {
    // Verify creator exists
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

    // Insert ledger entry
    const [entry] = await tx
      .insert(pointsLedger)
      .values({
        tenantId: session.tenantId,
        creatorId: idParsed.data,
        points,
        actionType,
        referenceType: referenceType ?? null,
        referenceId: referenceId ?? null,
        description,
      })
      .returning({ id: pointsLedger.id });

    // Update creator totalPoints
    const newTotal = creator.totalPoints + points;
    await tx
      .update(creators)
      .set({
        totalPoints: sql`${creators.totalPoints} + ${points}`,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, idParsed.data));

    if (!entry) return { error: "Falha ao registrar pontos" };
    return {
      data: {
        ledgerId: entry.id,
        newTotal,
      },
    };
  });
}

// ---------------------------------------------------------------------------
// adjustPoints — Manual adjustment by admin
// ---------------------------------------------------------------------------

export async function adjustPoints(
  creatorId: string,
  input: z.infer<typeof pointsAdjustmentSchema>,
): Promise<ActionResult<{ ledgerId: string; newTotal: number }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:points:write")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(creatorId);
  if (!idParsed.success) return { error: "ID do creator invalido" };

  const parsed = pointsAdjustmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  return awardPoints(
    creatorId,
    parsed.data.points,
    "manual_adjustment",
    `Ajuste manual: ${parsed.data.reason}`,
  );
}

// ---------------------------------------------------------------------------
// getPointsLedger — Paginated points history
// ---------------------------------------------------------------------------

export async function getPointsLedger(
  creatorId: string,
  input?: z.infer<typeof paginationSchema>,
): Promise<
  ActionResult<{
    items: (typeof pointsLedger.$inferSelect)[];
    total: number;
    page: number;
    perPage: number;
  }>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:points:read")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(creatorId);
  if (!idParsed.success) return { error: "ID do creator invalido" };

  const parsed = paginationSchema.safeParse(input ?? {});
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  const { page, per_page } = parsed.data;

  return withTenantContext(session.tenantId, async (tx) => {
    const where = and(
      eq(pointsLedger.tenantId, session.tenantId),
      eq(pointsLedger.creatorId, idParsed.data),
    );

    const [totalResult] = await tx
      .select({ total: count() })
      .from(pointsLedger)
      .where(where);

    const items = await tx
      .select()
      .from(pointsLedger)
      .where(where)
      .orderBy(desc(pointsLedger.createdAt))
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

// ---------------------------------------------------------------------------
// getPointsBalance — Total and this month's points
// ---------------------------------------------------------------------------

export async function getPointsBalance(
  creatorId: string,
): Promise<ActionResult<{ total: number; thisMonth: number }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:points:read")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(creatorId);
  if (!idParsed.success) return { error: "ID do creator invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    // Get creator total
    const [creator] = await tx
      .select({ totalPoints: creators.totalPoints })
      .from(creators)
      .where(
        and(
          eq(creators.id, idParsed.data),
          eq(creators.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!creator) return { error: "Creator nao encontrado" };

    // Get this month's points
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthResult] = await tx
      .select({ total: sum(pointsLedger.points).as("total") })
      .from(pointsLedger)
      .where(
        and(
          eq(pointsLedger.tenantId, session.tenantId),
          eq(pointsLedger.creatorId, idParsed.data),
          gte(pointsLedger.createdAt, firstOfMonth),
        ),
      );

    return {
      data: {
        total: creator.totalPoints,
        thisMonth: parseInt(monthResult?.total ?? "0", 10),
      },
    };
  });
}
