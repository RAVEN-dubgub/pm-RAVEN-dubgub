import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const joshua = await prisma.user.findUnique({
    where: { email: "wolfscotland@gmail.com" },
  });
  if (!joshua) {
    console.log("Joshua not found");
    process.exit(1);
  }

  console.log("Joshua:", joshua.id, joshua.name);

  const ownedProjects = await prisma.project.findMany({
    where: { ownerId: joshua.id },
    include: {
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log("\n=== Owned projects ===");
  for (const p of ownedProjects) {
    console.log(`- ${p.title} archived=${p.archived} tasks=${p.tasks.length}`);
    for (const t of p.tasks) {
      console.log(
        `    task "${t.title}" archived=${t.archived} assignee=${t.assignee?.email ?? "none"} (${t.assigneeId})`,
      );
    }
  }

  const myPeerAssignmentsEver = await prisma.task.count({
    where: {
      project: { ownerId: joshua.id },
      AND: [{ assigneeId: { not: null } }, { assigneeId: { not: joshua.id } }],
    },
  });

  const activeOwnedProjects = ownedProjects.filter((p) => !p.archived);
  const activeOwnedTasks = ownedProjects.flatMap((p) => p.tasks.filter((t) => !t.archived));

  console.log("\n=== Onboarding counts ===");
  console.log("myProjectsEver:", ownedProjects.length);
  console.log("myTasksEver:", ownedProjects.reduce((n, p) => n + p.tasks.length, 0));
  console.log("myPeerAssignmentsEver:", myPeerAssignmentsEver);
  console.log("activeOwnedProjects:", activeOwnedProjects.length);
  console.log("activeOwnedTasks:", activeOwnedTasks.length);

  const tasksAssignedToJoshuaOnOthersProjects = await prisma.task.findMany({
    where: {
      assigneeId: joshua.id,
      project: { ownerId: { not: joshua.id } },
    },
    include: {
      project: { select: { title: true, owner: { select: { name: true, email: true } } } },
    },
  });

  console.log("\n=== Tasks assigned TO Joshua on others' projects ===");
  console.log(JSON.stringify(tasksAssignedToJoshuaOnOthersProjects, null, 2));
} finally {
  await prisma.$disconnect();
}
