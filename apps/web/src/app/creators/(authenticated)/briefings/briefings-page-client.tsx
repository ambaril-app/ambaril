"use client";

import { useState } from "react";
import { BriefCard } from "./components/brief-card";
import { ChevronDown, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BriefItem {
  id: string;
  title: string;
  contentMd: string;
  hashtags: string[] | null;
  deadline: Date | null;
  examplesJson: unknown;
  targetTiers: string[] | null;
  createdAt: Date;
}

interface BriefingsPageClientProps {
  activeBriefs: BriefItem[];
  pastBriefs: BriefItem[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BriefingsPageClient({
  activeBriefs,
  pastBriefs,
}: BriefingsPageClientProps) {
  const [isPastOpen, setIsPastOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Active briefs */}
      {activeBriefs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-medium text-text-bright">
            Briefings Ativos
          </h2>
          <div className="grid gap-4">
            {activeBriefs.map((brief) => (
              <BriefCard key={brief.id} brief={brief} />
            ))}
          </div>
        </section>
      )}

      {activeBriefs.length === 0 && (
        <p className="text-sm text-text-muted">
          Nenhum briefing ativo no momento.
        </p>
      )}

      {/* Past briefs (collapsed) */}
      {pastBriefs.length > 0 && (
        <section className="space-y-4">
          <button
            type="button"
            onClick={() => setIsPastOpen(!isPastOpen)}
            className="flex min-h-[44px] items-center gap-2 text-base font-medium text-text-bright hover:text-text-primary transition-colors"
          >
            {isPastOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Briefings Anteriores ({pastBriefs.length})
          </button>

          {isPastOpen && (
            <div className="grid gap-4">
              {pastBriefs.map((brief) => (
                <BriefCard key={brief.id} brief={brief} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
