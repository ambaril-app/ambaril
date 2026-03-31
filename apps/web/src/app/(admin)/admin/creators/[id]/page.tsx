import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantSession } from "@/lib/tenant";
import { getCreator } from "@/app/actions/creators/crud";
import { ArrowLeft } from "lucide-react";
import { CreatorHeader } from "./components/creator-header";
import { CreatorTabs } from "./components/creator-tabs";

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

interface CreatorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CreatorDetailPage({ params }: CreatorDetailPageProps) {
  await getTenantSession();

  const { id } = await params;

  const result = await getCreator(id);

  if (result.error || !result.data) {
    notFound();
  }

  const creator = result.data;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/creators"
        className="inline-flex items-center gap-1.5 text-sm text-text-ghost hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para lista de creators
      </Link>

      {/* Header with actions */}
      <CreatorHeader
        creator={{
          id: creator.id,
          name: creator.name,
          status: creator.status,
          tierName: creator.tierName,
          tierSlug: creator.tierSlug,
          profileImageUrl: creator.profileImageUrl,
          totalSalesAmount: creator.totalSalesAmount,
          totalPoints: creator.totalPoints,
          commissionRate: creator.commissionRate,
          couponCode: creator.couponCode,
        }}
      />

      {/* Tabbed content */}
      <CreatorTabs
        creator={{
          id: creator.id,
          name: creator.name,
          email: creator.email,
          phone: creator.phone,
          cpf: creator.cpf,
          bio: creator.bio,
          motivation: creator.motivation,
          contentNiches: creator.contentNiches,
          contentTypes: creator.contentTypes,
          clothingSize: creator.clothingSize,
          birthDate: creator.birthDate,
          discoverySource: creator.discoverySource,
          address: creator.address,
          paymentPreference: creator.paymentPreference,
          pixKey: creator.pixKey,
          pixKeyType: creator.pixKeyType,
          managedByStaff: creator.managedByStaff,
          contentRightsAccepted: creator.contentRightsAccepted,
          suspensionReason: creator.suspensionReason,
          socialAccounts: creator.socialAccounts,
        }}
      />
    </div>
  );
}
