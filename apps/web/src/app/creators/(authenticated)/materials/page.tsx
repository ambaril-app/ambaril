import { requireCreatorSession } from "@/lib/creator-auth";
import { getCreatorKitAssets } from "@/lib/stubs/dam";
import { FolderOpen, Download, Image } from "lucide-react";
import { EmptyState } from "@ambaril/ui/components/empty-state";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ASSET_TYPE_LABELS: Record<string, string> = {
  logo: "Logo",
  photo: "Foto",
  guideline: "Guideline",
  template: "Template",
};

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function MaterialsPage() {
  await requireCreatorSession();

  const assets = await getCreatorKitAssets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-display font-medium leading-tight tracking-tight text-text-bright">Materiais</h1>
        <p className="text-sm text-text-secondary">
          Kit de materiais e assets para suas publicações.
        </p>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Kit de materiais indisponível"
          description="O kit de materiais ainda não foi configurado pela equipe."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-lg border border-border-default bg-bg-base p-4"
            >
              {/* Thumbnail */}
              <div className="mb-3 flex h-32 items-center justify-center rounded-md bg-bg-surface">
                {asset.thumbnailUrl ? (
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.name}
                    className="h-full w-full rounded-md object-cover"
                  />
                ) : (
                  <Image className="h-8 w-8 text-text-muted" />
                )}
              </div>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium text-text-bright">
                    {asset.name}
                  </h3>
                  <span className="mt-1 inline-flex items-center rounded-md bg-bg-surface px-2 py-0.5 text-xs font-medium text-text-secondary">
                    {ASSET_TYPE_LABELS[asset.type] ?? asset.type}
                  </span>
                </div>

                {asset.downloadUrl && (
                  <a
                    href={asset.downloadUrl}
                    download
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
                    aria-label="Baixar"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
