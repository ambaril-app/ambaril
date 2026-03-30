import { requireCreatorSession } from "@/lib/creator-auth";
import { PortalNavbar } from "./components/portal-navbar";
import { PortalBottomTabs } from "./components/portal-bottom-tabs";
import { PortalSidebar } from "./components/portal-sidebar";
import { PreviewBanner } from "./components/preview-banner";
import { db } from "@ambaril/db";
import { eq, and, count } from "drizzle-orm";
import {
  creators,
  coupons,
  salesAttributions,
  challenges,
  contentDetections,
  campaignBriefs,
  pointsLedger,
  socialAccounts,
} from "@ambaril/db/schema";

export default async function CreatorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authenticated creator session — redirects to /creators/login if not found
  const session = await requireCreatorSession();
  const creatorId = session.creatorId;

  // Query visibility flags in parallel
  const [
    couponCount,
    salesCount,
    challengeCount,
    briefingCount,
    contentCount,
    pointsCount,
    creatorsInRanking,
    creatorRecord,
    socialCount,
  ] = await Promise.all([
    db.select({ c: count() }).from(coupons).where(eq(coupons.creatorId, creatorId)),
    db.select({ c: count() }).from(salesAttributions).where(eq(salesAttributions.creatorId, creatorId)),
    db.select({ c: count() }).from(challenges).where(and(eq(challenges.tenantId, session.tenantId), eq(challenges.status, "active"))),
    db.select({ c: count() }).from(campaignBriefs).where(eq(campaignBriefs.tenantId, session.tenantId)),
    db.select({ c: count() }).from(contentDetections).where(eq(contentDetections.creatorId, creatorId)),
    db.select({ c: count() }).from(pointsLedger).where(eq(pointsLedger.creatorId, creatorId)),
    db.select({ c: count() }).from(creators).where(and(eq(creators.tenantId, session.tenantId), eq(creators.status, "active"))),
    db.select({ managedByStaff: creators.managedByStaff }).from(creators).where(eq(creators.id, creatorId)).limit(1),
    db.select({ c: count() }).from(socialAccounts).where(eq(socialAccounts.creatorId, creatorId)),
  ]);

  const visibility = {
    hasCoupon: (couponCount[0]?.c ?? 0) > 0,
    hasSales: (salesCount[0]?.c ?? 0) > 0,
    hasActiveChallenges: (challengeCount[0]?.c ?? 0) > 0,
    hasActiveBriefings: (briefingCount[0]?.c ?? 0) > 0,
    hasContent: (contentCount[0]?.c ?? 0) > 0,
    hasPoints: (pointsCount[0]?.c ?? 0) > 0,
    hasRanking: (creatorsInRanking[0]?.c ?? 0) >= 5,
  };

  // Check if creator needs to complete profile (imported by staff, no social accounts)
  const needsProfileCompletion =
    creatorRecord[0]?.managedByStaff === true &&
    (socialCount[0]?.c ?? 0) === 0;

  // Determine if ambassador (tier name check — ambassadors don't have commissions)
  const isAmbassador =
    session.tierName?.toLowerCase() === "ambassador" ||
    session.tierName?.toLowerCase() === "embaixador";

  return (
    <div className="flex h-dvh overflow-hidden bg-bg-void">
      {/* Desktop sidebar */}
      <PortalSidebar isAmbassador={isAmbassador} visibility={visibility} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Preview banner (visible only in admin preview mode) */}
        {session.preview && <PreviewBanner creatorName={session.name} />}

        {/* Profile completion banner */}
        {needsProfileCompletion && (
          <div className="flex items-center justify-between bg-yellow-500/10 px-4 py-2">
            <p className="text-xs text-text-secondary">
              Complete seu perfil para ativar todas as funcoes.
            </p>
            <a
              href="/creators/complete-profile"
              className="text-xs font-medium text-text-bright underline"
            >
              Completar perfil
            </a>
          </div>
        )}

        {/* Top navbar (visible on all screens) */}
        <PortalNavbar
          creatorName={session.name}
          creatorImageUrl={session.profileImageUrl}
        />

        {/* Page content — pb-16 on mobile for bottom tabs clearance */}
        <main className="flex-1 overflow-y-auto px-4 pb-20 pt-6 lg:px-8 lg:pb-8">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <PortalBottomTabs
          isAmbassador={isAmbassador}
          hasSales={visibility.hasSales}
          hasActiveChallenges={visibility.hasActiveChallenges}
        />
      </div>
    </div>
  );
}
