-- AlterTable
ALTER TABLE "Project" ADD COLUMN "atRisk" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "weeklyUpdate" TEXT;
ALTER TABLE "Project" ADD COLUMN "weeklyUpdateAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "definitionOfDone" TEXT;
ALTER TABLE "Task" ADD COLUMN "checkInNote" TEXT;
ALTER TABLE "Task" ADD COLUMN "lastCheckInAt" TIMESTAMP(3);
