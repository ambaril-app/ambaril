"use client";

import { Eye, X } from "lucide-react";
import { destroyCreatorSession } from "@/lib/creator-auth";

interface PreviewBannerProps {
  creatorName: string;
}

export function PreviewBanner({ creatorName }: PreviewBannerProps) {
  async function handleClose() {
    await destroyCreatorSession();
    window.close();
  }

  return (
    <div className="flex h-9 items-center justify-center gap-2 border-b border-info bg-info-muted px-4 text-xs text-info">
      <Eye size={14} />
      <span>
        Pre-visualizacao do portal de <strong>{creatorName}</strong>
      </span>
      <button
        onClick={handleClose}
        className="ml-2 inline-flex items-center gap-1 underline transition-opacity hover:opacity-80"
      >
        <X size={12} />
        Fechar
      </button>
    </div>
  );
}
