"use client";

import { useState, useCallback, useTransition } from "react";
import { Modal } from "@ambaril/ui/components/modal";
import { Button } from "@ambaril/ui/components/button";
import { FormTextarea } from "@ambaril/ui/components/form-textarea";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  onReject: (submissionId: string, reason: string) => Promise<{ error?: string }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RejectModal({ isOpen, onClose, submissionId, onReject }: RejectModalProps) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleReject = useCallback(() => {
    setError(null);

    if (reason.length < 10) {
      setError("Motivo deve ter pelo menos 10 caracteres");
      return;
    }

    startTransition(async () => {
      const result = await onReject(submissionId, reason);
      if (result.error) {
        setError(result.error);
      } else {
        setReason("");
        onClose();
      }
    });
  }, [reason, submissionId, onReject, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rejeitar Submissao" size="md">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Informe o motivo da rejeicao. O creator sera notificado.
        </p>

        <FormTextarea
          label="Motivo da Rejeicao"
          placeholder="Descreva o motivo da rejeicao (minimo 10 caracteres)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          required
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onPress={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onPress={handleReject} disabled={isPending}>
            {isPending ? "Rejeitando..." : "Rejeitar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
