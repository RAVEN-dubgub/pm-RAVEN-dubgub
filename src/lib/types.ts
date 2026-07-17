import type { TaskPriority, TaskStatus } from "@prisma/client";

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export function statusLabel(status: TaskStatus) {
  return TASK_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export function priorityLabel(priority: TaskPriority) {
  return TASK_PRIORITIES.find((item) => item.value === priority)?.label ?? priority;
}

export function statusColorClass(status: TaskStatus) {
  switch (status) {
    case "TODO":
      return "bg-slate-700 text-slate-200";
    case "IN_PROGRESS":
      return "bg-amber-500/20 text-amber-300";
    case "DONE":
      return "bg-emerald-500/20 text-emerald-300";
    default:
      return "bg-slate-700 text-slate-200";
  }
}

export function priorityColorClass(priority: TaskPriority) {
  switch (priority) {
    case "LOW":
      return "bg-emerald-500/20 text-emerald-300";
    case "MEDIUM":
      return "bg-amber-500/20 text-amber-300";
    case "HIGH":
      return "bg-rose-500/20 text-rose-300";
    default:
      return "bg-slate-700 text-slate-200";
  }
}

export function isTaskBlocked(
  blockedBy: { status: TaskStatus } | null | undefined,
) {
  return Boolean(blockedBy && blockedBy.status !== "DONE");
}

export function isOverdue(dueDate: string | Date | null, status: TaskStatus) {
  if (!dueDate || status === "DONE") return false;
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function isDueSoon(dueDate: string | Date | null, status: TaskStatus) {
  if (!dueDate || status === "DONE") return false;
  const due = typeof dueDate === "string" ? new Date(dueDate) : new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 3;
}

export function formatDueDate(dueDate: string | Date) {
  return new Date(dueDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function isWeeklyUpdateStale(
  weeklyUpdateAt: string | Date | null,
  archived = false,
) {
  if (archived) return false;
  if (!weeklyUpdateAt) return true;
  const updated =
    typeof weeklyUpdateAt === "string" ? new Date(weeklyUpdateAt) : weeklyUpdateAt;
  return Date.now() - updated.getTime() > 7 * MS_PER_DAY;
}

export function isCheckInStale(
  lastCheckInAt: string | Date | null,
  status: TaskStatus,
) {
  if (status !== "IN_PROGRESS") return false;
  if (!lastCheckInAt) return true;
  const checkedIn =
    typeof lastCheckInAt === "string" ? new Date(lastCheckInAt) : lastCheckInAt;
  return Date.now() - checkedIn.getTime() > 2 * MS_PER_DAY;
}

export function formatRelativeCheckIn(iso: string | Date | null) {
  if (!iso) return "Never checked in";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / MS_PER_DAY);
  if (diffDays === 0) return "Checked in today";
  if (diffDays === 1) return "Checked in yesterday";
  return `Last check-in ${diffDays}d ago`;
}
