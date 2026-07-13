import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProjectManager } from "@/components/project-manager";
import { requireUser } from "@/lib/auth";
import { listProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const initialProjects = await listProjects("active");

  return (
    <AppShell userName={user.name}>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-white">Cohort projects</h1>
        <p className="mt-2 text-slate-400">
          Shared workspaces where the cohort plans and ships work together.
        </p>
      </div>
      <ProjectManager
        initialProjects={initialProjects}
        currentUserId={user.id}
      />
    </AppShell>
  );
}
