"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { mdiArrowLeft, mdiLockReset } from "@mdi/js";
import { LoadingButton } from "@/components/LoadingButton";
import { useToast } from "@/components/ToastProvider";
import { requestPasswordReset } from "@/lib/api";
import { Icon } from "@/components/Icon";

export function ForgotPasswordForm() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await requestPasswordReset({ email });
      setMessage(response.message);
      toast.success("Reset link generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate reset link.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-enter mt-8 grid content-center gap-4 rounded-lg border border-line bg-white p-5 shadow-soft lg:mt-0">
      <label className="grid gap-2">
        <span className="text-sm font-black">Email</span>
        <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@academy.kh" type="email" />
      </label>
      {message ? (
        <p className="rounded-md border border-line bg-mint px-3 py-3 text-sm font-bold text-moss">{message}</p>
      ) : null}
      <LoadingButton className="mt-2 flex items-center justify-center gap-2 rounded-md bg-moss px-5 py-3 text-sm font-black text-white" loading={saving} icon={mdiLockReset}>
        {saving ? "Generating..." : "Generate Reset Link"}
      </LoadingButton>
      <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-black text-moss">
        <Icon path={mdiArrowLeft} size={0.72} />
        Back To Sign In
      </Link>
    </form>
  );
}
