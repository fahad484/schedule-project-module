import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migrations = [
  {
    hash: "f30225ac3fffb5547b8f69889e6db7fbf9610e79645304fa0da887f46eced4dd",
    created_at: 1793188066038,
  },
  {
    hash: "bd5a0e6a47c2e1f2892c1beaefaa40d21385848a75502c3488397fc2540be1c4",
    created_at: 1793634654157,
  },
];

try {
  await pool.query("BEGIN");

  for (const migration of migrations) {
    await pool.query(
      `INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
       SELECT $1, $2
       WHERE NOT EXISTS (
         SELECT 1 FROM drizzle.__drizzle_migrations
         WHERE hash = $1 OR created_at = $2
       )`,
      [migration.hash, migration.created_at]
    );
  }

  const result = await pool.query(`
    SELECT id, hash, created_at
    FROM drizzle.__drizzle_migrations
    ORDER BY created_at
  `);

  await pool.query("COMMIT");

  console.log("Migration history after baseline:");
  console.table(result.rows);
} catch (error) {
  await pool.query("ROLLBACK");
  console.error(error);
} finally {
  await pool.end();
}