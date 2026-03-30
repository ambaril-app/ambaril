import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTenantSession } from "@/lib/tenant";
import { getCampaignWithROI } from "@/app/actions/creators/campaigns";
import { listBriefs } from "@/app/actions/creators/briefs";
import { BriefForm } from "./components/brief-form";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BriefPageProps {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function BriefPage({ params }: BriefPageProps) {
  await getTenantSession();
  const { id: campaignId } = await params;

  // Verify campaign exists
  const campaignResult = await getCampaignWithROI(campaignId);
  if (campaignResult.error || !campaignResult.data) {
    notFound();
  }

  // Get existing brief for this campaign (take the first one)
  const briefsResult = await listBriefs({ campaignId, page: 1, per_page: 1, sort_order: "desc" });
  const existingBrief = briefsResult.data?.items[0] ?? null;

  // Transform the brief data for the client component
  const briefData = existingBrief
    ? {
        id: existingBrief.id,
        campaignId: existingBrief.campaignId,
        title: existingBrief.title,
        contentMd: existingBrief.contentMd,
        hashtags: existingBrief.hashtags,
        deadline: existingBrief.deadline,
        targetTiers: existingBrief.targetTiers,
        examplesJson: existingBrief.examplesJson,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/admin/creators/campaigns/${campaignId}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para campanha
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-lg font-medium text-text-bright">
          Briefing da Campanha
        </h1>
        <p className="text-sm text-text-secondary">
          {campaignResult.data.campaign.name}
        </p>
      </div>

      {/* Brief form */}
      <BriefForm campaignId={campaignId} existingBrief={briefData} />
    </div>
  );
}
