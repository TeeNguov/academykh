"use client";

import { FormEvent, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mdiLoginVariant } from "@mdi/js";
import { LoadingButton } from "@/components/LoadingButton";
import { TurnstileStatus, TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { useToast } from "@/components/ToastProvider";
import { loginUser } from "@/lib/api";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function LoginForm() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileStatus, setTurnstileStatus] = useState<TurnstileStatus>(TURNSTILE_SITE_KEY ? "loading" : "disabled");
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const [saving, setSaving] = useState(false);
  const handleTurnstileTokenChange = useCallback((token: string) => setTurnstileToken(token), []);
  const turnstileRequired = Boolean(TURNSTILE_SITE_KEY);
  const turnstileIncomplete = turnstileRequired && (!turnstileToken || turnstileStatus !== "verified");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      toast.error("Please complete the security check.");
      return;
    }
    setSaving(true);
    try {
      const user = await loginUser({ email, password, turnstileToken });
      toast.success("Signed in.");
      router.refresh();
      router.push(user.role === "TEACHER" ? "/admin" : "/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setSaving(false);
      setTurnstileResetSignal((current) => current + 1);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-enter mt-8 grid content-center gap-4 rounded-lg border border-line bg-white p-5 shadow-soft lg:mt-0">
      <label className="grid gap-2">
        <span className="text-sm font-black">Email</span>
        <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@academy.kh" type="email" />
      </label>
      <label className="grid gap-2">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-black">Password</span>
          <Link href="/forgot/password" className="text-xs font-black text-moss">Forgot?</Link>
        </span>
        <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" type="password" />
      </label>
      <TurnstileWidget resetSignal={turnstileResetSignal} onTokenChange={handleTurnstileTokenChange} onStatusChange={setTurnstileStatus} />
      <LoadingButton className="mt-2 flex items-center justify-center gap-2 rounded-md bg-moss px-5 py-3 text-sm font-black text-white disabled:bg-ink/20 disabled:text-ink/45 disabled:shadow-none disabled:hover:bg-ink/20" loading={saving} disabled={turnstileIncomplete} icon={mdiLoginVariant}>
        {saving ? "Signing In..." : "Sign In"}
      </LoadingButton>
      <p className="text-center text-sm font-semibold text-ink/62">
        No account yet? <Link href="/register" className="font-black text-moss">Register</Link>
      </p>
    </form>
  );
}
