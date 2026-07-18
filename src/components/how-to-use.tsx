"use client";

import { useState } from "react";
import Link from "next/link";

const STEPS = [
  {
    title: "Create a project",
    body: "Go to Projects and add a title + optional description. Every cohort member can own multiple projects.",
    href: "/projects",
  },
  {
    title: "Add tasks",
    body: "On Tasks, pick a project, set priority, due date, and optional blocker (another task in the same project).",
    href: "/tasks",
  },
  {
    title: "Assign to a peer - not yourself",
    body: "Use the Assignee dropdown. Pick another cohort member (not “(you)”) so the team can track who owns what.",
    href: "/tasks",
  },
  {
    title: "Archive vs delete",
    body: "Archive hides a project or task from active views but keeps history. Use archive for finished work; permanent delete is not exposed in the UI.",
    href: "/projects",
  },
];

export function HowToUse() {
  const [open, setOpen] = useState(false);

  return (
    <section
      aria-labelledby="how-to-use-heading"
      className="holo-panel"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div>
          <h2 id="how-to-use-heading" className="text-lg font-semibold text-white">
            How to use this app
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Quick guide for cohort members and graders.
          </p>
        </div>
        <span className="holo-text-link shrink-0 text-sm">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="border-t border-cyan-500/10 px-5 pb-5 pt-4">
          <ol className="space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-semibold text-cyan-300"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-medium text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{step.body}</p>
                  <Link
                    href={step.href}
                    className="holo-text-link mt-2 inline-block text-sm"
                  >
                    Open {step.href.replace("/", "")} →
                  </Link>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-xs text-slate-500">
            Live URL:{" "}
            <a
              href="https://pm-raven-dubgub.vercel.app"
              className="holo-text-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              pm-raven-dubgub.vercel.app
            </a>
            {" · "}
            Sign up with any email (8+ char password) to test multi-user assignment.
          </p>
        </div>
      )}
    </section>
  );
}
