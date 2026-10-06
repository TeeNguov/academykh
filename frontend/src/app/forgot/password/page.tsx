import { AppShell } from "@/components/AppShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AppShell>
      <section className="mx-auto grid max-w-7xl px-4 py-10 sm:px-6 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[0.9fr_1fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Password Help</p>
          <h1 className="mt-3 text-3xl font-black">Generate A Reset Link</h1>
          <p className="mt-4 max-w-lg text-base font-medium leading-7 text-ink/68">
            Enter the account email. If it exists, a reset URL will be created and stored in the database for copying.
          </p>
        </div>
        <ForgotPasswordForm />
      </section>
    </AppShell>
  );
}
