import { getTenantSession } from "@/lib/tenant";
import {
  getCreatorsSetupState,
  checkIntegrationStatus,
} from "@/app/actions/creators/setup";
import { listTiers } from "@/app/actions/creators/tiers";
import { SetupWizard } from "./setup-wizard";

interface CreatorsSetupPageProps {
  searchParams: Promise<{ step?: string }>;
}

export default async function CreatorsSetupPage({ searchParams }: CreatorsSetupPageProps) {
  const session = await getTenantSession();
  const { step: stepParam } = await searchParams;

  const [setupState, integrationStatus, tiersResult] = await Promise.all([
    getCreatorsSetupState(),
    checkIntegrationStatus(),
    listTiers(),
  ]);

  // Query param ?step= overrides saved progress (e.g. ?step=import-coupons from "Importar cupons" CTA)
  const initialStep = stepParam ?? setupState.data?.currentStep ?? "integrations";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-[32px] font-medium leading-tight tracking-[-0.02em] text-text-bright">
          Configurar Programa de Creators
        </h1>
        <p className="mt-1 text-sm text-text-ghost">
          Configure as integrações e importe os dados existentes para ativar o módulo.
        </p>
      </div>

      <SetupWizard
        initialStep={initialStep}
        integrations={integrationStatus.data?.integrations ?? []}
        missingIntegrations={integrationStatus.data?.missing ?? []}
        tiers={tiersResult.data ?? []}
      />
    </div>
  );
}
