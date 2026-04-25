/**
 * Payments Capability — recurring payments and subscriptions
 * Provider examples: Stripe Billing, Asaas, mock
 */

export interface PaymentsCapability {
  createSubscription(params: {
    tenantId: string;
    customerId: string;
    planId: string;
  }): Promise<{ subscriptionId: string; status: string }>;

  cancelSubscription(params: {
    tenantId: string;
    subscriptionId: string;
  }): Promise<void>;

  listInvoices(params: {
    tenantId: string;
    customerId: string;
  }): Promise<
    Array<{ id: string; amountCents: number; status: string; dueDate: Date }>
  >;
}
