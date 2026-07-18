"use client";

import Link from "next/link";
import { useState } from "react";
import type { CoachResult } from "@/lib/task-coach";
import type { TaskStatus } from "@prisma/client";

type TaskCoachPanelProps = {
  taskId: string;
  projectId: string;
  blockedBy: { title: string; status: TaskStatus } | null;
  githubRepoUrl: string | null;
};

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function TaskCoachPanel({
  taskId,
  projectId,
  blockedBy,
  githubRepoUrl,
}: TaskCoachPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coach, setCoach] = useState<CoachResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const blocked = Boolean(blockedBy && blockedBy.status !== "DONE");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/tasks/${taskId}/coach`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not generate plan");
        return;
      }
      setCoach(data.coach);
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(label: string, text: string) {
    await copyText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 2000);
  }

  const gitBlock = coach
    ? [
        `# Branch: ${coach.gitSteps.branchName}`,
        ...coach.gitSteps.commands,
        "",
        `# Commit message:\n${coach.gitSteps.commitMessage}`,
        "",
        `# PR title:\n${coach.gitSteps.prTitle}`,
        "",
        `# PR body:\n${coach.gitSteps.prBody}`,
      ].join("\n")
    : "";

  return (
    <div className="mt-3 border-t border-violet-500/15 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="jarvis-status-line text-[10px]">Task coach · ship with Cursor</p>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void handleGenerate();
          }}
          disabled={loading}
          className="hud-tile-btn hud-tile-btn-accent text-xs disabled:cursor-not-allowed"
        >
          {loading ? "Generating…" : coach ? "Refresh plan" : "Get Cursor plan"}
        </button>
      </div>

      {!githubRepoUrl ? (
        <p className="mt-2 text-xs text-amber-200/90">
          Add a GitHub repo URL on{" "}
          <Link
            href="/projects"
            className="holo-text-link"
            onClick={(event) => event.stopPropagation()}
          >
            Projects
          </Link>{" "}
          for accurate git commands (project #{projectId.slice(0, 6)}…).
        </p>
      ) : null}

      {blocked && blockedBy ? (
        <p className="mt-2 rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2 text-xs text-amber-100">
          Finish blocker first: <strong>{blockedBy.title}</strong> ({blockedBy.status})
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      {coach ? (
        <div className="mt-3 space-y-3 text-sm" onClick={(event) => event.stopPropagation()}>
          <p className="text-slate-300">{coach.summary}</p>

          <div>
            <p className="jarvis-metric-label mb-1">Tips</p>
            <ul className="list-inside list-disc space-y-1 text-xs text-slate-400">
              {coach.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="jarvis-metric-label mb-1">Done when</p>
            <ul className="list-inside list-disc space-y-1 text-xs text-slate-400">
              {coach.doneWhen.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="jarvis-metric-label">Cursor prompt</p>
              <button
                type="button"
                className="hud-tile-btn text-[10px]"
                onClick={() => void handleCopy("cursor", coach.cursorPrompt)}
              >
                {copied === "cursor" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="max-h-48 overflow-auto rounded-lg border border-cyan-500/15 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-cyan-100/90 whitespace-pre-wrap">
              {coach.cursorPrompt}
            </pre>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="jarvis-metric-label">Git &amp; PR</p>
              <button
                type="button"
                className="hud-tile-btn text-[10px]"
                onClick={() => void handleCopy("git", gitBlock)}
              >
                {copied === "git" ? "Copied" : "Copy all"}
              </button>
            </div>
            <p className="mb-1 text-xs text-slate-500">
              Branch: <code className="text-cyan-200/80">{coach.gitSteps.branchName}</code>
            </p>
            <pre className="max-h-40 overflow-auto rounded-lg border border-violet-500/15 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap">
              {coach.gitSteps.commands.join("\n")}
            </pre>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="hud-tile-btn text-[10px]"
                onClick={() => void handleCopy("commit", coach.gitSteps.commitMessage)}
              >
                {copied === "commit" ? "Copied commit" : "Copy commit msg"}
              </button>
              <button
                type="button"
                className="hud-tile-btn text-[10px]"
                onClick={() => void handleCopy("pr", `${coach.gitSteps.prTitle}\n\n${coach.gitSteps.prBody}`)}
              >
                {copied === "pr" ? "Copied PR" : "Copy PR text"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          Focus this task → Get Cursor plan → paste in Cursor → push PR.
        </p>
      )}
    </div>
  );
}
