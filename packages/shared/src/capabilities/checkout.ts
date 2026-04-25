/**
 * Checkout Capability — payment processing for orders
 * Provider examples: Stripe, PagSeguro, Pix, mock
 */

export interface CheckoutCapability {
  createCheckoutSession(params: {
    tenantId: string;
    orderId: string;
    amountCents: number;
    currency: string;
    returnUrl: string;
  }): Promise<{ sessionId: string; url: string }>;

  getPaymentStatus(params: {
    tenantId: string;
    sessionId: string;
  }): Promise<{ status: "pending" | "paid" | "failed" | "refunded" }>;

  processRefund(params: {
    tenantId: string;
    sessionId: string;
    amountCents: number;
    reason: string;
  }): Promise<{ refundId: string }>;
}
