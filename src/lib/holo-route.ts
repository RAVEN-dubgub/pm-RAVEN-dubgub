export type HoloRoute =
  | "dashboard"
  | "projects"
  | "tasks"
  | "login"
  | "signup"
  | "default";

export function resolveHoloRoute(pathname: string): HoloRoute {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/projects")) return "projects";
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/login")) return "login";
  if (pathname.startsWith("/signup")) return "signup";
  return "default";
}

export function dispatchHoloNavPick(route: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("holo-nav-pick", { detail: { route } }),
  );
  window.dispatchEvent(
    new CustomEvent("holo-focus-pick", { detail: { id: route, kind: "nav" } }),
  );
}

export const HOLO_NAV_SEGMENTS = [
  { href: "/dashboard", label: "Dashboard", angle: 0 },
  { href: "/projects", label: "Projects", angle: 120 },
  { href: "/tasks", label: "Tasks", angle: 240 },
] as const;
