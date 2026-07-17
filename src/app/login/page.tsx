import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { HolographicThemeToggle } from "@/components/holographic-theme-toggle";
import { requireUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await requireUser();
  if (user) redirect("/dashboard");

  return (
    <div className="holo-auth-shell">
      <div className="absolute right-4 top-4 z-10">
        <HolographicThemeToggle />
      </div>
      <div className="holo-auth-card">
        <h1 className="holo-brand text-2xl">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to track cohort projects and tasks.
        </p>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
        <p className="mt-4 text-sm text-slate-400">
          New here?{" "}
          <Link href="/signup" className="holo-text-link">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
