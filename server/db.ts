import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Create postgres connection
const client = postgres(process.env.DATABASE_URL || "", { max: 10 });
export const db = drizzle(client, { schema });

export async function testConnection() {
  try {
    const result = await db.select().from(schema.users).limit(1);
    console.log("Database connection successful");
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}
