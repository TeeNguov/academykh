import { mdiBookOpenVariant, mdiBookPlusOutline, mdiEyeOutline, mdiFileDocumentEdit } from "@mdi/js";
import { AppShell } from "@/components/AppShell";
import { EmptyList } from "@/components/EmptyList";
import { Icon } from "@/components/Icon";
import { PendingLink } from "@/components/PendingLink";
import { TeacherOnly } from "@/components/TeacherOnly";
import { getCurrentUser } from "@/lib/auth";
import { getServerCourses } from "@/lib/server-api";

export default async function AdminCoursesPage() {
  const [courses, currentUser] = await Promise.all([
    getServerCourses().catch(() => []),
    getCurrentUser()
  ]);
  const ownedCourses = courses.filter((course) => course.createdById == null || course.createdById === currentUser?.id);

  return (
    <AppShell>
      <TeacherOnly>
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Teacher Admin</p>
              <h1 className="mt-2 text-3xl font-black">Published Courses</h1>
            </div>
            <PendingLink href="/admin/courses/add" className="flex w-fit items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white">
              <Icon path={mdiBookPlusOutline} size={0.72} />
              Create Course
            </PendingLink>
          </div>

          <div className="mt-7 grid gap-4">
            {ownedCourses.length > 0 ? ownedCourses.map((course) => (
              <article key={course.id} className="card-enter flex flex-col justify-between gap-4 rounded-lg border border-line bg-white p-5 shadow-soft md:flex-row md:items-center">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-mint text-moss">
                    <Icon path={mdiBookOpenVariant} size={1} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-black">{course.title}</span>
                    <span className="block text-sm font-semibold text-ink/58">
                      {course.language} subject · {course.level} · {course.moduleCount ?? 0} modules · {course.lessonCount ?? 0} blocks
                    </span>
                  </span>
                </span>
                <span className="flex flex-wrap gap-2 md:justify-end">
                  <PendingLink href={`/courses/${course.id}`} className="flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-black transition hover:border-moss">
                    <Icon path={mdiEyeOutline} size={0.72} />
                    View
                  </PendingLink>
                  <PendingLink href={`/admin/courses/${course.id}`} className="flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white">
                    <Icon path={mdiFileDocumentEdit} size={0.72} />
                    Manage Course
                  </PendingLink>
                </span>
              </article>
            )) : (
              <EmptyList title="No Published Courses Yet" text="Create a course and it will show up in this list." />
            )}
          </div>
        </section>
      </TeacherOnly>
    </AppShell>
  );
}
