"use client";

import Link from "next/link";
import { isSmokeUser } from "@/lib/smoke-users";
import { ArcGauge, HudWidget } from "@/components/hud-primitives";

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

type ProjectHudLayoutProps = {
  projects: Project[];
  currentUserId: string;
  editingUpdateId: string | null;
  weeklyUpdateDraft: string;
  onStartWeeklyUpdateEdit: (project: Project) => void;
  onWeeklyUpdateDraftChange: (value: string) => void;
  onSaveWeeklyUpdate: (project: Project) => void;
  onCancelWeeklyUpdate: () => void;
  onUpdateProject: (id: string, patch: { atRisk?: boolean }) => void;
  onArchiveProject: (id: string, archived: boolean) => void;
};

function projectProgress(project: Project) {
  const done = project.tasks.filter((t) => t.status === "DONE").length;
  const total = project.tasks.length;
  return { done, total, progress: total === 0 ? 0 : Math.round((done / total) * 100) };
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
  onUpdateProject: (id: string, patch: { atRisk?: boolean }) => void;
  onArchiveProject: (id: string, archived: boolean) => void;
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
      className={`hud-project-module ${variant === "featured" ? "hud-project-featured" : "hud-project-satellite"} ${project.atRisk ? "hud-project-at-risk" : ""} ${isSmoke ? "opacity-70" : ""}`}
    >
      <Link href={tasksHref} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60 rounded-lg">
        <div className={`flex gap-4 ${variant === "featured" ? "flex-col items-center text-center sm:flex-row sm:text-left" : ""}`}>
          <ArcGauge
            value={progress}
            size={variant === "featured" ? 120 : 72}
            strokeWidth={variant === "featured" ? 6 : 4}
            color={project.atRisk ? "amber" : "magenta"}
          >
            <span className={`font-bold tabular-nums text-white ${variant === "featured" ? "text-2xl" : "text-base"}`}>
              {progress}
            </span>
            <span className="text-[10px] text-slate-400">%</span>
          </ArcGauge>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`font-semibold text-white ${variant === "featured" ? "text-xl" : "text-sm"}`}>
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
            {project.description && variant === "featured" && (
              <p className="mt-2 line-clamp-2 text-sm text-slate-300">{project.description}</p>
            )}
            <p className="mt-2 text-[10px] text-fuchsia-300/70">
              {done}/{total} tasks complete
            </p>
          </div>
        </div>
      </Link>

      {isMine && (
        <div className="mt-3 space-y-2 border-t border-fuchsia-500/10 pt-3">
          {!project.archived && (
            <>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={project.atRisk}
                  onChange={(event) =>
                    onUpdateProject(project.id, { atRisk: event.target.checked })
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
                    onChange={(event) => onWeeklyUpdateDraftChange(event.target.value)}
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
                    <p className="line-clamp-2 text-xs text-slate-400">{project.weeklyUpdate}</p>
                  ) : (
                    <p className="text-xs italic text-slate-600">No weekly update</p>
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
  if (projects.length === 0) return null;

  const sorted = [...projects].sort((a, b) => {
    const aMine = a.owner.id === currentUserId ? 1 : 0;
    const bMine = b.owner.id === currentUserId ? 1 : 0;
    if (aMine !== bMine) return bMine - aMine;
    const aProgress = projectProgress(a).progress;
    const bProgress = projectProgress(b).progress;
    return bProgress - aProgress;
  });

  const featured = sorted[0];
  const satellites = sorted.slice(1);

  return (
    <div className="hud-project-constellation">
      <div className="hud-project-center">
        <ProjectHudModule
          project={featured}
          currentUserId={currentUserId}
          variant="featured"
          editingUpdateId={editingUpdateId}
          weeklyUpdateDraft={weeklyUpdateDraft}
          onStartWeeklyUpdateEdit={onStartWeeklyUpdateEdit}
          onWeeklyUpdateDraftChange={onWeeklyUpdateDraftChange}
          onSaveWeeklyUpdate={onSaveWeeklyUpdate}
          onCancelWeeklyUpdate={onCancelWeeklyUpdate}
          onUpdateProject={onUpdateProject}
          onArchiveProject={onArchiveProject}
        />
      </div>

      {satellites.length > 0 && (
        <div className="hud-project-satellites grid gap-3 sm:grid-cols-2">
          {satellites.map((project, index) => (
            <div
              key={project.id}
              className="hud-project-satellite-wrap"
              style={{ transform: `translateY(${(index % 2) * 8}px)` }}
            >
              <ProjectHudModule
                project={project}
                currentUserId={currentUserId}
                variant="satellite"
                editingUpdateId={editingUpdateId}
                weeklyUpdateDraft={weeklyUpdateDraft}
                onStartWeeklyUpdateEdit={onStartWeeklyUpdateEdit}
                onWeeklyUpdateDraftChange={onWeeklyUpdateDraftChange}
                onSaveWeeklyUpdate={onSaveWeeklyUpdate}
                onCancelWeeklyUpdate={onCancelWeeklyUpdate}
                onUpdateProject={onUpdateProject}
                onArchiveProject={onArchiveProject}
              />
            </div>
          ))}
        </div>
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
  return (
    <div className="hud-dashboard-grid mb-6">
      <HudWidget label="Cohort load" accent="magenta" className="hud-span-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-white">
              {cohortCompletion}% tasks complete
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {doneTasks} of {totalTasks} shipped across {activeCount} active project
              {activeCount === 1 ? "" : "s"}
            </p>
          </div>
          <ArcGauge value={cohortCompletion} size={100} color="magenta" />
        </div>
      </HudWidget>

      <HudWidget label="Active" accent="magenta">
        <p className="text-3xl font-bold tabular-nums text-white">{activeCount}</p>
        <p className="text-xs text-slate-500">cohort workspaces</p>
      </HudWidget>

      <HudWidget label="Yours" accent="violet">
        <p className="text-3xl font-bold tabular-nums text-white">{myCount}</p>
        <p className="text-xs text-slate-500">owned by you</p>
      </HudWidget>

      <HudWidget label="At risk" accent="amber" className={atRiskCount > 0 ? "hud-widget-alert" : ""}>
        <p className={`text-3xl font-bold tabular-nums ${atRiskCount > 0 ? "text-orange-300" : "text-white"}`}>
          {atRiskCount}
        </p>
        <p className="text-xs text-slate-500">need escalation</p>
      </HudWidget>

      <HudWidget label="Updates" accent="cyan">
        <p className="text-3xl font-bold tabular-nums text-white">
          {weeklyUpdateCount}
          <span className="text-lg text-slate-500">/{activeCount}</span>
        </p>
        <p className="text-xs text-slate-500">weekly posted</p>
      </HudWidget>
    </div>
  );
}
