import type { Prisma } from "@prisma/client";

/** Lifetime peer-assignment credit for onboarding step 4 (includes archived tasks). */
export function peerAssignmentOnboardingWhere(userId: string): Prisma.TaskWhereInput {
  return {
    assigneeId: { not: null },
    NOT: { assigneeId: userId },
    OR: [{ project: { ownerId: userId } }, { assignedById: userId }],
  };
}
