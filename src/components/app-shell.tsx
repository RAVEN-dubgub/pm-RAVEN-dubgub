"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HolographicThemeToggle } from "@/components/holographic-theme-toggle";
import { dispatchHoloNavPick } from "@/lib/holo-route";

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

  function onNavPick(href: string) {
    dispatchHoloNavPick(href);
  }

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cyan-400 focus:px-4 focus:py-2 focus:text-slate-950"
      >
        Skip to main content
      </a>
      <header className="holo-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Link href="/dashboard" className="holo-brand text-lg tracking-tight" onClick={() => onNavPick("/dashboard")}>
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
                  onClick={() => onNavPick(link.href)}
                  className={`holo-nav-link ${active ? "holo-nav-active" : ""}`}
                >
                  {link.label}
                </Link>
              );
            })}
            <span className="ml-2 text-slate-600" aria-hidden="true">
              |
            </span>
            <HolographicThemeToggle compact />
            <span className="ml-2 text-slate-400">{userName}</span>
            <button
              type="button"
              onClick={logout}
              className="holo-btn-outline ml-2 px-3 py-1.5 text-sm"
            >
              Log out
            </button>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <HolographicThemeToggle compact />
            <button
              type="button"
              className="holo-btn-outline px-3 py-1.5 text-sm"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id="mobile-nav"
            className="border-t border-cyan-500/10 px-4 py-3 md:hidden"
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
                      onClick={() => {
                        onNavPick(link.href);
                        setMenuOpen(false);
                      }}
                      className={`block rounded-lg px-3 py-2 ${
                        active ? "holo-nav-active" : "text-slate-300 hover:bg-cyan-500/10"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              <li className="border-t border-cyan-500/10 pt-2">
                <span className="block px-3 py-1 text-xs text-slate-500">{userName}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="holo-btn-outline mt-1 w-full px-3 py-2 text-left text-sm"
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

      <nav className="holo-bottom-nav md:hidden" aria-label="Bottom navigation">
        <ul className="flex justify-around py-2">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onNavPick(link.href)}
                  className={`holo-bottom-nav-item ${active ? "holo-bottom-nav-item-active" : ""}`}
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
