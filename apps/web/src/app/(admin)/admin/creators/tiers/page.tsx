import { getTenantSession } from "@/lib/tenant";
import { listTiers } from "@/app/actions/creators/tiers";
import { TiersClient } from "./tiers-client";

export default async function TiersPage() {
  await getTenantSession();

  const result = await listTiers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-display font-medium leading-tight tracking-tight text-text-bright">
          Configuração de Tiers
        </h1>
        <p className="text-sm text-text-secondary">
          Gerencie os níveis de comissão dos creators
        </p>
      </div>

      <TiersClient initialTiers={result.data ?? []} initialError={result.error} />
    </div>
  );
}
