import Link from "next/link";
import { mdiArrowRight, mdiClockOutline, mdiFileDocumentCheckOutline } from "@mdi/js";
import { AppShell } from "@/components/AppShell";
import { EmptyList } from "@/components/EmptyList";
import { Icon } from "@/components/Icon";
import { getCurrentUser } from "@/lib/auth";
import { testLabel } from "@/lib/format";
import { getStudentDashboard } from "@/lib/student-dashboard";

export default async function ExamsPage() {
  const currentUser = await getCurrentUser();
  const studentDashboard = currentUser
    ? await getStudentDashboard().catch(() => null)
    : null;
  const sharedTests = studentDashboard?.sharedTests ?? [];

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Assessments</p>
          <h1 className="text-3xl font-black">Tests</h1>
        </div>

        <div className="mt-7 grid gap-4">
          {sharedTests.length > 0 ? sharedTests.map((test) => (
              <article key={test.id} className="card-enter rounded-lg border border-line bg-white p-5 shadow-soft">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black">{testLabel(test.testTitle, test.testId)}</h2>
                      <span className="rounded-md bg-mint px-2 py-1 text-xs font-black text-moss">Shared Link</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold text-ink/62">
                      <span className="flex items-center gap-2">
                        <Icon path={mdiFileDocumentCheckOutline} size={0.72} />
                        {test.questionCount} questions
                      </span>
                      <span className="flex items-center gap-2">
                        <Icon path={mdiClockOutline} size={0.72} />
                        {test.durationMinutes ? `${test.durationMinutes} min` : "No Limit"}
                      </span>
                    </div>
                  </div>
                  <Link href={`/tests/take/${test.token}`} className="flex items-center justify-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white">
                    Take Test
                    <Icon path={mdiArrowRight} size={0.72} />
                  </Link>
                </div>
              </article>
          )) : (
            <EmptyList title="No Tests Available" text="Tests only appear here when you are invited through an open share link." />
          )}
        </div>
      </section>
    </AppShell>
  );
}
