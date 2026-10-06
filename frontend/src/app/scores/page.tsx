import Link from "next/link";
import { mdiArrowRight, mdiClipboardTextClock, mdiTrophyVariant } from "@mdi/js";
import { AppShell } from "@/components/AppShell";
import { EmptyList } from "@/components/EmptyList";
import { Icon } from "@/components/Icon";
import { testLabel, titleCase } from "@/lib/format";
import { getServerAttempts } from "@/lib/server-api";

export default async function ScoresPage() {
  const attempts = await getServerAttempts().catch(() => []);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Scores</p>
        <h1 className="mt-2 text-3xl font-black">Submitted Tests</h1>
        <div className="mt-7 grid gap-4">
          {attempts.length > 0 ? attempts.map((attempt) => (
            <article key={attempt.id} className="card-enter rounded-lg border border-line bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-black">{testLabel(attempt.testTitle, attempt.testId)}</h2>
                  <p className="mt-1 text-sm font-semibold text-ink/58">{attempt.studentName} · {titleCase(attempt.status)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-2 rounded-md bg-mint px-3 py-2 text-sm font-black text-moss">
                    <Icon path={attempt.status === "GRADED" ? mdiTrophyVariant : mdiClipboardTextClock} size={0.7} />
                    {attempt.status === "GRADED" ? `${attempt.scorePercent}%` : "Waiting For Grade"}
                  </span>
                  <Link href={`/scores/${attempt.id}`} className="flex items-center gap-1 text-sm font-black text-moss">
                    View
                    <Icon path={mdiArrowRight} size={0.7} />
                  </Link>
                </div>
              </div>
            </article>
          )) : (
            <EmptyList title="No Submitted Tests Yet" text="Your submitted tests and scores will appear here." />
          )}
        </div>
      </section>
    </AppShell>
  );
}
