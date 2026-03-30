import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hash } from "@node-rs/argon2";
import {
  tenants,
  users,
  userTenants,
  roles,
  permissions,
  integrationProviders,
  moduleSetupState,
} from "./src/schema/global";
import { creatorTiers, creators, coupons } from "./src/schema/creators";
import { and, eq } from "drizzle-orm";

// Default password for all seed users — MUST be changed after first login
const DEFAULT_PASSWORD = "ambaril2026";

// Argon2id config (same as auth.ts)
async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

// ─── Seed Data ──────────────────────────────────────────

const CIENA_TENANT = {
  name: "CIENA",
  slug: "ciena",
  plan: "starter" as const,
  settings: {
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    locale: "pt-BR",
    logo: null,
  },
};

const TEAM = [
  { name: "Marcus", email: "marcus@ciena.com.br", role: "admin" as const },
  { name: "Caio", email: "caio@ciena.com.br", role: "pm" as const },
  { name: "Tavares", email: "tavares@ciena.com.br", role: "operations" as const },
  { name: "Pedro", email: "pedro@ciena.com.br", role: "finance" as const },
  { name: "Yuri", email: "yuri@ciena.com.br", role: "creative" as const },
  { name: "Sick", email: "sick@ciena.com.br", role: "creative" as const },
  { name: "Slimgust", email: "slimgust@ciena.com.br", role: "support" as const },
  { name: "Ana Clara", email: "ana@ciena.com.br", role: "operations" as const },
  { name: "Guilherme", email: "guilherme@ciena.com.br", role: "commercial" as const },
];

const CREATOR_TIERS_DATA = [
  { name: "Ambassador", slug: "ambassador", commissionRate: "0.00", minFollowers: 0, sortOrder: 0, benefits: { discount: 8 } },
  { name: "Seed", slug: "seed", commissionRate: "8.00", minFollowers: 0, sortOrder: 1, benefits: { discount: 10 } },
  { name: "Grow", slug: "grow", commissionRate: "10.00", minFollowers: 5000, sortOrder: 2, benefits: { discount: 15, earlyAccess: true } },
  { name: "Bloom", slug: "bloom", commissionRate: "12.00", minFollowers: 20000, sortOrder: 3, benefits: { discount: 20, earlyAccess: true, exclusiveProducts: true } },
  { name: "Core", slug: "core", commissionRate: "15.00", minFollowers: 50000, sortOrder: 4, benefits: { discount: 25, earlyAccess: true, exclusiveProducts: true, monthlyGifting: true } },
];

// Role definitions with display names
const ROLE_DEFINITIONS = [
  { name: "admin", displayName: "Administrador", description: "Full system access" },
  { name: "pm", displayName: "Product Manager", description: "CRM, Creators, Marketing, Dashboard" },
  { name: "creative", displayName: "Criativo", description: "DAM, Tasks, Marketing Intel (read-only)" },
  { name: "operations", displayName: "Operacoes", description: "ERP, PCP, Exchanges, Inventory" },
  { name: "support", displayName: "Suporte", description: "Inbox, Exchanges, CRM (read-only)" },
  { name: "finance", displayName: "Financeiro", description: "ERP financial, DRE, Margins" },
  { name: "commercial", displayName: "Comercial", description: "B2B Portal" },
];

// Permission matrix (resource:action format)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "system:impersonate",
  ],
  pm: [
    "creators:profiles:read", "creators:profiles:write",
    "creators:challenges:read", "creators:challenges:write",
    "creators:campaigns:read", "creators:campaigns:write",
    "creators:payouts:read", "creators:payouts:write",
    "creators:analytics:read",
    "crm:contacts:read", "crm:contacts:write",
    "crm:segments:read", "crm:segments:write",
    "crm:automations:read", "crm:automations:write",
    "crm:campaigns:read", "crm:campaigns:write",
    "checkout:orders:read",
    "checkout:carts:read", "checkout:abandoned:read",
    "checkout:ab_tests:read", "checkout:ab_tests:write",
    "dashboard:overview:read", "dashboard:war_room:read",
  ],
  creative: [
    "dashboard:overview:read",
  ],
  operations: [
    "erp:products:read", "erp:products:write",
    "erp:inventory:read", "erp:inventory:write",
    "erp:nfe:read", "erp:nfe:write",
    "erp:shipping:read", "erp:shipping:write",
    "checkout:orders:read", "checkout:orders:write",
    "dashboard:overview:read",
  ],
  support: [
    "crm:contacts:read",
    "whatsapp:conversations:read", "whatsapp:conversations:write",
    "whatsapp:templates:read",
  ],
  finance: [
    "erp:products:read",
    "erp:finance:read", "erp:finance:write",
    "dashboard:overview:read",
  ],
  commercial: [
    "checkout:orders:read",
  ],
};

// ─── Main Seed Function ─────────────────────────────────

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to .env");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("Seeding Ambaril database...\n");

  // 1. Create or find CIENA tenant
  console.log("1. Creating CIENA tenant...");
  let [tenant] = await db
    .insert(tenants)
    .values(CIENA_TENANT)
    .onConflictDoNothing()
    .returning({ id: tenants.id });

  if (!tenant) {
    // Already exists — fetch it
    const existing = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, CIENA_TENANT.slug))
      .limit(1);
    tenant = existing[0]!;
    console.log(`   Tenant already exists: ${tenant.id}`);
  } else {
    console.log(`   Tenant created: ${tenant.id}`);
  }

  // 2. Create roles (idempotent — fetch if already exists)
  console.log("2. Creating roles...");
  const insertedRoles: Record<string, string> = {};
  for (const roleDef of ROLE_DEFINITIONS) {
    const [role] = await db
      .insert(roles)
      .values(roleDef)
      .onConflictDoNothing()
      .returning({ id: roles.id, name: roles.name });
    if (role) {
      insertedRoles[role.name] = role.id;
      console.log(`   Role created: ${roleDef.displayName} (${roleDef.name})`);
    } else {
      // Already exists — fetch it
      const existing = await db
        .select({ id: roles.id, name: roles.name })
        .from(roles)
        .where(eq(roles.name, roleDef.name))
        .limit(1);
      if (existing[0]) {
        insertedRoles[existing[0].name] = existing[0].id;
        console.log(`   Role exists: ${roleDef.displayName} (${roleDef.name})`);
      }
    }
  }

  // 3. Create permissions
  console.log("3. Creating permissions...");
  let permCount = 0;
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = insertedRoles[roleName];
    if (!roleId) continue;

    for (const perm of perms) {
      const parts = perm.split(":");
      // resource = all parts except last, action = last part
      const resource = parts.slice(0, -1).join(":");
      const action = parts[parts.length - 1]!;
      await db
        .insert(permissions)
        .values({ roleId, resource, action })
        .onConflictDoNothing();
      permCount++;
    }
  }
  console.log(`   ${permCount} permissions created`);

  // 4. Create users (idempotent)
  console.log("4. Creating users...");
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);
  const insertedUsers: { id: string; role: string }[] = [];

  for (const member of TEAM) {
    const [user] = await db
      .insert(users)
      .values({
        email: member.email,
        name: member.name,
        passwordHash,
        role: member.role,
      })
      .onConflictDoNothing()
      .returning({ id: users.id });

    if (user) {
      insertedUsers.push({ id: user.id, role: member.role });
      console.log(`   User created: ${member.name} <${member.email}> [${member.role}]`);
    } else {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, member.email))
        .limit(1);
      if (existing[0]) {
        insertedUsers.push({ id: existing[0].id, role: member.role });
        console.log(`   User exists: ${member.name} <${member.email}> [${member.role}]`);
      }
    }
  }

  // 5. Create user_tenants (link all users to CIENA)
  console.log("5. Linking users to CIENA tenant...");
  for (const user of insertedUsers) {
    await db
      .insert(userTenants)
      .values({
        userId: user.id,
        tenantId: tenant.id,
        role: user.role as typeof userTenants.$inferInsert.role,
        isDefault: true,
      })
      .onConflictDoNothing();
  }
  console.log(`   ${insertedUsers.length} user-tenant links processed`);

  // 6. Create creator tiers for CIENA
  console.log("6. Creating creator tiers...");
  for (const tier of CREATOR_TIERS_DATA) {
    await db
      .insert(creatorTiers)
      .values({
        tenantId: tenant.id,
        name: tier.name,
        slug: tier.slug,
        commissionRate: tier.commissionRate,
        minFollowers: tier.minFollowers,
        benefits: tier.benefits,
        sortOrder: tier.sortOrder,
      })
      .onConflictDoNothing();
    console.log(`   Tier: ${tier.name} (${tier.commissionRate}%)`);
  }

  // 7. Create demo creators for testing
  console.log("7. Creating demo creators...");

  // Find the "Seed" tier for the demo creator
  const seedTierResult = await db
    .select({ id: creatorTiers.id })
    .from(creatorTiers)
    .where(
      and(
        eq(creatorTiers.tenantId, tenant.id),
        eq(creatorTiers.slug, "seed"),
      ),
    )
    .limit(1);

  const seedTierId = seedTierResult[0]?.id ?? null;

  // Demo creator (active, with coupon)
  const [demoCreator] = await db
    .insert(creators)
    .values({
      tenantId: tenant.id,
      name: "Demo Creator",
      email: "creator@cienalab.com.br",
      phone: "21999990001",
      cpf: "000.000.000-01",
      status: "active",
      tierId: seedTierId,
      commissionRate: "8.00",
      joinedAt: new Date(),
      contentRightsAccepted: true,
      motivation: "Demo creator for testing",
    })
    .onConflictDoNothing()
    .returning({ id: creators.id });

  if (demoCreator) {
    // Create coupon for demo creator
    await db
      .insert(coupons)
      .values({
        tenantId: tenant.id,
        creatorId: demoCreator.id,
        code: "DEMO10",
        type: "creator",
        discountType: "percent",
        discountPercent: "10.00",
        isActive: true,
      })
      .onConflictDoNothing();

    // Link coupon to creator
    const couponResult = await db
      .select({ id: coupons.id })
      .from(coupons)
      .where(
        and(
          eq(coupons.tenantId, tenant.id),
          eq(coupons.code, "DEMO10"),
        ),
      )
      .limit(1);

    if (couponResult[0]) {
      await db
        .update(creators)
        .set({ couponId: couponResult[0].id })
        .where(eq(creators.id, demoCreator.id));
    }

    console.log("   Creator: Demo Creator <creator@cienalab.com.br> [active]");
  }

  // Pending creator
  await db
    .insert(creators)
    .values({
      tenantId: tenant.id,
      name: "Creator Pendente",
      email: "pendente@cienalab.com.br",
      phone: "21999990002",
      cpf: "000.000.000-02",
      status: "pending",
      motivation: "Quero divulgar a marca nas minhas redes sociais",
    })
    .onConflictDoNothing();
  console.log("   Creator: Creator Pendente <pendente@cienalab.com.br> [pending]");

  // 8. Seed integration providers catalog
  console.log("8. Creating integration providers...");
  const PROVIDERS_DATA = [
    {
      providerId: "shopify",
      capability: "ecommerce",
      name: "Shopify",
      description: "Catálogo de produtos, cupons e estoque",
      icon: "ShoppingBag",
      configSchema: [
        { key: "shop", label: "Shopify Store", type: "text", required: true },
        { key: "clientId", label: "Client ID", type: "text", required: true },
        { key: "clientSecret", label: "Client Secret", type: "password", required: true },
      ],
    },
    {
      providerId: "yever",
      capability: "checkout",
      name: "Yever",
      description: "Checkout e atribuição de vendas",
      icon: "CreditCard",
      configSchema: [
        { key: "apiUrl", label: "API URL", type: "url", required: true },
        { key: "apiKey", label: "API Key", type: "password", required: true },
      ],
    },
    {
      providerId: "resend",
      capability: "messaging",
      name: "Resend",
      description: "Email transacional e marketing",
      icon: "Mail",
      configSchema: [
        { key: "apiKey", label: "API Key", type: "password", required: true },
        { key: "fromEmail", label: "Remetente", type: "text", required: true },
      ],
    },
    {
      providerId: "cloudflare-r2",
      capability: "storage",
      name: "Cloudflare R2",
      description: "Armazenamento de arquivos e imagens",
      icon: "HardDrive",
      configSchema: [
        { key: "accountId", label: "Account ID", type: "text", required: true },
        { key: "accessKeyId", label: "Access Key ID", type: "text", required: true },
        { key: "secretAccessKey", label: "Secret Access Key", type: "password", required: true },
        { key: "bucketName", label: "Bucket Name", type: "text", required: true },
        { key: "publicUrl", label: "Public URL", type: "url", required: false },
      ],
    },
    {
      providerId: "instagram",
      capability: "social",
      name: "Instagram",
      description: "Monitoramento de menções e perfis",
      icon: "Camera",
      configSchema: [
        { key: "accessToken", label: "Access Token", type: "password", required: true },
        { key: "businessAccountId", label: "Business Account ID", type: "text", required: true },
      ],
    },
  ];

  for (const provider of PROVIDERS_DATA) {
    await db
      .insert(integrationProviders)
      .values(provider)
      .onConflictDoNothing();
    console.log(`   Provider: ${provider.name} (${provider.capability})`);
  }

  // Step 9: CIENA tenant integrations are configured by the admin via the UI.
  // Navigate to /admin/settings/integrations after first login to connect:
  // - Shopify (ecommerce capability)
  // - Yever (checkout capability)
  // - Instagram (social capability)
  // Credentials are encrypted and stored in global.tenant_integrations.
  // Platform infrastructure (Resend, Cloudflare R2) uses env vars — not per-tenant.
  console.log("9. Skipping CIENA integrations — configure via /admin/settings/integrations");

  // 10. Create module setup state (creators = not yet set up)
  console.log("10. Creating module setup state...");
  await db
    .insert(moduleSetupState)
    .values({
      tenantId: tenant.id,
      moduleId: "creators",
      isSetupComplete: false,
      currentStep: "integrations",
      stepData: {},
    })
    .onConflictDoNothing();
  console.log("   Module: creators (setup pending)");

  console.log("\nSeed completed successfully!");
  console.log(`\nDefault password for all users: ${DEFAULT_PASSWORD}`);
  console.log("Creator login: creator@cienalab.com.br (uses 6-digit code, check terminal)");
  console.log("IMPORTANT: Change all passwords after first login.\n");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
