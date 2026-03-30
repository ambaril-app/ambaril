import { requireCreatorSession } from "@/lib/creator-auth";
import { listPayouts } from "@/app/actions/creators/payouts";
import { EarningsPageClient } from "./earnings-page-client";
import { db } from "@ambaril/db";
import { eq } from "drizzle-orm";
import { creators } from "@ambaril/db/schema";

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function EarningsPage() {
  const session = await requireCreatorSession();
  const creatorId = session.creatorId;

  // Ambassador creators should not see earnings
  const isAmbassador =
    session.tierName?.toLowerCase() === "ambassador" ||
    session.tierName?.toLowerCase() === "embaixador";

  if (isAmbassador) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-secondary">
          Embaixadores não possuem acesso a esta página.
        </p>
      </div>
    );
  }

  // Fetch creator for payment preferences (not on session)
  const [creator] = await db
    .select({
      paymentPreference: creators.paymentPreference,
      pixKey: creators.pixKey,
    })
    .from(creators)
    .where(eq(creators.id, creatorId))
    .limit(1);

  // Fetch payouts for summary
  const payoutsResult = await listPayouts({
    creatorId,
    page: 1,
    per_page: 50,
    sort_order: "desc",
  });

  const payoutItems = payoutsResult.data?.items ?? [];

  // Calculate balance from payouts
  const grossTotal = payoutItems.reduce(
    (sum, p) => sum + Number(p.grossAmount),
    0,
  );
  const irrfTotal = payoutItems.reduce(
    (sum, p) => sum + Number(p.irrfWithheld),
    0,
  );
  const issTotal = payoutItems.reduce(
    (sum, p) => sum + Number(p.issWithheld),
    0,
  );
  const netTotal = payoutItems.reduce(
    (sum, p) => sum + Number(p.netAmount),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-display font-medium leading-tight tracking-tight text-text-bright">Meus Ganhos</h1>
        <p className="text-sm text-text-secondary">
          Acompanhe seus ganhos, pagamentos e informações fiscais.
        </p>
      </div>

      <EarningsPageClient
        creatorId={creatorId}
        grossTotal={grossTotal.toFixed(2)}
        irrfTotal={irrfTotal.toFixed(2)}
        issTotal={issTotal.toFixed(2)}
        netTotal={netTotal.toFixed(2)}
        currentMethod={creator?.paymentPreference ?? null}
        currentPixKey={creator?.pixKey ?? null}
        initialPayouts={payoutItems.map((p) => ({
          id: p.id,
          periodStart: p.periodStart,
          periodEnd: p.periodEnd,
          grossAmount: p.grossAmount,
          irrfWithheld: p.irrfWithheld,
          issWithheld: p.issWithheld,
          netAmount: p.netAmount,
          paymentMethod: p.paymentMethod,
          status: p.status,
          paidAt: p.paidAt ? (p.paidAt instanceof Date ? p.paidAt.toISOString() : String(p.paidAt)) : null,
        }))}
        totalPayouts={payoutsResult.data?.total ?? 0}
      />
    </div>
  );
}
