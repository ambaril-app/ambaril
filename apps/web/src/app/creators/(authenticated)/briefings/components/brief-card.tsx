"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@ambaril/ui/components/card";
import { Badge } from "@ambaril/ui/components/badge";
import { Calendar, ChevronDown, ChevronRight, ExternalLink, Hash } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExampleLink {
  type: string;
  url: string;
  caption?: string;
}

interface BriefData {
  id: string;
  title: string;
  contentMd: string;
  hashtags: string[] | null;
  deadline: Date | null;
  examplesJson: unknown;
  targetTiers: string[] | null;
  createdAt: Date;
}

interface BriefCardProps {
  brief: BriefData;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseExamples(examplesJson: unknown): ExampleLink[] {
  if (!examplesJson) return [];
  if (Array.isArray(examplesJson)) {
    return examplesJson.filter(
      (item): item is ExampleLink =>
        typeof item === "object" &&
        item !== null &&
        "url" in item &&
        typeof (item as { url: unknown }).url === "string",
    );
  }
  return [];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BriefCard({ brief }: BriefCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const examples = parseExamples(brief.examplesJson);

  return (
    <Card className="flex flex-col gap-3">
      <CardHeader>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-start justify-between gap-2 text-left min-h-[44px]"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
              )}
              <CardTitle>{brief.title}</CardTitle>
            </div>
          </div>
        </button>

        {/* Meta info visible always */}
        <div className="flex flex-wrap items-center gap-3 pl-6">
          {brief.deadline && (
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <Calendar className="h-3.5 w-3.5" />
              <span>Ate {formatDate(brief.deadline)}</span>
            </div>
          )}

          {brief.targetTiers && brief.targetTiers.length > 0 && (
            <div className="text-xs text-text-muted">
              Tiers: {brief.targetTiers.join(", ")}
            </div>
          )}
        </div>

        {/* Hashtags */}
        {brief.hashtags && brief.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-6 pt-1">
            {brief.hashtags.map((tag, idx) => (
              <Badge key={idx} variant="secondary">
                <span className="flex items-center gap-0.5">
                  <Hash className="h-3 w-3" />
                  {tag}
                </span>
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      {/* Expanded content */}
      {isExpanded && (
        <CardContent className="space-y-4 border-t border-border-subtle pt-3">
          {/* Markdown content (rendered as pre-formatted text for now) */}
          <div className="prose prose-sm prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm text-text-primary leading-relaxed">
              {brief.contentMd}
            </div>
          </div>

          {/* Example links */}
          {examples.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Exemplos
              </p>
              <ul className="space-y-1.5">
                {examples.map((example, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <a
                      href={example.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {example.caption ?? example.type ?? `Exemplo ${idx + 1}`}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
