import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listProjects, type ProjectListMode } from "@/lib/projects";

const projectSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
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

  const project = await prisma.project.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      ownerId: user.id,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      tasks: true,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
