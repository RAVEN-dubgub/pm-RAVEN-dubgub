import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { parseGithubRepoUrl } from "@/lib/github-url";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
  archived: z.boolean().optional(),
  atRisk: z.boolean().optional(),
  weeklyUpdate: z.string().max(2000).optional().nullable(),
  githubRepoUrl: z.string().max(500).optional().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      tasks: {
        where: { archived: false },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update data" }, { status: 400 });
  }

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (existing.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (parsed.data.githubRepoUrl !== undefined) {
    const github = parseGithubRepoUrl(parsed.data.githubRepoUrl);
    if (!github.ok) {
      return NextResponse.json({ error: github.error }, { status: 400 });
    }
  }

  const data: {
    title?: string;
    description?: string | null;
    archived?: boolean;
    atRisk?: boolean;
    weeklyUpdate?: string | null;
    weeklyUpdateAt?: Date | null;
    githubRepoUrl?: string | null;
  } = { ...parsed.data };

  if (parsed.data.githubRepoUrl !== undefined) {
    const github = parseGithubRepoUrl(parsed.data.githubRepoUrl);
    data.githubRepoUrl = github.ok ? github.value : null;
  }

  if (parsed.data.weeklyUpdate !== undefined) {
    data.weeklyUpdateAt = parsed.data.weeklyUpdate ? new Date() : null;
  }

  const project = await prisma.project.update({
    where: { id },
    data,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      tasks: {
        where: { archived: false },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json({ project });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (existing.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
