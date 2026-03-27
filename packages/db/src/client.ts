import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as globalSchema from "./schema/global";
import * as creatorsSchema from "./schema/creators";
import * as checkoutSchema from "./schema/checkout";
import * as crmSchema from "./schema/crm";
import * as erpSchema from "./schema/erp";
import * as whatsappSchema from "./schema/whatsapp";
import * as dashboardSchema from "./schema/dashboard";

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Create a Neon project and add the connection string to .env",
    );
  }
  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql, {
    schema: {
      ...globalSchema,
      ...creatorsSchema,
      ...checkoutSchema,
      ...crmSchema,
      ...erpSchema,
      ...whatsappSchema,
      ...dashboardSchema,
    },
  });
}

// Lazy singleton — only connects when first used
let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

// Re-export for convenience (lazy proxy)
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type Database = ReturnType<typeof createDb>;
