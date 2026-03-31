// Yever provider — wraps lib/yever.ts behind CheckoutProvider interface.
// Modules consume CheckoutProvider, never Yever directly.
// NOTE: Yever has no server-side coupon filter — order lookups require full scan.

import type {
  CheckoutProvider,
  CheckoutOrder,
  DiscoveredCoupon,
} from "@ambaril/shared/integrations";
import {
  getOrdersByCoupon,
  getOrderById,
  discoverCouponsFromOrders,
  createYeverClient,
} from "../yever";

interface YeverCredentials {
  apiUrl: string;
  apiKey: string;
}

function mapOrder(o: {
  id: string;
  total: number;
  discount: number;
  couponCode: string | null;
  customerCpf?: string;
  createdAt: string;
  status: string;
}): CheckoutOrder {
  return {
    id: o.id,
    orderNumber: o.id,
    total: o.total.toFixed(2),
    discount: o.discount.toFixed(2),
    couponCode: o.couponCode ?? undefined,
    customerCpf: o.customerCpf,
    status: o.status,
    createdAt: o.createdAt,
  };
}

export class YeverCheckoutProvider implements CheckoutProvider {
  private credentials: YeverCredentials | undefined;

  constructor(credentials?: YeverCredentials) {
    this.credentials = credentials;
  }

  async discoverCoupons(): Promise<DiscoveredCoupon[]> {
    if (this.credentials) {
      const client = createYeverClient(this.credentials);
      const coupons = await client.discoverCouponsFromOrders();
      return coupons.map((c) => ({
        code: c.code,
        orderCount: c.orderCount,
        totalRevenue: c.totalRevenue.toFixed(2),
        totalDiscount: c.totalDiscount.toFixed(2),
      }));
    }

    const coupons = await discoverCouponsFromOrders();
    return coupons.map((c) => ({
      code: c.code,
      orderCount: c.orderCount,
      totalRevenue: c.totalRevenue.toFixed(2),
      totalDiscount: c.totalDiscount.toFixed(2),
    }));
  }

  async listOrdersByCoupon(
    couponCode: string,
    since?: Date,
  ): Promise<CheckoutOrder[]> {
    if (this.credentials) {
      const client = createYeverClient(this.credentials);
      const orders = await client.getOrdersByCoupon(couponCode, since);
      return orders.map(mapOrder);
    }

    const orders = await getOrdersByCoupon(couponCode, since);
    return orders.map(mapOrder);
  }

  async getOrder(orderId: string): Promise<CheckoutOrder | null> {
    if (this.credentials) {
      const client = createYeverClient(this.credentials);
      const order = await client.getOrderById(orderId);
      return order ? mapOrder(order) : null;
    }

    const order = await getOrderById(orderId);
    return order ? mapOrder(order) : null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.credentials) return false;
    const client = createYeverClient(this.credentials);
    return client.testConnection();
  }
}
