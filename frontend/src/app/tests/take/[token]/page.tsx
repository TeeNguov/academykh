import type { Metadata } from "next";
import Link from "next/link";
import { mdiLoginVariant } from "@mdi/js";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { SharedTestStart } from "@/components/tests/SharedTestStart";
import { getCurrentUser } from "@/lib/auth";
import { SITE_NAME, buildShareMetadata } from "@/lib/metadata";
import { getServerSharedQuiz } from "@/lib/server-api";

type SharedTestPageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: SharedTestPageProps): Promise<Metadata> {
  const { token } = await params;
  const quiz = await getServerSharedQuiz(token).catch(() => null);
  const label = quiz?.shareLink.label?.trim() || "Shared Test";
  const title = `${label} | Powered by ${SITE_NAME}`;
  const description = "Take this test online. Powered by Academy KH.";

  return buildShareMetadata({
    title,
    description,
    path: `/tests/take/${token}`,
    label
  });
}

export default async function TakeSharedTestPage({ params }: SharedTestPageProps) {
  const { token } = await params;
  const [sharedQuizResult, currentUser] = await Promise.all([
    getServerSharedQuiz(token).then((quiz) => ({ quiz, error: null })).catch((error) => ({
      quiz: null,
      error: error instanceof Error ? error.message : "This test link is unavailable."
    })),
    getCurrentUser()
  ]);
  const { quiz, error } = sharedQuizResult;

  if (!quiz) {
    return (
      <AppShell>
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Shared test</p>
            <h1 className="mt-2 text-2xl font-black">This Test Link Is Unavailable</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-ink/62">{error}</p>
            {!currentUser ? (
              <Link href="/login" className="mt-5 flex w-fit items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white">
                <Icon path={mdiLoginVariant} size={0.74} />
                Sign In
              </Link>
            ) : null}
          </div>
        </section>
      </AppShell>
    );
  }

  if (quiz.shareLink.simpleMode) {
    return (
      <main className="min-h-screen bg-cloud text-ink">
        <section className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex-1">
            <SharedTestStart token={token} sharedQuiz={quiz} currentUser={currentUser} simpleMode />
          </div>
          <footer className="mt-10 border-t border-line pt-5 text-center text-xs font-black uppercase tracking-[0.14em] text-ink/46">
            Powered by Academy Kh
          </footer>
        </section>
      </main>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <SharedTestStart token={token} sharedQuiz={quiz} currentUser={currentUser} />
      </section>
    </AppShell>
  );
}
