"use client";

import { useEffect, useMemo } from "react";

import {
  formatDueDate,
  formatRelativeCheckIn,
  isCheckInStale,
  isDueSoon,
  isOverdue,
  isTaskBlocked,
  priorityLabel,
  statusLabel,
} from "@/lib/types";

import {
  AssigneeChip,
  HudPill,
  PriorityGlow,
  StatusArc,
} from "@/components/hud-primitives";

import { orbitSlot, useHoloFocus } from "@/lib/holo-focus";
import { useHoloRingReadout } from "@/lib/holo-ring-context";

type UserOption = { id: string; name: string; email: string };

type BlockerRef = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
};

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

  project: { id: string; title: string; ownerId: string; owner: UserOption };

  assignee: UserOption | null;

  blockedBy: BlockerRef | null;
};

type TaskHudViewProps = {
  tasks: TaskItem[];

  users: UserOption[];

  currentUserId: string;

  checkInDrafts: Record<string, string>;

  onCheckInDraftChange: (id: string, value: string) => void;

  onSubmitCheckIn: (task: TaskItem) => void;

  onUpdateTask: (id: string, patch: Record<string, unknown>) => void;

  onArchiveTask: (id: string, archived: boolean) => void;

  blockerOptionsForTask: (task: TaskItem) => TaskItem[];
};

function assigneeLabel(user: UserOption, currentUserId: string) {
  const name = user.name.trim() || user.email;

  return user.id === currentUserId ? `${name} (you)` : name;
}

function assigneeShort(user: UserOption) {
  return user.name.trim() || user.email.split("@")[0];
}

function isPeerAssigned(task: TaskItem, currentUserId: string) {
  return (
    task.assignee?.id === currentUserId &&
    task.project.ownerId !== currentUserId
  );
}

function TaskTileBody({
  task,

  currentUserId,

  users,

  checkInDrafts,

  onCheckInDraftChange,

  onSubmitCheckIn,

  onUpdateTask,

  onArchiveTask,

  blockerOptionsForTask,

  expanded = false,
}: {
  task: TaskItem;

  currentUserId: string;

  users: UserOption[];

  checkInDrafts: Record<string, string>;

  onCheckInDraftChange: (id: string, value: string) => void;

  onSubmitCheckIn: (task: TaskItem) => void;

  onUpdateTask: (id: string, patch: Record<string, unknown>) => void;

  onArchiveTask: (id: string, archived: boolean) => void;

  blockerOptionsForTask: (task: TaskItem) => TaskItem[];

  expanded?: boolean;
}) {
  const overdue = isOverdue(task.dueDate, task.status);

  const dueSoon = isDueSoon(task.dueDate, task.status);

  const blocked = isTaskBlocked(task.blockedBy);

  const checkInStale = isCheckInStale(task.lastCheckInAt, task.status);

  const isMyTask = task.assignee?.id === currentUserId;

  return (
    <>
      <PriorityGlow priority={task.priority} />

      <div className="flex gap-3">
        <StatusArc status={task.status} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3
              className={`font-semibold leading-snug text-white ${expanded ? "text-xl" : "text-base"}`}
            >
              {task.title}
            </h3>

            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                task.priority === "HIGH"
                  ? "text-rose-300"
                  : task.priority === "MEDIUM"
                    ? "text-amber-300"
                    : "text-emerald-300"
              }`}
            >
              {priorityLabel(task.priority)}
            </span>
          </div>

          <p className="mt-1 text-xs text-violet-300/80">
            {task.project.title}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {task.assignee ? (
              <AssigneeChip
                name={assigneeShort(task.assignee)}

                isYou={task.assignee.id === currentUserId}
              />
            ) : (
              <span className="text-[10px] text-slate-500">Unassigned</span>
            )}

            {isPeerAssigned(task, currentUserId) && (
              <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] text-cyan-300">
                Peer task
              </span>
            )}

            {blocked && (
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300">
                Blocked
              </span>
            )}

            {overdue && (
              <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] text-rose-300">
                Overdue
              </span>
            )}

            {!overdue && dueSoon && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">
                Due soon
              </span>
            )}

            {checkInStale && isMyTask && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">
                Check-in
              </span>
            )}
          </div>

          {task.dueDate && (
            <p className="mt-1.5 text-[10px] text-slate-500">
              Due {formatDueDate(task.dueDate)}
            </p>
          )}
        </div>
      </div>

      {task.description && (
        <p
          className={`mt-2 text-xs text-slate-400 ${expanded ? "line-clamp-none" : "line-clamp-2"}`}
        >
          {task.description}
        </p>
      )}

      {expanded && task.definitionOfDone && (
        <p className="mt-2 text-xs text-slate-500">
          <span className="jarvis-metric-label mr-2">DoD</span>

          {task.definitionOfDone}
        </p>
      )}

      {task.checkInNote && (
        <p className="mt-2 text-xs text-slate-500">
          {task.checkInNote}

          {task.lastCheckInAt
            ? ` · ${formatRelativeCheckIn(task.lastCheckInAt)}`
            : ""}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-violet-500/10 pt-3">
        {!task.archived && (
          <>
            <select
              className="hud-tile-select"

              value={task.status}

              onChange={(event) =>
                onUpdateTask(task.id, { status: event.target.value })
              }

              onClick={(event) => event.stopPropagation()}

              aria-label={`Status for ${task.title}`}
            >
              <option value="TODO">To do</option>

              <option value="IN_PROGRESS">In progress</option>

              <option value="DONE">Done</option>
            </select>

            <select
              className="hud-tile-select"

              value={task.priority}

              onChange={(event) =>
                onUpdateTask(task.id, { priority: event.target.value })
              }

              onClick={(event) => event.stopPropagation()}

              aria-label={`Priority for ${task.title}`}
            >
              <option value="LOW">Low</option>

              <option value="MEDIUM">Medium</option>

              <option value="HIGH">High</option>
            </select>

            <select
              className="hud-tile-select"

              value={task.blockedBy?.id ?? ""}

              onChange={(event) =>
                onUpdateTask(task.id, {
                  blockedById: event.target.value || null,
                })
              }

              onClick={(event) => event.stopPropagation()}

              aria-label={`Blocked by for ${task.title}`}
            >
              <option value="">Not blocked</option>

              {blockerOptionsForTask(task).map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.title}
                </option>
              ))}
            </select>
          </>
        )}

        {(!task.archived || task.project.ownerId === currentUserId) && (
          <select
            className="hud-tile-select"

            value={task.assignee?.id ?? ""}

            onChange={(event) =>
              onUpdateTask(task.id, { assigneeId: event.target.value || null })
            }

            onClick={(event) => event.stopPropagation()}

            aria-label={`Assignee for ${task.title}`}
          >
            <option value="">Unassigned</option>

            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {assigneeLabel(user, currentUserId)}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"

          onClick={(event) => {
            event.stopPropagation();

            onArchiveTask(task.id, !task.archived);
          }}

          className="hud-tile-btn"
        >
          {task.archived ? "Restore" : "Archive"}
        </button>
      </div>

      {!task.archived && isMyTask && task.status === "IN_PROGRESS" && (
        <div
          className="mt-2 flex flex-wrap gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <input
            className="hud-tile-input min-w-[160px] flex-1"

            placeholder="Standup check-in…"

            value={checkInDrafts[task.id] ?? ""}

            onChange={(event) =>
              onCheckInDraftChange(task.id, event.target.value)
            }

            aria-label={`Check-in for ${task.title}`}
          />

          <button
            type="button"

            onClick={() => onSubmitCheckIn(task)}

            disabled={!(checkInDrafts[task.id] ?? "").trim()}

            className="hud-tile-btn hud-tile-btn-accent disabled:opacity-40"
          >
            Check in
          </button>
        </div>
      )}

      <p className="mt-2 text-[10px] text-slate-600">
        {statusLabel(task.status)}

        {task.blockedBy ? ` · blocked by ${task.blockedBy.title}` : ""}
      </p>
    </>
  );
}

export function TaskHudView({
  tasks,

  users,

  currentUserId,

  checkInDrafts,

  onCheckInDraftChange,

  onSubmitCheckIn,

  onUpdateTask,

  onArchiveTask,

  blockerOptionsForTask,
}: TaskHudViewProps) {
  const { focusedId, toggle, focus } = useHoloFocus<string>(null, "task");
  const { setReadout } = useHoloRingReadout();

  const hasFocus = focusedId !== null;

  const orbitRadius = useMemo(() => {
    if (tasks.length <= 1) return 0;
    if (tasks.length <= 3) return 280;
    const base = 240;
    const extra = Math.min(tasks.length * 14, 160);
    return base + extra;
  }, [tasks.length]);

  const tileWidthClass =
    tasks.length <= 1
      ? "hud-task-tile-solo w-[min(480px,92vw)] md:w-[min(520px,44vw)]"
      : tasks.length <= 3
        ? "w-[min(400px,38vw)]"
        : "w-[min(360px,32vw)]";

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") focus(null);
    }

    window.addEventListener("keydown", onEscape);

    return () => window.removeEventListener("keydown", onEscape);
  }, [focus]);

  const focusedTask = tasks.find((task) => task.id === focusedId);

  useEffect(() => {
    if (focusedTask) {
      setReadout({
        metric: statusLabel(focusedTask.status).slice(0, 3).toUpperCase(),
        primary:
          focusedTask.title.length > 22
            ? `${focusedTask.title.slice(0, 20)}…`
            : focusedTask.title,
        secondary: focusedTask.project.title,
      });
      return () => setReadout(null);
    }
    return undefined;
  }, [focusedTask, setReadout]);

  return (
    <div
      className={`hud-task-field relative min-h-[560px] py-2 md:min-h-[620px] ${hasFocus ? "hud-task-field-focus" : ""}`}
      data-hud-focus={focusedId ?? undefined}
    >
      <div className="hud-task-orbit-ring relative z-[1] hidden min-h-[520px] md:block">
        {tasks.map((task, index) => {
          const slot =
            tasks.length <= 1
              ? { x: 0, y: 0, angleDeg: 0 }
              : orbitSlot(index, tasks.length, orbitRadius);

          const isFocused = focusedId === task.id;

          const isDimmed = hasFocus && !isFocused;

          const overdue = isOverdue(task.dueDate, task.status);

          const blocked = isTaskBlocked(task.blockedBy);

          return (
            <article
              key={task.id}

              role="button"

              tabIndex={0}

              aria-pressed={isFocused}

              onClick={() => toggle(task.id)}

              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();

                  toggle(task.id);
                }
              }}

              className={`hud-task-tile hud-task-tile-orbit absolute ${tileWidthClass} ${overdue ? "hud-task-tile-overdue" : ""} ${blocked ? "hud-task-tile-blocked" : ""} ${isFocused ? "hud-task-tile-focused hud-scan-sweep" : ""} ${isDimmed ? "hud-task-tile-dimmed" : ""} ${tasks.length <= 1 ? "hud-task-tile-solo" : ""}`}

              style={{
                left: `calc(50% + ${slot.x}px)`,

                top: `calc(50% + ${slot.y}px)`,

                transform: isFocused
                  ? "translate(-50%, -50%) scale(1.1) translateZ(40px)"
                  : tasks.length <= 1
                    ? "translate(-50%, -50%)"
                    : `translate(-50%, -50%) rotate(${slot.angleDeg * 0.04}deg)`,

                zIndex: isFocused ? 30 : 10 + index,
              }}
            >
              <TaskTileBody
                task={task}

                currentUserId={currentUserId}

                users={users}

                checkInDrafts={checkInDrafts}

                onCheckInDraftChange={onCheckInDraftChange}

                onSubmitCheckIn={onSubmitCheckIn}

                onUpdateTask={onUpdateTask}

                onArchiveTask={onArchiveTask}

                blockerOptionsForTask={blockerOptionsForTask}

                expanded={isFocused}
              />
            </article>
          );
        })}
      </div>

      {/* Mobile: stacked with focus mode */}

      {!hasFocus && (
        <div className="hud-task-orbit relative z-[1] grid gap-3 md:hidden">
        {tasks.map((task) => {
          const isFocused = focusedId === task.id;

          const isDimmed = hasFocus && !isFocused;

          const overdue = isOverdue(task.dueDate, task.status);

          const blocked = isTaskBlocked(task.blockedBy);

          return (
            <article
              key={task.id}

              role="button"

              tabIndex={0}

              aria-pressed={isFocused}

              onClick={() => toggle(task.id)}

              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();

                  toggle(task.id);
                }
              }}

              className={`hud-task-tile ${overdue ? "hud-task-tile-overdue" : ""} ${blocked ? "hud-task-tile-blocked" : ""} ${isFocused ? "hud-task-tile-focused hud-scan-sweep" : ""} ${isDimmed ? "hud-task-tile-dimmed" : ""}`}
            >
              <TaskTileBody
                task={task}

                currentUserId={currentUserId}

                users={users}

                checkInDrafts={checkInDrafts}

                onCheckInDraftChange={onCheckInDraftChange}

                onSubmitCheckIn={onSubmitCheckIn}

                onUpdateTask={onUpdateTask}

                onArchiveTask={onArchiveTask}

                blockerOptionsForTask={blockerOptionsForTask}

                expanded={isFocused}
              />
            </article>
          );
        })}
        </div>
      )}

      {/* Projection overlay — JARVIS foreground panel */}

      {focusedTask && (
        <div
          className="hud-projection-backdrop md:hidden"

          onClick={() => focus(null)}

          aria-hidden="true"
        />
      )}

      {focusedTask && (
        <div className="hud-projection-layer fixed inset-x-3 top-24 z-50 md:hidden">
          <article className="hud-projection-panel hud-scan-sweep mx-auto max-w-lg">
            <header className="mb-3 flex items-center justify-between gap-2">
              <p className="jarvis-status-line">Task projection</p>

              <button
                type="button"

                onClick={() => focus(null)}

                className="hud-tile-btn text-xs"

                aria-label="Close projection"
              >
                Dismiss
              </button>
            </header>

            <TaskTileBody
              task={focusedTask}

              currentUserId={currentUserId}

              users={users}

              checkInDrafts={checkInDrafts}

              onCheckInDraftChange={onCheckInDraftChange}

              onSubmitCheckIn={onSubmitCheckIn}

              onUpdateTask={onUpdateTask}

              onArchiveTask={onArchiveTask}

              blockerOptionsForTask={blockerOptionsForTask}

              expanded
            />
          </article>
        </div>
      )}

      {hasFocus && (
        <p className="relative z-[2] mt-4 text-center text-[10px] text-slate-600 md:mt-0 md:absolute md:bottom-0 md:left-0 md:right-0">
          Tap tile to project · Esc to dismiss
        </p>
      )}
    </div>
  );
}

export function TaskHudFilters({
  projects,

  users,

  currentUserId,

  projectFilter,

  assigneeFilter,

  statusFilter,

  priorityFilter,

  onProjectFilter,

  onAssigneeFilter,

  onStatusFilter,

  onPriorityFilter,

  taskCounts,
}: {
  projects: { id: string; title: string }[];

  users: UserOption[];

  currentUserId: string;

  projectFilter: string;

  assigneeFilter: string;

  statusFilter: string;

  priorityFilter: string;

  onProjectFilter: (id: string) => void;

  onAssigneeFilter: (id: string) => void;

  onStatusFilter: (status: string) => void;

  onPriorityFilter: (priority: string) => void;

  taskCounts: { todo: number; inProgress: number; done: number; high: number };
}) {
  return (
    <div className="space-y-3">
      <div className="hud-filter-strip">
        <span className="jarvis-metric-label shrink-0">Project</span>

        <div className="flex flex-wrap gap-2">
          <HudPill active={!projectFilter} onClick={() => onProjectFilter("")}>
            All
          </HudPill>

          {projects.map((project) => (
            <HudPill
              key={project.id}

              active={projectFilter === project.id}

              onClick={() =>
                onProjectFilter(projectFilter === project.id ? "" : project.id)
              }
            >
              {project.title.length > 18
                ? `${project.title.slice(0, 16)}…`
                : project.title}
            </HudPill>
          ))}
        </div>
      </div>

      <div className="hud-filter-strip">
        <span className="jarvis-metric-label shrink-0">Assignee</span>

        <div className="flex flex-wrap gap-2">
          <HudPill
            active={!assigneeFilter}
            onClick={() => onAssigneeFilter("")}
          >
            All
          </HudPill>

          {users.map((user) => (
            <HudPill
              key={user.id}

              active={assigneeFilter === user.id}

              onClick={() =>
                onAssigneeFilter(assigneeFilter === user.id ? "" : user.id)
              }
            >
              {user.id === currentUserId
                ? "You"
                : user.name.trim() || user.email}
            </HudPill>
          ))}
        </div>
      </div>

      <div className="hud-filter-strip">
        <span className="jarvis-metric-label shrink-0">Status</span>

        <div className="flex flex-wrap gap-2">
          <HudPill active={!statusFilter} onClick={() => onStatusFilter("")}>
            All
          </HudPill>

          <HudPill
            active={statusFilter === "TODO"}

            onClick={() =>
              onStatusFilter(statusFilter === "TODO" ? "" : "TODO")
            }

            count={taskCounts.todo}
          >
            To do
          </HudPill>

          <HudPill
            active={statusFilter === "IN_PROGRESS"}

            onClick={() =>
              onStatusFilter(
                statusFilter === "IN_PROGRESS" ? "" : "IN_PROGRESS",
              )
            }

            count={taskCounts.inProgress}
          >
            Active
          </HudPill>

          <HudPill
            active={statusFilter === "DONE"}

            onClick={() =>
              onStatusFilter(statusFilter === "DONE" ? "" : "DONE")
            }

            count={taskCounts.done}
          >
            Done
          </HudPill>
        </div>
      </div>

      <div className="hud-filter-strip">
        <span className="jarvis-metric-label shrink-0">Priority</span>

        <div className="flex flex-wrap gap-2">
          <HudPill
            active={!priorityFilter}
            onClick={() => onPriorityFilter("")}
          >
            All
          </HudPill>

          <HudPill
            active={priorityFilter === "HIGH"}

            onClick={() =>
              onPriorityFilter(priorityFilter === "HIGH" ? "" : "HIGH")
            }

            count={taskCounts.high}

            alert
          >
            High
          </HudPill>

          <HudPill
            active={priorityFilter === "MEDIUM"}

            onClick={() =>
              onPriorityFilter(priorityFilter === "MEDIUM" ? "" : "MEDIUM")
            }
          >
            Medium
          </HudPill>

          <HudPill
            active={priorityFilter === "LOW"}

            onClick={() =>
              onPriorityFilter(priorityFilter === "LOW" ? "" : "LOW")
            }
          >
            Low
          </HudPill>
        </div>
      </div>
    </div>
  );
}
