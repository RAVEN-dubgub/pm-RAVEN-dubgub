import { prisma } from "@/lib/prisma";

export type ProjectListMode = "active" | "archived";

const projectListInclude = {
  owner: { select: { id: true, name: true, email: true } },
  tasks: {
    where: { archived: false },
    select: { id: true, status: true, assigneeId: true, dueDate: true },
  },
  _count: { select: { tasks: true } },
} as const;

export function projectListWhere(mode: ProjectListMode) {
  return mode === "archived" ? { archived: true } : { archived: false };
}

export async function listProjects(mode: ProjectListMode = "active") {
  return prisma.project.findMany({
    where: projectListWhere(mode),
    include: projectListInclude,
    orderBy: { updatedAt: "desc" },
  });
}
