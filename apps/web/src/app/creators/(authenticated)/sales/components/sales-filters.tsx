"use client";

import * as React from "react";
import { Input } from "@ambaril/ui/components/input";
import { FormSelect } from "@ambaril/ui/components/form-select";
import { Button } from "@ambaril/ui/components/button";
import { Search, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SalesFiltersState {
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface SalesFiltersProps {
  filters: SalesFiltersState;
  onFiltersChange: (filters: SalesFiltersState) => void;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "pending", label: "Pendente" },
  { value: "confirmed", label: "Confirmada" },
  { value: "adjusted", label: "Ajustada" },
  { value: "cancelled", label: "Cancelada" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function SalesFilters({ filters, onFiltersChange }: SalesFiltersProps) {
  const hasFilters = filters.status !== "" || filters.dateFrom !== "" || filters.dateTo !== "";

  function handleClear() {
    onFiltersChange({ status: "", dateFrom: "", dateTo: "" });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
      <div className="min-w-[160px]">
        <FormSelect
          label="Status"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(value) =>
            onFiltersChange({ ...filters, status: value })
          }
        />
      </div>

      <div className="min-w-[140px]">
        <Input
          type="date"
          label="De"
          value={filters.dateFrom}
          onChange={(e) =>
            onFiltersChange({ ...filters, dateFrom: e.target.value })
          }
        />
      </div>

      <div className="min-w-[140px]">
        <Input
          type="date"
          label="Ate"
          value={filters.dateTo}
          onChange={(e) =>
            onFiltersChange({ ...filters, dateTo: e.target.value })
          }
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onPress={handleClear} aria-label="Limpar filtros">
          <X className="mr-1 h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}

export { SalesFilters };
