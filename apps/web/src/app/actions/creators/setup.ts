"use server";

import { db } from "@ambaril/db";
import { eq, and, sql } from "drizzle-orm";
import {
  moduleSetupState,
  tenantIntegrations,
  integrationProviders,
} from "@ambaril/db/schema";
import { creators, creatorTiers, coupons } from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import { getProvider } from "@ambaril/shared/integrations";
import { registerAllProviders } from "@/lib/providers";
import type { TenantSessionData } from "@ambaril/shared/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

function assertPermission(session: TenantSessionData, perm: string) {
  if (session.permissions.includes("*")) return;
  if (!session.permissions.includes(perm)) throw new Error("Acesso negado");
}

// ---------------------------------------------------------------------------
// Required capabilities for the Creators module setup wizard
// ---------------------------------------------------------------------------

const REQUIRED_CAPABILITIES = ["ecommerce", "checkout", "messaging"] as const;

// ---------------------------------------------------------------------------
// 1. getCreatorsSetupState — reads module_setup_state for "creators" module
// ---------------------------------------------------------------------------

export async function getCreatorsSetupState(): Promise<
  ActionResult<{
    isSetupComplete: boolean;
    currentStep: string | null;
    stepData: Record<string, unknown>;
  }>
> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:write");

    const result = await db
      .select()
      .from(moduleSetupState)
      .where(
        and(
          eq(moduleSetupState.tenantId, session.tenantId),
          eq(moduleSetupState.moduleId, "creators"),
        ),
      )
      .limit(1);

    if (!result[0]) {
      return {
        data: { isSetupComplete: false, currentStep: null, stepData: {} },
      };
    }

    return {
      data: {
        isSetupComplete: result[0].isSetupComplete,
        currentStep: result[0].currentStep,
        stepData: (result[0].stepData ?? {}) as Record<string, unknown>,
      },
    };
  } catch (err) {
    if (err instanceof Error && err.message === "Acesso negado") {
      return { error: "Acesso negado" };
    }
    console.error("[getCreatorsSetupState]", err);
    return { error: "Erro ao buscar estado do setup" };
  }
}

// ---------------------------------------------------------------------------
// 2. checkIntegrationStatus — check which capabilities are configured
// ---------------------------------------------------------------------------

interface IntegrationStatusItem {
  capability: string;
  providerId: string;
  providerName: string;
  isActive: boolean;
  lastTestedAt: string | null;
}

export async function checkIntegrationStatus(): Promise<
  ActionResult<{
    integrations: IntegrationStatusItem[];
    missing: string[];
  }>
> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:write");

    // Query tenant_integrations joined with integration_providers
    const rows = await db
      .select({
        capability: tenantIntegrations.capability,
        providerId: tenantIntegrations.providerId,
        providerName: integrationProviders.name,
        isActive: tenantIntegrations.isActive,
        lastTestedAt: tenantIntegrations.lastTestedAt,
      })
      .from(tenantIntegrations)
      .innerJoin(
        integrationProviders,
        eq(tenantIntegrations.providerId, integrationProviders.providerId),
      )
      .where(eq(tenantIntegrations.tenantId, session.tenantId));

    const integrations: IntegrationStatusItem[] = rows.map((row) => ({
      capability: row.capability,
      providerId: row.providerId,
      providerName: row.providerName,
      isActive: row.isActive,
      lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
    }));

    // Determine which required capabilities are missing or inactive
    const activeCapabilities = new Set(
      integrations.filter((i) => i.isActive).map((i) => i.capability),
    );
    const missing = REQUIRED_CAPABILITIES.filter(
      (cap) => !activeCapabilities.has(cap),
    );

    return { data: { integrations, missing } };
  } catch (err) {
    if (err instanceof Error && err.message === "Acesso negado") {
      return { error: "Acesso negado" };
    }
    console.error("[checkIntegrationStatus]", err);
    return { error: "Erro ao verificar integracoes" };
  }
}

// ---------------------------------------------------------------------------
// 3. saveSetupStep — save wizard progress (upsert)
// ---------------------------------------------------------------------------

export async function saveSetupStep(
  step: string,
  data: Record<string, unknown>,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:write");

    if (!step || step.length > 50) {
      return { error: "Step invalido" };
    }

    await withTenantContext(session.tenantId, async (tx) => {
      // Check if a row already exists for this module
      const existing = await tx
        .select({ id: moduleSetupState.id, stepData: moduleSetupState.stepData })
        .from(moduleSetupState)
        .where(
          and(
            eq(moduleSetupState.tenantId, session.tenantId),
            eq(moduleSetupState.moduleId, "creators"),
          ),
        )
        .limit(1);

      if (existing[0]) {
        // Merge new step data into existing stepData
        const currentStepData = (existing[0].stepData ?? {}) as Record<string, unknown>;
        const mergedStepData = { ...currentStepData, [step]: data };

        await tx
          .update(moduleSetupState)
          .set({
            currentStep: step,
            stepData: mergedStepData,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(moduleSetupState.tenantId, session.tenantId),
              eq(moduleSetupState.moduleId, "creators"),
            ),
          );
      } else {
        // Insert new row
        await tx.insert(moduleSetupState).values({
          tenantId: session.tenantId,
          moduleId: "creators",
          currentStep: step,
          stepData: { [step]: data },
          isSetupComplete: false,
        });
      }
    });

    return { data: { ok: true } };
  } catch (err) {
    if (err instanceof Error && err.message === "Acesso negado") {
      return { error: "Acesso negado" };
    }
    console.error("[saveSetupStep]", err);
    return { error: "Erro ao salvar progresso do setup" };
  }
}

// ---------------------------------------------------------------------------
// 4. importCouponsFromProvider — import coupons from ecommerce provider
// ---------------------------------------------------------------------------

export async function importCouponsFromProvider(): Promise<
  ActionResult<{
    imported: number;
    coupons: Array<{
      code: string;
      discountType: string;
      discountValue: string;
      isActive: boolean;
    }>;
  }>
> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:write");

    // Ensure providers are registered before resolving
    registerAllProviders();

    const ecommerce = await getProvider(session.tenantId, "ecommerce");
    const providerCoupons = await ecommerce.listCoupons();

    const mappedCoupons = providerCoupons.map((c) => ({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      isActive: c.isActive,
    }));

    return {
      data: {
        imported: mappedCoupons.length,
        coupons: mappedCoupons,
      },
    };
  } catch (err) {
    if (err instanceof Error && err.message === "Acesso negado") {
      return { error: "Acesso negado" };
    }
    console.error("[importCouponsFromProvider]", err);
    return { error: "Erro ao importar cupons do provedor" };
  }
}

// ---------------------------------------------------------------------------
// 5. bulkImportCreatorsFromCoupons — create creator records + link coupons
// ---------------------------------------------------------------------------

interface BulkImportEntry {
  name: string;
  email: string;
  couponCode: string;
  tierId?: string;
}

export async function bulkImportCreatorsFromCoupons(
  entries: BulkImportEntry[],
): Promise<ActionResult<{ created: number; linked: number }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:write");

    if (!entries || entries.length === 0) {
      return { error: "Nenhum creator para importar" };
    }

    if (entries.length > 500) {
      return { error: "Maximo de 500 creators por importacao" };
    }

    // Validate entries
    for (const entry of entries) {
      if (!entry.name || entry.name.length < 2) {
        return { error: `Nome invalido para "${entry.email || "desconhecido"}"` };
      }
      if (!entry.email || !entry.email.includes("@")) {
        return { error: `Email invalido: "${entry.email}"` };
      }
      if (!entry.couponCode || entry.couponCode.length === 0) {
        return { error: `Cupom invalido para "${entry.name}"` };
      }
      if (entry.tierId && !/^[0-9a-f-]{36}$/i.test(entry.tierId)) {
        return { error: `Tier ID invalido para "${entry.name}"` };
      }
    }

    const result = await withTenantContext(session.tenantId, async (tx) => {
      let created = 0;
      let linked = 0;

      for (const entry of entries) {
        // 1. Find or create coupon in DB
        const existingCoupons = await tx
          .select({ id: coupons.id })
          .from(coupons)
          .where(
            and(
              eq(coupons.tenantId, session.tenantId),
              eq(coupons.code, entry.couponCode.toUpperCase()),
            ),
          )
          .limit(1);

        let couponId: string;

        if (existingCoupons[0]) {
          couponId = existingCoupons[0].id;
        } else {
          // Create a new coupon record — defaults to creator type, percent, 10%
          const newCoupon = await tx
            .insert(coupons)
            .values({
              tenantId: session.tenantId,
              code: entry.couponCode.toUpperCase(),
              type: "creator",
              discountType: "percent",
              discountPercent: "10.00",
              isActive: true,
            })
            .returning({ id: coupons.id });

          if (!newCoupon[0]) {
            throw new Error(`Falha ao criar cupom ${entry.couponCode}`);
          }
          couponId = newCoupon[0].id;
        }

        // 2. Find or create creator by email
        const existingCreators = await tx
          .select({ id: creators.id, couponId: creators.couponId })
          .from(creators)
          .where(
            and(
              eq(creators.tenantId, session.tenantId),
              eq(creators.email, entry.email.toLowerCase()),
            ),
          )
          .limit(1);

        let creatorId: string;

        if (existingCreators[0]) {
          creatorId = existingCreators[0].id;

          // Link coupon if not already linked
          if (!existingCreators[0].couponId) {
            await tx
              .update(creators)
              .set({
                couponId,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(creators.id, creatorId),
                  eq(creators.tenantId, session.tenantId),
                ),
              );
            linked++;
          }
        } else {
          // Resolve commission rate from tier
          let commissionRate = "0.00";
          if (entry.tierId) {
            const tier = await tx
              .select({ commissionRate: creatorTiers.commissionRate })
              .from(creatorTiers)
              .where(
                and(
                  eq(creatorTiers.id, entry.tierId),
                  eq(creatorTiers.tenantId, session.tenantId),
                ),
              )
              .limit(1);

            if (tier[0]) {
              commissionRate = tier[0].commissionRate;
            }
          }

          const newCreator = await tx
            .insert(creators)
            .values({
              tenantId: session.tenantId,
              name: entry.name,
              email: entry.email.toLowerCase(),
              phone: "",
              cpf: "",
              tierId: entry.tierId ?? null,
              commissionRate,
              couponId,
              managedByStaff: true,
              status: "pending",
            })
            .returning({ id: creators.id });

          if (!newCreator[0]) {
            throw new Error(`Falha ao criar creator ${entry.name}`);
          }
          creatorId = newCreator[0].id;
          created++;
          linked++;
        }

        // 3. Update coupon to point back to creator
        await tx
          .update(coupons)
          .set({
            creatorId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(coupons.id, couponId),
              eq(coupons.tenantId, session.tenantId),
            ),
          );
      }

      return { created, linked };
    });

    return { data: result };
  } catch (err) {
    if (err instanceof Error && err.message === "Acesso negado") {
      return { error: "Acesso negado" };
    }
    console.error("[bulkImportCreatorsFromCoupons]", err);
    return { error: "Erro ao importar creators" };
  }
}

// ---------------------------------------------------------------------------
// 6. completeCreatorsSetup — mark setup as done
// ---------------------------------------------------------------------------

export async function completeCreatorsSetup(): Promise<ActionResult<{ ok: true }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:write");

    await withTenantContext(session.tenantId, async (tx) => {
      const existing = await tx
        .select({ id: moduleSetupState.id })
        .from(moduleSetupState)
        .where(
          and(
            eq(moduleSetupState.tenantId, session.tenantId),
            eq(moduleSetupState.moduleId, "creators"),
          ),
        )
        .limit(1);

      if (existing[0]) {
        await tx
          .update(moduleSetupState)
          .set({
            isSetupComplete: true,
            completedAt: new Date(),
            completedBy: session.userId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(moduleSetupState.tenantId, session.tenantId),
              eq(moduleSetupState.moduleId, "creators"),
            ),
          );
      } else {
        await tx.insert(moduleSetupState).values({
          tenantId: session.tenantId,
          moduleId: "creators",
          isSetupComplete: true,
          completedAt: new Date(),
          completedBy: session.userId,
          stepData: {},
        });
      }
    });

    return { data: { ok: true } };
  } catch (err) {
    if (err instanceof Error && err.message === "Acesso negado") {
      return { error: "Acesso negado" };
    }
    console.error("[completeCreatorsSetup]", err);
    return { error: "Erro ao finalizar setup" };
  }
}
