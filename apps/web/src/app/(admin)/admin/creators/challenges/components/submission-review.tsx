"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { DataTable } from "@ambaril/ui/components/data-table";
import type { DataTableColumn } from "@ambaril/ui/components/data-table";
import { Button } from "@ambaril/ui/components/button";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { CheckCircle, XCircle, ExternalLink, Inbox } from "lucide-react";
import {
  listSubmissions,
  approveSubmission,
  rejectSubmission,
} from "@/app/actions/creators/challenges";
import { RejectModal } from "./reject-modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubmissionRow {
  id: string;
  tenantId: string;
  challengeId: string;
  creatorId: string;
  proofUrl: string;
  proofType: string;
  caption: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  pointsAwarded: number | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  creatorName: string;
}

type SubmissionTableRow = SubmissionRow & Record<string, unknown>;

interface SubmissionReviewProps {
  challengeId: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUBMISSION_STATUS_MAP: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }
> = {
  pending: { label: "Pendente", variant: "warning" },
  approved: { label: "Aprovado", variant: "success" },
  rejected: { label: "Rejeitado", variant: "danger" },
};

const PROOF_TYPE_LABELS: Record<string, string> = {
  instagram_post: "Post Instagram",
  instagram_story: "Story Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  other: "Outro",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SubmissionReview({ challengeId }: SubmissionReviewProps) {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingSubmissionId, setRejectingSubmissionId] = useState<string | null>(null);

  const fetchSubmissions = useCallback(() => {
    startTransition(async () => {
      const result = await listSubmissions({ challengeId });
      if (result.data) {
        setSubmissions(result.data.items as unknown as SubmissionRow[]);
        setError(null);
      } else {
        setError(result.error ?? "Erro ao carregar submissoes");
      }
    });
  }, [challengeId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleApprove = useCallback(
    (submissionId: string) => {
      startTransition(async () => {
        const result = await approveSubmission(submissionId);
        if (result.error) {
          setError(result.error);
        } else {
          fetchSubmissions();
        }
      });
    },
    [fetchSubmissions],
  );

  const handleOpenReject = useCallback((submissionId: string) => {
    setRejectingSubmissionId(submissionId);
    setRejectModalOpen(true);
  }, []);

  const handleReject = useCallback(
    async (submissionId: string, reason: string): Promise<{ error?: string }> => {
      const result = await rejectSubmission(submissionId, reason);
      if (result.error) return { error: result.error };
      fetchSubmissions();
      return {};
    },
    [fetchSubmissions],
  );

  const columns: DataTableColumn<SubmissionTableRow>[] = [
    {
      key: "creatorName",
      label: "Creator",
      render: (_value, row) => (
        <span className="font-medium text-text-bright">{row.creatorName as string}</span>
      ),
    },
    {
      key: "proofUrl",
      label: "Prova",
      render: (_value, row) => (
        <a
          href={row.proofUrl as string}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-info hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ver prova
        </a>
      ),
    },
    {
      key: "proofType",
      label: "Tipo",
      render: (_value, row) => (
        <span className="text-sm text-text-secondary">
          {PROOF_TYPE_LABELS[row.proofType as string] ?? row.proofType}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_value, row) => (
        <StatusBadge status={row.status as string} statusMap={SUBMISSION_STATUS_MAP} />
      ),
    },
    {
      key: "actions",
      label: "Acoes",
      render: (_value, row) => {
        const status = row.status as string;
        if (status !== "pending") {
          return (
            <span className="text-xs text-text-muted">
              {status === "rejected" && row.rejectionReason
                ? `Motivo: ${(row.rejectionReason as string).slice(0, 30)}...`
                : "Avaliado"}
            </span>
          );
        }
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => handleApprove(row.id as string)}
              disabled={isPending}
              aria-label="Aprovar submissão"
            >
              <CheckCircle className="mr-1 h-3.5 w-3.5 text-success" />
              Aprovar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => handleOpenReject(row.id as string)}
              disabled={isPending}
              aria-label="Rejeitar submissão"
            >
              <XCircle className="mr-1 h-3.5 w-3.5 text-danger" />
              Rejeitar
            </Button>
          </div>
        );
      },
    },
  ];

  const tableData: SubmissionTableRow[] = submissions.map((s) => ({ ...s }));

  return (
    <div className="space-y-3 pt-2">
      <h3 className="text-sm font-medium text-text-bright">
        Submissoes ({submissions.length})
      </h3>

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      {submissions.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nenhuma submissão"
          description="Ainda não há submissões para este desafio"
          className="py-6"
        />
      ) : (
        <DataTable columns={columns} data={tableData} isLoading={isPending} />
      )}

      {rejectingSubmissionId && (
        <RejectModal
          isOpen={rejectModalOpen}
          onClose={() => {
            setRejectModalOpen(false);
            setRejectingSubmissionId(null);
          }}
          submissionId={rejectingSubmissionId}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
