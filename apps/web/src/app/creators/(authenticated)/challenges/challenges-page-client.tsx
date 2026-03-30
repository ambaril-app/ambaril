"use client";

import { useState, useEffect, useCallback } from "react";
import { ChallengeCard } from "./components/challenge-card";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { DataTable } from "@ambaril/ui/components/data-table";
import type { DataTableColumn } from "@ambaril/ui/components/data-table";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { listSubmissions } from "@/app/actions/creators/challenges";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChallengeItem {
  id: string;
  name: string;
  description: string;
  category: string;
  pointsReward: number;
  requirements: unknown;
  maxParticipants: number | null;
  startsAt: Date;
  endsAt: Date;
  status: string;
}

interface SubmissionRow extends Record<string, unknown> {
  id: string;
  challengeName: string;
  proofUrl: string;
  proofType: string;
  status: string;
  pointsAwarded: number | null;
  createdAt: Date;
}

interface ChallengesPageClientProps {
  activeChallenges: ChallengeItem[];
  pastChallenges: ChallengeItem[];
  creatorId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROOF_TYPE_LABELS: Record<string, string> = {
  instagram_post: "Post IG",
  instagram_story: "Story IG",
  tiktok: "TikTok",
  youtube: "YouTube",
  other: "Outro",
};

const SUBMISSION_STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" }> = {
  pending: { label: "Pendente", variant: "warning" },
  approved: { label: "Aprovado", variant: "success" },
  rejected: { label: "Rejeitado", variant: "danger" },
};

function formatShortDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

// ---------------------------------------------------------------------------
// Submissions table columns
// ---------------------------------------------------------------------------

const submissionsColumns: DataTableColumn<SubmissionRow>[] = [
  {
    key: "challengeName",
    label: "Desafio",
  },
  {
    key: "proofType",
    label: "Tipo",
    render: (value) => PROOF_TYPE_LABELS[String(value)] ?? String(value),
  },
  {
    key: "proofUrl",
    label: "Prova",
    render: (value) => (
      <a
        href={String(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:underline"
      >
        Ver <ExternalLink className="h-3 w-3" />
      </a>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge status={String(value)} statusMap={SUBMISSION_STATUS_MAP} />
    ),
  },
  {
    key: "pointsAwarded",
    label: "Pontos",
    render: (value) => {
      const points = value as number | null;
      return points ? `+${points}` : "-";
    },
  },
  {
    key: "createdAt",
    label: "Data",
    render: (value) => formatShortDate(value as Date),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChallengesPageClient({
  activeChallenges,
  pastChallenges,
  creatorId,
}: ChallengesPageClientProps) {
  const [isPastOpen, setIsPastOpen] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Load all submissions for the creator's active challenges
  const loadSubmissions = useCallback(async () => {
    setIsLoadingSubmissions(true);
    const allSubmissions: SubmissionRow[] = [];

    // Fetch submissions for all active challenges
    const allChallenges = [...activeChallenges, ...pastChallenges];
    for (const challenge of allChallenges) {
      const result = await listSubmissions({ challengeId: challenge.id });
      if (result.data) {
        const creatorSubmissions = result.data.items
          .filter((sub) => sub.creatorId === creatorId)
          .map((sub) => ({
            id: sub.id,
            challengeName: challenge.name,
            proofUrl: sub.proofUrl,
            proofType: sub.proofType,
            status: sub.status,
            pointsAwarded: sub.pointsAwarded,
            createdAt: sub.createdAt,
          }));
        allSubmissions.push(...creatorSubmissions);
      }
    }

    setSubmissions(allSubmissions);
    setIsLoadingSubmissions(false);
  }, [activeChallenges, pastChallenges, creatorId]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  return (
    <div className="space-y-8">
      {/* Active challenges */}
      {activeChallenges.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-medium text-text-bright">
            Desafios Ativos
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                canParticipate
              />
            ))}
          </div>
        </section>
      )}

      {/* My submissions */}
      <section className="space-y-4">
        <h2 className="text-base font-medium text-text-bright">
          Minhas Submissoes
        </h2>
        <DataTable
          columns={submissionsColumns}
          data={submissions}
          isLoading={isLoadingSubmissions}
          emptyState={
            <div className="flex flex-col items-center justify-center py-8 text-text-muted">
              <p className="text-sm">Nenhuma submissao enviada ainda.</p>
            </div>
          }
        />
      </section>

      {/* Past challenges (collapsed) */}
      {pastChallenges.length > 0 && (
        <section className="space-y-4">
          <button
            type="button"
            onClick={() => setIsPastOpen(!isPastOpen)}
            className="flex min-h-[44px] items-center gap-2 text-base font-medium text-text-bright hover:text-text-primary transition-colors"
          >
            {isPastOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Desafios Encerrados ({pastChallenges.length})
          </button>

          {isPastOpen && (
            <div className="grid gap-4 sm:grid-cols-2">
              {pastChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  canParticipate={false}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
