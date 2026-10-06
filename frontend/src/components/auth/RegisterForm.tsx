"use client";

import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { mdiAccountPlusOutline } from "@mdi/js";
import { LoadingButton } from "@/components/LoadingButton";
import { TurnstileStatus, TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { useToast } from "@/components/ToastProvider";
import { getMe, registerUser, UserRole } from "@/lib/api";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function RegisterForm() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");
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
      const user = await registerUser({ name, email, password, role, turnstileToken });
      toast.success("Account created.");
      router.refresh();
      router.push((user.role ?? role) === "TEACHER" ? "/admin" : "/dashboard");
    } catch (error) {
      const currentUser = await getMe().catch(() => null);
      if (currentUser?.authenticated !== false && currentUser?.id) {
        toast.success("Account created.");
        router.refresh();
        router.push((currentUser.role ?? role) === "TEACHER" ? "/admin" : "/dashboard");
        return;
      }
      toast.error(error instanceof Error ? error.message : "Could not create account.");
    } finally {
      setSaving(false);
      setTurnstileResetSignal((current) => current + 1);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-enter mt-8 grid content-center gap-4 rounded-lg border border-line bg-white p-5 shadow-soft lg:mt-0">
      <label className="grid gap-2">
        <span className="text-sm font-black">Full Name</span>
        <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-black">Email</span>
        <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@academy.kh" type="email" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-black">Password</span>
        <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" type="password" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-black">Register As</span>
        <select className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
        </select>
      </label>
      <TurnstileWidget resetSignal={turnstileResetSignal} onTokenChange={handleTurnstileTokenChange} onStatusChange={setTurnstileStatus} />
      <LoadingButton className="mt-2 flex items-center justify-center gap-2 rounded-md bg-moss px-5 py-3 text-sm font-black text-white disabled:bg-ink/20 disabled:text-ink/45 disabled:shadow-none disabled:hover:bg-ink/20" loading={saving} disabled={turnstileIncomplete} icon={mdiAccountPlusOutline}>
        {saving ? "Creating..." : "Create Account"}
      </LoadingButton>
    </form>
  );
}
