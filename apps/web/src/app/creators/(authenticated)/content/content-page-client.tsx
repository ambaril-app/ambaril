"use client";

import { useState, useMemo } from "react";
import { ContentCard } from "./components/content-card";
import { Button } from "@ambaril/ui/components/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContentDetection {
  id: string;
  platform: string;
  postUrl: string;
  postType: string;
  caption: string | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  hashtagMatched: string | null;
  pointsAwarded: boolean;
  detectedAt: Date;
}

interface ContentPageClientProps {
  detections: ContentDetection[];
}

// ---------------------------------------------------------------------------
// Platform filter options
// ---------------------------------------------------------------------------

type PlatformFilter = "all" | "instagram" | "tiktok";

const FILTER_OPTIONS: { value: PlatformFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContentPageClient({ detections }: ContentPageClientProps) {
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  const filteredDetections = useMemo(() => {
    if (platformFilter === "all") return detections;
    return detections.filter((d) => d.platform === platformFilter);
  }, [detections, platformFilter]);

  return (
    <div className="space-y-4">
      {/* Platform filter tabs */}
      <div className="flex items-center gap-2">
        {FILTER_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={platformFilter === option.value ? "default" : "ghost"}
            size="sm"
            onPress={() => setPlatformFilter(option.value)}
            className="min-h-[44px]"
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Content grid */}
      {filteredDetections.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          Nenhum conteudo encontrado para esta plataforma.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredDetections.map((detection) => (
            <ContentCard key={detection.id} detection={detection} />
          ))}
        </div>
      )}
    </div>
  );
}
