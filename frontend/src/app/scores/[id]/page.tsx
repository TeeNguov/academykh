import { notFound } from "next/navigation";
import { mdiCheckCircleOutline, mdiClockOutline } from "@mdi/js";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { OptionLabel } from "@/components/tests/OptionLabel";
import { PromptBlock } from "@/components/tests/PromptBlock";
import { testLabel, titleCase } from "@/lib/format";
import { getServerAttempt } from "@/lib/server-api";

export default async function ScoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attempt = await getServerAttempt(id).catch(() => null);

  if (!attempt) {
    notFound();
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">{attempt.studentName}</p>
          <h1 className="mt-2 text-3xl font-black">{testLabel(attempt.testTitle, attempt.testId)}</h1>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="flex items-center gap-2 rounded-md bg-mint px-3 py-2 text-sm font-black text-moss">
              <Icon path={attempt.status === "GRADED" ? mdiCheckCircleOutline : mdiClockOutline} size={0.72} />
              {titleCase(attempt.status)}
            </span>
            <span className="rounded-md border border-line px-3 py-2 text-sm font-black">
              {attempt.earnedPoints}/{attempt.totalPoints} pts
            </span>
            <span className="rounded-md border border-line px-3 py-2 text-sm font-black">
              {attempt.scorePercent ?? 0}%
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {attempt.canViewDetails === false ? (
            <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <p className="text-sm font-black text-ink/62">Your teacher has not enabled test review for this attempt.</p>
            </div>
          ) : attempt.answers.length === 0 ? (
            <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <p className="text-sm font-black text-ink/62">No answers were submitted for this attempt.</p>
            </div>
          ) : attempt.answers.map((answer, index) => (
            <article key={answer.id} className="w-full rounded-lg border border-line bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-moss">Question {index + 1}</p>
                  <PromptBlock>{answer.prompt}</PromptBlock>
                </div>
                <span className="rounded-md bg-mint px-3 py-1 text-xs font-black text-moss">
                  {answer.awardedPoints ?? 0}/{answer.points}
                </span>
              </div>
              {answer.answerText ? (
                <pre className="mt-4 overflow-auto rounded-md bg-[#0f172a] p-4 font-mono text-sm leading-6 text-mint">{answer.answerText}</pre>
              ) : (
                <div className="mt-4 grid gap-2">
                  {answer.selectedOptions.length > 0 ? answer.selectedOptions.map((option) => (
                    <p key={option.id} className="rounded-md border border-line bg-cloud px-3 py-2 text-sm font-bold text-ink">
                      <OptionLabel>{option.label}</OptionLabel>
                    </p>
                  )) : (
                    <p className="rounded-md border border-line bg-cloud px-3 py-2 text-sm font-semibold text-ink/58">No choice selected</p>
                  )}
                </div>
              )}
              {answer.feedback ? <p className="mt-4 rounded-md bg-cloud p-3 text-sm font-semibold text-ink/68">{answer.feedback}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
