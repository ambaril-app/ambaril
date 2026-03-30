import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PendingCreatorSummary {
  id: string;
  name: string;
  createdAt: Date;
}

interface PendingApprovalsWidgetProps {
  creators: PendingCreatorSummary[];
  total: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysAgoLabel(createdAt: Date): string {
  const daysAgo = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysAgo === 0) return "hoje";
  if (daysAgo === 1) return "há 1 dia";
  return `há ${daysAgo} dias`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "--").toUpperCase();
  return `${parts[0]?.charAt(0) ?? ""}${parts[parts.length - 1]?.charAt(0) ?? ""}`.toUpperCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PendingApprovalsWidget({
  creators,
  total,
}: PendingApprovalsWidgetProps) {
  if (total === 0) return null;

  const displayed = creators.slice(0, 3);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-muted">
          Aprovações Pendentes
        </h2>
        <span className="rounded-full bg-warning-muted px-1.5 py-0.5 text-[10px] font-medium text-warning">
          {total}
        </span>
      </div>

      <div className="rounded-xl border border-border-default bg-bg-base shadow-[var(--shadow-sm)]">
        <ul className="divide-y divide-border-default/60">
          {displayed.map((creator) => (
            <li key={creator.id} className="flex items-center gap-3 px-4 py-3">
              {/* Avatar initials */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-surface text-[11px] font-medium text-text-secondary">
                {getInitials(creator.name)}
              </div>

              {/* Name + days ago */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-bright">
                  {creator.name}
                </p>
                <p className="text-[11px] text-text-muted">
                  Aplicou {getDaysAgoLabel(creator.createdAt)}
                </p>
              </div>

              {/* CTA */}
              <Link
                href={`/admin/creators/${creator.id}`}
                className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-info transition-colors hover:bg-info-muted"
              >
                Ver
              </Link>
            </li>
          ))}
        </ul>

        {total > 3 && (
          <div className="border-t border-border-default/60 px-4 py-2.5">
            <Link
              href="/admin/creators?status=pending"
              className="text-xs text-text-secondary transition-colors hover:text-text-bright"
            >
              Ver todos ({total}) →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
