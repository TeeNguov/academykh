"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { mdiCheckboxMarkedCircleOutline, mdiClockOutline, mdiCodeBraces, mdiLoginVariant, mdiSend } from "@mdi/js";
import { ApiAttemptDetail, ApiQuizDetail, ApiUser, submitAttempt, submitSharedAttempt } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { LoadingButton } from "@/components/LoadingButton";
import { useToast } from "@/components/ToastProvider";
import { OptionLabel } from "@/components/tests/OptionLabel";
import { PromptBlock } from "@/components/tests/PromptBlock";

type AnswerState = Record<number, { text: string; selected: number[] }>;

type StudentTestFormProps = {
  quiz: ApiQuizDetail;
  shareToken?: string;
  attemptId?: number;
  attemptStartedAt?: string;
  studentName?: string;
  currentUser?: ApiUser | null;
  simpleMode?: boolean;
  onCompleted?: () => void;
};

export function StudentTestForm({ quiz, shareToken, attemptId, attemptStartedAt, studentName: lockedStudentName, currentUser, simpleMode = false, onCompleted }: StudentTestFormProps) {
  const toast = useToast();
  const timeoutSubmittedRef = useRef(false);
  const [studentName, setStudentName] = useState(lockedStudentName ?? currentUser?.name ?? "");
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [completedAttempt, setCompletedAttempt] = useState<ApiAttemptDetail | null>(null);
  const [submittedByTimer, setSubmittedByTimer] = useState(false);
  const studentIdentityMode = quiz.studentIdentityMode ?? "NAME_INPUT";
  const loginRequiredAndMissing = studentIdentityMode === "REQUIRE_LOGIN" && !currentUser;
  const displayName = lockedStudentName ?? currentUser?.name;
  const timerStartMs = attemptStartedAt ? new Date(attemptStartedAt).getTime() : startedAt;
  const showTimer = !shareToken && !loginRequiredAndMissing && Boolean(quiz.durationMinutes);
  const remainingMs = !completedAttempt && showTimer && quiz.durationMinutes && timerStartMs != null && now != null
    ? Math.max(0, timerStartMs + quiz.durationMinutes * 60_000 - now)
    : null;
  const panelClassName = simpleMode ? "rounded-lg border border-line bg-white p-5" : "rounded-lg border border-line bg-white p-5 shadow-soft";

  useEffect(() => {
    if (!showTimer || completedAttempt) {
      return;
    }

    const currentTime = Date.now();
    if (!attemptStartedAt) {
      setStartedAt(currentTime);
    }
    setNow(currentTime);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [showTimer, completedAttempt, attemptStartedAt]);

  useEffect(() => {
    if (remainingMs !== 0 || timeoutSubmittedRef.current || submitting || completedAttempt || loginRequiredAndMissing) {
      return;
    }

    timeoutSubmittedRef.current = true;
    setError("Time is up. The app is submitting your test.");
    toast.error("Time is up. The app is submitting your test.");
    void submitAnswers(true);
  }, [remainingMs, submitting, completedAttempt, loginRequiredAndMissing]);

  function setSelected(questionId: number, optionId: number, multiple: boolean, checked: boolean) {
    setAnswers((current) => {
      const existing = current[questionId] ?? { text: "", selected: [] };
      const selected = multiple
        ? checked
          ? [...existing.selected, optionId]
          : existing.selected.filter((id) => id !== optionId)
        : [optionId];
      return { ...current, [questionId]: { ...existing, selected } };
    });
  }

  function setText(questionId: number, text: string) {
    setAnswers((current) => {
      const existing = current[questionId] ?? { text: "", selected: [] };
      return { ...current, [questionId]: { ...existing, text } };
    });
  }

  function handleAnswerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>, questionId: number) {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();

    const textarea = event.currentTarget;
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const indent = "  ";

    if (event.shiftKey) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const selectedText = value.slice(lineStart, end);
      const nextSelectedText = selectedText.replace(/(^|\n)( {1,2}|\t)/g, "$1");
      const nextValue = value.slice(0, lineStart) + nextSelectedText + value.slice(end);
      const removedCharacters = selectedText.length - nextSelectedText.length;

      setText(questionId, nextValue);
      requestAnimationFrame(() => {
        const nextPosition = Math.max(lineStart, start - Math.min(removedCharacters, start - lineStart));
        textarea.setSelectionRange(nextPosition, Math.max(nextPosition, end - removedCharacters));
      });
      return;
    }

    if (start === end) {
      const nextValue = value.slice(0, start) + indent + value.slice(end);
      setText(questionId, nextValue);
      requestAnimationFrame(() => textarea.setSelectionRange(start + indent.length, start + indent.length));
      return;
    }

    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const selectedText = value.slice(lineStart, end);
    const nextSelectedText = selectedText.replace(/^/gm, indent);
    const nextValue = value.slice(0, lineStart) + nextSelectedText + value.slice(end);
    const addedCharacters = nextSelectedText.length - selectedText.length;

    setText(questionId, nextValue);
    requestAnimationFrame(() => {
      textarea.setSelectionRange(start + indent.length, end + addedCharacters);
    });
  }

  function unansweredQuestionNumbers() {
    return quiz.questions
      .map((question, index) => {
        const answer = answers[question.id];
        const answered = question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE"
          ? Boolean(answer?.selected.length)
          : Boolean(answer?.text.trim());
        return answered ? null : index + 1;
      })
      .filter((questionNumber): questionNumber is number => questionNumber != null);
  }

  function submitConfirmationMessage() {
    const unanswered = unansweredQuestionNumbers();
    const lines = ["Submit this test now?"];

    if (unanswered.length > 0) {
      lines.push("");
      lines.push(`${unanswered.length} ${unanswered.length === 1 ? "question is" : "questions are"} unanswered:`);
      lines.push(unanswered.map((questionNumber) => `Question ${questionNumber}`).join(", "));
      lines.push("");
      lines.push("Unanswered questions will be submitted blank.");
    }

    return lines.join("\n");
  }

  async function submitAnswers(force = false) {
    setSubmitting(true);
    setError(null);

    try {
      if (!force && remainingMs === 0) {
        const message = "This test has run out of time.";
        setError(message);
        toast.error(message);
        return;
      }

      const body = {
        studentName: studentIdentityMode === "ANONYMOUS" ? "Anonymous Student" : studentIdentityMode === "REQUIRE_LOGIN" ? currentUser?.name : studentName,
        answers: quiz.questions.map((question) => ({
          questionId: question.id,
          answerText: answers[question.id]?.text ?? "",
          selectedOptionIds: answers[question.id]?.selected ?? []
        }))
      };
      const attempt = shareToken && attemptId
        ? await submitSharedAttempt(shareToken, attemptId, body)
        : await submitAttempt(quiz.id, body);
      setSubmittedByTimer(force);
      toast.success(force ? "Time is up. Your test was submitted automatically." : "Test submitted.");
      setCompletedAttempt(attempt);
      onCompleted?.();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not submit this test. Please check your answers and try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm(submitConfirmationMessage())) {
      return;
    }
    await submitAnswers(false);
  }

  if (completedAttempt) {
    return (
      <section className={`${simpleMode ? "rounded-lg border border-line bg-white p-6" : "rounded-lg border border-line bg-white p-6 shadow-soft"} text-center`}>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Completed</p>
        <h2 className="mt-2 text-2xl font-black">You Have Completed The Test</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm font-semibold text-ink/62">
          {submittedByTimer ? "Time ran out, so the app submitted your test automatically." : "Your response has been submitted."} {completedAttempt.status === "GRADED" ? "Your score is available in your account." : "Your teacher can review it when ready."}
        </p>
        <div className="mt-5 flex justify-center">
          {currentUser ? (
            <Link href="/dashboard" className="rounded-md bg-moss px-5 py-3 text-sm font-black text-white">
              Go To Dashboard
            </Link>
          ) : (
            <Link href="/" className="rounded-md bg-moss px-5 py-3 text-sm font-black text-white">
              Leave
            </Link>
          )}
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      {loginRequiredAndMissing ? (
        <div className={panelClassName}>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Login Required</p>
          <h2 className="mt-2 text-xl font-black">Sign In Before Taking This Test</h2>
          <Link href="/login" className="mt-4 flex w-fit items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white">
            <Icon path={mdiLoginVariant} size={0.74} />
            Sign In
          </Link>
        </div>
      ) : null}

      {remainingMs == null ? null : (
        <div className="sticky top-4 z-10 rounded-lg border border-line bg-white p-4 shadow-soft">
          <span className="flex w-fit items-center gap-2 rounded-md bg-mint px-3 py-2 text-sm font-black text-moss">
            <Icon path={mdiClockOutline} size={0.72} />
            {formatRemaining(remainingMs)}
          </span>
        </div>
      )}

      {loginRequiredAndMissing ? null : displayName ? (
        <div className={panelClassName}>
          <p className="text-sm font-black">{studentIdentityMode === "ANONYMOUS" ? "Attempt" : "Student Name"}</p>
          <p className="mt-1 text-lg font-black text-moss">{studentIdentityMode === "ANONYMOUS" ? "Anonymous" : displayName}</p>
        </div>
      ) : studentIdentityMode === "NAME_INPUT" ? (
        <label className={`grid gap-2 ${panelClassName}`}>
          <span className="text-sm font-black">Student Name</span>
          <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Your name" />
        </label>
      ) : null}

      {loginRequiredAndMissing ? null : quiz.questions.map((question, index) => (
        <section key={question.id} className={panelClassName}>
          <div>
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-black text-moss">Question {index + 1}</p>
              <span className="shrink-0 rounded-md bg-mint px-3 py-1 text-xs font-black text-moss">{question.points} pts</span>
            </div>
            <PromptBlock>{question.prompt}</PromptBlock>
          </div>

          {question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE" ? (
            <div className="mt-4 grid gap-2">
              {question.options.map((option) => (
                <label key={option.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-md border border-line bg-cloud px-3 py-3 text-sm font-bold">
                  <input
                    className="mt-1"
                    type={question.type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                    name={`question-${question.id}`}
                    checked={(answers[question.id]?.selected ?? []).includes(option.id)}
                    onChange={(event) => setSelected(question.id, option.id, question.type === "MULTIPLE_CHOICE", event.target.checked)}
                  />
                  <OptionLabel>{option.label}</OptionLabel>
                </label>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-moss">
                <Icon path={question.type === "CODING" ? mdiCodeBraces : mdiCheckboxMarkedCircleOutline} size={0.72} />
                {question.type === "CODING" ? "Code Answer" : "Written Answer"}
              </div>
              <textarea
                className="min-h-64 w-full resize-y rounded-md border border-line bg-[#0f172a] px-4 py-3 font-mono text-sm leading-6 text-mint outline-none"
                placeholder={question.type === "CODING" ? "Type your code here..." : "Type your answer here..."}
                value={answers[question.id]?.text ?? ""}
                onChange={(event) => setText(question.id, event.target.value)}
                onKeyDown={(event) => handleAnswerKeyDown(event, question.id)}
              />
            </div>
          )}
        </section>
      ))}

      {error ? <p className="text-sm font-bold text-coral">{error}</p> : null}

      {loginRequiredAndMissing ? null : (
      <LoadingButton className="flex items-center justify-center gap-2 rounded-md bg-moss px-5 py-3 text-sm font-black text-white" loading={submitting} disabled={remainingMs === 0} icon={mdiSend}>
        {submitting ? "Submitting..." : "Submit Test"}
      </LoadingButton>
      )}
    </form>
  );
}

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} remaining`;
}
