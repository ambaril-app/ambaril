import { getTenantSession } from "@/lib/tenant";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { db } from "@ambaril/db";
import { eq } from "drizzle-orm";
import { moduleSetupState } from "@ambaril/db/schema";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getTenantSession();

  // Query setup state for all modules
  const setupRows = await db
    .select({
      moduleId: moduleSetupState.moduleId,
      isSetupComplete: moduleSetupState.isSetupComplete,
    })
    .from(moduleSetupState)
    .where(eq(moduleSetupState.tenantId, session.tenantId));

  const setupState: Record<string, boolean> = {};
  for (const row of setupRows) {
    setupState[row.moduleId] = row.isSetupComplete;
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-bg-void">
      <Sidebar session={session} setupState={setupState} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar session={session} />
        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
