"use client";

import { Input } from "@ambaril/ui/components/input";
import { FormSelect } from "@ambaril/ui/components/form-select";
import type { RegistrationStep1Input } from "@ambaril/shared/schemas";

// ---------------------------------------------------------------------------
// Brazilian states (UF) options
// ---------------------------------------------------------------------------

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

interface Step1PersonalProps {
  data: Partial<RegistrationStep1Input>;
  errors: Partial<Record<keyof RegistrationStep1Input, string>>;
  onChange: (field: keyof RegistrationStep1Input, value: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Step1Personal({ data, errors, onChange }: Step1PersonalProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-text-bright">Dados Pessoais</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Preencha suas informacoes pessoais para comecar.
        </p>
      </div>

      <Input
        label="Nome completo"
        placeholder="Seu nome"
        required
        value={data.name ?? ""}
        onChange={(e) => onChange("name", e.target.value)}
        errorMessage={errors.name}
        autoComplete="name"
      />

      <Input
        label="Email"
        type="email"
        placeholder="seu@email.com"
        required
        value={data.email ?? ""}
        onChange={(e) => onChange("email", e.target.value)}
        errorMessage={errors.email}
        autoComplete="email"
      />

      <Input
        label="Telefone"
        placeholder="11999998888"
        required
        value={data.phone ?? ""}
        onChange={(e) => {
          // Allow only digits
          const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
          onChange("phone", digits);
        }}
        errorMessage={errors.phone}
        autoComplete="tel"
      />

      <Input
        label="CPF"
        placeholder="00000000000"
        required
        value={data.cpf ?? ""}
        onChange={(e) => {
          // Allow only digits
          const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
          onChange("cpf", digits);
        }}
        errorMessage={errors.cpf}
      />

      <Input
        label="Data de nascimento"
        type="date"
        value={data.birthDate ?? ""}
        onChange={(e) => onChange("birthDate", e.target.value)}
        errorMessage={errors.birthDate}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Cidade"
          placeholder="Sua cidade"
          required
          value={data.city ?? ""}
          onChange={(e) => onChange("city", e.target.value)}
          errorMessage={errors.city}
          autoComplete="address-level2"
        />

        <FormSelect
          label="Estado (UF)"
          placeholder="Selecione"
          required
          options={UF_OPTIONS}
          value={data.state ?? ""}
          onChange={(value) => onChange("state", value)}
          errorMessage={errors.state}
        />
      </div>
    </div>
  );
}
