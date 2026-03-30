"use client";

import * as React from "react";
import { Avatar } from "@ambaril/ui/components/avatar";
import { Badge } from "@ambaril/ui/components/badge";
import { Card, CardContent } from "@ambaril/ui/components/card";
import { Crown, Trophy } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RankedCreator {
  id: string;
  name: string;
  totalSalesAmount: string;
  tierName: string | null;
}

interface CreatorOfMonthData {
  id: string;
  name: string;
  currentMonthSalesAmount: string;
  tierName: string | null;
}

interface RankingListProps {
  creators: RankedCreator[];
  currentCreatorId: string;
  creatorOfMonth: CreatorOfMonthData | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: string | number): string {
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function RankingList({ creators, currentCreatorId, creatorOfMonth }: RankingListProps) {
  return (
    <div className="space-y-6">
      {/* Creator of the Month spotlight */}
      {creatorOfMonth && (
        <Card className="border-warning/30 bg-gradient-to-r from-bg-base to-bg-raised">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="relative">
              <Avatar name={creatorOfMonth.name} size="lg" />
              <Crown className="absolute -top-2 -right-2 h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-text-bright">
                  {creatorOfMonth.name}
                </span>
                <Badge variant="warning">Creator do Mes</Badge>
                {creatorOfMonth.tierName && (
                  <Badge variant="secondary">{creatorOfMonth.tierName}</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                Vendas do mes:{" "}
                <span className="font-['DM_Mono',monospace] font-medium text-text-bright">
                  R$ {formatCurrency(creatorOfMonth.currentMonthSalesAmount)}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 20 list */}
      <div className="space-y-2">
        {creators.map((creator, index) => {
          const position = index + 1;
          const isCurrent = creator.id === currentCreatorId;
          const isTopThree = position <= 3;

          return (
            <div
              key={creator.id}
              className={`flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors ${
                isCurrent
                  ? "border-border-strong bg-bg-raised"
                  : "border-border-default bg-bg-base hover:bg-bg-raised/50"
              }`}
            >
              {/* Position */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
                {isTopThree ? (
                  <Trophy
                    className={`h-5 w-5 ${
                      position === 1
                        ? "text-warning"
                        : position === 2
                          ? "text-text-secondary"
                          : "text-[#cd7f32]"
                    }`}
                  />
                ) : (
                  <span className="font-['DM_Mono',monospace] text-sm font-medium text-text-muted">
                    #{position}
                  </span>
                )}
              </div>

              {/* Avatar + Name */}
              <Avatar name={creator.name} size="sm" />
              <div className="flex flex-1 items-center gap-2 min-w-0">
                <span
                  className={`truncate text-sm font-medium ${
                    isCurrent ? "text-text-bright" : "text-text-primary"
                  }`}
                >
                  {creator.name}
                  {isCurrent && (
                    <span className="ml-1.5 text-xs text-text-muted">(voce)</span>
                  )}
                </span>
                {creator.tierName && (
                  <Badge variant="secondary">{creator.tierName}</Badge>
                )}
              </div>

              {/* Sales amount */}
              <span className="font-['DM_Mono',monospace] text-sm font-medium text-text-bright">
                R$ {formatCurrency(creator.totalSalesAmount)}
              </span>
            </div>
          );
        })}

        {creators.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="mb-3 h-10 w-10 text-text-muted" strokeWidth={1.5} />
            <p className="text-base font-medium text-text-bright">
              Ranking ainda vazio
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              O ranking sera preenchido conforme as vendas forem registradas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export { RankingList };
