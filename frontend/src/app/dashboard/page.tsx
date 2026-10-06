import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";
import { getCurrentUser } from "@/lib/auth";
import { getStudentDashboard } from "@/lib/student-dashboard";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Learning Workspace</p>
            <h1 className="mt-2 text-2xl font-black">Sign In To View Your Dashboard</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-ink/62">Your courses, shared tests, and attempts are loaded from your account.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-md bg-moss px-4 py-2 text-sm font-black text-white">Sign In</Link>
              <Link href="/register" className="rounded-md border border-line bg-white px-4 py-2 text-sm font-black">Register</Link>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  const dashboard = await getStudentDashboard().catch(() => null);

  if (!dashboard) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Learning Workspace</p>
            <h1 className="mt-2 text-2xl font-black">Dashboard Could Not Load</h1>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardWorkspace dashboard={dashboard} />
      </section>
    </AppShell>
  );
}
