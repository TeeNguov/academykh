import { mdiAccountGroupOutline, mdiBookOpenVariant, mdiBookPlus, mdiClipboardTextClock, mdiFileQuestion, mdiLinkVariant, mdiTextBoxCheck } from "@mdi/js";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { Metric } from "@/components/Metric";
import { PendingLink } from "@/components/PendingLink";
import { TeacherOnly } from "@/components/TeacherOnly";
import { adminStats as fallbackAdminStats } from "@/lib/data";
import { getServerCourses, getServerQuizzes, getServerShareLinks } from "@/lib/server-api";

const actions = [
  { label: "Create Course", icon: mdiBookPlus, href: "/admin/courses/add" },
  { label: "Published Courses", icon: mdiBookOpenVariant, href: "/admin/courses" },
  { label: "Create Test", icon: mdiFileQuestion, href: "/admin/tests/add" },
  { label: "Published Tests", icon: mdiTextBoxCheck, href: "/admin/tests" },
  { label: "Share Links", icon: mdiLinkVariant, href: "/admin/share/links" },
  { label: "Student Groups", icon: mdiAccountGroupOutline, href: "/admin/students" },
  { label: "Grade Attempts", icon: mdiClipboardTextClock, href: "/admin/attempts" }
];

export default async function AdminPage() {
  const [courses, quizzes, shareLinks] = await Promise.all([
    getServerCourses().catch(() => null),
    getServerQuizzes().catch(() => null),
    getServerShareLinks().catch(() => null)
  ]);

  const adminStats = courses && quizzes && shareLinks
    ? [
        { ...fallbackAdminStats[0], value: String(courses.filter((course) => course.published).length) },
        { ...fallbackAdminStats[1], value: String(shareLinks.filter((link) => !link.expired && link.active).length) },
        { ...fallbackAdminStats[2], value: String(quizzes.filter((quiz) => quiz.published).length) }
      ]
    : fallbackAdminStats;

  return (
    <AppShell>
      <TeacherOnly>
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Teacher Admin</p>
            <h1 className="mt-2 text-3xl font-black">Content Studio</h1>
          </div>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminStats.map((stat) => (
            <Metric key={stat.label} {...stat} />
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <PendingLink
              key={action.label}
              href={action.href}
              className="card-enter flex min-h-32 items-center justify-between gap-6 rounded-lg border border-line bg-white p-5 text-left shadow-soft transition hover:border-moss"
            >
              <span className="min-w-0 text-lg font-black">{action.label}</span>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-mint text-moss">
                <Icon path={action.icon} size={1} />
              </span>
            </PendingLink>
          ))}
        </div>
        </section>
      </TeacherOnly>
    </AppShell>
  );
}
