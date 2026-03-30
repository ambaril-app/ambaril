"use client";

import { useState, useCallback, useTransition } from "react";
import { Modal } from "@ambaril/ui/components/modal";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { FormTextarea } from "@ambaril/ui/components/form-textarea";
import { FormSelect } from "@ambaril/ui/components/form-select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChallengeRow {
  id: string;
  name: string;
  description: string;
  category: string;
  month: number;
  year: number;
  pointsReward: number;
  requirements: unknown;
  maxParticipants: number | null;
  startsAt: Date;
  endsAt: Date;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChallengeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: ChallengeRow | null;
  onSubmit: (data: Record<string, unknown>) => Promise<{ error?: string }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS = [
  { value: "engagement", label: "Engajamento" },
  { value: "sales", label: "Vendas" },
  { value: "content", label: "Conteudo" },
  { value: "community", label: "Comunidade" },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2026, i, 1).toLocaleDateString("pt-BR", { month: "long" }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChallengeFormModal({
  isOpen,
  onClose,
  challenge,
  onSubmit,
}: ChallengeFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(challenge?.name ?? "");
  const [description, setDescription] = useState(challenge?.description ?? "");
  const [category, setCategory] = useState(challenge?.category ?? "engagement");
  const [month, setMonth] = useState(String(challenge?.month ?? new Date().getMonth() + 1));
  const [year, setYear] = useState(String(challenge?.year ?? new Date().getFullYear()));
  const [pointsReward, setPointsReward] = useState(String(challenge?.pointsReward ?? "100"));
  const [requirements, setRequirements] = useState(
    challenge?.requirements ? JSON.stringify(challenge.requirements, null, 2) : "{}",
  );
  const [maxParticipants, setMaxParticipants] = useState(
    challenge?.maxParticipants ? String(challenge.maxParticipants) : "",
  );
  const [startsAt, setStartsAt] = useState(
    challenge?.startsAt ? formatDatetimeLocal(new Date(challenge.startsAt)) : "",
  );
  const [endsAt, setEndsAt] = useState(
    challenge?.endsAt ? formatDatetimeLocal(new Date(challenge.endsAt)) : "",
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = useCallback(() => {
    setError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Nome e obrigatorio";
    if (description.length < 10) errors.description = "Descricao deve ter pelo menos 10 caracteres";
    if (!category) errors.category = "Categoria e obrigatoria";

    const parsedMonth = parseInt(month, 10);
    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      errors.month = "Mes invalido";
    }

    const parsedYear = parseInt(year, 10);
    if (isNaN(parsedYear) || parsedYear < 2026) {
      errors.year = "Ano deve ser 2026 ou posterior";
    }

    const parsedPoints = parseInt(pointsReward, 10);
    if (isNaN(parsedPoints) || parsedPoints < 50 || parsedPoints > 500) {
      errors.pointsReward = "Pontos devem ser entre 50 e 500";
    }

    let parsedRequirements: Record<string, unknown> = {};
    try {
      parsedRequirements = JSON.parse(requirements) as Record<string, unknown>;
    } catch {
      errors.requirements = "JSON invalido";
    }

    if (!startsAt) errors.startsAt = "Data de inicio e obrigatoria";
    if (!endsAt) errors.endsAt = "Data de fim e obrigatoria";
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      errors.endsAt = "Data de fim deve ser posterior a data de inicio";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const parsedMaxParticipants = maxParticipants
      ? parseInt(maxParticipants, 10)
      : undefined;

    startTransition(async () => {
      const result = await onSubmit({
        name: name.trim(),
        description,
        category,
        month: parsedMonth,
        year: parsedYear,
        pointsReward: parsedPoints,
        requirements: parsedRequirements,
        maxParticipants: parsedMaxParticipants,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      });
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }, [
    name, description, category, month, year, pointsReward,
    requirements, maxParticipants, startsAt, endsAt, onSubmit, onClose,
  ]);

  const title = challenge ? "Editar Desafio" : "Novo Desafio";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        <Input
          label="Nome"
          placeholder="Ex: Desafio de Estilo do Mes"
          value={name}
          onChange={(e) => setName(e.target.value)}
          errorMessage={fieldErrors.name}
          required
        />

        <FormTextarea
          label="Descricao"
          placeholder="Descreva o desafio em detalhes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          errorMessage={fieldErrors.description}
          rows={3}
          maxLength={5000}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Categoria"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={setCategory}
            errorMessage={fieldErrors.category}
            required
          />

          <Input
            label="Pontos de Recompensa"
            type="number"
            placeholder="100"
            value={pointsReward}
            onChange={(e) => setPointsReward(e.target.value)}
            errorMessage={fieldErrors.pointsReward}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Mes"
            options={MONTH_OPTIONS}
            value={month}
            onChange={setMonth}
            errorMessage={fieldErrors.month}
            required
          />

          <Input
            label="Ano"
            type="number"
            placeholder="2026"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            errorMessage={fieldErrors.year}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-text-secondary">Data/Hora de Inicio</label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-border-default bg-bg-raised px-3 py-2 text-sm text-text-primary focus:border-border-strong focus:outline-none"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
            {fieldErrors.startsAt && (
              <p className="text-xs text-danger">{fieldErrors.startsAt}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm text-text-secondary">Data/Hora de Fim</label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-border-default bg-bg-raised px-3 py-2 text-sm text-text-primary focus:border-border-strong focus:outline-none"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
            {fieldErrors.endsAt && (
              <p className="text-xs text-danger">{fieldErrors.endsAt}</p>
            )}
          </div>
        </div>

        <Input
          label="Maximo de Participantes (opcional)"
          type="number"
          placeholder="Sem limite"
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(e.target.value)}
        />

        <div className="space-y-1">
          <label className="text-sm text-text-secondary">Requisitos (JSON)</label>
          <textarea
            className="w-full rounded-lg border border-border-default bg-bg-raised px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-ghost focus:border-border-strong focus:outline-none"
            rows={3}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder='{"min_posts": 3, "hashtag": "#ciena"}'
          />
          {fieldErrors.requirements && (
            <p className="text-xs text-danger">{fieldErrors.requirements}</p>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onPress={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onPress={handleSubmit} disabled={isPending}>
            {isPending
              ? "Salvando..."
              : challenge
                ? "Salvar Alteracoes"
                : "Criar Desafio"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
