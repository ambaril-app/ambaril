"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@ambaril/ui/components/modal";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { FormSelect } from "@ambaril/ui/components/form-select";
import { FormTextarea } from "@ambaril/ui/components/form-textarea";
import { submitProof } from "@/app/actions/creators/challenges";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubmitProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  challengeName: string;
}

const PROOF_TYPE_OPTIONS = [
  { value: "instagram_post", label: "Post Instagram" },
  { value: "instagram_story", label: "Story Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "other", label: "Outro" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SubmitProofModal({
  isOpen,
  onClose,
  challengeId,
  challengeName,
}: SubmitProofModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [proofUrl, setProofUrl] = useState("");
  const [proofType, setProofType] = useState("instagram_post");
  const [caption, setCaption] = useState("");

  const resetForm = useCallback(() => {
    setProofUrl("");
    setProofType("instagram_post");
    setCaption("");
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!proofUrl.trim()) {
      setError("URL da prova é obrigatória");
      return;
    }

    try {
      new URL(proofUrl.trim());
    } catch {
      setError("URL invalida");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await submitProof(challengeId, {
      proofUrl: proofUrl.trim(),
      proofType: proofType as "instagram_post" | "instagram_story" | "tiktok" | "youtube" | "other",
      caption: caption.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    handleClose();
    router.refresh();
  }, [proofUrl, proofType, caption, challengeId, handleClose, router]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Participar: ${challengeName}`}
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md bg-[var(--danger-muted)] px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <Input
          label="URL da prova"
          placeholder="https://instagram.com/p/..."
          value={proofUrl}
          onChange={(e) => setProofUrl(e.target.value)}
          required
        />

        <FormSelect
          label="Tipo de conteúdo"
          options={PROOF_TYPE_OPTIONS}
          value={proofType}
          onChange={setProofType}
        />

        <FormTextarea
          label="Legenda (opcional)"
          placeholder="Adicione uma descrição ou comentário..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={2000}
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onPress={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Prova"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
