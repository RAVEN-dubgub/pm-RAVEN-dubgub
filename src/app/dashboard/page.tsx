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
      <DashboardMetrics />
    </AppShell>
  );
}
