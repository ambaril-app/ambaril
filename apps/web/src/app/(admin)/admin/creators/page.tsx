import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CreatorsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-text-bright">Creators</h1>
          <p className="text-sm text-text-secondary">
            Gerencie os creators
          </p>
        </div>
      </div>

      {/* Placeholder — Phase 1 will add DataTable, filters, and CRUD */}
      <div className="flex h-64 items-center justify-center rounded-lg border border-border-default bg-bg-base">
        <p className="text-sm text-text-tertiary">
          Lista de creators sera implementada na Phase 1
        </p>
      </div>
    </div>
  );
}
