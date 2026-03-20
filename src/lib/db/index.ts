import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy connection: only initialize when first used at runtime
// This prevents build-time errors when DATABASE_URL isn't set
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set. Run: vercel env pull");
    }
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export type Database = ReturnType<typeof getDb>;
