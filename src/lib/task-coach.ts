import { z } from "zod";
import { generateTaskCoachFromTemplate } from "@/lib/task-coach-template";

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

export async function generateTaskCoach(context: TaskCoachContext): Promise<CoachResult> {
  return coachResultSchema.parse(generateTaskCoachFromTemplate(context));
}
