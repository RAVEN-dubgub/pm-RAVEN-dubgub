import type { TaskStatus } from "@prisma/client";

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
];

export function statusLabel(status: TaskStatus) {
  return TASK_STATUSES.find((item) => item.value === status)?.label ?? status;
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
