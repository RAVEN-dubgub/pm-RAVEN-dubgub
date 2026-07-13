import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const dupes = await prisma.$queryRaw`
  SELECT
    t.title,
    t."projectId",
    t."assigneeId",
    p.title AS project_title,
    u.name AS assignee_name,
    COUNT(*)::int AS cnt,
    array_agg(t.id ORDER BY t."createdAt") AS ids,
    array_agg(t."createdAt" ORDER BY t."createdAt") AS created
  FROM "Task" t
  JOIN "Project" p ON p.id = t."projectId"
  LEFT JOIN "User" u ON u.id = t."assigneeId"
  WHERE t.archived = false
  GROUP BY t.title, t."projectId", t."assigneeId", p.title, u.name
  HAVING COUNT(*) > 1
`;

console.log(JSON.stringify(dupes, (_, v) => (v instanceof Date ? v.toISOString() : v), 2));

await prisma.$disconnect();
