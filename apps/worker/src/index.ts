/**
 * IRON CORE — Worker Entry Point (ADR-018)
 * Created: 2026-04-24
 *
 * Why: Vercel serverless has a 60s timeout (Pro) / 300s (Enterprise).
 * ERP jobs like batch NF-e emission, DRE generation, and financial
 * reconciliation can take minutes. This worker runs on the Hetzner VPS
 * (same server as Tino Agent), pulling jobs from PostgreSQL via
 * graphile-worker — zero extra infrastructure, just the DB we already have.
 *
 * Architecture:
 *   Next.js (Vercel) enqueues jobs → PostgreSQL queue → Worker (Hetzner) processes
 *
 * Run:
 *   pnpm dev     (development with hot reload)
 *   pnpm start   (production)
 */

import { run, type TaskList } from "graphile-worker";
import "dotenv/config";

// Import job handlers
import { nfeBatchEmission } from "./jobs/nfe-batch-emission.js";
import { dreGeneration } from "./jobs/dre-generation.js";
import { financialReconciliation } from "./jobs/financial-reconciliation.js";
import { inventoryRecalculation } from "./jobs/inventory-recalculation.js";
import { shippingBatchLabels } from "./jobs/shipping-batch-labels.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("FATAL: DATABASE_URL not set");
  process.exit(1);
}

/**
 * Task registry — maps job names to handler functions.
 * The Next.js app enqueues jobs by name:
 *   await addJob('nfe_batch_emission', { tenantId, orderIds });
 */
const taskList: TaskList = {
  nfe_batch_emission: nfeBatchEmission,
  dre_generation: dreGeneration,
  financial_reconciliation: financialReconciliation,
  inventory_recalculation: inventoryRecalculation,
  shipping_batch_labels: shippingBatchLabels,
};

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Iron Core Worker (ADR-018)");
  console.log("  Started:", new Date().toISOString());
  console.log("═══════════════════════════════════════════");
  console.log(`Registered jobs: ${Object.keys(taskList).join(", ")}`);

  const runner = await run({
    connectionString: DATABASE_URL,
    concurrency: 5,
    noHandleSignals: false,
    pollInterval: 1000, // Check for new jobs every second
    taskList,
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, shutting down gracefully...");
    await runner.stop();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("SIGINT received, shutting down gracefully...");
    await runner.stop();
    process.exit(0);
  });

  await runner.promise;
}

main().catch((err) => {
  console.error("Worker fatal error:", err);
  process.exit(1);
});
