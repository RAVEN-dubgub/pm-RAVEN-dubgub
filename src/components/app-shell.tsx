"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type AppShellProps = {
  userName: string;
  children: React.ReactNode;
};

export function AppShell({ userName, children }: AppShellProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-white">
              Cohort PM
            </Link>
            <p className="text-sm text-slate-400">Ship together. Track everything.</p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-slate-300 hover:text-white">
              Dashboard
            </Link>
            <Link href="/projects" className="text-slate-300 hover:text-white">
              Projects
            </Link>
            <Link href="/tasks" className="text-slate-300 hover:text-white">
              Tasks
            </Link>
            <span className="hidden text-slate-500 sm:inline">{userName}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:border-slate-500 hover:text-white"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
