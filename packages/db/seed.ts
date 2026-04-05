import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  tenants,
  roles,
  permissions,
  integrationProviders,
} from "./src/schema/global";
import { eq } from "drizzle-orm";

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

// Role definitions with display names
const ROLE_DEFINITIONS = [
  {
    name: "admin",
    displayName: "Administrador",
    description: "Full system access",
  },
  {
    name: "pm",
    displayName: "Product Manager",
    description: "CRM, Creators, Marketing, Dashboard",
  },
  {
    name: "creative",
    displayName: "Criativo",
    description: "DAM, Tasks, Marketing Intel (read-only)",
  },
  {
    name: "operations",
    displayName: "Operacoes",
    description: "ERP, PCP, Exchanges, Inventory",
  },
  {
    name: "support",
    displayName: "Suporte",
    description: "Inbox, Exchanges, CRM (read-only)",
  },
  {
    name: "finance",
    displayName: "Financeiro",
    description: "ERP financial, DRE, Margins",
  },
  { name: "commercial", displayName: "Comercial", description: "B2B Portal" },
];

// Permission matrix (resource:action format)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["system:impersonate", "admin:settings:read", "admin:settings:write"],
  pm: [
    // CRM
    "crm:contacts:read",
    "crm:contacts:write",
    "crm:segments:read",
    "crm:segments:write",
    "crm:automations:read",
    "crm:automations:write",
    "crm:campaigns:read",
    "crm:campaigns:write",
    // Checkout (read-only analytics)
    "checkout:orders:read",
    "checkout:carts:read",
    "checkout:abandoned:read",
    "checkout:ab_tests:read",
    "checkout:ab_tests:write",
    // Dashboard
    "dashboard:overview:read",
    "dashboard:war_room:read",
    "dashboard:marketing:read",
    // Tarefas
    "tarefas:boards:read",
    "tarefas:boards:write",
    "tarefas:tasks:read",
    "tarefas:tasks:write",
    "tarefas:calendar:read",
    "tarefas:calendar:write",
    // Marketing
    "marketing:campaigns:read",
    "marketing:campaigns:write",
    "marketing:analytics:read",
    // Creators
    "creators:profiles:read",
    "creators:profiles:write",
    "creators:campaigns:read",
    "creators:campaigns:write",
    "creators:payouts:read",
    // DAM (read + upload)
    "dam:assets:read",
    "dam:assets:upload",
  ],
  creative: [
    // DAM (full)
    "dam:assets:read",
    "dam:assets:upload",
    "dam:assets:write",
    "dam:assets:delete",
    "dam:collections:read",
    "dam:collections:write",
    // Tarefas (own tasks only)
    "tarefas:tasks:read",
    "tarefas:tasks:write",
    "tarefas:calendar:read",
    // Marketing (read-only)
    "marketing:campaigns:read",
    "marketing:analytics:read",
    // Dashboard (marketing panel)
    "dashboard:overview:read",
    "dashboard:marketing:read",
  ],
  operations: [
    // ERP (full)
    "erp:products:read",
    "erp:products:write",
    "erp:inventory:read",
    "erp:inventory:write",
    "erp:nfe:read",
    "erp:nfe:write",
    "erp:shipping:read",
    "erp:shipping:write",
    // PLM (full)
    "plm:orders:read",
    "plm:orders:write",
    "plm:stages:read",
    "plm:stages:write",
    "plm:suppliers:read",
    "plm:suppliers:write",
    "plm:materials:read",
    "plm:materials:write",
    // Trocas (full)
    "trocas:requests:read",
    "trocas:requests:write",
    "trocas:reverse:read",
    "trocas:reverse:write",
    // Checkout orders
    "checkout:orders:read",
    "checkout:orders:write",
    // Dashboard
    "dashboard:overview:read",
    "dashboard:operations:read",
    // Tarefas
    "tarefas:tasks:read",
    "tarefas:tasks:write",
    "tarefas:calendar:read",
  ],
  support: [
    // Mensageria (full inbox)
    "messaging:conversations:read",
    "messaging:conversations:write",
    "messaging:templates:read",
    "messaging:broadcasts:read",
    // CRM (read-only)
    "crm:contacts:read",
    "crm:segments:read",
    // Trocas
    "trocas:requests:read",
    "trocas:requests:write",
    // Tarefas (own)
    "tarefas:tasks:read",
    "tarefas:tasks:write",
  ],
  finance: [
    // ERP financial
    "erp:products:read",
    "erp:finance:read",
    "erp:finance:write",
    "erp:nfe:read",
    // Dashboard financial
    "dashboard:overview:read",
    "dashboard:finance:read",
    // Checkout orders (read)
    "checkout:orders:read",
    // Creators payouts
    "creators:payouts:read",
    "creators:payouts:write",
  ],
  commercial: [
    // B2B
    "b2b:retailers:read",
    "b2b:retailers:write",
    "b2b:orders:read",
    "b2b:orders:write",
    "b2b:price_tables:read",
    "b2b:price_tables:write",
    // Checkout orders (read)
    "checkout:orders:read",
    // Dashboard
    "dashboard:overview:read",
    "dashboard:commercial:read",
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

  // 4-5. Users are now created via /signup with magic links
  console.log(
    "4. Skipping user creation — use /signup to create your admin account.",
  );
  console.log(
    "5. Skipping user-tenant links — created automatically on signup.",
  );

  // 6-7. Creators module removed (Inbazz contracted). Skipping tiers and demo creators.
  console.log(
    "6-7. Skipping creators seeding — module paused (Inbazz contracted).",
  );

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
        {
          key: "clientSecret",
          label: "Client Secret",
          type: "password",
          required: true,
        },
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
        {
          key: "accessKeyId",
          label: "Access Key ID",
          type: "text",
          required: true,
        },
        {
          key: "secretAccessKey",
          label: "Secret Access Key",
          type: "password",
          required: true,
        },
        {
          key: "bucketName",
          label: "Bucket Name",
          type: "text",
          required: true,
        },
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
        {
          key: "accessToken",
          label: "Access Token",
          type: "password",
          required: true,
        },
        {
          key: "businessAccountId",
          label: "Business Account ID",
          type: "text",
          required: true,
        },
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
  console.log(
    "9. Skipping CIENA integrations — configure via /admin/settings/integrations",
  );

  console.log("\n✓ Seed completed successfully!");
  console.log(
    "✓ Tenant CIENA criado. Acesse /signup para criar sua conta de admin.\n",
  );
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
