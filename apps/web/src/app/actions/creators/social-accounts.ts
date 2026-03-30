"use server";

import { db } from "@ambaril/db";
import { eq, and, notInArray } from "drizzle-orm";
import { socialAccounts, creators } from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import { socialAccountsSchema } from "@ambaril/shared/schemas";
import type { TenantSessionData } from "@ambaril/shared/types";
import { ZodError } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

function assertPermission(session: TenantSessionData, perm: string) {
  if (session.permissions.includes("*")) return;
  if (!session.permissions.includes(perm)) throw new Error("Acesso negado");
}

function formatZodError(err: ZodError): string {
  return err.errors.map((e) => e.message).join("; ");
}

// ---------------------------------------------------------------------------
// Social account row type
// ---------------------------------------------------------------------------

interface SocialAccountRow {
  id: string;
  platform: "instagram" | "tiktok" | "youtube" | "pinterest" | "twitter" | "other";
  handle: string;
  url: string | null;
  followers: number | null;
  isPrimary: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// 1. listSocialAccounts — All social accounts for a creator
// ---------------------------------------------------------------------------

export async function listSocialAccounts(
  creatorId: string,
): Promise<ActionResult<SocialAccountRow[]>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:read");

    if (!creatorId || !/^[0-9a-f-]{36}$/i.test(creatorId)) {
      return { error: "ID invalido" };
    }

    // Verify creator belongs to tenant
    const creatorExists = await db
      .select({ id: creators.id })
      .from(creators)
      .where(
        and(
          eq(creators.id, creatorId),
          eq(creators.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!creatorExists[0]) {
      return { error: "Creator nao encontrado" };
    }

    const rows = await db
      .select({
        id: socialAccounts.id,
        platform: socialAccounts.platform,
        handle: socialAccounts.handle,
        url: socialAccounts.url,
        followers: socialAccounts.followers,
        isPrimary: socialAccounts.isPrimary,
        verifiedAt: socialAccounts.verifiedAt,
        createdAt: socialAccounts.createdAt,
        updatedAt: socialAccounts.updatedAt,
      })
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.creatorId, creatorId),
          eq(socialAccounts.tenantId, session.tenantId),
        ),
      );

    return { data: rows };
  } catch (err) {
    if (err instanceof Error && err.message === "Acesso negado") {
      return { error: "Acesso negado" };
    }
    console.error("[listSocialAccounts]", err);
    return { error: "Erro ao listar contas sociais" };
  }
}

// ---------------------------------------------------------------------------
// 2. upsertSocialAccounts — Sync social accounts for a creator
//    Deletes removed accounts, updates existing, inserts new.
//    All in one transaction.
// ---------------------------------------------------------------------------

export async function upsertSocialAccounts(
  creatorId: string,
  input: Record<string, unknown>,
): Promise<ActionResult<{ synced: number }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:write");

    if (!creatorId || !/^[0-9a-f-]{36}$/i.test(creatorId)) {
      return { error: "ID invalido" };
    }

    const parsed = socialAccountsSchema.safeParse(input);
    if (!parsed.success) {
      return { error: formatZodError(parsed.error) };
    }

    const { accounts } = parsed.data;

    const syncedCount = await withTenantContext(session.tenantId, async (tx) => {
      // Verify creator exists and belongs to tenant
      const creatorExists = await tx
        .select({ id: creators.id })
        .from(creators)
        .where(
          and(
            eq(creators.id, creatorId),
            eq(creators.tenantId, session.tenantId),
          ),
        )
        .limit(1);

      if (!creatorExists[0]) {
        throw new Error("Creator nao encontrado");
      }

      // Fetch existing accounts for this creator
      const existingAccounts = await tx
        .select({
          id: socialAccounts.id,
          platform: socialAccounts.platform,
          handle: socialAccounts.handle,
        })
        .from(socialAccounts)
        .where(
          and(
            eq(socialAccounts.creatorId, creatorId),
            eq(socialAccounts.tenantId, session.tenantId),
          ),
        );

      // Build a map of existing: platform+handle -> id
      const existingMap = new Map<string, string>();
      for (const acct of existingAccounts) {
        existingMap.set(`${acct.platform}:${acct.handle}`, acct.id);
      }

      // Track which IDs are still present
      const keptIds: string[] = [];

      for (const account of accounts) {
        const key = `${account.platform}:${account.handle}`;
        const existingId = existingMap.get(key);

        if (existingId) {
          // Update existing account
          keptIds.push(existingId);
          await tx
            .update(socialAccounts)
            .set({
              url: account.url ?? null,
              isPrimary: account.isPrimary ?? false,
              updatedAt: new Date(),
            })
            .where(eq(socialAccounts.id, existingId));
        } else {
          // Insert new account
          const inserted = await tx
            .insert(socialAccounts)
            .values({
              tenantId: session.tenantId,
              creatorId,
              platform: account.platform,
              handle: account.handle,
              url: account.url ?? null,
              isPrimary: account.isPrimary ?? false,
            })
            .returning({ id: socialAccounts.id });

          if (inserted[0]) {
            keptIds.push(inserted[0].id);
          }
        }
      }

      // Delete accounts that are no longer in the input
      if (keptIds.length > 0) {
        await tx
          .delete(socialAccounts)
          .where(
            and(
              eq(socialAccounts.creatorId, creatorId),
              eq(socialAccounts.tenantId, session.tenantId),
              notInArray(socialAccounts.id, keptIds),
            ),
          );
      } else {
        // No accounts left — delete all
        await tx
          .delete(socialAccounts)
          .where(
            and(
              eq(socialAccounts.creatorId, creatorId),
              eq(socialAccounts.tenantId, session.tenantId),
            ),
          );
      }

      return accounts.length;
    });

    return { data: { synced: syncedCount } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Acesso negado") return { error: "Acesso negado" };
      if (err.message === "Creator nao encontrado")
        return { error: "Creator nao encontrado" };
    }
    console.error("[upsertSocialAccounts]", err);
    return { error: "Erro ao sincronizar contas sociais" };
  }
}
