import type { Config } from "drizzle-kit";

export default {
  schema: "./src/app/main/database/drizzle/schema/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/event_ticketing",
  },
} satisfies Config;
