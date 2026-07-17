import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { HolographicThemeToggle } from "@/components/holographic-theme-toggle";
import { requireUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await requireUser();
  if (user) redirect("/dashboard");

  return (
    <div className="holo-auth-shell">
      <div className="absolute right-4 top-4 z-10">
        <HolographicThemeToggle />
      </div>
      <div className="holo-auth-card">
        <h1 className="holo-brand text-2xl">Join the board</h1>
        <p className="mt-2 text-sm text-slate-400">
          Create your account. Peers can assign tasks to you by email.
        </p>
        <div className="mt-6">
          <AuthForm mode="signup" />
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="holo-text-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
