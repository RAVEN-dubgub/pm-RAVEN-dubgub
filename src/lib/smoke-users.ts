const SMOKE_EMAILS = new Set(["staff-review@hult-cohort.test"]);

const SMOKE_NAME_PATTERNS = ["test user", "smoke test", "smoke user"];

export function isSmokeUser(user: { email: string; name: string }) {
  if (SMOKE_EMAILS.has(user.email.toLowerCase())) return true;
  const name = user.name.toLowerCase();
  return SMOKE_NAME_PATTERNS.some((pattern) => name.includes(pattern));
}

export function deprioritizeSmoke<T extends { owner?: { email: string; name: string } }>(
  items: T[],
) {
  const real: T[] = [];
  const smoke: T[] = [];
  for (const item of items) {
    if (item.owner && isSmokeUser(item.owner)) {
      smoke.push(item);
    } else {
      real.push(item);
    }
  }
  return [...real, ...smoke];
}
