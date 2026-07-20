"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HoloWorkspace } from "@/components/holo-workspace";
import { HowToUse } from "@/components/how-to-use";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { ArcGauge, HudWidget } from "@/components/hud-primitives";
import { useClearHoloFocusOnNavigate, useHoloFocus } from "@/lib/holo-focus";
import { useHoloRingReadout } from "@/lib/holo-ring-context";

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

function StatusHudRadial({
  data,
  compact = false,
}: {
  data: TasksByStatus;
  compact?: boolean;
}) {
  const segments = [
    { label: "To do", count: data.todo, color: "cyan" as const },
    { label: "Active", count: data.inProgress, color: "amber" as const },
    { label: "Done", count: data.done, color: "emerald" as const },
  ];

  if (compact) {
    return (
      <ul className="hud-status-compact space-y-1.5">
        {segments.map((segment) => (
          <li
            key={segment.label}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="text-slate-400">{segment.label}</span>
            <span className="font-semibold tabular-nums text-white">{segment.count}</span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-4 border-t border-violet-500/15 pt-2">
          <span className="jarvis-metric-label">Total queued</span>
          <span className="text-lg font-bold tabular-nums text-white">{data.total}</span>
        </li>
      </ul>
    );
  }

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
    return "The cohort is crushing it - keep shipping together.";
  }
  if (rate >= 50) {
    return "Halfway there. Every task you finish lifts the whole team.";
  }
  if (rate > 0) {
    return "Progress is visible. Ship one more task today and pull the cohort forward.";
  }
  if (activeMembers > 1) {
    return `${activeMembers} members are in motion - be the spark that gets tasks moving.`;
  }
  if (peersWithOpenTasks > 0) {
    return `${peersWithOpenTasks} peer${peersWithOpenTasks === 1 ? "" : "s"} have open work - your turn to contribute.`;
  }
  return "Be the first to ship - create a project and invite the cohort in.";
}

function overdueCohortNudge(overdue: number) {
  if (overdue === 0) return null;
  return `${overdue} overdue task${overdue === 1 ? "" : "s"} on your plate - clearing ${overdue === 1 ? "it" : "them"} helps the cohort stay on track.`;
}

function HudWidgetSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className={`hud-widget animate-pulse border border-cyan-500/10 bg-slate-900/40 ${tall ? "min-h-[9.5rem]" : "min-h-[5.5rem]"}`}
      aria-hidden="true"
    >
      <div className="mb-3 h-2 w-16 rounded bg-slate-700/80" />
      <div className="mb-2 h-7 w-12 rounded bg-slate-700/60" />
      <div className="h-2 w-full max-w-[12rem] rounded bg-slate-800/80" />
    </div>
  );
}

function DashboardMetricsSkeleton() {
  return (
    <HoloWorkspace
      top={
        <div className="space-y-2" aria-hidden="true">
          <div className="h-3 w-48 animate-pulse rounded bg-slate-800/80" />
          <div className="h-9 w-28 animate-pulse rounded-full bg-slate-900/70" />
        </div>
      }
      bottom={
        <div className="flex gap-3 overflow-x-auto pb-1" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="hud-chip-compact min-w-[min(280px,85vw)] shrink-0 animate-pulse space-y-2"
            >
              <div className="h-2 w-16 rounded bg-slate-700/80" />
              <div className="h-3 w-32 rounded bg-slate-800/80" />
              <div className="h-3 w-24 rounded bg-slate-800/60" />
            </div>
          ))}
        </div>
      }
    >
      <div
        className="hud-dashboard-orbit"
        aria-live="polite"
        aria-busy="true"
        aria-label="Loading dashboard metrics"
      >
        <div className="hud-dashboard-orbit-inner">
          <div className="hud-orbit-pos-12">
            <HudWidgetSkeleton tall />
          </div>
          <div className="hud-orbit-pos-3">
            <HudWidgetSkeleton />
          </div>
          <div className="hud-orbit-pos-9">
            <HudWidgetSkeleton />
          </div>
          <div className="hud-orbit-pos-12-offset">
            <HudWidgetSkeleton tall />
          </div>
          <div className="hud-orbit-pos-6">
            <div className="hud-orbit-stat-row">
              {[1, 2, 3, 4, 5].map((i) => (
                <HudWidgetSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </HoloWorkspace>
  );
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const { focusedId, toggle, focus } = useHoloFocus<string>(null, "widget");
  const { setReadout } = useHoloRingReadout();
  const hasFocus = focusedId !== null;

  const clearFocus = useCallback(() => focus(null), [focus]);
  useClearHoloFocusOnNavigate(clearFocus);
  const [showGuide, setShowGuide] = useState(false);
  const [projectProgress, setProjectProgress] = useState<ProjectProgress[]>([]);
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [peerAssignedTasks, setPeerAssignedTasks] = useState<PeerAssignedTask[]>([]);
  const [recentCompletions, setRecentCompletions] = useState<RecentCompletion[]>([]);
  const [onboarding, setOnboarding] = useState<Onboarding | null>(null);
  const [tasksByStatus, setTasksByStatus] = useState<TasksByStatus | null>(null);
  const [atRiskProjects, setAtRiskProjects] = useState<AtRiskProject[]>([]);
  const [habitNudges, setHabitNudges] = useState<HabitNudges | null>(null);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") focus(null);
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [focus]);

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

  useEffect(() => {
    if (!metrics) return;
    const focusedLabel =
      focusedId === "cohort-load"
        ? "Cohort load"
        : focusedId === "your-queue"
          ? "Your queue"
          : focusedId === "overdue"
            ? "Overdue"
            : null;
    setReadout({
      metric: `${metrics.completionRate}%`,
      primary: focusedLabel ?? "COHORT",
      secondary: `${metrics.doneTasks}/${metrics.totalTasks} shipped`,
    });
    return () => setReadout(null);
  }, [focusedId, metrics, setReadout]);

  if (!metrics) {
    return <DashboardMetricsSkeleton />;
  }

  const overdueNudge = overdueCohortNudge(metrics.overdueTasks);

  const topAlerts = (
    <>
      {(metrics.peerAssignedUnstarted > 0 || overdueNudge) && (
        <div className="hud-alert-strip space-y-2">
          {metrics.peerAssignedUnstarted > 0 && (
            <div
              role="status"
              className="hud-chip-compact flex flex-wrap items-center justify-between gap-3"
            >
              <p className="text-sm text-cyan-100">
                <span className="font-semibold text-cyan-200">
                  {metrics.peerAssignedUnstarted} peer-assigned task
                  {metrics.peerAssignedUnstarted === 1 ? "" : "s"}
                </span>{" "}
                waiting on you.
              </p>
              <Link href="/tasks" className="hud-tile-btn hud-tile-btn-accent text-sm">
                Start now
              </Link>
            </div>
          )}
          {overdueNudge && (
            <div
              role="alert"
              className="hud-chip-compact flex flex-wrap items-center justify-between gap-3 border-rose-500/25"
            >
              <p className="text-sm text-rose-200">{overdueNudge}</p>
              <Link href="/tasks" className="hud-tile-btn text-sm">
                View tasks
              </Link>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowGuide((current) => !current)}
          className="hud-chip-compact text-xs text-slate-300 hover:text-white"
        >
          {showGuide ? "Hide guide" : "How to use"}
        </button>
        {onboarding && onboarding.completedSteps < onboarding.totalSteps && (
          <span className="hud-chip-compact text-xs text-amber-200/90">
            Onboarding {onboarding.completedSteps}/{onboarding.totalSteps}
          </span>
        )}
      </div>
      {showGuide ? <HowToUse /> : null}
      {onboarding && onboarding.completedSteps < onboarding.totalSteps && !showGuide ? (
        <OnboardingChecklist {...onboarding} />
      ) : null}
      {habitNudges &&
        (habitNudges.staleWeeklyUpdates.length > 0 ||
          habitNudges.staleCheckIns.length > 0) && (
          <HudWidget label="PM nudges" accent="amber" className="!p-3">
            <ul className="space-y-1.5 text-sm">
              {habitNudges.staleWeeklyUpdates.slice(0, 2).map((project) => (
                <li key={`weekly-${project.id}`} className="text-slate-300">
                  Post update: {project.title}
                </li>
              ))}
              {habitNudges.staleCheckIns.slice(0, 2).map((task) => (
                <li key={`checkin-${task.id}`} className="text-slate-300">
                  Check-in: {task.title}
                </li>
              ))}
            </ul>
          </HudWidget>
        )}
    </>
  );

  const bottomDock = (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {atRiskProjects.length > 0 && (
        <div className="hud-chip-compact min-w-[min(280px,85vw)] shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-rose-300/80">At risk</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {atRiskProjects.slice(0, 3).map((project) => (
              <li key={project.id}>
                <p className="font-medium text-white">{project.title}</p>
                <p className="text-xs text-orange-200/80">{project.ownerName}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {peerAssignedTasks.length > 0 && (
        <div className="hud-chip-compact min-w-[min(280px,85vw)] shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-cyan-300/80">Peer tasks</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {peerAssignedTasks.slice(0, 4).map((task) => (
              <li key={task.id}>
                <p className="font-medium text-white">{task.title}</p>
                <p className="text-xs text-cyan-300/80">From {task.fromName}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {nextActions.length > 0 && (
        <div className="hud-chip-compact min-w-[min(280px,85vw)] shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-violet-300/80">Next actions</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {nextActions.slice(0, 4).map((task) => (
              <li key={task.id}>
                <p className="font-medium text-white">{task.title}</p>
                <p className="text-xs text-slate-400">{task.project.title}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {recentCompletions.length > 0 && (
        <div className="hud-chip-compact min-w-[min(280px,85vw)] shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-emerald-300/80">Recent wins</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {recentCompletions.slice(0, 4).map((item) => (
              <li key={item.id}>
                <p className="font-medium text-white">{item.title}</p>
                <p className="text-xs text-slate-400">{item.assigneeName}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {projectProgress.length > 0 && (
        <div className="hud-chip-compact min-w-[min(320px,90vw)] shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-fuchsia-300/80">Momentum</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {projectProgress.slice(0, 5).map((project) => (
              <ArcGauge
                key={project.id}
                value={project.progress}
                size={56}
                strokeWidth={3}
                color={project.atRisk ? "amber" : "magenta"}
                label={
                  project.title.length > 10 ? `${project.title.slice(0, 8)}…` : project.title
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <HoloWorkspace
      top={
        <div className="space-y-2">
          <p className="jarvis-status-line">Systems online · cohort snapshot</p>
          {topAlerts}
        </div>
      }
      bottom={bottomDock}
    >
      <div className={`hud-dashboard-orbit ${hasFocus ? "hud-dashboard-grid-focus" : ""}`}>
        <div className="hud-dashboard-orbit-inner">
          <div className="hud-orbit-pos-12">
            <HudWidget
              label="Cohort load"
              accent="cyan"
              focusId="cohort-load"
              focused={focusedId === "cohort-load"}
              dimmed={hasFocus && focusedId !== "cohort-load"}
              onFocus={() => toggle("cohort-load")}
              metric={`${metrics.completionRate}%`}
            >
              <p className="text-sm text-slate-400">
                {cohortMotivationCopy(
                  metrics.completionRate,
                  metrics.activeMembers,
                  metrics.peersWithOpenTasks,
                )}
              </p>
            </HudWidget>
          </div>

          <div className="hud-orbit-pos-3">
            <HudWidget
              label="Your ship rate"
              accent="emerald"
              focusId="ship-rate"
              focused={focusedId === "ship-rate"}
              dimmed={hasFocus && focusedId !== "ship-rate"}
              onFocus={() => toggle("ship-rate")}
              metric={metrics.myDoneTasks}
            >
              <p className="text-xs text-slate-500">tasks shipped</p>
            </HudWidget>
          </div>

          <div className="hud-orbit-pos-9">
            <HudWidget
              label="Contribution"
              accent="cyan"
              focusId="contribution"
              focused={focusedId === "contribution"}
              dimmed={hasFocus && focusedId !== "contribution"}
              onFocus={() => toggle("contribution")}
              metric={`${metrics.myContributionPercent}%`}
            >
              <p className="text-xs text-slate-500">
                {metrics.myDoneTasks}/{metrics.doneTasks} cohort done
              </p>
            </HudWidget>
          </div>

          <div className="hud-orbit-pos-12-offset">
            {tasksByStatus ? (
              <HudWidget
                label="Task queue"
                accent="violet"
                focusId="task-queue"
                focused={focusedId === "task-queue"}
                dimmed={hasFocus && focusedId !== "task-queue"}
                onFocus={() => toggle("task-queue")}
              >
                <StatusHudRadial data={tasksByStatus} compact />
              </HudWidget>
            ) : null}
          </div>

          <div className="hud-orbit-pos-6">
            <div className="hud-orbit-stat-row">
              <HudWidget
                label="Your queue"
                accent="magenta"
                focusId="your-queue"
                focused={focusedId === "your-queue"}
                dimmed={hasFocus && focusedId !== "your-queue"}
                onFocus={() => toggle("your-queue")}
                metric={metrics.myOpenTasks}
              >
                <Link
                  href="/tasks"
                  className="holo-text-link text-xs"
                  onClick={(event) => event.stopPropagation()}
                >
                  Open tasks →
                </Link>
              </HudWidget>
              <HudWidget
                label="Overdue"
                accent="rose"
                className={metrics.overdueTasks > 0 ? "hud-widget-alert" : ""}
                focusId="overdue"
                focused={focusedId === "overdue"}
                dimmed={hasFocus && focusedId !== "overdue"}
                onFocus={() => toggle("overdue")}
                metric={metrics.overdueTasks}
              >
                <p className="text-xs text-slate-500">blocking momentum</p>
              </HudWidget>
              <HudWidget label="Active" accent="cyan" metric={metrics.activeMembers}>
                <p className="text-xs text-slate-500">members moving</p>
              </HudWidget>
              <HudWidget label="Peers" accent="violet" metric={metrics.peersWithOpenTasks}>
                <p className="text-xs text-slate-500">with open work</p>
              </HudWidget>
              <HudWidget label="Shipped" accent="emerald" metric={metrics.doneTasks}>
                <p className="text-xs text-slate-500">of {metrics.totalTasks} total</p>
              </HudWidget>
            </div>
          </div>
        </div>
      </div>
    </HoloWorkspace>
  );
}
