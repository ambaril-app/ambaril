"use client";

import * as React from "react";
import { StepIndicator } from "@ambaril/ui/components/step-indicator";
import { Button } from "@ambaril/ui/components/button";
import { Card } from "@ambaril/ui/components/card";
import {
  registrationStep1Schema,
  registrationStep2Schema,
  registrationStep3Schema,
  fullRegistrationSchema,
} from "@ambaril/shared/schemas";
import type {
  RegistrationStep1Input,
  RegistrationStep2Input,
  RegistrationStep3Input,
  FullRegistrationInput,
} from "@ambaril/shared/schemas";
import type { AddressInput } from "@ambaril/shared/validators";
import { Step1Personal } from "./step-1-personal";
import { Step2Social } from "./step-2-social";
import { Step3About } from "./step-3-about";
import { submitCreatorApplication } from "../actions";
import { CheckCircle2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Steps configuration
// ---------------------------------------------------------------------------

const STEPS = [
  { label: "Dados Pessoais" },
  { label: "Redes Sociais" },
  { label: "Sobre Voce" },
];

// ---------------------------------------------------------------------------
// Form data type (all fields across steps)
// ---------------------------------------------------------------------------

type FormData = Partial<FullRegistrationInput>;

// ---------------------------------------------------------------------------
// Error maps per step
// ---------------------------------------------------------------------------

type Step1Errors = Partial<Record<keyof RegistrationStep1Input, string>>;
type Step2Errors = Partial<Record<keyof RegistrationStep2Input, string>>;
type Step3Errors = Record<string, string>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApplicationForm() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState<FormData>({});
  const [step1Errors, setStep1Errors] = React.useState<Step1Errors>({});
  const [step2Errors, setStep2Errors] = React.useState<Step2Errors>({});
  const [step3Errors, setStep3Errors] = React.useState<Step3Errors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  // -------------------------------------------------------------------------
  // Step 1 field change handler
  // -------------------------------------------------------------------------

  const handleStep1Change = React.useCallback(
    (field: keyof RegistrationStep1Input, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field when user types
      setStep1Errors((prev) => {
        if (prev[field]) {
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return prev;
      });
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Step 2 field change handler
  // -------------------------------------------------------------------------

  const handleStep2Change = React.useCallback(
    (field: keyof RegistrationStep2Input, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setStep2Errors((prev) => {
        if (prev[field]) {
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return prev;
      });
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Step 3 field change handlers
  // -------------------------------------------------------------------------

  const handleStep3ChangeText = React.useCallback(
    (field: "bio" | "motivation" | "discoverySource" | "clothingSize", value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setStep3Errors((prev) => {
        if (prev[field]) {
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return prev;
      });
    },
    [],
  );

  const handleStep3ChangeArray = React.useCallback(
    (field: "contentNiches" | "contentTypes", value: string[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setStep3Errors((prev) => {
        if (prev[field]) {
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return prev;
      });
    },
    [],
  );

  const handleStep3ChangeBoolean = React.useCallback(
    (
      field: "contentRightsAccepted" | "termsAccepted" | "ambassadorOption",
      value: boolean,
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setStep3Errors((prev) => {
        if (prev[field]) {
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return prev;
      });
    },
    [],
  );

  const handleStep3ChangeAddress = React.useCallback(
    (field: keyof AddressInput, value: string) => {
      setFormData((prev) => {
        const currentAddress = (prev.address ?? {}) as Record<string, string | undefined>;
        const updated = { ...currentAddress, [field]: value } as unknown as AddressInput;
        return {
          ...prev,
          address: updated,
        };
      });
      setStep3Errors((prev) => {
        const addressKey = `address.${field}`;
        if (prev[addressKey] || prev.address) {
          const next = { ...prev };
          delete next[addressKey];
          delete next.address;
          return next;
        }
        return prev;
      });
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  const validateStep1 = React.useCallback((): boolean => {
    const result = registrationStep1Schema.safeParse({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      cpf: formData.cpf,
      birthDate: formData.birthDate || undefined,
      city: formData.city,
      state: formData.state,
    });

    if (result.success) {
      setStep1Errors({});
      return true;
    }

    const errs: Step1Errors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof RegistrationStep1Input | undefined;
      if (field && !errs[field]) {
        errs[field] = issue.message;
      }
    }
    setStep1Errors(errs);
    return false;
  }, [formData]);

  const validateStep2 = React.useCallback((): boolean => {
    const result = registrationStep2Schema.safeParse({
      instagram: formData.instagram,
      tiktok: formData.tiktok,
      youtube: formData.youtube || undefined,
      pinterest: formData.pinterest || undefined,
      twitter: formData.twitter || undefined,
      otherPlatform: formData.otherPlatform || undefined,
    });

    if (result.success) {
      setStep2Errors({});
      return true;
    }

    const errs: Step2Errors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof RegistrationStep2Input | undefined;
      if (field && !errs[field]) {
        errs[field] = issue.message;
      }
    }
    setStep2Errors(errs);
    return false;
  }, [formData]);

  const validateStep3 = React.useCallback((): boolean => {
    const result = registrationStep3Schema.safeParse({
      bio: formData.bio || undefined,
      motivation: formData.motivation,
      contentNiches: formData.contentNiches,
      contentTypes: formData.contentTypes,
      discoverySource: formData.discoverySource || undefined,
      clothingSize: formData.clothingSize || undefined,
      address: formData.address,
      contentRightsAccepted: formData.contentRightsAccepted,
      termsAccepted: formData.termsAccepted,
      ambassadorOption: formData.ambassadorOption ?? false,
    });

    if (result.success) {
      setStep3Errors({});
      return true;
    }

    const errs: Step3Errors = {};
    for (const issue of result.error.issues) {
      // Handle nested address paths like ["address", "street"]
      const path = issue.path.join(".");
      if (!errs[path]) {
        errs[path] = issue.message;
      }
    }
    setStep3Errors(errs);
    return false;
  }, [formData]);

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  const handleNext = React.useCallback(() => {
    if (currentStep === 0) {
      if (validateStep1()) {
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (currentStep === 1) {
      if (validateStep2()) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [currentStep, validateStep1, validateStep2]);

  const handleBack = React.useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep]);

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handleSubmit = React.useCallback(async () => {
    // Validate step 3 first
    if (!validateStep3()) return;

    // Validate all steps together with fullRegistrationSchema
    const fullData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      cpf: formData.cpf,
      birthDate: formData.birthDate || undefined,
      city: formData.city,
      state: formData.state,
      instagram: formData.instagram,
      tiktok: formData.tiktok,
      youtube: formData.youtube || undefined,
      pinterest: formData.pinterest || undefined,
      twitter: formData.twitter || undefined,
      otherPlatform: formData.otherPlatform || undefined,
      bio: formData.bio || undefined,
      motivation: formData.motivation,
      contentNiches: formData.contentNiches,
      contentTypes: formData.contentTypes,
      discoverySource: formData.discoverySource || undefined,
      clothingSize: formData.clothingSize || undefined,
      address: formData.address,
      contentRightsAccepted: formData.contentRightsAccepted,
      termsAccepted: formData.termsAccepted,
      ambassadorOption: formData.ambassadorOption ?? false,
    };

    const fullResult = fullRegistrationSchema.safeParse(fullData);
    if (!fullResult.success) {
      const messages = fullResult.error.errors.map((e) => e.message).join("; ");
      setServerError(messages);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const result = await submitCreatorApplication(fullResult.data);

    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setServerError(result.error ?? "Erro inesperado");
    }
  }, [formData, validateStep3]);

  // -------------------------------------------------------------------------
  // Success state
  // -------------------------------------------------------------------------

  if (isSuccess) {
    return (
      <Card className="mx-auto max-w-lg space-y-6 p-8 text-center">
        <div className="flex justify-center">
          <CheckCircle2 size={48} className="text-success" />
        </div>
        <h2 className="text-xl font-medium text-text-bright">
          Aplicacao enviada!
        </h2>
        <p className="text-sm text-text-secondary">
          Sua aplicacao foi enviada com sucesso. Voce recebera um email quando
          for aprovada.
        </p>
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Step indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Form card */}
      <Card className="p-6">
        {/* Step content */}
        {currentStep === 0 && (
          <Step1Personal
            data={formData}
            errors={step1Errors}
            onChange={handleStep1Change}
          />
        )}

        {currentStep === 1 && (
          <Step2Social
            data={formData}
            errors={step2Errors}
            onChange={handleStep2Change}
          />
        )}

        {currentStep === 2 && (
          <Step3About
            data={formData}
            errors={step3Errors}
            onChangeText={handleStep3ChangeText}
            onChangeArray={handleStep3ChangeArray}
            onChangeBoolean={handleStep3ChangeBoolean}
            onChangeAddress={handleStep3ChangeAddress}
          />
        )}

        {/* Server error */}
        {serverError && (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3">
            <p className="text-sm text-danger">{serverError}</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {currentStep > 0 ? (
            <Button
              variant="outline"
              onPress={handleBack}
              disabled={isSubmitting}
              className="min-h-[44px]"
            >
              Voltar
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 2 ? (
            <Button
              onPress={handleNext}
              className="min-h-[44px]"
            >
              Proximo
            </Button>
          ) : (
            <Button
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="min-h-[44px]"
            >
              {isSubmitting ? "Enviando..." : "Enviar aplicacao"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
