import { isSmokeUser } from "@/lib/smoke-users";

export type AssigneeUser = { id: string; name: string; email: string };

export function assigneeDisplayName(user: AssigneeUser) {
  return user.name.trim() || user.email;
}

function assigneeTaskCount(userId: string, assigneeIds: string[]) {
  let count = 0;
  for (const id of assigneeIds) {
    if (id === userId) count += 1;
  }
  return count;
}

function pickPreferredUser(
  candidates: AssigneeUser[],
  currentUserId: string,
  assigneeIds: string[],
) {
  return [...candidates].sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    const taskDiff = assigneeTaskCount(b.id, assigneeIds) - assigneeTaskCount(a.id, assigneeIds);
    if (taskDiff !== 0) return taskDiff;
    return assigneeDisplayName(a).localeCompare(assigneeDisplayName(b));
  })[0];
}

function dedupeByDisplayName(
  users: AssigneeUser[],
  currentUserId: string,
  assigneeIds: string[] = [],
) {
  const byName = new Map<string, AssigneeUser[]>();
  for (const user of users) {
    const key = assigneeDisplayName(user).toLowerCase();
    const group = byName.get(key);
    if (group) group.push(user);
    else byName.set(key, [user]);
  }

  const deduped: AssigneeUser[] = [];
  for (const group of byName.values()) {
    deduped.push(
      group.length === 1
        ? group[0]
        : pickPreferredUser(group, currentUserId, assigneeIds),
    );
  }

  return deduped.sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return assigneeDisplayName(a).localeCompare(assigneeDisplayName(b));
  });
}

function withoutSmokeUsers(users: AssigneeUser[]) {
  return users.filter((user) => !isSmokeUser(user));
}

/** Assignee pills + tile dropdowns: task assignees, current user, no smoke, deduped. */
export function buildTaskAssigneeOptions(
  tasks: { assignee: AssigneeUser | null }[],
  allUsers: AssigneeUser[],
  currentUserId: string,
) {
  const assigneeIds = tasks
    .map((task) => task.assignee?.id)
    .filter((id): id is string => Boolean(id));
  const relevantIds = new Set(assigneeIds);
  relevantIds.add(currentUserId);

  const relevant = allUsers.filter((user) => relevantIds.has(user.id));
  return dedupeByDisplayName(withoutSmokeUsers(relevant), currentUserId, assigneeIds);
}

/** Create-task picker: all real cohort members, deduped, no smoke. */
export function buildAssigneePickerOptions(
  allUsers: AssigneeUser[],
  currentUserId: string,
) {
  return dedupeByDisplayName(withoutSmokeUsers(allUsers), currentUserId);
}
