"use server";

import { db } from "@ambaril/db";
import { eq, and, desc } from "drizzle-orm";
import { contentDetections } from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import { uuidSchema } from "@ambaril/shared/validators";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

// ---------------------------------------------------------------------------
// listContentDetections — Creator's detected content posts
// ---------------------------------------------------------------------------

export async function listContentDetections(
  creatorId: string,
): Promise<ActionResult<{ items: (typeof contentDetections.$inferSelect)[] }>> {
  const session = await getTenantSession();

  const idParsed = uuidSchema.safeParse(creatorId);
  if (!idParsed.success) return { error: "ID do creator invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    const items = await tx
      .select()
      .from(contentDetections)
      .where(
        and(
          eq(contentDetections.tenantId, session.tenantId),
          eq(contentDetections.creatorId, idParsed.data),
        ),
      )
      .orderBy(desc(contentDetections.detectedAt))
      .limit(50);

    return { data: { items } };
  });
}
