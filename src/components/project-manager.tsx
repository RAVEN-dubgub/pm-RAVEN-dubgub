"use client";

import { useEffect, useRef, useState } from "react";
import { ProjectHudLayout, ProjectHudStats } from "@/components/project-hud-layout";

type Project = {
  id: string;
  title: string;
  description: string | null;
  archived: boolean;
  atRisk: boolean;
  weeklyUpdate: string | null;
  weeklyUpdateAt: string | null;
  owner: { id?: string; name: string; email?: string };
  tasks: { status: string }[];
};

type ProjectManagerProps = {
  initialProjects: Project[];
  currentUserId: string;
};

export function ProjectManager({
  initialProjects,
  currentUserId,
}: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [weeklyUpdateDraft, setWeeklyUpdateDraft] = useState("");
  const skipInitialFetch = useRef(true);

  async function loadProjects() {
    setError(null);
    const response = await fetch(
      `/api/projects${showArchived ? "?archived=true" : ""}`,
      { credentials: "same-origin" },
    );
    if (!response.ok) {
      setError("Could not load projects. Try refreshing or signing in again.");
      return;
    }
    const data = await response.json();
    setProjects(data.projects ?? []);
  }

  useEffect(() => {
    if (!showArchived && skipInitialFetch.current) {
      skipInitialFetch.current = false;
      setProjects(initialProjects);
      setLoading(false);
      return;
    }

    let active = true;
    async function fetchProjects() {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/projects${showArchived ? "?archived=true" : ""}`,
        { credentials: "same-origin" },
      );
      if (!active) return;
      if (!response.ok) {
        setError("Could not load projects. Try refreshing or signing in again.");
        setLoading(false);
        return;
      }
      const data = await response.json();
      setProjects(data.projects ?? []);
      setLoading(false);
    }
    void fetchProjects();
    return () => {
      active = false;
    };
  }, [showArchived, initialProjects]);

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    if (isCreating) return;

    setCreateError(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setCreateError(
          data?.error === "Unauthorized"
            ? "Session expired — please sign in again."
            : "Could not create project. Please try again.",
        );
        return;
      }

      setTitle("");
      setDescription("");
      setShowArchived(false);
      await loadProjects();
    } finally {
      setIsCreating(false);
    }
  }

  async function archiveProject(id: string, archived: boolean) {
    const action = archived ? "archive" : "restore";
    const confirmed = window.confirm(
      archived
        ? "Archive this project? It will be hidden from the active list until you restore it."
        : "Restore this project to the active list?",
    );
    if (!confirmed) return;

    const response = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ archived }),
    });

    if (!response.ok) {
      setError(`Could not ${action} project. Please try again.`);
      return;
    }

    await loadProjects();
  }

  async function updateProject(
    id: string,
    patch: { atRisk?: boolean; weeklyUpdate?: string | null },
  ) {
    const response = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setError("Could not update project. Please try again.");
      return;
    }

    const data = await response.json();
    const updated = data.project as Project;
    setProjects((current) =>
      current.map((project) => (project.id === id ? { ...project, ...updated } : project)),
    );
  }

  async function saveWeeklyUpdate(project: Project) {
    await updateProject(project.id, { weeklyUpdate: weeklyUpdateDraft.trim() || null });
    setEditingUpdateId(null);
    setWeeklyUpdateDraft("");
  }

  function startWeeklyUpdateEdit(project: Project) {
    setEditingUpdateId(project.id);
    setWeeklyUpdateDraft(project.weeklyUpdate ?? "");
  }

  const activeProjects = projects.filter((p) => !p.archived);
  const myActiveCount = activeProjects.filter(
    (p) => p.owner.id === currentUserId,
  ).length;
  const atRiskCount = activeProjects.filter((p) => p.atRisk).length;
  const totalTasks = activeProjects.reduce((sum, p) => sum + p.tasks.length, 0);
  const doneTasks = activeProjects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === "DONE").length,
    0,
  );
  const cohortCompletion =
    totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
  const weeklyUpdateCount = activeProjects.filter((p) => p.weeklyUpdate).length;

  return (
    <div className="space-y-6">
      {!showArchived && (
        <ProjectHudStats
          activeCount={activeProjects.length}
          myCount={myActiveCount}
          atRiskCount={atRiskCount}
          weeklyUpdateCount={weeklyUpdateCount}
          cohortCompletion={cohortCompletion}
          doneTasks={doneTasks}
          totalTasks={totalTasks}
        />
      )}

      {showArchived && (
        <section className="holo-panel holo-panel-featured holo-panel-featured-projects p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-wider text-fuchsia-300/80">
                Archived projects
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                {projects.length} archived workspace{projects.length === 1 ? "" : "s"}
              </h2>
            </div>
          </div>
        </section>
      )}

      <div className="holo-shimmer-border">
        <section className="holo-shimmer-inner holo-panel-glass p-5">
          <h2 className="mb-1 text-lg font-semibold">New project</h2>
          <p className="mb-4 text-sm text-slate-400">
            Every cohort member needs at least one project. Start here.
          </p>
          <form onSubmit={createProject} className="grid gap-3">
            <label>
              <span className="sr-only">Project title</span>
              <input
                className="holo-input w-full px-3 py-2"
                placeholder="Project title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                aria-label="Project title"
              />
            </label>
            <label>
              <span className="sr-only">Description</span>
              <textarea
                className="holo-input w-full px-3 py-2"
                placeholder="What is this project about? (optional)"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                aria-label="Project description"
              />
            </label>
            {createError ? (
              <p className="text-sm text-rose-400" role="alert">
                {createError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isCreating}
              className="holo-btn-primary w-fit px-4 py-2 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating…" : "Create project"}
            </button>
          </form>
        </section>
      </div>

      <section className="holo-panel holo-panel-glass p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Projects
            {!loading && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({activeProjects.length} active
                {myActiveCount !== activeProjects.length
                  ? ` · ${myActiveCount} yours`
                  : ""}
                )
              </span>
            )}
          </h2>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => setShowArchived(event.target.checked)}
            />
            Show archived only
          </label>
        </div>

        {error ? (
          <div
            className="mb-4 rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="holo-panel holo-panel-glass h-36 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="holo-panel-glass rounded-xl border border-dashed border-slate-700/80 px-4 py-8 text-center">
            <p className="text-sm text-slate-400">
              {showArchived
                ? "No archived projects."
                : "No active projects yet — create one above to get started."}
            </p>
            {!showArchived && (
              <>
                <p className="mt-2 text-xs text-slate-500">
                  Archived projects are hidden by default. Use &quot;Show archived
                  only&quot; to find and restore them.
                </p>
                <button
                  type="button"
                  onClick={() => setShowArchived(true)}
                  className="holo-text-link mt-4 text-sm"
                >
                  Check archived projects →
                </button>
              </>
            )}
          </div>
        ) : (
          <ProjectHudLayout
            projects={projects}
            currentUserId={currentUserId}
            editingUpdateId={editingUpdateId}
            weeklyUpdateDraft={weeklyUpdateDraft}
            onStartWeeklyUpdateEdit={startWeeklyUpdateEdit}
            onWeeklyUpdateDraftChange={setWeeklyUpdateDraft}
            onSaveWeeklyUpdate={(project) => void saveWeeklyUpdate(project)}
            onCancelWeeklyUpdate={() => {
              setEditingUpdateId(null);
              setWeeklyUpdateDraft("");
            }}
            onUpdateProject={(id, patch) => void updateProject(id, patch)}
            onArchiveProject={(id, archived) => void archiveProject(id, archived)}
          />
        )}
      </section>
    </div>
  );
}
