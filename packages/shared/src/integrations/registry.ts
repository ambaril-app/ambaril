// Provider Registry — type-safe resolution of capability providers per tenant.
// Providers register their factory functions at app startup.
// Modules resolve providers at runtime via getProvider(tenantId, capability).

import type { Capability, CapabilityMap, ProviderFactory } from "./types";

/**
 * Internal registry storing factory functions keyed by capability.
 * Populated at app startup by apps/web/src/lib/providers/register.ts.
 */
const registry = new Map<Capability, ProviderFactory<Capability>>();

/**
 * Register a provider factory for a given capability.
 *
 * @example
 * ```ts
 * registerProvider("ecommerce", async (tenantId) => {
 *   const config = await loadTenantConfig(tenantId, "shopify");
 *   return new ShopifyEcommerceProvider(config);
 * });
 * ```
 */
export function registerProvider<K extends Capability>(
  capability: K,
  factory: ProviderFactory<K>,
): void {
  registry.set(capability, factory as ProviderFactory<Capability>);
}

/**
 * Resolve a provider for a given tenant and capability.
 * Throws if no provider is registered for the requested capability.
 *
 * @example
 * ```ts
 * const ecommerce = await getProvider(tenantId, "ecommerce");
 * const coupons = await ecommerce.listCoupons();
 * ```
 */
export async function getProvider<K extends Capability>(
  tenantId: string,
  capability: K,
): Promise<CapabilityMap[K]> {
  const factory = registry.get(capability);

  if (!factory) {
    throw new Error(
      `[Registry] No provider registered for capability "${capability}". ` +
        `Register one in apps/web/src/lib/providers/register.ts`,
    );
  }

  return factory(tenantId) as Promise<CapabilityMap[K]>;
}

/**
 * Check whether a provider is registered for a given capability.
 * Useful for conditional feature rendering in the UI.
 */
export function hasProvider(capability: Capability): boolean {
  return registry.has(capability);
}

/**
 * Return all capabilities that currently have registered providers.
 * Used by the admin settings UI to show active integrations.
 */
export function getRegisteredCapabilities(): Capability[] {
  return [...registry.keys()];
}
