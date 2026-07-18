import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProjectManager } from "@/components/project-manager";
import { requireUser } from "@/lib/auth";
import { listProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const initialProjects = (await listProjects("active")).map((project) => ({
    ...project,
    weeklyUpdateAt: project.weeklyUpdateAt?.toISOString() ?? null,
    tasks: project.tasks.map((task) => ({
      ...task,
      dueDate: task.dueDate?.toISOString() ?? null,
    })),
  }));

  return (
    <AppShell userName={user.name}>
      <ProjectManager
        initialProjects={initialProjects}
        currentUserId={user.id}
      />
    </AppShell>
  );
}
