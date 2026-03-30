"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@ambaril/ui/components/step-indicator";
import { Button } from "@ambaril/ui/components/button";
import {
  saveSetupStep,
  completeCreatorsSetup,
} from "@/app/actions/creators/setup";
import { StepIntegrations } from "./steps/step-integrations";
import { StepTiers } from "./steps/step-tiers";
import { StepImportCoupons } from "./steps/step-import-coupons";
import { StepLinkCoupons } from "./steps/step-link-coupons";
import { StepAccountOptions } from "./steps/step-account-options";
import { StepReview } from "./steps/step-review";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = [
  { label: "Integracoes" },
  { label: "Tiers" },
  { label: "Cupons" },
  { label: "Vincular" },
  { label: "Convites" },
  { label: "Revisao" },
];

const STEP_KEYS = [
  "integrations",
  "tiers",
  "import-coupons",
  "link-coupons",
  "account-options",
  "review",
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SetupWizardProps {
  initialStep: string;
  integrations: Array<{
    capability: string;
    providerId: string;
    providerName: string;
    isActive: boolean;
    lastTestedAt: string | null;
  }>;
  missingIntegrations: string[];
  tiers: Array<{
    id: string;
    name: string;
    slug: string;
    commissionRate: string;
    minFollowers: number;
    benefits: unknown;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SetupWizard({
  initialStep,
  integrations,
  missingIntegrations,
  tiers: initialTiers,
}: SetupWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialIndex = Math.max(
    STEP_KEYS.indexOf(initialStep as (typeof STEP_KEYS)[number]),
    0,
  );
  const [currentStep, setCurrentStep] = useState(initialIndex);

  // Wizard data accumulated across steps
  const [wizardData, setWizardData] = useState<Record<string, unknown>>({});

  const updateData = useCallback((key: string, value: unknown) => {
    setWizardData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const goNext = useCallback(() => {
    const nextStep = Math.min(currentStep + 1, STEPS.length - 1);
    const stepKey = STEP_KEYS[nextStep];
    if (!stepKey) return;
    setCurrentStep(nextStep);
    // Save progress to server
    startTransition(async () => {
      await saveSetupStep(stepKey, wizardData);
    });
  }, [currentStep, wizardData]);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleComplete = useCallback(() => {
    startTransition(async () => {
      const result = await completeCreatorsSetup();
      if (!result.error) {
        router.push("/admin/creators");
        router.refresh();
      }
    });
  }, [router]);

  return (
    <div className="space-y-8">
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      <div className="min-h-[400px]">
        {currentStep === 0 && (
          <StepIntegrations
            integrations={integrations}
            missing={missingIntegrations}
          />
        )}
        {currentStep === 1 && <StepTiers tiers={initialTiers} />}
        {currentStep === 2 && (
          <StepImportCoupons
            onImported={(importedCoupons) =>
              updateData("importedCoupons", importedCoupons)
            }
          />
        )}
        {currentStep === 3 && (
          <StepLinkCoupons
            importedCoupons={
              (wizardData.importedCoupons as Array<{ code: string }>) ?? []
            }
            tiers={initialTiers}
            onLinked={(links) => updateData("couponLinks", links)}
          />
        )}
        {currentStep === 4 && (
          <StepAccountOptions
            onChange={(options) => updateData("accountOptions", options)}
          />
        )}
        {currentStep === 5 && (
          <StepReview wizardData={wizardData} tiers={initialTiers} />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between border-t border-border-default pt-4">
        <Button
          variant="ghost"
          onPress={goBack}
          disabled={currentStep === 0 || isPending}
        >
          Voltar
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button onPress={goNext} disabled={isPending}>
            {isPending ? "Salvando..." : "Proximo"}
          </Button>
        ) : (
          <Button onPress={handleComplete} disabled={isPending}>
            {isPending ? "Ativando..." : "Ativar Programa de Creators"}
          </Button>
        )}
      </div>
    </div>
  );
}
