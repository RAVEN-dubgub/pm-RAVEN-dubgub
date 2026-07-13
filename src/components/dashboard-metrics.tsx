"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { formatDueDate, isOverdue, statusLabel } from "@/lib/types";

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

type ProjectProgress = {
  id: string;
  title: string;
  done: number;
  total: number;
  progress: number;
};

type NextAction = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  project: { title: string };
  dueDate: string | null;
};

type Onboarding = {
  hasProject: boolean;
  hasTask: boolean;
  hasAssignment: boolean;
  completedSteps: number;
  totalSteps: number;
};

function motivationMessage(rate: number, overdue: number) {
  if (overdue > 0) {
    return `${overdue} task${overdue === 1 ? "" : "s"} past due — knock ${overdue === 1 ? "it" : "them"} out to get the cohort back on track.`;
  }
  if (rate >= 80) return "The cohort is crushing it. Keep the momentum going!";
  if (rate >= 50) return "Halfway there — every completed task lifts the whole team.";
  if (rate > 0) return "Progress is visible. Ship one more task today.";
  return "Be the first to ship — create a project and add tasks.";
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [projectProgress, setProjectProgress] = useState<ProjectProgress[]>([]);
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [onboarding, setOnboarding] = useState<Onboarding | null>(null);

  useEffect(() => {
    fetch("/api/metrics")
      .then((response) => response.json())
      .then((data) => {
        setMetrics(data.metrics);
        setProjectProgress(data.projectProgress ?? []);
        setNextActions(data.nextActions);
        setOnboarding(data.onboarding);
      });
  }, []);

  if (!metrics) {
    return (
      <div className="space-y-4" aria-live="polite" aria-busy="true">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-900" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-900" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Active projects", value: metrics.activeProjects, hint: "across cohort" },
    { label: "Your open tasks", value: metrics.myOpenTasks, hint: "assigned to you" },
    {
      label: "Overdue",
      value: metrics.overdueTasks,
      hint: "need attention",
      alert: metrics.overdueTasks > 0,
    },
    { label: "Cohort members", value: metrics.cohortMembers, hint: "signed up" },
    {
      label: "Tasks shipped",
      value: `${metrics.doneTasks}/${metrics.totalTasks}`,
      hint: "done / total",
    },
  ];

  return (
    <div className="space-y-6">
      {onboarding && onboarding.completedSteps < onboarding.totalSteps && (
        <OnboardingChecklist {...onboarding} />
      )}

      {metrics.overdueTasks > 0 && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3"
        >
          <p className="text-sm text-rose-200">
            <span className="font-semibold">{metrics.overdueTasks} overdue task{metrics.overdueTasks === 1 ? "" : "s"}</span>
            {" "}assigned to you — update status or adjust due dates.
          </p>
          <Link
            href="/tasks"
            className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-sm font-medium text-rose-200 hover:bg-rose-500/30"
          >
            View tasks
          </Link>
        </div>
      )}

      <section
        aria-labelledby="cohort-progress-heading"
        className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="cohort-progress-heading" className="text-lg font-semibold text-white">
              Cohort completion
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {motivationMessage(metrics.completionRate, metrics.overdueTasks)}
            </p>
          </div>
          <p className="text-4xl font-bold tabular-nums text-cyan-400">
            {metrics.completionRate}
            <span className="text-2xl text-slate-400">%</span>
          </p>
        </div>
        <div className="mt-4">
          <div
            className="h-3 rounded-full bg-slate-800"
            role="progressbar"
            aria-valuenow={metrics.completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Cohort task completion rate"
          >
            <div
              className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {metrics.doneTasks} of {metrics.totalTasks} tasks marked done
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Key metrics">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border p-5 ${
              card.alert
                ? "border-rose-500/40 bg-rose-950/20"
                : "border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950"
            }`}
          >
            <p className="text-sm text-slate-400">{card.label}</p>
            <p
              className={`mt-2 text-3xl font-semibold tabular-nums ${
                card.alert ? "text-rose-300" : "text-white"
              }`}
            >
              {card.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
          </div>
        ))}
      </section>

      {projectProgress.length > 0 && (
        <section
          aria-labelledby="project-progress-heading"
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 id="project-progress-heading" className="text-lg font-semibold">
              Project momentum
            </h2>
            <Link href="/projects" className="text-sm text-cyan-400 hover:text-cyan-300">
              All projects →
            </Link>
          </div>
          <ul className="space-y-4">
            {projectProgress.map((project) => (
              <li key={project.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-white">{project.title}</span>
                  <span className="text-slate-400">
                    {project.done}/{project.total} · {project.progress}%
                  </span>
                </div>
                <div
                  className="h-2 rounded-full bg-slate-800"
                  role="progressbar"
                  aria-valuenow={project.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${project.title} progress`}
                >
                  <div
                    className="h-2 rounded-full bg-cyan-500 transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        aria-labelledby="next-actions-heading"
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="next-actions-heading" className="text-lg font-semibold">
            Your next actions
          </h2>
          <Link href="/tasks" className="text-sm text-cyan-400 hover:text-cyan-300">
            View all →
          </Link>
        </div>
        {nextActions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-4 py-8 text-center">
            <p className="text-sm text-slate-400">No open tasks assigned to you.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Link
                href="/tasks"
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
              >
                Create a task
              </Link>
              <Link
                href="/projects"
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
              >
                Start a project
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {nextActions.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status);
              return (
                <li
                  key={task.id}
                  className={`rounded-xl border px-4 py-3 ${
                    overdue
                      ? "border-rose-500/40 bg-rose-950/20"
                      : "border-slate-800 bg-slate-950/70"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium text-white">{task.title}</p>
                    {overdue && (
                      <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-300">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    {task.project.title} · {statusLabel(task.status)}
                    {task.dueDate ? ` · Due ${formatDueDate(task.dueDate)}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
