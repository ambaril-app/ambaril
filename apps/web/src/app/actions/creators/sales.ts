"use server";

import { createHash } from "crypto";
import { db } from "@ambaril/db";
import {
  eq,
  and,
  desc,
  sql,
  lte,
  count,
} from "drizzle-orm";
import {
  creators,
  coupons,
  salesAttributions,
  pointsLedger,
} from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import { uuidSchema, paginationSchema } from "@ambaril/shared/validators";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const attributeSaleInput = z.object({
  orderId: uuidSchema,
  couponCode: z.string().min(1, "Codigo do cupom e obrigatorio").max(50),
  orderTotal: z.string().regex(/^\d+\.\d{2}$/, "Valor do pedido invalido"),
  discountAmount: z.string().regex(/^\d+\.\d{2}$/, "Valor do desconto invalido"),
  buyerCpf: z
    .string()
    .regex(/^\d{11}$/, "CPF deve conter 11 digitos")
    .optional(),
});

const adjustCommissionInput = z.object({
  reason: z
    .string()
    .min(10, "Descreva o motivo (minimo 10 caracteres)")
    .max(500, "Motivo deve ter no maximo 500 caracteres"),
  newCommissionAmount: z
    .string()
    .regex(/^\d+\.\d{2}$/, "Valor de comissao invalido")
    .optional(),
});

const listSalesInput = paginationSchema.extend({
  status: z.enum(["pending", "confirmed", "adjusted", "cancelled"]).optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashCpf(cpf: string): string {
  return createHash("sha256").update(cpf).digest("hex");
}

// ---------------------------------------------------------------------------
// attributeSale — Attribute a sale to a creator via coupon code
// ---------------------------------------------------------------------------

export async function attributeSale(
  input: z.infer<typeof attributeSaleInput>,
): Promise<
  ActionResult<{ attributionId: string; flagged: boolean; flagReason?: string }>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:sales:write")
  )
    return { error: "Acesso negado" };

  const parsed = attributeSaleInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { orderId, couponCode, orderTotal, discountAmount, buyerCpf } =
    parsed.data;

  return withTenantContext(session.tenantId, async (tx) => {
    // 1. Look up coupon by code
    const [coupon] = await tx
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.tenantId, session.tenantId),
          eq(coupons.code, couponCode.toUpperCase()),
        ),
      )
      .limit(1);

    if (!coupon) return { error: "Cupom nao encontrado" };
    if (!coupon.creatorId) return { error: "Cupom nao esta vinculado a um creator" };

    // 2. Look up creator by couponId
    const [creator] = await tx
      .select()
      .from(creators)
      .where(
        and(
          eq(creators.id, coupon.creatorId),
          eq(creators.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!creator) return { error: "Creator nao encontrado" };
    if (creator.status !== "active")
      return { error: "Creator nao esta ativo" };

    // 3. Calculate values
    const orderTotalNum = parseFloat(orderTotal);
    const discountNum = parseFloat(discountAmount);
    const netRevenue = orderTotalNum - discountNum;
    const commissionRate = parseFloat(creator.commissionRate);
    const commissionAmount = (netRevenue * commissionRate) / 100;

    // 4. Check flags
    let flagged = false;
    let flagReason: string | undefined;

    // 5. Check monthly cap
    const currentMonthAmount = parseFloat(creator.currentMonthSalesAmount);
    if (currentMonthAmount + orderTotalNum > parseFloat(creator.monthlyCap)) {
      flagged = true;
      flagReason = "Limite mensal excedido";
    }

    // 6. Check self-purchase
    let buyerCpfHash: string | null = null;
    if (buyerCpf) {
      buyerCpfHash = hashCpf(buyerCpf);
      const creatorCpfHash = hashCpf(creator.cpf);
      if (buyerCpfHash === creatorCpfHash) {
        flagged = true;
        flagReason = flagReason
          ? `${flagReason}; Auto-compra detectada`
          : "Auto-compra detectada";
      }
    }

    // 7. Exchange window = 7 days from now
    const exchangeWindowEndsAt = new Date();
    exchangeWindowEndsAt.setDate(exchangeWindowEndsAt.getDate() + 7);

    // 8. Insert sales attribution
    const [attribution] = await tx
      .insert(salesAttributions)
      .values({
        tenantId: session.tenantId,
        creatorId: creator.id,
        orderId,
        couponId: coupon.id,
        orderTotal,
        discountAmount,
        netRevenue: netRevenue.toFixed(2),
        commissionRate: commissionRate.toFixed(2),
        commissionAmount: commissionAmount.toFixed(2),
        status: "pending",
        exchangeWindowEndsAt,
        buyerCpfHash,
      })
      .returning({ id: salesAttributions.id });

    // 9. Update creator counters
    await tx
      .update(creators)
      .set({
        totalSalesAmount: sql`${creators.totalSalesAmount}::numeric + ${orderTotalNum.toFixed(2)}::numeric`,
        totalSalesCount: sql`${creators.totalSalesCount} + 1`,
        currentMonthSalesAmount: sql`${creators.currentMonthSalesAmount}::numeric + ${orderTotalNum.toFixed(2)}::numeric`,
        currentMonthSalesCount: sql`${creators.currentMonthSalesCount} + 1`,
        lastSaleAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(creators.id, creator.id));

    // 10. Update coupon usage
    await tx
      .update(coupons)
      .set({
        usageCount: sql`${coupons.usageCount} + 1`,
        totalRevenueGenerated: sql`${coupons.totalRevenueGenerated}::numeric + ${netRevenue.toFixed(2)}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, coupon.id));

    if (!attribution) return { error: "Falha ao criar atribuicao" };

    return {
      data: {
        attributionId: attribution.id,
        flagged,
        flagReason,
      },
    };
  });
}

// ---------------------------------------------------------------------------
// confirmSales — Batch confirm pending attributions past exchange window
// ---------------------------------------------------------------------------

export async function confirmSales(): Promise<
  ActionResult<{ confirmed: number }>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:sales:write")
  )
    return { error: "Acesso negado" };

  return withTenantContext(session.tenantId, async (tx) => {
    const now = new Date();

    // Find all pending attributions past exchange window
    const pendingAttributions = await tx
      .select()
      .from(salesAttributions)
      .where(
        and(
          eq(salesAttributions.tenantId, session.tenantId),
          eq(salesAttributions.status, "pending"),
          lte(salesAttributions.exchangeWindowEndsAt, now),
        ),
      );

    let confirmed = 0;

    for (const attr of pendingAttributions) {
      // Update attribution status
      await tx
        .update(salesAttributions)
        .set({
          status: "confirmed",
          confirmedAt: now,
          updatedAt: now,
        })
        .where(eq(salesAttributions.id, attr.id));

      // Award +10 points via pointsLedger
      await tx.insert(pointsLedger).values({
        tenantId: session.tenantId,
        creatorId: attr.creatorId,
        points: 10,
        actionType: "sale",
        referenceType: "sales_attribution",
        referenceId: attr.id,
        description: "Pontos por venda confirmada",
      });

      // Update creator totalPoints
      await tx
        .update(creators)
        .set({
          totalPoints: sql`${creators.totalPoints} + 10`,
          updatedAt: now,
        })
        .where(eq(creators.id, attr.creatorId));

      confirmed++;
    }

    return { data: { confirmed } };
  });
}

// ---------------------------------------------------------------------------
// adjustCommission — Adjust commission for an attribution
// ---------------------------------------------------------------------------

export async function adjustCommission(
  attributionId: string,
  input: z.infer<typeof adjustCommissionInput>,
): Promise<ActionResult<{ id: string; status: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:sales:write")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(attributionId);
  if (!idParsed.success) return { error: "ID de atribuicao invalido" };

  const parsed = adjustCommissionInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [attr] = await tx
      .select()
      .from(salesAttributions)
      .where(
        and(
          eq(salesAttributions.id, idParsed.data),
          eq(salesAttributions.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!attr) return { error: "Atribuicao nao encontrada" };

    const updateData: Record<string, unknown> = {
      exchangeAdjusted: true,
      adjustmentReason: parsed.data.reason,
      status: "adjusted" as const,
      updatedAt: new Date(),
    };

    // If a new commission amount is provided, use it; otherwise zero it out (full reversal)
    if (parsed.data.newCommissionAmount) {
      updateData.commissionAmount = parsed.data.newCommissionAmount;
    } else {
      updateData.commissionAmount = "0.00";
    }

    await tx
      .update(salesAttributions)
      .set(updateData)
      .where(eq(salesAttributions.id, idParsed.data));

    return { data: { id: idParsed.data, status: "adjusted" } };
  });
}

// ---------------------------------------------------------------------------
// listSalesForCreator — Paginated sales list for a creator
// ---------------------------------------------------------------------------

export async function listSalesForCreator(
  creatorId: string,
  input: z.infer<typeof listSalesInput>,
): Promise<
  ActionResult<{
    items: (typeof salesAttributions.$inferSelect)[];
    total: number;
    page: number;
    perPage: number;
  }>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:sales:read")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(creatorId);
  if (!idParsed.success) return { error: "ID do creator invalido" };

  const parsed = listSalesInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  const { page, per_page, status } = parsed.data;

  return withTenantContext(session.tenantId, async (tx) => {
    const conditions = [
      eq(salesAttributions.tenantId, session.tenantId),
      eq(salesAttributions.creatorId, idParsed.data),
    ];

    if (status) conditions.push(eq(salesAttributions.status, status));

    const where = and(...conditions);

    const [totalResult] = await tx
      .select({ total: count() })
      .from(salesAttributions)
      .where(where);

    const items = await tx
      .select()
      .from(salesAttributions)
      .where(where)
      .orderBy(desc(salesAttributions.createdAt))
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
