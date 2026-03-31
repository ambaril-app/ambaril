"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, X, Plus } from "lucide-react";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { FormTextarea } from "@ambaril/ui/components/form-textarea";
import { FormDatePicker } from "@ambaril/ui/components/form-date-picker";
import { Modal } from "@ambaril/ui/components/modal";
import {
  createBrief,
  updateBrief,
  deleteBrief,
} from "@/app/actions/creators/briefs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BriefExample {
  type: string;
  url: string;
  caption?: string;
}

interface BriefData {
  id: string;
  campaignId: string;
  title: string;
  contentMd: string;
  hashtags: string[] | null;
  deadline: Date | string | null;
  targetTiers: string[] | null;
  examplesJson: unknown;
}

interface BriefFormProps {
  campaignId: string;
  existingBrief: BriefData | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BriefForm({ campaignId, existingBrief }: BriefFormProps) {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState(existingBrief?.title ?? "");
  const [contentMd, setContentMd] = useState(existingBrief?.contentMd ?? "");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>(existingBrief?.hashtags ?? []);
  const [deadline, setDeadline] = useState<Date | null>(() => {
    if (!existingBrief?.deadline) return null;
    return typeof existingBrief.deadline === "string"
      ? new Date(existingBrief.deadline)
      : existingBrief.deadline;
  });
  const [targetTiersInput, setTargetTiersInput] = useState("");
  const [targetTiers, setTargetTiers] = useState<string[]>(
    existingBrief?.targetTiers ?? [],
  );
  const [examples, setExamples] = useState<BriefExample[]>(() => {
    const raw = existingBrief?.examplesJson;
    if (Array.isArray(raw)) return raw as BriefExample[];
    return [];
  });

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // New example form
  const [newExType, setNewExType] = useState("image");
  const [newExUrl, setNewExUrl] = useState("");
  const [newExCaption, setNewExCaption] = useState("");

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // --- Hashtag management ---
  const addHashtag = useCallback(() => {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) {
      setHashtags((prev) => [...prev, tag]);
    }
    setHashtagInput("");
  }, [hashtagInput, hashtags]);

  const removeHashtag = useCallback((tag: string) => {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  }, []);

  // --- Target tiers management ---
  const addTargetTier = useCallback(() => {
    const tier = targetTiersInput.trim();
    if (tier && !targetTiers.includes(tier)) {
      setTargetTiers((prev) => [...prev, tier]);
    }
    setTargetTiersInput("");
  }, [targetTiersInput, targetTiers]);

  const removeTargetTier = useCallback((tier: string) => {
    setTargetTiers((prev) => prev.filter((t) => t !== tier));
  }, []);

  // --- Examples management ---
  const addExample = useCallback(() => {
    if (!newExUrl.trim()) return;
    setExamples((prev) => [
      ...prev,
      {
        type: newExType,
        url: newExUrl.trim(),
        caption: newExCaption.trim() || undefined,
      },
    ]);
    setNewExUrl("");
    setNewExCaption("");
  }, [newExType, newExUrl, newExCaption]);

  const removeExample = useCallback((index: number) => {
    setExamples((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // --- Save ---
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError("Título é obrigatório");
      return;
    }
    if (contentMd.length < 10) {
      setError("Conteudo deve ter pelo menos 10 caracteres");
      return;
    }

    setIsSaving(true);
    setError(null);

    const deadlineStr = deadline
      ? deadline.toISOString()
      : undefined;

    if (existingBrief) {
      // Update
      const result = await updateBrief(existingBrief.id, {
        title: title.trim(),
        contentMd,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        deadline: deadlineStr ?? null,
        targetTiers: targetTiers.length > 0 ? targetTiers : undefined,
        examplesJson: examples.length > 0 ? examples : undefined,
      });

      setIsSaving(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccessMsg("Briefing atualizado com sucesso");
    } else {
      // Create
      const result = await createBrief({
        campaignId,
        title: title.trim(),
        contentMd,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        deadline: deadlineStr,
        targetTiers: targetTiers.length > 0 ? targetTiers : undefined,
        examplesJson: examples.length > 0 ? examples : undefined,
      });

      setIsSaving(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccessMsg("Briefing criado com sucesso");
      router.refresh();
    }
  }, [
    title,
    contentMd,
    hashtags,
    deadline,
    targetTiers,
    examples,
    existingBrief,
    campaignId,
    router,
  ]);

  // --- Delete ---
  const handleDelete = useCallback(async () => {
    if (!existingBrief) return;
    setIsDeleting(true);
    setError(null);

    const result = await deleteBrief(existingBrief.id);
    setIsDeleting(false);
    setShowDeleteConfirm(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push(`/admin/creators/campaigns/${campaignId}`);
    router.refresh();
  }, [existingBrief, campaignId, router]);

  return (
    <div className="space-y-6">
      {/* Feedback messages */}
      {error && (
        <div className="rounded-md bg-[var(--danger-muted)] px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-md bg-[var(--success-muted)] px-3 py-2 text-sm text-success">
          {successMsg}
        </div>
      )}

      {/* Title */}
      <Input
        label="Titulo do briefing"
        placeholder="Ex: Briefing Drop Inverno 2026"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      {/* Content */}
      <FormTextarea
        label="Conteudo (Markdown)"
        placeholder="Descreva as diretrizes para os creators..."
        value={contentMd}
        onChange={(e) => setContentMd(e.target.value)}
        rows={12}
        maxLength={50000}
        required
      />

      {/* Hashtags */}
      <div className="space-y-2">
        <label className="text-sm text-text-ghost">Hashtags</label>
        <div className="flex gap-2">
          <Input
            placeholder="#hashtag"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="outline"
            onPress={addHashtag}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-bg-surface px-2 py-1 text-xs text-text-primary"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeHashtag(tag)}
                  className="text-text-muted transition-colors hover:text-danger"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Deadline */}
      <FormDatePicker
        label="Prazo"
        value={deadline ?? undefined}
        onChange={(d) => setDeadline(d)}
      />

      {/* Target Tiers */}
      <div className="space-y-2">
        <label className="text-sm text-text-ghost">Tiers alvo</label>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: seed, grow, bloom"
            value={targetTiersInput}
            onChange={(e) => setTargetTiersInput(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" onPress={addTargetTier}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {targetTiers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {targetTiers.map((tier) => (
              <span
                key={tier}
                className="inline-flex items-center gap-1 rounded-md bg-bg-surface px-2 py-1 text-xs text-text-primary"
              >
                {tier}
                <button
                  type="button"
                  onClick={() => removeTargetTier(tier)}
                  className="text-text-muted transition-colors hover:text-danger"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Examples */}
      <div className="space-y-3">
        <label className="text-sm text-text-ghost">Exemplos</label>
        {examples.length > 0 && (
          <div className="space-y-2">
            {examples.map((ex, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-border-subtle bg-bg-raised px-3 py-2"
              >
                <span className="text-xs font-medium text-text-ghost uppercase">
                  {ex.type}
                </span>
                <a
                  href={ex.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-sm text-info hover:underline"
                >
                  {ex.url}
                </a>
                {ex.caption && (
                  <span className="text-xs text-text-muted">{ex.caption}</span>
                )}
                <button
                  type="button"
                  onClick={() => removeExample(i)}
                  className="text-text-muted transition-colors hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-12 gap-2">
          <Input
            placeholder="Tipo (image, video)"
            value={newExType}
            onChange={(e) => setNewExType(e.target.value)}
            className="col-span-2"
          />
          <Input
            placeholder="URL do exemplo"
            value={newExUrl}
            onChange={(e) => setNewExUrl(e.target.value)}
            className="col-span-5"
          />
          <Input
            placeholder="Legenda (opcional)"
            value={newExCaption}
            onChange={(e) => setNewExCaption(e.target.value)}
            className="col-span-4"
          />
          <div className="col-span-1 flex items-end">
            <Button variant="outline" size="sm" onPress={addExample}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-border-subtle pt-4">
        <div>
          {existingBrief && (
            <Button
              variant="destructive"
              onPress={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Excluir Briefing
            </Button>
          )}
        </div>
        <Button onPress={handleSave} disabled={isSaving}>
          <Save className="mr-1.5 h-4 w-4" />
          {isSaving
            ? "Salvando..."
            : existingBrief
              ? "Atualizar Briefing"
              : "Criar Briefing"}
        </Button>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirmar exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-ghost">
            Tem certeza que deseja excluir este briefing? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onPress={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onPress={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
