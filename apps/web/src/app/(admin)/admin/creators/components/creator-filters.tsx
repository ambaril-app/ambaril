"use client";

import * as React from "react";
import { Input } from "@ambaril/ui/components/input";
import { FormSelect, type FormSelectOption } from "@ambaril/ui/components/form-select";
import { Button } from "@ambaril/ui/components/button";
import { Search, X } from "lucide-react";
import { Checkbox } from "@ambaril/ui/components/checkbox";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TierOption {
  id: string;
  name: string;
}

interface CreatorFiltersState {
  status: string;
  tierId: string;
  managed: boolean | undefined;
  search: string;
}

interface CreatorFiltersProps {
  tiers: TierOption[];
  filters: CreatorFiltersState;
  onFiltersChange: (filters: CreatorFiltersState) => void;
}

// ---------------------------------------------------------------------------
// Status options
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: FormSelectOption[] = [
  { value: "", label: "Todos os status" },
  { value: "pending", label: "Pendente" },
  { value: "active", label: "Ativo" },
  { value: "suspended", label: "Suspenso" },
  { value: "inactive", label: "Inativo" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CreatorFilters({ tiers, filters, onFiltersChange }: CreatorFiltersProps) {
  const tierOptions: FormSelectOption[] = [
    { value: "", label: "Todos os tiers" },
    ...tiers.map((t) => ({ value: t.id, label: t.name })),
  ];

  const hasActiveFilters =
    filters.status !== "" ||
    filters.tierId !== "" ||
    filters.managed !== undefined ||
    filters.search !== "";

  function handleClear() {
    onFiltersChange({
      status: "",
      tierId: "",
      managed: undefined,
      search: "",
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Search */}
      <div className="min-w-[220px] flex-1">
        <Input
          placeholder="Buscar por nome ou email..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
        />
      </div>

      {/* Status */}
      <div className="w-[180px]">
        <FormSelect
          placeholder="Status"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(value) =>
            onFiltersChange({ ...filters, status: value })
          }
        />
      </div>

      {/* Tier */}
      <div className="w-[180px]">
        <FormSelect
          placeholder="Tier"
          options={tierOptions}
          value={filters.tierId}
          onChange={(value) =>
            onFiltersChange({ ...filters, tierId: value })
          }
        />
      </div>

      {/* Managed toggle */}
      <Checkbox
        isSelected={filters.managed === true}
        onValueChange={(checked) =>
          onFiltersChange({
            ...filters,
            managed: checked ? true : undefined,
          })
        }
        label="Gerenciados"
      />

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onPress={handleClear}>
          <X className="mr-1 h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}

export { CreatorFilters };
export type { CreatorFiltersState, TierOption };
