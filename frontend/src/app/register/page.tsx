import { AppShell } from "@/components/AppShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AppShell>
      <section className="mx-auto grid max-w-7xl px-4 py-10 sm:px-6 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[0.9fr_1fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Create Account</p>
          <h1 className="mt-3 text-3xl font-black">Join Academy KH</h1>
          <p className="mt-4 max-w-lg text-base font-medium leading-7 text-ink/68">
            Register as a teacher to create tests and manage grading, or as a student to take assessments and view scores.
          </p>
        </div>
        <RegisterForm />
      </section>
    </AppShell>
  );
}
