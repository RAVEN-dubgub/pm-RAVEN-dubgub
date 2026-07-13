"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatDueDate,
  isDueSoon,
  isOverdue,
  statusColorClass,
  statusLabel,
} from "@/lib/types";

type UserOption = { id: string; name: string; email: string };
type ProjectOption = { id: string; title: string };
type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  archived: boolean;
  dueDate: string | null;
  project: { id: string; title: string };
  assignee: UserOption | null;
};

type TaskBoardProps = {
  initialTasks: TaskItem[];
  initialUsers: UserOption[];
  initialProjects: ProjectOption[];
};

export function TaskBoard({
  initialTasks,
  initialUsers,
  initialProjects,
}: TaskBoardProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const users = initialUsers;
  const projects = initialProjects;
  const [projectFilter, setProjectFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(initialProjects[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(true);
  const skipInitialFetch = useRef(true);

  const hasActiveFilters = Boolean(projectFilter || assigneeFilter || statusFilter);
  const usesDefaultView = !showArchived && !hasActiveFilters;

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (showArchived) params.set("archived", "true");
    if (projectFilter) params.set("projectId", projectFilter);
    if (assigneeFilter) params.set("assigneeId", assigneeFilter);
    if (statusFilter) params.set("status", statusFilter);
    return params.toString();
  }, [showArchived, projectFilter, assigneeFilter, statusFilter]);

  async function fetchTasks() {
    setListError(null);
    setListLoading(true);
    const response = await fetch(`/api/tasks${query ? `?${query}` : ""}`, {
      credentials: "same-origin",
    });
    if (response.ok) {
      const data = await response.json();
      setTasks(data.tasks);
    } else {
      setListError("Could not load tasks. Try refreshing or signing in again.");
    }
    setListLoading(false);
  }

  useEffect(() => {
    if (usesDefaultView && skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }

    let active = true;
    async function loadFilteredTasks() {
      setListError(null);
      setListLoading(true);
      const response = await fetch(`/api/tasks${query ? `?${query}` : ""}`, {
        credentials: "same-origin",
      });
      if (!active) return;
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      } else {
        setListError("Could not load tasks. Try refreshing or signing in again.");
      }
      setListLoading(false);
    }
    void loadFilteredTasks();
    return () => {
      active = false;
    };
  }, [query, usesDefaultView]);

  async function createTask(event: React.FormEvent) {
    event.preventDefault();
    if (isCreating) return;

    setError("");
    setIsCreating(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
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

      const data = await response.json();
      const createdTask = data.task as TaskItem;

      setTitle("");
      setDescription("");
      setDueDate("");
      setAssigneeId("");

      if (usesDefaultView && !createdTask.archived) {
        setTasks((current) => {
          if (current.some((task) => task.id === createdTask.id)) {
            return current;
          }
          return [createdTask, ...current];
        });
      } else {
        await fetchTasks();
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function updateTask(id: string, patch: Record<string, unknown>) {
    const previous = tasks;
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== id) return task;
        const next = { ...task, ...patch } as TaskItem;
        if ("assigneeId" in patch) {
          const nextAssigneeId = patch.assigneeId as string | null;
          next.assignee =
            nextAssigneeId == null
              ? null
              : (users.find((user) => user.id === nextAssigneeId) ?? task.assignee);
        }
        return next;
      }),
    );

    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setTasks(previous);
      setListError("Could not update task. Please try again.");
      return;
    }

    const data = await response.json();
    const updatedTask = data.task as TaskItem;
    setTasks((current) =>
      current.map((task) => (task.id === id ? updatedTask : task)),
    );
  }

  async function archiveTask(id: string, archived: boolean) {
    const action = archived ? "archive" : "restore";
    const confirmed = window.confirm(
      archived
        ? "Archive this task? It will be hidden from the active list until you restore it."
        : "Restore this task to the active list?",
    );
    if (!confirmed) return;

    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ archived }),
    });

    if (!response.ok) {
      setListError(`Could not ${action} task. Please try again.`);
      return;
    }

    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function clearFilters() {
    setProjectFilter("");
    setAssigneeFilter("");
    setStatusFilter("");
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-white">No projects yet</h2>
        <p className="mt-2 text-sm text-slate-400">
          Create a project first, then add tasks and assign them to cohort peers.
        </p>
        <Link
          href="/projects"
          className="mt-4 inline-block rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
        >
          Create your first project
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create task</h2>
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="text-sm text-slate-400 hover:text-white md:hidden"
            aria-expanded={showCreateForm}
          >
            {showCreateForm ? "Hide form" : "Show form"}
          </button>
        </div>
        {showCreateForm && (
          <form onSubmit={createTask} className="grid gap-3 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="sr-only">Task title</span>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="Task title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                disabled={isCreating}
                aria-label="Task title"
              />
            </label>
            <label className="md:col-span-2">
              <span className="sr-only">Description</span>
              <textarea
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="Description (optional)"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                disabled={isCreating}
                aria-label="Task description"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Project</span>
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                required
                disabled={isCreating}
                aria-label="Select project"
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Assignee</span>
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
                disabled={isCreating}
                aria-label="Assign to cohort member"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Due date</span>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                disabled={isCreating}
                aria-label="Due date"
              />
            </label>
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 md:self-end"
            >
              {isCreating ? "Adding…" : "Add task"}
            </button>
          </form>
        )}
        {error && (
          <p className="mt-2 text-sm text-rose-400" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Task list
            <span className="ml-2 text-sm font-normal text-slate-400">
              ({tasks.length} shown)
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
              />
              Show archived only
            </label>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {listError ? (
          <div
            className="mb-4 rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200"
            role="alert"
          >
            {listError}
          </div>
        ) : null}
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <label>
            <span className="mb-1 block text-xs text-slate-400">Project</span>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              aria-label="Filter by project"
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Assignee</span>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={assigneeFilter}
              onChange={(event) => setAssigneeFilter(event.target.value)}
              aria-label="Filter by assignee"
            >
              <option value="">All assignees</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Status</span>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
            </select>
          </label>
        </div>

        {listLoading ? (
          <div className="space-y-3" aria-live="polite" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center">
                <p className="text-sm text-slate-400">
                  {showArchived
                    ? "No archived tasks."
                    : hasActiveFilters
                      ? "No tasks match these filters."
                      : "No tasks yet — add one above to get started."}
                </p>
                {!showArchived && !hasActiveFilters && (
                  <>
                    <p className="mt-2 text-xs text-slate-500">
                      Archived tasks are hidden by default. Use &quot;Show archived
                      only&quot; to find and restore them.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowArchived(true)}
                      className="mt-4 text-sm text-cyan-400 hover:text-cyan-300"
                    >
                      Check archived tasks →
                    </button>
                  </>
                )}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-2 text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
            {tasks.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status);
              const dueSoon = isDueSoon(task.dueDate, task.status);

              return (
                <article
                  key={task.id}
                  className={`rounded-xl border p-4 ${
                    overdue
                      ? "border-rose-500/40 bg-rose-950/20"
                      : "border-slate-800 bg-slate-950/70"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-white">{task.title}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColorClass(task.status)}`}
                        >
                          {statusLabel(task.status)}
                        </span>
                        {overdue && (
                          <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-300">
                            Overdue
                          </span>
                        )}
                        {!overdue && dueSoon && (
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                            Due soon
                          </span>
                        )}
                        {task.archived && (
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                            Archived
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{task.project.title}</p>
                      {task.description && (
                        <p className="mt-2 text-sm text-slate-300">{task.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!task.archived && (
                        <>
                          <label className="sr-only" htmlFor={`status-${task.id}`}>
                            Update status for {task.title}
                          </label>
                          <select
                            id={`status-${task.id}`}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
                            value={task.status}
                            onChange={(event) =>
                              updateTask(task.id, { status: event.target.value })
                            }
                            aria-label={`Status for ${task.title}`}
                          >
                            <option value="TODO">To do</option>
                            <option value="IN_PROGRESS">In progress</option>
                            <option value="DONE">Done</option>
                          </select>
                          <label className="sr-only" htmlFor={`assignee-${task.id}`}>
                            Assign {task.title}
                          </label>
                          <select
                            id={`assignee-${task.id}`}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
                            value={task.assignee?.id ?? ""}
                            onChange={(event) =>
                              updateTask(task.id, {
                                assigneeId: event.target.value || null,
                              })
                            }
                            aria-label={`Assignee for ${task.title}`}
                          >
                            <option value="">Unassigned</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => archiveTask(task.id, !task.archived)}
                        className="rounded-lg border border-slate-700 px-2 py-1 text-sm text-slate-400 hover:text-white"
                      >
                        {task.archived ? "Restore task" : "Archive task"}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {task.assignee ? task.assignee.name : "Unassigned"}
                    {task.dueDate ? ` · Due ${formatDueDate(task.dueDate)}` : ""}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
