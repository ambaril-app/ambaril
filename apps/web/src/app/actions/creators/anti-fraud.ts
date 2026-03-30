"use server";

import { createHash } from "crypto";
import { db } from "@ambaril/db";
import {
  eq,
  and,
  desc,
  sql,
  count,
  isNotNull,
} from "drizzle-orm";
import {
  creators,
  salesAttributions,
} from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import { antiFraudResolveSchema } from "@ambaril/shared/schemas";
import { uuidSchema, paginationSchema } from "@ambaril/shared/validators";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashCpf(cpf: string): string {
  return createHash("sha256").update(cpf).digest("hex");
}

// ---------------------------------------------------------------------------
// checkSelfPurchase — Compare buyer CPF hash to creator CPF hash
// ---------------------------------------------------------------------------

export async function checkSelfPurchase(
  attributionId: string,
): Promise<ActionResult<{ selfPurchase: boolean }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:anti-fraud:read")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(attributionId);
  if (!idParsed.success) return { error: "ID de atribuicao invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [attribution] = await tx
      .select()
      .from(salesAttributions)
      .where(
        and(
          eq(salesAttributions.id, idParsed.data),
          eq(salesAttributions.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!attribution) return { error: "Atribuicao nao encontrada" };

    if (!attribution.buyerCpfHash) {
      return { data: { selfPurchase: false } };
    }

    // Get creator CPF
    const [creator] = await tx
      .select({ cpf: creators.cpf })
      .from(creators)
      .where(
        and(
          eq(creators.id, attribution.creatorId),
          eq(creators.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!creator) return { error: "Creator nao encontrado" };

    const creatorCpfHash = hashCpf(creator.cpf);
    const selfPurchase = attribution.buyerCpfHash === creatorCpfHash;

    return { data: { selfPurchase } };
  });
}

// ---------------------------------------------------------------------------
// checkMonthlyCap — Compare current month sales to monthly cap
// ---------------------------------------------------------------------------

export async function checkMonthlyCap(
  creatorId: string,
): Promise<
  ActionResult<{ exceeded: boolean; amount: string; cap: string }>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:anti-fraud:read")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(creatorId);
  if (!idParsed.success) return { error: "ID do creator invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [creator] = await tx
      .select({
        currentMonthSalesAmount: creators.currentMonthSalesAmount,
        monthlyCap: creators.monthlyCap,
      })
      .from(creators)
      .where(
        and(
          eq(creators.id, idParsed.data),
          eq(creators.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!creator) return { error: "Creator nao encontrado" };

    const amount = parseFloat(creator.currentMonthSalesAmount);
    const cap = parseFloat(creator.monthlyCap);

    return {
      data: {
        exceeded: amount > cap,
        amount: amount.toFixed(2),
        cap: cap.toFixed(2),
      },
    };
  });
}

// ---------------------------------------------------------------------------
// listFlags — List flagged attributions (self-purchase or cap exceeded)
// ---------------------------------------------------------------------------

interface FlaggedAttribution {
  attribution: typeof salesAttributions.$inferSelect;
  flagReasons: string[];
}

const listFlagsInput = paginationSchema;

export async function listFlags(
  input?: z.infer<typeof listFlagsInput>,
): Promise<
  ActionResult<{
    items: FlaggedAttribution[];
    total: number;
    page: number;
    perPage: number;
  }>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:anti-fraud:read")
  )
    return { error: "Acesso negado" };

  const parsed = listFlagsInput.safeParse(input ?? {});
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  const { page, per_page } = parsed.data;

  return withTenantContext(session.tenantId, async (tx) => {
    // Get all attributions that have buyerCpfHash (potential self-purchase)
    const attributions = await tx
      .select()
      .from(salesAttributions)
      .where(
        and(
          eq(salesAttributions.tenantId, session.tenantId),
          isNotNull(salesAttributions.buyerCpfHash),
        ),
      )
      .orderBy(desc(salesAttributions.createdAt));

    const flaggedItems: FlaggedAttribution[] = [];

    for (const attr of attributions) {
      const flagReasons: string[] = [];

      // Check self-purchase
      if (attr.buyerCpfHash) {
        const [creator] = await tx
          .select({ cpf: creators.cpf })
          .from(creators)
          .where(eq(creators.id, attr.creatorId))
          .limit(1);

        if (creator) {
          const creatorCpfHash = hashCpf(creator.cpf);
          if (attr.buyerCpfHash === creatorCpfHash) {
            flagReasons.push("Auto-compra detectada");
          }
        }
      }

      // Check monthly cap
      const [creator] = await tx
        .select({
          currentMonthSalesAmount: creators.currentMonthSalesAmount,
          monthlyCap: creators.monthlyCap,
        })
        .from(creators)
        .where(eq(creators.id, attr.creatorId))
        .limit(1);

      if (creator) {
        const amount = parseFloat(creator.currentMonthSalesAmount);
        const cap = parseFloat(creator.monthlyCap);
        if (amount > cap) {
          flagReasons.push("Limite mensal excedido");
        }
      }

      if (flagReasons.length > 0) {
        flaggedItems.push({ attribution: attr, flagReasons });
      }
    }

    // Manual pagination on the flagged results
    const total = flaggedItems.length;
    const start = (page - 1) * per_page;
    const paginatedItems = flaggedItems.slice(start, start + per_page);

    return {
      data: {
        items: paginatedItems,
        total,
        page,
        perPage: per_page,
      },
    };
  });
}

// ---------------------------------------------------------------------------
// resolveFlag — Suspend creator or clear attribution
// ---------------------------------------------------------------------------

export async function resolveFlag(
  attributionId: string,
  input: z.infer<typeof antiFraudResolveSchema>,
): Promise<ActionResult<{ id: string; action: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:anti-fraud:write")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(attributionId);
  if (!idParsed.success) return { error: "ID de atribuicao invalido" };

  const parsed = antiFraudResolveSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [attribution] = await tx
      .select()
      .from(salesAttributions)
      .where(
        and(
          eq(salesAttributions.id, idParsed.data),
          eq(salesAttributions.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!attribution) return { error: "Atribuicao nao encontrada" };

    const now = new Date();

    if (parsed.data.action === "suspend") {
      // Cancel the attribution
      await tx
        .update(salesAttributions)
        .set({
          status: "cancelled",
          adjustmentReason: parsed.data.reason,
          updatedAt: now,
        })
        .where(eq(salesAttributions.id, idParsed.data));

      // Suspend the creator
      await tx
        .update(creators)
        .set({
          status: "suspended",
          suspensionReason: parsed.data.reason,
          updatedAt: now,
        })
        .where(eq(creators.id, attribution.creatorId));
    } else {
      // Clear: confirm the attribution as valid
      await tx
        .update(salesAttributions)
        .set({
          status: "confirmed",
          confirmedAt: now,
          adjustmentReason: `Liberado: ${parsed.data.reason}`,
          updatedAt: now,
        })
        .where(eq(salesAttributions.id, idParsed.data));
    }

    return { data: { id: idParsed.data, action: parsed.data.action } };
  });
}
