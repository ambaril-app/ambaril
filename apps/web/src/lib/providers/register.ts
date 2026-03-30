// Provider registration — called once at app startup.
// Registers all provider factories so modules can resolve them via getProvider().

import { registerProvider } from "@ambaril/shared/integrations";
import { ShopifyEcommerceProvider } from "./shopify-provider";
import { YeverCheckoutProvider } from "./yever-provider";
import { ResendMessagingProvider } from "./resend-provider";
import { R2StorageProvider } from "./r2-provider";
import { InstagramSocialProvider } from "./instagram-provider";

let registered = false;

export function registerAllProviders(): void {
  if (registered) return;
  registered = true;

  // Phase 1.5: All tenants share the same env-based providers.
  // Phase 2+: Resolve credentials from DB per tenant via global.tenant_integrations.
  registerProvider("ecommerce", async (_tenantId) => new ShopifyEcommerceProvider());
  registerProvider("checkout", async (_tenantId) => new YeverCheckoutProvider());
  registerProvider("messaging", async (_tenantId) => new ResendMessagingProvider());
  registerProvider("storage", async (_tenantId) => new R2StorageProvider());
  registerProvider("social", async (_tenantId) => new InstagramSocialProvider());
}
