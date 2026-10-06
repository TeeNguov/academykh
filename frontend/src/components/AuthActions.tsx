"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

export function AuthActions({ name }: { name: string }) {
  const router = useRouter();
  const toast = useToast();
  const [signingOut, setSigningOut] = useState(false);

  async function logout() {
    setSigningOut(true);
    try {
      await logoutUser();
      toast.success("Signed out.");
      await new Promise((resolve) => window.setTimeout(resolve, 220));
      router.push("/");
      router.refresh();
    } catch {
      setSigningOut(false);
      toast.error("Could not sign out.");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/profile" className="hidden text-sm font-bold text-ink/62 transition hover:text-moss sm:inline">
        {name}
      </Link>
      <button type="button" onClick={logout} disabled={signingOut} className="rounded-md border border-line bg-white px-4 py-2 text-sm font-bold text-ink shadow-soft transition hover:border-moss disabled:cursor-not-allowed disabled:opacity-60">
        Sign Out
      </button>
      {signingOut ? (
        <div className="signout-veil fixed inset-0 z-[80] grid place-items-center bg-white/72 backdrop-blur-[2px]" aria-hidden="true">
          <div className="h-1 w-28 overflow-hidden rounded-full bg-line">
            <div className="signout-bar h-full w-1/2 rounded-full bg-moss" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
