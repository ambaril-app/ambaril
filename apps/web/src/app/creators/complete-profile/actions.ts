"use server";

import { db } from "@ambaril/db";
import { eq } from "drizzle-orm";
import { creators, socialAccounts } from "@ambaril/db/schema";
import { requireCreatorSession } from "@/lib/creator-auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export async function completeCreatorProfile(data: {
  instagram?: string;
  tiktok?: string;
  phone?: string;
  clothingSize?: string;
  pixKeyType?: string;
  pixKey?: string;
  contentRightsAccepted: boolean;
}): Promise<ActionResult<{ ok: true }>> {
  try {
    const session = await requireCreatorSession();
    const creatorId = session.creatorId;

    if (!data.contentRightsAccepted) {
      return { error: "Você precisa aceitar os termos de uso de conteúdo." };
    }

    // Build update payload — only include fields that were provided
    const updatePayload: Record<string, unknown> = {
      contentRightsAccepted: data.contentRightsAccepted,
      updatedAt: new Date(),
    };

    if (data.phone) {
      updatePayload.phone = data.phone;
    }
    if (data.clothingSize) {
      updatePayload.clothingSize = data.clothingSize;
    }
    if (data.pixKeyType) {
      updatePayload.pixKeyType = data.pixKeyType;
    }
    if (data.pixKey) {
      updatePayload.pixKey = data.pixKey;
    }

    // Update creator record
    await db
      .update(creators)
      .set(updatePayload)
      .where(eq(creators.id, creatorId));

    // Upsert social accounts
    if (data.instagram) {
      await db
        .insert(socialAccounts)
        .values({
          creatorId,
          tenantId: session.tenantId,
          platform: "instagram",
          handle: data.instagram,
        })
        .onConflictDoNothing();
    }

    if (data.tiktok) {
      await db
        .insert(socialAccounts)
        .values({
          creatorId,
          tenantId: session.tenantId,
          platform: "tiktok",
          handle: data.tiktok,
        })
        .onConflictDoNothing();
    }

    return { data: { ok: true } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao atualizar perfil." };
  }
}
