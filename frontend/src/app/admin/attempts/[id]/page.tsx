import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { TeacherOnly } from "@/components/TeacherOnly";
import { GradeAttemptForm } from "@/components/tests/GradeAttemptForm";
import { testLabel, titleCase } from "@/lib/format";
import { getServerAttempt } from "@/lib/server-api";

export default async function GradeAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attempt = await getServerAttempt(id).catch(() => null);

  if (!attempt) {
    notFound();
  }

  return (
    <AppShell>
      <TeacherOnly>
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Grade Attempt</p>
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
