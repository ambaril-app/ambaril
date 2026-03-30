// Shopify provider — wraps lib/shopify.ts behind EcommerceProvider interface.
// Modules consume EcommerceProvider, never Shopify directly.

import type {
  EcommerceProvider,
  EcommerceCoupon,
  CreateCouponInput,
  EcommerceProduct,
} from "@ambaril/shared/integrations";
import { createDiscountCode, getProducts, createShopifyClient } from "../shopify";

interface ShopifyCredentials {
  shop: string;
  clientId: string;
  clientSecret: string;
}

export class ShopifyEcommerceProvider implements EcommerceProvider {
  private credentials: ShopifyCredentials | undefined;

  constructor(credentials?: ShopifyCredentials) {
    this.credentials = credentials;
  }

  async listCoupons(): Promise<EcommerceCoupon[]> {
    // Shopify doesn't have a simple "list discount codes" query in their current API.
    // Coupons are stored in DB after import via the setup wizard.
    // This will be populated when the setup wizard imports coupons via GraphQL.
    return [];
  }

  async createCoupon(input: CreateCouponInput): Promise<{ id: string }> {
    if (this.credentials) {
      const client = createShopifyClient(this.credentials);
      return client.createDiscountCode(input.code, parseFloat(input.discountValue));
    }

    if (input.discountType === "fixed") {
      return createDiscountCode(input.code, parseFloat(input.discountValue));
    }
    // Shopify percentage discounts need a different mutation (discountCodeBasicCreate
    // with percentage value). For now, both paths use the fixed amount mutation.
    // TODO: Implement percentage discount creation via Shopify GraphQL
    return createDiscountCode(input.code, parseFloat(input.discountValue));
  }

  async listProducts(limit?: number): Promise<EcommerceProduct[]> {
    if (this.credentials) {
      const client = createShopifyClient(this.credentials);
      const products = await client.getProducts(limit ?? 10);
      return products.map((p) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
      }));
    }

    const products = await getProducts(limit ?? 10);
    return products.map((p) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
    }));
  }

  async testConnection(): Promise<boolean> {
    if (!this.credentials) return false;
    const client = createShopifyClient(this.credentials);
    return client.testConnection();
  }
}
