import { z } from "zod";

// ---------------------------------------------------------------------------
// Setup Wizard — Step validation schemas
// ---------------------------------------------------------------------------

// Step 1: Integration check (no input needed, just read)

// Step 2: Tiers (reuses existing tier schemas from creators.ts)

// ---------------------------------------------------------------------------
// Step 3: Import coupons selection
// ---------------------------------------------------------------------------

/** Validates the selected coupon codes for import */
export const importCouponsSelectionSchema = z.object({
  selectedCoupons: z.array(
    z.string().min(1, "Codigo do cupom invalido"),
  ),
});

export type ImportCouponsSelection = z.infer<typeof importCouponsSelectionSchema>;

// ---------------------------------------------------------------------------
// Step 4: Link coupons to creators
// ---------------------------------------------------------------------------

/** Validates the mapping of coupons to creator profiles */
export const couponCreatorLinkSchema = z.object({
  links: z.array(
    z.object({
      couponCode: z.string().min(1, "Codigo do cupom e obrigatorio"),
      creatorName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      creatorEmail: z.string().email("Email invalido"),
      tierId: z.string().uuid("Tier ID invalido").optional(),
    }),
  ),
});

export type CouponCreatorLink = z.infer<typeof couponCreatorLinkSchema>;

// ---------------------------------------------------------------------------
// Step 5: Account options
// ---------------------------------------------------------------------------

/** Validates the onboarding mode and welcome email preferences */
export const accountOptionsSchema = z.object({
  onboardingMode: z.enum(["white_glove", "invite_link", "both"]),
  sendWelcomeEmail: z.boolean(),
});

export type AccountOptions = z.infer<typeof accountOptionsSchema>;

// ---------------------------------------------------------------------------
// CSV import schemas
// ---------------------------------------------------------------------------

/** Validates a single row from a CSV import */
export const csvImportRowSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email invalido"),
  couponCode: z.string().min(1, "Codigo do cupom e obrigatorio"),
  instagram: z.string().optional(),
  phone: z.string().optional(),
});

/** Validates the full CSV import payload */
export const csvImportSchema = z.object({
  rows: z.array(csvImportRowSchema).min(1, "Importe pelo menos 1 creator"),
});

export type CsvImportRow = z.infer<typeof csvImportRowSchema>;
export type CsvImport = z.infer<typeof csvImportSchema>;
