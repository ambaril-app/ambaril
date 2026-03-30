"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@ambaril/ui/components/modal";
import { Button } from "@ambaril/ui/components/button";
import { FormTextarea } from "@ambaril/ui/components/form-textarea";
import { resolveFlag } from "@/app/actions/creators/anti-fraud";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResolveFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  attributionId: string | null;
  action: "suspend" | "clear";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResolveFlagModal({
  isOpen,
  onClose,
  attributionId,
  action,
}: ResolveFlagModalProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setReason("");
    setError(null);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!attributionId) return;

    if (reason.trim().length < 10) {
      setError("Motivo deve ter pelo menos 10 caracteres");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await resolveFlag(attributionId, {
      action,
      reason: reason.trim(),
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    handleClose();
    router.refresh();
  }, [attributionId, action, reason, handleClose, router]);

  const isSuspend = action === "suspend";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isSuspend ? "Suspender Creator" : "Liberar Flag"}
      size="md"
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md bg-[var(--danger-muted)] px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <p className="text-sm text-text-secondary">
          {isSuspend
            ? "O creator sera suspenso e a atribuicao sera cancelada. Descreva o motivo."
            : "A atribuicao sera confirmada como valida. Descreva o motivo da liberacao."}
        </p>

        <FormTextarea
          label="Motivo"
          placeholder={
            isSuspend
              ? "Descreva o motivo da suspensao..."
              : "Descreva por que a flag foi liberada..."
          }
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={500}
          required
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onPress={handleClose}>
            Cancelar
          </Button>
          <Button
            variant={isSuspend ? "destructive" : "default"}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Processando..."
              : isSuspend
                ? "Suspender"
                : "Liberar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
