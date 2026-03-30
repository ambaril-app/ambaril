import { getTenantSession } from "@/lib/tenant";
import { listCampaigns } from "@/app/actions/creators/campaigns";
import { CampaignListClient } from "./campaign-list-client";

export default async function CampaignsPage() {
  const session = await getTenantSession();

  const result = await listCampaigns({ page: 1, per_page: 25, sort_order: "desc" });

  const campaigns = result.data?.items ?? [];
  const total = result.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <CampaignListClient
        initialCampaigns={campaigns}
        initialTotal={total}
        tenantId={session.tenantId}
      />
    </div>
  );
}
