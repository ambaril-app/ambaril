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
  type Capability,
} from "@/lib/credentials";

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
      .select()
      .from(integrationProviders)
      .where(eq(integrationProviders.isActive, true)),
    db
      .select()
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
    await saveCredentials(
      session.tenantId,
      providerId,
      capability as Capability,
      credentials,
    );
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
    await removeCredentials(session.tenantId, capability as Capability);
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
    const creds = await getCredentials(
      session.tenantId,
      capability as Capability,
    );

    if (!creds) {
      return { success: false, error: "Nenhuma credencial configurada" };
    }

    if (capability === "ecommerce") {
      // Validate Shopify credentials by checking required fields are present
      if (!creds.shop || !creds.clientId || !creds.clientSecret) {
        return {
          success: false,
          error: "Credenciais do Shopify incompletas",
        };
      }
      // Lightweight check: verify the shop field looks like a valid myshopify domain
      const shopPattern = /^[a-z0-9-]+\.myshopify\.com$/i;
      if (!shopPattern.test(creds.shop)) {
        return {
          success: false,
          error: "Domínio do Shopify inválido (ex: loja.myshopify.com)",
        };
      }
    } else if (capability === "checkout") {
      if (!creds.apiUrl || !creds.apiKey) {
        return {
          success: false,
          error: "Credenciais do Yever incompletas",
        };
      }
      try {
        new URL(creds.apiUrl);
      } catch {
        return { success: false, error: "URL do Yever inválida" };
      }
    } else if (capability === "social") {
      if (!creds.accessToken || !creds.businessAccountId) {
        return {
          success: false,
          error: "Credenciais do Instagram incompletas",
        };
      }
    } else if (capability === "messaging") {
      if (!creds.apiKey) {
        return {
          success: false,
          error: "API key do Resend ausente",
        };
      }
    } else if (capability === "storage") {
      if (!creds.accountId || !creds.accessKeyId || !creds.secretAccessKey) {
        return {
          success: false,
          error: "Credenciais do Cloudflare R2 incompletas",
        };
      }
    }

    await markIntegrationTested(session.tenantId, capability as Capability);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao testar conexão",
    };
  }
}
