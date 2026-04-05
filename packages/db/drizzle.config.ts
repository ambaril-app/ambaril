import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: [
    "global",
    "checkout",
    "crm",
    "erp",
    "messaging",
    "dashboard",
    "marketing",
    "plm",
    "tarefas",
    "dam",
    "b2b",
    "creators",
  ],
});
