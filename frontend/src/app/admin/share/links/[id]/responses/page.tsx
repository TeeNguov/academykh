import { mdiArrowRight, mdiClipboardTextClock } from "@mdi/js";
import { AppShell } from "@/components/AppShell";
import { EmptyList } from "@/components/EmptyList";
import { Icon } from "@/components/Icon";
import { PendingLink } from "@/components/PendingLink";
import { TeacherOnly } from "@/components/TeacherOnly";
import { testLabel, titleCase } from "@/lib/format";
import { getServerShareLinkAttempts } from "@/lib/server-api";

export default async function ShareLinkResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attempts = await getServerShareLinkAttempts(id).catch(() => []);

  return (
    <AppShell>
      <TeacherOnly>
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Share Link</p>
          <h1 className="mt-2 text-3xl font-black">Responses</h1>

          <div className="mt-7 grid gap-4">
            {attempts.length > 0 ? attempts.map((attempt) => (
              <PendingLink key={attempt.id} href={`/admin/share/links/${id}/responses/${attempt.id}`} className="card-enter flex items-center justify-between gap-4 rounded-lg border border-line bg-white p-5 shadow-soft transition hover:border-moss">
                <span className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
                    <Icon path={mdiClipboardTextClock} size={1} />
                  </span>
                  <span>
                    <span className="block font-black">{attempt.studentName}</span>
                    <span className="block text-sm font-semibold text-ink/58">
                      {testLabel(attempt.testTitle, attempt.testId)} · {titleCase(attempt.status)} · {attempt.earnedPoints}/{attempt.totalPoints} pts
                    </span>
                  </span>
                </span>
                <Icon path={mdiArrowRight} size={0.78} />
              </PendingLink>
            )) : (
              <EmptyList title="No Responses Yet" text="Student responses for this share link will appear here." />
            )}
          </div>
        </section>
      </TeacherOnly>
    </AppShell>
  );
}
