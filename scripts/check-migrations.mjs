import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

try {
  const result = await pool.query(`
    SELECT
      current_database() AS database_name,
      current_schema() AS schema_name,
      COUNT(*) AS migration_count
    FROM drizzle.__drizzle_migrations
  `);

  console.log(result.rows);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}