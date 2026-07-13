import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `CREATE INDEX IF NOT EXISTS "Task_projectId_archived_idx" ON "Task"("projectId", "archived")`,
  `CREATE INDEX IF NOT EXISTS "Task_assigneeId_archived_status_idx" ON "Task"("assigneeId", "archived", "status")`,
  `CREATE INDEX IF NOT EXISTS "Task_archived_dueDate_idx" ON "Task"("archived", "dueDate")`,
  `CREATE INDEX IF NOT EXISTS "Project_archived_updatedAt_idx" ON "Project"("archived", "updatedAt")`,
];

for (const sql of statements) {
  await prisma.$executeRawUnsafe(sql);
  console.log("OK:", sql.split("IF NOT EXISTS ")[1]?.split(" ON")[0] ?? sql);
}

await prisma.$disconnect();
