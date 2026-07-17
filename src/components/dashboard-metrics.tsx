"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HowToUse } from "@/components/how-to-use";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { ArcGauge, HudWidget } from "@/components/hud-primitives";
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

function StatusHudRadial({ data }: { data: TasksByStatus }) {
  const segments = [
    { label: "To do", count: data.todo, color: "cyan" as const },
    { label: "Active", count: data.inProgress, color: "amber" as const },
    { label: "Done", count: data.done, color: "emerald" as const },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 sm:justify-start">
      {segments.map((segment) => (
        <ArcGauge
          key={segment.label}
          value={segment.count}
          max={Math.max(data.total, 1)}
          size={76}
          strokeWidth={4}
          color={segment.color}
          label={segment.label}
        >
          <span className="text-base font-bold tabular-nums text-white">{segment.count}</span>
        </ArcGauge>
      ))}
      <div className="text-center sm:text-left">
        <p className="text-2xl font-bold tabular-nums text-white">{data.total}</p>
        <p className="jarvis-metric-label">Total queued</p>
      </div>
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

  return (
    <div className="space-y-6">
      <HowToUse />

      {onboarding && onboarding.completedSteps < onboarding.totalSteps && (
        <OnboardingChecklist {...onboarding} />
      )}

      {(metrics.peerAssignedUnstarted > 0 || overdueNudge) && (
        <div className="hud-alert-strip space-y-3">
          {metrics.peerAssignedUnstarted > 0 && (
            <div
              role="status"
              className="hud-widget hud-widget-cyan flex flex-wrap items-center justify-between gap-3 !p-4"
            >
              <p className="text-sm text-cyan-100">
                <span className="font-semibold text-cyan-200">
                  {metrics.peerAssignedUnstarted} peer-assigned task
                  {metrics.peerAssignedUnstarted === 1 ? "" : "s"}
                </span>
                {" "}waiting on you.
              </p>
              <Link href="/tasks" className="hud-tile-btn hud-tile-btn-accent text-sm">
                Start now
              </Link>
            </div>
          )}

          {overdueNudge && (
            <div
              role="alert"
              className="hud-widget hud-widget-rose flex flex-wrap items-center justify-between gap-3 !p-4"
            >
              <p className="text-sm text-rose-200">{overdueNudge}</p>
              <Link href="/tasks" className="hud-tile-btn text-sm">
                View tasks
              </Link>
            </div>
          )}
        </div>
      )}

      {habitNudges &&
        (habitNudges.staleWeeklyUpdates.length > 0 ||
          habitNudges.staleCheckIns.length > 0) && (
          <HudWidget
            label="PM habit nudges"
            title="Update risks & check-ins early"
            accent="amber"
          >
            <ul className="space-y-2">
              {habitNudges.staleWeeklyUpdates.map((project) => (
                <li
                  key={`weekly-${project.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/15 bg-slate-950/40 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-white">Post update: {project.title}</p>
                    <p className="text-xs text-slate-400">
                      {project.weeklyUpdateAt
                        ? `Last ${formatRelativeTime(project.weeklyUpdateAt)}`
                        : "No update yet"}
                    </p>
                  </div>
                  <Link href="/projects" className="hud-tile-btn text-xs">
                    Update
                  </Link>
                </li>
              ))}
              {habitNudges.staleCheckIns.map((task) => (
                <li
                  key={`checkin-${task.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/15 bg-slate-950/40 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-white">Check-in: {task.title}</p>
                    <p className="text-xs text-slate-400">
                      {task.projectTitle} · {formatRelativeCheckIn(task.lastCheckInAt)}
                    </p>
                  </div>
                  <Link href="/tasks" className="hud-tile-btn text-xs">
                    Check in
                  </Link>
                </li>
              ))}
            </ul>
          </HudWidget>
        )}

      {atRiskProjects.length > 0 && (
        <HudWidget label="Escalation" title="At-risk projects" accent="rose">
          <ul className="space-y-2">
            {atRiskProjects.map((project) => (
              <li
                key={project.id}
                className="rounded-lg border border-orange-500/20 bg-slate-950/40 px-3 py-2 text-sm"
              >
                <p className="font-medium text-white">{project.title}</p>
                <p className="text-xs text-orange-200/80">Owner: {project.ownerName}</p>
                {project.weeklyUpdate ? (
                  <p className="mt-1 text-xs text-slate-400">{project.weeklyUpdate}</p>
                ) : (
                  <p className="mt-1 text-xs italic text-slate-600">No status note</p>
                )}
              </li>
            ))}
          </ul>
        </HudWidget>
      )}

      <div className="hud-dashboard-grid">
        <HudWidget label="Cohort load" accent="cyan" className="hud-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xl font-semibold text-white">
                {metrics.completionRate}% complete
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {cohortMotivationCopy(
                  metrics.completionRate,
                  metrics.activeMembers,
                  metrics.peersWithOpenTasks,
                )}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {metrics.activeMembers} active · {metrics.cohortMembers} signed up
              </p>
            </div>
            <ArcGauge value={metrics.completionRate} size={110} color="cyan">
              <span className="text-2xl font-bold tabular-nums text-white">
                {metrics.completionRate}
              </span>
              <span className="text-xs text-slate-400">%</span>
            </ArcGauge>
          </div>
        </HudWidget>

        {tasksByStatus && (
          <HudWidget label="Task queue" title="Status breakdown" accent="violet" className="hud-span-2">
            <StatusHudRadial data={tasksByStatus} />
            <p className="mt-3 text-xs text-slate-500">
              {metrics.overdueTasks} overdue · {metrics.completionRate}% complete
            </p>
          </HudWidget>
        )}

        <HudWidget label="Your ship rate" accent="emerald">
          <ArcGauge value={metrics.myDoneTasks} max={Math.max(metrics.doneTasks, 1)} size={80} color="emerald">
            <span className="text-lg font-bold text-white">{metrics.myDoneTasks}</span>
          </ArcGauge>
          <p className="mt-2 text-xs text-slate-500">tasks shipped by you</p>
        </HudWidget>

        <HudWidget label="Contribution" accent="cyan">
          <ArcGauge value={metrics.myContributionPercent} size={80} color="cyan">
            <span className="text-lg font-bold text-white">{metrics.myContributionPercent}</span>
          </ArcGauge>
          <p className="mt-2 text-xs text-slate-500">
            {metrics.myDoneTasks}/{metrics.doneTasks} cohort done
          </p>
        </HudWidget>

        <HudWidget label="Active members" accent="cyan">
          <p className="text-3xl font-bold tabular-nums text-white">{metrics.activeMembers}</p>
          <p className="text-xs text-slate-500">with open tasks</p>
        </HudWidget>

        <HudWidget label="Peers working" accent="violet">
          <p className="text-3xl font-bold tabular-nums text-white">{metrics.peersWithOpenTasks}</p>
          <p className="text-xs text-slate-500">others in cohort</p>
        </HudWidget>

        <HudWidget label="Your queue" accent="magenta">
          <p className="text-3xl font-bold tabular-nums text-white">{metrics.myOpenTasks}</p>
          <p className="text-xs text-slate-500">open assigned</p>
        </HudWidget>

        <HudWidget
          label="Overdue"
          accent="rose"
          className={metrics.overdueTasks > 0 ? "hud-widget-alert" : ""}
        >
          <p className={`text-3xl font-bold tabular-nums ${metrics.overdueTasks > 0 ? "text-rose-300" : "text-white"}`}>
            {metrics.overdueTasks}
          </p>
          <p className="text-xs text-slate-500">blocking momentum</p>
        </HudWidget>

        <HudWidget label="Shipped" accent="emerald" className="hud-span-2">
          <div className="flex items-center gap-4">
            <ArcGauge
              value={metrics.doneTasks}
              max={Math.max(metrics.totalTasks, 1)}
              size={72}
              color="emerald"
            >
              <span className="text-base font-bold text-white">{metrics.doneTasks}</span>
            </ArcGauge>
            <div>
              <p className="text-lg font-semibold text-white">
                {metrics.doneTasks}/{metrics.totalTasks}
              </p>
              <p className="text-xs text-slate-500">cohort tasks complete</p>
            </div>
          </div>
        </HudWidget>
      </div>

      {recentCompletions.length > 0 && (
        <HudWidget label="Recent wins" title="Cohort momentum" accent="emerald">
          <ul className="space-y-2">
            {recentCompletions.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/10 bg-slate-950/40 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">
                    {item.assigneeName} · {item.projectTitle}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500">
                  {formatRelativeTime(item.completedAt)}
                </span>
              </li>
            ))}
          </ul>
        </HudWidget>
      )}

      <div className="hud-dashboard-grid">
        {peerAssignedTasks.length > 0 && (
          <HudWidget
            label="Peer accountability"
            title="From your cohort"
            accent="cyan"
            className="hud-span-2"
          >
            <div className="mb-3 flex justify-end">
              <Link href="/tasks" className="holo-text-link text-xs">
                All tasks →
              </Link>
            </div>
            <ul className="space-y-2">
              {peerAssignedTasks.map((task) => {
                const overdue = isOverdue(task.dueDate, task.status);
                return (
                  <li
                    key={task.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      overdue
                        ? "border-rose-500/30 bg-rose-950/20"
                        : "border-cyan-500/15 bg-slate-950/40"
                    }`}
                  >
                    <p className="font-medium text-white">{task.title}</p>
                    <p className="text-xs text-cyan-300/80">From {task.fromName}</p>
                    <p className="text-xs text-slate-400">
                      {task.projectTitle} · {statusLabel(task.status)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </HudWidget>
        )}

        {projectProgress.length > 0 && (
          <HudWidget label="Project momentum" accent="magenta" className="hud-span-2">
            <div className="mb-3 flex justify-end">
              <Link href="/projects" className="holo-text-link text-xs">
                All projects →
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {projectProgress.map((project) => (
                <ArcGauge
                  key={project.id}
                  value={project.progress}
                  size={68}
                  strokeWidth={4}
                  color={project.atRisk ? "amber" : "magenta"}
                  label={project.title.length > 14 ? `${project.title.slice(0, 12)}…` : project.title}
                  sublabel={`${project.done}/${project.total}`}
                />
              ))}
            </div>
          </HudWidget>
        )}

        <HudWidget
          label="Next actions"
          title="Your queue"
          accent="violet"
          className="hud-span-2"
        >
          <div className="mb-3 flex justify-end">
            <Link href="/tasks" className="holo-text-link text-xs">
              View all →
            </Link>
          </div>
          {nextActions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-violet-500/20 px-4 py-6 text-center">
              <p className="text-sm text-slate-400">No open tasks assigned to you.</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Link href="/tasks" className="holo-btn-primary rounded-lg px-3 py-1.5 text-sm">
                  Browse tasks
                </Link>
                <Link href="/projects" className="holo-btn-outline rounded-lg px-3 py-1.5 text-sm">
                  Start project
                </Link>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {nextActions.map((task) => {
                const overdue = isOverdue(task.dueDate, task.status);
                return (
                  <li
                    key={task.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      overdue ? "border-rose-500/30 bg-rose-950/20" : "border-slate-800/60 bg-slate-950/40"
                    }`}
                  >
                    <p className="font-medium text-white">{task.title}</p>
                    {task.fromPeer && (
                      <p className="text-xs text-cyan-300/80">From {task.fromPeer.name}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {task.project.title} · {statusLabel(task.status)}
                      {task.dueDate ? ` · Due ${formatDueDate(task.dueDate)}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </HudWidget>
      </div>
    </div>
  );
}
