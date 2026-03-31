"use client";

import { Card, CardContent } from "@ambaril/ui/components/card";
import { CheckCircle, Users, Ticket, Settings } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tier {
  id: string;
  name: string;
  commissionRate: string;
}

interface StepReviewProps {
  wizardData: Record<string, unknown>;
  tiers: Tier[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MODE_LABELS: Record<string, string> = {
  white_glove: "Cadastro pela equipe",
  invite_link: "Link de convite",
  both: "Ambos",
};

export function StepReview({ wizardData, tiers }: StepReviewProps) {
  const importedCoupons =
    (wizardData.importedCoupons as Array<{ code: string }>) ?? [];
  const couponLinks =
    (wizardData.couponLinks as Array<{
      creatorName: string;
      couponCode: string;
    }>) ?? [];
  const accountOptions = (wizardData.accountOptions as {
    onboardingMode: string;
    sendWelcomeEmail: boolean;
  }) ?? {
    onboardingMode: "both",
    sendWelcomeEmail: true,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-ghost">
        Revise as configurações antes de ativar o programa.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Tiers */}
        <Card className="p-0">
          <CardContent className="flex items-start gap-3 p-4">
            <Settings className="mt-0.5 h-5 w-5 shrink-0 text-text-ghost" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-bright">Tiers</p>
              <p className="mt-1 text-sm text-text-ghost">
                {tiers.length} tier{tiers.length !== 1 ? "s" : ""} configurado
                {tiers.length !== 1 ? "s" : ""}
              </p>
              <p className="mt-0.5 text-xs text-text-ghost">
                {tiers
                  .map((t) => `${t.name} (${t.commissionRate}%)`)
                  .join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Coupons */}
        <Card className="p-0">
          <CardContent className="flex items-start gap-3 p-4">
            <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-text-ghost" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-bright">Cupons</p>
              <p className="mt-1 text-sm text-text-ghost">
                {importedCoupons.length} cupom
                {importedCoupons.length !== 1 ? "ns" : ""} importado
                {importedCoupons.length !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Creators */}
        <Card className="p-0">
          <CardContent className="flex items-start gap-3 p-4">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-text-ghost" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-bright">Creators</p>
              <p className="mt-1 text-sm text-text-ghost">
                {couponLinks.length} creator
                {couponLinks.length !== 1 ? "s" : ""} será
                {couponLinks.length !== 1 ? "o" : ""} criado
                {couponLinks.length !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mode */}
        <Card className="p-0">
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-text-ghost" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-bright">Cadastro</p>
              <p className="mt-1 text-sm text-text-ghost">
                {MODE_LABELS[accountOptions.onboardingMode] ??
                  accountOptions.onboardingMode}
              </p>
              <p className="mt-0.5 text-xs text-text-ghost">
                Email de boas-vindas:{" "}
                {accountOptions.sendWelcomeEmail ? "Sim" : "Não"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
