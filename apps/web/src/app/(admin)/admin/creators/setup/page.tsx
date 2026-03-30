import { getTenantSession } from "@/lib/tenant";
import {
  getCreatorsSetupState,
  checkIntegrationStatus,
} from "@/app/actions/creators/setup";
import { listTiers } from "@/app/actions/creators/tiers";
import { SetupWizard } from "./setup-wizard";

export default async function CreatorsSetupPage() {
  const session = await getTenantSession();

  const [setupState, integrationStatus, tiersResult] = await Promise.all([
    getCreatorsSetupState(),
    checkIntegrationStatus(),
    listTiers(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-medium text-text-bright">
          Configurar Programa de Creators
        </h1>
        <p className="text-sm text-text-secondary">
          Configure as integracoes e importe os dados existentes para ativar o
          modulo.
        </p>
      </div>

      <SetupWizard
        initialStep={setupState.data?.currentStep ?? "integrations"}
        integrations={integrationStatus.data?.integrations ?? []}
        missingIntegrations={integrationStatus.data?.missing ?? []}
        tiers={tiersResult.data ?? []}
      />
    </div>
  );
}
