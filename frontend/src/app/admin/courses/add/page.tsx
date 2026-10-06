import { AppShell } from "@/components/AppShell";
import { TeacherOnly } from "@/components/TeacherOnly";
import { CourseBuilder } from "@/components/courses/CourseBuilder";

export default function AdminCoursesPage() {
  return (
    <AppShell>
      <TeacherOnly>
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Teacher Admin</p>
          <h1 className="mt-2 text-3xl font-black">Create Course</h1>
          <div className="mt-7">
            <CourseBuilder />
          </div>
        </section>
      </TeacherOnly>
    </AppShell>
  );
}
