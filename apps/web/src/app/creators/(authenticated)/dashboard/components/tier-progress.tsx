"use client";

import { Badge } from "@ambaril/ui/components/badge";

interface TierProgressProps {
  tierName: string | null;
  tierSlug: string | null;
  totalPoints: number;
  /** Next tier threshold — when null, creator is at the highest tier */
  nextTierThreshold: number | null;
  nextTierName: string | null;
}

export function TierProgress({
  tierName,
  totalPoints,
  nextTierThreshold,
  nextTierName,
}: TierProgressProps) {
  // Calculate progress percentage
  const progress = nextTierThreshold
    ? Math.min((totalPoints / nextTierThreshold) * 100, 100)
    : 100;

  const isMaxTier = nextTierThreshold === null;

  return (
    <div className="rounded-xl border border-border-default bg-bg-base p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.04em] text-text-muted">
            Tier atual
          </span>
          <Badge variant="default">{tierName ?? "Sem tier"}</Badge>
        </div>
        {!isMaxTier && nextTierName && (
          <span className="text-xs text-text-secondary">
            Proximo: {nextTierName}
          </span>
        )}
        {isMaxTier && (
          <span className="text-xs text-success">Tier maximo</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-bg-surface">
          <div
            className="h-full rounded-full bg-text-tertiary transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="font-mono text-xs tabular-nums text-text-secondary">
            {totalPoints.toLocaleString("pt-BR")} pts
          </span>
          {nextTierThreshold !== null && (
            <span className="font-mono text-xs tabular-nums text-text-muted">
              {nextTierThreshold.toLocaleString("pt-BR")} pts
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
