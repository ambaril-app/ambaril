import { Trophy, Calendar } from "lucide-react";

interface ChallengeCard {
  id: string;
  name: string;
  description: string;
  pointsReward: number;
  endsAt: Date;
  category: string;
}

interface ActiveChallengesProps {
  challenges: ChallengeCard[];
}

function formatDeadline(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return "Encerrado";
  if (days === 0) return "Ultimo dia";
  if (days === 1) return "1 dia restante";
  return `${days} dias restantes`;
}

const CATEGORY_LABELS: Record<string, string> = {
  drop: "Drop",
  style: "Style",
  community: "Comunidade",
  viral: "Viral",
  surprise: "Surpresa",
};

export function ActiveChallenges({ challenges }: ActiveChallengesProps) {
  if (challenges.length === 0) {
    return (
      <div className="rounded-xl border border-border-default bg-bg-base p-6">
        <h3 className="text-sm font-medium uppercase tracking-[0.04em] text-text-muted">
          Desafios Ativos
        </h3>
        <p className="mt-4 text-center text-sm text-text-secondary">
          Nenhum desafio ativo no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-default bg-bg-base p-4">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.04em] text-text-muted">
        Desafios Ativos
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="rounded-lg border border-border-subtle bg-bg-raised p-4 transition-shadow hover:shadow-[var(--shadow-md)]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-warning" />
                <span className="text-xs text-text-muted">
                  {CATEGORY_LABELS[challenge.category] ?? challenge.category}
                </span>
              </div>
              <span className="font-mono text-xs tabular-nums font-medium text-text-white">
                +{challenge.pointsReward} pts
              </span>
            </div>

            <h4 className="mt-2 text-sm font-medium text-text-bright">
              {challenge.name}
            </h4>
            <p className="mt-1 line-clamp-2 text-xs text-text-secondary" title={challenge.description}>
              {challenge.description}
            </p>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
              <Calendar size={12} />
              <span>{formatDeadline(challenge.endsAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
