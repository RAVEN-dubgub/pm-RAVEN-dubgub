import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PROJECT_TITLE = "Hult Cohort PM Platform";
const DEMO_REPO = "https://github.com/RAVEN-dubgub/pm-RAVEN-dubgub";
const DEMO_TASK_TITLE = "Add AI task coach panel";
const DEMO_TASK_DOD =
  "Coach API returns tips + Cursor prompt; copy buttons work; deployed on Vercel";
const OWNER_EMAIL = "wolfscotland@gmail.com";

async function main() {
  const owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!owner) {
    console.error(`User not found: ${OWNER_EMAIL}`);
    process.exit(1);
  }

  let project = await prisma.project.findFirst({
    where: { title: DEMO_PROJECT_TITLE, ownerId: owner.id, archived: false },
  });

  if (project) {
    project = await prisma.project.update({
      where: { id: project.id },
      data: {
        githubRepoUrl: DEMO_REPO,
        description:
          project.description ??
          "Cohort PM platform with holographic HUD and AI task coach for Cursor + GitHub.",
      },
    });
    console.log(`Updated project: ${project.id}`);
  } else {
    project = await prisma.project.create({
      data: {
        title: DEMO_PROJECT_TITLE,
        description:
          "Cohort PM platform with holographic HUD and AI task coach for Cursor + GitHub.",
        githubRepoUrl: DEMO_REPO,
        ownerId: owner.id,
      },
    });
    console.log(`Created project: ${project.id}`);
  }

  let task = await prisma.task.findFirst({
    where: { projectId: project.id, title: DEMO_TASK_TITLE, archived: false },
  });

  if (task) {
    task = await prisma.task.update({
      where: { id: task.id },
      data: {
        definitionOfDone: DEMO_TASK_DOD,
        assigneeId: owner.id,
        assignedById: owner.id,
        status: "IN_PROGRESS",
        priority: "HIGH",
      },
    });
    console.log(`Updated task: ${task.id}`);
  } else {
    task = await prisma.task.create({
      data: {
        title: DEMO_TASK_TITLE,
        description:
          "Ship the Task Coach panel: OpenAI tips, Cursor prompt, git/PR copy buttons.",
        definitionOfDone: DEMO_TASK_DOD,
        status: "IN_PROGRESS",
        priority: "HIGH",
        projectId: project.id,
        assigneeId: owner.id,
        assignedById: owner.id,
      },
    });
    console.log(`Created task: ${task.id}`);
  }

  console.log(JSON.stringify({ projectId: project.id, taskId: task.id, owner: owner.email }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
