import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export async function TeacherOnly({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (user?.role === "TEACHER") {
    return <>{children}</>;
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Teacher Only</p>
        <h1 className="mt-2 text-2xl font-black">This Feature Is Only Available To Teachers</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-ink/62">
          Register or sign in as a teacher to create tests, share links, and grade attempts.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-md bg-moss px-4 py-2 text-sm font-black text-white">Sign In</Link>
          <Link href="/register" className="rounded-md border border-line bg-white px-4 py-2 text-sm font-black">Register</Link>
        </div>
      </div>
    </section>
  );
}
