import { requireCreatorSession } from "@/lib/creator-auth";
import { listChallenges } from "@/app/actions/creators/challenges";
import { Trophy } from "lucide-react";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { ChallengesPageClient } from "./challenges-page-client";

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function ChallengesPage() {
  const session = await requireCreatorSession();
  const creatorId = session.creatorId;

  // Fetch active, completed, and cancelled challenges
  const [activeResult, completedResult, cancelledResult] = await Promise.all([
    listChallenges({ status: "active", page: 1, per_page: 50, sort_order: "desc" }),
    listChallenges({ status: "completed", page: 1, per_page: 25, sort_order: "desc" }),
    listChallenges({ status: "cancelled", page: 1, per_page: 25, sort_order: "desc" }),
  ]);

  const activeChallenges = activeResult.data?.items ?? [];
  const pastChallenges = [
    ...(completedResult.data?.items ?? []),
    ...(cancelledResult.data?.items ?? []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-text-bright">Desafios</h1>
        <p className="text-sm text-text-secondary">
          Participe de desafios e ganhe pontos extras.
        </p>
      </div>

      {activeChallenges.length === 0 && pastChallenges.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Nenhum desafio ativo"
          description="Nenhum desafio ativo no momento. Fique de olho!"
        />
      ) : (
        <ChallengesPageClient
          activeChallenges={activeChallenges}
          pastChallenges={pastChallenges}
          creatorId={creatorId}
        />
      )}
    </div>
  );
}
