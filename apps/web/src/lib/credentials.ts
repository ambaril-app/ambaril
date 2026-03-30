// Per-tenant credential storage and retrieval.
// Credentials stored encrypted in global.tenant_integrations.
// Format: { fieldKey: "enc:<base64AesGcm>" }

import { db } from "@ambaril/db";
import { globalSchema } from "@ambaril/db";
import { and, eq } from "drizzle-orm";
import { decrypt, encrypt } from "./crypto";

const { tenantIntegrations } = globalSchema;

export type Capability = "ecommerce" | "checkout" | "messaging" | "storage" | "social";

/**
 * Load and decrypt credentials for a tenant+capability.
 * Returns null if no active integration exists.
 */
export async function getCredentials(
  tenantId: string,
  capability: Capability,
): Promise<Record<string, string> | null> {
  const rows = await db
    .select({ credentials: tenantIntegrations.credentials })
    .from(tenantIntegrations)
    .where(
      and(
        eq(tenantIntegrations.tenantId, tenantId),
        eq(tenantIntegrations.capability, capability),
        eq(tenantIntegrations.isActive, true),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const raw = row.credentials as Record<string, unknown>;
  const result: Record<string, string> = {};

  for (const [k, v] of Object.entries(raw)) {
    if (typeof v !== "string") continue;
    result[k] = v.startsWith("enc:") ? await decrypt(v.slice(4)) : v;
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Encrypt and upsert credentials for a tenant+capability.
 * Uses ON CONFLICT (tenant_id, capability) DO UPDATE.
 */
export async function saveCredentials(
  tenantId: string,
  providerId: string,
  capability: Capability,
  plainCredentials: Record<string, string>,
): Promise<void> {
  const encrypted: Record<string, string> = {};
  for (const [k, v] of Object.entries(plainCredentials)) {
    encrypted[k] = `enc:${await encrypt(v)}`;
  }

  await db
    .insert(tenantIntegrations)
    .values({
      tenantId,
      providerId,
      capability,
      credentials: encrypted,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [tenantIntegrations.tenantId, tenantIntegrations.capability],
      set: {
        providerId,
        credentials: encrypted,
        isActive: true,
        updatedAt: new Date(),
      },
    });
}

/**
 * Mark an integration as inactive (soft disconnect).
 */
export async function removeCredentials(
  tenantId: string,
  capability: Capability,
): Promise<void> {
  await db
    .update(tenantIntegrations)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(tenantIntegrations.tenantId, tenantId),
        eq(tenantIntegrations.capability, capability),
      ),
    );
}

/**
 * Update the last tested timestamp for an integration.
 */
export async function markIntegrationTested(
  tenantId: string,
  capability: Capability,
): Promise<void> {
  await db
    .update(tenantIntegrations)
    .set({ lastTestedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(tenantIntegrations.tenantId, tenantId),
        eq(tenantIntegrations.capability, capability),
      ),
    );
}
