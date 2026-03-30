// Provider registration — reads credentials from global.tenant_integrations per tenant.
// Platform infrastructure (R2, Resend) stays env-based — not per-tenant.

import { registerProvider } from "@ambaril/shared/integrations";
import { ShopifyEcommerceProvider } from "./shopify-provider";
import { YeverCheckoutProvider } from "./yever-provider";
import { ResendMessagingProvider } from "./resend-provider";
import { R2StorageProvider } from "./r2-provider";
import { InstagramSocialProvider } from "./instagram-provider";
import { getCredentials } from "../credentials";

let registered = false;

export function registerAllProviders(): void {
  if (registered) return;
  registered = true;

  // Per-tenant providers — resolve credentials from DB
  registerProvider("ecommerce", async (tenantId) => {
    const creds = await getCredentials(tenantId, "ecommerce");
    if (!creds) return new ShopifyEcommerceProvider(); // no credentials → provider returns empty
    return new ShopifyEcommerceProvider({
      shop: creds.shop ?? "",
      clientId: creds.clientId ?? "",
      clientSecret: creds.clientSecret ?? "",
    });
  });

  registerProvider("checkout", async (tenantId) => {
    const creds = await getCredentials(tenantId, "checkout");
    if (!creds) return new YeverCheckoutProvider();
    return new YeverCheckoutProvider({
      apiUrl: creds.apiUrl ?? "",
      apiKey: creds.apiKey ?? "",
    });
  });

  registerProvider("social", async (tenantId) => {
    const creds = await getCredentials(tenantId, "social");
    if (!creds) return new InstagramSocialProvider();
    return new InstagramSocialProvider({
      accessToken: creds.accessToken ?? "",
      businessAccountId: creds.businessAccountId ?? "",
    });
  });

  // Platform infrastructure — env-based, not per-tenant
  registerProvider("messaging", async (_tenantId) => new ResendMessagingProvider());
  registerProvider("storage", async (_tenantId) => new R2StorageProvider());
}
