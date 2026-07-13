import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const prisma = new PrismaClient();
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationName = "0003_task_query_indexes";
const sql = readFileSync(
  join(root, "prisma", "migrations", migrationName, "migration.sql"),
  "utf8",
);
const checksum = createHash("sha256").update(sql).digest("hex");

const existing = await prisma.$queryRaw`
  SELECT migration_name FROM "_prisma_migrations" WHERE migration_name = ${migrationName}
`;

if (Array.isArray(existing) && existing.length > 0) {
  console.log("Migration already recorded:", migrationName);
} else {
  await prisma.$executeRaw`
    INSERT INTO "_prisma_migrations" (
      id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
    ) VALUES (
      gen_random_uuid()::text, ${checksum}, NOW(), ${migrationName}, NULL, NULL, NOW(), 1
    )
  `;
  console.log("Recorded migration:", migrationName);
}

const rows = await prisma.$queryRaw`SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at`;
console.log(rows);

await prisma.$disconnect();
