-- Speed up common task and project list filters
CREATE INDEX IF NOT EXISTS "Task_projectId_archived_idx" ON "Task"("projectId", "archived");
CREATE INDEX IF NOT EXISTS "Task_assigneeId_archived_status_idx" ON "Task"("assigneeId", "archived", "status");
CREATE INDEX IF NOT EXISTS "Task_archived_dueDate_idx" ON "Task"("archived", "dueDate");
CREATE INDEX IF NOT EXISTS "Project_archived_updatedAt_idx" ON "Project"("archived", "updatedAt");
