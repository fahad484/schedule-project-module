import fs from "node:fs";
import crypto from "node:crypto";

const journal = JSON.parse(
  fs.readFileSync("./drizzle/meta/_journal.json", "utf8")
);

for (const entry of journal.entries.slice(0, 2)) {
  const file = `./drizzle/${entry.tag}.sql`;
  const sql = fs.readFileSync(file, "utf8");

  const hash = crypto
    .createHash("sha256")
    .update(sql)
    .digest("hex");

  console.log(
    `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('${hash}', ${entry.when});`
  );
}