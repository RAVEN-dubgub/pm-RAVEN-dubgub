import { PrismaClient } from "@prisma/client";

const DUPLICATE_ID = "cmrjqayin0003u69amb0gaj2p";

const prisma = new PrismaClient();

const task = await prisma.task.findUnique({
  where: { id: DUPLICATE_ID },
  include: {
    project: { select: { title: true } },
    assignee: { select: { name: true } },
  },
});

if (!task) {
  console.log("Duplicate task already removed:", DUPLICATE_ID);
} else {
  await prisma.task.delete({ where: { id: DUPLICATE_ID } });
  console.log(
    "Removed duplicate:",
    task.title,
    "|",
    task.project.title,
    "|",
    task.assignee?.name ?? "unassigned",
  );
}

await prisma.$disconnect();
