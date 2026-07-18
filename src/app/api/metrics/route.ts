import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { peerAssignmentOnboardingWhere } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { isSmokeUser } from "@/lib/smoke-users";
import { computeTaskProgress } from "@/lib/task-progress";

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
    myActiveOwnedProjects,
    activeAssigneeRows,
    peerOpenTaskRows,
    recentCompletionsRaw,
    peerAssignedTasksRaw,
    atRiskProjectsRaw,
    myOwnedProjectsRaw,
    staleCheckInTasksRaw,
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
      include: {
        owner: { select: { id: true, name: true, email: true } },
        tasks: { where: { archived: false }, select: { status: true, archived: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.project.count({ where: { ownerId: user.id } }),
    prisma.task.count({ where: { project: { ownerId: user.id } } }),
    prisma.task.count({ where: peerAssignmentOnboardingWhere(user.id) }),
    prisma.project.count({ where: { ownerId: user.id, archived: false } }),
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
    prisma.project.findMany({
      where: { archived: false, atRisk: true },
      select: {
        id: true,
        title: true,
        weeklyUpdate: true,
        weeklyUpdateAt: true,
        owner: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.project.findMany({
      where: { ownerId: user.id, archived: false },
      select: {
        id: true,
        title: true,
        weeklyUpdate: true,
        weeklyUpdateAt: true,
        atRisk: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.task.findMany({
      where: {
        assigneeId: user.id,
        status: "IN_PROGRESS",
        ...activeTaskWhere,
      },
      select: {
        id: true,
        title: true,
        checkInNote: true,
        lastCheckInAt: true,
        project: { select: { title: true } },
      },
      orderBy: [{ lastCheckInAt: "asc" }, { updatedAt: "desc" }],
      take: 8,
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

  const projectProgress = projectsWithTasks
    .filter((project) => !isSmokeUser(project.owner))
    .map((project) => {
      const { done, total, progress } = computeTaskProgress(project.tasks);
      return {
        id: project.id,
        title: project.title,
        done,
        total,
        progress,
        atRisk: project.atRisk,
      };
    });

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const checkInStaleMs = 2 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const staleWeeklyUpdates = myOwnedProjectsRaw.filter((project) => {
    if (!project.weeklyUpdateAt) return true;
    return now - project.weeklyUpdateAt.getTime() > weekMs;
  });

  const staleCheckIns = staleCheckInTasksRaw.filter((task) => {
    if (!task.lastCheckInAt) return true;
    return now - task.lastCheckInAt.getTime() > checkInStaleMs;
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
    needsActiveOwnedProject: myProjectsEver > 0 && myActiveOwnedProjects === 0,
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
      atRiskProjects: atRiskProjectsRaw.length,
      staleWeeklyUpdates: staleWeeklyUpdates.length,
      staleCheckIns: staleCheckIns.length,
    },
    projectProgress,
    atRiskProjects: atRiskProjectsRaw.map((project) => ({
      id: project.id,
      title: project.title,
      ownerName: project.owner.name,
      weeklyUpdate: project.weeklyUpdate,
      weeklyUpdateAt: project.weeklyUpdateAt?.toISOString() ?? null,
    })),
    habitNudges: {
      staleWeeklyUpdates: staleWeeklyUpdates.map((project) => ({
        id: project.id,
        title: project.title,
        weeklyUpdateAt: project.weeklyUpdateAt?.toISOString() ?? null,
        atRisk: project.atRisk,
      })),
      staleCheckIns: staleCheckIns.map((task) => ({
        id: task.id,
        title: task.title,
        projectTitle: task.project.title,
        lastCheckInAt: task.lastCheckInAt?.toISOString() ?? null,
        checkInNote: task.checkInNote,
      })),
    },
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
