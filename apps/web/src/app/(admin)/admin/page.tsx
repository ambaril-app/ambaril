import { getTenantSession } from "@/lib/tenant";
import { hasRole } from "@ambaril/shared/utils";
import { MODULES } from "@ambaril/shared/constants";
import { BeaconHeader } from "./components/beacon-header";
import { ModulePreviewGrid } from "./components/module-preview-grid";
import { QuickActionsBar } from "./components/quick-actions-bar";

export default async function AdminHomePage() {
  const session = await getTenantSession();

  // ---- Module preview grid -------------------------------------------------
  // Filter coming_soon modules visible to this role
  const comingSoonModules = MODULES.filter(
    (mod) =>
      mod.status === "coming_soon" &&
      hasRole(session.effectiveRole, mod.requiredRoles),
  );

  // ---- Render --------------------------------------------------------------
  return (
    <div>
      {/* Greeting + date */}
      <BeaconHeader session={session} />

      {/* Quick actions for this role */}
      <div className="animate-fade-in mt-6">
        <QuickActionsBar role={session.effectiveRole} pendingCount={0} />
      </div>

      {/* Coming soon modules — generous separation (different context) */}
      <div className="animate-fade-in-delayed-3 mt-12">
        <ModulePreviewGrid modules={comingSoonModules} />
      </div>
    </div>
  );
}
