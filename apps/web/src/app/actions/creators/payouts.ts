"use server";

import { db } from "@ambaril/db";
import {
  eq,
  and,
  desc,
  sql,
  gte,
  lte,
  count,
  sum,
} from "drizzle-orm";
import {
  creators,
  salesAttributions,
  payouts,
  taxProfiles,
} from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import {
  payoutCalculateSchema,
  payoutMethodSchema,
} from "@ambaril/shared/schemas";
import { paginationSchema, uuidSchema } from "@ambaril/shared/validators";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

// ---------------------------------------------------------------------------
// IRRF progressive table (Brazilian income tax withholding - 2024/2025)
// ---------------------------------------------------------------------------

interface IrrfBracket {
  limit: number;
  rate: number;
  deduction: number;
}

const IRRF_TABLE: IrrfBracket[] = [
  { limit: 2259.20, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 169.44 },
  { limit: 3751.05, rate: 0.15, deduction: 381.44 },
  { limit: 4664.68, rate: 0.225, deduction: 662.77 },
  { limit: Infinity, rate: 0.275, deduction: 896.0 },
];

const MIN_PAYOUT_AMOUNT = 50; // R$ 50 minimum payout

function calculateIrrf(grossAmount: number): number {
  for (const bracket of IRRF_TABLE) {
    if (grossAmount <= bracket.limit) {
      const irrf = grossAmount * bracket.rate - bracket.deduction;
      return Math.max(irrf, 0);
    }
  }
  // Above highest bracket — fallback should never happen given the Infinity bracket
  const last = IRRF_TABLE[IRRF_TABLE.length - 1]!;
  const irrf = grossAmount * last.rate - last.deduction;
  return Math.max(irrf, 0);
}

// ---------------------------------------------------------------------------
// calculatePayouts — Generate payout records for a period
// ---------------------------------------------------------------------------

const calculatePayoutsInput = payoutCalculateSchema;

export async function calculatePayouts(
  input: z.infer<typeof calculatePayoutsInput>,
): Promise<ActionResult<{ created: number; skipped: number; totalGross: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:payouts:write")
  )
    return { error: "Acesso negado" };

  const parsed = calculatePayoutsInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  const { periodStart, periodEnd } = parsed.data;

  return withTenantContext(session.tenantId, async (tx) => {
    // 1. Find all active creators with confirmed commissions in the period
    const creatorsWithCommissions = await tx
      .select({
        creatorId: salesAttributions.creatorId,
        grossAmount: sum(salesAttributions.commissionAmount).as("gross_amount"),
      })
      .from(salesAttributions)
      .where(
        and(
          eq(salesAttributions.tenantId, session.tenantId),
          eq(salesAttributions.status, "confirmed"),
          gte(salesAttributions.createdAt, new Date(periodStart)),
          lte(salesAttributions.createdAt, new Date(periodEnd)),
        ),
      )
      .groupBy(salesAttributions.creatorId);

    let created = 0;
    let skipped = 0;
    let totalGross = 0;

    for (const row of creatorsWithCommissions) {
      const gross = parseFloat(row.grossAmount ?? "0");

      // 2. Skip if total < R$ 50
      if (gross < MIN_PAYOUT_AMOUNT) {
        skipped++;
        continue;
      }

      // 3. Look up tax profile
      const [taxProfile] = await tx
        .select()
        .from(taxProfiles)
        .where(
          and(
            eq(taxProfiles.tenantId, session.tenantId),
            eq(taxProfiles.creatorId, row.creatorId),
          ),
        )
        .limit(1);

      // 4. Calculate IRRF
      const irrfAmount = calculateIrrf(gross);

      // 5. Calculate ISS
      let issAmount = 0;
      if (taxProfile?.hasNfCapability && taxProfile.issRate) {
        issAmount = gross * (parseFloat(taxProfile.issRate) / 100);
      }

      // 6. Net = gross - IRRF - ISS
      const netAmount = gross - irrfAmount - issAmount;

      // 7. Determine fiscal doc type
      let fiscalDocType: "rpa" | "nfse" | "none" = "none";
      if (taxProfile) {
        if (taxProfile.hasNfCapability) {
          fiscalDocType = "nfse";
        } else if (taxProfile.taxpayerType === "pf") {
          fiscalDocType = "rpa";
        }
      }

      // 8. Create payout row
      await tx.insert(payouts).values({
        tenantId: session.tenantId,
        creatorId: row.creatorId,
        periodStart,
        periodEnd,
        grossAmount: gross.toFixed(2),
        irrfWithheld: irrfAmount.toFixed(2),
        issWithheld: issAmount.toFixed(2),
        netAmount: netAmount.toFixed(2),
        fiscalDocType,
        status: "pending",
      });

      totalGross += gross;
      created++;
    }

    return {
      data: {
        created,
        skipped,
        totalGross: totalGross.toFixed(2),
      },
    };
  });
}

// ---------------------------------------------------------------------------
// listPayouts — Paginated list with filters
// ---------------------------------------------------------------------------

const listPayoutsInput = paginationSchema.extend({
  status: z
    .enum(["calculating", "pending", "processing", "paid", "failed"])
    .optional(),
  creatorId: uuidSchema.optional(),
  periodStart: z.string().date().optional(),
  periodEnd: z.string().date().optional(),
});

export async function listPayouts(
  input: z.infer<typeof listPayoutsInput>,
): Promise<
  ActionResult<{
    items: (typeof payouts.$inferSelect)[];
    total: number;
    page: number;
    perPage: number;
  }>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:payouts:read")
  )
    return { error: "Acesso negado" };

  const parsed = listPayoutsInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  const { page, per_page, status, creatorId, periodStart, periodEnd } =
    parsed.data;

  return withTenantContext(session.tenantId, async (tx) => {
    const conditions = [eq(payouts.tenantId, session.tenantId)];

    if (status) conditions.push(eq(payouts.status, status));
    if (creatorId) conditions.push(eq(payouts.creatorId, creatorId));
    if (periodStart) conditions.push(gte(payouts.periodStart, periodStart));
    if (periodEnd) conditions.push(lte(payouts.periodEnd, periodEnd));

    const where = and(...conditions);

    const [totalResult] = await tx
      .select({ total: count() })
      .from(payouts)
      .where(where);

    const items = await tx
      .select()
      .from(payouts)
      .where(where)
      .orderBy(desc(payouts.createdAt))
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
// approvePayout — Set status to 'processing'
// ---------------------------------------------------------------------------

export async function approvePayout(
  payoutId: string,
): Promise<ActionResult<{ id: string; status: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:payouts:write")
  )
    return { error: "Acesso negado" };

  const parsed = uuidSchema.safeParse(payoutId);
  if (!parsed.success) return { error: "ID de pagamento invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [payout] = await tx
      .select()
      .from(payouts)
      .where(
        and(
          eq(payouts.id, parsed.data),
          eq(payouts.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!payout) return { error: "Pagamento nao encontrado" };
    if (payout.status !== "pending")
      return { error: "Pagamento deve estar pendente para ser aprovado" };

    await tx
      .update(payouts)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(payouts.id, parsed.data));

    return { data: { id: parsed.data, status: "processing" } };
  });
}

// ---------------------------------------------------------------------------
// processPayout — Placeholder for PIX processing
// ---------------------------------------------------------------------------

export async function processPayout(
  payoutId: string,
): Promise<ActionResult<{ id: string; status: string; paidAt: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:payouts:write")
  )
    return { error: "Acesso negado" };

  const parsed = uuidSchema.safeParse(payoutId);
  if (!parsed.success) return { error: "ID de pagamento invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [payout] = await tx
      .select()
      .from(payouts)
      .where(
        and(
          eq(payouts.id, parsed.data),
          eq(payouts.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!payout) return { error: "Pagamento nao encontrado" };
    if (payout.status !== "processing")
      return { error: "Pagamento deve estar em processamento" };

    const now = new Date();
    await tx
      .update(payouts)
      .set({ status: "paid", paidAt: now, updatedAt: now })
      .where(eq(payouts.id, parsed.data));

    return {
      data: {
        id: parsed.data,
        status: "paid",
        paidAt: now.toISOString(),
      },
    };
  });
}

// ---------------------------------------------------------------------------
// markPaid — Mark payout as paid with optional transaction ID
// ---------------------------------------------------------------------------

export async function markPaid(
  payoutId: string,
  transactionId?: string,
): Promise<ActionResult<{ id: string; status: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:payouts:write")
  )
    return { error: "Acesso negado" };

  const parsed = uuidSchema.safeParse(payoutId);
  if (!parsed.success) return { error: "ID de pagamento invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [payout] = await tx
      .select()
      .from(payouts)
      .where(
        and(
          eq(payouts.id, parsed.data),
          eq(payouts.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!payout) return { error: "Pagamento nao encontrado" };
    if (payout.status !== "processing" && payout.status !== "pending")
      return { error: "Pagamento deve estar pendente ou em processamento" };

    const now = new Date();
    await tx
      .update(payouts)
      .set({
        status: "paid",
        paidAt: now,
        pixTransactionId: transactionId ?? null,
        updatedAt: now,
      })
      .where(eq(payouts.id, parsed.data));

    return { data: { id: parsed.data, status: "paid" } };
  });
}

// ---------------------------------------------------------------------------
// setPayoutMethod — Configure creator's payout preferences
// ---------------------------------------------------------------------------

export async function setPayoutMethod(
  creatorId: string,
  input: z.infer<typeof payoutMethodSchema>,
): Promise<ActionResult<{ creatorId: string; paymentMethod: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:payouts:write")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(creatorId);
  if (!idParsed.success) return { error: "ID do creator invalido" };

  const parsed = payoutMethodSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  return withTenantContext(session.tenantId, async (tx) => {
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

    const updateData: Record<string, unknown> = {
      paymentPreference: parsed.data.paymentMethod,
      updatedAt: new Date(),
    };

    if (parsed.data.paymentMethod === "pix" && parsed.data.pixKey) {
      updateData.pixKey = parsed.data.pixKey;
    }

    await tx
      .update(creators)
      .set(updateData)
      .where(eq(creators.id, idParsed.data));

    return {
      data: {
        creatorId: idParsed.data,
        paymentMethod: parsed.data.paymentMethod,
      },
    };
  });
}
