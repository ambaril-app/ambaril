"use client";

import { useState } from "react";
import { Checkbox } from "@ambaril/ui/components/checkbox";
import { UserPlus, Link as LinkIcon, Users } from "lucide-react";
import { cn } from "@ambaril/ui/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AccountOptionsState {
  onboardingMode: "white_glove" | "invite_link" | "both";
  sendWelcomeEmail: boolean;
}

interface StepAccountOptionsProps {
  onChange: (options: AccountOptionsState) => void;
}

// ---------------------------------------------------------------------------
// Option cards
// ---------------------------------------------------------------------------

const OPTIONS = [
  {
    id: "white_glove" as const,
    icon: UserPlus,
    label: "Cadastro pela equipe",
    description:
      "A equipe cria as contas e convida os creators individualmente.",
  },
  {
    id: "invite_link" as const,
    icon: LinkIcon,
    label: "Link de convite",
    description:
      "Creators se cadastram via link público do formulário de aplicação.",
  },
  {
    id: "both" as const,
    icon: Users,
    label: "Ambos",
    description:
      "Equipe cria contas e também aceita aplicações pelo formulário.",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepAccountOptions({ onChange }: StepAccountOptionsProps) {
  const [mode, setMode] =
    useState<AccountOptionsState["onboardingMode"]>("both");
  const [sendEmail, setSendEmail] = useState(true);

  const handleModeChange = (
    newMode: AccountOptionsState["onboardingMode"],
  ) => {
    setMode(newMode);
    onChange({ onboardingMode: newMode, sendWelcomeEmail: sendEmail });
  };

  const handleEmailToggle = (checked: boolean) => {
    setSendEmail(checked);
    onChange({ onboardingMode: mode, sendWelcomeEmail: checked });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-text-ghost">
          Como você quer cadastrar novos creators?
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {OPTIONS.map((option) => {
            const isSelected = mode === option.id;
            const Icon = option.icon;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleModeChange(option.id)}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                  isSelected
                    ? "border-text-tertiary bg-bg-raised"
                    : "border-border-default bg-bg-base hover:border-border-strong",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isSelected ? "text-text-bright" : "text-text-ghost",
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-text-bright">
                    {option.label}
                  </p>
                  <p className="mt-1 text-xs text-text-ghost">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Checkbox
          checked={sendEmail}
          onCheckedChange={handleEmailToggle}
          label="Enviar email de boas-vindas"
        />
        <p className="pl-[26px] text-xs text-text-ghost">
          Creators importados recebem email com acesso ao portal e cupom.
        </p>
      </div>
    </div>
  );
}
