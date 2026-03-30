import { getTenantSession } from "@/lib/tenant";
import { listTiers } from "@/app/actions/creators/tiers";
import { TiersClient } from "./tiers-client";

export default async function TiersPage() {
  await getTenantSession();

  const result = await listTiers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-text-bright">
          Configuracao de Tiers
        </h1>
        <p className="text-sm text-text-secondary">
          Gerencie os niveis de comissao dos creators
        </p>
      </div>

      <TiersClient initialTiers={result.data ?? []} initialError={result.error} />
    </div>
  );
}
