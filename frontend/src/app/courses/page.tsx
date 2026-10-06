import Link from "next/link";
import { mdiBookPlusOutline } from "@mdi/js";
import { AppShell } from "@/components/AppShell";
import { CourseRow } from "@/components/CourseRow";
import { EmptyList } from "@/components/EmptyList";
import { Icon } from "@/components/Icon";
import { getCurrentUser } from "@/lib/auth";
import { getServerCourses } from "@/lib/server-api";

export default async function CoursesPage() {
  const [courses, currentUser] = await Promise.all([
    getServerCourses().catch(() => []),
    getCurrentUser()
  ]);
  const canManageCourse = (createdById?: number | null) => {
    if (currentUser?.role !== "TEACHER") {
      return false;
    }
    return createdById == null || createdById === currentUser.id;
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Courses</p>
            <h1 className="text-3xl font-black">Study Courses</h1>
          </div>
          {currentUser?.role === "TEACHER" ? (
            <Link href="/admin/courses/add" className="flex w-fit items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white">
              <Icon path={mdiBookPlusOutline} size={0.72} />
              Create Course
            </Link>
          ) : null}
        </div>
        <div className="mt-7 grid gap-4">
          {courses.length > 0 ? courses.map((course) => {
            const canManage = canManageCourse(course.createdById);
            return (
              <CourseRow
                key={course.id}
                course={course}
                manageHref={canManage ? `/admin/courses/${course.id}` : undefined}
              />
            );
          }) : (
            <EmptyList title="No Courses Yet" text="Courses will appear here when you are enrolled or invited." />
          )}
        </div>
      </section>
    </AppShell>
  );
}
