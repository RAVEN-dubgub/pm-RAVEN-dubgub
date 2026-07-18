import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const coachResultSchema = z.object({
  summary: z.string(),
  tips: z.array(z.string()).min(3).max(8),
  cursorPrompt: z.string(),
  gitSteps: z.object({
    branchName: z.string(),
    commands: z.array(z.string()).min(2).max(8),
    commitMessage: z.string(),
    prTitle: z.string(),
    prBody: z.string(),
  }),
  doneWhen: z.array(z.string()).min(1).max(8),
});

export type CoachResult = z.infer<typeof coachResultSchema>;

export type TaskCoachContext = {
  task: {
    id: string;
    title: string;
    description: string | null;
    definitionOfDone: string | null;
    status: string;
    priority: string;
    dueDate: string | null;
    blockedBy: { title: string; status: string } | null;
  };
  project: {
    title: string;
    githubRepoUrl: string | null;
  };
  assigneeName: string | null;
  requesterName: string;
};

function formatDueDate(iso: string | null) {
  if (!iso) return "No due date";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildSystemPrompt() {
  return `You are a task coach for Hult cohort students shipping software with Cursor Agent and GitHub.

Rules:
- Give practical, small-scope advice. Prefer focused diffs over large refactors.
- The cursorPrompt must be a complete block the student can paste into Cursor Agent. Include: goal, definition of done, files to touch, steps, and "run lint/build before commit".
- gitSteps.commands must be safe git commands only: checkout -b, add, commit, push. NEVER suggest force push, hard reset, or destructive commands.
- Branch names: lowercase kebab-case, prefix with task slug (e.g. feat/add-task-coach).
- commitMessage: conventional commit style (feat:, fix:, docs:).
- prTitle and prBody: ready to paste into GitHub PR form.
- If githubRepoUrl is missing, use placeholder owner/repo in commands and mention adding the repo URL on the project.
- If task is blocked, tips should mention finishing the blocker first.
- Keep tips concise (one sentence each).`;
}

function buildUserPrompt(context: TaskCoachContext) {
  const { task, project, assigneeName, requesterName } = context;
  const repo = project.githubRepoUrl ?? "(no repo URL — use your-org/your-repo placeholder)";

  return `Generate a Cursor + GitHub shipping plan for this assigned task.

Project: ${project.title}
GitHub repo: ${repo}
Assignee: ${assigneeName ?? "Unassigned"}
Requested by: ${requesterName}

Task title: ${task.title}
Status: ${task.status}
Priority: ${task.priority}
Due: ${formatDueDate(task.dueDate)}
${task.blockedBy ? `Blocked by: "${task.blockedBy.title}" (${task.blockedBy.status})` : "Not blocked"}

Description:
${task.description?.trim() || "(none)"}

Definition of done:
${task.definitionOfDone?.trim() || "(none — infer sensible completion criteria from title and description)"}`;
}

export async function generateTaskCoach(context: TaskCoachContext): Promise<CoachResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = createOpenAI({ apiKey });

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: coachResultSchema,
    system: buildSystemPrompt(),
    prompt: buildUserPrompt(context),
    temperature: 0.4,
  });

  return object;
}
