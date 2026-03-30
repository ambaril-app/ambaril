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

function getGreeting(): string {
  const brtHour = new Date().toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(brtHour, 10);
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

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
  const greeting = getGreeting();
  const date = getFormattedDate();
  // Capitalize first letter of the date string (weekday)
  const formattedDate = date.charAt(0).toUpperCase() + date.slice(1);

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-medium text-text-bright">
          {greeting}, {firstName}
        </h1>
        <p className="mt-0.5 text-sm text-text-secondary">{formattedDate}</p>
      </div>

      {/* Role badge */}
      <span className="mt-1 shrink-0 rounded-full border border-border-default bg-bg-surface px-2.5 py-1 text-xs text-text-secondary">
        {session.roleDisplayName}
        {session.isImpersonating && (
          <span className="ml-1.5 text-warning">· impersonando</span>
        )}
      </span>
    </div>
  );
}
