import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { parseGithubRepoUrl } from "@/lib/github-url";
import { prisma } from "@/lib/prisma";
import { listProjects, type ProjectListMode } from "@/lib/projects";

const projectSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  githubRepoUrl: z.string().max(500).optional().nullable(),
});

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode: ProjectListMode =
    searchParams.get("archived") === "true" ? "archived" : "active";

  const projects = await listProjects(mode);

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid project data" }, { status: 400 });
  }

  const github = parseGithubRepoUrl(parsed.data.githubRepoUrl);
  if (!github.ok) {
    return NextResponse.json({ error: github.error }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      githubRepoUrl: github.value,
      ownerId: user.id,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      tasks: true,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
