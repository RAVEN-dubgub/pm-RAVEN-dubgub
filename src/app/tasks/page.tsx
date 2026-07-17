import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TaskBoard } from "@/components/task-board";
import { requireUser } from "@/lib/auth";
import { listProjects } from "@/lib/projects";
import { listTasks } from "@/lib/tasks";
import { listUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

function serializeTask(
  task: Awaited<ReturnType<typeof listTasks>>[number],
) {
  return {
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    lastCheckInAt: task.lastCheckInAt?.toISOString() ?? null,
  };
}

type TasksPageProps = {
  searchParams: Promise<{ projectId?: string; project?: string }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const projectFilter = params.projectId ?? params.project ?? "";

  const [tasks, users, projects] = await Promise.all([
    listTasks("active", projectFilter ? { projectId: projectFilter } : undefined),
    listUsers(),
    listProjects("active"),
  ]);

  return (
    <AppShell userName={user.name}>
      <div className="mb-6">
        <h1 className="holo-brand text-3xl">Cohort tasks</h1>
        <p className="mt-2 text-slate-400">
          Create work, assign peers, and track what the cohort is shipping together.
        </p>
      </div>
      <TaskBoard
        initialTasks={tasks.map(serializeTask)}
        initialUsers={users}
        initialProjects={projects.map((project) => ({
          id: project.id,
          title: project.title,
        }))}
        currentUserId={user.id}
        initialProjectFilter={projectFilter}
      />
    </AppShell>
  );
}
