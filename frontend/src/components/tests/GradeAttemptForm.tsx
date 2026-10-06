"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { mdiCheckboxMarkedCircleOutline } from "@mdi/js";
import { ApiAttemptDetail, completeAttempt, gradeAttempt } from "@/lib/api";
import { LoadingButton } from "@/components/LoadingButton";
import { useToast } from "@/components/ToastProvider";
import { OptionLabel } from "@/components/tests/OptionLabel";
import { PromptBlock } from "@/components/tests/PromptBlock";
import { titleCase } from "@/lib/format";

export function GradeAttemptForm({ attempt }: { attempt: ApiAttemptDetail }) {
  const router = useRouter();
  const toast = useToast();
  const [grades, setGrades] = useState(() => Object.fromEntries(attempt.answers.map((answer) => [answer.id, {
    awardedPoints: answer.awardedPoints ?? 0,
    feedback: answer.feedback ?? ""
  }])));
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  async function onComplete() {
    setCompleting(true);
    try {
      await completeAttempt(attempt.id);
      toast.success("Attempt marked complete.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not mark attempt complete.");
    } finally {
      setCompleting(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await gradeAttempt(attempt.id, {
        answers: attempt.answers.map((answer) => ({
          answerId: answer.id,
          awardedPoints: grades[answer.id].awardedPoints,
          feedback: grades[answer.id].feedback
        }))
      });
      toast.success("Grades saved.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save grades.");
    } finally {
      setSaving(false);
    }
  }

  if (attempt.status === "IN_PROGRESS") {
    return (
      <div className="grid w-full gap-4">
        <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">In Progress</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/62">
            This attempt has not been submitted yet. Mark it complete if the student left before submitting.
          </p>
        </section>
        <LoadingButton className="flex items-center justify-center gap-2 rounded-md bg-moss px-5 py-3 text-sm font-black text-white" loading={completing} icon={mdiCheckboxMarkedCircleOutline} onClick={onComplete} type="button">
          {completing ? "Completing..." : "Mark Complete"}
        </LoadingButton>
      </div>
    );
  }

  if (attempt.answers.length === 0) {
    return (
      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">No Answers Submitted</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink/62">
          This attempt was marked complete, but the student did not submit any answers.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid w-full gap-4">
      {attempt.answers.map((answer, index) => {
        const typeLabel = answer.type === "CODING"
          ? "Programming"
          : titleCase(answer.type);

        return (
        <section key={answer.id} className="w-full rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="grid w-full gap-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-black text-moss">Question {index + 1} · {typeLabel}</p>
            <span className="shrink-0 rounded-md bg-mint px-3 py-1 text-xs font-black text-moss">
              {grades[answer.id].awardedPoints}/{answer.points} pts
            </span>
            </div>
            <PromptBlock>{answer.prompt}</PromptBlock>
          </div>
          {answer.type === "OPEN_ENDED" || answer.type === "CODING" ? (
            <pre className="mt-4 overflow-auto rounded-md bg-[#0f172a] p-4 font-mono text-sm leading-6 text-mint">{answer.answerText || "No answer"}</pre>
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
          <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr]">
            <label className="grid gap-2">
              <span className="text-sm font-black">Awarded Points</span>
              <div className="flex items-center overflow-hidden rounded-md border border-line bg-cloud">
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-semibold outline-none"
                  max={answer.points}
                  min={0}
                  type="number"
                  value={grades[answer.id].awardedPoints}
                  onChange={(event) => setGrades((current) => ({ ...current, [answer.id]: { ...current[answer.id], awardedPoints: Number(event.target.value) } }))}
                />
                <span className="border-l border-line px-3 text-sm font-black text-ink/58">/ {answer.points}</span>
              </div>
              <span className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md border border-line bg-white px-3 py-2 text-xs font-black text-moss"
                  onClick={() => setGrades((current) => ({ ...current, [answer.id]: { ...current[answer.id], awardedPoints: answer.points } }))}
                >
                  Correct
                </button>
                <button
                  type="button"
                  className="rounded-md border border-line bg-white px-3 py-2 text-xs font-black text-ink/62"
                  onClick={() => setGrades((current) => ({ ...current, [answer.id]: { ...current[answer.id], awardedPoints: 0 } }))}
                >
                  Incorrect
                </button>
              </span>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-black">Feedback</span>
              <input
                className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none"
                value={grades[answer.id].feedback}
                onChange={(event) => setGrades((current) => ({ ...current, [answer.id]: { ...current[answer.id], feedback: event.target.value } }))}
              />
            </label>
          </div>
        </section>
        );
      })}
      <LoadingButton className="flex items-center justify-center gap-2 rounded-md bg-moss px-5 py-3 text-sm font-black text-white" loading={saving} icon={mdiCheckboxMarkedCircleOutline}>
        {saving ? "Saving..." : "Save Grades"}
      </LoadingButton>
    </form>
  );
}
