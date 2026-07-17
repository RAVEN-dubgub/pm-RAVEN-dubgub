import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const prisma = new PrismaClient();
const here = dirname(fileURLToPath(import.meta.url));
const migrationName = "0006_task_assigned_by";

try {
  const existing = await prisma.$queryRaw`
    SELECT migration_name FROM "_prisma_migrations"
    WHERE migration_name = ${migrationName}
  `;

  if (Array.isArray(existing) && existing.length > 0) {
    console.log("Migration already applied:", migrationName);
  } else {
    const sql = readFileSync(
      join(here, "..", "prisma", "migrations", migrationName, "migration.sql"),
      "utf8",
    );

    for (const statement of sql
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)) {
      await prisma.$executeRawUnsafe(`${statement};`);
      console.log("Applied:", statement.split("\n")[0]);
    }

    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (
        id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
      ) VALUES (
        gen_random_uuid()::text,
        '',
        NOW(),
        ${migrationName},
        NULL,
        NULL,
        NOW(),
        1
      )
    `;
    console.log("Recorded migration:", migrationName);
  }
} finally {
  await prisma.$disconnect();
}
