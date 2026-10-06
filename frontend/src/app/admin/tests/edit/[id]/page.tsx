import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { TeacherOnly } from "@/components/TeacherOnly";
import { TestBuilder } from "@/components/tests/TestBuilder";
import { getServerQuizForEditing } from "@/lib/server-api";

export default async function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await getServerQuizForEditing(id).catch(() => null);

  if (!quiz) {
    notFound();
  }

  return (
    <AppShell>
      <TeacherOnly>
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Teacher Admin</p>
        <h1 className="mt-2 text-3xl font-black">Edit Test</h1>
        <div className="mt-7">
          <TestBuilder initialQuiz={quiz} />
        </div>
        </section>
      </TeacherOnly>
    </AppShell>
  );
}
