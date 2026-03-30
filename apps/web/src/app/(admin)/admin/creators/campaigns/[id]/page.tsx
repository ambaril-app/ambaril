import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { getTenantSession } from "@/lib/tenant";
import { getCampaignWithROI } from "@/app/actions/creators/campaigns";
import { CampaignHeader } from "./components/campaign-header";
import { CostBreakdown } from "./components/cost-breakdown";
import { CampaignCreatorsTable } from "./components/campaign-creators-table";
import { RoiChart } from "./components/roi-chart";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Campaign Creator Row type for client component
// ---------------------------------------------------------------------------

interface CampaignCreatorRow extends Record<string, unknown> {
  id: string;
  campaignId: string;
  creatorId: string;
  deliveryStatus: string | null;
  productCost: string | null;
  shippingCost: string | null;
  feeAmount: string | null;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  await getTenantSession();
  const { id } = await params;

  const result = await getCampaignWithROI(id);

  if (result.error || !result.data) {
    notFound();
  }

  const { campaign, creatorsInCampaign, totalCosts, totalRevenue, roi } = result.data;

  // Map campaign creators to the row type expected by the client component
  const creatorRows: CampaignCreatorRow[] = creatorsInCampaign.map((cc) => ({
    id: cc.id,
    campaignId: cc.campaignId,
    creatorId: cc.creatorId,
    deliveryStatus: cc.deliveryStatus,
    productCost: cc.productCost,
    shippingCost: cc.shippingCost,
    feeAmount: cc.feeAmount,
    notes: cc.notes,
  }));

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/admin/creators/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para campanhas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <CampaignHeader
          name={campaign.name}
          campaignType={campaign.campaignType}
          status={campaign.status}
          startDate={campaign.startDate}
          endDate={campaign.endDate}
        />
        <Link
          href={`/admin/creators/campaigns/${campaign.id}/brief`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-surface"
        >
          <FileText className="h-4 w-4" />
          Briefing
        </Link>
      </div>

      {/* Cost breakdown */}
      <CostBreakdown
        totalProductCost={campaign.totalProductCost}
        totalShippingCost={campaign.totalShippingCost}
        totalFeeCost={campaign.totalFeeCost}
        totalRewardCost={campaign.totalRewardCost}
      />

      {/* Creators in campaign */}
      <CampaignCreatorsTable
        campaignId={campaign.id}
        creatorsInCampaign={creatorRows}
      />

      {/* ROI Chart */}
      <RoiChart
        totalCosts={totalCosts}
        totalRevenue={totalRevenue}
        roi={roi}
      />
    </div>
  );
}
