"use client";

import { useEffect, useRef, useState } from "react";
import { HoloWorkspace } from "@/components/holo-workspace";
import { ProjectHudLayout, ProjectHudStats } from "@/components/project-hud-layout";
import { useHoloRingReadout } from "@/lib/holo-ring-context";
import { isSmokeUser } from "@/lib/smoke-users";
import { sumTaskProgress } from "@/lib/task-progress";
type Project = {
  id: string;
  title: string;
  description: string | null;
  githubRepoUrl: string | null;
  archived: boolean;
  atRisk: boolean;
  weeklyUpdate: string | null;
  weeklyUpdateAt: string | null;
  owner: { id?: string; name: string; email?: string };
  tasks: { status: string; archived?: boolean }[];
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
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
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
        body: JSON.stringify({
          title,
          description,
          githubRepoUrl: githubRepoUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setCreateError(
          data?.error === "Unauthorized"
            ? "Session expired - please sign in again."
            : "Could not create project. Please try again.",
        );
        return;
      }

      setTitle("");
      setDescription("");
      setGithubRepoUrl("");
      setShowArchived(false);
      setShowCreateForm(false);
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
    patch: { atRisk?: boolean; weeklyUpdate?: string | null; githubRepoUrl?: string | null },
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
  const cohortProjects = activeProjects.filter(
    (project) =>
      !isSmokeUser({ name: project.owner.name, email: project.owner.email ?? "" }),
  );
  const myActiveCount = activeProjects.filter(
    (p) => p.owner.id === currentUserId,
  ).length;
  const atRiskCount = activeProjects.filter((p) => p.atRisk).length;
  const { done: doneTasks, total: totalTasks, progress: cohortCompletion } =
    sumTaskProgress(cohortProjects);
  const weeklyUpdateCount = activeProjects.filter((p) => p.weeklyUpdate).length;
  const { setReadout } = useHoloRingReadout();

  useEffect(() => {
    if (!showArchived && activeProjects.length === 0) {
      setReadout({
        metric: "-",
        primary: "NO PROJECTS",
        secondary: "tap + to create",
      });
      return () => setReadout(null);
    }
    if (showArchived && projects.length === 0) {
      setReadout({
        metric: 0,
        primary: "ARCHIVED",
        secondary: "none on file",
      });
      return () => setReadout(null);
    }
    return undefined;
  }, [activeProjects.length, projects.length, setReadout, showArchived]);

  const createForm = (
    <form onSubmit={createProject} className="grid gap-3">
      <label>
        <span className="sr-only">Project title</span>
        <input
          className="holo-input w-full px-3 py-2"
          placeholder="Project title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          disabled={isCreating}
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
          disabled={isCreating}
          aria-label="Project description"
        />
      </label>
      <label>
        <span className="sr-only">GitHub repo URL</span>
        <input
          className="holo-input w-full px-3 py-2"
          placeholder="GitHub repo URL (optional)"
          value={githubRepoUrl}
          onChange={(event) => setGithubRepoUrl(event.target.value)}
          disabled={isCreating}
          aria-label="GitHub repo URL"
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
  );

  return (
    <HoloWorkspace
      top={
        <div className="space-y-2">
          <p className="jarvis-status-line">Project constellation · cohort workspaces</p>
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
        </div>
      }
      bottom={
        <div className="holo-orbit-dock">
          <span className="text-sm text-slate-400">
            {showArchived
              ? `${projects.length} archived`
              : `${activeProjects.length} active${myActiveCount !== activeProjects.length ? ` · ${myActiveCount} yours` : ""}`}
          </span>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => setShowArchived(event.target.checked)}
            />
            Show archived only
          </label>
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
                  <p className="jarvis-status-line">New project projection</p>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="hud-tile-btn text-xs"
                  >
                    Dismiss
                  </button>
                </header>
                {createForm}
              </article>
            </div>
          </>
        ) : null
      }
      fab={
        !showArchived ? (
          <button
            type="button"
            className="holo-fab"
            aria-label="Create project"
            onClick={() => setShowCreateForm(true)}
          >
            +
          </button>
        ) : null
      }
    >
      {error ? (
        <div
          className="mb-3 rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {showArchived && projects.length > 0 && (
        <p className="mb-3 text-center text-xs text-slate-500">
          Archived workspaces · restore from each module
        </p>
      )}

      {loading ? (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-900/50" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="hud-chip-compact mx-auto max-w-md text-center">
          <p className="text-sm text-slate-400">
            {showArchived
              ? "No archived projects."
              : "No active projects in orbit - tap + to create one."}
          </p>
          {!showArchived && (
            <button
              type="button"
              onClick={() => setShowArchived(true)}
              className="holo-text-link mt-3 text-sm"
            >
              Check archived projects →
            </button>
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
    </HoloWorkspace>
  );
}
