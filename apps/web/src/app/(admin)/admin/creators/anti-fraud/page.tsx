import { getTenantSession } from "@/lib/tenant";
import { listFlags } from "@/app/actions/creators/anti-fraud";
import { AntiFraudClient } from "./anti-fraud-client";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AntiFraudPage() {
  await getTenantSession();

  const result = await listFlags({ page: 1, per_page: 25, sort_order: "desc" });

  const flags = result.data?.items ?? [];
  const total = result.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <AntiFraudClient initialFlags={flags} initialTotal={total} />
    </div>
  );
}
