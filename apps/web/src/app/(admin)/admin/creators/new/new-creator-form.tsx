"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@ambaril/ui/components/card";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { FormTextarea } from "@ambaril/ui/components/form-textarea";
import { FormSelect, type FormSelectOption } from "@ambaril/ui/components/form-select";
import { Save, Plus, Trash2 } from "lucide-react";
import { createCreator } from "@/app/actions/creators/crud";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TierOption {
  id: string;
  name: string;
  commissionRate: string;
}

interface NewCreatorFormProps {
  tiers: TierOption[];
}

interface SocialAccountEntry {
  platform: "instagram" | "tiktok" | "youtube" | "pinterest" | "twitter" | "other";
  handle: string;
  url: string;
  isPrimary: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORM_OPTIONS: FormSelectOption[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "pinterest", label: "Pinterest" },
  { value: "twitter", label: "Twitter / X" },
  { value: "other", label: "Outra" },
];

const PAYMENT_OPTIONS: FormSelectOption[] = [
  { value: "", label: "Nenhuma" },
  { value: "pix", label: "PIX" },
  { value: "store_credit", label: "Credito em loja" },
  { value: "product", label: "Produto" },
];

const SIZE_OPTIONS: FormSelectOption[] = [
  { value: "", label: "Selecione" },
  { value: "PP", label: "PP" },
  { value: "P", label: "P" },
  { value: "M", label: "M" },
  { value: "G", label: "G" },
  { value: "GG", label: "GG" },
  { value: "XGG", label: "XGG" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function NewCreatorForm({ tiers }: NewCreatorFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Step 1: Personal info
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [cpf, setCpf] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");

  // Step 2: Social accounts
  const [socialAccounts, setSocialAccounts] = React.useState<SocialAccountEntry[]>([
    { platform: "instagram", handle: "", url: "", isPrimary: true },
  ]);

  // Step 3: About
  const [bio, setBio] = React.useState("");
  const [motivation, setMotivation] = React.useState("");
  const [discoverySource, setDiscoverySource] = React.useState("");
  const [clothingSize, setClothingSize] = React.useState("");
  const [contentNiches, setContentNiches] = React.useState("");
  const [contentTypes, setContentTypes] = React.useState("");

  // Address
  const [street, setStreet] = React.useState("");
  const [streetNumber, setStreetNumber] = React.useState("");
  const [complement, setComplement] = React.useState("");
  const [neighborhood, setNeighborhood] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [zipCode, setZipCode] = React.useState("");

  // Tier & payment
  const [tierId, setTierId] = React.useState("");
  const [commissionRate, setCommissionRate] = React.useState("");
  const [paymentPreference, setPaymentPreference] = React.useState("");
  const [pixKey, setPixKey] = React.useState("");
  const [pixKeyType, setPixKeyType] = React.useState("");

  // Tier options for select
  const tierOptions: FormSelectOption[] = [
    { value: "", label: "Nenhum (sera atribuido na aprovacao)" },
    ...tiers.map((t) => ({ value: t.id, label: `${t.name} (${t.commissionRate}%)` })),
  ];

  // Social account handlers
  function addSocialAccount() {
    setSocialAccounts((prev) => [
      ...prev,
      { platform: "tiktok", handle: "", url: "", isPrimary: false },
    ]);
  }

  function removeSocialAccount(index: number) {
    setSocialAccounts((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSocialAccount(index: number, field: keyof SocialAccountEntry, value: string | boolean) {
    setSocialAccounts((prev) =>
      prev.map((acc, i) => (i === index ? { ...acc, [field]: value } : acc)),
    );
  }

  // Submit handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Build address object
    const address =
      street || city
        ? {
            street,
            number: streetNumber,
            complement: complement || undefined,
            neighborhood,
            city,
            state,
            zipCode,
          }
        : undefined;

    // Build social accounts
    const validSocials = socialAccounts
      .filter((sa) => sa.handle.trim().length > 0)
      .map((sa) => ({
        platform: sa.platform,
        handle: sa.handle.trim(),
        url: sa.url.trim() || undefined,
        isPrimary: sa.isPrimary,
      }));

    // Parse niches and types
    const nichesArray = contentNiches
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    const typesArray = contentTypes
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const result = await createCreator({
      name: name.trim(),
      email: email.trim(),
      phone: phone.replace(/\D/g, ""),
      cpf: cpf.replace(/\D/g, ""),
      bio: bio.trim() || undefined,
      tierId: tierId || undefined,
      commissionRate: commissionRate || undefined,
      paymentPreference:
        (paymentPreference as "pix" | "store_credit" | "product") || undefined,
      pixKey: pixKey.trim() || undefined,
      pixKeyType: (pixKeyType as "cpf" | "email" | "phone" | "random") || undefined,
      clothingSize: clothingSize || undefined,
      birthDate: birthDate || undefined,
      discoverySource: discoverySource.trim() || undefined,
      motivation: motivation.trim() || undefined,
      contentNiches: nichesArray.length > 0 ? nichesArray : undefined,
      contentTypes: typesArray.length > 0 ? typesArray : undefined,
      address,
      socialAccounts: validSocials.length > 0 ? validSocials : undefined,
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      router.push(`/admin/creators/${result.data.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Personal info */}
      <Card>
        <CardHeader>
          <CardTitle>1. Informacoes Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nome do creator"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@exemplo.com"
            />
            <Input
              label="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="11999999999"
            />
            <Input
              label="CPF"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
              placeholder="00000000000"
            />
            <Input
              label="Data de nascimento"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
            <FormSelect
              label="Tamanho de roupa"
              options={SIZE_OPTIONS}
              value={clothingSize}
              onChange={setClothingSize}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Social accounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>2. Redes Sociais</CardTitle>
            <Button variant="ghost" size="sm" onPress={addSocialAccount} type="button">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Adicionar rede
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {socialAccounts.map((account, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="w-[160px]">
                  <FormSelect
                    label="Plataforma"
                    options={PLATFORM_OPTIONS}
                    value={account.platform}
                    onChange={(value) =>
                      updateSocialAccount(index, "platform", value)
                    }
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label="Handle"
                    value={account.handle}
                    onChange={(e) =>
                      updateSocialAccount(index, "handle", e.target.value)
                    }
                    placeholder="@username"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label="URL do perfil"
                    value={account.url}
                    onChange={(e) =>
                      updateSocialAccount(index, "url", e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>
                {index > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onPress={() => removeSocialAccount(index)}
                    type="button"
                    aria-label="Remover rede social"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 3: About */}
      <Card>
        <CardHeader>
          <CardTitle>3. Sobre o Creator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FormTextarea
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              placeholder="Breve descricao do creator..."
            />
            <FormTextarea
              label="Motivacao"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              maxLength={2000}
              placeholder="Por que quer ser creator da marca..."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nichos de conteudo (separados por virgula)"
                value={contentNiches}
                onChange={(e) => setContentNiches(e.target.value)}
                placeholder="moda, streetwear, lifestyle"
              />
              <Input
                label="Tipos de conteudo (separados por virgula)"
                value={contentTypes}
                onChange={(e) => setContentTypes(e.target.value)}
                placeholder="foto, video, story, reels"
              />
              <Input
                label="Fonte de descoberta"
                value={discoverySource}
                onChange={(e) => setDiscoverySource(e.target.value)}
                placeholder="Instagram, indicacao, etc."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Endereco</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Rua"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Nome da rua"
            />
            <Input
              label="Numero"
              value={streetNumber}
              onChange={(e) => setStreetNumber(e.target.value)}
              placeholder="123"
            />
            <Input
              label="Complemento"
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
              placeholder="Apto 42"
            />
            <Input
              label="Bairro"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Centro"
            />
            <Input
              label="Cidade"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Rio de Janeiro"
            />
            <Input
              label="UF"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="RJ"
            />
            <Input
              label="CEP"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="00000000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tier & Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Tier e Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              label="Tier"
              options={tierOptions}
              value={tierId}
              onChange={(value) => {
                setTierId(value);
                // Auto-fill commission rate from selected tier
                const selectedTier = tiers.find((t) => t.id === value);
                if (selectedTier) {
                  setCommissionRate(selectedTier.commissionRate);
                }
              }}
            />
            <Input
              label="Taxa de comissao (%)"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="8.00"
            />
            <FormSelect
              label="Preferencia de pagamento"
              options={PAYMENT_OPTIONS}
              value={paymentPreference}
              onChange={setPaymentPreference}
            />
            {paymentPreference === "pix" && (
              <>
                <Input
                  label="Chave PIX"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="CPF, email, telefone ou chave aleatoria"
                />
                <FormSelect
                  label="Tipo da chave PIX"
                  options={[
                    { value: "", label: "Selecione" },
                    { value: "cpf", label: "CPF" },
                    { value: "email", label: "Email" },
                    { value: "phone", label: "Telefone" },
                    { value: "random", label: "Chave aleatoria" },
                  ]}
                  value={pixKeyType}
                  onChange={setPixKeyType}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error & Submit */}
      {error && (
        <div className="rounded-lg border border-danger bg-[var(--danger-muted)] px-4 py-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          variant="ghost"
          type="button"
          onPress={() => router.push("/admin/creators")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          <Save className="mr-1.5 h-4 w-4" />
          {submitting ? "Salvando..." : "Cadastrar Creator"}
        </Button>
      </div>
    </form>
  );
}

export { NewCreatorForm };
