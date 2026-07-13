import { TaskStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listTasks, taskListInclude, type TaskListMode } from "@/lib/tasks";

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  projectId: z.string().min(1),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode: TaskListMode =
    searchParams.get("archived") === "true" ? "archived" : "active";
  const projectId = searchParams.get("projectId") ?? undefined;
  const assigneeId = searchParams.get("assigneeId") ?? undefined;
  const statusParam = searchParams.get("status") as TaskStatus | null;
  const status =
    statusParam && Object.values(TaskStatus).includes(statusParam)
      ? statusParam
      : undefined;

  const tasks = await listTasks(mode, { projectId, assigneeId, status });

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid task data" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, archived: false },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (parsed.data.assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: parsed.data.assigneeId } });
    if (!assignee) {
      return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
    }
  }

  const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
  const recentDuplicate = await prisma.task.findFirst({
    where: {
      title: parsed.data.title,
      projectId: parsed.data.projectId,
      assigneeId: parsed.data.assigneeId ?? null,
      archived: false,
      dueDate,
      createdAt: { gte: new Date(Date.now() - 30_000) },
    },
    include: taskListInclude,
  });
  if (recentDuplicate) {
    return NextResponse.json({ task: recentDuplicate });
  }

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status ?? TaskStatus.TODO,
      projectId: parsed.data.projectId,
      assigneeId: parsed.data.assigneeId ?? null,
      dueDate,
    },
    include: taskListInclude,
  });

  return NextResponse.json({ task }, { status: 201 });
}
