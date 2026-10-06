import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { TeacherOnly } from "@/components/TeacherOnly";
import { GradeAttemptForm } from "@/components/tests/GradeAttemptForm";
import { testLabel, titleCase } from "@/lib/format";
import { getServerShareLinkAttempt } from "@/lib/server-api";

export default async function ShareLinkResponseDetailPage({ params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const { id, attemptId } = await params;
  const attempt = await getServerShareLinkAttempt(id, attemptId).catch(() => null);

  if (!attempt) {
    notFound();
  }

  return (
    <AppShell>
      <TeacherOnly>
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Response Detail</p>
            <h1 className="mt-2 text-3xl font-black">{testLabel(attempt.testTitle, attempt.testId)}</h1>
            <p className="mt-2 text-sm font-semibold text-ink/58">
              {attempt.studentName} · {titleCase(attempt.status)} · {attempt.earnedPoints}/{attempt.totalPoints} pts
            </p>
          </div>
          <div className="mt-5 w-full">
            <GradeAttemptForm attempt={attempt} />
          </div>
        </section>
      </TeacherOnly>
    </AppShell>
  );
}
