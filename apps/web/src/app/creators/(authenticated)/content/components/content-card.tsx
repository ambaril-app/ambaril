"use client";

import { Card, CardContent } from "@ambaril/ui/components/card";
import { Badge } from "@ambaril/ui/components/badge";
import {
  ExternalLink,
  Heart,
  MessageCircle,
  Share2,
  Star,
  Instagram,
  Play,
} from "lucide-react";

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

interface ContentCardProps {
  detection: ContentDetection;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLATFORM_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  tiktok: Play,
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  twitter: "Twitter",
  other: "Outro",
};

const POST_TYPE_LABELS: Record<string, string> = {
  image: "Imagem",
  video: "Video",
  carousel: "Carrossel",
  story: "Story",
  reel: "Reel",
  short: "Short",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(num: number | null): string {
  if (num === null || num === undefined) return "0";
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContentCard({ detection }: ContentCardProps) {
  const PlatformIcon = PLATFORM_ICONS[detection.platform] ?? ExternalLink;
  const platformLabel = PLATFORM_LABELS[detection.platform] ?? detection.platform;
  const postTypeLabel = POST_TYPE_LABELS[detection.postType] ?? detection.postType;

  const captionPreview = detection.caption
    ? detection.caption.length > 120
      ? `${detection.caption.slice(0, 120)}...`
      : detection.caption
    : null;

  return (
    <Card className="flex flex-col gap-2">
      <CardContent className="space-y-3">
        {/* Header: Platform + type + date */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PlatformIcon className="h-4 w-4 text-text-secondary" />
            <span className="text-sm font-medium text-text-bright">
              {platformLabel}
            </span>
            <Badge variant="secondary">{postTypeLabel}</Badge>
          </div>
          <span className="text-xs text-text-muted">
            {formatDate(detection.detectedAt)}
          </span>
        </div>

        {/* Caption preview */}
        {captionPreview && (
          <p className="text-sm text-text-secondary leading-relaxed">
            {captionPreview}
          </p>
        )}

        {/* Engagement metrics */}
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            <span>{formatNumber(detection.likes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{formatNumber(detection.comments)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" />
            <span>{formatNumber(detection.shares)}</span>
          </div>
        </div>

        {/* Hashtag + points + link */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {detection.hashtagMatched && (
              <Badge variant="secondary">#{detection.hashtagMatched}</Badge>
            )}
            {detection.pointsAwarded ? (
              <div className="flex items-center gap-1 text-xs text-success">
                <Star className="h-3 w-3" />
                <span>Pontos creditados</span>
              </div>
            ) : (
              <span className="text-xs text-text-muted">Aguardando pontos</span>
            )}
          </div>

          <a
            href={detection.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Ver publicacao"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
