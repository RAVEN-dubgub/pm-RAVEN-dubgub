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
  };
}

export default async function TasksPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const [tasks, users, projects] = await Promise.all([
    listTasks("active"),
    listUsers(),
    listProjects("active"),
  ]);

  return (
    <AppShell userName={user.name}>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-white">Tasks</h1>
        <p className="mt-2 text-slate-400">
          Create, assign, and filter tasks across the cohort.
        </p>
      </div>
      <TaskBoard
        initialTasks={tasks.map(serializeTask)}
        initialUsers={users}
        initialProjects={projects.map((project) => ({
          id: project.id,
          title: project.title,
        }))}
      />
    </AppShell>
  );
}
