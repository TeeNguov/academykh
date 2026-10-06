import { mdiArrowRight, mdiClipboardTextClock } from "@mdi/js";
import { AppShell } from "@/components/AppShell";
import { EmptyList } from "@/components/EmptyList";
import { Icon } from "@/components/Icon";
import { PendingLink } from "@/components/PendingLink";
import { TeacherOnly } from "@/components/TeacherOnly";
import { testLabel, titleCase } from "@/lib/format";
import { getServerAdminAttempts } from "@/lib/server-api";

export default async function AdminAttemptsPage() {
  const attempts = await getServerAdminAttempts().catch(() => []);

  return (
    <AppShell>
      <TeacherOnly>
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Teacher Admin</p>
        <h1 className="mt-2 text-3xl font-black">Grade Attempts</h1>

        <div className="mt-7 grid gap-4">
          {attempts.length > 0 ? attempts.map((attempt) => (
            <PendingLink key={attempt.id} href={`/admin/attempts/${attempt.id}`} className="card-enter flex items-center justify-between gap-4 rounded-lg border border-line bg-white p-5 shadow-soft transition hover:border-moss">
              <span className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
                  <Icon path={mdiClipboardTextClock} size={1} />
                </span>
                <span>
                  <span className="block font-black">{attempt.studentName}</span>
                  <span className="block text-sm font-semibold text-ink/58">
                    {testLabel(attempt.testTitle, attempt.testId)} · {titleCase(attempt.status)} · {attempt.earnedPoints}/{attempt.totalPoints} pts
                  </span>
                  <span className="mt-1 block text-xs font-bold text-ink/46">
                    {attempt.submittedAt ? "Submitted" : "Started"} {formatDateTime(attempt.submittedAt ?? attempt.startedAt)}
                  </span>
                </span>
              </span>
              <Icon path={mdiArrowRight} size={0.78} />
            </PendingLink>
          )) : (
            <EmptyList title="No Attempts Yet" text="Student attempts on your tests will appear here." />
          )}
        </div>
        </section>
      </TeacherOnly>
    </AppShell>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}
