import type { CoachResult, TaskCoachContext } from "@/lib/task-coach";

function slugify(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "task-update";
}

function parseRepoSlug(githubRepoUrl: string | null) {
  if (!githubRepoUrl?.trim()) {
    return { repoSlug: "your-org/your-repo", hasRepo: false };
  }

  const match = githubRepoUrl.trim().match(/github\.com[/:]([^/\s]+)\/([^/\s#?.]+)/i);
  if (!match) {
    return { repoSlug: "your-org/your-repo", hasRepo: false };
  }

  return { repoSlug: `${match[1]}/${match[2]}`, hasRepo: true };
}

function inferCommitPrefix(title: string) {
  const lower = title.toLowerCase();
  if (/\b(fix|bug|patch|hotfix)\b/.test(lower)) return "fix";
  if (/\b(docs|readme|document)\b/.test(lower)) return "docs";
  if (/\b(test|spec)\b/.test(lower)) return "test";
  if (/\b(refactor|cleanup|chore)\b/.test(lower)) return "chore";
  return "feat";
}

function parseDoneWhen(definitionOfDone: string | null, title: string) {
  if (definitionOfDone?.trim()) {
    const items = definitionOfDone
      .split(/[;\n]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (items.length > 0) {
      return items.slice(0, 8);
    }
  }

  return [
    `"${title}" works end-to-end in the app.`,
    "Lint and build pass locally.",
    "Changes are pushed on a feature branch with a clear PR.",
  ];
}

function buildTips(context: TaskCoachContext, hasRepo: boolean) {
  const { task, project } = context;
  const tips: string[] = [];

  if (task.blockedBy && task.blockedBy.status !== "DONE") {
    tips.push(
      `Finish blocker "${task.blockedBy.title}" (${task.blockedBy.status}) before starting this task.`,
    );
  }

  tips.push("Keep the diff small - one focused change set beats a large refactor.");
  tips.push("Read nearby files first and match existing naming, types, and patterns.");

  if (!hasRepo) {
    tips.push(
      `Add a GitHub repo URL on project "${project.title}" so git commands use the real owner/repo.`,
    );
  }

  if (task.definitionOfDone?.trim()) {
    tips.push("Use the definition of done as your checklist before opening a PR.");
  } else {
    tips.push("Write a short definition of done if scope is unclear - it prevents scope creep.");
  }

  tips.push("Run `npm run lint` and `npm run build` before commit; fix failures in the same branch.");

  if (task.priority === "HIGH" || task.priority === "URGENT") {
    tips.push("This task is high priority - ship a minimal working slice first, polish second.");
  }

  return tips.slice(0, 6);
}

function buildCursorPrompt(context: TaskCoachContext, doneWhen: string[]) {
  const { task, project, assigneeName } = context;
  const description = task.description?.trim() || "(No description - infer scope from the title.)";
  const dod =
    task.definitionOfDone?.trim() ||
    "(No definition of done - use the Done when list below as acceptance criteria.)";

  const steps = [
    "1. Locate the relevant files for this task in the repo.",
    "2. Implement the smallest change that satisfies the definition of done.",
    "3. Run `npm run lint` and `npm run build`; fix any errors.",
    "4. Manually verify the feature in the app (happy path + one edge case).",
    "5. Stage, commit with a conventional message, push branch, open PR.",
  ];

  if (task.blockedBy && task.blockedBy.status !== "DONE") {
    steps.unshift(
      `0. Blocked by "${task.blockedBy.title}" - finish or unblock that task before coding.`,
    );
  }

  return [
    `## Goal`,
    `Implement: ${task.title}`,
    ``,
    `Project: ${project.title}`,
    assigneeName ? `Assignee: ${assigneeName}` : `Assignee: (unassigned)`,
    `Status: ${task.status} · Priority: ${task.priority}`,
    ``,
    `## Description`,
    description,
    ``,
    `## Definition of done`,
    dod,
    ``,
    `## Done when`,
    ...doneWhen.map((item) => `- ${item}`),
    ``,
    `## Steps`,
    ...steps,
    ``,
    `## Before commit`,
    `- Run \`npm run lint\` and \`npm run build\` - both must pass.`,
    `- Keep unrelated files out of the commit.`,
    `- Use safe git commands only (no force push, no hard reset).`,
  ].join("\n");
}

function buildGitSteps(context: TaskCoachContext, repoSlug: string, hasRepo: boolean) {
  const { task, project } = context;
  const slug = slugify(task.title);
  const prefix = inferCommitPrefix(task.title);
  const branchName = `${prefix}/${slug}`;
  const commitMessage = `${prefix}: ${task.title.charAt(0).toLowerCase()}${task.title.slice(1)}`;

  const commands = [
    `git checkout -b ${branchName}`,
    "git add .",
    `git commit -m "${commitMessage.replace(/"/g, '\\"')}"`,
    `git push -u origin ${branchName}`,
  ];

  const prTitle = `${prefix}: ${task.title}`;
  const prBody = [
    "## Summary",
    `- ${task.title}`,
    project.githubRepoUrl ? `- Project repo: ${project.githubRepoUrl}` : "",
    "",
    "## Definition of done",
    ...(task.definitionOfDone
      ? task.definitionOfDone
          .split(/[;\n]+/)
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => `- ${item}`)
      : ["- Task acceptance criteria met and verified locally."]),
    "",
    "## Test plan",
    "- [ ] `npm run lint`",
    "- [ ] `npm run build`",
    "- [ ] Manual check in the app",
    hasRepo ? "" : "- [ ] Add GitHub repo URL on the project for accurate remotes",
  ]
    .filter((line, index, arr) => line !== "" || arr[index - 1] !== "")
    .join("\n");

  return {
    branchName,
    commands,
    commitMessage,
    prTitle,
    prBody: prBody.trim(),
    repoSlug,
  };
}

export function generateTaskCoachFromTemplate(context: TaskCoachContext): CoachResult {
  const { repoSlug, hasRepo } = parseRepoSlug(context.project.githubRepoUrl);
  const doneWhen = parseDoneWhen(context.task.definitionOfDone, context.task.title);
  const tips = buildTips(context, hasRepo);
  const cursorPrompt = buildCursorPrompt(context, doneWhen);
  const git = buildGitSteps(context, repoSlug, hasRepo);

  const summaryParts = [
    `Ship "${context.task.title}" on branch \`${git.branchName}\`.`,
    `Paste the Cursor prompt, implement a focused diff, then push to \`${repoSlug}\`.`,
  ];

  if (context.task.blockedBy && context.task.blockedBy.status !== "DONE") {
    summaryParts.push(`Blocked by "${context.task.blockedBy.title}" - resolve that first.`);
  }

  const result: CoachResult = {
    summary: summaryParts.join(" "),
    tips,
    cursorPrompt,
    gitSteps: {
      branchName: git.branchName,
      commands: git.commands,
      commitMessage: git.commitMessage,
      prTitle: git.prTitle,
      prBody: git.prBody,
    },
    doneWhen,
  };

  return result;
}
