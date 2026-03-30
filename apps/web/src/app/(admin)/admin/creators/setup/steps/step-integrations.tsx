"use client";

import { CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@ambaril/ui/components/card";
import { cn } from "@ambaril/ui/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Integration {
  capability: string;
  providerId: string;
  providerName: string;
  isActive: boolean;
  lastTestedAt: string | null;
}

interface StepIntegrationsProps {
  integrations: Integration[];
  missing: string[];
}

// ---------------------------------------------------------------------------
// Capability metadata
// ---------------------------------------------------------------------------

const CAPABILITY_LABELS: Record<string, { label: string; description: string }> =
  {
    ecommerce: {
      label: "E-commerce",
      description: "Catalogo de produtos e cupons",
    },
    checkout: {
      label: "Checkout",
      description: "Atribuicao de vendas por cupom",
    },
    messaging: {
      label: "Mensageria",
      description: "Envio de emails transacionais",
    },
    storage: {
      label: "Armazenamento",
      description: "Upload de arquivos e imagens",
    },
    social: {
      label: "Redes Sociais",
      description: "Monitoramento de mencoes",
    },
  };

const REQUIRED_CAPABILITIES = ["ecommerce", "checkout", "messaging"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepIntegrations({
  integrations,
  missing,
}: StepIntegrationsProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Verifique se as integracoes necessarias estao configuradas. Integracoes
        obrigatorias estao marcadas abaixo.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Connected integrations */}
        {integrations.map((integration) => {
          const info = CAPABILITY_LABELS[integration.capability];
          const isRequired = REQUIRED_CAPABILITIES.includes(
            integration.capability,
          );

          return (
            <Card key={integration.capability} className="p-0">
              <CardContent className="flex items-start gap-3 p-4">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-bright">
                      {info?.label ?? integration.capability}
                    </p>
                    {isRequired && (
                      <span className="rounded bg-bg-raised px-1.5 py-0.5 text-[10px] text-text-secondary">
                        Obrigatorio
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">
                    {integration.providerName} — Conectado
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Missing integrations */}
        {missing.map((capability) => {
          const info = CAPABILITY_LABELS[capability];
          const isRequired = REQUIRED_CAPABILITIES.includes(capability);

          return (
            <Card
              key={capability}
              className={cn("p-0", isRequired && "border-yellow-500/30")}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <AlertTriangle
                  className={cn(
                    "mt-0.5 h-5 w-5 shrink-0",
                    isRequired ? "text-yellow-500" : "text-text-ghost",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-bright">
                      {info?.label ?? capability}
                    </p>
                    {isRequired && (
                      <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] text-yellow-500">
                        Obrigatorio
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">
                    {info?.description ?? "Nao configurado"}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {missing.some((c) => REQUIRED_CAPABILITIES.includes(c)) && (
        <p className="text-xs text-yellow-500">
          Integracoes obrigatorias pendentes. Voce pode continuar, mas algumas
          funcoes nao estarao disponiveis.
        </p>
      )}
    </div>
  );
}
