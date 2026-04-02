import type { Config } from "drizzle-kit";

export default {
  schema: "./src/storage/database/shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://username:password@localhost:5432/tennis_link_prod",
  },
  strict: true,
  verbose: true,
} satisfies Config;