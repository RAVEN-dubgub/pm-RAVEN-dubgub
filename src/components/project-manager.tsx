"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Project = {
  id: string;
  title: string;
  description: string | null;
  archived: boolean;
  owner: { id?: string; name: string };
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
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

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
  }, [showArchived]);

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    setCreateError(null);

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

  const activeProjects = projects.filter((p) => !p.archived);
  const myActiveCount = activeProjects.filter(
    (p) => p.owner.id === currentUserId,
  ).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="mb-1 text-lg font-semibold">New project</h2>
        <p className="mb-4 text-sm text-slate-400">
          Every cohort member needs at least one project. Start here.
        </p>
        <form onSubmit={createProject} className="grid gap-3">
          <label>
            <span className="sr-only">Project title</span>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
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
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
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
            className="w-fit rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400"
          >
            Create project
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
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
              <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-800" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center">
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
                  className="mt-4 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Check archived projects →
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {projects.map((project) => {
              const done = project.tasks.filter((task) => task.status === "DONE").length;
              const total = project.tasks.length;
              const progress = total === 0 ? 0 : Math.round((done / total) * 100);
              const isMine = project.owner.id === currentUserId;

              return (
                <article
                  key={project.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-white">{project.title}</h3>
                      <p className="text-sm text-slate-400">
                        Owner: {project.owner.name}
                        {isMine ? " (you)" : ""}
                      </p>
                      {project.description && (
                        <p className="mt-2 text-sm text-slate-300">{project.description}</p>
                      )}
                    </div>
                    {project.archived ? (
                      <span className="shrink-0 rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
                        Archived
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-slate-400">
                      <span>
                        {done}/{total} tasks done
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div
                      className="h-2 rounded-full bg-slate-800"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${project.title} completion`}
                    >
                      <div
                        className="h-2 rounded-full bg-cyan-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {!project.archived && total > 0 && (
                      <Link
                        href="/tasks"
                        className="text-sm text-cyan-400 hover:text-cyan-300"
                      >
                        View tasks →
                      </Link>
                    )}
                    {isMine ? (
                      <button
                        type="button"
                        onClick={() => archiveProject(project.id, !project.archived)}
                        className="text-sm text-slate-400 hover:text-white"
                      >
                        {project.archived ? "Restore project" : "Archive project"}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
