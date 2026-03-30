import { NextResponse } from "next/server";
import { db, globalSchema } from "@ambaril/db";
import {
  creators,
  salesAttributions,
  payouts,
  taxProfiles,
} from "@ambaril/db/schema";
import { withTenantContext } from "@/lib/tenant";
import { eq, and, gte, lte, sum } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Monthly (5th): Calculate payouts for each creator with confirmed sales
// in the previous month. Includes IRRF and ISS tax calculations.
// ---------------------------------------------------------------------------

// IRRF progressive table (Brazilian income tax withholding - 2024/2025)
interface IrrfBracket {
  limit: number;
  rate: number;
  deduction: number;
}

const IRRF_TABLE: IrrfBracket[] = [
  { limit: 2259.20, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 169.44 },
  { limit: 3751.05, rate: 0.15, deduction: 381.44 },
  { limit: 4664.68, rate: 0.225, deduction: 662.77 },
  { limit: Infinity, rate: 0.275, deduction: 896.0 },
];

const MIN_PAYOUT_AMOUNT = 50; // R$ 50 minimum payout

function calculateIrrf(grossAmount: number): number {
  for (const bracket of IRRF_TABLE) {
    if (grossAmount <= bracket.limit) {
      const irrf = grossAmount * bracket.rate - bracket.deduction;
      return Math.max(irrf, 0);
    }
  }
  const last = IRRF_TABLE[IRRF_TABLE.length - 1]!;
  const irrf = grossAmount * last.rate - last.deduction;
  return Math.max(irrf, 0);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenants = await db
    .select({ id: globalSchema.tenants.id, name: globalSchema.tenants.name })
    .from(globalSchema.tenants)
    .where(eq(globalSchema.tenants.isActive, true));

  // Previous month period
  const now = new Date();
  const periodStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const periodEndDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
  const periodStart = periodStartDate.toISOString().split("T")[0]!;
  const periodEnd = periodEndDate.toISOString().split("T")[0]!;

  const results: Record<string, { created: number; skipped: number; totalGross: string }> = {};

  for (const tenant of tenants) {
    const result = await withTenantContext(tenant.id, async (tx) => {
      // Find all creators with confirmed commissions in the previous month
      const creatorsWithCommissions = await tx
        .select({
          creatorId: salesAttributions.creatorId,
          grossAmount: sum(salesAttributions.commissionAmount).as("gross_amount"),
        })
        .from(salesAttributions)
        .where(
          and(
            eq(salesAttributions.tenantId, tenant.id),
            eq(salesAttributions.status, "confirmed"),
            gte(salesAttributions.confirmedAt, periodStartDate),
            lte(salesAttributions.confirmedAt, periodEndDate),
          ),
        )
        .groupBy(salesAttributions.creatorId);

      let created = 0;
      let skipped = 0;
      let totalGross = 0;

      for (const row of creatorsWithCommissions) {
        const gross = parseFloat(row.grossAmount ?? "0");

        // Skip if total < R$ 50
        if (gross < MIN_PAYOUT_AMOUNT) {
          skipped++;
          continue;
        }

        // Look up tax profile
        const [taxProfile] = await tx
          .select()
          .from(taxProfiles)
          .where(
            and(
              eq(taxProfiles.tenantId, tenant.id),
              eq(taxProfiles.creatorId, row.creatorId),
            ),
          )
          .limit(1);

        // Calculate IRRF
        const irrfAmount = calculateIrrf(gross);

        // Calculate ISS
        let issAmount = 0;
        if (taxProfile?.hasNfCapability && taxProfile.issRate) {
          issAmount = gross * (parseFloat(taxProfile.issRate) / 100);
        }

        // Net = gross - IRRF - ISS
        const netAmount = gross - irrfAmount - issAmount;

        // Determine fiscal doc type
        let fiscalDocType: "rpa" | "nfse" | "none" = "none";
        if (taxProfile) {
          if (taxProfile.hasNfCapability) {
            fiscalDocType = "nfse";
          } else if (taxProfile.taxpayerType === "pf") {
            fiscalDocType = "rpa";
          }
        }

        // Create payout row
        await tx.insert(payouts).values({
          tenantId: tenant.id,
          creatorId: row.creatorId,
          periodStart,
          periodEnd,
          grossAmount: gross.toFixed(2),
          irrfWithheld: irrfAmount.toFixed(2),
          issWithheld: issAmount.toFixed(2),
          netAmount: netAmount.toFixed(2),
          fiscalDocType,
          status: "pending",
        });

        totalGross += gross;
        created++;
      }

      return {
        created,
        skipped,
        totalGross: totalGross.toFixed(2),
      };
    });

    results[tenant.name] = result;
  }

  return NextResponse.json({
    success: true,
    job: "payout-calculation",
    timestamp: new Date().toISOString(),
    period: { start: periodStart, end: periodEnd },
    results,
  });
}
