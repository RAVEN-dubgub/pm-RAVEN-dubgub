import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DashboardMetrics } from "@/components/dashboard-metrics";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  return (
    <AppShell userName={user.name}>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-white">Cohort snapshot</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          See where the cohort stands, what is shipping, and what needs your
          attention next. Progress visibility is the motivation layer.
        </p>
      </div>
      <DashboardMetrics />
    </AppShell>
  );
}
