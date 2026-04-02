import type { Config } from "drizzle-kit";

export default {
  schema: "./src/storage/database/shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:postgres@localhost:5432/tennis_link_db",
  },
} satisfies Config;
