import { requireCreatorSession } from "@/lib/creator-auth";
import { listContentDetections } from "@/app/actions/creators/content";
import { Camera } from "lucide-react";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { ContentPageClient } from "./content-page-client";

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function ContentPage() {
  const session = await requireCreatorSession();
  const creatorId = session.creatorId;

  const result = await listContentDetections(creatorId);
  const detections = result.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-text-bright">Meu Conteudo</h1>
        <p className="text-sm text-text-secondary">
          Publicacoes detectadas automaticamente nas suas redes sociais.
        </p>
      </div>

      {detections.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="Nenhum conteudo detectado"
          description="Seus posts detectados aparecerao aqui automaticamente."
        />
      ) : (
        <ContentPageClient detections={detections} />
      )}
    </div>
  );
}
