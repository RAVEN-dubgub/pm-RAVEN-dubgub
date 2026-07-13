import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { requireUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await requireUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Join the board</h1>
        <p className="mt-2 text-sm text-slate-400">
          Create your account. Peers can assign tasks to you by email.
        </p>
        <div className="mt-6">
          <AuthForm mode="signup" />
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
