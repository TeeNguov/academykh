import { AppShell } from "@/components/AppShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;

  return (
    <AppShell>
      <section className="mx-auto grid max-w-7xl px-4 py-10 sm:px-6 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[0.9fr_1fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Password Reset</p>
          <h1 className="mt-3 text-3xl font-black">Choose A New Password</h1>
          <p className="mt-4 max-w-lg text-base font-medium leading-7 text-ink/68">
            Reset links expire quickly and can only be used once.
          </p>
        </div>
        <ResetPasswordForm token={token} />
      </section>
    </AppShell>
  );
}
