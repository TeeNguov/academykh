import { mdiFileDocumentEdit, mdiFilePlusOutline, mdiLinkVariant } from "@mdi/js";
import { AppShell } from "@/components/AppShell";
import { EmptyList } from "@/components/EmptyList";
import { Icon } from "@/components/Icon";
import { PendingLink } from "@/components/PendingLink";
import { TeacherOnly } from "@/components/TeacherOnly";
import { testLabel } from "@/lib/format";
import { getServerQuizzes } from "@/lib/server-api";

export default async function AdminTestListPage() {
  const quizzes = await getServerQuizzes().catch(() => []);

  return (
    <AppShell>
      <TeacherOnly>
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Teacher Admin</p>
            <h1 className="mt-2 text-3xl font-black">Published Tests</h1>
          </div>
          <PendingLink href="/admin/tests/add" className="flex w-fit items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white">
            <Icon path={mdiFilePlusOutline} size={0.72} />
            Create Test
          </PendingLink>
        </div>

        <div className="mt-7 grid gap-4">
          {quizzes.length > 0 ? quizzes.map((quiz) => (
            <article key={quiz.id} className="card-enter flex flex-col justify-between gap-4 rounded-lg border border-line bg-white p-5 shadow-soft md:flex-row md:items-center">
              <span className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
                  <Icon path={mdiFileDocumentEdit} size={1} />
                </span>
                <span>
                  <span className="block font-black">{testLabel(quiz.title, quiz.id)}</span>
                  <span className="block text-sm font-semibold text-ink/58">
                    {quiz.questionCount} questions · {quiz.totalPoints} pts · {quiz.exam ? "Exam" : "Quiz"}
                  </span>
                </span>
              </span>
              <span className="flex flex-wrap gap-2 md:justify-end">
                <PendingLink href={`/admin/tests/edit/${quiz.id}`} className="flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white">
                  <Icon path={mdiFileDocumentEdit} size={0.72} />
                  View / Edit
                </PendingLink>
                <PendingLink href={`/admin/share/links?testId=${quiz.id}`} className="flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white">
                  <Icon path={mdiLinkVariant} size={0.72} />
                  Link
                </PendingLink>
              </span>
            </article>
          )) : (
            <EmptyList title="No Published Tests Yet" text="Create a test and it will show up in this list." />
          )}
        </div>
        </section>
      </TeacherOnly>
    </AppShell>
  );
}
