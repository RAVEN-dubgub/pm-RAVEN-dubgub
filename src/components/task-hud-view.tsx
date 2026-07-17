"use client";

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

type UserOption = { id: string; name: string; email: string };
type BlockerRef = { id: string; title: string; status: "TODO" | "IN_PROGRESS" | "DONE" };
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
  return task.assignee?.id === currentUserId && task.project.ownerId !== currentUserId;
}

function layoutOffset(index: number, total: number) {
  if (total <= 1) return { x: 0, y: 0, rotate: 0 };
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const radius = Math.min(12 + total * 2, 28);
  const stagger = (index % 3) * 4 - 4;
  return {
    x: Math.cos(angle) * radius + stagger,
    y: Math.sin(angle) * (radius * 0.35) + (index % 2) * 6,
    rotate: (index % 5) - 2,
  };
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
  return (
    <div className="hud-task-field relative min-h-[420px] py-4">
      <div className="hud-task-field-center" aria-hidden="true">
        <div className="hud-task-field-ring" />
        <p className="jarvis-metric-label text-center">{tasks.length} active</p>
      </div>

      <div className="hud-task-orbit relative z-[1] grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
        {tasks.map((task, index) => {
          const overdue = isOverdue(task.dueDate, task.status);
          const dueSoon = isDueSoon(task.dueDate, task.status);
          const blocked = isTaskBlocked(task.blockedBy);
          const checkInStale = isCheckInStale(task.lastCheckInAt, task.status);
          const isMyTask = task.assignee?.id === currentUserId;
          const offset = layoutOffset(index, tasks.length);

          return (
            <article
              key={task.id}
              className={`hud-task-tile group ${overdue ? "hud-task-tile-overdue" : ""} ${blocked ? "hud-task-tile-blocked" : ""}`}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.rotate}deg)`,
              }}
            >
              <PriorityGlow priority={task.priority} />

              <div className="flex gap-3">
                <StatusArc status={task.status} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-medium leading-snug text-white">{task.title}</h3>
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

                  <p className="mt-1 text-xs text-violet-300/80">{task.project.title}</p>

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
                <p className="mt-2 line-clamp-2 text-xs text-slate-400">{task.description}</p>
              )}

              {task.checkInNote && (
                <p className="mt-2 text-xs text-slate-500">
                  {task.checkInNote}
                  {task.lastCheckInAt ? ` · ${formatRelativeCheckIn(task.lastCheckInAt)}` : ""}
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
                      onUpdateTask(task.id, {
                        assigneeId: event.target.value || null,
                      })
                    }
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
                  onClick={() => onArchiveTask(task.id, !task.archived)}
                  className="hud-tile-btn"
                >
                  {task.archived ? "Restore" : "Archive"}
                </button>
              </div>

              {!task.archived && isMyTask && task.status === "IN_PROGRESS" && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    className="hud-tile-input min-w-[160px] flex-1"
                    placeholder="Standup check-in…"
                    value={checkInDrafts[task.id] ?? ""}
                    onChange={(event) => onCheckInDraftChange(task.id, event.target.value)}
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
            </article>
          );
        })}
      </div>
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
          <HudPill active={!assigneeFilter} onClick={() => onAssigneeFilter("")}>
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
              {user.id === currentUserId ? "You" : user.name.trim() || user.email}
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
            onClick={() => onStatusFilter(statusFilter === "TODO" ? "" : "TODO")}
            count={taskCounts.todo}
          >
            To do
          </HudPill>
          <HudPill
            active={statusFilter === "IN_PROGRESS"}
            onClick={() =>
              onStatusFilter(statusFilter === "IN_PROGRESS" ? "" : "IN_PROGRESS")
            }
            count={taskCounts.inProgress}
          >
            Active
          </HudPill>
          <HudPill
            active={statusFilter === "DONE"}
            onClick={() => onStatusFilter(statusFilter === "DONE" ? "" : "DONE")}
            count={taskCounts.done}
          >
            Done
          </HudPill>
        </div>
      </div>

      <div className="hud-filter-strip">
        <span className="jarvis-metric-label shrink-0">Priority</span>
        <div className="flex flex-wrap gap-2">
          <HudPill active={!priorityFilter} onClick={() => onPriorityFilter("")}>
            All
          </HudPill>
          <HudPill
            active={priorityFilter === "HIGH"}
            onClick={() => onPriorityFilter(priorityFilter === "HIGH" ? "" : "HIGH")}
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
            onClick={() => onPriorityFilter(priorityFilter === "LOW" ? "" : "LOW")}
          >
            Low
          </HudPill>
        </div>
      </div>
    </div>
  );
}
