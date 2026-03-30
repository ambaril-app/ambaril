// Yever provider — wraps lib/yever.ts behind CheckoutProvider interface.
// Modules consume CheckoutProvider, never Yever directly.

import type {
  CheckoutProvider,
  CheckoutOrder,
} from "@ambaril/shared/integrations";
import { getOrdersByCoupon, getOrderById } from "../yever";

export class YeverCheckoutProvider implements CheckoutProvider {
  async listOrdersByCoupon(
    couponCode: string,
    since?: Date,
  ): Promise<CheckoutOrder[]> {
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
}
