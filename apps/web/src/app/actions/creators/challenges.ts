"use server";

import { db } from "@ambaril/db";
import {
  eq,
  and,
  desc,
  sql,
  count,
} from "drizzle-orm";
import {
  creators,
  challenges,
  challengeSubmissions,
  pointsLedger,
} from "@ambaril/db/schema";
import { getTenantSession, withTenantContext } from "@/lib/tenant";
import {
  challengeCrudSchema,
  challengeSubmissionSchema,
} from "@ambaril/shared/schemas";
import { uuidSchema, paginationSchema } from "@ambaril/shared/validators";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const listChallengesInput = paginationSchema.extend({
  status: z
    .enum(["draft", "active", "judging", "completed", "cancelled"])
    .optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2026).optional(),
});

// ---------------------------------------------------------------------------
// createChallenge
// ---------------------------------------------------------------------------

export async function createChallenge(
  input: z.infer<typeof challengeCrudSchema>,
): Promise<ActionResult<{ id: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:challenges:write")
  )
    return { error: "Acesso negado" };

  const parsed = challengeCrudSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [challenge] = await tx
      .insert(challenges)
      .values({
        tenantId: session.tenantId,
        name: parsed.data.name,
        description: parsed.data.description,
        category: parsed.data.category as "drop" | "style" | "community" | "viral" | "surprise",
        month: parsed.data.month,
        year: parsed.data.year,
        pointsReward: parsed.data.pointsReward,
        requirements: parsed.data.requirements,
        maxParticipants: parsed.data.maxParticipants ?? null,
        startsAt: new Date(parsed.data.startsAt),
        endsAt: new Date(parsed.data.endsAt),
        status: "draft",
        createdBy: session.userId,
      })
      .returning({ id: challenges.id });

    if (!challenge) return { error: "Falha ao criar desafio" };
    return { data: { id: challenge.id } };
  });
}

// ---------------------------------------------------------------------------
// updateChallenge — Only if status='draft'
// ---------------------------------------------------------------------------

export async function updateChallenge(
  challengeId: string,
  input: Partial<z.infer<typeof challengeCrudSchema>>,
): Promise<ActionResult<{ id: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:challenges:write")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(challengeId);
  if (!idParsed.success) return { error: "ID do desafio invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [existing] = await tx
      .select()
      .from(challenges)
      .where(
        and(
          eq(challenges.id, idParsed.data),
          eq(challenges.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!existing) return { error: "Desafio nao encontrado" };
    if (existing.status !== "draft")
      return { error: "Apenas desafios em rascunho podem ser editados" };

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.month !== undefined) updateData.month = input.month;
    if (input.year !== undefined) updateData.year = input.year;
    if (input.pointsReward !== undefined)
      updateData.pointsReward = input.pointsReward;
    if (input.requirements !== undefined)
      updateData.requirements = input.requirements;
    if (input.maxParticipants !== undefined)
      updateData.maxParticipants = input.maxParticipants;
    if (input.startsAt !== undefined)
      updateData.startsAt = new Date(input.startsAt);
    if (input.endsAt !== undefined) updateData.endsAt = new Date(input.endsAt);

    await tx
      .update(challenges)
      .set(updateData)
      .where(eq(challenges.id, idParsed.data));

    return { data: { id: idParsed.data } };
  });
}

// ---------------------------------------------------------------------------
// deleteChallenge — Only if status='draft' and no submissions
// ---------------------------------------------------------------------------

export async function deleteChallenge(
  challengeId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:challenges:write")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(challengeId);
  if (!idParsed.success) return { error: "ID do desafio invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [existing] = await tx
      .select()
      .from(challenges)
      .where(
        and(
          eq(challenges.id, idParsed.data),
          eq(challenges.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!existing) return { error: "Desafio nao encontrado" };
    if (existing.status !== "draft")
      return { error: "Apenas desafios em rascunho podem ser excluidos" };

    // Check for existing submissions
    const [submissionCount] = await tx
      .select({ total: count() })
      .from(challengeSubmissions)
      .where(
        and(
          eq(challengeSubmissions.challengeId, idParsed.data),
          eq(challengeSubmissions.tenantId, session.tenantId),
        ),
      );

    if ((submissionCount?.total ?? 0) > 0)
      return { error: "Desafio possui submissoes e nao pode ser excluido" };

    await tx.delete(challenges).where(eq(challenges.id, idParsed.data));

    return { data: { deleted: true } };
  });
}

// ---------------------------------------------------------------------------
// listChallenges — With pagination, filter by status/month/year
// ---------------------------------------------------------------------------

export async function listChallenges(
  input?: z.infer<typeof listChallengesInput>,
): Promise<
  ActionResult<{
    items: (typeof challenges.$inferSelect)[];
    total: number;
    page: number;
    perPage: number;
  }>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:challenges:read")
  )
    return { error: "Acesso negado" };

  const parsed = listChallengesInput.safeParse(input ?? {});
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  const { page, per_page, status, month, year } = parsed.data;

  return withTenantContext(session.tenantId, async (tx) => {
    const conditions = [eq(challenges.tenantId, session.tenantId)];

    if (status) conditions.push(eq(challenges.status, status));
    if (month) conditions.push(eq(challenges.month, month));
    if (year) conditions.push(eq(challenges.year, year));

    const where = and(...conditions);

    const [totalResult] = await tx
      .select({ total: count() })
      .from(challenges)
      .where(where);

    const items = await tx
      .select()
      .from(challenges)
      .where(where)
      .orderBy(desc(challenges.createdAt))
      .limit(per_page)
      .offset((page - 1) * per_page);

    return {
      data: {
        items,
        total: totalResult?.total ?? 0,
        page,
        perPage: per_page,
      },
    };
  });
}

// ---------------------------------------------------------------------------
// submitProof — Creator submits proof for a challenge
// ---------------------------------------------------------------------------

export async function submitProof(
  challengeId: string,
  input: z.infer<typeof challengeSubmissionSchema>,
): Promise<ActionResult<{ submissionId: string }>> {
  const session = await getTenantSession();
  // Creators can submit their own proofs
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:challenges:write") &&
    !session.permissions.includes("creators:challenges:submit")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(challengeId);
  if (!idParsed.success) return { error: "ID do desafio invalido" };

  const parsed = challengeSubmissionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  return withTenantContext(session.tenantId, async (tx) => {
    // Verify challenge exists and is active
    const [challenge] = await tx
      .select()
      .from(challenges)
      .where(
        and(
          eq(challenges.id, idParsed.data),
          eq(challenges.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!challenge) return { error: "Desafio nao encontrado" };
    if (challenge.status !== "active")
      return { error: "Desafio nao esta ativo" };

    // Find the creator associated with this user
    const [creator] = await tx
      .select()
      .from(creators)
      .where(
        and(
          eq(creators.userId, session.userId),
          eq(creators.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!creator) return { error: "Creator nao encontrado para este usuario" };

    // Check if creator hasn't already submitted
    const [existingSubmission] = await tx
      .select({ total: count() })
      .from(challengeSubmissions)
      .where(
        and(
          eq(challengeSubmissions.challengeId, idParsed.data),
          eq(challengeSubmissions.creatorId, creator.id),
          eq(challengeSubmissions.tenantId, session.tenantId),
        ),
      );

    if ((existingSubmission?.total ?? 0) > 0)
      return { error: "Voce ja enviou uma submissao para este desafio" };

    // Check max participants
    if (challenge.maxParticipants) {
      const [currentCount] = await tx
        .select({ total: count() })
        .from(challengeSubmissions)
        .where(
          and(
            eq(challengeSubmissions.challengeId, idParsed.data),
            eq(challengeSubmissions.tenantId, session.tenantId),
          ),
        );

      if ((currentCount?.total ?? 0) >= challenge.maxParticipants)
        return { error: "Numero maximo de participantes atingido" };
    }

    // Insert submission
    const [submission] = await tx
      .insert(challengeSubmissions)
      .values({
        tenantId: session.tenantId,
        challengeId: idParsed.data,
        creatorId: creator.id,
        proofUrl: parsed.data.proofUrl,
        proofType: parsed.data.proofType,
        caption: parsed.data.caption ?? null,
        status: "pending",
      })
      .returning({ id: challengeSubmissions.id });

    if (!submission) return { error: "Falha ao criar submissao" };
    return { data: { submissionId: submission.id } };
  });
}

// ---------------------------------------------------------------------------
// approveSubmission — Award points and approve
// ---------------------------------------------------------------------------

export async function approveSubmission(
  submissionId: string,
): Promise<ActionResult<{ id: string; pointsAwarded: number }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:challenges:write")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(submissionId);
  if (!idParsed.success) return { error: "ID da submissao invalido" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [submission] = await tx
      .select()
      .from(challengeSubmissions)
      .where(
        and(
          eq(challengeSubmissions.id, idParsed.data),
          eq(challengeSubmissions.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!submission) return { error: "Submissao nao encontrada" };
    if (submission.status !== "pending")
      return { error: "Submissao ja foi avaliada" };

    // Get challenge for points reward
    const [challenge] = await tx
      .select()
      .from(challenges)
      .where(eq(challenges.id, submission.challengeId))
      .limit(1);

    if (!challenge) return { error: "Desafio nao encontrado" };

    const now = new Date();
    const pointsToAward = challenge.pointsReward;

    // Update submission
    await tx
      .update(challengeSubmissions)
      .set({
        status: "approved",
        reviewedBy: session.userId,
        reviewedAt: now,
        pointsAwarded: pointsToAward,
        updatedAt: now,
      })
      .where(eq(challengeSubmissions.id, idParsed.data));

    // Insert points ledger entry
    await tx.insert(pointsLedger).values({
      tenantId: session.tenantId,
      creatorId: submission.creatorId,
      points: pointsToAward,
      actionType: "challenge_completed",
      referenceType: "challenge_submission",
      referenceId: submission.id,
      description: `Desafio completado: ${challenge.name}`,
    });

    // Update creator totalPoints
    await tx
      .update(creators)
      .set({
        totalPoints: sql`${creators.totalPoints} + ${pointsToAward}`,
        updatedAt: now,
      })
      .where(eq(creators.id, submission.creatorId));

    return { data: { id: idParsed.data, pointsAwarded: pointsToAward } };
  });
}

// ---------------------------------------------------------------------------
// listSubmissions — List submissions for a specific challenge
// ---------------------------------------------------------------------------

const listSubmissionsInput = z.object({
  challengeId: uuidSchema,
});

export async function listSubmissions(
  input: z.infer<typeof listSubmissionsInput>,
): Promise<
  ActionResult<{
    items: (typeof challengeSubmissions.$inferSelect & { creatorName: string })[];
  }>
> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:challenges:read")
  )
    return { error: "Acesso negado" };

  const parsed = listSubmissionsInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  return withTenantContext(session.tenantId, async (tx) => {
    const rows = await tx
      .select({
        id: challengeSubmissions.id,
        tenantId: challengeSubmissions.tenantId,
        challengeId: challengeSubmissions.challengeId,
        creatorId: challengeSubmissions.creatorId,
        proofUrl: challengeSubmissions.proofUrl,
        proofType: challengeSubmissions.proofType,
        caption: challengeSubmissions.caption,
        status: challengeSubmissions.status,
        reviewedBy: challengeSubmissions.reviewedBy,
        reviewedAt: challengeSubmissions.reviewedAt,
        pointsAwarded: challengeSubmissions.pointsAwarded,
        rejectionReason: challengeSubmissions.rejectionReason,
        createdAt: challengeSubmissions.createdAt,
        updatedAt: challengeSubmissions.updatedAt,
        creatorName: creators.name,
      })
      .from(challengeSubmissions)
      .innerJoin(creators, eq(challengeSubmissions.creatorId, creators.id))
      .where(
        and(
          eq(challengeSubmissions.challengeId, parsed.data.challengeId),
          eq(challengeSubmissions.tenantId, session.tenantId),
        ),
      )
      .orderBy(desc(challengeSubmissions.createdAt));

    return { data: { items: rows } };
  });
}

// ---------------------------------------------------------------------------
// rejectSubmission — Reject with reason
// ---------------------------------------------------------------------------

export async function rejectSubmission(
  submissionId: string,
  reason: string,
): Promise<ActionResult<{ id: string; status: string }>> {
  const session = await getTenantSession();
  if (
    !session.permissions.includes("*") &&
    !session.permissions.includes("creators:challenges:write")
  )
    return { error: "Acesso negado" };

  const idParsed = uuidSchema.safeParse(submissionId);
  if (!idParsed.success) return { error: "ID da submissao invalido" };

  if (!reason || reason.length < 10)
    return { error: "Motivo da rejeicao deve ter pelo menos 10 caracteres" };

  return withTenantContext(session.tenantId, async (tx) => {
    const [submission] = await tx
      .select()
      .from(challengeSubmissions)
      .where(
        and(
          eq(challengeSubmissions.id, idParsed.data),
          eq(challengeSubmissions.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!submission) return { error: "Submissao nao encontrada" };
    if (submission.status !== "pending")
      return { error: "Submissao ja foi avaliada" };

    const now = new Date();
    await tx
      .update(challengeSubmissions)
      .set({
        status: "rejected",
        reviewedBy: session.userId,
        reviewedAt: now,
        rejectionReason: reason,
        updatedAt: now,
      })
      .where(eq(challengeSubmissions.id, idParsed.data));

    return { data: { id: idParsed.data, status: "rejected" } };
  });
}
