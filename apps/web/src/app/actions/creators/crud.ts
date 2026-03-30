"use server";

import { db } from "@ambaril/db";
import { eq, and, desc, asc, like, sql, count } from "drizzle-orm";
import { creators, creatorTiers, coupons, socialAccounts } from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import {
  creatorFiltersSchema,
  profileUpdateSchema,
} from "@ambaril/shared/schemas";
import type { TenantSessionData } from "@ambaril/shared/types";
import { ZodError } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

function assertPermission(session: TenantSessionData, perm: string) {
  if (session.permissions.includes("*")) return;
  if (!session.permissions.includes(perm)) throw new Error("Acesso negado");
}

function formatZodError(err: ZodError): string {
  return err.errors.map((e) => e.message).join("; ");
}

// ---------------------------------------------------------------------------
// 1. listCreators — Paginated list with filters
// ---------------------------------------------------------------------------

interface CreatorListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "pending" | "active" | "suspended" | "inactive";
  tierName: string | null;
  commissionRate: string;
  totalSalesAmount: string;
  totalSalesCount: number;
  totalPoints: number;
  managedByStaff: boolean;
  couponCode: string | null;
  createdAt: Date;
}

interface ListCreatorsResult {
  creators: CreatorListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listCreators(
  filters: Record<string, unknown>,
): Promise<ActionResult<ListCreatorsResult>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:read");

    const parsed = creatorFiltersSchema.safeParse(filters);
    if (!parsed.success) {
      return { error: formatZodError(parsed.error) };
    }

    const { page, per_page, status, tierId, managed, search, sortBy } = parsed.data;
    const offset = (page - 1) * per_page;

    // Build where conditions
    const conditions = [eq(creators.tenantId, session.tenantId)];

    if (status) {
      conditions.push(eq(creators.status, status));
    }
    if (tierId) {
      conditions.push(eq(creators.tierId, tierId));
    }
    if (managed !== undefined) {
      conditions.push(eq(creators.managedByStaff, managed));
    }
    if (search) {
      conditions.push(
        sql`(${creators.name} ILIKE ${"%" + search + "%"} OR ${creators.email} ILIKE ${"%" + search + "%"})`,
      );
    }

    const whereClause = and(...conditions);

    // Determine sort column
    let orderByClause;
    switch (sortBy) {
      case "name":
        orderByClause = asc(creators.name);
        break;
      case "total_sales":
        orderByClause = desc(creators.totalSalesAmount);
        break;
      case "total_points":
        orderByClause = desc(creators.totalPoints);
        break;
      case "tier":
        orderByClause = asc(creatorTiers.sortOrder);
        break;
      case "created_at":
      default:
        orderByClause = desc(creators.createdAt);
        break;
    }

    // Count total
    const totalResult = await db
      .select({ count: count() })
      .from(creators)
      .where(whereClause);

    const total = totalResult[0]?.count ?? 0;

    // Fetch paginated results with tier join
    const rows = await db
      .select({
        id: creators.id,
        name: creators.name,
        email: creators.email,
        phone: creators.phone,
        status: creators.status,
        tierName: creatorTiers.name,
        commissionRate: creators.commissionRate,
        totalSalesAmount: creators.totalSalesAmount,
        totalSalesCount: creators.totalSalesCount,
        totalPoints: creators.totalPoints,
        managedByStaff: creators.managedByStaff,
        couponCode: coupons.code,
        createdAt: creators.createdAt,
      })
      .from(creators)
      .leftJoin(creatorTiers, eq(creators.tierId, creatorTiers.id))
      .leftJoin(coupons, eq(creators.couponId, coupons.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(per_page)
      .offset(offset);

    return {
      data: {
        creators: rows,
        total,
        page,
        pageSize: per_page,
      },
    };
  } catch (err) {
    if (err instanceof Error && err.message === "Acesso negado") {
      return { error: "Acesso negado" };
    }
    console.error("[listCreators]", err);
    return { error: "Erro ao listar creators" };
  }
}

// ---------------------------------------------------------------------------
// 2. getCreator — Single creator with relations
// ---------------------------------------------------------------------------

interface CreatorDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  bio: string | null;
  profileImageUrl: string | null;
  tierId: string | null;
  tierName: string | null;
  tierSlug: string | null;
  commissionRate: string;
  couponId: string | null;
  couponCode: string | null;
  totalSalesAmount: string;
  totalSalesCount: number;
  totalPoints: number;
  currentMonthSalesAmount: string;
  currentMonthSalesCount: number;
  status: "pending" | "active" | "suspended" | "inactive";
  managedByStaff: boolean;
  paymentPreference: "pix" | "store_credit" | "product" | null;
  pixKey: string | null;
  pixKeyType: "cpf" | "email" | "phone" | "random" | null;
  clothingSize: string | null;
  birthDate: string | null;
  discoverySource: string | null;
  motivation: string | null;
  contentNiches: unknown;
  contentTypes: unknown;
  address: unknown;
  contentRightsAccepted: boolean;
  monthlyCap: string;
  suspensionReason: string | null;
  referredByCreatorId: string | null;
  joinedAt: Date | null;
  lastSaleAt: Date | null;
  tierEvaluatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  socialAccounts: Array<{
    id: string;
    platform: "instagram" | "tiktok" | "youtube" | "pinterest" | "twitter" | "other";
    handle: string;
    url: string | null;
    followers: number | null;
    isPrimary: boolean;
    verifiedAt: Date | null;
  }>;
}

export async function getCreator(
  id: string,
): Promise<ActionResult<CreatorDetail>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:read");

    // Validate UUID
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return { error: "ID invalido" };
    }

    // Fetch creator with tier and coupon
    const rows = await db
      .select({
        id: creators.id,
        name: creators.name,
        email: creators.email,
        phone: creators.phone,
        cpf: creators.cpf,
        bio: creators.bio,
        profileImageUrl: creators.profileImageUrl,
        tierId: creators.tierId,
        tierName: creatorTiers.name,
        tierSlug: creatorTiers.slug,
        commissionRate: creators.commissionRate,
        couponId: creators.couponId,
        couponCode: coupons.code,
        totalSalesAmount: creators.totalSalesAmount,
        totalSalesCount: creators.totalSalesCount,
        totalPoints: creators.totalPoints,
        currentMonthSalesAmount: creators.currentMonthSalesAmount,
        currentMonthSalesCount: creators.currentMonthSalesCount,
        status: creators.status,
        managedByStaff: creators.managedByStaff,
        paymentPreference: creators.paymentPreference,
        pixKey: creators.pixKey,
        pixKeyType: creators.pixKeyType,
        clothingSize: creators.clothingSize,
        birthDate: creators.birthDate,
        discoverySource: creators.discoverySource,
        motivation: creators.motivation,
        contentNiches: creators.contentNiches,
        contentTypes: creators.contentTypes,
        address: creators.address,
        contentRightsAccepted: creators.contentRightsAccepted,
        monthlyCap: creators.monthlyCap,
        suspensionReason: creators.suspensionReason,
        referredByCreatorId: creators.referredByCreatorId,
        joinedAt: creators.joinedAt,
        lastSaleAt: creators.lastSaleAt,
        tierEvaluatedAt: creators.tierEvaluatedAt,
        createdAt: creators.createdAt,
        updatedAt: creators.updatedAt,
      })
      .from(creators)
      .leftJoin(creatorTiers, eq(creators.tierId, creatorTiers.id))
      .leftJoin(coupons, eq(creators.couponId, coupons.id))
      .where(and(eq(creators.id, id), eq(creators.tenantId, session.tenantId)))
      .limit(1);

    const creator = rows[0];
    if (!creator) {
      return { error: "Creator nao encontrado" };
    }

    // Fetch social accounts
    const accounts = await db
      .select({
        id: socialAccounts.id,
        platform: socialAccounts.platform,
        handle: socialAccounts.handle,
        url: socialAccounts.url,
        followers: socialAccounts.followers,
        isPrimary: socialAccounts.isPrimary,
        verifiedAt: socialAccounts.verifiedAt,
      })
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.creatorId, id),
          eq(socialAccounts.tenantId, session.tenantId),
        ),
      );

    return {
      data: {
        ...creator,
        socialAccounts: accounts,
      },
    };
  } catch (err) {
    if (err instanceof Error && err.message === "Acesso negado") {
      return { error: "Acesso negado" };
    }
    console.error("[getCreator]", err);
    return { error: "Erro ao buscar creator" };
  }
}

// ---------------------------------------------------------------------------
// 3. createCreator — White-glove creation by admin
// ---------------------------------------------------------------------------

interface CreateCreatorInput {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  bio?: string;
  tierId?: string;
  commissionRate?: string;
  paymentPreference?: "pix" | "store_credit" | "product";
  pixKey?: string;
  pixKeyType?: "cpf" | "email" | "phone" | "random";
  clothingSize?: string;
  birthDate?: string;
  discoverySource?: string;
  motivation?: string;
  contentNiches?: string[];
  contentTypes?: string[];
  address?: Record<string, unknown>;
  socialAccounts?: Array<{
    platform: "instagram" | "tiktok" | "youtube" | "pinterest" | "twitter" | "other";
    handle: string;
    url?: string;
    isPrimary?: boolean;
  }>;
}

export async function createCreator(
  input: CreateCreatorInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:write");

    // Validate required fields
    if (!input.name || input.name.length < 2) {
      return { error: "Nome deve ter pelo menos 2 caracteres" };
    }
    if (!input.email) {
      return { error: "Email e obrigatorio" };
    }
    if (!input.phone) {
      return { error: "Telefone e obrigatorio" };
    }
    if (!input.cpf || !/^\d{11}$/.test(input.cpf)) {
      return { error: "CPF deve conter 11 digitos" };
    }

    const creatorId = await withTenantContext(session.tenantId, async (tx) => {
      // Check for existing CPF
      const existing = await tx
        .select({ id: creators.id })
        .from(creators)
        .where(
          and(
            eq(creators.tenantId, session.tenantId),
            eq(creators.cpf, input.cpf),
          ),
        )
        .limit(1);

      if (existing[0]) {
        throw new Error("CPF ja cadastrado");
      }

      // Check for existing email
      const existingEmail = await tx
        .select({ id: creators.id })
        .from(creators)
        .where(
          and(
            eq(creators.tenantId, session.tenantId),
            eq(creators.email, input.email),
          ),
        )
        .limit(1);

      if (existingEmail[0]) {
        throw new Error("Email ja cadastrado");
      }

      // Insert creator
      const result = await tx
        .insert(creators)
        .values({
          tenantId: session.tenantId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          cpf: input.cpf,
          bio: input.bio ?? null,
          tierId: input.tierId ?? null,
          commissionRate: input.commissionRate ?? "0.00",
          paymentPreference: input.paymentPreference ?? null,
          pixKey: input.pixKey ?? null,
          pixKeyType: input.pixKeyType ?? null,
          clothingSize: input.clothingSize ?? null,
          birthDate: input.birthDate ?? null,
          discoverySource: input.discoverySource ?? null,
          motivation: input.motivation ?? null,
          contentNiches: input.contentNiches ?? null,
          contentTypes: input.contentTypes ?? null,
          address: input.address ?? null,
          managedByStaff: true,
          status: "pending",
        })
        .returning({ id: creators.id });

      const newCreatorId = result[0]?.id;
      if (!newCreatorId) {
        throw new Error("Falha ao criar creator");
      }

      // Insert social accounts if provided
      if (input.socialAccounts && input.socialAccounts.length > 0) {
        await tx.insert(socialAccounts).values(
          input.socialAccounts.map((sa) => ({
            tenantId: session.tenantId,
            creatorId: newCreatorId,
            platform: sa.platform,
            handle: sa.handle,
            url: sa.url ?? null,
            isPrimary: sa.isPrimary ?? false,
          })),
        );
      }

      return newCreatorId;
    });

    return { data: { id: creatorId } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Acesso negado") return { error: "Acesso negado" };
      if (err.message === "CPF ja cadastrado") return { error: "CPF ja cadastrado para este tenant" };
      if (err.message === "Email ja cadastrado") return { error: "Email ja cadastrado para este tenant" };
    }
    console.error("[createCreator]", err);
    return { error: "Erro ao criar creator" };
  }
}

// ---------------------------------------------------------------------------
// 4. updateCreator — Update creator fields
// ---------------------------------------------------------------------------

export async function updateCreator(
  id: string,
  data: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getTenantSession();
    assertPermission(session, "creators:profiles:write");

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return { error: "ID invalido" };
    }

    const parsed = profileUpdateSchema.safeParse(data);
    if (!parsed.success) {
      return { error: formatZodError(parsed.error) };
    }

    const updateData = parsed.data;

    // Remove undefined fields to avoid overwriting with null
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }

    if (Object.keys(cleanData).length === 0) {
      return { error: "Nenhum campo para atualizar" };
    }

    // Add updatedAt
    cleanData.updatedAt = new Date();

    await withTenantContext(session.tenantId, async (tx) => {
      // Verify creator exists and belongs to tenant
      const existing = await tx
        .select({ id: creators.id })
        .from(creators)
        .where(
          and(eq(creators.id, id), eq(creators.tenantId, session.tenantId)),
        )
        .limit(1);

      if (!existing[0]) {
        throw new Error("Creator nao encontrado");
      }

      await tx
        .update(creators)
        .set(cleanData)
        .where(
          and(eq(creators.id, id), eq(creators.tenantId, session.tenantId)),
        );
    });

    return { data: { id } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Acesso negado") return { error: "Acesso negado" };
      if (err.message === "Creator nao encontrado") return { error: "Creator nao encontrado" };
    }
    console.error("[updateCreator]", err);
    return { error: "Erro ao atualizar creator" };
  }
}
