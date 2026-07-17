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
      <div className="mb-4">
        <p className="jarvis-status-line">Systems online · cohort snapshot</p>
        <h1 className="holo-brand mt-1 text-2xl sm:text-3xl">Command center</h1>
      </div>
      <DashboardMetrics />
    </AppShell>
  );
}
