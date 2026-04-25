/**
 * Job: Shipping Batch Labels (ADR-018)
 * Created: 2026-04-24
 *
 * Why: Generating 50+ shipping labels via Melhor Envio API in a single
 * batch exceeds Vercel's 60s timeout. Each label requires carrier
 * selection, price calculation, and PDF generation.
 *
 * Enqueued by: Server Action when user triggers batch label generation
 * Payload: { tenantId, orderIds: string[] }
 */

import type { Task } from "graphile-worker";

interface ShippingBatchPayload {
  tenantId: string;
  orderIds: string[];
}

export const shippingBatchLabels: Task = async (payload, helpers) => {
  const { tenantId, orderIds } = payload as unknown as ShippingBatchPayload;

  helpers.logger.info(
    `Shipping batch labels: ${orderIds.length} orders for tenant ${tenantId}`,
  );

  // TODO: Implement when Melhor Envio integration is ready (Phase 1)
  // 1. For each orderId:
  //    a. Get shipping address from order
  //    b. Calculate cheapest carrier via Melhor Envio cotação
  //    c. Generate label
  //    d. Update shipping_labels record
  //    e. Store tracking code
  // 2. Report: { generated, failed, totalCost }

  helpers.logger.info(
    "Shipping batch labels: job stub complete (awaiting ME integration)",
  );
};
