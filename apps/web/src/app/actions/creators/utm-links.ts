"use server";

import { db } from "@ambaril/db";
import {
  eq,
  and,
} from "drizzle-orm";
import {
  creators,
  coupons,
} from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import { utmLinkSchema } from "@ambaril/shared/schemas";
import { uuidSchema } from "@ambaril/shared/validators";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

// ---------------------------------------------------------------------------
// Base URL for UTM links (per-tenant, fallback to hardcoded)
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = "https://ciena.com.br";

// ---------------------------------------------------------------------------
// generateUtmLink — Generate a UTM-tagged link for a creator
// ---------------------------------------------------------------------------

export async function generateUtmLink(
  creatorId: string,
  input: z.infer<typeof utmLinkSchema>,
): Promise<ActionResult<{ url: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:utm:read")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(creatorId);
  if (!idParsed.success) return { error: "ID do creator invalido" };

  const parsed = utmLinkSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  return withTenantContext(session.tenantId, async (tx) => {
    // Get creator with coupon
    const [creator] = await tx
      .select({
        id: creators.id,
        name: creators.name,
        couponId: creators.couponId,
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

    // Get coupon code for utm_content
    let couponCode = "NONE";
    if (creator.couponId) {
      const [coupon] = await tx
        .select({ code: coupons.code })
        .from(coupons)
        .where(eq(coupons.id, creator.couponId))
        .limit(1);

      if (coupon) {
        couponCode = coupon.code;
      }
    }

    // Build UTM URL
    const baseUrl = DEFAULT_BASE_URL; // TODO: Use tenant domain when available
    const params = new URLSearchParams({
      utm_source: parsed.data.platform,
      utm_medium: "creator",
      utm_campaign: parsed.data.campaignName ?? "organic",
      utm_content: couponCode,
    });

    const url = `${baseUrl}?${params.toString()}`;

    return { data: { url } };
  });
}
