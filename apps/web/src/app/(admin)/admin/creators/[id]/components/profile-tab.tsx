"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@ambaril/ui/components/card";
import { Button } from "@ambaril/ui/components/button";
import { Sheet } from "@ambaril/ui/components/sheet";
import { Input } from "@ambaril/ui/components/input";
import { FormTextarea } from "@ambaril/ui/components/form-textarea";
import { FormSelect } from "@ambaril/ui/components/form-select";
import { Pencil } from "lucide-react";
import { updateCreator } from "@/app/actions/creators/crud";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProfileTabProps {
  creator: {
    id: string;
    name: string;
    email: string;
    phone: string;
    cpf: string;
    bio: string | null;
    motivation: string | null;
    contentNiches: unknown;
    contentTypes: unknown;
    clothingSize: string | null;
    birthDate: string | null;
    discoverySource: string | null;
    address: unknown;
    paymentPreference: "pix" | "store_credit" | "product" | null;
    pixKey: string | null;
    pixKeyType: "cpf" | "email" | "phone" | "random" | null;
    managedByStaff: boolean;
    contentRightsAccepted: boolean;
    suspensionReason: string | null;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAddress(address: unknown): string {
  if (!address || typeof address !== "object") return "-";
  const a = address as Record<string, unknown>;
  const parts = [a["street"], a["number"], a["complement"], a["neighborhood"], a["city"], a["state"], a["zipCode"]];
  return parts.filter(Boolean).join(", ") || "-";
}

function formatNiches(niches: unknown): string {
  if (Array.isArray(niches)) return niches.join(", ");
  return "-";
}

function formatPaymentPref(pref: string | null): string {
  if (!pref) return "-";
  const map: Record<string, string> = {
    pix: "PIX",
    store_credit: "Credito em loja",
    product: "Produto",
  };
  return map[pref] ?? pref;
}

// ---------------------------------------------------------------------------
// Info row component
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
        {label}
      </span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ProfileTab({ creator }: ProfileTabProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = React.useState(creator.name);
  const [editBio, setEditBio] = React.useState(creator.bio ?? "");
  const [editClothingSize, setEditClothingSize] = React.useState(creator.clothingSize ?? "");
  const [editPixKey, setEditPixKey] = React.useState(creator.pixKey ?? "");
  const [editPaymentPref, setEditPaymentPref] = React.useState(creator.paymentPreference ?? "");

  async function handleSave() {
    setSaving(true);
    setError(null);

    const data: Record<string, unknown> = {};
    if (editName !== creator.name) data["name"] = editName;
    if (editBio !== (creator.bio ?? "")) data["bio"] = editBio || undefined;
    if (editClothingSize !== (creator.clothingSize ?? "")) data["clothingSize"] = editClothingSize || undefined;
    if (editPixKey !== (creator.pixKey ?? "")) data["pixKey"] = editPixKey || undefined;
    if (editPaymentPref !== (creator.paymentPreference ?? "")) data["paymentPreference"] = editPaymentPref || undefined;

    if (Object.keys(data).length === 0) {
      setIsEditOpen(false);
      return;
    }

    const result = await updateCreator(creator.id, data);
    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setIsEditOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informacoes Pessoais</CardTitle>
              <Button variant="ghost" size="sm" onPress={() => setIsEditOpen(true)}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border-subtle">
              <InfoRow label="Nome" value={creator.name} />
              <InfoRow label="Email" value={creator.email} />
              <InfoRow label="Telefone" value={creator.phone} />
              <InfoRow
                label="CPF"
                value={`${creator.cpf.slice(0, 3)}.${creator.cpf.slice(3, 6)}.${creator.cpf.slice(6, 9)}-${creator.cpf.slice(9)}`}
              />
              <InfoRow label="Data de nascimento" value={creator.birthDate ?? "-"} />
              <InfoRow label="Tamanho" value={creator.clothingSize ?? "-"} />
              <InfoRow
                label="Gerenciado pela equipe"
                value={creator.managedByStaff ? "Sim" : "Nao"}
              />
            </div>
          </CardContent>
        </Card>

        {/* About / Content */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre o Creator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border-subtle">
              <InfoRow label="Bio" value={creator.bio ?? "-"} />
              <InfoRow label="Motivação" value={creator.motivation ?? "-"} />
              <InfoRow label="Nichos de conteúdo" value={formatNiches(creator.contentNiches)} />
              <InfoRow label="Tipos de conteúdo" value={formatNiches(creator.contentTypes)} />
              <InfoRow label="Fonte de descoberta" value={creator.discoverySource ?? "-"} />
              <InfoRow
                label="Direitos de conteúdo aceitos"
                value={creator.contentRightsAccepted ? "Sim" : "Não"}
              />
              {creator.suspensionReason && (
                <InfoRow
                  label="Motivo da suspensão"
                  value={
                    <span className="text-danger">{creator.suspensionReason}</span>
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Endereco</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-primary">{formatAddress(creator.address)}</p>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border-subtle">
              <InfoRow label="Preferência" value={formatPaymentPref(creator.paymentPreference)} />
              {creator.paymentPreference === "pix" && (
                <>
                  <InfoRow label="Chave PIX" value={creator.pixKey ?? "-"} />
                  <InfoRow label="Tipo da chave" value={creator.pixKeyType ?? "-"} />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit sheet */}
      <Sheet
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setError(null);
        }}
        title="Editar Perfil"
        width="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <FormTextarea
            label="Bio"
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            maxLength={280}
          />
          <Input
            label="Tamanho de roupa"
            value={editClothingSize}
            onChange={(e) => setEditClothingSize(e.target.value)}
            placeholder="Ex: M, G, GG"
          />
          <FormSelect
            label="Preferência de pagamento"
            options={[
              { value: "", label: "Nenhuma" },
              { value: "pix", label: "PIX" },
              { value: "store_credit", label: "Crédito em loja" },
              { value: "product", label: "Produto" },
            ]}
            value={editPaymentPref}
            onChange={setEditPaymentPref}
          />
          {editPaymentPref === "pix" && (
            <Input
              label="Chave PIX"
              value={editPixKey}
              onChange={(e) => setEditPixKey(e.target.value)}
              placeholder="CPF, email, telefone ou chave aleatoria"
            />
          )}

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onPress={() => {
                setIsEditOpen(false);
                setError(null);
              }}
            >
              Cancelar
            </Button>
            <Button onPress={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

export { ProfileTab };
