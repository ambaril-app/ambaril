"use client";

import { useState } from "react";
import { Copy, Check, Link as LinkIcon, QrCode } from "lucide-react";

interface UtmLinksProps {
  couponCode: string;
  /** Base URL for UTM links (tenant domain) */
  baseUrl: string;
}

interface UtmLinkItem {
  id: string;
  label: string;
  platform: string;
  url: string;
}

export function UtmLinks({ couponCode, baseUrl }: UtmLinksProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pre-generate UTM links for common platforms
  const links: UtmLinkItem[] = [
    {
      id: "instagram",
      label: "Instagram",
      platform: "instagram",
      url: `${baseUrl}?utm_source=instagram&utm_medium=creator&utm_campaign=organic&utm_content=${couponCode}`,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      platform: "whatsapp",
      url: `${baseUrl}?utm_source=whatsapp&utm_medium=creator&utm_campaign=organic&utm_content=${couponCode}`,
    },
    {
      id: "tiktok",
      label: "TikTok",
      platform: "tiktok",
      url: `${baseUrl}?utm_source=tiktok&utm_medium=creator&utm_campaign=organic&utm_content=${couponCode}`,
    },
  ];

  async function handleCopy(linkId: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(linkId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(linkId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  return (
    <div className="space-y-4">
      {/* UTM Links section */}
      <div className="rounded-xl border border-border-default bg-bg-base p-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.04em] text-text-muted">
          Links com UTM
        </h3>

        <div className="space-y-2">
          {links.map((link) => {
            const isCopied = copiedId === link.id;

            return (
              <div
                key={link.id}
                className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-raised px-3 py-2"
              >
                <LinkIcon size={14} className="flex-shrink-0 text-text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-text-secondary">
                    {link.label}
                  </p>
                  <p className="truncate font-mono text-xs text-text-muted">
                    {link.url}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(link.id, link.url)}
                  className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary"
                  aria-label={`Copiar link ${link.label}`}
                >
                  {isCopied ? (
                    <Check size={16} className="text-success" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR Code placeholder */}
      <div className="rounded-xl border border-border-default bg-bg-base p-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.04em] text-text-muted">
          QR Code
        </h3>

        <div className="flex flex-col items-center justify-center rounded-lg border border-border-subtle bg-bg-raised px-6 py-10">
          <QrCode size={48} className="text-text-ghost" />
          <p className="mt-3 text-sm text-text-secondary">
            QR Code do seu cupom
          </p>
          <p className="mt-1 font-mono text-xs text-text-muted">
            {couponCode}
          </p>
        </div>
      </div>
    </div>
  );
}
