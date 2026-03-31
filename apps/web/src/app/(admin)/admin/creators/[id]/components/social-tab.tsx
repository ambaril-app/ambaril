"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@ambaril/ui/components/card";
import { Badge } from "@ambaril/ui/components/badge";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { Share2, ExternalLink, CheckCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SocialAccount {
  id: string;
  platform: "instagram" | "tiktok" | "youtube" | "pinterest" | "twitter" | "other";
  handle: string;
  url: string | null;
  followers: number | null;
  isPrimary: boolean;
  verifiedAt: Date | null;
}

interface SocialTabProps {
  socialAccounts: SocialAccount[];
}

// ---------------------------------------------------------------------------
// Platform display config
// ---------------------------------------------------------------------------

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  twitter: "Twitter / X",
  other: "Outra",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "text-[#E4405F]",
  tiktok: "text-text-primary",
  youtube: "text-[#FF0000]",
  pinterest: "text-[#BD081C]",
  twitter: "text-text-primary",
  other: "text-text-ghost",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function SocialTab({ socialAccounts }: SocialTabProps) {
  if (socialAccounts.length === 0) {
    return (
      <EmptyState
        icon={Share2}
        title="Nenhuma conta social cadastrada"
        description="As contas sociais do creator aparecerão aqui."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {socialAccounts.map((account) => (
        <Card key={account.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={PLATFORM_COLORS[account.platform] ?? "text-text-primary"}>
                {PLATFORM_LABELS[account.platform] ?? account.platform}
              </CardTitle>
              <div className="flex items-center gap-2">
                {account.isPrimary && (
                  <Badge variant="default">Principal</Badge>
                )}
                {account.verifiedAt && (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-bright">@{account.handle}</p>
              {account.followers !== null && (
                <p className="text-sm text-text-ghost">
                  <span className="font-mono">{account.followers.toLocaleString("pt-BR")}</span> seguidores
                </p>
              )}
              {account.url && (
                <a
                  href={account.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-text-ghost hover:text-text-primary transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir perfil
                </a>
              )}
              {account.verifiedAt && (
                <p className="text-xs text-text-ghost">
                  Verificada em {new Date(account.verifiedAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { SocialTab };
