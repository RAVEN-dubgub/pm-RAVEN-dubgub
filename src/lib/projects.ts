import { prisma } from "@/lib/prisma";
import { deprioritizeSmoke } from "@/lib/smoke-users";

export type ProjectListMode = "active" | "archived";

const projectListInclude = {
  owner: { select: { id: true, name: true, email: true } },
  tasks: {
    where: { archived: false },
    select: { id: true, status: true, assigneeId: true, dueDate: true },
  },
  _count: { select: { tasks: true } },
} as const;

export type ProjectListItem = Awaited<ReturnType<typeof listProjects>>[number];

export function projectListWhere(mode: ProjectListMode) {
  return mode === "archived" ? { archived: true } : { archived: false };
}

export async function listProjects(mode: ProjectListMode = "active") {
  const projects = await prisma.project.findMany({
    where: projectListWhere(mode),
    include: projectListInclude,
    orderBy: { updatedAt: "desc" },
  });
  return deprioritizeSmoke(projects);
}
