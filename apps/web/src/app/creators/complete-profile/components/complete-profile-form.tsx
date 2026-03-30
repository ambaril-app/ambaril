"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { Card, CardContent } from "@ambaril/ui/components/card";
import { completeCreatorProfile } from "../actions";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompleteProfileForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [phone, setPhone] = useState("");
  const [clothingSize, setClothingSize] = useState("");
  const [pixKeyType, setPixKeyType] = useState("cpf");
  const [pixKey, setPixKey] = useState("");
  const [contentRights, setContentRights] = useState(false);

  const handleSubmit = () => {
    setError(null);

    if (!contentRights) {
      setError("Voce precisa aceitar os termos de uso de conteudo.");
      return;
    }

    startTransition(async () => {
      const result = await completeCreatorProfile({
        instagram: instagram || undefined,
        tiktok: tiktok || undefined,
        phone: phone || undefined,
        clothingSize: clothingSize || undefined,
        pixKeyType: pixKeyType || undefined,
        pixKey: pixKey || undefined,
        contentRightsAccepted: contentRights,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/creators/dashboard");
        router.refresh();
      }
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        {/* Social */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-bright">Redes Sociais</p>
          <Input
            label="Instagram"
            placeholder="@seuusuario"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
          />
          <Input
            label="TikTok"
            placeholder="@seuusuario"
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
          />
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-bright">Contato</p>
          <Input
            label="Telefone"
            placeholder="(21) 99999-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Clothing */}
        <div className="space-y-1">
          <label className="text-xs text-text-secondary">Tamanho de roupa</label>
          <select
            value={clothingSize}
            onChange={(e) => setClothingSize(e.target.value)}
            className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary focus:border-input-focus focus:outline-none"
          >
            <option value="">Selecione...</option>
            <option value="PP">PP</option>
            <option value="P">P</option>
            <option value="M">M</option>
            <option value="G">G</option>
            <option value="GG">GG</option>
          </select>
        </div>

        {/* PIX */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-bright">Dados de Pagamento</p>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Tipo de chave PIX</label>
            <select
              value={pixKeyType}
              onChange={(e) => setPixKeyType(e.target.value)}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary focus:border-input-focus focus:outline-none"
            >
              <option value="cpf">CPF</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="random">Chave aleatoria</option>
            </select>
          </div>
          <Input
            label="Chave PIX"
            placeholder="Sua chave PIX"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
          />
        </div>

        {/* Content rights */}
        <label className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            checked={contentRights}
            onChange={(e) => setContentRights(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-input-border bg-input-bg text-text-tertiary focus:ring-input-focus"
          />
          <span className="text-xs text-text-secondary">
            Autorizo o uso das minhas imagens e conteudo publicados nas redes sociais para
            divulgacao da marca nos canais oficiais.
          </span>
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button
          onPress={handleSubmit}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Salvando..." : "Salvar e Continuar"}
        </Button>
      </CardContent>
    </Card>
  );
}
