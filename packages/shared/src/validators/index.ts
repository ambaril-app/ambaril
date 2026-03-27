import { z } from "zod";

// Reusable field validators
export const emailSchema = z.string().email("Email invalido").max(255);
export const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no minimo 8 caracteres")
  .max(128);
export const cpfSchema = z
  .string()
  .regex(/^\d{11}$/, "CPF deve conter 11 digitos");
export const uuidSchema = z.string().uuid("ID invalido");

// Login
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  remember: z.boolean().optional().default(false),
});

// Pagination query params
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(25),
  sort_by: z.string().optional(),
  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Search/filter base
export const searchSchema = z.object({
  q: z.string().max(255).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

// ---------------------------------------------------------------------------
// Address (reused by orders, creators, etc.)
// ---------------------------------------------------------------------------
export const addressSchema = z.object({
  street: z.string().min(1, "Rua é obrigatória").max(255),
  number: z.string().min(1, "Número é obrigatório").max(20),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório").max(100),
  city: z.string().min(1, "Cidade é obrigatória").max(100),
  state: z.string().length(2, "UF deve ter 2 caracteres"),
  zipCode: z.string().regex(/^\d{8}$/, "CEP deve ter 8 dígitos"),
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

// Create order
export const createOrderSchema = z.object({
  contactId: uuidSchema,
  items: z
    .array(
      z.object({
        skuId: uuidSchema,
        quantity: z.number().int().positive("Quantidade deve ser maior que zero"),
        unitPrice: z.string().regex(/^\d+\.\d{2}$/, "Preço inválido"),
      }),
    )
    .min(1, "Pedido deve ter pelo menos um item"),
  paymentMethod: z.enum(["credit_card", "pix", "bank_slip"]),
  installments: z.number().int().min(1).max(12).default(1),
  shippingAddress: addressSchema,
  billingCpf: cpfSchema,
  couponId: uuidSchema.optional(),
  utmSource: z.string().max(255).optional(),
  utmMedium: z.string().max(255).optional(),
  utmCampaign: z.string().max(255).optional(),
  utmContent: z.string().max(255).optional(),
});

// Update order status
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "paid",
    "separating",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
  ]),
  trackingCode: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

// Order filters
export const orderFiltersSchema = paginationSchema.extend({
  status: z
    .enum([
      "pending",
      "paid",
      "separating",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ])
    .optional(),
  paymentMethod: z.enum(["credit_card", "pix", "bank_slip"]).optional(),
  contactId: uuidSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// ---------------------------------------------------------------------------
// Contacts (CRM)
// ---------------------------------------------------------------------------

export const createContactSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(255),
  email: emailSchema.optional(),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos")
    .optional(),
  cpf: cpfSchema.optional(),
  source: z
    .enum(["checkout", "crm_import", "whatsapp", "manual", "creator_referral"])
    .default("manual"),
  tags: z.array(z.string().max(50)).max(20).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export const updateContactSchema = createContactSchema.partial().extend({
  optOutEmail: z.boolean().optional(),
  optOutWhatsapp: z.boolean().optional(),
  optOutSms: z.boolean().optional(),
});

export const contactFiltersSchema = paginationSchema.extend({
  source: z
    .enum(["checkout", "crm_import", "whatsapp", "manual", "creator_referral"])
    .optional(),
  tag: z.string().max(50).optional(),
  hasEmail: z.boolean().optional(),
  hasPhone: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// ---------------------------------------------------------------------------
// Products & SKUs
// ---------------------------------------------------------------------------

export const createProductSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug deve conter apenas letras minúsculas, números e hífens",
    )
    .max(255),
  description: z.string().max(5000).optional(),
  category: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const createSkuSchema = z.object({
  productId: uuidSchema,
  skuCode: z.string().min(1, "Código SKU é obrigatório").max(50),
  size: z.string().min(1, "Tamanho é obrigatório").max(10),
  color: z.string().min(1, "Cor é obrigatória").max(50),
  costPrice: z.string().regex(/^\d+\.\d{2}$/, "Preço de custo inválido"),
  sellPrice: z.string().regex(/^\d+\.\d{2}$/, "Preço de venda inválido"),
  weight: z.number().positive("Peso deve ser positivo"),
  barcode: z.string().max(50).optional(),
  shopifyVariantId: z.string().max(255).optional(),
  tier: z.enum(["gold", "silver", "bronze"]).optional(),
});

export const productFiltersSchema = paginationSchema.extend({
  category: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  search: z.string().max(255).optional(),
});

// ---------------------------------------------------------------------------
// Creators
// ---------------------------------------------------------------------------

// Creator application (public form — 3-step)
export const creatorApplicationSchema = z.object({
  // Step 1: Personal info
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(255),
  email: emailSchema,
  phone: z.string().regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos"),
  cpf: cpfSchema,
  // Step 2: Social media
  instagramHandle: z.string().min(1, "Instagram é obrigatório").max(100),
  tiktokHandle: z.string().max(100).optional(),
  youtubeHandle: z.string().max(100).optional(),
  followersCount: z.number().int().nonnegative(),
  // Step 3: Motivation
  motivation: z
    .string()
    .min(20, "Conte mais sobre sua motivação (mínimo 20 caracteres)")
    .max(2000),
  contentStyle: z.string().max(500).optional(),
  shippingAddress: addressSchema,
});

export const updateCreatorSchema = z.object({
  tierId: uuidSchema.optional(), // FK to creators.creator_tiers — configurable per tenant
  status: z.enum(["pending", "active", "suspended", "inactive"]).optional(),
  notes: z.string().max(2000).optional(),
  commissionRate: z
    .string()
    .regex(/^\d+\.\d{2}$/, "Taxa de comissão inválida")
    .optional(),
});

export const creatorFiltersSchema = paginationSchema.extend({
  tierId: uuidSchema.optional(), // FK to creators.creator_tiers
  status: z.enum(["pending", "active", "suspended", "inactive"]).optional(),
  search: z.string().max(255).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type AddressInput = z.infer<typeof addressSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderFiltersInput = z.infer<typeof orderFiltersSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactFiltersInput = z.infer<typeof contactFiltersSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateSkuInput = z.infer<typeof createSkuSchema>;
export type ProductFiltersInput = z.infer<typeof productFiltersSchema>;
export type CreatorApplicationInput = z.infer<typeof creatorApplicationSchema>;
export type UpdateCreatorInput = z.infer<typeof updateCreatorSchema>;
export type CreatorFiltersInput = z.infer<typeof creatorFiltersSchema>;
