"use client";

import * as React from "react";
import { Input } from "@ambaril/ui/components/input";
import { FormSelect } from "@ambaril/ui/components/form-select";
import { FormTextarea } from "@ambaril/ui/components/form-textarea";
import { Checkbox } from "@ambaril/ui/components/checkbox";
import type { RegistrationStep3Input } from "@ambaril/shared/schemas";
import type { AddressInput } from "@ambaril/shared/validators";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTENT_NICHES = [
  { value: "moda", label: "Moda" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "fitness", label: "Fitness" },
  { value: "beleza", label: "Beleza" },
  { value: "street", label: "Street" },
  { value: "tech", label: "Tech" },
  { value: "viagem", label: "Viagem" },
  { value: "gastronomia", label: "Gastronomia" },
];

const CONTENT_TYPES = [
  { value: "fotos", label: "Fotos" },
  { value: "videos", label: "Videos" },
  { value: "stories", label: "Stories" },
  { value: "reels", label: "Reels" },
  { value: "lives", label: "Lives" },
  { value: "reviews", label: "Reviews" },
];

const CLOTHING_SIZES = [
  { value: "PP", label: "PP" },
  { value: "P", label: "P" },
  { value: "M", label: "M" },
  { value: "G", label: "G" },
  { value: "GG", label: "GG" },
  { value: "XG", label: "XG" },
];

const UF_OPTIONS = [
  { value: "AC", label: "AC" },
  { value: "AL", label: "AL" },
  { value: "AM", label: "AM" },
  { value: "AP", label: "AP" },
  { value: "BA", label: "BA" },
  { value: "CE", label: "CE" },
  { value: "DF", label: "DF" },
  { value: "ES", label: "ES" },
  { value: "GO", label: "GO" },
  { value: "MA", label: "MA" },
  { value: "MG", label: "MG" },
  { value: "MS", label: "MS" },
  { value: "MT", label: "MT" },
  { value: "PA", label: "PA" },
  { value: "PB", label: "PB" },
  { value: "PE", label: "PE" },
  { value: "PI", label: "PI" },
  { value: "PR", label: "PR" },
  { value: "RJ", label: "RJ" },
  { value: "RN", label: "RN" },
  { value: "RO", label: "RO" },
  { value: "RR", label: "RR" },
  { value: "RS", label: "RS" },
  { value: "SC", label: "SC" },
  { value: "SE", label: "SE" },
  { value: "SP", label: "SP" },
  { value: "TO", label: "TO" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

// Fields that are string or string | undefined (simple text fields)
type SimpleStringFields =
  | "bio"
  | "motivation"
  | "discoverySource"
  | "clothingSize";

// Full error map for step 3 — includes nested address errors
interface Step3Errors {
  bio?: string;
  motivation?: string;
  contentNiches?: string;
  contentTypes?: string;
  discoverySource?: string;
  clothingSize?: string;
  contentRightsAccepted?: string;
  termsAccepted?: string;
  ambassadorOption?: string;
  address?: string;
  "address.street"?: string;
  "address.number"?: string;
  "address.complement"?: string;
  "address.neighborhood"?: string;
  "address.city"?: string;
  "address.state"?: string;
  "address.zipCode"?: string;
}

interface Step3AboutProps {
  data: Partial<RegistrationStep3Input>;
  errors: Step3Errors;
  onChangeText: (field: SimpleStringFields, value: string) => void;
  onChangeArray: (field: "contentNiches" | "contentTypes", value: string[]) => void;
  onChangeBoolean: (
    field: "contentRightsAccepted" | "termsAccepted" | "ambassadorOption",
    value: boolean,
  ) => void;
  onChangeAddress: (field: keyof AddressInput, value: string) => void;
}

// ---------------------------------------------------------------------------
// Multi-select chip component
// ---------------------------------------------------------------------------

function ChipSelect({
  label,
  options,
  selected,
  onChange,
  errorMessage,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (values: string[]) => void;
  errorMessage?: string;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm text-text-secondary">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm transition-colors duration-150 ${
                isSelected
                  ? "border-border-strong bg-bg-surface text-text-bright"
                  : "border-border-default bg-bg-raised text-text-secondary hover:border-border-strong"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {errorMessage && (
        <p className="text-xs text-danger">{errorMessage}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Step3About({
  data,
  errors,
  onChangeText,
  onChangeArray,
  onChangeBoolean,
  onChangeAddress,
}: Step3AboutProps) {
  const address = (data.address ?? {}) as Partial<AddressInput>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-text-bright">Sobre Você</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Conte-nos mais sobre você e seu conteúdo.
        </p>
      </div>

      {/* Bio */}
      <FormTextarea
        label="Bio"
        placeholder="Uma breve descrição sobre você (max 280 caracteres)"
        maxLength={280}
        value={data.bio ?? ""}
        onChange={(e) => onChangeText("bio", e.target.value)}
        errorMessage={errors.bio}
      />

      {/* Motivation */}
      <FormTextarea
        label="Motivação"
        placeholder="Por que você quer fazer parte do programa? (mínimo 20 caracteres)"
        required
        rows={4}
        value={data.motivation ?? ""}
        onChange={(e) => onChangeText("motivation", e.target.value)}
        errorMessage={errors.motivation}
      />

      {/* Content niches */}
      <ChipSelect
        label="Nichos de conteúdo *"
        options={CONTENT_NICHES}
        selected={data.contentNiches ?? []}
        onChange={(values) => onChangeArray("contentNiches", values)}
        errorMessage={errors.contentNiches}
      />

      {/* Content types */}
      <ChipSelect
        label="Tipos de conteúdo *"
        options={CONTENT_TYPES}
        selected={data.contentTypes ?? []}
        onChange={(values) => onChangeArray("contentTypes", values)}
        errorMessage={errors.contentTypes}
      />

      {/* Discovery source */}
      <Input
        label="Como nos encontrou?"
        placeholder="Instagram, indicacao, Google, etc."
        value={data.discoverySource ?? ""}
        onChange={(e) => onChangeText("discoverySource", e.target.value)}
        errorMessage={errors.discoverySource}
      />

      {/* Clothing size */}
      <FormSelect
        label="Tamanho de roupa"
        placeholder="Selecione"
        options={CLOTHING_SIZES}
        value={data.clothingSize ?? ""}
        onChange={(value) => onChangeText("clothingSize", value)}
        errorMessage={errors.clothingSize}
      />

      {/* Address section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-text-bright">Endereco</h3>

        <Input
          label="Rua"
          placeholder="Nome da rua"
          required
          value={address.street ?? ""}
          onChange={(e) => onChangeAddress("street", e.target.value)}
          errorMessage={errors["address.street"]}
          autoComplete="street-address"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Numero"
            placeholder="123"
            required
            value={address.number ?? ""}
            onChange={(e) => onChangeAddress("number", e.target.value)}
            errorMessage={errors["address.number"]}
          />

          <Input
            label="Complemento"
            placeholder="Apto, bloco (opcional)"
            value={address.complement ?? ""}
            onChange={(e) => onChangeAddress("complement", e.target.value)}
            errorMessage={errors["address.complement"]}
          />
        </div>

        <Input
          label="Bairro"
          placeholder="Nome do bairro"
          required
          value={address.neighborhood ?? ""}
          onChange={(e) => onChangeAddress("neighborhood", e.target.value)}
          errorMessage={errors["address.neighborhood"]}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label="Cidade"
            placeholder="Sua cidade"
            required
            value={address.city ?? ""}
            onChange={(e) => onChangeAddress("city", e.target.value)}
            errorMessage={errors["address.city"]}
            autoComplete="address-level2"
          />

          <FormSelect
            label="Estado (UF)"
            placeholder="UF"
            required
            options={UF_OPTIONS}
            value={address.state ?? ""}
            onChange={(value) => onChangeAddress("state", value)}
            errorMessage={errors["address.state"]}
          />

          <Input
            label="CEP"
            placeholder="00000000"
            required
            value={address.zipCode ?? ""}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
              onChangeAddress("zipCode", digits);
            }}
            errorMessage={errors["address.zipCode"]}
            autoComplete="postal-code"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3 pt-2">
        <Checkbox
          isSelected={data.ambassadorOption ?? false}
          onValueChange={(checked) => onChangeBoolean("ambassadorOption", checked)}
          label="Quero ser Embaixador (sem comissão, com desconto)"
        />

        <Checkbox
          isSelected={data.contentRightsAccepted === true}
          onValueChange={(checked) => onChangeBoolean("contentRightsAccepted", checked)}
          label="Autorizo o uso do meu conteúdo pela marca *"
        />
        {errors.contentRightsAccepted && (
          <p className="text-xs text-danger">{errors.contentRightsAccepted}</p>
        )}

        <Checkbox
          isSelected={data.termsAccepted === true}
          onValueChange={(checked) => onChangeBoolean("termsAccepted", checked)}
          label="Aceito os termos e condicoes *"
        />
        {errors.termsAccepted && (
          <p className="text-xs text-danger">{errors.termsAccepted}</p>
        )}
      </div>
    </div>
  );
}
