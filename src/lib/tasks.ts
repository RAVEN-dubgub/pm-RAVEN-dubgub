import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type TaskListMode = "active" | "archived";

const taskListInclude = {
  project: { select: { id: true, title: true } },
  assignee: { select: { id: true, name: true, email: true } },
} as const;

export function taskListWhere(
  mode: TaskListMode,
  filters?: {
    projectId?: string;
    assigneeId?: string;
    status?: TaskStatus;
  },
) {
  return {
    archived: mode === "archived",
    project: { archived: false },
    ...(filters?.projectId ? { projectId: filters.projectId } : {}),
    ...(filters?.assigneeId ? { assigneeId: filters.assigneeId } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
  };
}

export async function listTasks(
  mode: TaskListMode = "active",
  filters?: {
    projectId?: string;
    assigneeId?: string;
    status?: TaskStatus;
  },
) {
  return prisma.task.findMany({
    where: taskListWhere(mode, filters),
    include: taskListInclude,
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
  });
}
