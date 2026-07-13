import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { requireUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await requireUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to track cohort projects and tasks.
        </p>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
        <p className="mt-4 text-sm text-slate-400">
          New here?{" "}
          <Link href="/signup" className="text-cyan-400 hover:text-cyan-300">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
