import { requireCreatorSession } from "@/lib/creator-auth";
import { listBriefs } from "@/app/actions/creators/briefs";
import { FileText } from "lucide-react";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { BriefingsPageClient } from "./briefings-page-client";

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function BriefingsPage() {
  await requireCreatorSession();

  const result = await listBriefs({ page: 1, per_page: 50, sort_order: "desc" });
  const briefs = result.data?.items ?? [];

  if (briefs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-medium text-text-bright">Briefings</h1>
          <p className="text-sm text-text-secondary">
            Diretrizes e instrucoes para suas publicacoes.
          </p>
        </div>

        <EmptyState
          icon={FileText}
          title="Nenhum briefing disponivel"
          description="Quando a equipe criar briefings, eles aparecerao aqui."
        />
      </div>
    );
  }

  // Separate active (deadline in the future or no deadline) from past
  const now = new Date();
  const activeBriefs = briefs.filter((b) => {
    if (!b.deadline) return true;
    return new Date(b.deadline) >= now;
  });
  const pastBriefs = briefs.filter((b) => {
    if (!b.deadline) return false;
    return new Date(b.deadline) < now;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-text-bright">Briefings</h1>
        <p className="text-sm text-text-secondary">
          Diretrizes e instrucoes para suas publicacoes.
        </p>
      </div>

      <BriefingsPageClient
        activeBriefs={activeBriefs}
        pastBriefs={pastBriefs}
      />
    </div>
  );
}
