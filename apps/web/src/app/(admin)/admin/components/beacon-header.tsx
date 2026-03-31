import type { TenantSessionData } from "@ambaril/shared/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BeaconHeaderProps {
  session: TenantSessionData;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFormattedDate(): string {
  return new Date().toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BeaconHeader({ session }: BeaconHeaderProps) {
  const firstName = session.name.split(" ")[0];
  const date = getFormattedDate();
  // Capitalize first letter of the date string (weekday)
  const formattedDate = date.charAt(0).toUpperCase() + date.slice(1);

  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] font-medium leading-none tracking-[-0.02em] text-text-bright">
          {firstName}
        </h1>
        <p className="mt-2 text-xs tracking-[0.03em] text-text-ghost">{formattedDate}</p>
      </div>

      {/* Role badge */}
      <span className="mt-1 shrink-0 rounded-full border border-border-default bg-bg-surface px-2.5 py-1 font-mono text-[10px] text-text-ghost">
        {session.roleDisplayName}
        {session.isImpersonating && (
          <span className="ml-1.5 text-warning">· impersonando</span>
        )}
      </span>
    </div>
  );
}
