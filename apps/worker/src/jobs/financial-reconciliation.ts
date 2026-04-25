/**
 * Job: Financial Reconciliation (ADR-018)
 * Created: 2026-04-24
 *
 * Why: Compares Mercado Pago transaction records against internal
 * financial_transactions to detect discrepancies (missing webhooks,
 * amount mismatches, unrecorded chargebacks). This is a safety net
 * that accountants depend on — the "balance check" that Delphi ERPs
 * ran nightly to catch any drift between expected and actual balances.
 *
 * Enqueued by: Daily cron at 03:00 or manual trigger
 * Payload: { tenantId, dateRange: { from, to } }
 */

import type { Task } from "graphile-worker";

interface ReconciliationPayload {
  tenantId: string;
  dateRange: { from: string; to: string };
}

export const financialReconciliation: Task = async (payload, helpers) => {
  const { tenantId, dateRange } = payload as unknown as ReconciliationPayload;

  helpers.logger.info(
    `Financial reconciliation: ${dateRange.from} to ${dateRange.to} for tenant ${tenantId}`,
  );

  // TODO: Implement when Mercado Pago integration is ready (Phase 1)
  // 1. Fetch MP transactions for period via API
  // 2. Match against erp.financial_transactions by external_id
  // 3. Flag: unmatched MP transactions (missing webhook?)
  // 4. Flag: amount mismatches (partial payment? fee change?)
  // 5. Flag: internal transactions without MP match (orphaned?)
  // 6. Generate reconciliation report
  // 7. Alert if discrepancy > R$ 10 or > 1% of volume

  helpers.logger.info(
    "Financial reconciliation: job stub complete (awaiting MP integration)",
  );
};
