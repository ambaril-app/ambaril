"use server";

import { db } from "@ambaril/db";
import { integrationProviders, tenantIntegrations } from "@ambaril/db/schema";
import { eq } from "drizzle-orm";
import { getTenantSession } from "@/lib/tenant";
import {
  saveCredentials,
  removeCredentials,
  markIntegrationTested,
  getCredentials,
} from "@/lib/credentials";
import { z } from "zod";

const VALID_CAPABILITIES = [
  "ecommerce",
  "checkout",
  "messaging",
  "storage",
  "social",
] as const;
const capabilitySchema = z.enum(VALID_CAPABILITIES);

// ─── Types ─────────────────────────────────────────────────

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "url";
  required: boolean;
}

export interface ProviderWithStatus {
  providerId: string;
  capability: string;
  name: string;
  description: string | null;
  icon: string | null;
  configSchema: ConfigField[];
  isConnected: boolean;
  isActive: boolean;
  lastTestedAt: Date | null;
}

// ─── Actions ───────────────────────────────────────────────

/**
 * Load all providers from catalog with connection status for current tenant.
 */
export async function getIntegrationsData(): Promise<ProviderWithStatus[]> {
  const session = await getTenantSession();

  const [providers, connections] = await Promise.all([
    db
      .select({
        providerId: integrationProviders.providerId,
        capability: integrationProviders.capability,
        name: integrationProviders.name,
        description: integrationProviders.description,
        icon: integrationProviders.icon,
        configSchema: integrationProviders.configSchema,
      })
      .from(integrationProviders)
      .where(eq(integrationProviders.isActive, true)),
    db
      .select({
        capability: tenantIntegrations.capability,
        isActive: tenantIntegrations.isActive,
        lastTestedAt: tenantIntegrations.lastTestedAt,
      })
      .from(tenantIntegrations)
      .where(eq(tenantIntegrations.tenantId, session.tenantId)),
  ]);

  const connectionMap = new Map(connections.map((c) => [c.capability, c]));

  return providers.map((p) => {
    const conn = connectionMap.get(p.capability);
    const schema = p.configSchema as unknown as ConfigField[];
    return {
      providerId: p.providerId,
      capability: p.capability,
      name: p.name,
      description: p.description,
      icon: p.icon,
      configSchema: Array.isArray(schema) ? schema : [],
      isConnected: conn?.isActive === true,
      isActive: conn?.isActive === true,
      lastTestedAt: conn?.lastTestedAt ?? null,
    };
  });
}

/**
 * Save integration credentials (encrypt + upsert to DB).
 */
export async function saveIntegration(
  providerId: string,
  capability: string,
  credentials: Record<string, string>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getTenantSession();

    // Permission check: only admin can manage integrations
    if (
      session.effectiveRole !== "admin" &&
      !session.effectivePermissions.includes("*")
    ) {
      return { success: false, error: "Permissão negada" };
    }

    // Validate capability
    const parsed = capabilitySchema.safeParse(capability);
    if (!parsed.success) {
      return { success: false, error: "Capability inválida" };
    }

    // Validate providerId is non-empty
    if (
      !providerId ||
      typeof providerId !== "string" ||
      providerId.trim().length === 0
    ) {
      return { success: false, error: "Provider inválido" };
    }

    // Validate credentials are non-empty strings
    for (const [key, value] of Object.entries(credentials)) {
      if (typeof value !== "string" || value.trim().length === 0) {
        return { success: false, error: `Campo "${key}" não pode estar vazio` };
      }
    }

    await saveCredentials(
      session.tenantId,
      providerId.trim(),
      parsed.data,
      credentials,
    );

    // Audit
    const { audit } = await import("@/lib/audit");
    audit(session, {
      action: "integration_connect",
      resourceType: "integration",
      resourceId: providerId,
      details: { capability: parsed.data },
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao salvar",
    };
  }
}

/**
 * Remove (soft-disconnect) an integration.
 */
export async function disconnectIntegration(
  capability: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getTenantSession();

    // Permission check: only admin can manage integrations
    if (
      session.effectiveRole !== "admin" &&
      !session.effectivePermissions.includes("*")
    ) {
      return { success: false, error: "Permissão negada" };
    }

    const parsed = capabilitySchema.safeParse(capability);
    if (!parsed.success) {
      return { success: false, error: "Capability inválida" };
    }

    await removeCredentials(session.tenantId, parsed.data);

    // Audit
    const { audit } = await import("@/lib/audit");
    audit(session, {
      action: "integration_disconnect",
      resourceType: "integration",
      details: { capability: parsed.data },
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao desconectar",
    };
  }
}

/**
 * Test connection by loading credentials and performing a lightweight check.
 * Returns success/error for UI feedback.
 */
export async function testConnection(
  capability: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getTenantSession();

    // Permission check: only admin can test integrations
    if (
      session.effectiveRole !== "admin" &&
      !session.effectivePermissions.includes("*")
    ) {
      return { success: false, error: "Permissão negada" };
    }

    const parsed = capabilitySchema.safeParse(capability);
    if (!parsed.success) {
      return { success: false, error: "Capability inválida" };
    }

    const creds = await getCredentials(session.tenantId, parsed.data);

    if (!creds) {
      return { success: false, error: "Nenhuma credencial configurada" };
    }

    if (parsed.data === "ecommerce") {
      if (!creds.shop || !creds.clientId || !creds.clientSecret) {
        return { success: false, error: "Credenciais do Shopify incompletas" };
      }
      const shopPattern = /^[a-z0-9-]+\.myshopify\.com$/i;
      if (!shopPattern.test(creds.shop)) {
        return {
          success: false,
          error: "Domínio do Shopify inválido (ex: loja.myshopify.com)",
        };
      }
    } else if (parsed.data === "checkout") {
      if (!creds.apiKey) {
        return { success: false, error: "Token do Yever ausente" };
      }
    } else if (parsed.data === "social") {
      if (!creds.accessToken || !creds.businessAccountId) {
        return {
          success: false,
          error: "Credenciais do Instagram incompletas",
        };
      }
    } else if (parsed.data === "messaging") {
      if (!creds.apiKey) {
        return { success: false, error: "API key do Resend ausente" };
      }
    } else if (parsed.data === "storage") {
      if (!creds.accountId || !creds.accessKeyId || !creds.secretAccessKey) {
        return {
          success: false,
          error: "Credenciais do Cloudflare R2 incompletas",
        };
      }
    }

    await markIntegrationTested(session.tenantId, parsed.data);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao testar conexão",
    };
  }
}
