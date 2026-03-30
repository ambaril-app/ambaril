"use client";

import { useState, useCallback, useTransition } from "react";
import { Modal } from "@ambaril/ui/components/modal";
import { Button } from "@ambaril/ui/components/button";
import { FormDatePicker } from "@ambaril/ui/components/form-date-picker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalculatePayoutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCalculate: (periodStart: string, periodEnd: string) => Promise<{
    error?: string;
    data?: { created: number; skipped: number; totalGross: string };
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalculatePayoutsModal({
  isOpen,
  onClose,
  onCalculate,
}: CalculatePayoutsModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    totalGross: string;
  } | null>(null);

  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);

  const handleCalculate = useCallback(() => {
    setError(null);
    setResult(null);

    if (!periodStart) {
      setError("Data de inicio e obrigatoria");
      return;
    }
    if (!periodEnd) {
      setError("Data de fim e obrigatoria");
      return;
    }
    if (periodEnd <= periodStart) {
      setError("Data de fim deve ser posterior a data de inicio");
      return;
    }

    startTransition(async () => {
      const res = await onCalculate(formatDate(periodStart), formatDate(periodEnd));
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setResult(res.data);
      }
    });
  }, [periodStart, periodEnd, onCalculate]);

  const handleClose = useCallback(() => {
    setError(null);
    setResult(null);
    setPeriodStart(null);
    setPeriodEnd(null);
    onClose();
  }, [onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Calcular Pagamentos" size="md">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Selecione o periodo para calcular os pagamentos dos creators com base nas vendas
          atribuidas.
        </p>

        <FormDatePicker
          label="Data de Inicio"
          value={periodStart ?? undefined}
          onChange={(d) => setPeriodStart(d)}
          required
        />

        <FormDatePicker
          label="Data de Fim"
          value={periodEnd ?? undefined}
          onChange={(d) => setPeriodEnd(d)}
          required
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        {result && (
          <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 space-y-1">
            <p className="text-sm font-medium text-success">Calculo concluido</p>
            <p className="text-sm text-text-secondary">
              <span className="font-mono">{result.created}</span> pagamento(s) criado(s)
            </p>
            <p className="text-sm text-text-secondary">
              <span className="font-mono">{result.skipped}</span> creator(s) abaixo do minimo
            </p>
            <p className="text-sm text-text-secondary">
              Total bruto:{" "}
              <span className="font-mono font-medium text-text-bright">
                R$ {result.totalGross}
              </span>
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onPress={handleClose} disabled={isPending}>
            {result ? "Fechar" : "Cancelar"}
          </Button>
          {!result && (
            <Button onPress={handleCalculate} disabled={isPending}>
              {isPending ? "Calculando..." : "Calcular"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
