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
  });
}

/** Returns a greeting based on the current hour in São Paulo timezone. */
function getGreeting(): string {
  const hour = new Date().toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    hour12: false,
  });
  const h = parseInt(hour, 10);
  if (h >= 5 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
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
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-sm text-text-muted">{greeting},</p>
        <h1 className="mt-1 font-display text-[28px] font-medium leading-none tracking-[-0.02em] text-text-bright">
          {firstName}
        </h1>
        <p className="mt-2.5 text-[11px] tracking-[0.04em] text-text-ghost">
          {formattedDate}
        </p>
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
