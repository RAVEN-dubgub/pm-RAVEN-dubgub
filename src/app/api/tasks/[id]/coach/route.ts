import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { generateTaskCoach } from "@/lib/task-coach";
import { prisma } from "@/lib/prisma";
import { taskListInclude } from "@/lib/tasks";

type RouteContext = { params: Promise<{ id: string }> };

const rateLimitWindowMs = 30_000;
const rateLimitStore = new Map<string, number>();

function rateLimitKey(userId: string, taskId: string) {
  return `${userId}:${taskId}`;
}

function checkRateLimit(userId: string, taskId: string) {
  const key = rateLimitKey(userId, taskId);
  const now = Date.now();
  const last = rateLimitStore.get(key);
  if (last !== undefined && now - last < rateLimitWindowMs) {
    return false;
  }
  rateLimitStore.set(key, now);
  return true;
}

function canRequestCoach(
  userId: string,
  task: {
    assigneeId: string | null;
    assignedById: string | null;
    project: { ownerId: string };
  },
) {
  return (
    task.assigneeId === userId ||
    task.assignedById === userId ||
    task.project.ownerId === userId
  );
}

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Task coach is not configured. Ask the site owner to set OPENAI_API_KEY on Vercel.",
      },
      { status: 503 },
    );
  }

  const { id } = await context.params;

  if (!checkRateLimit(user.id, id)) {
    return NextResponse.json(
      { error: "Please wait 30 seconds before requesting another plan for this task." },
      { status: 429 },
    );
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      ...taskListInclude,
      project: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          githubRepoUrl: true,
          owner: { select: { id: true, name: true, email: true } },
        },
      },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (!canRequestCoach(user.id, task)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const coach = await generateTaskCoach({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        definitionOfDone: task.definitionOfDone,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString() ?? null,
        blockedBy: task.blockedBy
          ? { title: task.blockedBy.title, status: task.blockedBy.status }
          : null,
      },
      project: {
        title: task.project.title,
        githubRepoUrl: task.project.githubRepoUrl,
      },
      assigneeName: task.assignee?.name ?? null,
      requesterName: user.name,
    });

    return NextResponse.json({ coach });
  } catch (error) {
    console.error("task coach error", error);
    return NextResponse.json(
      { error: "Could not generate plan. Try again in a moment." },
      { status: 500 },
    );
  }
}
