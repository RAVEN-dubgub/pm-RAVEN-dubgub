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
  }));

  return (
    <AppShell userName={user.name}>
      <div className="mb-4">
        <p className="jarvis-status-line">Project constellation · cohort workspaces</p>
        <h1 className="holo-brand mt-1 text-2xl sm:text-3xl">Projects HUD</h1>
      </div>
      <ProjectManager
        initialProjects={initialProjects}
        currentUserId={user.id}
      />
    </AppShell>
  );
}
