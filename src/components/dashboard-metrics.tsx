"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HowToUse } from "@/components/how-to-use";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { formatDueDate, formatRelativeCheckIn, isOverdue, statusLabel } from "@/lib/types";

type Metrics = {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  doneTasks: number;
  completionRate: number;
  myOpenTasks: number;
  myDoneTasks: number;
  myContributionPercent: number;
  overdueTasks: number;
  cohortMembers: number;
  activeMembers: number;
  peersWithOpenTasks: number;
  peerAssignedUnstarted: number;
  atRiskProjects: number;
  staleWeeklyUpdates: number;
  staleCheckIns: number;
};

type ProjectProgress = {
  id: string;
  title: string;
  done: number;
  total: number;
  progress: number;
  atRisk?: boolean;
};

type NextAction = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  project: { title: string };
  dueDate: string | null;
  fromPeer: { id: string; name: string } | null;
};

type PeerAssignedTask = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: string | null;
  projectTitle: string;
  fromName: string;
};

type RecentCompletion = {
  id: string;
  title: string;
  projectTitle: string;
  assigneeName: string;
  completedAt: string;
};

type Onboarding = {
  hasProject: boolean;
  hasTask: boolean;
  hasAssignment: boolean;
  otherCohortMembers?: number;
  needsActiveOwnedProject?: boolean;
  completedSteps: number;
  totalSteps: number;
};

type AtRiskProject = {
  id: string;
  title: string;
  ownerName: string;
  weeklyUpdate: string | null;
  weeklyUpdateAt: string | null;
};

type HabitNudges = {
  staleWeeklyUpdates: {
    id: string;
    title: string;
    weeklyUpdateAt: string | null;
    atRisk: boolean;
  }[];
  staleCheckIns: {
    id: string;
    title: string;
    projectTitle: string;
    lastCheckInAt: string | null;
    checkInNote: string | null;
  }[];
};

type TasksByStatus = {
  todo: number;
  inProgress: number;
  done: number;
  total: number;
};

function StatusChart({ data }: { data: TasksByStatus }) {
  const segments = [
    { key: "todo", label: "To do", count: data.todo, color: "bg-slate-500" },
    { key: "inProgress", label: "In progress", count: data.inProgress, color: "bg-amber-500" },
    { key: "done", label: "Done", count: data.done, color: "bg-emerald-500" },
  ];
  const max = Math.max(...segments.map((segment) => segment.count), 1);

  return (
    <div className="space-y-4">
      <div
        className="flex h-4 overflow-hidden rounded-full bg-slate-800"
        role="img"
        aria-label={`Tasks by status: ${data.todo} to do, ${data.inProgress} in progress, ${data.done} done`}
      >
        {data.total > 0 &&
          segments.map((segment) =>
            segment.count > 0 ? (
              <div
                key={segment.key}
                className={`${segment.color} transition-all`}
                style={{ width: `${(segment.count / data.total) * 100}%` }}
              />
            ) : null,
          )}
      </div>
      <ul className="space-y-3">
        {segments.map((segment) => (
          <li key={segment.key}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-300">{segment.label}</span>
              <span className="tabular-nums text-slate-400">{segment.count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div
                className={`h-2 rounded-full ${segment.color} transition-all`}
                style={{ width: `${(segment.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function cohortMotivationCopy(
  rate: number,
  activeMembers: number,
  peersWithOpenTasks: number,
) {
  if (rate >= 80) {
    return "The cohort is crushing it — keep shipping together.";
  }
  if (rate >= 50) {
    return "Halfway there. Every task you finish lifts the whole team.";
  }
  if (rate > 0) {
    return "Progress is visible. Ship one more task today and pull the cohort forward.";
  }
  if (activeMembers > 1) {
    return `${activeMembers} members are in motion — be the spark that gets tasks moving.`;
  }
  if (peersWithOpenTasks > 0) {
    return `${peersWithOpenTasks} peer${peersWithOpenTasks === 1 ? "" : "s"} have open work — your turn to contribute.`;
  }
  return "Be the first to ship — create a project and invite the cohort in.";
}

function overdueCohortNudge(overdue: number) {
  if (overdue === 0) return null;
  return `${overdue} overdue task${overdue === 1 ? "" : "s"} on your plate — clearing ${overdue === 1 ? "it" : "them"} helps the cohort stay on track.`;
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [projectProgress, setProjectProgress] = useState<ProjectProgress[]>([]);
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [peerAssignedTasks, setPeerAssignedTasks] = useState<PeerAssignedTask[]>([]);
  const [recentCompletions, setRecentCompletions] = useState<RecentCompletion[]>([]);
  const [onboarding, setOnboarding] = useState<Onboarding | null>(null);
  const [tasksByStatus, setTasksByStatus] = useState<TasksByStatus | null>(null);
  const [atRiskProjects, setAtRiskProjects] = useState<AtRiskProject[]>([]);
  const [habitNudges, setHabitNudges] = useState<HabitNudges | null>(null);

  useEffect(() => {
    fetch("/api/metrics")
      .then((response) => response.json())
      .then((data) => {
        setMetrics(data.metrics);
        setProjectProgress(data.projectProgress ?? []);
        setNextActions(data.nextActions ?? []);
        setPeerAssignedTasks(data.peerAssignedTasks ?? []);
        setRecentCompletions(data.recentCompletions ?? []);
        setOnboarding(data.onboarding);
        setTasksByStatus(data.tasksByStatus ?? null);
        setAtRiskProjects(data.atRiskProjects ?? []);
        setHabitNudges(data.habitNudges ?? null);
      });
  }, []);

  if (!metrics) {
    return (
      <div className="space-y-4" aria-live="polite" aria-busy="true">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-900/80" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-900" />
          ))}
        </div>
      </div>
    );
  }

  const overdueNudge = overdueCohortNudge(metrics.overdueTasks);

  const cards = [
    {
      label: "Active members",
      value: metrics.activeMembers,
      hint: "with open assigned tasks",
    },
    {
      label: "Peers with open work",
      value: metrics.peersWithOpenTasks,
      hint: "counting others in cohort",
    },
    { label: "Your open tasks", value: metrics.myOpenTasks, hint: "assigned to you" },
    {
      label: "Overdue",
      value: metrics.overdueTasks,
      hint: "blocking cohort momentum",
      alert: metrics.overdueTasks > 0,
    },
    {
      label: "Tasks shipped",
      value: `${metrics.doneTasks}/${metrics.totalTasks}`,
      hint: "cohort-wide done / total",
    },
  ];

  return (
    <div className="space-y-6">
      <HowToUse />

      {onboarding && onboarding.completedSteps < onboarding.totalSteps && (
        <OnboardingChecklist {...onboarding} />
      )}

      {metrics.peerAssignedUnstarted > 0 && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/40 bg-cyan-950/30 px-4 py-3"
        >
          <p className="text-sm text-cyan-100">
            <span className="font-semibold text-cyan-200">
              {metrics.peerAssignedUnstarted} peer-assigned task
              {metrics.peerAssignedUnstarted === 1 ? "" : "s"}
            </span>
            {" "}waiting on you — a cohort mate is counting on your follow-through.
          </p>
          <Link
            href="/tasks"
            className="rounded-lg holo-btn-ghost px-3 py-1.5 text-sm"
          >
            Start now
          </Link>
        </div>
      )}

      {overdueNudge && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3"
        >
          <p className="text-sm text-rose-200">{overdueNudge}</p>
          <Link
            href="/tasks"
            className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-sm font-medium text-rose-200 hover:bg-rose-500/30"
          >
            View tasks
          </Link>
        </div>
      )}

      {habitNudges &&
        (habitNudges.staleWeeklyUpdates.length > 0 ||
          habitNudges.staleCheckIns.length > 0) && (
          <section
            aria-labelledby="pm-habits-heading"
            className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5"
          >
            <h2 id="pm-habits-heading" className="text-lg font-semibold text-amber-100">
              PM habit nudges
            </h2>
            <p className="mt-1 text-sm text-amber-200/80">
              Inspired by r/PMP: update risks early, check in on active work, post weekly
              stakeholder updates.
            </p>
            <ul className="mt-4 space-y-3">
              {habitNudges.staleWeeklyUpdates.map((project) => (
                <li
                  key={`weekly-${project.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-slate-950/50 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-white">
                      Post weekly update: {project.title}
                    </p>
                    <p className="text-slate-400">
                      {project.weeklyUpdateAt
                        ? `Last update ${formatRelativeTime(project.weeklyUpdateAt)}`
                        : "No cohort update posted yet"}
                      {project.atRisk ? " · marked at risk" : ""}
                    </p>
                  </div>
                  <Link
                    href="/projects"
                    className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-200 hover:bg-amber-500/30"
                  >
                    Update project
                  </Link>
                </li>
              ))}
              {habitNudges.staleCheckIns.map((task) => (
                <li
                  key={`checkin-${task.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-slate-950/50 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-white">Standup check-in: {task.title}</p>
                    <p className="text-slate-400">
                      {task.projectTitle} · {formatRelativeCheckIn(task.lastCheckInAt)}
                    </p>
                  </div>
                  <Link
                    href="/tasks"
                    className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-200 hover:bg-amber-500/30"
                  >
                    Check in
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

      {atRiskProjects.length > 0 && (
        <section
          aria-labelledby="at-risk-heading"
          className="rounded-2xl border border-orange-500/40 bg-orange-950/25 p-5"
        >
          <h2 id="at-risk-heading" className="text-lg font-semibold text-orange-100">
            At-risk projects
          </h2>
          <p className="mt-1 text-sm text-orange-200/80">
            Cohort projects flagged before issues become blockers — escalate early, not late.
          </p>
          <ul className="mt-4 space-y-3">
            {atRiskProjects.map((project) => (
              <li
                key={project.id}
                className="rounded-xl border border-orange-500/25 bg-slate-950/50 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{project.title}</p>
                    <p className="text-orange-200/80">Owner: {project.ownerName}</p>
                  </div>
                  <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-200">
                    At risk
                  </span>
                </div>
                {project.weeklyUpdate ? (
                  <p className="mt-2 text-slate-300">{project.weeklyUpdate}</p>
                ) : (
                  <p className="mt-2 text-slate-500 italic">No status note yet</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        aria-labelledby="cohort-momentum-heading"
        className="holo-panel holo-panel-featured p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-wider text-cyan-400/80">
              Cohort momentum
            </p>
            <h2 id="cohort-momentum-heading" className="mt-1 text-xl font-semibold text-white">
              {metrics.completionRate}% of cohort tasks complete
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {cohortMotivationCopy(
                metrics.completionRate,
                metrics.activeMembers,
                metrics.peersWithOpenTasks,
              )}
            </p>
            <p className="mt-3 text-sm text-slate-400">
              <span className="font-medium text-white">{metrics.activeMembers}</span> active member
              {metrics.activeMembers === 1 ? "" : "s"}
              {" · "}
              <span className="font-medium text-white">{metrics.cohortMembers}</span> signed up
            </p>
          </div>
          <p className="text-5xl font-bold tabular-nums text-cyan-400">
            {metrics.completionRate}
            <span className="text-2xl text-slate-400">%</span>
          </p>
        </div>
        <div className="mt-5">
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
            {metrics.doneTasks} of {metrics.totalTasks} tasks marked done across the cohort
          </p>
        </div>
      </section>

      {tasksByStatus && (
        <section
          aria-labelledby="status-chart-heading"
          className="holo-panel p-5"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="status-chart-heading" className="text-lg font-semibold text-white">
              Tasks by status
            </h2>
            <div className="flex gap-4 text-sm text-slate-400">
              <span>
                <span className="font-medium text-white">{metrics.completionRate}%</span> complete
              </span>
              <span>
                <span className="font-medium text-rose-300">{metrics.overdueTasks}</span> overdue
              </span>
            </div>
          </div>
          <StatusChart data={tasksByStatus} />
        </section>
      )}

      <section
        aria-labelledby="your-contribution-heading"
        className="holo-panel p-5"
      >
        <h2 id="your-contribution-heading" className="text-lg font-semibold text-white">
          Your contribution
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Your completed work is part of what the whole cohort sees moving forward.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Tasks you&apos;ve shipped</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-emerald-300">
              {metrics.myDoneTasks}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Share of cohort completions</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-cyan-300">
              {metrics.myContributionPercent}
              <span className="text-lg text-slate-400">%</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {metrics.myDoneTasks} of {metrics.doneTasks} cohort tasks done
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Cohort activity">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`holo-card p-5 ${
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

      {recentCompletions.length > 0 && (
        <section
          aria-labelledby="recent-ships-heading"
          className="holo-panel p-5"
        >
          <h2 id="recent-ships-heading" className="text-lg font-semibold text-white">
            Recent cohort wins
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Tasks the cohort just shipped — momentum you can see.
          </p>
          <ul className="mt-4 space-y-2">
            {recentCompletions.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-slate-400">
                    {item.assigneeName} · {item.projectTitle}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {formatRelativeTime(item.completedAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {peerAssignedTasks.length > 0 && (
        <section
          aria-labelledby="peer-accountability-heading"
          className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 id="peer-accountability-heading" className="text-lg font-semibold text-white">
                From your cohort
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Tasks peers assigned to you — follow through so the team keeps moving.
              </p>
            </div>
            <Link href="/tasks" className="holo-text-link text-sm">
              All tasks →
            </Link>
          </div>
          <ul className="space-y-3">
            {peerAssignedTasks.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status);
              return (
                <li
                  key={task.id}
                  className={`rounded-xl border px-4 py-3 ${
                    overdue
                      ? "border-rose-500/40 bg-rose-950/20"
                      : task.status === "TODO"
                        ? "border-cyan-500/30 bg-cyan-950/20"
                        : "border-slate-800 bg-slate-950/70"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{task.title}</p>
                      <p className="text-sm text-cyan-300/90">
                        From {task.fromName}
                      </p>
                      <p className="text-sm text-slate-400">
                        {task.projectTitle} · {statusLabel(task.status)}
                        {task.dueDate ? ` · Due ${formatDueDate(task.dueDate)}` : ""}
                      </p>
                    </div>
                    {task.status === "TODO" && (
                      <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-300">
                        Not started
                      </span>
                    )}
                    {overdue && (
                      <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-300">
                        Overdue
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {projectProgress.length > 0 && (
        <section
          aria-labelledby="project-progress-heading"
          className="holo-panel p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 id="project-progress-heading" className="text-lg font-semibold">
              Project momentum
            </h2>
            <Link href="/projects" className="holo-text-link text-sm">
              All projects →
            </Link>
          </div>
          <ul className="space-y-4">
            {projectProgress.map((project) => (
              <li key={project.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-white">
                    {project.title}
                    {project.atRisk && (
                      <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-300">
                        At risk
                      </span>
                    )}
                  </span>
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
        className="holo-panel p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="next-actions-heading" className="text-lg font-semibold">
            Your next actions
          </h2>
          <Link href="/tasks" className="holo-text-link text-sm">
            View all →
          </Link>
        </div>
        {nextActions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-4 py-8 text-center">
            <p className="text-sm text-slate-400">
              No open tasks assigned to you — pick something up for the cohort.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Link
                href="/tasks"
                className="holo-btn-primary rounded-lg px-4 py-2 text-sm"
              >
                Browse tasks
              </Link>
              <Link
                href="/projects"
                className="holo-btn-outline rounded-lg px-4 py-2 text-sm"
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
                  {task.fromPeer && (
                    <p className="text-sm text-cyan-300/90">From {task.fromPeer.name}</p>
                  )}
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
