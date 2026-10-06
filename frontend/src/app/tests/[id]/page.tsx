import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mdiClockOutline, mdiFileDocumentCheckOutline } from "@mdi/js";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { StudentTestForm } from "@/components/tests/StudentTestForm";
import { getQuiz } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { testLabel } from "@/lib/format";
import { buildShareMetadata } from "@/lib/metadata";

type TakeTestPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TakeTestPageProps): Promise<Metadata> {
  const { id } = await params;
  const quiz = await getQuiz(id).catch(() => null);
  const label = quiz ? testLabel(quiz.title, quiz.id) : "Test";
  const description = quiz
    ? `${quiz.questionCount} questions, ${quiz.totalPoints} points${quiz.durationMinutes ? `, ${quiz.durationMinutes} minutes` : ""}.`
    : "Take this test on Academy KH.";

  return buildShareMetadata({
    title: label,
    description,
    path: `/tests/${id}`,
    label
  });
}

export default async function TakeTestPage({ params }: TakeTestPageProps) {
  const { id } = await params;
  const [quiz, currentUser] = await Promise.all([
    getQuiz(id).catch(() => null),
    getCurrentUser()
  ]);

  if (!quiz) {
    notFound();
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">{quiz.exam ? "Exam" : "Quiz"}</p>
          <h1 className="mt-2 text-3xl font-black">{testLabel(quiz.title, quiz.id)}</h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-ink/62">
            <span className="flex items-center gap-2">
              <Icon path={mdiFileDocumentCheckOutline} size={0.72} />
              {quiz.questionCount} questions · {quiz.totalPoints} pts
            </span>
            <span className="flex items-center gap-2">
              <Icon path={mdiClockOutline} size={0.72} />
              {quiz.durationMinutes ? `${quiz.durationMinutes} min` : "No limit"}
            </span>
          </div>
        </div>
        <div className="mt-5">
          <StudentTestForm quiz={quiz} currentUser={currentUser} />
        </div>
      </section>
    </AppShell>
  );
}
