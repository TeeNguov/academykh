"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { mdiBookOpenVariant, mdiLoginVariant } from "@mdi/js";
import { ApiCourseShareLinkDetail, ApiUser, claimCourseShareLink } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { LoadingButton } from "@/components/LoadingButton";
import { useToast } from "@/components/ToastProvider";

export function CourseJoinCard({ detail, currentUser, token }: { detail: ApiCourseShareLinkDetail; currentUser: ApiUser | null; token: string }) {
  const router = useRouter();
  const toast = useToast();
  const [joining, setJoining] = useState(false);

  async function joinCourse() {
    setJoining(true);
    try {
      const response = await claimCourseShareLink(token);
      toast.success("Course added to your account.");
      router.refresh();
      router.push(`/courses/${response.course.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join this course.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-mint text-moss">
            <Icon path={mdiBookOpenVariant} size={1.05} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Course Invitation</p>
            <h1 className="mt-2 text-3xl font-black">{detail.course.title}</h1>
            <p className="mt-2 text-sm font-semibold text-ink/58">
              {detail.course.language} subject · {detail.course.level}
            </p>
            <p className="mt-3 text-sm font-semibold text-ink/62">
              This link expires {formatDateTime(detail.shareLink.expiresAt)}.
            </p>
          </div>
        </div>

        {currentUser ? (
          <LoadingButton
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white"
            loading={joining}
            icon={mdiLoginVariant}
            onClick={joinCourse}
          >
            {joining ? "Joining..." : "Join Course"}
          </LoadingButton>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/login?next=/courses/join/${token}`} className="inline-flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white">
              <Icon path={mdiLoginVariant} size={0.76} />
              Sign In To Join
            </Link>
            <Link href="/register" className="inline-flex rounded-md border border-line bg-white px-4 py-2 text-sm font-black text-ink shadow-soft">
              Register
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}
