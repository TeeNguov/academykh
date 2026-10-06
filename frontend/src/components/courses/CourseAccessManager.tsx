"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mdiAccountPlusOutline, mdiContentCopy, mdiLinkVariant, mdiPlus, mdiTrashCanOutline } from "@mdi/js";
import { ApiCourseAccess, ApiCourseDetail, createCourseShareLink, enrollCourseStudents, removeCourseEnrollment } from "@/lib/api";
import { EmptyList } from "@/components/EmptyList";
import { Icon } from "@/components/Icon";
import { LoadingButton } from "@/components/LoadingButton";
import { useToast } from "@/components/ToastProvider";

export function CourseAccessManager({ course, access }: { course: ApiCourseDetail; access: ApiCourseAccess | null }) {
  const router = useRouter();
  const toast = useToast();
  const [courseAccess, setCourseAccess] = useState<ApiCourseAccess | null>(access);
  const [emails, setEmails] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
  const [removingEnrollmentId, setRemovingEnrollmentId] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function onEnrollStudents(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnrolling(true);

    try {
      const response = await enrollCourseStudents(course.id, { emails });
      setCourseAccess(response);
      setEmails("");
      router.refresh();
      const added = response.enrolled?.length ?? 0;
      const missing = response.notFound?.length ?? 0;
      const owners = response.owners?.length ?? 0;
      toast.success(added > 0 ? `${added} student${added === 1 ? "" : "s"} enrolled.` : "Enrollment checked.");
      if (missing > 0) {
        toast.error(`${missing} email${missing === 1 ? "" : "s"} do not have student accounts yet.`);
      }
      if (owners > 0) {
        toast.error("Course owners are already managing this course.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not enroll students.");
    } finally {
      setEnrolling(false);
    }
  }

  async function onCreateLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingLink(true);

    try {
      if (!expiresAt) {
        toast.error("Expiration date and time is required.");
        return;
      }
      const link = await createCourseShareLink(course.id, {
        label: linkLabel,
        expiresAt: new Date(expiresAt).toISOString(),
        active: true
      });
      setCourseAccess((current) => current ? { ...current, shareLinks: [link, ...current.shareLinks] } : current);
      setLinkLabel("");
      setExpiresAt("");
      router.refresh();
      toast.success("Course link created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create course link.");
    } finally {
      setCreatingLink(false);
    }
  }

  async function copyLink(token: string) {
    try {
      await navigator.clipboard.writeText(linkHref(token));
      setCopiedToken(token);
      toast.success("Course link copied.");
      window.setTimeout(() => setCopiedToken((current) => current === token ? null : current), 1800);
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  async function removeStudent(enrollmentId: number, studentName: string) {
    if (!window.confirm(`Remove ${studentName} from this course?`)) {
      return;
    }
    setRemovingEnrollmentId(enrollmentId);

    try {
      const response = await removeCourseEnrollment(course.id, enrollmentId);
      setCourseAccess(response);
      router.refresh();
      toast.success("Student removed from course.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove student.");
    } finally {
      setRemovingEnrollmentId(null);
    }
  }

  function linkHref(token: string) {
    return origin ? `${origin}/courses/join/${token}` : `/courses/join/${token}`;
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="grid gap-5">
        <form onSubmit={onEnrollStudents} className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
              <Icon path={mdiAccountPlusOutline} size={1} />
            </span>
            <div>
              <h2 className="text-xl font-black">Add Students</h2>
              <p className="text-sm font-semibold text-ink/58">Enroll existing student accounts by email.</p>
            </div>
          </div>
          <label className="mt-5 grid gap-2">
            <span className="text-sm font-black">Student Emails</span>
            <textarea required className="min-h-32 rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={emails} onChange={(event) => setEmails(event.target.value)} placeholder="student1@email.com&#10;student2@email.com" />
          </label>
          <LoadingButton className="mt-5 flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white" loading={enrolling} icon={mdiPlus}>
            {enrolling ? "Adding..." : "Add Students"}
          </LoadingButton>
        </form>

        <form onSubmit={onCreateLink} className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
              <Icon path={mdiLinkVariant} size={1} />
            </span>
            <div>
              <h2 className="text-xl font-black">Create Course Link</h2>
              <p className="text-sm font-semibold text-ink/58">Students can open the link and join after signing in.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-black">Label</span>
              <input className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} placeholder={`${course.title} invitation`} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-black">Expires At</span>
              <input required type="datetime-local" className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
            </label>
          </div>
          <LoadingButton className="mt-5 flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white" loading={creatingLink} icon={mdiPlus}>
            {creatingLink ? "Creating..." : "Create Link"}
          </LoadingButton>
        </form>
      </div>

      <div className="grid gap-5">
        <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black">Enrolled Students</h2>
          <div className="mt-4 grid gap-3">
            {courseAccess?.students.length ? courseAccess.students.map((student) => (
              <article key={student.id} className="rounded-lg border border-line bg-cloud p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <p className="font-black">{student.name}</p>
                    <p className="mt-1 break-all text-sm font-semibold text-ink/58">{student.email}</p>
                  </div>
                  <LoadingButton
                    type="button"
                    className="flex w-fit shrink-0 items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-black text-coral"
                    loading={removingEnrollmentId === student.id}
                    icon={mdiTrashCanOutline}
                    onClick={() => removeStudent(student.id, student.name)}
                  >
                    {removingEnrollmentId === student.id ? "Removing..." : "Remove"}
                  </LoadingButton>
                </div>
              </article>
            )) : (
              <EmptyList title="No Students Yet" text="Students you add or students who join by link will appear here." />
            )}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black">Course Links</h2>
          <div className="mt-4 grid gap-3">
            {courseAccess?.shareLinks.length ? courseAccess.shareLinks.map((link) => (
              <article key={link.id} className="rounded-lg border border-line bg-cloud p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <p className="font-black">{link.label}</p>
                    <p className="mt-1 break-all text-xs font-bold text-moss">{linkHref(link.token)}</p>
                    <p className="mt-2 text-xs font-bold text-ink/54">Expires {formatDateTime(link.expiresAt)}</p>
                  </div>
                  <span className={`w-fit rounded-md px-3 py-1 text-xs font-black ${!link.active || link.expired ? "bg-coral text-white" : "bg-mint text-moss"}`}>
                    {!link.active ? "Inactive" : link.expired ? "Expired" : "Active"}
                  </span>
                </div>
                <button type="button" className="mt-3 flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-black" onClick={() => copyLink(link.token)}>
                  <Icon path={mdiContentCopy} size={0.7} />
                  {copiedToken === link.token ? "Copied" : "Copy Link"}
                </button>
              </article>
            )) : (
              <EmptyList title="No Course Links Yet" text="Create a course link and it will appear here." />
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}
