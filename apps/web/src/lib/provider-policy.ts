// Provider Policy Engine — explicit, fail-closed capability authorization.
// Before ANY provider call, this engine checks:
//   1. Is the tenant's plan authorized for this capability?
//   2. Has the tenant configured an active integration for this capability?
// If either check fails → DENY. No fallbacks, no defaults.

import { db } from "@ambaril/db";
import {
  tenants,
  planCapabilities,
  tenantIntegrations,
} from "@ambaril/db/schema";
import { eq, and } from "drizzle-orm";
import { getProvider } from "@ambaril/shared/integrations";
import type { Capability, CapabilityMap } from "@ambaril/shared/integrations";
import { createLogger } from "./logger";

const logger = createLogger("provider-policy");

export class CapabilityDeniedError extends Error {
  constructor(
    public readonly tenantId: string,
    public readonly capability: string,
    public readonly reason:
      | "plan_not_authorized"
      | "no_active_integration"
      | "tenant_not_found"
      | "tenant_inactive",
  ) {
    super(
      `Capability "${capability}" denied for tenant ${tenantId}: ${reason}`,
    );
    this.name = "CapabilityDeniedError";
  }
}

/**
 * Check whether a tenant is authorized to use a capability.
 * Returns the denial reason or null if authorized.
 */
export async function checkCapabilityPolicy(
  tenantId: string,
  capability: Capability,
): Promise<
  | { authorized: true }
  | { authorized: false; reason: CapabilityDeniedError["reason"] }
> {
  // 1. Load tenant and their plan
  const tenant = await db
    .select({ id: tenants.id, plan: tenants.plan, isActive: tenants.isActive })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant[0]) {
    return { authorized: false, reason: "tenant_not_found" };
  }

  if (!tenant[0].isActive) {
    return { authorized: false, reason: "tenant_inactive" };
  }

  // 2. Check plan authorizes this capability (fail-closed: no row = DENY)
  const planCap = await db
    .select({ isEnabled: planCapabilities.isEnabled })
    .from(planCapabilities)
    .where(
      and(
        eq(planCapabilities.plan, tenant[0].plan),
        eq(planCapabilities.capability, capability),
      ),
    )
    .limit(1);

  if (!planCap[0] || !planCap[0].isEnabled) {
    return { authorized: false, reason: "plan_not_authorized" };
  }

  // 3. Check tenant has an active integration for this capability
  const integration = await db
    .select({ isActive: tenantIntegrations.isActive })
    .from(tenantIntegrations)
    .where(
      and(
        eq(tenantIntegrations.tenantId, tenantId),
        eq(tenantIntegrations.capability, capability),
      ),
    )
    .limit(1);

  if (!integration[0] || !integration[0].isActive) {
    return { authorized: false, reason: "no_active_integration" };
  }

  return { authorized: true };
}

/**
 * Get an authorized provider for a tenant and capability.
 * This is the ONLY function modules should use to access providers.
 * Replaces direct calls to getProvider() from the registry.
 *
 * @throws CapabilityDeniedError if the tenant is not authorized
 *
 * @example
 * ```ts
 * const ecommerce = await getAuthorizedProvider(session.tenantId, "ecommerce");
 * const products = await ecommerce.listProducts();
 * ```
 */
export async function getAuthorizedProvider<K extends Capability>(
  tenantId: string,
  capability: K,
): Promise<CapabilityMap[K]> {
  const result = await checkCapabilityPolicy(tenantId, capability);

  if (!result.authorized) {
    logger.warn("capability_denied", {
      tenantId,
      capability,
      reason: result.reason,
    });

    throw new CapabilityDeniedError(tenantId, capability, result.reason);
  }

  logger.info("capability_authorized", { tenantId, capability });
  return getProvider(tenantId, capability);
}

/**
 * List all capabilities authorized for a tenant's current plan.
 * Used by the admin UI to show which integrations the tenant can configure.
 */
export async function listAuthorizedCapabilities(
  tenantId: string,
): Promise<Capability[]> {
  const tenant = await db
    .select({ plan: tenants.plan, isActive: tenants.isActive })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant[0] || !tenant[0].isActive) return [];

  const caps = await db
    .select({ capability: planCapabilities.capability })
    .from(planCapabilities)
    .where(
      and(
        eq(planCapabilities.plan, tenant[0].plan),
        eq(planCapabilities.isEnabled, true),
      ),
    );

  return caps.map((c) => c.capability as Capability);
}
