"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@ambaril/ui/components/card";
import { Badge } from "@ambaril/ui/components/badge";
import { Button } from "@ambaril/ui/components/button";
import { Trophy, Calendar, Users, Star } from "lucide-react";
import { SubmitProofModal } from "./submit-proof-modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChallengeData {
  id: string;
  name: string;
  description: string;
  category: string;
  pointsReward: number;
  requirements: unknown;
  maxParticipants: number | null;
  startsAt: Date;
  endsAt: Date;
  status: string;
}

interface ChallengeCardProps {
  challenge: ChallengeData;
  /** Whether the creator can participate (only for active challenges) */
  canParticipate?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  drop: "Drop",
  style: "Estilo",
  community: "Comunidade",
  viral: "Viral",
  surprise: "Surpresa",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRequirements(requirements: unknown): string[] {
  if (!requirements) return [];
  if (Array.isArray(requirements)) {
    return requirements.map((r) => {
      if (typeof r === "string") return r;
      if (typeof r === "object" && r !== null && "description" in r) {
        return String((r as { description: string }).description);
      }
      return String(r);
    });
  }
  if (typeof requirements === "object" && requirements !== null) {
    return Object.values(requirements).map(String);
  }
  return [String(requirements)];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChallengeCard({ challenge, canParticipate = true }: ChallengeCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const requirementsList = formatRequirements(challenge.requirements);
  const categoryLabel = CATEGORY_LABELS[challenge.category] ?? challenge.category;
  const isActive = challenge.status === "active";

  return (
    <>
      <Card className="flex flex-col gap-3">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 shrink-0 text-warning" />
              <CardTitle>{challenge.name}</CardTitle>
            </div>
            <Badge variant="secondary">{categoryLabel}</Badge>
          </div>
          <CardDescription>{challenge.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Points reward */}
          <div className="flex items-center gap-2 text-sm text-text-primary">
            <Star className="h-4 w-4 text-warning" />
            <span className="font-medium">{challenge.pointsReward} pontos</span>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(challenge.startsAt)} — {formatDate(challenge.endsAt)}
            </span>
          </div>

          {/* Max participants */}
          {challenge.maxParticipants && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Users className="h-4 w-4" />
              <span>Max. {challenge.maxParticipants} participantes</span>
            </div>
          )}

          {/* Requirements */}
          {requirementsList.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Requisitos
              </p>
              <ul className="list-inside list-disc space-y-0.5 text-sm text-text-secondary">
                {requirementsList.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          {isActive && canParticipate && (
            <div className="pt-1">
              <Button
                onPress={() => setIsModalOpen(true)}
                className="w-full min-h-[44px]"
              >
                Participar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SubmitProofModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        challengeId={challenge.id}
        challengeName={challenge.name}
      />
    </>
  );
}
