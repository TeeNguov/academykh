"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { mdiArrowLeft, mdiLockCheckOutline } from "@mdi/js";
import { Icon } from "@/components/Icon";
import { LoadingButton } from "@/components/LoadingButton";
import { useToast } from "@/components/ToastProvider";
import { confirmPasswordReset } from "@/lib/api";

export function ResetPasswordForm({ token }: { token: string }) {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!token) {
      toast.error("This reset link is missing its token.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const response = await confirmPasswordReset({ token, password });
      setMessage(response.message);
      setPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-enter mt-8 grid content-center gap-4 rounded-lg border border-line bg-white p-5 shadow-soft lg:mt-0">
      {!token ? (
        <p className="rounded-md border border-coral bg-white px-3 py-3 text-sm font-bold text-coral">This reset link is missing its token.</p>
      ) : null}
      <label className="grid gap-2">
        <span className="text-sm font-black">New Password</span>
        <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" type="password" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-black">Confirm Password</span>
        <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat new password" type="password" />
      </label>
      {message ? (
        <p className="rounded-md border border-line bg-mint px-3 py-3 text-sm font-bold text-moss">{message}</p>
      ) : null}
      <LoadingButton className="mt-2 flex items-center justify-center gap-2 rounded-md bg-moss px-5 py-3 text-sm font-black text-white" loading={saving} disabled={!token} icon={mdiLockCheckOutline}>
        {saving ? "Saving..." : "Reset Password"}
      </LoadingButton>
      <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-black text-moss">
        <Icon path={mdiArrowLeft} size={0.72} />
        Back To Sign In
      </Link>
    </form>
  );
}
