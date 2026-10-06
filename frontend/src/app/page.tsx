import Link from "next/link";
import { mdiAccountSchoolOutline, mdiArrowRight, mdiBookOpenPageVariant, mdiClipboardTextClock, mdiFileDocumentEdit, mdiSchoolOutline } from "@mdi/js";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { getServerPlatformStats } from "@/lib/server-api";

export default async function HomePage() {
  const stats = await getServerPlatformStats().catch(() => ({ students: 0, teachers: 0, attempts: 0 }));
  const platformStats = [
    { label: "Students", value: stats.students, icon: mdiAccountSchoolOutline },
    { label: "Teachers", value: stats.teachers, icon: mdiSchoolOutline },
    { label: "Test Attempts", value: stats.attempts, icon: mdiClipboardTextClock }
  ];

  return (
    <AppShell>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.82fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-moss">Study platform</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-5xl">
              Academy KH
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-ink/68">
              Teach programming, mathematics, physics, and chemistry with courses, rich lessons, timed tests, share links, and clear student scores.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="flex items-center gap-2 rounded-md bg-moss px-5 py-3 text-sm font-black text-white">
                Create Account
                <Icon path={mdiArrowRight} size={0.72} />
              </Link>
              <Link href="/login" className="flex items-center gap-2 rounded-md border border-line bg-white px-5 py-3 text-sm font-black">
                Sign In
                <Icon path={mdiFileDocumentEdit} size={0.78} />
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {platformStats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-line bg-white p-4 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-2xl font-black">{formatCount(stat.value)}</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-ink/52">{stat.label}</p>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-mint text-moss">
                      <Icon path={stat.icon} size={0.9} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid content-end gap-4">
            <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
                  <Icon path={mdiSchoolOutline} size={1} />
                </span>
                <div>
                  <p className="font-black">For Teachers</p>
                  <p className="text-sm font-semibold text-ink/58">Create courses, build tests, invite students, review responses, and grade attempts.</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
                  <Icon path={mdiAccountSchoolOutline} size={1} />
                </span>
                <div>
                  <p className="font-black">For Students</p>
                  <p className="text-sm font-semibold text-ink/58">Join assigned courses, take available tests, write code answers, and view scores when allowed.</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
                  <Icon path={mdiBookOpenPageVariant} size={1} />
                </span>
                <div>
                  <p className="font-black">Science And Code Lessons</p>
                  <p className="text-sm font-semibold text-ink/58">Mix explanations, formulas, examples, and code snippets in lessons and test prompts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en").format(value);
}
