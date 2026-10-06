"use client";

import { FormEvent, useCallback, useState } from "react";
import { mdiAccountPlusOutline, mdiClose, mdiLoginVariant } from "@mdi/js";
import { Icon } from "@/components/Icon";
import { LoadingButton } from "@/components/LoadingButton";
import { TurnstileStatus, TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { useToast } from "@/components/ToastProvider";
import { ApiUser, getMe, loginUser, registerUser } from "@/lib/api";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type AuthMode = "login" | "register";

export function SharedTestAuthDialog({ onClose, onAuthenticated }: { onClose: () => void; onAuthenticated: (user: ApiUser) => void }) {
  const toast = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileStatus, setTurnstileStatus] = useState<TurnstileStatus>(TURNSTILE_SITE_KEY ? "loading" : "disabled");
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleTurnstileTokenChange = useCallback((token: string) => setTurnstileToken(token), []);
  const turnstileRequired = Boolean(TURNSTILE_SITE_KEY);
  const turnstileIncomplete = turnstileRequired && (!turnstileToken || turnstileStatus !== "verified");

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setTurnstileToken("");
    setTurnstileResetSignal((current) => current + 1);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (turnstileIncomplete) {
      setError("Please complete the security check.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const user = mode === "login"
        ? await loginUser({ email, password, turnstileToken })
        : await registerUser({ name, email, password, role: "STUDENT", turnstileToken });
      toast.success(mode === "login" ? "Signed in." : "Account created.");
      onAuthenticated(user);
      onClose();
    } catch (authError) {
      const currentUser = mode === "register" ? await getMe().catch(() => null) : null;
      if (currentUser?.authenticated !== false && currentUser?.id) {
        toast.success("Account created.");
        onAuthenticated(currentUser);
        onClose();
        return;
      }
      const message = authError instanceof Error ? authError.message : "Could not continue.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
      setTurnstileToken("");
      setTurnstileResetSignal((current) => current + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 py-6">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Account Required</p>
            <h2 className="mt-2 text-2xl font-black">Continue To Test</h2>
          </div>
          <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-line text-ink/62" onClick={onClose} aria-label="Close">
            <Icon path={mdiClose} size={0.74} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 rounded-lg border border-line bg-cloud p-1">
          <button type="button" className={`rounded-md px-3 py-2 text-sm font-black ${mode === "login" ? "bg-white text-moss shadow-soft" : "text-ink/62"}`} onClick={() => switchMode("login")}>
            Sign In
          </button>
          <button type="button" className={`rounded-md px-3 py-2 text-sm font-black ${mode === "register" ? "bg-white text-moss shadow-soft" : "text-ink/62"}`} onClick={() => switchMode("register")}>
            Create Account
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 grid gap-4">
          {mode === "register" ? (
            <label className="grid gap-2">
              <span className="text-sm font-black">Full Name</span>
              <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
            </label>
          ) : null}
          <label className="grid gap-2">
            <span className="text-sm font-black">Email</span>
            <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@academy.kh" type="email" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black">Password</span>
            <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" minLength={mode === "register" ? 6 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "register" ? "At least 6 characters" : "Your password"} type="password" />
          </label>
          <TurnstileWidget resetSignal={turnstileResetSignal} onTokenChange={handleTurnstileTokenChange} onStatusChange={setTurnstileStatus} />
          {error ? <p className="text-sm font-bold text-coral">{error}</p> : null}
          <LoadingButton className="flex items-center justify-center gap-2 rounded-md bg-moss px-5 py-3 text-sm font-black text-white disabled:bg-ink/20 disabled:text-ink/45 disabled:shadow-none disabled:hover:bg-ink/20" loading={saving} disabled={turnstileIncomplete} icon={mode === "login" ? mdiLoginVariant : mdiAccountPlusOutline}>
            {saving ? "Working..." : mode === "login" ? "Sign In And Continue" : "Create Account And Continue"}
          </LoadingButton>
        </form>
      </div>
    </div>
  );
}
