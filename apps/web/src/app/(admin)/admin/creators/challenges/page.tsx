import { getTenantSession } from "@/lib/tenant";
import { listChallenges } from "@/app/actions/creators/challenges";
import { ChallengesClient } from "./challenges-client";

export default async function ChallengesPage() {
  await getTenantSession();

  const now = new Date();
  const result = await listChallenges({
    page: 1,
    per_page: 25,
    sort_order: "desc",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-text-bright">Desafios</h1>
        <p className="text-sm text-text-secondary">
          Crie e gerencie desafios mensais para os creators
        </p>
      </div>

      <ChallengesClient
        initialChallenges={result.data?.items ?? []}
        initialTotal={result.data?.total ?? 0}
        initialMonth={now.getMonth() + 1}
        initialYear={now.getFullYear()}
        initialError={result.error}
      />
    </div>
  );
}
