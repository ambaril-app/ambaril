/**
 * E-commerce Capability — product sync, order import, inventory sync
 * Provider examples: Shopify, WooCommerce, manual, mock
 */

export interface EcommerceProduct {
  externalId: string;
  title: string;
  variants: Array<{
    externalId: string;
    sku: string;
    priceCents: number;
    inventoryQuantity: number;
  }>;
}

export interface EcommerceOrder {
  externalId: string;
  orderNumber: string;
  totalCents: number;
  status: string;
  customer: {
    name: string;
    email: string;
  };
  lineItems: Array<{
    sku: string;
    quantity: number;
    priceCents: number;
  }>;
}

export interface EcommerceCapability {
  /** Sync products from external platform */
  syncProducts(params: {
    tenantId: string;
    since?: Date;
  }): Promise<EcommerceProduct[]>;

  /** Import orders from external platform */
  importOrders(params: {
    tenantId: string;
    since?: Date;
    status?: string;
  }): Promise<EcommerceOrder[]>;

  /** Update inventory on external platform */
  updateInventory(params: {
    tenantId: string;
    updates: Array<{ sku: string; quantity: number }>;
  }): Promise<void>;
}
