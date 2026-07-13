import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totalProjects, activeProjects, totalTasks, doneTasks, myTasks, overdueTasks, users] =
    await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { archived: false } }),
      prisma.task.count({ where: { project: { archived: false } } }),
      prisma.task.count({ where: { status: "DONE", project: { archived: false } } }),
      prisma.task.count({ where: { assigneeId: user.id, project: { archived: false } } }),
      prisma.task.count({
        where: {
          assigneeId: user.id,
          status: { not: "DONE" },
          dueDate: { lt: new Date() },
          project: { archived: false },
        },
      }),
      prisma.user.count(),
    ]);

  const completionRate = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const nextActions = await prisma.task.findMany({
    where: {
      assigneeId: user.id,
      status: { not: "DONE" },
      project: { archived: false },
    },
    include: {
      project: { select: { title: true } },
    },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
    take: 5,
  });

  return NextResponse.json({
    metrics: {
      totalProjects,
      activeProjects,
      totalTasks,
      doneTasks,
      completionRate,
      myOpenTasks: myTasks,
      overdueTasks,
      cohortMembers: users,
    },
    nextActions,
  });
}
