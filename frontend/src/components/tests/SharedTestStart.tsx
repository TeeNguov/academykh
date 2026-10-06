"use client";

import { FormEvent, useEffect, useState } from "react";
import { mdiClockOutline, mdiLoginVariant, mdiPlayCircleOutline } from "@mdi/js";
import { ApiSharedQuiz, ApiStartedSharedTest, ApiUser, startSharedAttempt } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { LoadingButton } from "@/components/LoadingButton";
import { useToast } from "@/components/ToastProvider";
import { SharedTestAuthDialog } from "@/components/tests/SharedTestAuthDialog";
import { StudentTestForm } from "@/components/tests/StudentTestForm";

export function SharedTestStart({ token, sharedQuiz, currentUser, simpleMode = false }: { token: string; sharedQuiz: ApiSharedQuiz; currentUser?: ApiUser | null; simpleMode?: boolean }) {
  const toast = useToast();
  const [authUser, setAuthUser] = useState<ApiUser | null>(currentUser ?? null);
  const [studentName, setStudentName] = useState("");
  const [started, setStarted] = useState<ApiStartedSharedTest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [attemptCompleted, setAttemptCompleted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const activeDurationMinutes = started?.test.durationMinutes ?? sharedQuiz.durationMinutes ?? null;
  const studentIdentityMode = sharedQuiz.studentIdentityMode ?? "NAME_INPUT";
  const loginRequiredAndMissing = studentIdentityMode === "REQUIRE_LOGIN" && !authUser;
  const panelClassName = simpleMode ? "rounded-lg border border-line bg-white p-5" : "rounded-lg border border-line bg-white p-5 shadow-soft";
  const displayLabel = sharedQuiz.shareLink.label?.trim() || "Shared Test";
  const headerMeta = (
    <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-ink/62">
      <span className="flex items-center gap-2">
        <Icon path={mdiClockOutline} size={0.72} />
        Expires {new Date(sharedQuiz.shareLink.expiresAt).toLocaleString()}
      </span>
    </div>
  );

  useEffect(() => {
    if (!activeDurationMinutes || attemptCompleted) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeDurationMinutes, attemptCompleted]);

  async function onStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStarting(true);
    setError(null);
    try {
      const response = await startSharedAttempt(token, {
        studentName: studentIdentityMode === "ANONYMOUS" ? anonymousStudentName(token) : studentIdentityMode === "REQUIRE_LOGIN" ? authUser?.name : studentName
      });
      setAttemptCompleted(false);
      setStarted(response);
      toast.success("Test started.");
    } catch (startError) {
      const message = startError instanceof Error ? startError.message : "Could not start this test.";
      setError(message);
      toast.error(message);
    } finally {
      setStarting(false);
    }
  }

  if (started) {
    const endsAt = activeDurationMinutes
      ? new Date(new Date(started.attempt.startedAt).getTime() + activeDurationMinutes * 60_000)
      : null;
    const remainingMs = !attemptCompleted && endsAt ? Math.max(0, endsAt.getTime() - now) : null;

    return (
      <div className="grid gap-5">
        <div className={panelClassName}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Shared test</p>
              <h1 className="mt-2 text-3xl font-black">{displayLabel}</h1>
              {headerMeta}
              <p className="mt-3 text-sm font-semibold text-ink/58">Attempt started at {new Date(started.attempt.startedAt).toLocaleString()}</p>
            </div>
            <span className="flex w-fit shrink-0 items-center gap-2 rounded-md bg-mint px-3 py-2 text-sm font-black text-moss">
              <Icon path={mdiClockOutline} size={0.72} />
              {attemptCompleted ? "Completed" : remainingMs == null ? "No Timer" : formatRemaining(remainingMs)}
            </span>
          </div>
        </div>
        <StudentTestForm quiz={started.test} shareToken={token} attemptId={started.attempt.id} attemptStartedAt={started.attempt.startedAt} studentName={started.attempt.studentName} currentUser={authUser} simpleMode={simpleMode} onCompleted={() => setAttemptCompleted(true)} />
      </div>
    );
  }

  return (
    <>
    <div className={panelClassName}>
      <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Shared test</p>
      <h1 className="mt-2 text-3xl font-black">{displayLabel}</h1>
      {headerMeta}
      <form onSubmit={onStart} className="mt-5 border-t border-line pt-5">
      <div className="grid gap-3 text-sm font-semibold text-ink/62">
        <p>Attempts allowed: {sharedQuiz.shareLink.maxAttempts}</p>
        {sharedQuiz.durationMinutes ? <p>Timer: {sharedQuiz.durationMinutes} minutes after you press Start.</p> : <p>No Test Timer.</p>}
      </div>
      {loginRequiredAndMissing ? (
        <button type="button" className="mt-5 flex w-fit items-center gap-2 rounded-md bg-moss px-5 py-3 text-sm font-black text-white" onClick={() => setAuthDialogOpen(true)}>
          <Icon path={mdiLoginVariant} size={0.78} />
          Sign In Or Create Account
        </button>
      ) : null}
      {studentIdentityMode === "REQUIRE_LOGIN" && authUser ? (
        <div className="mt-5 rounded-md border border-line bg-cloud px-3 py-3">
          <p className="text-sm font-black">Signed In As</p>
          <p className="mt-1 text-sm font-semibold text-ink/62">{authUser.name}</p>
        </div>
      ) : null}
      {studentIdentityMode === "NAME_INPUT" ? (
        <label className="mt-5 grid gap-2">
          <span className="text-sm font-black">Student Name</span>
          <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Your name" />
        </label>
      ) : null}
      {error ? <p className="mt-4 text-sm font-bold text-coral">{error}</p> : null}
      {loginRequiredAndMissing ? null : (
      <LoadingButton className="mt-5 flex items-center gap-2 rounded-md bg-moss px-5 py-3 text-sm font-black text-white" loading={starting} icon={mdiPlayCircleOutline}>
        {starting ? "Starting..." : "Start Test"}
      </LoadingButton>
      )}
      </form>
    </div>
    {authDialogOpen ? <SharedTestAuthDialog onClose={() => setAuthDialogOpen(false)} onAuthenticated={setAuthUser} /> : null}
    </>
  );
}

function anonymousStudentName(token: string) {
  const storageKey = `academy-kh-anonymous-${token}`;
  const existingName = window.localStorage.getItem(storageKey);
  if (existingName) {
    return existingName;
  }

  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  const name = `Anonymous ${randomPart}`;
  window.localStorage.setItem(storageKey, name);
  return name;
}

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} remaining`;
}
