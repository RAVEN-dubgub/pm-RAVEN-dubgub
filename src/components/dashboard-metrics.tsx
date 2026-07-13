"use client";

import { useEffect, useState } from "react";
import { statusLabel } from "@/lib/types";

type Metrics = {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  doneTasks: number;
  completionRate: number;
  myOpenTasks: number;
  overdueTasks: number;
  cohortMembers: number;
};

type NextAction = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  project: { title: string };
  dueDate: string | null;
};

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [nextActions, setNextActions] = useState<NextAction[]>([]);

  useEffect(() => {
    fetch("/api/metrics")
      .then((response) => response.json())
      .then((data) => {
        setMetrics(data.metrics);
        setNextActions(data.nextActions);
      });
  }, []);

  if (!metrics) {
    return <p className="text-slate-400">Loading cohort snapshot...</p>;
  }

  const cards = [
    { label: "Cohort completion", value: `${metrics.completionRate}%` },
    { label: "Active projects", value: metrics.activeProjects },
    { label: "Open tasks assigned to you", value: metrics.myOpenTasks },
    { label: "Overdue tasks", value: metrics.overdueTasks },
    { label: "Cohort members", value: metrics.cohortMembers },
    { label: "Tasks shipped", value: `${metrics.doneTasks}/${metrics.totalTasks}` },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5"
          >
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="mb-4 text-lg font-semibold">Your next actions</h2>
        {nextActions.length === 0 ? (
          <p className="text-sm text-slate-400">
            No open tasks assigned to you. Create one or ask a peer to assign work.
          </p>
        ) : (
          <ul className="space-y-3">
            {nextActions.map((task) => (
              <li
                key={task.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3"
              >
                <p className="font-medium text-white">{task.title}</p>
                <p className="text-sm text-slate-400">
                  {task.project.title} · {statusLabel(task.status)}
                  {task.dueDate
                    ? ` · Due ${new Date(task.dueDate).toLocaleDateString()}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
