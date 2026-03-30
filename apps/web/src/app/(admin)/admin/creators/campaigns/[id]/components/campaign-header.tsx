"use client";

import { Badge } from "@ambaril/ui/components/badge";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import type { StatusBadgeProps } from "@ambaril/ui/components/status-badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CampaignHeaderProps {
  name: string;
  campaignType: string;
  status: string;
  startDate: string;
  endDate: string | null;
}

// ---------------------------------------------------------------------------
// Status map
// ---------------------------------------------------------------------------

const CAMPAIGN_STATUS_MAP: StatusBadgeProps["statusMap"] = {
  draft: { label: "Rascunho", variant: "default" },
  active: { label: "Ativa", variant: "success" },
  completed: { label: "Concluida", variant: "info" },
  cancelled: { label: "Cancelada", variant: "danger" },
};

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  seeding: "Seeding",
  paid: "Paga",
  gifting: "Gifting",
  reward: "Recompensa",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CampaignHeader({
  name,
  campaignType,
  status,
  startDate,
  endDate,
}: CampaignHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-text-bright">{name}</h1>
          <Badge variant="secondary">
            {CAMPAIGN_TYPE_LABELS[campaignType] ?? campaignType}
          </Badge>
          <StatusBadge status={status} statusMap={CAMPAIGN_STATUS_MAP} />
        </div>
        <p className="text-sm text-text-secondary">
          {formatDate(startDate)}
          {endDate ? ` — ${formatDate(endDate)}` : " — Sem data de fim"}
        </p>
      </div>
    </div>
  );
}
