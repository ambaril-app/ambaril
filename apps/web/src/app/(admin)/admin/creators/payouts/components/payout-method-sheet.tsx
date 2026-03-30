"use client";

import { useState, useCallback, useTransition } from "react";
import { Sheet } from "@ambaril/ui/components/sheet";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { FormSelect } from "@ambaril/ui/components/form-select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PayoutMethodSheetProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  onSubmit: (
    creatorId: string,
    data: {
      paymentMethod: string;
      pixKey?: string;
      storeCreditAmount?: string;
      productItems?: { productId: string; quantity: number }[];
    },
  ) => Promise<{ error?: string }>;
}

const METHOD_OPTIONS = [
  { value: "pix", label: "PIX" },
  { value: "store_credit", label: "Credito na Loja" },
  { value: "product", label: "Produto" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PayoutMethodSheet({
  isOpen,
  onClose,
  creatorId,
  creatorName,
  onSubmit,
}: PayoutMethodSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [pixKey, setPixKey] = useState("");
  const [storeCreditAmount, setStoreCreditAmount] = useState("");
  const [productId, setProductId] = useState("");
  const [productQty, setProductQty] = useState("1");

  const handleSubmit = useCallback(() => {
    setError(null);

    if (!paymentMethod) {
      setError("Selecione um metodo de pagamento");
      return;
    }

    if (paymentMethod === "pix" && !pixKey.trim()) {
      setError("Chave PIX é obrigatória para pagamento via PIX");
      return;
    }

    startTransition(async () => {
      const data: {
        paymentMethod: string;
        pixKey?: string;
        storeCreditAmount?: string;
        productItems?: { productId: string; quantity: number }[];
      } = {
        paymentMethod,
      };

      if (paymentMethod === "pix") {
        data.pixKey = pixKey.trim();
      } else if (paymentMethod === "store_credit" && storeCreditAmount) {
        data.storeCreditAmount = storeCreditAmount;
      } else if (paymentMethod === "product" && productId.trim()) {
        data.productItems = [
          {
            productId: productId.trim(),
            quantity: parseInt(productQty, 10) || 1,
          },
        ];
      }

      const result = await onSubmit(creatorId, data);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }, [paymentMethod, pixKey, storeCreditAmount, productId, productQty, creatorId, onSubmit, onClose]);

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Metodo de Pagamento" width="md">
      <div className="space-y-5">
        <div>
          <p className="text-sm text-text-secondary">
            Configurar metodo de pagamento para{" "}
            <span className="font-medium text-text-bright">{creatorName}</span>
          </p>
        </div>

        <FormSelect
          label="Metodo"
          options={METHOD_OPTIONS}
          value={paymentMethod}
          onChange={setPaymentMethod}
          required
        />

        {paymentMethod === "pix" && (
          <Input
            label="Chave PIX"
            placeholder="CPF, email, telefone ou chave aleatoria"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            required
          />
        )}

        {paymentMethod === "store_credit" && (
          <Input
            label="Valor do Credito (R$)"
            placeholder="0.00"
            value={storeCreditAmount}
            onChange={(e) => setStoreCreditAmount(e.target.value)}
            className="font-mono"
          />
        )}

        {paymentMethod === "product" && (
          <div className="space-y-3">
            <Input
              label="ID do Produto"
              placeholder="UUID do produto"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            />
            <Input
              label="Quantidade"
              type="number"
              placeholder="1"
              value={productQty}
              onChange={(e) => setProductQty(e.target.value)}
            />
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onPress={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onPress={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar Metodo"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
