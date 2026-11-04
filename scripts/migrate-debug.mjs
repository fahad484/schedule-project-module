import dotenv from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

try {
  await migrate(db, {
    migrationsFolder: "./drizzle",
  });

  console.log("Migrations applied successfully!");
} catch (error) {
  console.error("Migration failed:");
  console.error(error);
  console.error("Cause:", error.cause);
  console.error("Code:", error.code);
  console.error("Detail:", error.detail);
} finally {
  await pool.end();
}