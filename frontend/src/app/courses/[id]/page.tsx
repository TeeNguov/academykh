import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CourseReader } from "@/components/courses/CourseReader";
import { buildShareMetadata } from "@/lib/metadata";
import { getServerCourse } from "@/lib/server-api";

type CourseDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const course = await getServerCourse(id).catch(() => null);
  const title = course?.title || "Course";
  const description = course
    ? `${course.language} subject course at ${course.level} level with ${course.modules.length} ${course.modules.length === 1 ? "module" : "modules"}.`
    : "Study course on Academy KH.";

  return buildShareMetadata({
    title,
    description,
    path: `/courses/${id}`,
    label: title
  });
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = await params;
  const course = await getServerCourse(id).catch(() => null);

  if (!course) {
    notFound();
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Course</p>
          <h1 className="mt-2 text-3xl font-black">{course.title}</h1>
          <p className="mt-2 text-sm font-semibold text-ink/58">
            {course.language} subject · {course.level} · {course.modules.length} {course.modules.length === 1 ? "Module" : "Modules"}
          </p>
        </div>

        <div className="mt-6">
          <CourseReader course={course} />
        </div>
      </section>
    </AppShell>
  );
}
