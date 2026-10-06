import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { TeacherOnly } from "@/components/TeacherOnly";
import { CourseManagerTabs } from "@/components/courses/CourseManagerTabs";
import { getServerCourse, getServerCourseAccess } from "@/lib/server-api";

export default async function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [course, access] = await Promise.all([
    getServerCourse(id).catch(() => null),
    getServerCourseAccess(id).catch(() => null)
  ]);

  if (!course) {
    notFound();
  }

  return (
    <AppShell>
      <TeacherOnly>
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Course Editor</p>
          <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-black">{course.title}</h1>
              <p className="mt-2 text-sm font-semibold text-ink/58">
                {course.language} subject · {course.level} · {course.published ? "Published" : "Draft"}
              </p>
            </div>
            <span className="w-fit rounded-md bg-mint px-3 py-2 text-sm font-black text-moss">
              {course.modules.length} {course.modules.length === 1 ? "Module" : "Modules"}
            </span>
          </div>

          <CourseManagerTabs course={course} access={access} />
        </section>
      </TeacherOnly>
    </AppShell>
  );
}
