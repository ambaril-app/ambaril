/**
 * Shipping Capability — freight calculation and tracking
 * Provider examples: Correios, Melhor Envio, mock
 */

export interface ShippingCapability {
  calculateFreight(params: {
    tenantId: string;
    originZip: string;
    destinationZip: string;
    items: Array<{
      weightGrams: number;
      lengthCm: number;
      widthCm: number;
      heightCm: number;
    }>;
  }): Promise<
    Array<{
      carrier: string;
      service: string;
      priceCents: number;
      deliveryDays: number;
    }>
  >;

  createShipment(params: {
    tenantId: string;
    orderId: string;
    carrier: string;
    service: string;
  }): Promise<{ trackingCode: string; labelUrl: string }>;

  getTracking(params: {
    tenantId: string;
    trackingCode: string;
  }): Promise<Array<{ status: string; location: string; timestamp: Date }>>;
}
