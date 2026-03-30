"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@ambaril/ui/components/card";
import { Users, UserCheck, Clock, UserX } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatorStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
}

interface CreatorSummaryCardsProps {
  stats: CreatorStats;
}

// ---------------------------------------------------------------------------
// Card config
// ---------------------------------------------------------------------------

interface SummaryCard {
  key: keyof CreatorStats;
  label: string;
  icon: typeof Users;
  color: string;
}

const CARDS: SummaryCard[] = [
  { key: "total", label: "Total Creators", icon: Users, color: "text-text-primary" },
  { key: "active", label: "Ativos", icon: UserCheck, color: "text-success" },
  { key: "pending", label: "Pendentes", icon: Clock, color: "text-warning" },
  { key: "suspended", label: "Suspensos", icon: UserX, color: "text-danger" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CreatorSummaryCards({ stats }: CreatorSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {card.label}
                </span>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <span className="font-mono text-2xl font-semibold text-text-bright">
                {stats[card.key]}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export { CreatorSummaryCards };
export type { CreatorStats };
