import Link from "next/link";
import { LogOut } from "lucide-react";
import { destroyCreatorSession } from "@/lib/creator-auth";

interface PortalNavbarProps {
  creatorName: string;
  creatorImageUrl: string | null;
}

async function handleLogout() {
  "use server";
  await destroyCreatorSession();
  const { redirect } = await import("next/navigation");
  redirect("/creators/login");
}

export function PortalNavbar({ creatorName, creatorImageUrl }: PortalNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border-default bg-bg-base px-4 lg:px-6">
      {/* Wordmark — visible on mobile only (sidebar has it on desktop) */}
      <Link
        href="/creators/dashboard"
        className="text-lg font-normal tracking-wide text-text-white lg:hidden"
      >
        Ambaril
      </Link>
      {/* Spacer on desktop */}
      <div className="hidden lg:block" />

      {/* Right side: avatar + name + logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-bg-surface text-xs font-medium text-text-secondary">
            {creatorName.split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase()}
          </span>
          <span className="hidden text-sm text-text-bright sm:inline">
            {creatorName}
          </span>
        </div>
        <form action={handleLogout}>
          <button
            type="submit"
            className="flex h-11 w-11 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-surface hover:text-danger"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
