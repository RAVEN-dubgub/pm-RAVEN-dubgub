"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HoloWorkspace } from "@/components/holo-workspace";
import { TaskHudFilters, TaskHudView } from "@/components/task-hud-view";
import { useHoloRingReadout } from "@/lib/holo-ring-context";
import { TASK_STATUSES } from "@/lib/types";

type UserOption = { id: string; name: string; email: string };
type ProjectOwner = { id: string; name: string; email: string };
type BlockerRef = { id: string; title: string; status: "TODO" | "IN_PROGRESS" | "DONE" };
type ProjectOption = { id: string; title: string; ownerId?: string; owner?: ProjectOwner };
type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  definitionOfDone: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  archived: boolean;
  dueDate: string | null;
  checkInNote: string | null;
  lastCheckInAt: string | null;
  project: {
    id: string;
    title: string;
    ownerId: string;
    githubRepoUrl?: string | null;
    owner: ProjectOwner;
  };
  assignee: UserOption | null;
  blockedBy: BlockerRef | null;
};

type TaskBoardProps = {
  initialTasks: TaskItem[];
  initialUsers: UserOption[];
  initialProjects: ProjectOption[];
  currentUserId: string;
  initialProjectFilter?: string;
};

type ViewMode = "hud" | "board" | "list";

function assigneeLabel(user: UserOption, currentUserId: string) {
  const name = user.name.trim() || user.email;
  return user.id === currentUserId ? `${name} (you)` : name;
}

export function TaskBoard({
  initialTasks,
  initialUsers,
  initialProjects,
  currentUserId,
  initialProjectFilter = "",
}: TaskBoardProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const users = initialUsers;
  const projects = initialProjects;
  const [projectFilter, setProjectFilter] = useState(initialProjectFilter);
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("hud");
  const [showArchived, setShowArchived] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(
    initialProjectFilter || initialProjects[0]?.id || "",
  );
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [blockedById, setBlockedById] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [definitionOfDone, setDefinitionOfDone] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { setReadout } = useHoloRingReadout();
  const [checkInDrafts, setCheckInDrafts] = useState<Record<string, string>>({});
  const skipInitialFetch = useRef(true);

  const hasActiveFilters = Boolean(
    projectFilter || assigneeFilter || statusFilter || priorityFilter,
  );
  const usesDefaultView = !showArchived && !hasActiveFilters;

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (showArchived) params.set("archived", "true");
    if (projectFilter) params.set("projectId", projectFilter);
    if (assigneeFilter) params.set("assigneeId", assigneeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    return params.toString();
  }, [showArchived, projectFilter, assigneeFilter, statusFilter, priorityFilter]);

  const createBlockerOptions = useMemo(
    () => tasks.filter((task) => task.project.id === projectId && !task.archived),
    [tasks, projectId],
  );

  function blockerOptionsForTask(task: TaskItem) {
    return tasks.filter(
      (candidate) =>
        candidate.project.id === task.project.id &&
        candidate.id !== task.id &&
        !candidate.archived,
    );
  }

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
          definitionOfDone: definitionOfDone || undefined,
          projectId,
          assigneeId: assigneeId || null,
          priority,
          blockedById: blockedById || null,
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
      setDefinitionOfDone("");
      setDueDate("");
      setAssigneeId("");
      setBlockedById("");
      setPriority("MEDIUM");

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
        if ("blockedById" in patch) {
          const nextBlockedById = patch.blockedById as string | null;
          next.blockedBy =
            nextBlockedById == null
              ? null
              : (tasks.find((candidate) => candidate.id === nextBlockedById) ?? task.blockedBy);
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
      const data = await response.json().catch(() => ({}));
      setListError(data.error ?? "Could not update task. Please try again.");
      return;
    }

    const data = await response.json();
    const updatedTask = data.task as TaskItem;
    setTasks((current) =>
      current.map((task) => (task.id === id ? updatedTask : task)),
    );
  }

  async function submitCheckIn(task: TaskItem) {
    const note = (checkInDrafts[task.id] ?? "").trim();
    if (!note) return;
    await updateTask(task.id, { checkInNote: note });
    setCheckInDrafts((current) => {
      const next = { ...current };
      delete next[task.id];
      return next;
    });
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
    setPriorityFilter("");
  }

  const taskCounts = useMemo(
    () => ({
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: tasks.filter((t) => t.status === "DONE").length,
      high: tasks.filter((t) => t.priority === "HIGH").length,
    }),
    [tasks],
  );

  useEffect(() => {
    setReadout({
      metric: tasks.length,
      primary: "TASKS",
      secondary: `${taskCounts.done} done · ${taskCounts.inProgress} active`,
    });
    return () => setReadout(null);
  }, [tasks.length, taskCounts.done, taskCounts.inProgress, setReadout]);

  if (projects.length === 0) {
    return (
      <div className="holo-panel border-dashed px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-white">No projects yet</h2>
        <p className="mt-2 text-sm text-slate-400">
          Create a project first, then add tasks and assign them to cohort peers.
        </p>
        <Link
          href="/projects"
          className="holo-btn-primary mt-4 inline-block px-4 py-2 text-sm"
        >
          Create your first project
        </Link>
      </div>
    );
  }

  const createForm = (
    <form onSubmit={createTask} className="grid gap-3 md:grid-cols-2">
      <label className="md:col-span-2">
        <span className="sr-only">Task title</span>
        <input
          className="holo-input w-full px-3 py-2"
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
          className="holo-input w-full px-3 py-2"
          placeholder="Description (optional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          disabled={isCreating}
          aria-label="Task description"
        />
      </label>
      <label className="md:col-span-2">
        <span className="mb-1 block text-xs text-slate-400">Definition of done</span>
        <input
          className="holo-input w-full px-3 py-2"
          placeholder="How will the cohort know this is truly complete?"
          value={definitionOfDone}
          onChange={(event) => setDefinitionOfDone(event.target.value)}
          disabled={isCreating}
          aria-label="Definition of done"
        />
      </label>
      <label>
        <span className="mb-1 block text-xs text-slate-400">Project</span>
        <select
          className="holo-input w-full px-3 py-2"
          value={projectId}
          onChange={(event) => {
            setProjectId(event.target.value);
            setBlockedById("");
          }}
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
        <span className="mb-1 block text-xs text-slate-400">Priority</span>
        <select
          className="holo-input w-full px-3 py-2"
          value={priority}
          onChange={(event) =>
            setPriority(event.target.value as "LOW" | "MEDIUM" | "HIGH")
          }
          disabled={isCreating}
          aria-label="Task priority"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </label>
      <label>
        <span className="mb-1 block text-xs text-slate-400">Assignee</span>
        <select
          className="holo-input w-full px-3 py-2"
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          disabled={isCreating}
          aria-label="Assign to cohort member"
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {assigneeLabel(user, currentUserId)}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-slate-500">
          For onboarding step 4, pick another member - not &ldquo;(you)&rdquo;.
        </span>
      </label>
      <label>
        <span className="mb-1 block text-xs text-slate-400">Blocked by</span>
        <select
          className="holo-input w-full px-3 py-2"
          value={blockedById}
          onChange={(event) => setBlockedById(event.target.value)}
          disabled={isCreating || !projectId}
          aria-label="Blocked by another task"
        >
          <option value="">Not blocked</option>
          {createBlockerOptions.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="mb-1 block text-xs text-slate-400">Due date</span>
        <input
          type="date"
          className="holo-input w-full px-3 py-2"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          disabled={isCreating}
          aria-label="Due date"
        />
      </label>
      <button
        type="submit"
        disabled={isCreating}
        className="holo-btn-primary rounded-lg px-4 py-2 disabled:cursor-not-allowed md:self-end"
      >
        {isCreating ? "Adding…" : "Add task"}
      </button>
    </form>
  );

  return (
    <HoloWorkspace
      top={
        <div className="space-y-2">
          <p className="jarvis-status-line">Task orbit · cohort work queue</p>
          <p className="text-xs text-slate-500">
            Focus a task → Get Cursor plan → paste in Cursor → push PR
          </p>
          <TaskHudFilters
              projects={projects}
              users={users}
              currentUserId={currentUserId}
              projectFilter={projectFilter}
              assigneeFilter={assigneeFilter}
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              onProjectFilter={setProjectFilter}
              onAssigneeFilter={setAssigneeFilter}
              onStatusFilter={setStatusFilter}
              onPriorityFilter={setPriorityFilter}
              taskCounts={taskCounts}
            />
        </div>
      }
      bottom={
        <div className="holo-orbit-dock">
          <div className="holo-picker" role="group" aria-label="View mode">
            <button
              type="button"
              onClick={() => setViewMode("hud")}
              className={`holo-picker-item ${viewMode === "hud" ? "holo-picker-item-active" : ""}`}
              aria-pressed={viewMode === "hud"}
            >
              HUD
            </button>
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`holo-picker-item ${viewMode === "board" ? "holo-picker-item-active" : ""}`}
              aria-pressed={viewMode === "board"}
            >
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`holo-picker-item ${viewMode === "list" ? "holo-picker-item-active" : ""}`}
              aria-pressed={viewMode === "list"}
            >
              List
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-400">{tasks.length} shown</span>
            <label className="flex items-center gap-2 text-slate-400">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
              />
              Archived only
            </label>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="holo-text-link">
                Clear filters
              </button>
            )}
          </div>
        </div>
      }
      overlay={
        showCreateForm ? (
          <>
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setShowCreateForm(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-x-3 top-20 z-50 md:inset-x-auto md:left-1/2 md:top-24 md:w-full md:max-w-lg md:-translate-x-1/2">
              <article className="hud-projection-panel hud-scan-sweep p-5">
                <header className="mb-4 flex items-center justify-between gap-2">
                  <p className="jarvis-status-line">New task projection</p>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="hud-tile-btn text-xs"
                  >
                    Dismiss
                  </button>
                </header>
                {createForm}
                {error ? (
                  <p className="mt-2 text-sm text-rose-400" role="alert">
                    {error}
                  </p>
                ) : null}
              </article>
            </div>
          </>
        ) : null
      }
      fab={
        <button
          type="button"
          className="holo-fab"
          aria-label="Create task"
          onClick={() => setShowCreateForm(true)}
        >
          +
        </button>
      }
    >
      {listError ? (
        <div
          className="mb-3 rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200"
          role="alert"
        >
          {listError}
        </div>
      ) : null}

      {listLoading ? (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-900/50" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="hud-chip-compact mx-auto max-w-md text-center">
          <p className="text-sm text-slate-400">
            {showArchived
              ? "No archived tasks."
              : hasActiveFilters
                ? "No tasks match these filters."
                : "No tasks in orbit - tap + to add one."}
          </p>
        </div>
      ) : viewMode === "hud" ? (
        <TaskHudView
          tasks={tasks}
          users={users}
          currentUserId={currentUserId}
          checkInDrafts={checkInDrafts}
          onCheckInDraftChange={(id, value) =>
            setCheckInDrafts((current) => ({ ...current, [id]: value }))
          }
          onSubmitCheckIn={(task) => void submitCheckIn(task)}
          onUpdateTask={(id, patch) => void updateTask(id, patch)}
          onArchiveTask={(id, archived) => void archiveTask(id, archived)}
          blockerOptionsForTask={blockerOptionsForTask}
        />
      ) : viewMode === "board" ? (
        <div className="hud-board-orbit">
          {TASK_STATUSES.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.value);
            return (
              <div key={column.value} className="hud-board-column">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{column.label}</h3>
                  <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-xs text-slate-400">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {columnTasks.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-700/60 px-2 py-4 text-center text-xs text-slate-500">
                      Empty
                    </p>
                  ) : (
                    columnTasks.map((task) => (
                      <article key={task.id} className="hud-list-chip !min-w-0 !p-3">
                        <h3 className="text-sm font-medium text-white">{task.title}</h3>
                        <select
                          className="mt-2 w-full rounded border border-slate-700/80 bg-slate-950/60 px-2 py-1 text-xs"
                          value={task.status}
                          onChange={(event) =>
                            updateTask(task.id, { status: event.target.value })
                          }
                          aria-label={`Move ${task.title}`}
                        >
                          <option value="TODO">To do</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="hud-list-strip">
          {tasks.map((task) => (
            <article key={task.id} className="hud-list-chip">
              <h3 className="font-medium text-white">{task.title}</h3>
              <p className="mt-1 text-xs text-violet-300/80">{task.project.title}</p>
              <p className="mt-1 text-[10px] text-slate-500">
                {task.assignee ? assigneeLabel(task.assignee, currentUserId) : "Unassigned"}
              </p>
              {!task.archived && (
                <select
                  className="mt-2 w-full rounded border border-slate-700/80 bg-slate-950/60 px-2 py-1 text-xs"
                  value={task.status}
                  onChange={(event) => updateTask(task.id, { status: event.target.value })}
                  aria-label={`Status for ${task.title}`}
                >
                  <option value="TODO">To do</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="DONE">Done</option>
                </select>
              )}
            </article>
          ))}
        </div>
      )}
    </HoloWorkspace>
  );
}
