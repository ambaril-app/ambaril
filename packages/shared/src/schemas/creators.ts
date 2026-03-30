import { z } from "zod";

import {
  emailSchema,
  cpfSchema,
  uuidSchema,
  addressSchema,
  paginationSchema,
} from "../validators/index";

// ---------------------------------------------------------------------------
// Shared enums & patterns
// ---------------------------------------------------------------------------

const socialPlatformEnum = z.enum([
  "instagram",
  "tiktok",
  "youtube",
  "pinterest",
  "twitter",
  "other",
]);

const creatorStatusEnum = z.enum([
  "pending",
  "active",
  "suspended",
  "inactive",
]);

const paymentMethodEnum = z.enum(["pix", "store_credit", "product"]);

const pixKeyTypeEnum = z.enum(["cpf", "cnpj", "email", "phone", "random"]);

const challengeCategoryEnum = z.enum([
  "engagement",
  "sales",
  "content",
  "community",
]);

const proofTypeEnum = z.enum([
  "instagram_post",
  "instagram_story",
  "tiktok",
  "youtube",
  "other",
]);

const campaignTypeEnum = z.enum([
  "launch",
  "seasonal",
  "collab",
  "organic",
]);

const discountTypeEnum = z.enum(["percent", "fixed"]);

const taxpayerTypeEnum = z.enum(["pf", "mei", "pj"]);

/** Regex for Brazilian monetary values: digits + 2 decimal places (e.g. "49.90") */
const monetaryRegex = /^\d+\.\d{2}$/;

/** Regex for slug fields: lowercase letters, digits, hyphens */
const slugRegex = /^[a-z0-9-]+$/;

// ---------------------------------------------------------------------------
// 1. registrationStep1Schema — Step 1 of creator application (personal info)
// ---------------------------------------------------------------------------

/** Validates step 1 of the public creator application form: personal info */
export const registrationStep1Schema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(255, "Nome deve ter no maximo 255 caracteres"),
  email: emailSchema,
  phone: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 digitos"),
  cpf: cpfSchema,
  birthDate: z.string().date("Data de nascimento invalida").optional(),
  city: z
    .string()
    .min(1, "Cidade e obrigatoria")
    .max(100, "Cidade deve ter no maximo 100 caracteres"),
  state: z.string().length(2, "UF deve ter 2 caracteres"),
});

export type RegistrationStep1Input = z.infer<typeof registrationStep1Schema>;

// ---------------------------------------------------------------------------
// 2. registrationStep2Schema — Step 2: social networks
// ---------------------------------------------------------------------------

/** Validates step 2 of the public creator application form: social networks */
export const registrationStep2Schema = z.object({
  instagram: z
    .string()
    .min(1, "Instagram e obrigatorio")
    .max(100, "Instagram deve ter no maximo 100 caracteres"),
  tiktok: z
    .string()
    .min(1, "TikTok e obrigatorio")
    .max(100, "TikTok deve ter no maximo 100 caracteres"),
  youtube: z
    .string()
    .max(100, "YouTube deve ter no maximo 100 caracteres")
    .optional(),
  pinterest: z
    .string()
    .max(100, "Pinterest deve ter no maximo 100 caracteres")
    .optional(),
  twitter: z
    .string()
    .max(100, "Twitter deve ter no maximo 100 caracteres")
    .optional(),
  otherPlatform: z
    .string()
    .max(100, "Plataforma deve ter no maximo 100 caracteres")
    .optional(),
});

export type RegistrationStep2Input = z.infer<typeof registrationStep2Schema>;

// ---------------------------------------------------------------------------
// 3. registrationStep3Schema — Step 3: about you
// ---------------------------------------------------------------------------

/** Validates step 3 of the public creator application form: about you */
export const registrationStep3Schema = z.object({
  bio: z
    .string()
    .max(280, "Bio deve ter no maximo 280 caracteres")
    .optional(),
  motivation: z
    .string()
    .min(20, "Conte mais sobre sua motivacao (minimo 20 caracteres)")
    .max(2000, "Motivacao deve ter no maximo 2000 caracteres"),
  contentNiches: z
    .array(z.string())
    .min(1, "Selecione pelo menos um nicho"),
  contentTypes: z
    .array(z.string())
    .min(1, "Selecione pelo menos um tipo de conteudo"),
  discoverySource: z
    .string()
    .max(255, "Fonte de descoberta deve ter no maximo 255 caracteres")
    .optional(),
  clothingSize: z
    .string()
    .max(10, "Tamanho deve ter no maximo 10 caracteres")
    .optional(),
  address: addressSchema,
  contentRightsAccepted: z.literal(true, {
    errorMap: () => ({
      message: "Voce deve aceitar os direitos de uso de conteudo",
    }),
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "Voce deve aceitar os termos" }),
  }),
  ambassadorOption: z.boolean().default(false),
});

export type RegistrationStep3Input = z.infer<typeof registrationStep3Schema>;

// ---------------------------------------------------------------------------
// 4. fullRegistrationSchema — Combined steps 1-3 (server-side validation)
// ---------------------------------------------------------------------------

/** Validates the complete creator application (all 3 steps merged) for server-side validation */
export const fullRegistrationSchema = registrationStep1Schema
  .merge(registrationStep2Schema)
  .merge(registrationStep3Schema);

export type FullRegistrationInput = z.infer<typeof fullRegistrationSchema>;

// ---------------------------------------------------------------------------
// 5. ambassadorRegistrationSchema — Full registration with ambassador forced
// ---------------------------------------------------------------------------

/** Validates ambassador-specific registration (ambassadorOption forced to true) */
export const ambassadorRegistrationSchema = fullRegistrationSchema.extend({
  ambassadorOption: z.literal(true, {
    errorMap: () => ({
      message: "Opcao de embaixador deve ser verdadeira",
    }),
  }),
});

export type AmbassadorRegistrationInput = z.infer<
  typeof ambassadorRegistrationSchema
>;

// ---------------------------------------------------------------------------
// 6. profileUpdateSchema — Creator self-service profile edit
// ---------------------------------------------------------------------------

/** Validates creator self-service profile updates */
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(255, "Nome deve ter no maximo 255 caracteres")
    .optional(),
  bio: z
    .string()
    .max(280, "Bio deve ter no maximo 280 caracteres")
    .optional(),
  pixKey: z
    .string()
    .max(255, "Chave PIX deve ter no maximo 255 caracteres")
    .optional(),
  pixKeyType: pixKeyTypeEnum.optional(),
  paymentPreference: paymentMethodEnum.optional(),
  clothingSize: z
    .string()
    .max(10, "Tamanho deve ter no maximo 10 caracteres")
    .optional(),
  address: addressSchema.optional(),
  profileImageUrl: z.string().url("URL da imagem invalida").optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ---------------------------------------------------------------------------
// 7. socialAccountsSchema — Array of social accounts
// ---------------------------------------------------------------------------

const socialAccountItemSchema = z.object({
  platform: socialPlatformEnum,
  handle: z
    .string()
    .min(1, "Handle e obrigatorio")
    .max(100, "Handle deve ter no maximo 100 caracteres"),
  url: z.string().url("URL invalida").optional(),
  isPrimary: z.boolean().optional(),
});

/** Validates an array of social media accounts for a creator */
export const socialAccountsSchema = z.object({
  accounts: z
    .array(socialAccountItemSchema)
    .min(1, "Pelo menos uma conta social e obrigatoria"),
});

export type SocialAccountsInput = z.infer<typeof socialAccountsSchema>;

// ---------------------------------------------------------------------------
// 8. tierConfigSchema — Admin tier CRUD
// ---------------------------------------------------------------------------

/** Validates admin tier creation/update */
export const tierConfigSchema = z.object({
  name: z
    .string()
    .min(1, "Nome do tier e obrigatorio")
    .max(100, "Nome deve ter no maximo 100 caracteres"),
  slug: z
    .string()
    .regex(
      slugRegex,
      "Slug deve conter apenas letras minusculas, numeros e hifens",
    )
    .max(50, "Slug deve ter no maximo 50 caracteres"),
  commissionRate: z
    .string()
    .regex(monetaryRegex, "Taxa de comissao invalida (use formato 0.00)"),
  minFollowers: z
    .number()
    .int("Seguidores minimos deve ser um numero inteiro")
    .nonnegative("Seguidores minimos nao pode ser negativo"),
  benefits: z.record(z.string(), z.union([z.boolean(), z.number()])),
  sortOrder: z
    .number()
    .int("Ordem deve ser um numero inteiro")
    .nonnegative("Ordem nao pode ser negativa"),
});

export type TierConfigInput = z.infer<typeof tierConfigSchema>;

// ---------------------------------------------------------------------------
// 9. challengeCrudSchema — Create/edit challenge
// ---------------------------------------------------------------------------

/** Validates challenge creation/update by admin */
export const challengeCrudSchema = z.object({
  name: z
    .string()
    .min(1, "Nome do desafio e obrigatorio")
    .max(255, "Nome deve ter no maximo 255 caracteres"),
  description: z
    .string()
    .min(10, "Descricao deve ter pelo menos 10 caracteres")
    .max(5000, "Descricao deve ter no maximo 5000 caracteres"),
  category: challengeCategoryEnum,
  month: z
    .number()
    .int("Mes deve ser um numero inteiro")
    .min(1, "Mes deve ser entre 1 e 12")
    .max(12, "Mes deve ser entre 1 e 12"),
  year: z
    .number()
    .int("Ano deve ser um numero inteiro")
    .min(2026, "Ano deve ser 2026 ou posterior"),
  pointsReward: z
    .number()
    .int("Pontos devem ser um numero inteiro")
    .min(50, "Pontos devem ser entre 50 e 500")
    .max(500, "Pontos devem ser entre 50 e 500"),
  requirements: z.record(z.string(), z.unknown()),
  maxParticipants: z
    .number()
    .int("Maximo de participantes deve ser um numero inteiro")
    .positive("Maximo de participantes deve ser positivo")
    .optional(),
  startsAt: z.string().datetime("Data de inicio invalida"),
  endsAt: z.string().datetime("Data de fim invalida"),
});

export type ChallengeCrudInput = z.infer<typeof challengeCrudSchema>;

// ---------------------------------------------------------------------------
// 10. challengeSubmissionSchema — Creator submits proof
// ---------------------------------------------------------------------------

/** Validates a creator's challenge proof submission */
export const challengeSubmissionSchema = z.object({
  proofUrl: z.string().url("URL da prova invalida"),
  proofType: proofTypeEnum,
  caption: z
    .string()
    .max(2000, "Legenda deve ter no maximo 2000 caracteres")
    .optional(),
});

export type ChallengeSubmissionInput = z.infer<
  typeof challengeSubmissionSchema
>;

// ---------------------------------------------------------------------------
// 11. payoutCalculateSchema — Trigger payout calculation
// ---------------------------------------------------------------------------

/** Validates the period for payout calculation */
export const payoutCalculateSchema = z
  .object({
    periodStart: z.string().date("Data de inicio invalida (formato ISO)"),
    periodEnd: z.string().date("Data de fim invalida (formato ISO)"),
  })
  .refine((data) => new Date(data.periodEnd) > new Date(data.periodStart), {
    message: "Data de fim deve ser posterior a data de inicio",
    path: ["periodEnd"],
  });

export type PayoutCalculateInput = z.infer<typeof payoutCalculateSchema>;

// ---------------------------------------------------------------------------
// 12. payoutProcessSchema — Process selected payouts
// ---------------------------------------------------------------------------

/** Validates a batch of payout IDs to process */
export const payoutProcessSchema = z.object({
  payoutIds: z
    .array(uuidSchema)
    .min(1, "Selecione pelo menos um pagamento para processar"),
});

export type PayoutProcessInput = z.infer<typeof payoutProcessSchema>;

// ---------------------------------------------------------------------------
// 13. payoutMethodSchema — Set creator's payout method
// ---------------------------------------------------------------------------

/** Validates the creator's payout method configuration (cross-field: pix requires pixKey) */
export const payoutMethodSchema = z
  .object({
    paymentMethod: paymentMethodEnum,
    pixKey: z
      .string()
      .max(255, "Chave PIX deve ter no maximo 255 caracteres")
      .optional(),
    storeCreditAmount: z
      .string()
      .regex(monetaryRegex, "Valor de credito invalido")
      .optional(),
    productItems: z
      .array(
        z.object({
          productId: uuidSchema,
          quantity: z
            .number()
            .int("Quantidade deve ser um numero inteiro")
            .positive("Quantidade deve ser positiva"),
        }),
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === "pix") {
        return !!data.pixKey && data.pixKey.length > 0;
      }
      return true;
    },
    {
      message: "Chave PIX e obrigatoria para pagamento via PIX",
      path: ["pixKey"],
    },
  );

export type PayoutMethodInput = z.infer<typeof payoutMethodSchema>;

// ---------------------------------------------------------------------------
// 14. campaignCrudSchema — Create/edit campaign
// ---------------------------------------------------------------------------

/** Validates campaign creation/update */
export const campaignCrudSchema = z.object({
  name: z
    .string()
    .min(1, "Nome da campanha e obrigatorio")
    .max(255, "Nome deve ter no maximo 255 caracteres"),
  campaignType: campaignTypeEnum,
  startDate: z.string().date("Data de inicio invalida (formato ISO)"),
  endDate: z.string().date("Data de fim invalida (formato ISO)").optional(),
  costProduct: z
    .string()
    .regex(monetaryRegex, "Custo de produto invalido")
    .optional()
    .default("0.00"),
  costShipping: z
    .string()
    .regex(monetaryRegex, "Custo de frete invalido")
    .optional(),
  costCreator: z
    .string()
    .regex(monetaryRegex, "Custo do creator invalido")
    .optional(),
  costOther: z
    .string()
    .regex(monetaryRegex, "Custo adicional invalido")
    .optional(),
});

export type CampaignCrudInput = z.infer<typeof campaignCrudSchema>;

// ---------------------------------------------------------------------------
// 15. campaignBriefSchema — Campaign brief
// ---------------------------------------------------------------------------

const briefExampleSchema = z.object({
  type: z.string(),
  url: z.string().url("URL do exemplo invalida"),
  caption: z.string().optional(),
});

/** Validates a campaign brief (markdown content, hashtags, examples, target tiers) */
export const campaignBriefSchema = z.object({
  campaignId: uuidSchema,
  title: z
    .string()
    .min(1, "Titulo do briefing e obrigatorio")
    .max(255, "Titulo deve ter no maximo 255 caracteres"),
  contentMd: z
    .string()
    .min(10, "Conteudo deve ter pelo menos 10 caracteres")
    .max(50000, "Conteudo deve ter no maximo 50000 caracteres"),
  hashtags: z
    .array(z.string())
    .max(20, "Maximo de 20 hashtags")
    .optional(),
  deadline: z.string().datetime("Prazo invalido").optional(),
  examplesJson: z.array(briefExampleSchema).optional(),
  targetTiers: z
    .array(z.string())
    .max(10, "Maximo de 10 tiers")
    .optional(),
});

export type CampaignBriefInput = z.infer<typeof campaignBriefSchema>;

// ---------------------------------------------------------------------------
// 16. giftingConfigSchema — Configure monthly gifting
// ---------------------------------------------------------------------------

/** Validates monthly gifting configuration */
export const giftingConfigSchema = z.object({
  monthlyBudget: z
    .string()
    .regex(monetaryRegex, "Orcamento mensal invalido (use formato 0.00)"),
  productPool: z
    .array(uuidSchema)
    .min(1, "Selecione pelo menos um produto"),
  topN: z
    .number()
    .int("Quantidade deve ser um numero inteiro")
    .min(1, "Minimo de 1 creator")
    .max(100, "Maximo de 100 creators"),
});

export type GiftingConfigInput = z.infer<typeof giftingConfigSchema>;

// ---------------------------------------------------------------------------
// 17. giftingApproveSchema — Approve gifting suggestions
// ---------------------------------------------------------------------------

/** Validates approval of gifting suggestions */
export const giftingApproveSchema = z.object({
  giftingIds: z
    .array(uuidSchema)
    .min(1, "Selecione pelo menos um envio para aprovar"),
});

export type GiftingApproveInput = z.infer<typeof giftingApproveSchema>;

// ---------------------------------------------------------------------------
// 18. taxProfileSchema — Creator fiscal data
// ---------------------------------------------------------------------------

/** Validates creator tax profile (fiscal compliance: IRRF, ISS, MEI/PJ) */
export const taxProfileSchema = z
  .object({
    taxpayerType: taxpayerTypeEnum,
    cpf: cpfSchema,
    cnpj: z
      .string()
      .regex(/^\d{14}$/, "CNPJ deve conter 14 digitos")
      .optional(),
    municipalityCode: z
      .string()
      .max(10, "Codigo IBGE deve ter no maximo 10 caracteres")
      .optional(),
    issRate: z
      .string()
      .regex(monetaryRegex, "Taxa ISS invalida (use formato 0.00)")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.taxpayerType === "pj" || data.taxpayerType === "mei") {
        return !!data.cnpj;
      }
      return true;
    },
    {
      message: "CNPJ e obrigatorio para MEI ou PJ",
      path: ["cnpj"],
    },
  );

export type TaxProfileInput = z.infer<typeof taxProfileSchema>;

// ---------------------------------------------------------------------------
// 19. pointsAdjustmentSchema — Manual points adjustment
// ---------------------------------------------------------------------------

/** Validates manual points adjustment by admin */
export const pointsAdjustmentSchema = z.object({
  points: z
    .number()
    .int("Pontos devem ser um numero inteiro")
    .refine((val) => val !== 0, "Pontos devem ser diferentes de zero"),
  reason: z
    .string()
    .min(10, "Descreva o motivo (minimo 10 caracteres)")
    .max(500, "Motivo deve ter no maximo 500 caracteres"),
});

export type PointsAdjustmentInput = z.infer<typeof pointsAdjustmentSchema>;

// ---------------------------------------------------------------------------
// 20. antiFraudResolveSchema — Resolve fraud flag
// ---------------------------------------------------------------------------

/** Validates fraud flag resolution (suspend or clear) */
export const antiFraudResolveSchema = z.object({
  action: z.enum(["suspend", "clear"]),
  reason: z
    .string()
    .min(10, "Descreva o motivo (minimo 10 caracteres)")
    .max(500, "Motivo deve ter no maximo 500 caracteres"),
});

export type AntiFraudResolveInput = z.infer<typeof antiFraudResolveSchema>;

// ---------------------------------------------------------------------------
// 21. couponCrudSchema — Create/edit coupon
// ---------------------------------------------------------------------------

/** Validates coupon creation/update (cross-field: percent requires discountPercent, fixed requires discountAmount) */
export const couponCrudSchema = z
  .object({
    code: z
      .string()
      .min(3, "Codigo deve ter pelo menos 3 caracteres")
      .max(20, "Codigo deve ter no maximo 20 caracteres")
      .transform((val) => val.toUpperCase())
      .pipe(
        z
          .string()
          .regex(
            /^[A-Z0-9]+$/,
            "Codigo deve conter apenas letras e numeros",
          ),
      ),
    discountPercent: z
      .number()
      .min(1, "Desconto deve ser entre 1% e 100%")
      .max(100, "Desconto deve ser entre 1% e 100%")
      .optional(),
    discountAmount: z
      .string()
      .regex(monetaryRegex, "Valor de desconto invalido (use formato 0.00)")
      .optional(),
    discountType: discountTypeEnum,
  })
  .refine(
    (data) => {
      if (data.discountType === "percent") {
        return data.discountPercent !== undefined;
      }
      return true;
    },
    {
      message: "Percentual de desconto e obrigatorio para tipo percentual",
      path: ["discountPercent"],
    },
  )
  .refine(
    (data) => {
      if (data.discountType === "fixed") {
        return data.discountAmount !== undefined;
      }
      return true;
    },
    {
      message: "Valor de desconto e obrigatorio para tipo fixo",
      path: ["discountAmount"],
    },
  );

export type CouponCrudInput = z.infer<typeof couponCrudSchema>;

// ---------------------------------------------------------------------------
// 22. utmLinkSchema — Generate UTM link
// ---------------------------------------------------------------------------

/** Validates UTM link generation parameters */
export const utmLinkSchema = z.object({
  platform: z.enum(["instagram", "tiktok", "youtube", "whatsapp", "other"]),
  campaignName: z
    .string()
    .max(255, "Nome da campanha deve ter no maximo 255 caracteres")
    .optional(),
});

export type UtmLinkInput = z.infer<typeof utmLinkSchema>;

// ---------------------------------------------------------------------------
// 23. creatorFiltersSchema — Admin creator list filters (comprehensive)
// ---------------------------------------------------------------------------

/** Validates admin creator list filters (extends pagination with status, tier, managed, search, sortBy) */
export const creatorFiltersSchema = paginationSchema.extend({
  status: creatorStatusEnum.optional(),
  tierId: uuidSchema.optional(),
  managed: z.boolean().optional(),
  search: z
    .string()
    .max(255, "Busca deve ter no maximo 255 caracteres")
    .optional(),
  sortBy: z
    .enum(["name", "created_at", "total_sales", "total_points", "tier"])
    .optional(),
});

export type CreatorFiltersInput = z.infer<typeof creatorFiltersSchema>;

// ---------------------------------------------------------------------------
// 24. referralSchema — Track referral
// ---------------------------------------------------------------------------

/** Validates a referral code for tracking */
export const referralSchema = z.object({
  referralCode: z
    .string()
    .min(1, "Codigo de indicacao e obrigatorio")
    .max(50, "Codigo de indicacao deve ter no maximo 50 caracteres"),
});

export type ReferralInput = z.infer<typeof referralSchema>;
