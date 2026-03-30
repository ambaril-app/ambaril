"use server";

import { db } from "@ambaril/db";
import { creators, socialAccounts } from "@ambaril/db/schema";
import { tenants } from "@ambaril/db/schema";
import { eq, and } from "drizzle-orm";
import { fullRegistrationSchema } from "@ambaril/shared/schemas";
import { getProvider } from "@ambaril/shared/integrations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubmitResult {
  success: boolean;
  creatorId?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// CPF check-digit validation (Receita Federal algorithm)
// ---------------------------------------------------------------------------

function validateCPF(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]!) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (check !== parseInt(cpf[9]!)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]!) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return check === parseInt(cpf[10]!);
}

// ---------------------------------------------------------------------------
// Server Action: submitCreatorApplication
// ---------------------------------------------------------------------------

export async function submitCreatorApplication(
  formData: unknown,
): Promise<SubmitResult> {
  try {
    // 1. Validate with fullRegistrationSchema
    const parsed = fullRegistrationSchema.safeParse(formData);
    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join("; ");
      return { success: false, error: messages };
    }

    const data = parsed.data;

    // 2. CPF check-digit validation
    if (!validateCPF(data.cpf)) {
      return { success: false, error: "CPF inválido (dígitos verificadores incorretos)" };
    }

    // 3. Determine tenant — public form uses first active tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.isActive, true))
      .limit(1);

    if (!tenant) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const tenantId = tenant.id;

    // 4. Uniqueness checks (CPF, email, Instagram handle)
    const existingCpf = await db
      .select({ id: creators.id })
      .from(creators)
      .where(and(eq(creators.tenantId, tenantId), eq(creators.cpf, data.cpf)))
      .limit(1);

    if (existingCpf[0]) {
      return { success: false, error: "CPF ja cadastrado" };
    }

    const existingEmail = await db
      .select({ id: creators.id })
      .from(creators)
      .where(and(eq(creators.tenantId, tenantId), eq(creators.email, data.email)))
      .limit(1);

    if (existingEmail[0]) {
      return { success: false, error: "Email ja cadastrado" };
    }

    const existingIg = await db
      .select({ id: socialAccounts.id })
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.tenantId, tenantId),
          eq(socialAccounts.platform, "instagram"),
          eq(socialAccounts.handle, data.instagram),
        ),
      )
      .limit(1);

    if (existingIg[0]) {
      return { success: false, error: "Instagram ja cadastrado" };
    }

    // 5. Create creator record with status='pending'
    const creatorResult = await db
      .insert(creators)
      .values({
        tenantId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        bio: data.bio ?? null,
        birthDate: data.birthDate ?? null,
        motivation: data.motivation,
        contentNiches: data.contentNiches,
        contentTypes: data.contentTypes,
        clothingSize: data.clothingSize ?? null,
        discoverySource: data.discoverySource ?? null,
        address: data.address,
        contentRightsAccepted: data.contentRightsAccepted,
        status: "pending",
        managedByStaff: false,
      })
      .returning({ id: creators.id });

    const newCreator = creatorResult[0];
    if (!newCreator) {
      return { success: false, error: "Erro ao criar aplicacao" };
    }

    // 6. Create social_accounts entries
    type SocialPlatform = "instagram" | "tiktok" | "youtube" | "pinterest" | "twitter" | "other";

    const socialEntries: Array<{
      tenantId: string;
      creatorId: string;
      platform: SocialPlatform;
      handle: string;
      isPrimary: boolean;
    }> = [];

    // Required: Instagram (primary)
    socialEntries.push({
      tenantId,
      creatorId: newCreator.id,
      platform: "instagram",
      handle: data.instagram,
      isPrimary: true,
    });

    // Required: TikTok
    socialEntries.push({
      tenantId,
      creatorId: newCreator.id,
      platform: "tiktok",
      handle: data.tiktok,
      isPrimary: false,
    });

    // Optional platforms
    if (data.youtube) {
      socialEntries.push({
        tenantId,
        creatorId: newCreator.id,
        platform: "youtube",
        handle: data.youtube,
        isPrimary: false,
      });
    }

    if (data.pinterest) {
      socialEntries.push({
        tenantId,
        creatorId: newCreator.id,
        platform: "pinterest",
        handle: data.pinterest,
        isPrimary: false,
      });
    }

    if (data.twitter) {
      socialEntries.push({
        tenantId,
        creatorId: newCreator.id,
        platform: "twitter",
        handle: data.twitter,
        isPrimary: false,
      });
    }

    if (data.otherPlatform) {
      socialEntries.push({
        tenantId,
        creatorId: newCreator.id,
        platform: "other",
        handle: data.otherPlatform,
        isPrimary: false,
      });
    }

    await db.insert(socialAccounts).values(socialEntries);

    // 7. Send confirmation email via messaging provider
    const messaging = await getProvider(tenantId, "messaging");
    await messaging.sendEmail({
      to: data.email,
      subject: "Aplicação recebida — Programa de Creators",
      html: `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0C0E13; color: #D0D4DE;">
          <h1 style="color: #F7F8FA; font-size: 24px; margin-bottom: 16px;">Obrigado, ${data.name}!</h1>
          <p style="font-size: 14px; line-height: 1.65;">Recebemos sua aplicação para o programa de creators.</p>
          <p style="font-size: 14px; line-height: 1.65;">Nossa equipe irá analisar suas informações e você receberá um email quando sua aplicação for aprovada.</p>
          <div style="background: #101216; border: 1px solid #262A34; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p style="color: #7C8293; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 8px;">Status</p>
            <p style="color: #F7F8FA; font-size: 18px; font-weight: 500; margin: 0;">Em análise</p>
          </div>
          <p style="font-size: 12px; color: #7C8293; line-height: 1.5;">Se você tiver dúvidas, entre em contato conosco.</p>
        </div>
      `,
    });

    return { success: true, creatorId: newCreator.id };
  } catch (err) {
    console.error("[submitCreatorApplication]", err);
    return { success: false, error: "Erro inesperado. Tente novamente." };
  }
}
