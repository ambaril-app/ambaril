"use server";

import { db } from "@ambaril/db";
import {
  eq,
  and,
  desc,
  sql,
  count,
  sum,
} from "drizzle-orm";
import {
  campaigns,
  campaignCreators,
  salesAttributions,
  creators,
  coupons,
} from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import { campaignCrudSchema } from "@ambaril/shared/schemas";
import { uuidSchema, paginationSchema } from "@ambaril/shared/validators";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const addCreatorInput = z.object({
  productId: uuidSchema.optional(),
  productCost: z.string().regex(/^\d+\.\d{2}$/).optional(),
  shippingCost: z.string().regex(/^\d+\.\d{2}$/).optional(),
  feeAmount: z.string().regex(/^\d+\.\d{2}$/).optional(),
  notes: z.string().max(2000).optional(),
});

const deliveryStatusInput = z.object({
  deliveryStatus: z.enum(["pending", "shipped", "delivered", "content_posted"]),
});

const listCampaignsInput = paginationSchema.extend({
  status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
  campaignType: z.enum(["seeding", "paid", "gifting", "reward"]).optional(),
});

// ---------------------------------------------------------------------------
// createCampaign
// ---------------------------------------------------------------------------

export async function createCampaign(
  input: z.infer<typeof campaignCrudSchema>,
): Promise<ActionResult<{ id: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:campaigns:write")
  )
    return { error: "Acesso negado" };

  const parsed = campaignCrudSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [campaign] = await tx
      .insert(campaigns)
      .values({
        tenantId: session.tenantId,
        name: parsed.data.name,
        campaignType: parsed.data.campaignType as "seeding" | "paid" | "gifting" | "reward",
        status: "draft",
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate ?? null,
        totalProductCost: parsed.data.costProduct ?? "0.00",
        totalShippingCost: parsed.data.costShipping ?? "0.00",
        totalFeeCost: parsed.data.costCreator ?? "0.00",
        totalRewardCost: parsed.data.costOther ?? "0.00",
        createdBy: session.userId,
      })
      .returning({ id: campaigns.id });

    if (!campaign) return { error: "Falha ao criar campanha" };
    return { data: { id: campaign.id } };
  });
}

// ---------------------------------------------------------------------------
// updateCampaign
// ---------------------------------------------------------------------------

export async function updateCampaign(
  campaignId: string,
  input: Partial<z.infer<typeof campaignCrudSchema>>,
): Promise<ActionResult<{ id: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:campaigns:write")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(campaignId);
  if (!idParsed.success) return { error: "ID da campanha invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [existing] = await tx
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, idParsed.data),
          eq(campaigns.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!existing) return { error: "Campanha nao encontrada" };

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.campaignType !== undefined)
      updateData.campaignType = input.campaignType;
    if (input.startDate !== undefined) updateData.startDate = input.startDate;
    if (input.endDate !== undefined) updateData.endDate = input.endDate;
    if (input.costProduct !== undefined)
      updateData.totalProductCost = input.costProduct;
    if (input.costShipping !== undefined)
      updateData.totalShippingCost = input.costShipping;
    if (input.costCreator !== undefined)
      updateData.totalFeeCost = input.costCreator;
    if (input.costOther !== undefined)
      updateData.totalRewardCost = input.costOther;

    await tx
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, idParsed.data));

    return { data: { id: idParsed.data } };
  });
}

// ---------------------------------------------------------------------------
// listCampaigns
// ---------------------------------------------------------------------------

export async function listCampaigns(
  input?: z.infer<typeof listCampaignsInput>,
): Promise<
  ActionResult<{
    items: (typeof campaigns.$inferSelect)[];
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

  const parsed = listCampaignsInput.safeParse(input ?? {});
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  const { page, per_page, status, campaignType } = parsed.data;

  return withTenantContext(session.tenantId, async (tx) => {
    const conditions = [eq(campaigns.tenantId, session.tenantId)];

    if (status) conditions.push(eq(campaigns.status, status));
    if (campaignType) conditions.push(eq(campaigns.campaignType, campaignType));

    const where = and(...conditions);

    const [totalResult] = await tx
      .select({ total: count() })
      .from(campaigns)
      .where(where);

    const items = await tx
      .select()
      .from(campaigns)
      .where(where)
      .orderBy(desc(campaigns.createdAt))
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
// addCreatorToCampaign
// ---------------------------------------------------------------------------

export async function addCreatorToCampaign(
  campaignId: string,
  creatorId: string,
  details?: z.infer<typeof addCreatorInput>,
): Promise<ActionResult<{ id: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:campaigns:write")
  )
    return { error: "Acesso negado" };

  const campaignIdParsed = uuidSchema.safeParse(campaignId);
  if (!campaignIdParsed.success) return { error: "ID da campanha invalido" };
  const creatorIdParsed = uuidSchema.safeParse(creatorId);
  if (!creatorIdParsed.success) return { error: "ID do creator invalido" };

  const parsedDetails = details ? addCreatorInput.safeParse(details) : null;
  if (parsedDetails && !parsedDetails.success)
    return { error: parsedDetails.error.issues[0]?.message ?? "Dados invalidos" };

  return withTenantContext(session.tenantId, async (tx) => {
    // Verify campaign exists
    const [campaign] = await tx
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignIdParsed.data),
          eq(campaigns.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!campaign) return { error: "Campanha nao encontrada" };

    // Verify creator exists
    const [creator] = await tx
      .select()
      .from(creators)
      .where(
        and(
          eq(creators.id, creatorIdParsed.data),
          eq(creators.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!creator) return { error: "Creator nao encontrado" };

    const detailsData = parsedDetails?.data;

    const [row] = await tx
      .insert(campaignCreators)
      .values({
        tenantId: session.tenantId,
        campaignId: campaignIdParsed.data,
        creatorId: creatorIdParsed.data,
        productId: detailsData?.productId ?? null,
        productCost: detailsData?.productCost ?? null,
        shippingCost: detailsData?.shippingCost ?? null,
        feeAmount: detailsData?.feeAmount ?? null,
        notes: detailsData?.notes ?? null,
        deliveryStatus: "pending",
      })
      .returning({ id: campaignCreators.id });

    if (!row) return { error: "Falha ao adicionar creator a campanha" };
    return { data: { id: row.id } };
  });
}

// ---------------------------------------------------------------------------
// updateDeliveryStatus
// ---------------------------------------------------------------------------

export async function updateDeliveryStatus(
  campaignCreatorId: string,
  input: z.infer<typeof deliveryStatusInput>,
): Promise<ActionResult<{ id: string; deliveryStatus: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:campaigns:write")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(campaignCreatorId);
  if (!idParsed.success) return { error: "ID invalido" };

  const parsed = deliveryStatusInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [existing] = await tx
      .select()
      .from(campaignCreators)
      .where(
        and(
          eq(campaignCreators.id, idParsed.data),
          eq(campaignCreators.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!existing) return { error: "Registro nao encontrado" };

    await tx
      .update(campaignCreators)
      .set({
        deliveryStatus: parsed.data.deliveryStatus,
        updatedAt: new Date(),
      })
      .where(eq(campaignCreators.id, idParsed.data));

    return {
      data: { id: idParsed.data, deliveryStatus: parsed.data.deliveryStatus },
    };
  });
}

// ---------------------------------------------------------------------------
// removeCreatorFromCampaign
// ---------------------------------------------------------------------------

export async function removeCreatorFromCampaign(
  campaignCreatorId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:campaigns:write")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(campaignCreatorId);
  if (!idParsed.success) return { error: "ID invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [existing] = await tx
      .select()
      .from(campaignCreators)
      .where(
        and(
          eq(campaignCreators.id, idParsed.data),
          eq(campaignCreators.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!existing) return { error: "Registro nao encontrado" };

    await tx
      .delete(campaignCreators)
      .where(eq(campaignCreators.id, idParsed.data));

    return { data: { deleted: true } };
  });
}

// ---------------------------------------------------------------------------
// getCampaignWithROI — Campaign with creators, costs, and ROI calculation
// ---------------------------------------------------------------------------

interface CampaignROI {
  campaign: typeof campaigns.$inferSelect;
  creatorsInCampaign: (typeof campaignCreators.$inferSelect)[];
  totalCosts: number;
  totalRevenue: number;
  roi: number | null;
}

export async function getCampaignWithROI(
  campaignId: string,
): Promise<ActionResult<CampaignROI>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:campaigns:read")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(campaignId);
  if (!idParsed.success) return { error: "ID da campanha invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    // Get campaign
    const [campaign] = await tx
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, idParsed.data),
          eq(campaigns.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!campaign) return { error: "Campanha nao encontrada" };

    // Get creators in campaign
    const creatorsInCampaign = await tx
      .select()
      .from(campaignCreators)
      .where(
        and(
          eq(campaignCreators.campaignId, idParsed.data),
          eq(campaignCreators.tenantId, session.tenantId),
        ),
      );

    // Calculate total costs
    const totalCosts =
      parseFloat(campaign.totalProductCost) +
      parseFloat(campaign.totalShippingCost) +
      parseFloat(campaign.totalFeeCost) +
      parseFloat(campaign.totalRewardCost);

    // Calculate total revenue from attributions linked to campaign creators
    const creatorIds = creatorsInCampaign.map((cc) => cc.creatorId);

    let totalRevenue = 0;
    if (creatorIds.length > 0) {
      // Get all attributions for these creators within the campaign date range
      for (const ccCreatorId of creatorIds) {
        // Get the creator's coupon to match attributions
        const [creator] = await tx
          .select()
          .from(creators)
          .where(
            and(
              eq(creators.id, ccCreatorId),
              eq(creators.tenantId, session.tenantId),
            ),
          )
          .limit(1);

        if (!creator?.couponId) continue;

        const [revenueResult] = await tx
          .select({
            total: sum(salesAttributions.netRevenue).as("total"),
          })
          .from(salesAttributions)
          .where(
            and(
              eq(salesAttributions.creatorId, ccCreatorId),
              eq(salesAttributions.tenantId, session.tenantId),
              eq(salesAttributions.couponId, creator.couponId),
            ),
          );

        totalRevenue += parseFloat(revenueResult?.total ?? "0");
      }
    }

    // ROI = (revenue - costs) / costs * 100
    const roi =
      totalCosts > 0
        ? ((totalRevenue - totalCosts) / totalCosts) * 100
        : null;

    return {
      data: {
        campaign,
        creatorsInCampaign,
        totalCosts,
        totalRevenue,
        roi,
      },
    };
  });
}
