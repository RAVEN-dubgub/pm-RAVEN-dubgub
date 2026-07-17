import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const peerAssignmentOnboardingWhere = (userId) => ({
  assigneeId: { not: null },
  NOT: { assigneeId: userId },
  OR: [{ project: { ownerId: userId } }, { assignedById: userId }],
});

try {
  const joshua = await prisma.user.findUnique({
    where: { email: "wolfscotland@gmail.com" },
  });
  const smokeUser = await prisma.user.findFirst({
    where: { email: { contains: "smoke", mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
  });

  if (!joshua || !smokeUser) {
    throw new Error("Joshua or Smoke User not found");
  }

  const task = await prisma.task.findFirst({
    where: {
      project: { ownerId: joshua.id },
      title: "Review peer project submissions",
    },
  });

  if (!task) {
    throw new Error("Target task not found");
  }

  await prisma.task.update({
    where: { id: task.id },
    data: {
      assigneeId: smokeUser.id,
      assignedById: joshua.id,
    },
  });

  const peerCount = await prisma.task.count({
    where: peerAssignmentOnboardingWhere(joshua.id),
  });

  console.log("Updated task:", task.id, "-> assignee", smokeUser.email);
  console.log("myPeerAssignmentsEver:", peerCount);
} finally {
  await prisma.$disconnect();
}
