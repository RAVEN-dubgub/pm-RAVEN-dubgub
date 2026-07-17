-- Track who assigned a task to a cohort peer (supports cross-project onboarding step 4).
ALTER TABLE "Task" ADD COLUMN "assignedById" TEXT;

ALTER TABLE "Task"
ADD CONSTRAINT "Task_assignedById_fkey"
FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: project owners who assigned tasks to someone other than themselves.
UPDATE "Task" AS t
SET "assignedById" = p."ownerId"
FROM "Project" AS p
WHERE t."projectId" = p.id
  AND t."assigneeId" IS NOT NULL
  AND t."assigneeId" <> p."ownerId"
  AND t."assignedById" IS NULL;
