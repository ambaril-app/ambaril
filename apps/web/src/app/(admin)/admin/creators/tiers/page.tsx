import { getTenantSession } from "@/lib/tenant";
import { listTiers } from "@/app/actions/creators/tiers";
import { TiersClient } from "./tiers-client";

export default async function TiersPage() {
  await getTenantSession();

  const result = await listTiers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[32px] font-medium leading-tight tracking-[-0.02em] text-text-bright">
          Tiers
        </h1>
        <p className="mt-1 text-sm text-text-ghost">
          Gerencie os níveis de comissão dos creators
        </p>
      </div>

      <TiersClient initialTiers={result.data ?? []} initialError={result.error} />
    </div>
  );
}
