import { TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type TaskListMode = "active" | "archived";

export const taskListInclude = {
  project: {
    select: {
      id: true,
      title: true,
      ownerId: true,
      githubRepoUrl: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  },
  assignee: { select: { id: true, name: true, email: true } },
  blockedBy: { select: { id: true, title: true, status: true } },
} as const;

export function taskListWhere(
  mode: TaskListMode,
  filters?: {
    projectId?: string;
    assigneeId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
  },
) {
  return {
    archived: mode === "archived",
    project: { archived: false },
    ...(filters?.projectId ? { projectId: filters.projectId } : {}),
    ...(filters?.assigneeId ? { assigneeId: filters.assigneeId } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.priority ? { priority: filters.priority } : {}),
  };
}

export async function listTasks(
  mode: TaskListMode = "active",
  filters?: {
    projectId?: string;
    assigneeId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
  },
) {
  return prisma.task.findMany({
    where: taskListWhere(mode, filters),
    include: taskListInclude,
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
  });
}

export async function wouldCreateCircularBlock(
  taskId: string,
  blockedById: string | null,
) {
  if (!blockedById) return false;
  if (taskId === blockedById) return true;

  let currentId: string | null = blockedById;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === taskId) return true;
    if (visited.has(currentId)) return true;
    visited.add(currentId);

    const blockerTask: { blockedById: string | null } | null = await prisma.task.findUnique({
      where: { id: currentId },
      select: { blockedById: true },
    });
    currentId = blockerTask?.blockedById ?? null;
  }

  return false;
}

export async function validateBlocker(
  taskId: string | null,
  blockedById: string | null,
  projectId: string,
) {
  if (!blockedById) return null;

  if (taskId && taskId === blockedById) {
    return "A task cannot block itself";
  }

  const blocker = await prisma.task.findFirst({
    where: { id: blockedById, projectId, archived: false },
    select: { id: true },
  });
  if (!blocker) {
    return "Blocker task must be in the same project";
  }

  if (taskId && (await wouldCreateCircularBlock(taskId, blockedById))) {
    return "This would create a circular dependency";
  }

  return null;
}
