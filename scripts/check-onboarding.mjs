import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  console.log("=== USERS ===");
  console.log(JSON.stringify(users, null, 2));

  const joshua = users.find((u) => u.email.toLowerCase().includes("wolfscotland"));
  if (!joshua) {
    console.log("Joshua not found");
    process.exit(0);
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: joshua.id },
    include: {
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  console.log("=== JOSHUA PROJECTS & TASKS ===");
  console.log(JSON.stringify(projects, null, 2));

  const peerCount = await prisma.task.count({
    where: {
      project: { ownerId: joshua.id },
      AND: [{ assigneeId: { not: null } }, { assigneeId: { not: joshua.id } }],
    },
  });
  console.log("=== myPeerAssignmentsEver count ===", peerCount);

  // Also check all tasks with assignees across all users
  const allAssigned = await prisma.task.findMany({
    where: { assigneeId: { not: null } },
    include: {
      project: { select: { title: true, owner: { select: { name: true, email: true } } } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });
  console.log("=== ALL ASSIGNED TASKS ===");
  console.log(JSON.stringify(allAssigned, null, 2));

  const activeJoshua = await prisma.task.findMany({
    where: { project: { ownerId: joshua.id }, archived: false },
    include: { assignee: { select: { name: true } } },
  });
  console.log("=== JOSHUA ACTIVE TASKS ===");
  console.log(JSON.stringify(activeJoshua, null, 2));
} finally {
  await prisma.$disconnect();
}
