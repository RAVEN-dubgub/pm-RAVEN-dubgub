import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const activeTaskWhere = {
  archived: false,
  project: { archived: false },
} as const;

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
    todoTasks,
    inProgressTasks,
    myOpenTasks,
    myDoneTasks,
    overdueTasks,
    cohortMembers,
    projectsWithTasks,
    myProjectsEver,
    myTasksEver,
    myPeerAssignmentsEver,
    activeAssigneeRows,
    peerOpenTaskRows,
    recentCompletionsRaw,
    peerAssignedTasksRaw,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { archived: false } }),
    prisma.task.count({ where: activeTaskWhere }),
    prisma.task.count({
      where: { status: "DONE", ...activeTaskWhere },
    }),
    prisma.task.count({
      where: { status: "TODO", ...activeTaskWhere },
    }),
    prisma.task.count({
      where: { status: "IN_PROGRESS", ...activeTaskWhere },
    }),
    prisma.task.count({
      where: {
        assigneeId: user.id,
        status: { not: "DONE" },
        ...activeTaskWhere,
      },
    }),
    prisma.task.count({
      where: {
        assigneeId: user.id,
        status: "DONE",
        ...activeTaskWhere,
      },
    }),
    prisma.task.count({
      where: {
        assigneeId: user.id,
        status: { not: "DONE" },
        dueDate: { lt: new Date() },
        ...activeTaskWhere,
      },
    }),
    prisma.user.count(),
    prisma.project.findMany({
      where: { archived: false },
      include: { tasks: { where: { archived: false }, select: { status: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.project.count({ where: { ownerId: user.id } }),
    prisma.task.count({ where: { project: { ownerId: user.id } } }),
    prisma.task.count({
      where: {
        project: { ownerId: user.id },
        AND: [{ assigneeId: { not: null } }, { assigneeId: { not: user.id } }],
      },
    }),
    prisma.task.findMany({
      where: {
        assigneeId: { not: null },
        status: { not: "DONE" },
        ...activeTaskWhere,
      },
      select: { assigneeId: true },
      distinct: ["assigneeId"],
    }),
    prisma.task.findMany({
      where: {
        assigneeId: { not: null, notIn: [user.id] },
        status: { not: "DONE" },
        ...activeTaskWhere,
      },
      select: { assigneeId: true },
      distinct: ["assigneeId"],
    }),
    prisma.task.findMany({
      where: { status: "DONE", ...activeTaskWhere },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.task.findMany({
      where: {
        assigneeId: user.id,
        status: { not: "DONE" },
        project: { archived: false, ownerId: { not: user.id } },
        archived: false,
      },
      include: {
        project: {
          select: {
            title: true,
            owner: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
      take: 10,
    }),
  ]);

  const completionRate = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
  const myContributionPercent =
    doneTasks === 0 ? 0 : Math.round((myDoneTasks / doneTasks) * 100);
  const activeMembers = activeAssigneeRows.length;
  const peersWithOpenTasks = peerOpenTaskRows.length;
  const peerAssignedUnstarted = peerAssignedTasksRaw.filter(
    (task) => task.status === "TODO",
  ).length;

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
      ...activeTaskWhere,
    },
    include: {
      project: {
        select: {
          title: true,
          ownerId: true,
          owner: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
    take: 5,
  });

  const otherCohortMembers = Math.max(0, cohortMembers - 1);

  const onboarding = {
    hasProject: myProjectsEver > 0,
    hasTask: myTasksEver > 0,
    hasAssignment: myPeerAssignmentsEver > 0,
    otherCohortMembers,
    completedSteps: [
      true,
      myProjectsEver > 0,
      myTasksEver > 0,
      myPeerAssignmentsEver > 0,
    ].filter(Boolean).length,
    totalSteps: 4,
  };

  const recentCompletions = recentCompletionsRaw.map((task) => ({
    id: task.id,
    title: task.title,
    projectTitle: task.project.title,
    assigneeName: task.assignee?.name ?? "Someone",
    completedAt: task.updatedAt.toISOString(),
  }));

  const peerAssignedTasks = peerAssignedTasksRaw.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    dueDate: task.dueDate?.toISOString() ?? null,
    projectTitle: task.project.title,
    fromName: task.project.owner.name,
    fromId: task.project.owner.id,
  }));

  return NextResponse.json({
    metrics: {
      totalProjects,
      activeProjects,
      totalTasks,
      doneTasks,
      completionRate,
      myOpenTasks,
      myDoneTasks,
      myContributionPercent,
      overdueTasks,
      cohortMembers,
      activeMembers,
      peersWithOpenTasks,
      peerAssignedUnstarted,
    },
    projectProgress,
    nextActions: nextActions.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      dueDate: task.dueDate?.toISOString() ?? null,
      project: { title: task.project.title },
      fromPeer:
        task.project.ownerId !== user.id
          ? { id: task.project.owner.id, name: task.project.owner.name }
          : null,
    })),
    peerAssignedTasks,
    recentCompletions,
    onboarding,
    tasksByStatus: {
      todo: todoTasks,
      inProgress: inProgressTasks,
      done: doneTasks,
      total: totalTasks,
    },
  });
}
