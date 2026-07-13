"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AppShellProps = {
  userName: string;
  children: React.ReactNode;
};

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/tasks", label: "Tasks" },
];

export function AppShell({ userName, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cyan-500 focus:px-4 focus:py-2 focus:text-slate-950"
      >
        Skip to main content
      </a>
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-white">
              Cohort PM
            </Link>
            <p className="hidden text-sm text-slate-400 sm:block">Ship together. Track everything.</p>
          </div>

          <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    active
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <span className="ml-2 text-slate-500" aria-hidden="true">
              |
            </span>
            <span className="ml-2 text-slate-400">{userName}</span>
            <button
              type="button"
              onClick={logout}
              className="ml-2 rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:border-slate-500 hover:text-white"
            >
              Log out
            </button>
          </nav>

          <button
            type="button"
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {menuOpen && (
          <nav
            id="mobile-nav"
            className="border-t border-slate-800 px-4 py-3 md:hidden"
            aria-label="Mobile navigation"
          >
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                      className={`block rounded-lg px-3 py-2 ${
                        active
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              <li className="border-t border-slate-800 pt-2">
                <span className="block px-3 py-1 text-xs text-slate-500">{userName}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="mt-1 w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-slate-300"
                >
                  Log out
                </button>
              </li>
            </ul>
          </nav>
        )}
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-900/95 backdrop-blur md:hidden"
        aria-label="Bottom navigation"
      >
        <ul className="flex justify-around py-2">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`block px-4 py-1 text-xs font-medium ${
                    active ? "text-cyan-400" : "text-slate-400"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="h-14 md:hidden" aria-hidden="true" />
    </div>
  );
}
