/**
 * Job: NF-e Batch Emission (ADR-018)
 * Created: 2026-04-24
 *
 * Why: Emitting 100+ NF-e documents via Focus NFe API takes well over 60s.
 * Each NF-e requires SEFAZ validation (1-5s per doc). This job runs on
 * the Hetzner worker with no timeout limit.
 *
 * Enqueued by: Server Action when user triggers batch emission
 * Payload: { tenantId, orderIds: string[] }
 */

import type { Task } from "graphile-worker";

interface NfeBatchPayload {
  tenantId: string;
  orderIds: string[];
}

export const nfeBatchEmission: Task = async (payload, helpers) => {
  const { tenantId, orderIds } = payload as unknown as NfeBatchPayload;

  helpers.logger.info(
    `NF-e batch emission: ${orderIds.length} orders for tenant ${tenantId}`,
  );

  // TODO: Implement when Focus NFe integration is ready (Phase 1)
  // 1. Set tenant context: SET LOCAL app.tenant_id = tenantId
  // 2. For each orderId:
  //    a. Validate order is in 'in_picking' status
  //    b. Build NF-e XML payload from order + items + contact + fiscal config
  //    c. Call Focus NFe API to emit
  //    d. Update nfe_documents status (pending → authorized | rejected)
  //    e. If authorized, transition order to 'invoiced'
  // 3. Report results: { emitted, failed, skipped }

  helpers.logger.info(
    "NF-e batch emission: job stub complete (awaiting Focus NFe integration)",
  );
};
