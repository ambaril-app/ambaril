"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@ambaril/ui/components/card";
import { Input } from "@ambaril/ui/components/input";
import { FormTextarea } from "@ambaril/ui/components/form-textarea";
import { FormSelect } from "@ambaril/ui/components/form-select";
import { Badge } from "@ambaril/ui/components/badge";
import { Button } from "@ambaril/ui/components/button";
import { updateCreator } from "@/app/actions/creators/crud";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProfileFormProps {
  creatorId: string;
  initialData: {
    name: string;
    email: string;
    cpf: string;
    bio: string | null;
    pixKey: string | null;
    pixKeyType: "cpf" | "email" | "phone" | "random" | null;
    clothingSize: string | null;
    address: unknown;
    tierName: string | null;
    commissionRate: string;
    joinedAt: string | null;
    profileImageUrl: string | null;
  };
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const PIX_KEY_TYPE_OPTIONS = [
  { value: "cpf", label: "CPF" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave aleatoria" },
];

const CLOTHING_SIZE_OPTIONS = [
  { value: "PP", label: "PP" },
  { value: "P", label: "P" },
  { value: "M", label: "M" },
  { value: "G", label: "G" },
  { value: "GG", label: "GG" },
  { value: "XG", label: "XG" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCpf(cpf: string): string {
  if (cpf.length !== 11) return cpf;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

interface AddressData {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

function parseAddress(address: unknown): AddressData {
  if (!address || typeof address !== "object") return {};
  return address as AddressData;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ProfileForm({ creatorId, initialData }: ProfileFormProps) {
  const [name, setName] = React.useState(initialData.name);
  const [bio, setBio] = React.useState(initialData.bio ?? "");
  const [pixKey, setPixKey] = React.useState(initialData.pixKey ?? "");
  const [pixKeyType, setPixKeyType] = React.useState(initialData.pixKeyType ?? "cpf");
  const [clothingSize, setClothingSize] = React.useState(initialData.clothingSize ?? "");
  const [profileImageUrl, setProfileImageUrl] = React.useState(initialData.profileImageUrl ?? "");

  // Address state
  const addr = parseAddress(initialData.address);
  const [street, setStreet] = React.useState(addr.street ?? "");
  const [addrNumber, setAddrNumber] = React.useState(addr.number ?? "");
  const [complement, setComplement] = React.useState(addr.complement ?? "");
  const [neighborhood, setNeighborhood] = React.useState(addr.neighborhood ?? "");
  const [city, setCity] = React.useState(addr.city ?? "");
  const [state, setState] = React.useState(addr.state ?? "");
  const [zipCode, setZipCode] = React.useState(addr.zipCode ?? "");

  const [isSaving, setIsSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setFeedback(null);

    try {
      const updateData: Record<string, unknown> = {
        name: name.trim(),
        bio: bio.trim() || undefined,
        pixKey: pixKey.trim() || undefined,
        pixKeyType: pixKey.trim() ? pixKeyType : undefined,
        clothingSize: clothingSize || undefined,
        profileImageUrl: profileImageUrl.trim() || undefined,
        address: {
          street: street.trim(),
          number: addrNumber.trim(),
          complement: complement.trim() || undefined,
          neighborhood: neighborhood.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
        },
      };

      const result = await updateCreator(creatorId, updateData);

      if (result.error) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: "Perfil atualizado com sucesso." });
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Non-editable display fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-text-secondary">
            Informacoes Fixas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs text-text-muted">CPF</p>
              <p className="font-['DM_Mono',monospace] text-sm text-text-primary">
                {formatCpf(initialData.cpf)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-muted">E-mail</p>
              <p className="text-sm text-text-primary">{initialData.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-muted">Tier</p>
              <div>
                {initialData.tierName ? (
                  <Badge variant="secondary">{initialData.tierName}</Badge>
                ) : (
                  <span className="text-sm text-text-ghost">Nao atribuido</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-muted">Comissao</p>
              <p className="font-['DM_Mono',monospace] text-sm text-text-primary">
                {initialData.commissionRate}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-muted">Membro desde</p>
              <p className="text-sm text-text-primary">
                {initialData.joinedAt
                  ? new Date(initialData.joinedAt).toLocaleDateString("pt-BR")
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-text-secondary">
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="URL da foto de perfil"
              placeholder="https://..."
              value={profileImageUrl}
              onChange={(e) => setProfileImageUrl(e.target.value)}
            />
          </div>

          <FormTextarea
            label="Bio"
            placeholder="Conte um pouco sobre voce..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Chave PIX"
              placeholder="CPF, e-mail, telefone ou chave aleatoria"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
            />
            <FormSelect
              label="Tipo da chave"
              options={PIX_KEY_TYPE_OPTIONS}
              value={pixKeyType}
              onChange={(value) =>
                setPixKeyType(value as "cpf" | "email" | "phone" | "random")
              }
            />
            <FormSelect
              label="Tamanho de roupa"
              options={CLOTHING_SIZE_OPTIONS}
              value={clothingSize}
              onChange={setClothingSize}
              placeholder="Selecione"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-text-secondary">
            Endereco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="CEP"
              placeholder="00000000"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
            />
            <Input
              label="Rua"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Numero"
              value={addrNumber}
              onChange={(e) => setAddrNumber(e.target.value)}
            />
            <Input
              label="Complemento"
              placeholder="Apto, bloco..."
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
            />
            <Input
              label="Bairro"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Cidade"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="UF"
              placeholder="RJ"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feedback & save */}
      {feedback && (
        <p
          className={`text-sm ${
            feedback.type === "success" ? "text-success" : "text-danger"
          }`}
        >
          {feedback.message}
        </p>
      )}

      <div className="flex justify-end">
        <Button onPress={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar perfil"}
        </Button>
      </div>
    </div>
  );
}

export { ProfileForm };
