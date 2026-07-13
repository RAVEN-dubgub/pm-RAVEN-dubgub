import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalProjects,
    activeProjects,
    totalTasks,
    doneTasks,
    myOpenTasks,
    overdueTasks,
    cohortMembers,
    projectsWithTasks,
    myProjectsEver,
    myTasksEver,
    myPeerAssignmentsEver,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { archived: false } }),
    prisma.task.count({ where: { archived: false, project: { archived: false } } }),
    prisma.task.count({
      where: { status: "DONE", archived: false, project: { archived: false } },
    }),
    prisma.task.count({
      where: {
        assigneeId: user.id,
        status: { not: "DONE" },
        archived: false,
        project: { archived: false },
      },
    }),
    prisma.task.count({
      where: {
        assigneeId: user.id,
        status: { not: "DONE" },
        dueDate: { lt: new Date() },
        archived: false,
        project: { archived: false },
      },
    }),
    prisma.user.count(),
    prisma.project.findMany({
      where: { archived: false },
      include: { tasks: { where: { archived: false }, select: { status: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    // Onboarding: lifetime counts (include archived) so progress never regresses
    prisma.project.count({ where: { ownerId: user.id } }),
    prisma.task.count({ where: { project: { ownerId: user.id } } }),
    prisma.task.count({
      where: {
        project: { ownerId: user.id },
        AND: [
          { assigneeId: { not: null } },
          { assigneeId: { not: user.id } },
        ],
      },
    }),
  ]);

  const completionRate = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const projectProgress = projectsWithTasks.map((project) => {
    const done = project.tasks.filter((t) => t.status === "DONE").length;
    const total = project.tasks.length;
    return {
      id: project.id,
      title: project.title,
      done,
      total,
      progress: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  });

  const nextActions = await prisma.task.findMany({
    where: {
      assigneeId: user.id,
      status: { not: "DONE" },
      archived: false,
      project: { archived: false },
    },
    include: {
      project: { select: { title: true } },
    },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
    take: 5,
  });

  const onboarding = {
    hasProject: myProjectsEver > 0,
    hasTask: myTasksEver > 0,
    hasAssignment: myPeerAssignmentsEver > 0,
    completedSteps: [
      true,
      myProjectsEver > 0,
      myTasksEver > 0,
      myPeerAssignmentsEver > 0,
    ].filter(Boolean).length,
    totalSteps: 4,
  };

  return NextResponse.json({
    metrics: {
      totalProjects,
      activeProjects,
      totalTasks,
      doneTasks,
      completionRate,
      myOpenTasks,
      overdueTasks,
      cohortMembers,
    },
    projectProgress,
    nextActions,
    onboarding,
  });
}
