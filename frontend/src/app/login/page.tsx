import { AppShell } from "@/components/AppShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AppShell>
      <section className="mx-auto grid max-w-7xl px-4 py-10 sm:px-6 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[0.9fr_1fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Secure Access</p>
          <h1 className="mt-3 text-3xl font-black">Sign In To Academy KH</h1>
          <p className="mt-4 max-w-lg text-base font-medium leading-7 text-ink/68">
            Teachers land in the admin workspace. Students land in their learning dashboard.
          </p>
        </div>
        <LoginForm />
      </section>
    </AppShell>
  );
}
