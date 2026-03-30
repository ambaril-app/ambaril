// Yever provider — wraps lib/yever.ts behind CheckoutProvider interface.
// Modules consume CheckoutProvider, never Yever directly.

import type {
  CheckoutProvider,
  CheckoutOrder,
} from "@ambaril/shared/integrations";
import { getOrdersByCoupon, getOrderById, createYeverClient } from "../yever";

interface YeverCredentials {
  apiUrl: string;
  apiKey: string;
}

export class YeverCheckoutProvider implements CheckoutProvider {
  private credentials: YeverCredentials | undefined;

  constructor(credentials?: YeverCredentials) {
    this.credentials = credentials;
  }

  async listOrdersByCoupon(
    couponCode: string,
    since?: Date,
  ): Promise<CheckoutOrder[]> {
    if (this.credentials) {
      const client = createYeverClient(this.credentials);
      const orders = await client.getOrdersByCoupon(couponCode, since);
      return orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: o.total.toFixed(2),
        discount: o.discount.toFixed(2),
        couponCode: o.couponCode,
        customerCpf: o.customerCpf,
        status: o.status,
        createdAt: o.createdAt,
      }));
    }

    const orders = await getOrdersByCoupon(couponCode, since);
    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: o.total.toFixed(2),
      discount: o.discount.toFixed(2),
      couponCode: o.couponCode,
      customerCpf: o.customerCpf,
      status: o.status,
      createdAt: o.createdAt,
    }));
  }

  async getOrder(orderId: string): Promise<CheckoutOrder | null> {
    if (this.credentials) {
      const client = createYeverClient(this.credentials);
      const order = await client.getOrderById(orderId);
      if (!order) return null;
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total.toFixed(2),
        discount: order.discount.toFixed(2),
        couponCode: order.couponCode,
        customerCpf: order.customerCpf,
        status: order.status,
        createdAt: order.createdAt,
      };
    }

    const order = await getOrderById(orderId);
    if (!order) return null;
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total.toFixed(2),
      discount: order.discount.toFixed(2),
      couponCode: order.couponCode,
      customerCpf: order.customerCpf,
      status: order.status,
      createdAt: order.createdAt,
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.credentials) return false;
    const client = createYeverClient(this.credentials);
    return client.testConnection();
  }
}
