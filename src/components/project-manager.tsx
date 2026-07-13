"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Project = {
  id: string;
  title: string;
  description: string | null;
  archived: boolean;
  owner: { name: string };
  tasks: { status: string }[];
};

export function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadProjects() {
    const response = await fetch(
      `/api/projects${showArchived ? "?archived=true" : ""}`,
    );
    if (response.ok) {
      const data = await response.json();
      setProjects(data.projects);
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function fetchProjects() {
      const response = await fetch(
        `/api/projects${showArchived ? "?archived=true" : ""}`,
      );
      if (!response.ok || !active) return;
      const data = await response.json();
      setProjects(data.projects);
      setLoading(false);
    }
    void fetchProjects();
    return () => {
      active = false;
    };
  }, [showArchived]);

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    setTitle("");
    setDescription("");
    await loadProjects();
  }

  async function archiveProject(id: string, archived: boolean) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    });
    await loadProjects();
  }

  const activeProjects = projects.filter((p) => !p.archived);

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
                ({activeProjects.length} active)
              </span>
            )}
          </h2>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => setShowArchived(event.target.checked)}
            />
            Show archived
          </label>
        </div>

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
                : "No projects yet — create one above to get started."}
            </p>
            {!showArchived && (
              <p className="mt-2 text-xs text-slate-500">
                Tip: add tasks after creating a project, then assign peers on the Tasks page.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {projects.map((project) => {
              const done = project.tasks.filter((task) => task.status === "DONE").length;
              const total = project.tasks.length;
              const progress = total === 0 ? 0 : Math.round((done / total) * 100);

              return (
                <article
                  key={project.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-white">{project.title}</h3>
                      <p className="text-sm text-slate-400">Owner: {project.owner.name}</p>
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
                    <button
                      type="button"
                      onClick={() => archiveProject(project.id, !project.archived)}
                      className="text-sm text-slate-400 hover:text-white"
                    >
                      {project.archived ? "Restore project" : "Archive project"}
                    </button>
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
