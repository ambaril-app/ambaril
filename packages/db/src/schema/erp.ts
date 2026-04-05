import {
  pgSchema,
  pgPolicy,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  smallint,
  numeric,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants, users } from "./global";

// ─── Schema ─────────────────────────────────────────────

export const erpSchema = pgSchema("erp");

// ─── RLS helper ─────────────────────────────────────────
// Every table uses this policy — inline for clarity per Drizzle convention.
const tenantIsolation = {
  as: "permissive" as const,
  for: "all" as const,
  to: "public" as const,
  using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
  withCheck: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`,
};

// ─── Enums ──────────────────────────────────────────────

// Existing (kept unchanged for backward compat)
export const skuTierEnum = erpSchema.enum("sku_tier", [
  "gold",
  "silver",
  "bronze",
  "unranked",
]);
export const movementTypeEnum = erpSchema.enum("movement_type", [
  "sale",
  "return",
  "adjustment",
  "production_entry",
  "purchase",
  "loss",
  "tier_change",
]);
export const nfeTypeEnum = erpSchema.enum("nfe_type", ["sale", "return"]);
export const nfeStatusEnum = erpSchema.enum("nfe_status", [
  "draft",
  "pending",
  "authorized",
  "cancelled",
  "rejected",
  "denied",
]);
export const nfeFinalidadeEnum = erpSchema.enum("nfe_finalidade", [
  "normal", // 1 — NF-e normal
  "complementar", // 2 — NF-e complementar
  "ajuste", // 3 — NF-e de ajuste
  "devolucao", // 4 — Devolução de mercadoria
]);
export const fiscalRuleSeverityEnum = erpSchema.enum("fiscal_rule_severity", [
  "error",
  "warning",
  "info",
]);
export const fiscalRuleCategoryEnum = erpSchema.enum("fiscal_rule_category", [
  "icms",
  "ipi",
  "pis_cofins",
  "cfop",
  "document",
  "general",
]);
export const nfeProviderEnum = erpSchema.enum("nfe_provider", [
  "focus_nfe",
  "plugnotas",
]);
export const transactionTypeEnum = erpSchema.enum("transaction_type", [
  "sale",
  "refund",
  "chargeback",
  "fee",
  "pix_received",
  "bank_slip_received",
]);
export const transactionStatusEnum = erpSchema.enum("transaction_status", [
  "pending",
  "confirmed",
  "failed",
  "reversed",
]);
export const shippingLabelStatusEnum = erpSchema.enum("shipping_label_status", [
  "pending",
  "generated",
  "printed",
  "in_transit",
  "delivered",
  "cancelled",
]);

// New
export const contactTypeEnum = erpSchema.enum("contact_type", [
  "pj", // Pessoa Jurídica
  "pf", // Pessoa Física
  "estrangeiro", // Foreign entity
]);

export const crtEnum = erpSchema.enum("crt", [
  "simples_nacional", // CRT 1
  "simples_excesso", // CRT 2
  "regime_normal", // CRT 3 (Lucro Presumido ou Real)
]);

export const indIeDestEnum = erpSchema.enum("ind_ie_dest", [
  "contribuinte", // 1 — contribuinte do ICMS
  "contribuinte_isento", // 2 — contribuinte isento de IE
  "nao_contribuinte", // 9 — não contribuinte
]);

export const erpOrderStatusEnum = erpSchema.enum("order_status", [
  "draft",
  "confirmed",
  "in_picking",
  "invoiced",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);

export const invoiceDirectionEnum = erpSchema.enum("invoice_direction", [
  "outbound", // saída (venda, remessa, devolução de compra)
  "inbound", // entrada (compra, devolução de venda)
]);

export const fiscalOpTypeEnum = erpSchema.enum("fiscal_op_type", [
  "sale", // venda
  "purchase", // compra
  "return_sale", // devolução de venda
  "return_purchase", // devolução de compra
  "transfer", // transferência entre depósitos
  "remessa", // remessa para conserto, exposição etc.
  "adjustment", // ajuste interno
]);

export const accountTypeEnum = erpSchema.enum("account_type", [
  "cash", // dinheiro
  "checking", // conta corrente
  "savings", // conta poupança
  "digital", // conta digital (Mercado Pago, etc.)
]);

export const financialStatusEnum = erpSchema.enum("financial_status", [
  "open",
  "paid",
  "partial",
  "overdue",
  "cancelled",
]);

export const recurrenceTypeEnum = erpSchema.enum("recurrence_type", [
  "unique", // U — parcela única
  "installment", // P — parcelado
  "weekly", // E — semanal
  "biweekly", // Q — quinzenal
  "monthly", // M — mensal
  "bimonthly", // B — bimestral
  "quarterly", // T — trimestral
  "semiannual", // S — semestral
  "annual", // A — anual
]);

// ─── Tables ─────────────────────────────────────────────
// Order: lookup tables first, then transactional, then fiscal items.

// ──────────────────────────────────────────────────────
// 1. erp.contacts — clients, suppliers, transporters
// ──────────────────────────────────────────────────────
export const erpContacts = erpSchema
  .table(
    "contacts",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      // Identity
      type: contactTypeEnum("type").notNull().default("pj"),
      name: varchar("name", { length: 150 }).notNull(),
      tradeName: varchar("trade_name", { length: 150 }), // fantasia
      code: varchar("code", { length: 60 }), // código interno
      // Documents
      cnpj: varchar("cnpj", { length: 18 }), // XX.XXX.XXX/XXXX-XX
      cpf: varchar("cpf", { length: 14 }), // XXX.XXX.XXX-XX
      rg: varchar("rg", { length: 20 }),
      // Fiscal registration
      ie: varchar("ie", { length: 20 }), // Inscrição Estadual
      ieExempt: boolean("ie_exempt").notNull().default(false), // isento de IE
      im: varchar("im", { length: 20 }), // Inscrição Municipal
      crt: crtEnum("crt"), // Código de Regime Tributário
      indIeDest: indIeDestEnum("ind_ie_dest")
        .notNull()
        .default("nao_contribuinte"),
      suframa: varchar("suframa", { length: 20 }), // SUFRAMA registration (tax incentive AO/AP/AM/RO/RR/AC)
      // Address (primary — shipping / fiscal)
      street: varchar("street", { length: 255 }),
      streetNumber: varchar("street_number", { length: 20 }),
      complement: varchar("complement", { length: 100 }),
      neighborhood: varchar("neighborhood", { length: 100 }),
      city: varchar("city", { length: 100 }),
      cityIbgeCode: varchar("city_ibge_code", { length: 7 }), // Código IBGE município — required for NF-e
      state: varchar("state", { length: 2 }), // UF
      zipCode: varchar("zip_code", { length: 9 }), // CEP
      country: varchar("country", { length: 2 }).notNull().default("BR"),
      // Billing address (separate — cobrança)
      billingAddress: jsonb("billing_address"), // { street, number, complement, neighborhood, city, city_ibge_code, state, zip_code } or null (same as main)
      // Contact info
      email: varchar("email", { length: 255 }),
      emailNfe: varchar("email_nfe", { length: 255 }), // email for NF-e delivery
      phone: varchar("phone", { length: 20 }),
      mobile: varchar("mobile", { length: 20 }),
      // Personal (PF contacts)
      birthDate: date("birth_date"), // P1-12: data de nascimento
      // Commercial
      creditLimit: numeric("credit_limit", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      defaultPaymentCondition: varchar("default_payment_condition", {
        length: 60,
      }), // P1-13: condição de pagamento padrão (e.g., "30/60/90")
      vendorId: uuid("vendor_id"), // FK to users.id — responsible seller
      segmentId: uuid("segment_id"), // FK to crm.segments
      // Relationship flags
      isClient: boolean("is_client").notNull().default(true),
      isSupplier: boolean("is_supplier").notNull().default(false),
      isTransporter: boolean("is_transporter").notNull().default(false),
      // Status
      situation: varchar("situation", { length: 20 })
        .notNull()
        .default("active"), // active | inactive | no_movement
      clientSince: date("client_since"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (t) => [
      index("idx_contacts_tenant").on(t.tenantId),
      index("idx_contacts_cnpj")
        .on(t.tenantId, t.cnpj)
        .where(sql`cnpj IS NOT NULL`),
      index("idx_contacts_cpf")
        .on(t.tenantId, t.cpf)
        .where(sql`cpf IS NOT NULL`),
      index("idx_contacts_name").on(t.tenantId, t.name),
      index("idx_contacts_client")
        .on(t.isClient)
        .where(sql`is_client = TRUE`),
      index("idx_contacts_supplier")
        .on(t.isSupplier)
        .where(sql`is_supplier = TRUE`),
      index("idx_contacts_active")
        .on(t.situation)
        .where(sql`situation = 'active'`),
      index("idx_contacts_not_deleted")
        .on(t.id)
        .where(sql`deleted_at IS NULL`),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 1B. erp.contact_persons — Pessoas de contato (múltiplos por empresa)
// P1-11: A PJ contact may have multiple contact persons (comprador, financeiro, etc.)
// ──────────────────────────────────────────────────────
export const contactPersons = erpSchema
  .table(
    "contact_persons",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      contactId: uuid("contact_id")
        .notNull()
        .references(() => erpContacts.id),
      name: varchar("name", { length: 150 }).notNull(),
      role: varchar("role", { length: 60 }), // "Comprador", "Financeiro", "Responsável NF-e"
      email: varchar("email", { length: 255 }),
      phone: varchar("phone", { length: 20 }),
      mobile: varchar("mobile", { length: 20 }),
      isPrimary: boolean("is_primary").notNull().default(false),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_contact_persons_tenant").on(t.tenantId),
      index("idx_contact_persons_contact").on(t.contactId),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 2. erp.fiscal_operations — Naturezas de Operação + CFOP rules
// Determines CFOP, stock movement, and financial generation per operation type.
// ──────────────────────────────────────────────────────
export const fiscalOperations = erpSchema
  .table(
    "fiscal_operations",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 100 }).notNull(), // e.g., "Venda de Mercadoria"
      type: fiscalOpTypeEnum("type").notNull(),
      // CFOP by destination (same state / other state / international)
      cfopInternal: varchar("cfop_internal", { length: 4 }), // within same UF — e.g., "5102"
      cfopExternal: varchar("cfop_external", { length: 4 }), // other UF — e.g., "6102"
      cfopExport: varchar("cfop_export", { length: 4 }), // export — e.g., "7102"
      // Behavior flags
      generatesInvoice: boolean("generates_invoice").notNull().default(true),
      movesStock: boolean("moves_stock").notNull().default(true),
      generatesFinancial: boolean("generates_financial")
        .notNull()
        .default(true),
      isDefault: boolean("is_default").notNull().default(false),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_fiscal_ops_tenant").on(t.tenantId),
      index("idx_fiscal_ops_type").on(t.type),
      index("idx_fiscal_ops_active")
        .on(t.isActive)
        .where(sql`is_active = TRUE`),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 3. erp.warehouses — Depósitos
// ──────────────────────────────────────────────────────
export const warehouses = erpSchema
  .table(
    "warehouses",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 100 }).notNull(),
      description: text("description"),
      isDefault: boolean("is_default").notNull().default(false),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_warehouses_tenant").on(t.tenantId),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 4. erp.payment_methods — Formas de Pagamento
// fiscal_code maps to NF-e tPag enum: 01=dinheiro, 03=cartão crédito, 04=cartão débito, 15=boleto, 17=pix, 90=sem pagamento, 99=outros
// ──────────────────────────────────────────────────────
export const paymentMethods = erpSchema
  .table(
    "payment_methods",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 100 }).notNull(),
      fiscalCode: varchar("fiscal_code", { length: 2 }).notNull(), // NF-e tPag code
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_payment_methods_tenant").on(t.tenantId),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 5. erp.financial_accounts — Caixas e Bancos
// ──────────────────────────────────────────────────────
export const financialAccounts = erpSchema
  .table(
    "financial_accounts",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 100 }).notNull(),
      type: accountTypeEnum("type").notNull(),
      bankCode: varchar("bank_code", { length: 10 }), // COMPE / ISPB
      agency: varchar("agency", { length: 10 }),
      accountNumber: varchar("account_number", { length: 20 }),
      openingBalance: numeric("opening_balance", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      currentBalance: numeric("current_balance", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      isDefault: boolean("is_default").notNull().default(false),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_fin_accounts_tenant").on(t.tenantId),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 5B. erp.tax_groups — Perfis de tributação por grupo de produtos
// P1-14: Products reference a tax_group for default tax settings.
// The tax group determines default CST/CSOSN, ICMS rate, IPI, PIS/COFINS
// per operation type (sale, purchase, return) and per UF combination.
// ──────────────────────────────────────────────────────
export const taxGroups = erpSchema
  .table(
    "tax_groups",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 100 }).notNull(), // e.g., "Vestuário — Simples Nacional"
      description: text("description"),
      // Default ICMS config (applied when creating NF-e items)
      icmsCst: varchar("icms_cst", { length: 2 }), // default CST for Regime Normal
      icmsCsosn: varchar("icms_csosn", { length: 3 }), // default CSOSN for Simples Nacional
      icmsPaliq: numeric("icms_paliq", { precision: 5, scale: 2 }), // default ICMS rate %
      icmsPredBc: numeric("icms_pred_bc", { precision: 5, scale: 2 }), // default % redução BC
      // Default IPI config
      ipiCst: varchar("ipi_cst", { length: 2 }),
      ipiPaliq: numeric("ipi_paliq", { precision: 5, scale: 2 }),
      // Default PIS/COFINS config
      pisCst: varchar("pis_cst", { length: 2 }),
      pisPaliq: numeric("pis_paliq", { precision: 5, scale: 4 }),
      cofinsCst: varchar("cofins_cst", { length: 2 }),
      cofinsPaliq: numeric("cofins_paliq", { precision: 5, scale: 4 }),
      // Lei 12741 — default % tributos for this group
      percentualTributos: numeric("percentual_tributos", {
        precision: 5,
        scale: 2,
      }),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_tax_groups_tenant").on(t.tenantId),
      index("idx_tax_groups_active")
        .on(t.isActive)
        .where(sql`is_active = TRUE`),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 6. erp.products — Cadastro de Produtos
// Fiscal fields at product level: NCM, CEST, origem, SPED tipo.
// Size/color variants live in erp.skus.
// ──────────────────────────────────────────────────────
export const products = erpSchema
  .table(
    "products",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      // Basic
      name: varchar("name", { length: 255 }).notNull(),
      slug: varchar("slug", { length: 255 }).notNull(),
      description: text("description"),
      category: varchar("category", { length: 100 }).notNull(),
      unitOfMeasure: varchar("unit_of_measure", { length: 6 })
        .notNull()
        .default("UN"), // UN, KG, M, L, etc.
      // Fiscal classification
      ncm: varchar("ncm", { length: 8 }), // Nomenclatura Comum do Mercosul (8 digits)
      cest: varchar("cest", { length: 7 }), // Código Especificador da Substituição Tributária (7 digits)
      origem: smallint("origem").notNull().default(0), // 0=nacional, 1-8=foreign/mixed (tabela A do ICMS)
      spedTipoItem: varchar("sped_tipo_item", { length: 2 }), // PIS/COFINS SPED item type (00-99)
      gtin: varchar("gtin", { length: 14 }), // EAN/barcode at product level
      taxGroupId: uuid("tax_group_id").references(() => taxGroups.id), // P1-14: FK to tax_groups — default tax profile
      percentualTributos: numeric("percentual_tributos", {
        precision: 5,
        scale: 2,
      }), // P1-15: Lei 12741 — % aproximado de tributos (displayed on DANFE)
      // Pricing at product level (variants override in skus)
      priceBase: numeric("price_base", { precision: 12, scale: 2 }),
      priceList: numeric("price_list", { precision: 12, scale: 2 }),
      // Status
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (t) => [
      index("idx_products_tenant").on(t.tenantId),
      uniqueIndex("idx_products_slug")
        .on(t.tenantId, t.slug)
        .where(sql`deleted_at IS NULL`),
      index("idx_products_category").on(t.category),
      index("idx_products_ncm")
        .on(t.ncm)
        .where(sql`ncm IS NOT NULL`),
      index("idx_products_active")
        .on(t.isActive)
        .where(sql`is_active = TRUE`),
      index("idx_products_not_deleted")
        .on(t.id)
        .where(sql`deleted_at IS NULL`),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 7. erp.skus — Stock Keeping Units (size/color variants)
// ──────────────────────────────────────────────────────
export const skus = erpSchema
  .table(
    "skus",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      productId: uuid("product_id")
        .notNull()
        .references(() => products.id),
      skuCode: varchar("sku_code", { length: 50 }).notNull(),
      size: varchar("size", { length: 10 }).notNull(),
      color: varchar("color", { length: 50 }).notNull(),
      price: numeric("price", { precision: 12, scale: 2 }).notNull(),
      priceList: numeric("price_list", { precision: 12, scale: 2 }),
      costPrice: numeric("cost_price", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      weightGrams: integer("weight_grams").notNull().default(0),
      dimensions: jsonb("dimensions"), // { length_cm, width_cm, height_cm }
      barcode: varchar("barcode", { length: 14 }), // GTIN/EAN-13
      gtinPackage: varchar("gtin_package", { length: 14 }), // GTIN da embalagem
      tier: skuTierEnum("tier").notNull().default("unranked"),
      tierUpdatedAt: timestamp("tier_updated_at", { withTimezone: true }),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_skus_tenant").on(t.tenantId),
      uniqueIndex("idx_skus_code").on(t.tenantId, t.skuCode),
      index("idx_skus_product").on(t.productId),
      index("idx_skus_size").on(t.size),
      index("idx_skus_color").on(t.color),
      index("idx_skus_active")
        .on(t.isActive)
        .where(sql`is_active = TRUE`),
      index("idx_skus_tier").on(t.tier),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 8. erp.inventory — one row per SKU × warehouse (current stock state)
// ──────────────────────────────────────────────────────
export const inventory = erpSchema
  .table(
    "inventory",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      skuId: uuid("sku_id")
        .notNull()
        .references(() => skus.id),
      warehouseId: uuid("warehouse_id").references(() => warehouses.id),
      quantityAvailable: integer("quantity_available").notNull().default(0),
      quantityReserved: integer("quantity_reserved").notNull().default(0),
      quantityInProduction: integer("quantity_in_production")
        .notNull()
        .default(0),
      quantityInTransit: integer("quantity_in_transit").notNull().default(0),
      reorderPoint: integer("reorder_point").notNull().default(5),
      depletionVelocity: numeric("depletion_velocity", {
        precision: 8,
        scale: 2,
      })
        .notNull()
        .default("0"),
      lastEntryAt: timestamp("last_entry_at", { withTimezone: true }),
      lastExitAt: timestamp("last_exit_at", { withTimezone: true }),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_inventory_tenant").on(t.tenantId),
      uniqueIndex("idx_inventory_sku_warehouse").on(
        t.tenantId,
        t.skuId,
        t.warehouseId,
      ),
      index("idx_inventory_low_stock")
        .on(t.quantityAvailable)
        .where(sql`quantity_available <= 10`),
      index("idx_inventory_zero")
        .on(t.skuId)
        .where(sql`quantity_available = 0`),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 9. erp.inventory_movements — append-only movement audit log (immutable)
// ──────────────────────────────────────────────────────
export const inventoryMovements = erpSchema
  .table(
    "inventory_movements",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      skuId: uuid("sku_id")
        .notNull()
        .references(() => skus.id),
      warehouseId: uuid("warehouse_id").references(() => warehouses.id),
      movementType: movementTypeEnum("movement_type").notNull(),
      quantity: integer("quantity").notNull(), // positive = inbound, negative = outbound
      costPrice: numeric("cost_price", { precision: 12, scale: 2 }), // cost at time of movement
      referenceType: varchar("reference_type", { length: 50 }), // 'sales_order' | 'purchase_order' | 'exchange_request' | 'manual' | 'nfe'
      referenceId: uuid("reference_id"),
      notes: text("notes"),
      userId: uuid("user_id")
        .notNull()
        .references(() => users.id),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_inv_movements_tenant").on(t.tenantId),
      index("idx_inv_movements_sku").on(t.skuId),
      index("idx_inv_movements_type").on(t.movementType),
      index("idx_inv_movements_reference").on(t.referenceType, t.referenceId),
      index("idx_inv_movements_created").on(t.createdAt),
      index("idx_inv_movements_user").on(t.userId),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 10. erp.sales_orders — Pedidos de Venda
// Source: Shopify (import) or native. Linked to NF-e and financials.
// ──────────────────────────────────────────────────────
export const salesOrders = erpSchema
  .table(
    "sales_orders",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      number: integer("number"), // sequential per tenant
      externalId: varchar("external_id", { length: 255 }), // Shopify/Yever order ID
      externalSource: varchar("external_source", { length: 50 }), // 'shopify' | 'yever' | 'manual' | 'b2b'
      contactId: uuid("contact_id").references(() => erpContacts.id),
      fiscalOperationId: uuid("fiscal_operation_id").references(
        () => fiscalOperations.id,
      ),
      status: erpOrderStatusEnum("status").notNull().default("draft"),
      date: date("date").notNull(),
      expectedDate: date("expected_date"),
      vendorId: uuid("vendor_id"), // FK to users.id
      // Shipping
      transporterId: uuid("transporter_id").references(() => erpContacts.id),
      trackingCode: varchar("tracking_code", { length: 100 }),
      freightModality: smallint("freight_modality"), // 0=CIF, 1=FOB, 2=terceiros, 3=sem frete, 9=sem ocorrência
      freightValue: numeric("freight_value", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      // Totals
      subtotal: numeric("subtotal", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      discountValue: numeric("discount_value", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      totalProducts: numeric("total_products", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      total: numeric("total", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      // Notes
      notes: text("notes"),
      internalNotes: text("internal_notes"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (t) => [
      index("idx_sales_orders_tenant").on(t.tenantId),
      uniqueIndex("idx_sales_orders_number")
        .on(t.tenantId, t.number)
        .where(sql`number IS NOT NULL`),
      uniqueIndex("idx_sales_orders_external")
        .on(t.tenantId, t.externalId, t.externalSource)
        .where(sql`external_id IS NOT NULL`),
      index("idx_sales_orders_contact").on(t.contactId),
      index("idx_sales_orders_status").on(t.status),
      index("idx_sales_orders_date").on(t.date),
      index("idx_sales_orders_not_deleted")
        .on(t.id)
        .where(sql`deleted_at IS NULL`),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 11. erp.sales_order_items — Itens do Pedido de Venda
// No fiscal fields here — fiscal is calculated at NF-e emission time.
// ──────────────────────────────────────────────────────
export const salesOrderItems = erpSchema
  .table(
    "sales_order_items",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      orderId: uuid("order_id")
        .notNull()
        .references(() => salesOrders.id),
      skuId: uuid("sku_id").references(() => skus.id),
      itemNumber: smallint("item_number").notNull(),
      description: varchar("description", { length: 255 }).notNull(),
      code: varchar("code", { length: 60 }),
      unit: varchar("unit", { length: 6 }).notNull().default("UN"),
      quantity: numeric("quantity", { precision: 10, scale: 4 }).notNull(),
      listPrice: numeric("list_price", { precision: 12, scale: 2 }),
      unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
      discountPct: numeric("discount_pct", { precision: 5, scale: 2 })
        .notNull()
        .default("0"),
      totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
      commissionRate: numeric("commission_rate", { precision: 5, scale: 2 })
        .notNull()
        .default("0"),
      commissionValue: numeric("commission_value", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_so_items_tenant").on(t.tenantId),
      index("idx_so_items_order").on(t.orderId),
      index("idx_so_items_sku").on(t.skuId),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 12. erp.sales_order_payments — Condições de Pagamento do Pedido
// ──────────────────────────────────────────────────────
export const salesOrderPayments = erpSchema
  .table(
    "sales_order_payments",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      orderId: uuid("order_id")
        .notNull()
        .references(() => salesOrders.id),
      installmentNumber: smallint("installment_number").notNull(),
      daysUntilDue: integer("days_until_due").notNull().default(0),
      dueDate: date("due_date"),
      value: numeric("value", { precision: 12, scale: 2 }).notNull(),
      paymentMethodId: uuid("payment_method_id").references(
        () => paymentMethods.id,
      ),
      notes: text("notes"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_so_payments_tenant").on(t.tenantId),
      index("idx_so_payments_order").on(t.orderId),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 13. erp.purchase_orders — Pedidos de Compra
// ──────────────────────────────────────────────────────
export const purchaseOrders = erpSchema
  .table(
    "purchase_orders",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      number: integer("number"),
      supplierId: uuid("supplier_id").references(() => erpContacts.id),
      fiscalOperationId: uuid("fiscal_operation_id").references(
        () => fiscalOperations.id,
      ),
      status: erpOrderStatusEnum("status").notNull().default("draft"),
      date: date("date").notNull(),
      expectedDate: date("expected_date"),
      subtotal: numeric("subtotal", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      totalIpi: numeric("total_ipi", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      totalIcmsSt: numeric("total_icms_st", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      freightValue: numeric("freight_value", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      total: numeric("total", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      notes: text("notes"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (t) => [
      index("idx_po_tenant").on(t.tenantId),
      index("idx_po_supplier").on(t.supplierId),
      index("idx_po_status").on(t.status),
      index("idx_po_not_deleted")
        .on(t.id)
        .where(sql`deleted_at IS NULL`),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 14. erp.purchase_order_items — Itens do Pedido de Compra
// IPI rate stored here (purchase-side visibility before NF entrada).
// ──────────────────────────────────────────────────────
export const purchaseOrderItems = erpSchema
  .table(
    "purchase_order_items",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      orderId: uuid("order_id")
        .notNull()
        .references(() => purchaseOrders.id),
      skuId: uuid("sku_id").references(() => skus.id),
      itemNumber: smallint("item_number").notNull(),
      description: varchar("description", { length: 255 }).notNull(),
      supplierCode: varchar("supplier_code", { length: 60 }),
      unit: varchar("unit", { length: 6 }).notNull().default("UN"),
      quantity: numeric("quantity", { precision: 10, scale: 4 }).notNull(),
      unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
      ipiRate: numeric("ipi_rate", { precision: 5, scale: 2 })
        .notNull()
        .default("0"),
      totalIpi: numeric("total_ipi", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_po_items_tenant").on(t.tenantId),
      index("idx_po_items_order").on(t.orderId),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 15. erp.nfe_documents — NF-e / NF-e de entrada (fiscal header)
// Full fiscal document. Items in erp.nfe_items.
// ──────────────────────────────────────────────────────
export const nfeDocuments = erpSchema
  .table(
    "nfe_documents",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      // References
      salesOrderId: uuid("sales_order_id").references(() => salesOrders.id),
      purchaseOrderId: uuid("purchase_order_id").references(
        () => purchaseOrders.id,
      ),
      contactId: uuid("contact_id").references(() => erpContacts.id), // destinatário / remetente
      fiscalOperationId: uuid("fiscal_operation_id").references(
        () => fiscalOperations.id,
      ),
      // Document identity
      direction: invoiceDirectionEnum("direction")
        .notNull()
        .default("outbound"),
      type: nfeTypeEnum("type").notNull(),
      finalidade: nfeFinalidadeEnum("finalidade").notNull().default("normal"), // P0-1: 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
      model: varchar("model", { length: 2 }).notNull().default("55"), // 55=NF-e, 65=NFC-e
      nfeNumber: integer("nfe_number"), // número da NF-e
      series: varchar("series", { length: 3 }), // série
      nfeKey: varchar("nfe_key", { length: 44 }).unique(), // chave de acesso (nationally unique)
      // P0-2: Referenced document (required for devolution/complementar NF-e)
      referencedNfeKey: varchar("referenced_nfe_key", { length: 44 }), // chaveAcesso da NF-e referenciada
      referencedNfeId: uuid("referenced_nfe_id"), // FK to self (if the original NF-e is in our system)
      // Status
      status: nfeStatusEnum("status").notNull().default("draft"),
      environment: varchar("environment", { length: 1 }).notNull().default("1"), // 1=produção, 2=homologação
      protocolNumber: varchar("protocol_number", { length: 15 }), // nProt da SEFAZ
      cancelReason: varchar("cancel_reason", { length: 255 }),
      // Dates
      issueDate: date("issue_date"),
      exitDate: date("exit_date"),
      // Fiscal operation text (natureza da operação — free text, overrides fiscal_operation.name)
      operationNature: varchar("operation_nature", { length: 60 }),
      // P0-8: Notes / informações complementares (Simples Nacional must include SN text)
      notes: text("notes"), // observações / informações complementares
      internalNotes: text("internal_notes"), // observações internas (not sent to SEFAZ)
      // P0-7: Transport (required by Focus NFe)
      freightModality: smallint("freight_modality"), // 0=CIF, 1=FOB, 2=terceiros, 3=remetente, 4=destinatário, 9=sem frete
      transporterId: uuid("transporter_id").references(() => erpContacts.id),
      vehiclePlate: varchar("vehicle_plate", { length: 8 }), // placa do veículo
      vehicleState: varchar("vehicle_state", { length: 2 }), // UF do veículo
      volumes: jsonb("volumes"), // [{ quantity, species, net_weight, gross_weight, brand, numbering }]
      // P1-9: Marketplace intermediary (required since 2021 for marketplace sales)
      intermediadorCnpj: varchar("intermediador_cnpj", { length: 18 }),
      intermediadorNome: varchar("intermediador_nome", { length: 60 }),
      // Totals (header aggregation for reporting)
      totalProducts: numeric("total_products", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      freightValue: numeric("freight_value", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      insuranceValue: numeric("insurance_value", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      otherExpenses: numeric("other_expenses", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      discountValue: numeric("discount_value", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      totalIcms: numeric("total_icms", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      totalIcmsSt: numeric("total_icms_st", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      totalFcp: numeric("total_fcp", { precision: 12, scale: 2 })
        .notNull()
        .default("0"), // P0-3: FCP total
      totalFcpSt: numeric("total_fcp_st", { precision: 12, scale: 2 })
        .notNull()
        .default("0"), // P0-3: FCP ST total
      totalIpi: numeric("total_ipi", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      totalPis: numeric("total_pis", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      totalCofins: numeric("total_cofins", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      totalNfe: numeric("total_nfe", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      // Storage
      xmlUrl: text("xml_url"),
      pdfUrl: text("pdf_url"),
      apiProvider: nfeProviderEnum("api_provider"),
      apiResponse: jsonb("api_response"),
      emittedAt: timestamp("emitted_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_nfe_tenant").on(t.tenantId),
      index("idx_nfe_sales_order").on(t.salesOrderId),
      index("idx_nfe_contact").on(t.contactId),
      index("idx_nfe_status").on(t.status),
      index("idx_nfe_direction").on(t.direction),
      index("idx_nfe_key")
        .on(t.nfeKey)
        .where(sql`nfe_key IS NOT NULL`),
      index("idx_nfe_issue_date")
        .on(t.issueDate)
        .where(sql`issue_date IS NOT NULL`),
      index("idx_nfe_emitted")
        .on(t.emittedAt)
        .where(sql`emitted_at IS NOT NULL`),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 16. erp.nfe_items — Itens da NF-e com tributação completa
//
// Fiscal layout follows NF-e 4.0 XML schema:
//   ICMS: CST (regime normal) OR CSOSN (Simples Nacional) — fill one per tenant CRT
//   ICMS ST: separate base/rate/value for substituição tributária
//   DIFAL: partilha interestadual (EC 87/2015) — B2C cross-state
//   IPI: applicable for manufacturers and non-Simples (CST 50 series)
//   PIS/COFINS: stored regardless of regime — Simples uses CST 07/08 (not calculated)
// ──────────────────────────────────────────────────────
export const nfeItems = erpSchema
  .table(
    "nfe_items",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      nfeId: uuid("nfe_id")
        .notNull()
        .references(() => nfeDocuments.id),
      skuId: uuid("sku_id").references(() => skus.id),
      // Item identification
      itemNumber: smallint("item_number").notNull(), // sequential within NF-e
      code: varchar("code", { length: 60 }), // cProd
      description: varchar("description", { length: 120 }).notNull(), // xProd
      unit: varchar("unit", { length: 6 }).notNull(), // uCom
      // Fiscal classification (pode diferir do produto — NF pode override)
      ncm: varchar("ncm", { length: 8 }), // NCM do item
      cest: varchar("cest", { length: 7 }), // CEST (ST products)
      cfop: varchar("cfop", { length: 4 }).notNull(), // CFOP per item
      origem: smallint("origem").notNull().default(0), // 0-8 product origin
      gtin: varchar("gtin", { length: 14 }), // cEAN
      gtinPackage: varchar("gtin_package", { length: 14 }), // cEANTrib
      spedTipoItem: varchar("sped_tipo_item", { length: 2 }), // SPED PIS/COFINS type
      // P0-10: Per-item additional info (fiscal observations, e.g., "Permite aproveitamento de crédito de X%")
      additionalInfo: text("additional_info"), // infAdProd — per-item fiscal observations
      // Quantities and prices
      quantity: numeric("quantity", { precision: 10, scale: 4 }).notNull(),
      unitPrice: numeric("unit_price", { precision: 12, scale: 10 }).notNull(), // vUnCom (10 decimals for NF-e compliance)
      totalGross: numeric("total_gross", { precision: 12, scale: 2 }).notNull(), // vProd = qty × price
      freightItem: numeric("freight_item", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      otherExpenses: numeric("other_expenses", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      discountItem: numeric("discount_item", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      totalItem: numeric("total_item", { precision: 12, scale: 2 }).notNull(), // vNF = vProd + tributos - desc

      // ── ICMS ──────────────────────────────────────────
      // Use icms_cst for CRT 3 (Regime Normal), icms_csosn for CRT 1/2 (Simples Nacional)
      icmsCst: varchar("icms_cst", { length: 2 }), // CST: 00,10,20,30,40,41,50,51,60,70,90
      icmsCsosn: varchar("icms_csosn", { length: 3 }), // CSOSN: 101,102,103,201,202,203,300,400,500,900
      icmsModbc: smallint("icms_modbc"), // modalidade BC: 0=mvap,1=pauta,2=preco,3=valor
      icmsPredBc: numeric("icms_pred_bc", { precision: 5, scale: 2 }), // % redução BC
      icmsVbc: numeric("icms_vbc", { precision: 12, scale: 2 }), // valor BC ICMS
      icmsPaliq: numeric("icms_paliq", { precision: 5, scale: 2 }), // alíquota ICMS %
      icmsVicms: numeric("icms_vicms", { precision: 12, scale: 2 }), // valor ICMS
      // ICMS ST (Substituição Tributária)
      icmsModbcst: smallint("icms_modbcst"), // modalidade BC ST: 0=mvap,1=pauta,2=preco,3=dupla,4=margem
      icmsPmvast: numeric("icms_pmvast", { precision: 5, scale: 2 }), // % MVA ST
      icmsPredBcst: numeric("icms_pred_bcst", { precision: 5, scale: 2 }),
      icmsVbcst: numeric("icms_vbcst", { precision: 12, scale: 2 }), // valor BC ST
      icmsPaliqst: numeric("icms_paliqst", { precision: 5, scale: 2 }), // alíquota ST %
      icmsVicmsst: numeric("icms_vicmsst", { precision: 12, scale: 2 }), // valor ICMS ST
      icmsVbcstret: numeric("icms_vbcstret", { precision: 12, scale: 2 }), // BC ST retido ant.
      icmsVicmsstret: numeric("icms_vicmsstret", { precision: 12, scale: 2 }), // ICMS ST retido ant.
      icmsPst: numeric("icms_pst", { precision: 5, scale: 2 }), // alíquota do ICMS efetivo (CST 60)
      icmsVicmsSubstituto: numeric("icms_vicms_substituto", {
        precision: 12,
        scale: 2,
      }), // valor ICMS substituto (CST 60)
      // P0-5: Simples Nacional ICMS credit (CSOSN 101/201 — mandatory for credit-permitting operations)
      icmsPcredSn: numeric("icms_pcred_sn", { precision: 5, scale: 2 }), // % crédito SN permitido
      icmsVcredSn: numeric("icms_vcred_sn", { precision: 12, scale: 2 }), // valor crédito ICMS Simples Nacional
      // P0-3: FCP — Fundo de Combate à Pobreza (mandatory in RJ, MG and interstate B2C)
      fcpPaliq: numeric("fcp_paliq", { precision: 5, scale: 2 }), // alíquota FCP %
      fcpVbc: numeric("fcp_vbc", { precision: 12, scale: 2 }), // base de cálculo FCP
      fcpVfcp: numeric("fcp_vfcp", { precision: 12, scale: 2 }), // valor FCP
      fcpVbcst: numeric("fcp_vbcst", { precision: 12, scale: 2 }), // BC FCP retido por ST
      fcpPaliqst: numeric("fcp_paliqst", { precision: 5, scale: 2 }), // alíquota FCP ST %
      fcpVfcpst: numeric("fcp_vfcpst", { precision: 12, scale: 2 }), // valor FCP retido por ST
      // ICMS Desoneração
      icmsVbcDesop: numeric("icms_vbc_desop", { precision: 12, scale: 2 }),
      icmsVicmsDeson: numeric("icms_vicms_deson", { precision: 12, scale: 2 }),
      icmsMotDesDeson: varchar("icms_mot_des_icms", { length: 2 }), // 3=uso/consumo,6=outros,7=SUFRAMA,...
      // DIFAL — Diferencial de Alíquotas (EC 87/2015, B2C interstate)
      difalVbc: numeric("difal_vbc", { precision: 12, scale: 2 }),
      difalPaliqDest: numeric("difal_paliq_dest", { precision: 5, scale: 2 }), // alíquota interna UF destino
      difalPaliqInter: numeric("difal_paliq_inter", { precision: 5, scale: 2 }), // alíquota interestadual
      difalVicmsDest: numeric("difal_vicms_dest", { precision: 12, scale: 2 }), // ICMS p/ UF destino
      difalVicmsRemet: numeric("difal_vicms_remet", {
        precision: 12,
        scale: 2,
      }), // ICMS p/ UF remetente
      difalPfcpDest: numeric("difal_pfcp_dest", { precision: 5, scale: 2 }), // P0-3: % FCP UF destino
      difalVfcpDest: numeric("difal_vfcp_dest", { precision: 12, scale: 2 }), // P0-3: valor FCP UF destino

      // ── IPI ───────────────────────────────────────────
      // Applies mainly to CRT 3 manufacturers. Simples N. leaves these null.
      ipiCst: varchar("ipi_cst", { length: 2 }), // 00,01,02,03,04,05,49,50,51,52,53,54,55,99
      ipiCenq: varchar("ipi_cenq", { length: 3 }).notNull().default("999"), // P0-4: código de enquadramento legal IPI (obrigatório SEFAZ, Simples usa "999")
      ipiClassEnquad: varchar("ipi_class_enquad", { length: 5 }), // classe de enquadramento
      ipiExTipi: varchar("ipi_ex_tipi", { length: 3 }), // exceção TIPI
      ipiVbc: numeric("ipi_vbc", { precision: 12, scale: 2 }),
      ipiPaliq: numeric("ipi_paliq", { precision: 5, scale: 2 }),
      ipiVipi: numeric("ipi_vipi", { precision: 12, scale: 2 }),
      ipiVunid: numeric("ipi_vunid", { precision: 12, scale: 4 }), // valor fixo por unidade

      // ── PIS ───────────────────────────────────────────
      pisCst: varchar("pis_cst", { length: 2 }), // 01,02,03,04,05,06,07,08,09,49,50,51,...99
      pisVbc: numeric("pis_vbc", { precision: 12, scale: 2 }),
      pisPaliq: numeric("pis_paliq", { precision: 5, scale: 4 }), // 4 decimals (e.g., 0.0065)
      pisVpis: numeric("pis_vpis", { precision: 12, scale: 2 }),
      // PIS ST
      pisVbcst: numeric("pis_vbcst", { precision: 12, scale: 2 }),
      pisPaliqst: numeric("pis_paliqst", { precision: 5, scale: 4 }),
      pisVpist: numeric("pis_vpist", { precision: 12, scale: 2 }),

      // ── COFINS ────────────────────────────────────────
      cofinsCst: varchar("cofins_cst", { length: 2 }),
      cofinsVbc: numeric("cofins_vbc", { precision: 12, scale: 2 }),
      cofinsPaliq: numeric("cofins_paliq", { precision: 5, scale: 4 }),
      cofinsVcofins: numeric("cofins_vcofins", { precision: 12, scale: 2 }),
      // COFINS ST
      cofinsVbcst: numeric("cofins_vbcst", { precision: 12, scale: 2 }),
      cofinsPaliqst: numeric("cofins_paliqst", { precision: 5, scale: 4 }),
      cofinsVcofinsst: numeric("cofins_vcofinsst", { precision: 12, scale: 2 }),

      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_nfe_items_tenant").on(t.tenantId),
      index("idx_nfe_items_nfe").on(t.nfeId),
      index("idx_nfe_items_sku").on(t.skuId),
      index("idx_nfe_items_ncm")
        .on(t.ncm)
        .where(sql`ncm IS NOT NULL`),
      index("idx_nfe_items_cfop").on(t.cfop),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 17. erp.nfe_payments — Parcelas de pagamento da NF-e
// P0-6: NF-e requires sum of payments = totalNfe. Supports multi-payment.
// ──────────────────────────────────────────────────────
export const nfePayments = erpSchema
  .table(
    "nfe_payments",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      nfeId: uuid("nfe_id")
        .notNull()
        .references(() => nfeDocuments.id),
      installmentNumber: smallint("installment_number").notNull(),
      dueDate: date("due_date"),
      value: numeric("value", { precision: 12, scale: 2 }).notNull(),
      paymentMethodId: uuid("payment_method_id").references(
        () => paymentMethods.id,
      ),
      fiscalCode: varchar("fiscal_code", { length: 2 }), // tPag: 01=dinheiro, 03=CC, 04=CD, 15=boleto, 17=PIX
      notes: text("notes"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_nfe_payments_tenant").on(t.tenantId),
      index("idx_nfe_payments_nfe").on(t.nfeId),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 18. erp.financial_categories — Categorias financeiras (DRE, centros de custo)
// P1-11: Used by receivables/payables for classification.
// ──────────────────────────────────────────────────────
export const financialCategories = erpSchema
  .table(
    "financial_categories",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      name: varchar("name", { length: 100 }).notNull(),
      parentId: uuid("parent_id"), // self-referencing for tree (Receitas > Vendas > Atacado)
      type: varchar("type", { length: 10 }).notNull(), // 'revenue' | 'expense' | 'transfer'
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_fin_cat_tenant").on(t.tenantId),
      index("idx_fin_cat_parent").on(t.parentId),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 19. erp.fiscal_rules — Regras fiscais como dados (não código)
// JSONB conditions/assertions pattern — shared evaluator in @ambaril/shared.
// Platform defaults use system tenant; tenant overrides with higher priority.
// Updated when SEFAZ publishes Notas Técnicas (2-4x/year) — INSERT, no deploy.
// ──────────────────────────────────────────────────────
export const fiscalRules = erpSchema
  .table(
    "fiscal_rules",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id), // system tenant for platform defaults
      code: varchar("code", { length: 60 }).notNull(), // human-readable: "CRT1_CSOSN201_ICMSST_REQ"
      description: text("description"), // PT-BR description for admin UI
      category: fiscalRuleCategoryEnum("category").notNull(), // icms, ipi, pis_cofins, cfop, document, general
      severity: fiscalRuleSeverityEnum("severity").notNull(), // error (blocks), warning, info
      conditions: jsonb("conditions").notNull(), // { "emitter.crt": {"eq": "simples_nacional"}, ... }
      assertions: jsonb("assertions").notNull(), // { "item.icms_vbcst": {"required": true}, ... }
      fixHint: text("fix_hint"), // user-facing fix message
      ntReference: varchar("nt_reference", { length: 30 }), // SEFAZ Nota Técnica ref: "NT2023.001"
      validFrom: date("valid_from"), // null = always active
      validUntil: date("valid_until"), // null = never expires
      priority: smallint("priority").notNull().default(0), // higher = evaluated first (tenant overrides > platform)
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_fiscal_rules_tenant").on(t.tenantId),
      uniqueIndex("idx_fiscal_rules_code").on(t.tenantId, t.code),
      index("idx_fiscal_rules_active")
        .on(t.tenantId, t.category, t.isActive)
        .where(sql`is_active = TRUE`),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 20. erp.receivables — Contas a Receber
// ──────────────────────────────────────────────────────
export const receivables = erpSchema
  .table(
    "receivables",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      contactId: uuid("contact_id").references(() => erpContacts.id),
      salesOrderId: uuid("sales_order_id").references(() => salesOrders.id),
      nfeId: uuid("nfe_id").references(() => nfeDocuments.id),
      accountId: uuid("account_id").references(() => financialAccounts.id), // portador
      paymentMethodId: uuid("payment_method_id").references(
        () => paymentMethods.id,
      ),
      categoryId: uuid("category_id").references(() => financialCategories.id), // P1-11: financial category (DRE)
      documentNumber: varchar("document_number", { length: 60 }),
      // Dates
      issueDate: date("issue_date").notNull(),
      originalDueDate: date("original_due_date").notNull(),
      dueDate: date("due_date").notNull(),
      paidDate: date("paid_date"),
      competenceDate: date("competence_date"),
      // Values
      value: numeric("value", { precision: 12, scale: 2 }).notNull(),
      paidValue: numeric("paid_value", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      discount: numeric("discount", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      fine: numeric("fine", { precision: 12, scale: 2 }).notNull().default("0"),
      interest: numeric("interest", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      // Status
      status: financialStatusEnum("status").notNull().default("open"),
      // Recurrence
      recurrenceType: recurrenceTypeEnum("recurrence_type")
        .notNull()
        .default("unique"),
      recurrenceConfig: jsonb("recurrence_config"), // { parcelas, dia_vencimento, etc. }
      installmentNumber: smallint("installment_number"), // e.g., 1 of 3
      installmentTotal: smallint("installment_total"),
      // Boleto
      barcodeDigitableLine: text("barcode_digitable_line"), // linha digitável
      vendorId: uuid("vendor_id"), // FK to users.id
      notes: text("notes"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (t) => [
      index("idx_recv_tenant").on(t.tenantId),
      index("idx_recv_contact").on(t.contactId),
      index("idx_recv_order").on(t.salesOrderId),
      index("idx_recv_status").on(t.status),
      index("idx_recv_due_date").on(t.dueDate),
      index("idx_recv_overdue")
        .on(t.dueDate, t.status)
        .where(sql`status = 'open'`),
      index("idx_recv_not_deleted")
        .on(t.id)
        .where(sql`deleted_at IS NULL`),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 18. erp.payables — Contas a Pagar
// Same structure as receivables, plus tax payment fields (DARF/FGTS/DAS).
// ──────────────────────────────────────────────────────
export const payables = erpSchema
  .table(
    "payables",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      contactId: uuid("contact_id").references(() => erpContacts.id),
      purchaseOrderId: uuid("purchase_order_id").references(
        () => purchaseOrders.id,
      ),
      accountId: uuid("account_id").references(() => financialAccounts.id),
      paymentMethodId: uuid("payment_method_id").references(
        () => paymentMethods.id,
      ),
      categoryId: uuid("category_id").references(() => financialCategories.id), // P1-11: financial category (DRE)
      documentNumber: varchar("document_number", { length: 60 }),
      // Dates
      issueDate: date("issue_date").notNull(),
      originalDueDate: date("original_due_date").notNull(),
      dueDate: date("due_date").notNull(),
      paidDate: date("paid_date"),
      competenceDate: date("competence_date"),
      // Values
      value: numeric("value", { precision: 12, scale: 2 }).notNull(),
      paidValue: numeric("paid_value", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      discount: numeric("discount", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      fine: numeric("fine", { precision: 12, scale: 2 }).notNull().default("0"),
      interest: numeric("interest", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      // Status
      status: financialStatusEnum("status").notNull().default("open"),
      // Recurrence (same as receivables)
      recurrenceType: recurrenceTypeEnum("recurrence_type")
        .notNull()
        .default("unique"),
      recurrenceConfig: jsonb("recurrence_config"),
      installmentNumber: smallint("installment_number"),
      installmentTotal: smallint("installment_total"),
      // Tax payments (DARF, DAS Simples, FGTS, INSS)
      federalTaxCode: varchar("federal_tax_code", { length: 20 }), // código de recolhimento (DARF/FGTS)
      accrualPeriod: varchar("accrual_period", { length: 7 }), // competência "MM/YYYY"
      notes: text("notes"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (t) => [
      index("idx_pay_tenant").on(t.tenantId),
      index("idx_pay_contact").on(t.contactId),
      index("idx_pay_po").on(t.purchaseOrderId),
      index("idx_pay_status").on(t.status),
      index("idx_pay_due_date").on(t.dueDate),
      index("idx_pay_overdue")
        .on(t.dueDate, t.status)
        .where(sql`status = 'open'`),
      index("idx_pay_not_deleted")
        .on(t.id)
        .where(sql`deleted_at IS NULL`),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 19. erp.financial_transactions — Payment gateway reconciliation (Mercado Pago)
// ──────────────────────────────────────────────────────
export const financialTransactions = erpSchema
  .table(
    "financial_transactions",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      orderId: uuid("order_id"), // FK to checkout.orders — cross-schema, nullable for fees
      salesOrderId: uuid("sales_order_id").references(() => salesOrders.id),
      type: transactionTypeEnum("type").notNull(),
      status: transactionStatusEnum("status").notNull().default("pending"),
      grossAmount: numeric("gross_amount", {
        precision: 12,
        scale: 2,
      }).notNull(),
      feeAmount: numeric("fee_amount", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
      paymentMethod: varchar("payment_method", { length: 50 }),
      externalId: varchar("external_id", { length: 255 }), // Mercado Pago transaction ID
      externalStatus: varchar("external_status", { length: 100 }),
      metadata: jsonb("metadata"),
      reconciled: boolean("reconciled").notNull().default(false),
      reconciledAt: timestamp("reconciled_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_fin_tx_tenant").on(t.tenantId),
      index("idx_fin_tx_order").on(t.orderId),
      index("idx_fin_tx_sales_order").on(t.salesOrderId),
      index("idx_fin_tx_type").on(t.type),
      index("idx_fin_tx_status").on(t.status),
      index("idx_fin_tx_external").on(t.externalId),
      index("idx_fin_tx_reconciled")
        .on(t.reconciled)
        .where(sql`reconciled = FALSE`),
      index("idx_fin_tx_created").on(t.createdAt),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 20. erp.margin_calculations — per-SKU margin analysis (unchanged)
// ──────────────────────────────────────────────────────
export const marginCalculations = erpSchema
  .table(
    "margin_calculations",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      skuId: uuid("sku_id")
        .notNull()
        .references(() => skus.id),
      sellingPrice: numeric("selling_price", {
        precision: 12,
        scale: 2,
      }).notNull(),
      productionCost: numeric("production_cost", {
        precision: 12,
        scale: 2,
      }).notNull(),
      avgShippingCost: numeric("avg_shipping_cost", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      gatewayFeeRate: numeric("gateway_fee_rate", { precision: 5, scale: 4 })
        .notNull()
        .default("0.0600"),
      gatewayFeeAmount: numeric("gateway_fee_amount", {
        precision: 12,
        scale: 2,
      }).notNull(),
      taxIcmsRate: numeric("tax_icms_rate", { precision: 5, scale: 4 })
        .notNull()
        .default("0"),
      taxPisRate: numeric("tax_pis_rate", { precision: 5, scale: 4 })
        .notNull()
        .default("0"),
      taxCofinsRate: numeric("tax_cofins_rate", { precision: 5, scale: 4 })
        .notNull()
        .default("0"),
      taxTotalAmount: numeric("tax_total_amount", {
        precision: 12,
        scale: 2,
      }).notNull(),
      grossMargin: numeric("gross_margin", {
        precision: 12,
        scale: 2,
      }).notNull(),
      grossMarginPct: numeric("gross_margin_pct", {
        precision: 5,
        scale: 2,
      }).notNull(),
      netMargin: numeric("net_margin", { precision: 12, scale: 2 }).notNull(),
      netMarginPct: numeric("net_margin_pct", {
        precision: 5,
        scale: 2,
      }).notNull(),
      isSimulation: boolean("is_simulation").notNull().default(false),
      calculatedAt: timestamp("calculated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_margin_tenant").on(t.tenantId),
      index("idx_margin_sku").on(t.skuId),
      index("idx_margin_simulation").on(t.isSimulation),
      index("idx_margin_net")
        .on(t.netMarginPct)
        .where(sql`is_simulation = FALSE`),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 21. erp.shipping_labels — Logistics label generation (unchanged)
// ──────────────────────────────────────────────────────
export const shippingLabels = erpSchema
  .table(
    "shipping_labels",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      orderId: uuid("order_id"), // FK to checkout.orders — cross-schema
      salesOrderId: uuid("sales_order_id").references(() => salesOrders.id),
      carrier: varchar("carrier", { length: 100 }).notNull(),
      trackingCode: varchar("tracking_code", { length: 100 }),
      status: shippingLabelStatusEnum("status").notNull().default("pending"),
      labelUrl: text("label_url"),
      cost: numeric("cost", { precision: 12, scale: 2 }).notNull().default("0"),
      estimatedDeliveryDays: integer("estimated_delivery_days"),
      melhorEnvioId: varchar("melhor_envio_id", { length: 255 }),
      apiResponse: jsonb("api_response"),
      printedAt: timestamp("printed_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_shipping_labels_tenant").on(t.tenantId),
      index("idx_shipping_labels_order").on(t.orderId),
      index("idx_shipping_labels_sales_order").on(t.salesOrderId),
      index("idx_shipping_labels_tracking")
        .on(t.trackingCode)
        .where(sql`tracking_code IS NOT NULL`),
      index("idx_shipping_labels_status").on(t.status),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();

// ──────────────────────────────────────────────────────
// 22. erp.revenue_leak_daily — Pandora96-inspired daily revenue leak (unchanged)
// ──────────────────────────────────────────────────────
export const revenueLeakDaily = erpSchema
  .table(
    "revenue_leak_daily",
    {
      id: uuid("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
      skuId: uuid("sku_id")
        .notNull()
        .references(() => skus.id),
      date: date("date").notNull(),
      pageViews: integer("page_views").notNull().default(0),
      avgConversionRate: numeric("avg_conversion_rate", {
        precision: 5,
        scale: 4,
      })
        .notNull()
        .default("0"),
      avgOrderValue: numeric("avg_order_value", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      estimatedLostRevenue: numeric("estimated_lost_revenue", {
        precision: 12,
        scale: 2,
      })
        .notNull()
        .default("0"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      index("idx_revenue_leak_tenant").on(t.tenantId),
      uniqueIndex("idx_revenue_leak_sku_date").on(t.tenantId, t.skuId, t.date),
      index("idx_revenue_leak_date").on(t.date),
      index("idx_revenue_leak_amount").on(t.estimatedLostRevenue),
      pgPolicy("tenant_isolation", tenantIsolation),
    ],
  )
  .enableRLS();
