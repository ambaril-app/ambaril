"use server";

import { db } from "@ambaril/db";
import { creators } from "@ambaril/db/schema";
import { eq, and } from "drizzle-orm";
import { getTenantSession } from "@/lib/tenant";
import { createCreatorSession } from "@/lib/creator-auth";

/**
 * Create a preview session for a creator (admin only).
 * Opens a new tab showing the creator portal as that creator.
 */
export async function previewCreatorPortal(
  creatorId: string,
): Promise<{ error?: string; redirectUrl?: string }> {
  const session = await getTenantSession();

  if (session.role !== "admin") {
    return { error: "Apenas administradores podem pre-visualizar portais" };
  }

  // Fetch creator from DB
  const result = await db
    .select({
      id: creators.id,
      email: creators.email,
      tenantId: creators.tenantId,
    })
    .from(creators)
    .where(
      and(
        eq(creators.id, creatorId),
        eq(creators.tenantId, session.tenantId),
      ),
    )
    .limit(1);

  const creator = result[0];
  if (!creator) {
    return { error: "Creator nao encontrado" };
  }

  // Create a preview session (sets the creator cookie with preview flag)
  await createCreatorSession(creator.id, creator.tenantId, creator.email, {
    preview: true,
  });

  return { redirectUrl: "/creators/dashboard" };
}
