import { requireCreatorSession } from "@/lib/creator-auth";
import { db } from "@ambaril/db";
import { eq, and } from "drizzle-orm";
import { creators, coupons } from "@ambaril/db/schema";
import { CouponDisplay } from "./components/coupon-display";
import { ShareTemplates } from "./components/share-templates";
import { UtmLinks } from "./components/utm-links";

// Fetch creator with coupon data
async function getCreatorCoupon(creatorId: string) {
  const [creator] = await db
    .select({
      id: creators.id,
      name: creators.name,
      tenantId: creators.tenantId,
      couponId: creators.couponId,
    })
    .from(creators)
    .where(eq(creators.id, creatorId))
    .limit(1);

  if (!creator || !creator.couponId) return null;

  const [coupon] = await db
    .select({
      id: coupons.id,
      code: coupons.code,
      discountType: coupons.discountType,
      discountPercent: coupons.discountPercent,
      discountAmount: coupons.discountAmount,
      usageCount: coupons.usageCount,
      totalRevenueGenerated: coupons.totalRevenueGenerated,
      isActive: coupons.isActive,
    })
    .from(coupons)
    .where(
      and(
        eq(coupons.id, creator.couponId),
        eq(coupons.tenantId, creator.tenantId),
      ),
    )
    .limit(1);

  if (!coupon) return null;

  return {
    creator,
    coupon,
  };
}

export default async function CreatorCouponsPage() {
  const session = await requireCreatorSession();
  const creatorId = session.creatorId;

  const result = await getCreatorCoupon(creatorId);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-text-secondary">
          Nenhum cupom vinculado a este creator.
        </p>
      </div>
    );
  }

  const { creator, coupon } = result;

  // Base URL for UTM links — in production this comes from tenant settings
  const baseUrl = "https://ciena.com.br";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page title */}
      <h1 className="text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
        Meu Cupom
      </h1>

      {/* Coupon display with metrics */}
      <CouponDisplay
        code={coupon.code}
        discountPercent={coupon.discountPercent}
        totalUses={coupon.usageCount}
        totalRevenue={coupon.totalRevenueGenerated}
      />

      {/* Share templates */}
      <ShareTemplates
        couponCode={coupon.code}
        discountPercent={coupon.discountPercent}
        creatorName={creator.name}
      />

      {/* UTM Links + QR Code */}
      <UtmLinks
        couponCode={coupon.code}
        baseUrl={baseUrl}
      />
    </div>
  );
}
