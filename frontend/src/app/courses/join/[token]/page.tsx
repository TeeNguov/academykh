import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CourseJoinCard } from "@/components/courses/CourseJoinCard";
import { getCurrentUser } from "@/lib/auth";
import { SITE_NAME, buildShareMetadata } from "@/lib/metadata";
import { getServerCourseShareLink } from "@/lib/server-api";

type CourseJoinPageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: CourseJoinPageProps): Promise<Metadata> {
  const { token } = await params;
  const detail = await getServerCourseShareLink(token).catch(() => null);
  const label = detail?.shareLink.label?.trim() || detail?.course.title || "Course Invitation";
  const title = `${label} | Powered by ${SITE_NAME}`;
  const description = detail
    ? `Join ${detail.course.title} on ${SITE_NAME}.`
    : `Join a course on ${SITE_NAME}.`;

  return buildShareMetadata({
    title,
    description,
    path: `/courses/join/${token}`,
    label
  });
}

export default async function CourseJoinPage({ params }: CourseJoinPageProps) {
  const { token } = await params;
  const [detail, currentUser] = await Promise.all([
    getServerCourseShareLink(token).catch(() => null),
    getCurrentUser()
  ]);

  if (!detail) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Course Invitation</p>
            <h1 className="mt-2 text-3xl font-black">This Link Is Not Available</h1>
            <p className="mt-3 text-sm font-semibold text-ink/62">
              The course link may have expired or been turned off by the teacher.
            </p>
            <Link href="/courses" className="mt-6 inline-flex rounded-md bg-moss px-4 py-2 text-sm font-black text-white">
              Go To Courses
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <CourseJoinCard detail={detail} currentUser={currentUser} token={token} />
    </AppShell>
  );
}
