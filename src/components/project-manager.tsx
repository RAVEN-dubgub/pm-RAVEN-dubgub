"use client";

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

  async function loadProjects() {
    const response = await fetch(
      `/api/projects${showArchived ? "?archived=true" : ""}`,
    );
    if (response.ok) {
      const data = await response.json();
      setProjects(data.projects);
    }
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="mb-4 text-lg font-semibold">New project</h2>
        <form onSubmit={createProject} className="grid gap-3">
          <input
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="Project title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
          <textarea
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
          />
          <button
            type="submit"
            className="w-fit rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400"
          >
            Create project
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => setShowArchived(event.target.checked)}
            />
            Show archived
          </label>
        </div>
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
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
                      Archived
                    </span>
                  ) : null}
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>{done}/{total} tasks done</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-cyan-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => archiveProject(project.id, !project.archived)}
                  className="mt-4 text-sm text-slate-400 hover:text-white"
                >
                  {project.archived ? "Restore project" : "Archive project"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
