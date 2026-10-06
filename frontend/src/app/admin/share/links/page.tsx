import { AppShell } from "@/components/AppShell";
import { TeacherOnly } from "@/components/TeacherOnly";
import { ShareLinkManager } from "@/components/tests/ShareLinkManager";
import { getServerQuizzes, getServerShareLinks, getServerStudentGroups } from "@/lib/server-api";

export default async function AdminShareLinksPage({ searchParams }: { searchParams: Promise<{ testId?: string }> }) {
  const [{ testId }, quizzes, links, groups] = await Promise.all([
    searchParams,
    getServerQuizzes().catch(() => []),
    getServerShareLinks().catch(() => []),
    getServerStudentGroups().catch(() => [])
  ]);

  return (
    <AppShell>
      <TeacherOnly>
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Teacher Admin</p>
        <h1 className="mt-2 text-3xl font-black">Share Test Links</h1>
        <div className="mt-7">
          <ShareLinkManager quizzes={quizzes} links={links} groups={groups} initialTestId={testId} />
        </div>
        </section>
      </TeacherOnly>
    </AppShell>
  );
}
