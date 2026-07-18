"use client";

import Link from "next/link";

type OnboardingProps = {
  hasProject: boolean;
  hasTask: boolean;
  hasAssignment: boolean;
  otherCohortMembers?: number;
  needsActiveOwnedProject?: boolean;
  completedSteps: number;
  totalSteps: number;
};

const STEPS = [
  { key: "account", label: "Create your account", href: null, alwaysDone: true },
  { key: "project", label: "Create a project", href: "/projects", check: "hasProject" as const },
  { key: "task", label: "Add your first task", href: "/tasks", check: "hasTask" as const },
  {
    key: "assign",
    label: "Assign a task to another cohort member",
    href: "/tasks",
    check: "hasAssignment" as const,
  },
];

function step4Hint(
  hasTask: boolean,
  hasAssignment: boolean,
  otherCohortMembers: number,
  needsActiveOwnedProject: boolean,
) {
  if (hasAssignment || !hasTask) return null;
  if (needsActiveOwnedProject) {
    return "Your projects are archived, so you cannot assign from the active task list. Restore a project on Projects, or show archived tasks and change Assignee on one of your tasks to another member (not yourself).";
  }
  if (otherCohortMembers === 0) {
    return "Ask a cohort peer to sign up, then assign one of your tasks to them (not yourself).";
  }
  return `On Tasks, change a task's Assignee on your project to someone else - ${otherCohortMembers} other member${otherCohortMembers === 1 ? "" : "s"} are registered. Assigning to yourself does not count. Cross-project assignments count too.`;
}

export function OnboardingChecklist({
  hasProject,
  hasTask,
  hasAssignment,
  otherCohortMembers = 0,
  needsActiveOwnedProject = false,
  completedSteps,
  totalSteps,
}: OnboardingProps) {
  const checks = { hasProject, hasTask, hasAssignment };
  const progress = Math.round((completedSteps / totalSteps) * 100);
  const isComplete = completedSteps >= totalSteps;
  const assignHint = step4Hint(
    hasTask,
    hasAssignment,
    otherCohortMembers,
    needsActiveOwnedProject,
  );

  if (isComplete) return null;

  return (
    <section
      aria-labelledby="onboarding-heading"
      className="holo-panel holo-panel-featured p-5"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="onboarding-heading" className="text-lg font-semibold text-white">
            Join the cohort in 4 steps
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Set up your account so peers can assign you work and you can see cohort progress.
          </p>
        </div>
        <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm font-medium text-cyan-300">
          {completedSteps}/{totalSteps} done
        </span>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>Setup progress</span>
          <span>{progress}%</span>
        </div>
        <div
          className="holo-progress-track h-2"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Onboarding progress"
        >
          <div
            className="holo-progress-fill h-2 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol className="space-y-2">
        {STEPS.map((step, index) => {
          const done =
            step.alwaysDone ||
            (step.check ? checks[step.check] : false);

          return (
            <li
              key={step.key}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                done ? "bg-emerald-500/10" : "bg-slate-950/50"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-emerald-500 text-slate-950"
                    : "border border-slate-600 text-slate-400"
                }`}
                aria-hidden="true"
              >
                {done ? "✓" : index + 1}
              </span>
              {done ? (
                <span className="text-sm text-emerald-300 line-through opacity-80">
                  {step.label}
                </span>
              ) : step.href ? (
                <Link
                  href={step.href}
                  className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
                >
                  {step.label} →
                </Link>
              ) : (
                <span className="text-sm text-slate-300">{step.label}</span>
              )}
            </li>
          );
        })}
      </ol>

      {assignHint && (
        <p className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/30 px-4 py-3 text-sm text-cyan-100/90">
          <span className="font-medium text-cyan-200">Step 4: </span>
          {assignHint}
        </p>
      )}
    </section>
  );
}
