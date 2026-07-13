"use client";

import { useEffect, useMemo, useState } from "react";
import { statusLabel } from "@/lib/types";

type UserOption = { id: string; name: string; email: string };
type ProjectOption = { id: string; title: string };
type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: string | null;
  project: { id: string; title: string };
  assignee: UserOption | null;
};

export function TaskBoard() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (projectFilter) params.set("projectId", projectFilter);
    if (assigneeFilter) params.set("assigneeId", assigneeFilter);
    if (statusFilter) params.set("status", statusFilter);
    return params.toString();
  }, [projectFilter, assigneeFilter, statusFilter]);

  async function loadData() {
    const [taskRes, userRes, projectRes] = await Promise.all([
      fetch(`/api/tasks${query ? `?${query}` : ""}`),
      fetch("/api/users"),
      fetch("/api/projects"),
    ]);

    if (taskRes.ok) {
      const data = await taskRes.json();
      setTasks(data.tasks);
    }
    if (userRes.ok) {
      const data = await userRes.json();
      setUsers(data.users);
    }
    if (projectRes.ok) {
      const data = await projectRes.json();
      setProjects(data.projects.map((project: { id: string; title: string }) => ({
        id: project.id,
        title: project.title,
      })));
      if (!projectId && data.projects[0]) {
        setProjectId(data.projects[0].id);
      }
    }
  }

  useEffect(() => {
    let active = true;
    async function fetchData() {
      const [taskRes, userRes, projectRes] = await Promise.all([
        fetch(`/api/tasks${query ? `?${query}` : ""}`),
        fetch("/api/users"),
        fetch("/api/projects"),
      ]);

      if (!active) return;

      if (taskRes.ok) {
        const data = await taskRes.json();
        setTasks(data.tasks);
      }
      if (userRes.ok) {
        const data = await userRes.json();
        setUsers(data.users);
      }
      if (projectRes.ok) {
        const data = await projectRes.json();
        setProjects(
          data.projects.map((project: { id: string; title: string }) => ({
            id: project.id,
            title: project.title,
          })),
        );
        if (data.projects[0]) {
          setProjectId((current) => current || data.projects[0].id);
        }
      }
    }
    void fetchData();
    return () => {
      active = false;
    };
  }, [query]);

  async function createTask(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        projectId,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Could not create task");
      return;
    }

    setTitle("");
    setDescription("");
    setDueDate("");
    await loadData();
  }

  async function updateTask(id: string, patch: Record<string, unknown>) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await loadData();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="mb-4 text-lg font-semibold">Create task</h2>
        <form onSubmit={createTask} className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 md:col-span-2"
            placeholder="Task title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
          <textarea
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 md:col-span-2"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
          />
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            required
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400"
          >
            Add task
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
          >
            <option value="">All assignees</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div className="space-y-3">
          {tasks.length === 0 && (
            <p className="text-sm text-slate-400">No tasks match these filters.</p>
          )}
          {tasks.map((task) => (
            <article
              key={task.id}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-white">{task.title}</h3>
                  <p className="text-sm text-slate-400">{task.project.title}</p>
                  {task.description && (
                    <p className="mt-2 text-sm text-slate-300">{task.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
                    value={task.status}
                    onChange={(event) =>
                      updateTask(task.id, { status: event.target.value })
                    }
                  >
                    <option value="TODO">To do</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="DONE">Done</option>
                  </select>
                  <select
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
                    value={task.assignee?.id ?? ""}
                    onChange={(event) =>
                      updateTask(task.id, {
                        assigneeId: event.target.value || null,
                      })
                    }
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {statusLabel(task.status)}
                {task.assignee ? ` · ${task.assignee.name}` : " · Unassigned"}
                {task.dueDate
                  ? ` · Due ${new Date(task.dueDate).toLocaleDateString()}`
                  : ""}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
