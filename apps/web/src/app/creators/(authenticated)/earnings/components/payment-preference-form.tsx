"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@ambaril/ui/components/card";
import { Input } from "@ambaril/ui/components/input";
import { Button } from "@ambaril/ui/components/button";
import { RadioGroup, RadioGroupItem } from "@ambaril/ui/components/radio-group";
import { setPayoutMethod } from "@/app/actions/creators/payouts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentPreferenceFormProps {
  creatorId: string;
  currentMethod: "pix" | "store_credit" | "product" | null;
  currentPixKey: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function PaymentPreferenceForm({
  creatorId,
  currentMethod,
  currentPixKey,
}: PaymentPreferenceFormProps) {
  const [method, setMethod] = React.useState<string>(currentMethod ?? "pix");
  const [pixKey, setPixKey] = React.useState(currentPixKey ?? "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setFeedback(null);

    try {
      const result = await setPayoutMethod(creatorId, {
        paymentMethod: method as "pix" | "store_credit" | "product",
        pixKey: method === "pix" ? pixKey : undefined,
      });

      if (result.error) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: "Preferência de pagamento atualizada." });
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-text-secondary">Forma de Pagamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={method}
          onValueChange={setMethod}
          orientation="horizontal"
        >
          <RadioGroupItem value="pix" label="PIX" />
          <RadioGroupItem value="store_credit" label="Credito na Loja" />
          <RadioGroupItem value="product" label="Produto" />
        </RadioGroup>

        {method === "pix" && (
          <Input
            label="Chave PIX"
            placeholder="CPF, e-mail, telefone ou chave aleatoria"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
          />
        )}

        {feedback && (
          <p
            className={`text-sm ${
              feedback.type === "success" ? "text-success" : "text-danger"
            }`}
          >
            {feedback.message}
          </p>
        )}

        <Button
          onPress={handleSave}
          disabled={isSaving}
          size="sm"
        >
          {isSaving ? "Salvando..." : "Salvar preferencia"}
        </Button>
      </CardContent>
    </Card>
  );
}

export { PaymentPreferenceForm };
