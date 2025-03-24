import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

const sql = neon(process.env.DATABASE_URL || "");
export const db = drizzle(sql, { schema });

export async function testConnection() {
  try {
    const result = await db.query.users.findMany({
      limit: 1,
    });
    return !!result;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}
