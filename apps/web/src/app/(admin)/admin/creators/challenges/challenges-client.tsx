"use client";

import { useState, useCallback, useTransition } from "react";
import { DataTable } from "@ambaril/ui/components/data-table";
import type { DataTableColumn } from "@ambaril/ui/components/data-table";
import { Button } from "@ambaril/ui/components/button";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { FormSelect } from "@ambaril/ui/components/form-select";
import { Input } from "@ambaril/ui/components/input";
import {
  Trophy,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  listChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
} from "@/app/actions/creators/challenges";
import { ChallengeFormModal } from "./components/challenge-form-modal";
import { SubmissionReview } from "./components/submission-review";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChallengeRow {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  category: string;
  month: number;
  year: number;
  status: string;
  pointsReward: number;
  requirements: unknown;
  maxParticipants: number | null;
  startsAt: Date;
  endsAt: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

type ChallengeTableRow = ChallengeRow & Record<string, unknown>;

interface ChallengesClientProps {
  initialChallenges: ChallengeRow[];
  initialTotal: number;
  initialMonth: number;
  initialYear: number;
  initialError?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHALLENGE_STATUS_MAP: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }
> = {
  draft: { label: "Rascunho", variant: "default" },
  active: { label: "Ativo", variant: "success" },
  judging: { label: "Avaliando", variant: "info" },
  completed: { label: "Concluido", variant: "success" },
  cancelled: { label: "Cancelado", variant: "danger" },
};

const CATEGORY_LABELS: Record<string, string> = {
  engagement: "Engajamento",
  sales: "Vendas",
  content: "Conteudo",
  community: "Comunidade",
  drop: "Drop",
  style: "Estilo",
  viral: "Viral",
  surprise: "Surpresa",
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2026, i, 1).toLocaleDateString("pt-BR", { month: "long" }),
}));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChallengesClient({
  initialChallenges,
  initialTotal,
  initialMonth,
  initialYear,
  initialError,
}: ChallengesClientProps) {
  const [challenges, setChallenges] = useState<ChallengeRow[]>(initialChallenges);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState(String(initialMonth));
  const [year, setYear] = useState(String(initialYear));
  const [error, setError] = useState<string | undefined>(initialError);
  const [isPending, startTransition] = useTransition();

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<ChallengeRow | null>(null);

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const refreshChallenges = useCallback(
    (newPage?: number, newMonth?: string, newYear?: string) => {
      const p = newPage ?? page;
      const m = parseInt(newMonth ?? month, 10);
      const y = parseInt(newYear ?? year, 10);

      startTransition(async () => {
        const result = await listChallenges({
          page: p,
          per_page: 25,
          sort_order: "desc",
          month: m,
          year: y,
        });
        if (result.data) {
          setChallenges(result.data.items as unknown as ChallengeRow[]);
          setTotal(result.data.total);
          setError(undefined);
        } else {
          setError(result.error);
        }
      });
    },
    [page, month, year],
  );

  const handleMonthChange = useCallback(
    (value: string) => {
      setMonth(value);
      setPage(1);
      setExpandedId(null);
      refreshChallenges(1, value, year);
    },
    [refreshChallenges, year],
  );

  const handleYearChange = useCallback(
    (value: string) => {
      setYear(value);
      setPage(1);
      setExpandedId(null);
      refreshChallenges(1, month, value);
    },
    [refreshChallenges, month],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      refreshChallenges(newPage);
    },
    [refreshChallenges],
  );

  const handleCreate = useCallback(() => {
    setEditingChallenge(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((challenge: ChallengeRow) => {
    setEditingChallenge(challenge);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingChallenge(null);
  }, []);

  const handleModalSubmit = useCallback(
    async (data: Record<string, unknown>): Promise<{ error?: string }> => {
      if (editingChallenge) {
        const result = await updateChallenge(
          editingChallenge.id,
          data as Parameters<typeof updateChallenge>[1],
        );
        if (result.error) return { error: result.error };
      } else {
        const result = await createChallenge(
          data as Parameters<typeof createChallenge>[0],
        );
        if (result.error) return { error: result.error };
      }
      refreshChallenges();
      return {};
    },
    [editingChallenge, refreshChallenges],
  );

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        const result = await deleteChallenge(id);
        if (result.error) {
          setError(result.error);
        } else {
          setDeleteConfirmId(null);
          refreshChallenges();
        }
      });
    },
    [refreshChallenges],
  );

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const columns: DataTableColumn<ChallengeTableRow>[] = [
    {
      key: "expand",
      label: "",
      render: (_value, row) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Expandir submissoes"
          onPress={() => handleToggleExpand(row.id as string)}
        >
          {expandedId === (row.id as string) ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ),
    },
    {
      key: "name",
      label: "Nome",
      sortable: true,
      render: (_value, row) => (
        <span className="font-medium text-text-bright">{row.name as string}</span>
      ),
    },
    {
      key: "category",
      label: "Categoria",
      render: (_value, row) => (
        <span className="text-sm text-text-secondary">
          {CATEGORY_LABELS[row.category as string] ?? row.category}
        </span>
      ),
    },
    {
      key: "month",
      label: "Mes/Ano",
      render: (_value, row) => (
        <span className="text-sm text-text-secondary">
          {String(row.month as number).padStart(2, "0")}/{row.year as number}
        </span>
      ),
    },
    {
      key: "pointsReward",
      label: "Pontos",
      render: (_value, row) => (
        <span className="font-mono text-sm">{row.pointsReward as number}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_value, row) => (
        <StatusBadge
          status={row.status as string}
          statusMap={CHALLENGE_STATUS_MAP}
        />
      ),
    },
    {
      key: "maxParticipants",
      label: "Participantes",
      render: (_value, row) => (
        <span className="text-sm text-text-secondary">
          {(row.maxParticipants as number | null) ?? "Sem limite"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Acoes",
      render: (_value, row) => {
        const isDraft = (row.status as string) === "draft";
        return (
          <div className="flex items-center gap-2">
            {isDraft && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Editar desafio"
                  onPress={() => handleEdit(row as unknown as ChallengeRow)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {deleteConfirmId === (row.id as string) ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      onPress={() => handleDelete(row.id as string)}
                    >
                      Confirmar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => setDeleteConfirmId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir desafio"
                    onPress={() => setDeleteConfirmId(row.id as string)}
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];

  const tableData: ChallengeTableRow[] = challenges.map((c) => ({ ...c }));

  return (
    <>
      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          <FormSelect
            label="Mes"
            options={MONTH_OPTIONS}
            value={month}
            onChange={handleMonthChange}
            className="w-40"
          />
          <Input
            label="Ano"
            type="number"
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-28"
          />
        </div>

        <Button onPress={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Desafio
        </Button>
      </div>

      {challenges.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Nenhum desafio encontrado"
          description="Crie o primeiro desafio do mes para os creators"
          action={{ label: "Criar Desafio", onPress: handleCreate }}
        />
      ) : (
        <div className="space-y-0">
          <DataTable
            columns={columns}
            data={tableData}
            isLoading={isPending}
            pagination={{
              page,
              pageSize: 25,
              total,
              onPageChange: handlePageChange,
            }}
          />

          {/* Expanded submission review */}
          {expandedId && (
            <div className="rounded-b-lg border border-t-0 border-border-default bg-bg-raised px-6 py-4">
              <SubmissionReview challengeId={expandedId} />
            </div>
          )}
        </div>
      )}

      <ChallengeFormModal
        key={editingChallenge?.id ?? "new"}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        challenge={editingChallenge}
        onSubmit={handleModalSubmit}
      />
    </>
  );
}
