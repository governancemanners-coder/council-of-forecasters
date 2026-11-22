import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>> | null = null;

/** Returns a MySQL drizzle client. Throws if DATABASE_URL is not configured. */
export function getDb() {
  if (!env.databaseUrl || env.databaseUrl.length < 8) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!instance) {
    instance = drizzle(env.databaseUrl, {
      mode: "planetscale",
      schema: fullSchema,
    });
  }
  return instance;
}
