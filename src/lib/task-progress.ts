export type TaskProgressInput = {
  status: string;
  archived?: boolean;
};

export type TaskProgress = {
  done: number;
  total: number;
  progress: number;
};

/** Active (non-archived) tasks only: DONE / total as 0–100. */
export function computeTaskProgress(tasks: TaskProgressInput[] | null | undefined): TaskProgress {
  const active = (tasks ?? []).filter((task) => !task.archived);
  const total = active.length;
  const done = active.filter((task) => task.status === "DONE").length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, progress };
}

export function sumTaskProgress(projects: { tasks: TaskProgressInput[] }[]): TaskProgress {
  let done = 0;
  let total = 0;
  for (const project of projects) {
    const stats = computeTaskProgress(project.tasks);
    done += stats.done;
    total += stats.total;
  }
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, progress };
}
