"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle, Instagram } from "lucide-react";

interface ShareTemplatesProps {
  couponCode: string;
  discountPercent: string | null;
  creatorName: string;
}

interface TemplateItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  text: string;
}

export function ShareTemplates({
  couponCode,
  discountPercent,
  creatorName,
}: ShareTemplatesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const discount = discountPercent ? `${discountPercent}%` : "desconto";

  const templates: TemplateItem[] = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      text: `Oi! Usa meu cupom ${couponCode} e ganha ${discount} de desconto. Aproveita!`,
    },
    {
      id: "instagram-story",
      label: "Instagram Story",
      icon: Instagram,
      text: `${discount} OFF com o cupom ${couponCode} - link na bio`,
    },
    {
      id: "instagram-caption",
      label: "Legenda Instagram",
      icon: Instagram,
      text: `Cupom exclusivo de ${discount} de desconto!\nUsa o codigo ${couponCode} no checkout.\n\n#${creatorName.split(" ")[0]?.toLowerCase() ?? "creator"} #desconto #cupom`,
    },
  ];

  async function handleCopy(templateId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(templateId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(templateId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  return (
    <div className="rounded-xl border border-border-default bg-bg-base p-4">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.04em] text-text-muted">
        Templates de Compartilhamento
      </h3>

      <div className="space-y-3">
        {templates.map((template) => {
          const Icon = template.icon;
          const isCopied = copiedId === template.id;

          return (
            <div
              key={template.id}
              className="rounded-lg border border-border-subtle bg-bg-raised p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-text-muted" />
                  <span className="text-xs font-medium text-text-secondary">
                    {template.label}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(template.id, template.text)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary"
                  aria-label={`Copiar template ${template.label}`}
                >
                  {isCopied ? (
                    <Check size={16} className="text-success" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-text-tertiary">
                {template.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
