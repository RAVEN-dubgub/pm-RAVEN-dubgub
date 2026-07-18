"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";

import { isSmokeUser } from "@/lib/smoke-users";

import { ArcGauge, HudWidget } from "@/components/hud-primitives";

import { orbitSlot, useHoloFocus } from "@/lib/holo-focus";

import { useHoloRingReadout } from "@/lib/holo-ring-context";
import { computeTaskProgress } from "@/lib/task-progress";

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

type ProjectHudLayoutProps = {
  projects: Project[];

  currentUserId: string;

  editingUpdateId: string | null;

  weeklyUpdateDraft: string;

  onStartWeeklyUpdateEdit: (project: Project) => void;

  onWeeklyUpdateDraftChange: (value: string) => void;

  onSaveWeeklyUpdate: (project: Project) => void;

  onCancelWeeklyUpdate: () => void;

  onUpdateProject: (
    id: string,
    patch: { atRisk?: boolean; githubRepoUrl?: string | null },
  ) => void;

  onArchiveProject: (id: string, archived: boolean) => void;
};

function projectProgress(project: Project) {
  return computeTaskProgress(project.tasks);
}

function ProjectOrbitChip({
  project,
  onSelect,
}: {
  project: Project;
  onSelect: () => void;
}) {
  const { progress } = projectProgress(project);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className="hud-orbit-chip hud-project-orbit-chip"
      aria-label={`Switch focus to ${project.title}`}
    >
      <span className="hud-orbit-chip-metric">{progress}%</span>
      <span className="truncate">{project.title}</span>
    </button>
  );
}

function ProjectGithubRepoField({
  projectTitle,
  savedUrl,
  onSave,
}: {
  projectTitle: string;
  savedUrl: string | null;
  onSave: (url: string | null) => void;
}) {
  const [githubDraft, setGithubDraft] = useState(savedUrl ?? "");

  return (
    <div className="space-y-1">
      <label className="block text-[10px] text-slate-500">GitHub repo URL</label>
      <input
        className="hud-tile-input w-full text-xs"
        placeholder="https://github.com/org/repo"
        value={githubDraft}
        onChange={(event) => setGithubDraft(event.target.value)}
        aria-label={`GitHub repo URL for ${projectTitle}`}
      />
      <button
        type="button"
        onClick={() => onSave(githubDraft.trim() || null)}
        className="hud-tile-btn text-xs"
        disabled={(githubDraft.trim() || null) === (savedUrl ?? null)}
      >
        Save repo URL
      </button>
    </div>
  );
}

function ProjectHudModule({
  project,

  currentUserId,

  variant,

  editingUpdateId,

  weeklyUpdateDraft,

  onStartWeeklyUpdateEdit,

  onWeeklyUpdateDraftChange,

  onSaveWeeklyUpdate,

  onCancelWeeklyUpdate,

  onUpdateProject,

  onArchiveProject,

  focused = false,

  dimmed = false,

  onSelect,
}: {
  project: Project;

  currentUserId: string;

  variant: "featured" | "satellite";

  editingUpdateId: string | null;

  weeklyUpdateDraft: string;

  onStartWeeklyUpdateEdit: (project: Project) => void;

  onWeeklyUpdateDraftChange: (value: string) => void;

  onSaveWeeklyUpdate: (project: Project) => void;

  onCancelWeeklyUpdate: () => void;

  onUpdateProject: (
    id: string,
    patch: { atRisk?: boolean; githubRepoUrl?: string | null },
  ) => void;

  onArchiveProject: (id: string, archived: boolean) => void;

  focused?: boolean;

  dimmed?: boolean;

  onSelect?: () => void;
}) {
  const { done, total, progress } = projectProgress(project);

  const isMine = project.owner.id === currentUserId;

  const isSmoke = isSmokeUser({
    name: project.owner.name,

    email: project.owner.email ?? "",
  });

  const tasksHref = `/tasks?projectId=${project.id}`;

  return (
    <article
      role={onSelect ? "button" : undefined}

      tabIndex={onSelect ? 0 : undefined}

      onClick={onSelect}

      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();

                onSelect();
              }
            }
          : undefined
      }

      className={`hud-project-module ${variant === "featured" ? "hud-project-featured" : "hud-project-satellite"} ${project.atRisk ? "hud-project-at-risk" : ""} ${isSmoke ? "opacity-70" : ""} ${focused ? "hud-project-focused hud-scan-sweep" : ""} ${dimmed ? "hud-project-dimmed" : ""}`}
    >
      <Link
        href={tasksHref}

        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60 rounded-lg"

        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`flex gap-4 ${variant === "featured" ? "flex-col items-center text-center sm:flex-row sm:text-left" : ""}`}
        >
          <ArcGauge
            value={progress}

            size={variant === "featured" ? 120 : 72}

            strokeWidth={variant === "featured" ? 6 : 4}

            color={project.atRisk ? "amber" : "magenta"}
          >
            <span
              className={`font-bold tabular-nums text-white ${variant === "featured" ? "jarvis-metric-glow text-3xl" : "text-base"}`}
            >
              {progress}
            </span>

            <span className="text-[10px] text-slate-400">%</span>
          </ArcGauge>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`font-semibold text-white ${variant === "featured" ? "text-xl" : "text-sm"}`}
              >
                {project.title}
              </h3>

              {project.atRisk && !project.archived && (
                <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium text-orange-300">
                  At risk
                </span>
              )}

              {project.archived && (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                  Archived
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-400">
              {project.owner.name}

              {isMine ? " (you)" : ""}

              {isSmoke ? " · test" : ""}
            </p>

            {project.description && (variant === "featured" || focused) && (
              <p className="mt-2 line-clamp-3 text-sm text-slate-300">
                {project.description}
              </p>
            )}

            <p className="mt-2 text-[10px] text-fuchsia-300/70">
              {done}/{total} tasks complete
            </p>
          </div>
        </div>
      </Link>

      {isMine && (
        <div
          className="mt-3 space-y-2 border-t border-fuchsia-500/10 pt-3"
          onClick={(event) => event.stopPropagation()}
        >
          {!project.archived && (
            <>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"

                  checked={project.atRisk}

                  onChange={(event) =>
                    onUpdateProject(project.id, {
                      atRisk: event.target.checked,
                    })
                  }
                />
                Mark at risk
              </label>

              {editingUpdateId === project.id ? (
                <div className="space-y-2">
                  <textarea
                    className="hud-tile-input w-full text-xs"

                    rows={2}

                    placeholder="Weekly cohort update…"

                    value={weeklyUpdateDraft}

                    onChange={(event) =>
                      onWeeklyUpdateDraftChange(event.target.value)
                    }
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"

                      onClick={() => onSaveWeeklyUpdate(project)}

                      className="hud-tile-btn hud-tile-btn-accent text-xs"
                    >
                      Save
                    </button>

                    <button
                      type="button"

                      onClick={onCancelWeeklyUpdate}

                      className="hud-tile-btn text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {project.weeklyUpdate ? (
                    <p className="line-clamp-2 text-xs text-slate-400">
                      {project.weeklyUpdate}
                    </p>
                  ) : (
                    <p className="text-xs italic text-slate-600">
                      No weekly update
                    </p>
                  )}

                  <button
                    type="button"

                    onClick={() => onStartWeeklyUpdateEdit(project)}

                    className="holo-text-link mt-1 text-xs"
                  >
                    {project.weeklyUpdate ? "Edit update" : "Post update"}
                  </button>
                </div>
              )}

              <ProjectGithubRepoField
                key={`${project.id}-${project.githubRepoUrl ?? ""}`}
                projectTitle={project.title}
                savedUrl={project.githubRepoUrl}
                onSave={(url) =>
                  onUpdateProject(project.id, { githubRepoUrl: url })
                }
              />
            </>
          )}

          <button
            type="button"

            onClick={() => onArchiveProject(project.id, !project.archived)}

            className="text-xs text-slate-500 hover:text-white"
          >
            {project.archived ? "Restore" : "Archive"}
          </button>
        </div>
      )}

      {!isMine && project.weeklyUpdate && (
        <p className="mt-2 line-clamp-2 border-t border-fuchsia-500/10 pt-2 text-xs text-slate-400">
          {project.weeklyUpdate}
        </p>
      )}
    </article>
  );
}

export function ProjectHudLayout({
  projects,

  currentUserId,

  editingUpdateId,

  weeklyUpdateDraft,

  onStartWeeklyUpdateEdit,

  onWeeklyUpdateDraftChange,

  onSaveWeeklyUpdate,

  onCancelWeeklyUpdate,

  onUpdateProject,

  onArchiveProject,
}: ProjectHudLayoutProps) {
  const { focusedId, toggle, focus } = useHoloFocus<string>(null, "project");

  const hasFocus = focusedId !== null;

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") focus(null);
    }

    window.addEventListener("keydown", onEscape);

    return () => window.removeEventListener("keydown", onEscape);
  }, [focus]);

  const orbitRadius = useMemo(
    () => 260 + Math.min(Math.max(projects.length - 1, 0) * 20, 120),
    [projects.length],
  );

  const { setReadout } = useHoloRingReadout();

  const sorted = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aMine = a.owner.id === currentUserId ? 1 : 0;
      const bMine = b.owner.id === currentUserId ? 1 : 0;
      if (aMine !== bMine) return bMine - aMine;
      const aProgress = projectProgress(a).progress;
      const bProgress = projectProgress(b).progress;
      return bProgress - aProgress;
    });
  }, [projects, currentUserId]);

  const featured = sorted[0];
  const satellites = sorted;

  useEffect(() => {
    const target =
      focusedId !== null
        ? sorted.find((project) => project.id === focusedId) ?? featured
        : featured;
    if (!target) {
      setReadout(null);
      return;
    }
    const { progress } = projectProgress(target);
    setReadout({
      metric: `${progress}%`,
      primary: target.title.length > 22 ? `${target.title.slice(0, 20)}…` : target.title,
      secondary:
        focusedId !== null
          ? `${target.owner.name} · featured focus`
          : `${sorted.length} project${sorted.length === 1 ? "" : "s"} in orbit`,
    });
    return () => setReadout(null);
  }, [featured, focusedId, setReadout, sorted]);

  if (projects.length === 0) return null;

  const focusedProject =
    focusedId !== null
      ? sorted.find((project) => project.id === focusedId) ?? null
      : null;

  const moduleProps = {
    currentUserId,

    editingUpdateId,

    weeklyUpdateDraft,

    onStartWeeklyUpdateEdit,

    onWeeklyUpdateDraftChange,

    onSaveWeeklyUpdate,

    onCancelWeeklyUpdate,

    onUpdateProject,

    onArchiveProject,
  };

  return (
    <div
      className={`hud-project-constellation ${hasFocus ? "hud-project-constellation-focus" : ""}`}

      data-hud-focus={focusedId ?? undefined}
    >
      {/* Desktop orbital constellation */}

      <div
        className={`hud-project-orbit-field relative hidden md:block ${hasFocus ? "hud-project-orbit-field-focus" : "min-h-[580px]"}`}
      >
        {satellites.map((project, index) => {
          const slot = orbitSlot(
            index,
            satellites.length,
            orbitRadius,
            orbitRadius * 0.42,
          );

          const isFeatured = project.id === featured.id;
          const isFocused = focusedId === project.id;

          if (hasFocus && isFocused) return null;

          const orbitStyle = {
            left: `calc(50% + ${slot.x}px)`,
            top: `calc(50% + ${slot.y}px)`,
            transform: "translate(-50%, -50%)",
            zIndex: isFeatured ? 15 : 5 + index,
          } as const;

          if (hasFocus) {
            return (
              <div
                key={project.id}
                className="hud-project-orbit-chip-slot absolute"
                style={orbitStyle}
              >
                <ProjectOrbitChip
                  project={project}
                  onSelect={() => focus(project.id)}
                />
              </div>
            );
          }

          return (
            <div
              key={project.id}
              className={`hud-project-satellite-orbit absolute ${isFeatured ? "w-[min(300px,30vw)]" : "w-[min(260px,24vw)]"}`}
              style={orbitStyle}
            >
              <ProjectHudModule
                project={project}
                variant={isFeatured ? "featured" : "satellite"}
                focused={false}
                dimmed={false}
                onSelect={() => toggle(project.id)}
                {...moduleProps}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile / tablet fallback grid */}

      {!hasFocus && (
        <div className="grid gap-3 md:hidden">
          {sorted.map((project) => (
            <ProjectHudModule
              key={project.id}
              project={project}
              variant={project.id === featured.id ? "featured" : "satellite"}
              focused={false}
              dimmed={false}
              onSelect={() => toggle(project.id)}
              {...moduleProps}
            />
          ))}
        </div>
      )}

      {focusedProject && (
        <div
          className="hud-projection-backdrop"
          onClick={() => focus(null)}
          aria-hidden="true"
        />
      )}

      {focusedProject && (
        <div className="hud-projection-layer">
          <article className="hud-projection-panel hud-scan-sweep mx-auto w-full max-w-lg md:max-w-2xl">
            <header className="mb-3 flex items-center justify-between gap-2">
              <p className="jarvis-status-line">Project projection</p>
              <button
                type="button"
                onClick={() => focus(null)}
                className="hud-tile-btn text-xs"
                aria-label="Close projection"
              >
                Dismiss
              </button>
            </header>
            <ProjectHudModule
              project={focusedProject}
              variant={
                focusedProject.id === featured.id ? "featured" : "satellite"
              }
              focused
              dimmed={false}
              {...moduleProps}
            />
          </article>
        </div>
      )}

      {hasFocus && (
        <p className="relative z-[60] mt-4 text-center text-[10px] text-slate-600 md:fixed md:bottom-6 md:left-0 md:right-0">
          Tap chip to switch · Esc to dismiss
        </p>
      )}
    </div>
  );
}

export function ProjectHudStats({
  activeCount,

  myCount,

  atRiskCount,

  weeklyUpdateCount,

  cohortCompletion,

  doneTasks,

  totalTasks,
}: {
  activeCount: number;

  myCount: number;

  atRiskCount: number;

  weeklyUpdateCount: number;

  cohortCompletion: number;

  doneTasks: number;

  totalTasks: number;
}) {
  const { focusedId, toggle } = useHoloFocus<string>(null, "widget");

  const hasFocus = focusedId !== null;

  const widgets = [
    {
      id: "cohort-load",

      label: "Cohort load",

      accent: "magenta" as const,

      className: "hud-span-2",

      content: (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="jarvis-metric-glow text-3xl">{cohortCompletion}%</p>

            <p className="mt-1 text-sm text-slate-400">
              {doneTasks} of {totalTasks} shipped across {activeCount} active
              project
              {activeCount === 1 ? "" : "s"}
            </p>
          </div>

          <ArcGauge value={cohortCompletion} size={100} color="magenta" />
        </div>
      ),
    },

    {
      id: "active",

      label: "Active",

      accent: "magenta" as const,

      metric: activeCount,

      content: <p className="text-xs text-slate-500">cohort workspaces</p>,
    },

    {
      id: "yours",

      label: "Yours",

      accent: "violet" as const,

      metric: myCount,

      content: <p className="text-xs text-slate-500">owned by you</p>,
    },

    {
      id: "at-risk",

      label: "At risk",

      accent: "amber" as const,

      metric: atRiskCount,

      className: atRiskCount > 0 ? "hud-widget-alert" : "",

      content: <p className="text-xs text-slate-500">need escalation</p>,
    },

    {
      id: "updates",

      label: "Updates",

      accent: "cyan" as const,

      metric: `${weeklyUpdateCount}/${activeCount}`,

      content: <p className="text-xs text-slate-500">weekly posted</p>,
    },
  ];

  return (
    <div
      className={`hud-project-stats-strip flex flex-wrap gap-2 ${hasFocus ? "opacity-80" : ""}`}
    >
      {widgets.map((widget) => (
        <HudWidget
          key={widget.id}

          label={widget.label}

          accent={widget.accent}

          className={widget.className}

          focusId={widget.id}

          focused={focusedId === widget.id}

          dimmed={hasFocus && focusedId !== widget.id}

          onFocus={() => toggle(widget.id)}

          metric={widget.metric}
        >
          {widget.content}
        </HudWidget>
      ))}
    </div>
  );
}
