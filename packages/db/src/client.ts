import { neon, Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as globalSchema from "./schema/global";
import * as creatorsSchema from "./schema/creators";
import * as checkoutSchema from "./schema/checkout";
import * as crmSchema from "./schema/crm";
import * as erpSchema from "./schema/erp";
import * as whatsappSchema from "./schema/whatsapp";
import * as dashboardSchema from "./schema/dashboard";

const allSchemas = {
  ...globalSchema,
  ...creatorsSchema,
  ...checkoutSchema,
  ...crmSchema,
  ...erpSchema,
  ...whatsappSchema,
  ...dashboardSchema,
};

function getDatabaseUrl(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Create a Neon project and add the connection string to .env",
    );
  }
  return process.env.DATABASE_URL;
}

// --- HTTP client (neon-http) ---
// Fast, low-latency for simple queries. Does NOT support transactions.
function createDb() {
  const sql = neon(getDatabaseUrl());
  return drizzleHttp(sql, { schema: allSchemas });
}

// --- WebSocket client (neon-serverless) ---
// Supports transactions. Required for withTenantContext (SET LOCAL + RLS).
// Uses @neondatabase/serverless Pool which speaks WebSocket to Neon's proxy.
function createTxDb() {
  // In Node.js there is no global WebSocket — provide the ws implementation.
  // On Vercel Edge/Serverless, globalThis.WebSocket exists and this is a no-op.
  if (typeof globalThis.WebSocket === "undefined") {
    neonConfig.webSocketConstructor = ws;
  }

  const pool = new Pool({ connectionString: getDatabaseUrl() });
  return drizzleWs(pool, { schema: allSchemas });
}

// Lazy singletons — only connect when first used
let _db: ReturnType<typeof createDb> | null = null;
let _txDb: ReturnType<typeof createTxDb> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export function getTxDb() {
  if (!_txDb) {
    _txDb = createTxDb();
  }
  return _txDb;
}

// Re-export for convenience (lazy proxies)
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const txDb = new Proxy({} as ReturnType<typeof createTxDb>, {
  get(_target, prop) {
    return (getTxDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type Database = ReturnType<typeof createDb>;
export type TxDatabase = ReturnType<typeof createTxDb>;
