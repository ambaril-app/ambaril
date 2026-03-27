# Ambaril (Ambaril) -- Developer Onboarding Guide

> **Version:** 1.0
> **Date:** March 2026
> **Audience:** All developers contributing to the Ambaril codebase
> **Status:** Active

---

## Quick-Start Checklist

For devs who just want to get running:

- [ ] Install Node.js 20+, pnpm 9+, Git 2.40+
- [ ] Clone the repo: `git clone <repo-url> && cd ambaril`
- [ ] Install dependencies: `pnpm install`
- [ ] Copy env file: `cp .env.example .env.local`
- [ ] Fill in required env vars (see [Section 7](#7-environment-variables))
- [ ] Push DB schema: `pnpm db:push`
- [ ] Seed dev data: `pnpm db:seed`
- [ ] Start dev server: `pnpm dev`
- [ ] Open [http://localhost:3000](http://localhost:3000)
- [ ] Log in with seed credentials (see terminal output after `db:seed`)

Total time from clone to running: ~5 minutes with Neon + Upstash.

---

## Table of Contents

1. [Welcome & System Overview](#1-welcome--system-overview)
2. [Prerequisites](#2-prerequisites)
3. [Getting Started](#3-getting-started)
4. [Project Structure](#4-project-structure)
5. [Coding Conventions](#5-coding-conventions)
6. [Common Commands](#6-common-commands)
7. [Environment Variables](#7-environment-variables)
8. [Module Development Guide](#8-module-development-guide)
9. [Testing Guide](#9-testing-guide)
10. [Debugging & Troubleshooting](#10-debugging--troubleshooting)
11. [Key References](#11-key-references)

---

## 1. Welcome & System Overview

**Ambaril** (UI brand name: **Ambaril**) is an all-in-one SaaS platform built for the Brazilian streetwear brand CIENA. It replaces 8+ paid tools (Yever, Bling, Kevi, Nuvemshop, etc.) with a single, purpose-built system covering e-commerce checkout, mini-ERP with fiscal integration, CRM, production planning, WhatsApp communication, creator management, internal task management, and an AI-powered Discord bot.

The platform has **15 core modules** organized into four pillars: Commerce, Operations, Growth, and Team. For the complete module map and scope, see [plan.md](../../plan.md). For the design system governing all UI decisions, see [DS.md](../../DS.md).

**Architecture in a nutshell:** Ambaril is a Next.js 15 monorepo (Turborepo) using the App Router with React Server Components for the internal dashboard, SSR for public-facing pages (checkout, order tracking), and API routes as a BFF layer for external integrations (Mercado Pago, Discord bot, WhatsApp webhooks). Data lives in PostgreSQL (Neon) with Drizzle ORM, cached in Redis (Upstash), with background jobs processed by BullMQ. For full architectural details, see the [architecture docs](../architecture/).

---

## 2. Prerequisites

### Required Software

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | 20+ (LTS) | Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage versions |
| **pnpm** | 9+ | Monorepo package manager. Install: `corepack enable && corepack prepare pnpm@latest --activate` |
| **Git** | 2.40+ | Required for monorepo features |
| **PostgreSQL** | 16+ | Local install OR use [Neon](https://neon.tech) serverless (recommended for dev) |
| **Redis** | 7+ | Local install OR use [Upstash](https://upstash.com) serverless (recommended for dev) |

### Required Accounts

| Service | Why | Setup |
|---------|-----|-------|
| **Neon** | Serverless PostgreSQL (free tier covers dev) | [neon.tech](https://neon.tech) -- create a project, get connection string |
| **Upstash** | Serverless Redis (free tier covers dev) | [upstash.com](https://upstash.com) -- create a Redis database |
| **Discord** | ClawdBot testing | Need a Discord account + access to the CIENA dev server |
| **Meta Developer** | WhatsApp Business API + Instagram API testing | [developers.facebook.com](https://developers.facebook.com) |

### Recommended: VS Code Setup

Install these extensions for the best experience:

```
dbaeumer.vscode-eslint          # ESLint integration
esbenp.prettier-vscode          # Prettier formatting
bradlc.vscode-tailwindcss       # Tailwind CSS IntelliSense
prisma.prisma                   # Syntax highlighting for schema files
ms-playwright.playwright        # Playwright test runner
yoavbls.pretty-ts-errors        # Readable TypeScript errors
```

Add to your VS Code `settings.json`:

```jsonc
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

---

## 3. Getting Started

### Step 1: Clone the Repository

```bash
git clone <repo-url>
cd ambaril
```

### Step 2: Install Dependencies

```bash
# Enable corepack for pnpm version management
corepack enable

# Install all workspace dependencies
pnpm install
```

This installs dependencies for all packages and apps in the monorepo. Turborepo handles the dependency graph.

### Step 3: Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the required values. See [Section 7](#7-environment-variables) for the complete list grouped by service. At minimum, you need:

- `DATABASE_URL` (Neon connection string with pooler)
- `DIRECT_DATABASE_URL` (Neon direct connection for migrations)
- `REDIS_URL` (Upstash Redis URL)
- `SESSION_SECRET` (generate with `openssl rand -base64 32`)

### Step 4: Set Up the Database

```bash
# Option A: Push schema directly (fast, good for dev)
pnpm db:push

# Option B: Run migrations (production-like)
pnpm db:migrate
```

Use `db:push` during active development. Use `db:migrate` when you want to test the migration flow or when working with existing data you do not want to lose.

### Step 5: Seed Development Data

```bash
pnpm db:seed
```

This creates:

- Default admin user (credentials printed to terminal)
- Sample contacts, orders, and products
- Example SKUs with stock levels
- Test creator accounts
- Sample CRM segments

### Step 6: Start the Development Server

```bash
# Start all apps (web + discord-bot)
pnpm dev

# Or start only the web app
pnpm dev --filter=web

# Or start only the Discord bot
pnpm dev --filter=discord-bot
```

### Step 7: Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser. Log in with the credentials from the seed output.

The dashboard is at `/`. Public checkout is at `/checkout`. Order tracking is at `/meu-pedido/{code}`.

---

## 4. Project Structure

```
ambaril/
├── apps/
│   ├── web/                        # Next.js 15 main application
│   │   ├── app/                    # App Router pages
│   │   │   ├── (auth)/             # Auth layout group (login, forgot-password)
│   │   │   ├── (dashboard)/        # Internal dashboard layout (all modules)
│   │   │   │   ├── erp/            # Mini-ERP pages
│   │   │   │   ├── pcp/            # Production planning pages
│   │   │   │   ├── crm/            # CRM pages
│   │   │   │   ├── checkout-admin/ # Checkout configuration pages
│   │   │   │   ├── trocas/         # Exchanges pages
│   │   │   │   ├── b2b/            # B2B wholesale pages
│   │   │   │   ├── creators/       # Creator management pages
│   │   │   │   ├── marketing/      # Marketing intel pages
│   │   │   │   ├── whatsapp/       # WhatsApp engine pages
│   │   │   │   ├── inbox/          # Team inbox pages
│   │   │   │   ├── tarefas/        # Task manager pages
│   │   │   │   ├── dam/            # Digital asset management pages
│   │   │   │   ├── dashboard/      # Beacon dashboard + War Room
│   │   │   │   └── settings/       # System settings
│   │   │   ├── (public)/           # Public pages (checkout, meu-pedido)
│   │   │   ├── api/                # API routes (BFF layer)
│   │   │   │   └── v1/             # Versioned API
│   │   │   │       ├── erp/        # ERP API routes
│   │   │   │       ├── crm/        # CRM API routes
│   │   │   │       ├── checkout/   # Checkout API routes
│   │   │   │       └── ...         # Other module routes
│   │   │   └── layout.tsx          # Root layout
│   │   ├── components/             # App-specific components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utilities, helpers, config
│   │   ├── stores/                 # Zustand stores (client state)
│   │   └── styles/                 # Global styles, Tailwind config
│   │
│   └── discord-bot/                # ClawdBot / Pulse Discord bot
│       ├── commands/               # Slash commands
│       ├── reports/                # Scheduled report generators
│       ├── handlers/               # Event handlers
│       └── soul.md                 # Bot personality definition
│
├── packages/
│   ├── db/                         # Drizzle ORM schemas + migrations
│   │   ├── schema/                 # Schema files by module
│   │   │   ├── commerce.ts         # orders, order_items, carts, ...
│   │   │   ├── erp.ts              # products, skus, stock_movements, ...
│   │   │   ├── crm.ts              # contacts, segments, automations, ...
│   │   │   ├── pcp.ts              # production_orders, cut_orders, ...
│   │   │   └── ...                 # One file per module
│   │   ├── migrations/             # SQL migration files
│   │   ├── seed/                   # Seed data scripts
│   │   └── index.ts                # DB client export
│   │
│   ├── ui/                         # Shared UI components (HeroUI based)
│   │   ├── components/             # Reusable components
│   │   │   ├── button.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── command-palette.tsx
│   │   │   └── ...
│   │   └── lib/                    # UI utilities (cn, variants)
│   │
│   ├── shared/                     # Shared types, constants, validators
│   │   ├── types/                  # TypeScript types/interfaces
│   │   ├── validators/             # Zod schemas (shared front/back)
│   │   ├── constants/              # Enums, config values
│   │   └── utils/                  # Pure utility functions
│   │
│   └── email/                      # Email templates (Resend + React Email)
│       └── templates/              # React Email components
│           ├── order-confirmed.tsx
│           ├── shipping-update.tsx
│           └── ...
│
├── docs/                           # Documentation (you are here)
│   ├── architecture/               # STACK, API, AUTH, DATABASE, INFRA
│   ├── platform/                   # Cross-cutting: errors, testing, search, etc.
│   ├── modules/                    # Per-module specs
│   │   ├── commerce/               # checkout, b2b
│   │   ├── operations/             # erp, pcp, trocas
│   │   ├── growth/                 # crm, creators, marketing-intel
│   │   ├── communication/          # whatsapp, clawdbot
│   │   ├── team/                   # inbox, tarefas, dam
│   │   └── intelligence/           # dashboard (Beacon)
│   ├── dev/                        # GLOSSARY, DEV-GUIDE (this file)
│   └── expansions/                 # Future expansion specs
│
├── turbo.json                      # Turborepo pipeline config
├── pnpm-workspace.yaml             # Workspace config
├── .env.example                    # Environment variable template
└── package.json                    # Root package
```

### Key Navigation Patterns

- **Need a DB schema?** `packages/db/schema/{module}.ts`
- **Need a Zod validator?** `packages/shared/validators/{module}.ts`
- **Need an API route?** `apps/web/app/api/v1/{module}/`
- **Need a dashboard page?** `apps/web/app/(dashboard)/{module}/`
- **Need a UI component?** `packages/ui/components/`
- **Need a type definition?** `packages/shared/types/`

---

## 5. Coding Conventions

### 5.1 TypeScript

- **Strict mode always.** The `tsconfig.json` has `"strict": true`. Do not weaken it.
- **No `any`.** Use `unknown` with type narrowing, or define a proper type. If you truly cannot avoid it, add a `// eslint-disable-next-line` with a comment explaining why.
- **Prefer `interface` over `type`** for object shapes. Use `type` for unions, intersections, and mapped types.
- **Export shared types** from `packages/shared/types/`. Do not define types inline across multiple files.
- **Use `satisfies`** for type-safe object literals when you want inference + validation.

```typescript
// Good: interface for object shape
interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
}

// Good: type for union
type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

// Good: satisfies for config objects
const config = {
  maxRetries: 3,
  timeoutMs: 5000,
} satisfies RetryConfig;
```

### 5.2 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| **Files** | kebab-case | `order-list.tsx`, `use-order-filters.ts` |
| **Components** | PascalCase | `OrderList`, `StatusBadge` |
| **Functions / variables** | camelCase | `getOrderById`, `isValidCpf` |
| **DB columns** | snake_case | `created_at`, `order_id`, `total_amount` |
| **API routes** | kebab-case | `/api/v1/erp/order-items` |
| **Enum values** | UPPER_SNAKE_CASE | `OrderStatus.PENDING`, `Role.ADMIN` |
| **Enum types** | PascalCase | `OrderStatus`, `ShippingCarrier` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE`, `DEFAULT_PAGE_SIZE` |
| **Hooks** | camelCase with `use` prefix | `useOrderFilters`, `useDebounce` |
| **Zustand stores** | camelCase with `use` prefix + `Store` suffix | `useCartStore` |

**Language rules:**
- **Code is always in English.** Variable names, function names, comments, commit messages -- all English.
- **UI strings are always in PT-BR.** Button labels, error messages, tooltips -- all Portuguese.
- **Use [GLOSSARY.md](./GLOSSARY.md)** for the canonical PT-BR to EN mapping. Never translate domain terms on your own. If "Troca" = `exchange` in the glossary, use `exchange` everywhere in code.

### 5.3 Components

- **Server Components by default.** Only add `"use client"` when you need interactivity (event handlers, hooks, browser APIs).
- **Collocate styles with Tailwind.** No CSS modules, no styled-components. Use `cn()` from `packages/ui/lib/utils` for conditional classes.
- **Use HeroUI primitives.** Do not build custom dropdowns, modals, or tables from scratch. Compose from the existing component library.
- **Follow [DS.md](../../DS.md)** for colors, spacing, typography, and component patterns. The design system defines the visual language.
- **Small, focused components.** If a component file exceeds ~200 lines, split it.

```typescript
// Good: Server Component (default)
export default async function OrderListPage() {
  const orders = await getOrders();
  return <OrderTable orders={orders} />;
}

// Good: Client Component only when needed
"use client";

import { useState } from "react";

export function OrderFilters({ onFilterChange }: OrderFiltersProps) {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  // ...interactive logic
}
```

### 5.4 API Routes

- **Follow [API.md](../architecture/API.md) patterns.** Route structure: `/api/v1/{module}/{resource}`.
- **Standard response envelope** on every endpoint:

```typescript
// Success
{
  data: T | T[],
  meta?: { page: number, pageSize: number, total: number },
}

// Error
{
  errors: [{ code: string, message: string, field?: string }],
}
```

- **Zod validation on every endpoint.** Parse the request body/params before processing.
- **Auth middleware on every route.** No public API routes except webhooks and checkout endpoints.
- **Use Server Actions for dashboard mutations.** API routes are for external consumers (Discord bot, webhooks, public pages). Internal dashboard forms use Server Actions.

```typescript
// apps/web/app/api/v1/erp/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/middleware";
import { getOrders } from "@/lib/erp/queries";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(["pending", "paid", "shipped"]).optional(),
});

export const GET = withAuth(async (req: NextRequest) => {
  const params = querySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  );

  const { orders, total } = await getOrders(params);

  return NextResponse.json({
    data: orders,
    meta: { page: params.page, pageSize: params.pageSize, total },
  });
});
```

### 5.5 Database

- **Schema files** live in `packages/db/schema/{module}.ts`. One file per module.
- **Never use raw SQL** unless there is a strong, documented justification (complex aggregate, performance-critical query). If you must, use `sql` tagged template from Drizzle.
- **All timestamps in UTC.** Convert to `America/Sao_Paulo` only in the frontend presentation layer.
- **Soft delete** with `deleted_at TIMESTAMPTZ NULL`. Filter out soft-deleted rows in queries by default.
- **UUIDs for primary keys.** Use UUID v7 for sortability.
- **Money as `NUMERIC(12,2)`.** Never use `FLOAT` or `REAL` for monetary values. See [DATABASE.md](../architecture/DATABASE.md) for full schema conventions.

```typescript
// packages/db/schema/commerce.ts
import { pgTable, uuid, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "separating",
  "shipped",
  "delivered",
  "cancelled",
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),        // Human-readable: CIENA-00001
  contactId: uuid("contact_id").notNull().references(() => contacts.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
```

### 5.6 Error Handling

- **Follow [ERROR-HANDLING.md](../platform/ERROR-HANDLING.md) patterns.** That document defines the full error taxonomy and handling strategy.
- **Never catch and swallow errors silently.** Every `catch` block must either re-throw, log, or return a meaningful error.
- **Use the `AppError` class** for business logic errors. It carries a machine-readable `code`, human-readable `message`, and optional `field` reference.
- **Log with structured JSON.** Use the project logger, not `console.log`. Include context: `userId`, `orderId`, `module`, `action`.

```typescript
import { AppError } from "@/lib/errors";

// Throwing a business logic error
if (order.status !== "pending") {
  throw new AppError({
    code: "ORDER_NOT_CANCELLABLE",
    message: `Cannot cancel order in status "${order.status}"`,
    status: 409,
  });
}

// In a catch block -- never swallow silently
try {
  await processPayment(order);
} catch (error) {
  logger.error("Payment processing failed", {
    orderId: order.id,
    error: error instanceof Error ? error.message : "Unknown error",
  });
  throw error; // Re-throw so the caller can handle it
}
```

---

## 6. Common Commands

All commands are run from the repo root. Turborepo handles running them across the correct packages.

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode (web + discord-bot) |
| `pnpm dev --filter=web` | Start only the web app |
| `pnpm dev --filter=discord-bot` | Start only the Discord bot |
| `pnpm build` | Build all packages and apps for production |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm format` | Run Prettier across all packages |
| `pnpm test` | Run Vitest unit and integration tests |
| `pnpm test:e2e` | Run Playwright end-to-end tests |
| `pnpm db:generate` | Generate a new Drizzle migration from schema changes |
| `pnpm db:push` | Push schema changes directly to the database (dev only) |
| `pnpm db:migrate` | Run pending SQL migrations |
| `pnpm db:seed` | Seed the database with development data |
| `pnpm db:studio` | Open Drizzle Studio (visual DB browser at `https://local.drizzle.studio`) |
| `pnpm typecheck` | Run TypeScript type checking across all packages |

### Filtering by Package

Use `--filter` to target a specific package or app:

```bash
# Run tests only in the shared package
pnpm test --filter=shared

# Build only the db package
pnpm build --filter=db

# Lint only the web app
pnpm lint --filter=web
```

### Database Workflow

```bash
# 1. Edit schema in packages/db/schema/{module}.ts
# 2. Generate migration
pnpm db:generate

# 3. Review the generated SQL in packages/db/migrations/
# 4. Apply it
pnpm db:migrate

# 5. Verify in Drizzle Studio
pnpm db:studio
```

---

## 7. Environment Variables

All env vars go in `.env.local` (gitignored). The `.env.example` file documents every variable with placeholder values.

### Database (Neon)

```bash
# Pooled connection (used by the application at runtime)
DATABASE_URL="postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/ciena_os?sslmode=require"

# Direct connection (used by Drizzle for migrations -- bypasses the pooler)
DIRECT_DATABASE_URL="postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/ciena_os?sslmode=require"
```

### Cache / Real-time (Upstash Redis)

```bash
# Upstash Redis connection
REDIS_URL="rediss://default:token@xyz.upstash.io:6379"
```

### Authentication

Ambaril uses a **custom auth system** (not NextAuth). Sessions are stored in PostgreSQL and delivered via the `ambaril_session` httpOnly cookie. See [AUTH.md](../architecture/AUTH.md) for the full auth architecture.

```bash
# Session cookie signing secret (generate: openssl rand -base64 32)
SESSION_SECRET="your-random-secret-here"
```

### Payments (Mercado Pago)

```bash
# Mercado Pago credentials (sandbox for dev)
MERCADOPAGO_ACCESS_TOKEN="TEST-xxxx"

# Webhook signature verification
MERCADOPAGO_WEBHOOK_SECRET="your-webhook-secret"
```

### Shipping (Melhor Envio)

```bash
# Melhor Envio API token
MELHOR_ENVIO_TOKEN="your-token"

# Use sandbox environment for dev
MELHOR_ENVIO_SANDBOX="true"
```

### Fiscal (Focus NFe)

```bash
# Focus NFe API token
FOCUS_NFE_TOKEN="your-token"

# Environment: "homologacao" for dev, "producao" for prod
FOCUS_NFE_ENVIRONMENT="homologacao"
```

### WhatsApp / Instagram (Meta)

```bash
# WhatsApp Business API
META_WHATSAPP_TOKEN="your-token"
META_WHATSAPP_PHONE_ID="your-phone-id"
META_WHATSAPP_VERIFY_TOKEN="your-verify-token"

# Instagram API
INSTAGRAM_APP_ID="your-app-id"
INSTAGRAM_APP_SECRET="your-app-secret"
```

### AI (Claude API)

```bash
# Anthropic Claude API key (Haiku for reports, Sonnet for chat)
CLAUDE_API_KEY="sk-ant-xxxx"
```

### Email (Resend)

```bash
# Resend API key
RESEND_API_KEY="re_xxxx"

# Default sender address
RESEND_FROM_EMAIL="noreply@ciena.com.br"
```

### Storage (Cloudflare R2)

```bash
# R2 credentials for DAM and product photos
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="ambaril-dev"
```

### Discord (ClawdBot / Pulse)

```bash
# Bot authentication
DISCORD_BOT_TOKEN="your-bot-token"
DISCORD_GUILD_ID="your-server-id"

# Channel IDs (one per report/alert type)
DISCORD_CHANNEL_DAILY_SALES="channel-id"
DISCORD_CHANNEL_WEEKLY_REPORT="channel-id"
DISCORD_CHANNEL_STOCK_ALERTS="channel-id"
DISCORD_CHANNEL_ORDER_UPDATES="channel-id"
DISCORD_CHANNEL_PRODUCTION="channel-id"
DISCORD_CHANNEL_SHIPPING="channel-id"
DISCORD_CHANNEL_CREATORS="channel-id"
DISCORD_CHANNEL_GENERAL="channel-id"
DISCORD_CHANNEL_WAR_ROOM="channel-id"
```

### Monitoring

```bash
# Sentry error tracking
SENTRY_DSN="https://xxxx@sentry.io/xxxx"
```

### Public (Client-Side)

```bash
# Exposed to the browser (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 8. Module Development Guide

When adding a new module (or a new feature within a module), follow this checklist. Not every step applies to every change, but for a full new module, you will touch all of them.

### Step 1: Define the Database Schema

Create or extend a schema file in `packages/db/schema/{module}.ts`. Follow the conventions in [DATABASE.md](../architecture/DATABASE.md).

```typescript
// packages/db/schema/loyalty.ts (example: new loyalty module)
import { pgTable, uuid, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { contacts } from "./crm";

export const tierEnum = pgEnum("loyalty_tier", ["bronze", "silver", "gold", "vip"]);

export const loyaltyAccounts = pgTable("loyalty_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactId: uuid("contact_id").notNull().references(() => contacts.id),
  tier: tierEnum("tier").notNull().default("bronze"),
  totalPoints: integer("total_points").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### Step 2: Generate and Run Migration

```bash
pnpm db:generate    # Creates SQL migration file
pnpm db:migrate     # Applies it to the database
```

Review the generated SQL in `packages/db/migrations/` before applying.

### Step 3: Create Zod Validators

Shared validators go in `packages/shared/validators/{module}.ts`. These are used on both the client (form validation) and the server (API/action validation).

```typescript
// packages/shared/validators/loyalty.ts
import { z } from "zod";

export const createLoyaltyAccountSchema = z.object({
  contactId: z.string().uuid(),
  initialTier: z.enum(["bronze", "silver", "gold", "vip"]).default("bronze"),
});

export const addPointsSchema = z.object({
  accountId: z.string().uuid(),
  points: z.number().int().positive(),
  reason: z.string().min(1).max(200),
});

export type CreateLoyaltyAccount = z.infer<typeof createLoyaltyAccountSchema>;
export type AddPoints = z.infer<typeof addPointsSchema>;
```

### Step 4: Create API Routes

Add routes in `apps/web/app/api/v1/{module}/`. Follow [API.md](../architecture/API.md) patterns.

```
apps/web/app/api/v1/loyalty/
├── route.ts                  # GET (list) + POST (create)
└── [id]/
    └── route.ts              # GET (detail) + PATCH (update) + DELETE (soft delete)
```

### Step 5: Create Dashboard Pages

Add pages in `apps/web/app/(dashboard)/{module}/`.

```
apps/web/app/(dashboard)/loyalty/
├── page.tsx                  # List view (Server Component)
├── [id]/
│   └── page.tsx              # Detail view
├── components/               # Module-specific components
│   ├── loyalty-table.tsx
│   └── tier-badge.tsx
└── actions.ts                # Server Actions for mutations
```

### Step 6: Add Sidebar Entry

Register the new module in the sidebar navigation config so users can access it.

### Step 7: Add Permissions

Update the auth configuration to include permissions for the new module. See [AUTH.md](../architecture/AUTH.md) for the RBAC model.

### Step 8: Add Flare Notification Events

Register events that should trigger notifications. See [NOTIFICATIONS.md](../platform/NOTIFICATIONS.md) for the Flare system.

```typescript
// Example: register a Flare event
{
  event: "loyalty.tier_upgraded",
  channels: ["in_app", "discord"],
  template: "Contact {contactName} upgraded to {newTier} tier",
}
```

### Step 9: Add Search Index Entries

If the module's entities should appear in global search, add entries to the search index. See [SEARCH.md](../platform/SEARCH.md).

### Step 10: Write Tests

Add unit tests for business logic and integration tests for API routes. See [Section 9](#9-testing-guide) and [TESTING.md](../platform/TESTING.md).

---

## 9. Testing Guide

For the complete testing strategy, coverage targets, and patterns, see [TESTING.md](../platform/TESTING.md). This section covers the practical basics.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (re-runs on file change)
pnpm test -- --watch

# Run tests for a specific package
pnpm test --filter=shared

# Run a specific test file
pnpm test -- packages/shared/src/utils/__tests__/cpf.test.ts

# Run Playwright E2E tests
pnpm test:e2e

# Run E2E tests with UI mode (visual debugging)
pnpm test:e2e -- --ui
```

### Writing a Unit Test

Unit tests are for pure business logic: calculators, validators, state transitions, scoring algorithms. They are fast, isolated, and do not touch the database.

```typescript
// packages/shared/src/utils/__tests__/margin-calculator.test.ts
import { describe, it, expect } from "vitest";
import { calculateMargin } from "../margin-calculator";

describe("calculateMargin", () => {
  it("calculates gross margin percentage correctly", () => {
    const result = calculateMargin({
      sellingPrice: 299.9,
      costPrice: 89.5,
      taxRate: 0.12,
    });

    expect(result.grossMargin).toBeCloseTo(0.641, 2);
    expect(result.netMargin).toBeCloseTo(0.521, 2);
  });

  it("throws on zero selling price", () => {
    expect(() =>
      calculateMargin({ sellingPrice: 0, costPrice: 89.5, taxRate: 0.12 })
    ).toThrow("Selling price must be positive");
  });

  it("handles promotional pricing with discount", () => {
    const result = calculateMargin({
      sellingPrice: 299.9,
      costPrice: 89.5,
      taxRate: 0.12,
      discountPercent: 0.15,
    });

    expect(result.effectivePrice).toBeCloseTo(254.915, 2);
    expect(result.netMargin).toBeLessThan(0.521);
  });
});
```

### Writing an Integration Test

Integration tests hit the actual database (a Neon test branch). Use them for API routes and database queries.

```typescript
// apps/web/app/api/v1/erp/orders/__tests__/route.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestContext } from "@/test/helpers";

describe("GET /api/v1/erp/orders", () => {
  const ctx = createTestContext();

  beforeAll(async () => {
    await ctx.setup();
    await ctx.seed.orders(5); // Create 5 test orders
  });

  afterAll(async () => {
    await ctx.teardown();
  });

  it("returns paginated orders", async () => {
    const response = await ctx.get("/api/v1/erp/orders?page=1&pageSize=2");

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data).toHaveLength(2);
    expect(body.meta.total).toBe(5);
    expect(body.meta.page).toBe(1);
  });

  it("filters orders by status", async () => {
    const response = await ctx.get("/api/v1/erp/orders?status=pending");

    expect(response.status).toBe(200);
    const body = await response.json();
    body.data.forEach((order: any) => {
      expect(order.status).toBe("pending");
    });
  });

  it("requires authentication", async () => {
    const response = await ctx.getUnauthenticated("/api/v1/erp/orders");
    expect(response.status).toBe(401);
  });
});
```

### Test Data Factories

Use the seed utilities in `packages/db/seed/` to create realistic test data. Factories produce valid objects with sensible defaults that can be overridden:

```typescript
import { factory } from "@ambaril/db/seed";

// Create an order with defaults
const order = factory.order();

// Create an order with specific overrides
const paidOrder = factory.order({ status: "paid", totalAmount: "599.90" });

// Create related entities
const contact = factory.contact();
const orderWithContact = factory.order({ contactId: contact.id });
```

---

## 10. Debugging & Troubleshooting

### Common Issues

#### "Module not found" after installing a new dependency

```bash
# Clear Turborepo cache and reinstall
pnpm clean && pnpm install
```

#### Database connection refused

- **Neon:** Check that your IP is allowed (Neon allows all IPs by default). Verify the connection string includes `?sslmode=require`.
- **Local PostgreSQL:** Ensure the service is running (`brew services list` on macOS).

#### Redis connection timeout

- **Upstash:** Verify the `REDIS_URL` starts with `rediss://` (TLS) not `redis://`.
- **Local Redis:** Check the service is running (`redis-cli ping` should return `PONG`).

#### Hydration mismatch errors

This usually means a Server Component is rendering differently on the server vs. the client. Common causes:

- Using `Date.now()` or `Math.random()` in a Server Component
- Accessing `window` or `localStorage` in server-rendered code
- Conditional rendering based on client-only state

Fix: move the dynamic logic to a Client Component, or use `Suspense` boundaries.

#### Drizzle migration conflict

If two developers generate migrations at the same time:

```bash
# 1. Pull the latest migrations
git pull

# 2. Re-generate your migration (Drizzle handles the merge)
pnpm db:generate

# 3. Apply
pnpm db:migrate
```

#### Port 3000 already in use

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or start on a different port
PORT=3001 pnpm dev --filter=web
```

### Debugging API Routes

**Option A: VS Code debugger**

Add this to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

Start the dev server with `NODE_OPTIONS='--inspect' pnpm dev --filter=web`, then attach the debugger.

**Option B: Structured logging**

Use the project logger to add debug output:

```typescript
import { logger } from "@/lib/logger";

logger.debug("Processing order payment", {
  orderId: order.id,
  amount: order.totalAmount,
  paymentMethod: "pix",
});
```

### Inspecting the Database

```bash
# Open Drizzle Studio (visual browser)
pnpm db:studio

# Or connect directly with psql
psql $DATABASE_URL
```

Drizzle Studio opens at `https://local.drizzle.studio` and provides a GUI for browsing tables, running queries, and editing data.

### Checking Redis State

```bash
# Connect to Redis CLI (local)
redis-cli

# Connect to Upstash Redis
redis-cli --tls -h your-host.upstash.io -p 6379 -a your-token

# Useful commands
KEYS "session:*"           # List all sessions
TTL "session:abc123"       # Check session expiry
GET "cache:orders:page:1"  # Read a cached value
LLEN "bull:email:waiting"  # Check BullMQ queue length
```

### Logging Conventions

All logs must be structured JSON for searchability. Follow these severity levels:

| Level | When to use |
|-------|-------------|
| `error` | Something broke and needs attention. Include stack traces. |
| `warn` | Something unexpected happened but the system recovered. |
| `info` | Significant lifecycle events: order paid, email sent, migration run. |
| `debug` | Detailed diagnostic info. Only visible in dev. |

```typescript
// Always include context
logger.error("Failed to process webhook", {
  provider: "mercado_pago",
  webhookId: payload.id,
  error: err.message,
  stack: err.stack,
});
```

---

## 11. Key References

All documentation lives in the `docs/` folder. Here is a complete index:

### Architecture

| Document | Path | Description |
|----------|------|-------------|
| Stack & Technology | [`architecture/STACK.md`](../architecture/STACK.md) | Full technology choices and rationale |
| API Patterns | [`architecture/API.md`](../architecture/API.md) | REST conventions, response envelope, versioning |
| Auth & Authorization | [`architecture/AUTH.md`](../architecture/AUTH.md) | Authentication flows, RBAC roles, session management |
| Database Schema | [`architecture/DATABASE.md`](../architecture/DATABASE.md) | Schema design, naming, indexes, all table definitions |
| Infrastructure | [`architecture/INFRA.md`](../architecture/INFRA.md) | Hosting, deployment, CI/CD, monitoring |

### Platform (Cross-Cutting)

| Document | Path | Description |
|----------|------|-------------|
| Error Handling | [`platform/ERROR-HANDLING.md`](../platform/ERROR-HANDLING.md) | Error taxonomy, AppError class, retry patterns |
| Testing Strategy | [`platform/TESTING.md`](../platform/TESTING.md) | Test types, coverage targets, patterns |
| Global Search | [`platform/SEARCH.md`](../platform/SEARCH.md) | Search index, tsvector setup, command palette |
| Notifications (Flare) | [`platform/NOTIFICATIONS.md`](../platform/NOTIFICATIONS.md) | Cross-module notification system |
| Audit Log | [`platform/AUDIT-LOG.md`](../platform/AUDIT-LOG.md) | Change tracking, compliance |
| LGPD Compliance | [`platform/LGPD.md`](../platform/LGPD.md) | Data protection, consent, anonymization |

### Module Specs

| Module | Path | Pillar |
|--------|------|--------|
| Checkout | [`modules/commerce/checkout.md`](../modules/commerce/checkout.md) | Commerce |
| B2B Wholesale | [`modules/commerce/b2b.md`](../modules/commerce/b2b.md) | Commerce |
| Mini-ERP | [`modules/operations/erp.md`](../modules/operations/erp.md) | Operations |
| PCP (Production) | [`modules/operations/pcp.md`](../modules/operations/pcp.md) | Operations |
| Trocas (Exchanges) | [`modules/operations/trocas.md`](../modules/operations/trocas.md) | Operations |
| CRM | [`modules/growth/crm.md`](../modules/growth/crm.md) | Growth |
| Creators | [`modules/growth/creators.md`](../modules/growth/creators.md) | Growth |
| Marketing Intel | [`modules/growth/marketing-intel.md`](../modules/growth/marketing-intel.md) | Growth |
| WhatsApp Engine | [`modules/communication/whatsapp.md`](../modules/communication/whatsapp.md) | Communication |
| ClawdBot (Discord) | [`modules/communication/clawdbot.md`](../modules/communication/clawdbot.md) | Communication |
| Inbox | [`modules/team/inbox.md`](../modules/team/inbox.md) | Team |
| Tarefas (Tasks) | [`modules/team/tarefas.md`](../modules/team/tarefas.md) | Team |
| DAM | [`modules/team/dam.md`](../modules/team/dam.md) | Team |
| Dashboard (Beacon) | [`modules/intelligence/dashboard.md`](../modules/intelligence/dashboard.md) | Intelligence |

### Developer Resources

| Document | Path | Description |
|----------|------|-------------|
| Domain Glossary | [`dev/GLOSSARY.md`](./GLOSSARY.md) | PT-BR to EN term mapping (canonical) |
| Developer Guide | [`dev/DEV-GUIDE.md`](./DEV-GUIDE.md) | This file |
| Design System | [`DS.md`](../../DS.md) | Colors, typography, spacing, component patterns |
| Module Map | [`plan.md`](../../plan.md) | Complete module scope and feature list |

---

*Last updated: March 2026*
