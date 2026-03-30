"use server";

import { db } from "@ambaril/db";
import {
  eq,
  and,
  desc,
  count,
} from "drizzle-orm";
import {
  campaignBriefs,
  campaigns,
} from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import { campaignBriefSchema } from "@ambaril/shared/schemas";
import { uuidSchema, paginationSchema } from "@ambaril/shared/validators";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

// ---------------------------------------------------------------------------
// createBrief
// ---------------------------------------------------------------------------

export async function createBrief(
  input: z.infer<typeof campaignBriefSchema>,
): Promise<ActionResult<{ id: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:campaigns:write")
  )
    return { error: "Acesso negado" };

  const parsed = campaignBriefSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  return withTenantContext(session.tenantId, async (tx) => {
    // Verify campaign exists
    const [campaign] = await tx
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, parsed.data.campaignId),
          eq(campaigns.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!campaign) return { error: "Campanha nao encontrada" };

    const [brief] = await tx
      .insert(campaignBriefs)
      .values({
        tenantId: session.tenantId,
        campaignId: parsed.data.campaignId,
        title: parsed.data.title,
        contentMd: parsed.data.contentMd,
        hashtags: parsed.data.hashtags ?? null,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
        examplesJson: parsed.data.examplesJson ?? null,
        targetTiers: parsed.data.targetTiers ?? null,
        createdBy: session.userId,
      })
      .returning({ id: campaignBriefs.id });

    if (!brief) return { error: "Falha ao criar briefing" };
    return { data: { id: brief.id } };
  });
}

// ---------------------------------------------------------------------------
// updateBrief
// ---------------------------------------------------------------------------

const updateBriefInput = z.object({
  title: z.string().min(1).max(255).optional(),
  contentMd: z.string().min(10).max(50000).optional(),
  hashtags: z.array(z.string()).max(20).optional(),
  deadline: z.string().datetime().optional().nullable(),
  examplesJson: z
    .array(
      z.object({
        type: z.string(),
        url: z.string().url(),
        caption: z.string().optional(),
      }),
    )
    .optional(),
  targetTiers: z.array(z.string()).max(10).optional(),
});

export async function updateBrief(
  briefId: string,
  input: z.infer<typeof updateBriefInput>,
): Promise<ActionResult<{ id: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:campaigns:write")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(briefId);
  if (!idParsed.success) return { error: "ID do briefing invalido" };

  const parsed = updateBriefInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [existing] = await tx
      .select()
      .from(campaignBriefs)
      .where(
        and(
          eq(campaignBriefs.id, idParsed.data),
          eq(campaignBriefs.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!existing) return { error: "Briefing nao encontrado" };

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.contentMd !== undefined)
      updateData.contentMd = parsed.data.contentMd;
    if (parsed.data.hashtags !== undefined)
      updateData.hashtags = parsed.data.hashtags;
    if (parsed.data.deadline !== undefined)
      updateData.deadline = parsed.data.deadline
        ? new Date(parsed.data.deadline)
        : null;
    if (parsed.data.examplesJson !== undefined)
      updateData.examplesJson = parsed.data.examplesJson;
    if (parsed.data.targetTiers !== undefined)
      updateData.targetTiers = parsed.data.targetTiers;

    await tx
      .update(campaignBriefs)
      .set(updateData)
      .where(eq(campaignBriefs.id, idParsed.data));

    return { data: { id: idParsed.data } };
  });
}

// ---------------------------------------------------------------------------
// deleteBrief — Hard delete
// ---------------------------------------------------------------------------

export async function deleteBrief(
  briefId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:campaigns:write")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(briefId);
  if (!idParsed.success) return { error: "ID do briefing invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [existing] = await tx
      .select()
      .from(campaignBriefs)
      .where(
        and(
          eq(campaignBriefs.id, idParsed.data),
          eq(campaignBriefs.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!existing) return { error: "Briefing nao encontrado" };

    await tx
      .delete(campaignBriefs)
      .where(eq(campaignBriefs.id, idParsed.data));

    return { data: { deleted: true } };
  });
}

// ---------------------------------------------------------------------------
// listBriefs — Optionally filtered by campaignId
// ---------------------------------------------------------------------------

const listBriefsInput = paginationSchema.extend({
  campaignId: uuidSchema.optional(),
});

export async function listBriefs(
  input?: z.infer<typeof listBriefsInput>,
): Promise<
  ActionResult<{
    items: (typeof campaignBriefs.$inferSelect)[];
    total: number;
    page: number;
    perPage: number;
  }>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:campaigns:read")
  )
    return { error: "Acesso negado" };

  const parsed = listBriefsInput.safeParse(input ?? {});
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  const { page, per_page, campaignId } = parsed.data;

  return withTenantContext(session.tenantId, async (tx) => {
    const conditions = [eq(campaignBriefs.tenantId, session.tenantId)];

    if (campaignId) conditions.push(eq(campaignBriefs.campaignId, campaignId));

    const where = and(...conditions);

    const [totalResult] = await tx
      .select({ total: count() })
      .from(campaignBriefs)
      .where(where);

    const items = await tx
      .select()
      .from(campaignBriefs)
      .where(where)
      .orderBy(desc(campaignBriefs.createdAt))
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
// getBriefDetail — Single brief with all fields
// ---------------------------------------------------------------------------

export async function getBriefDetail(
  briefId: string,
): Promise<ActionResult<typeof campaignBriefs.$inferSelect>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:campaigns:read")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(briefId);
  if (!idParsed.success) return { error: "ID do briefing invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [brief] = await tx
      .select()
      .from(campaignBriefs)
      .where(
        and(
          eq(campaignBriefs.id, idParsed.data),
          eq(campaignBriefs.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!brief) return { error: "Briefing nao encontrado" };

    return { data: brief };
  });
}
