import { getTenantSession } from "@/lib/tenant";
import { listPayouts } from "@/app/actions/creators/payouts";
import { PayoutsClient } from "./payouts-client";

export default async function PayoutsPage() {
  await getTenantSession();

  const result = await listPayouts({ page: 1, per_page: 25, sort_order: "desc" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[32px] font-medium leading-tight tracking-[-0.02em] text-text-bright">
          Pagamentos
        </h1>
        <p className="mt-1 text-sm text-text-ghost">
          Calcule, aprove e processe pagamentos dos creators
        </p>
      </div>

      <PayoutsClient
        initialPayouts={result.data?.items ?? []}
        initialTotal={result.data?.total ?? 0}
        initialError={result.error}
      />
    </div>
  );
}
