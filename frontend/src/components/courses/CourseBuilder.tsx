"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { mdiBookPlus, mdiCheckboxMarkedCircleOutline } from "@mdi/js";
import { createCourse } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { LoadingButton } from "@/components/LoadingButton";
import { useToast } from "@/components/ToastProvider";

const subjectOptions = ["Mathematics", "Physics", "Chemistry", "Programming", "Java", "JavaScript", "Python", "C++", "C#", "Any Subject"];
const levelOptions = ["Beginner", "Intermediate", "Advanced"];

export function CourseBuilder() {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [customSubject, setCustomSubject] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nextSubject = subject === "Other" ? customSubject.trim() : subject;
    if (!title.trim()) {
      setError("Course title is required.");
      toast.error("Course title is required.");
      return;
    }
    if (!nextSubject) {
      setError("Course subject is required.");
      toast.error("Course subject is required.");
      return;
    }

    setSaving(true);
    try {
      const course = await createCourse({
        title: title.trim(),
        language: nextSubject,
        level,
        published
      });
      toast.success(published ? "Course published." : "Course saved as draft.");
      router.refresh();
      router.push(`/admin/courses/${course.id}`);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Could not create this course.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
          <Icon path={mdiBookPlus} size={1} />
        </span>
        <div>
          <h2 className="text-xl font-black">Create Course</h2>
          <p className="text-sm font-semibold text-ink/58">Create a course for math, physics, chemistry, programming, or another study subject.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-black">Course Title</span>
          <input
            required
            className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none focus:border-moss"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black">Subject</span>
          <select
            className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none focus:border-moss"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          >
            {subjectOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
            <option value="Other">Other</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black">Level</span>
          <select
            className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none focus:border-moss"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
          >
            {levelOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        {subject === "Other" ? (
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-black">Custom Subject</span>
            <input
              required
              className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none focus:border-moss"
              value={customSubject}
              onChange={(event) => setCustomSubject(event.target.value)}
              placeholder="Biology, Algebra, Organic Chemistry..."
            />
          </label>
        ) : null}

        <label className="flex items-center justify-between gap-4 rounded-lg border border-line bg-cloud px-4 py-3 md:col-span-2">
          <span>
            <span className="block text-sm font-black">Published</span>
            <span className="mt-1 block text-xs font-semibold text-ink/58">Students can see courses when they are enrolled or invited through a shared test.</span>
          </span>
          <input
            className="h-5 w-5 accent-moss"
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
          />
        </label>
      </div>

      {error ? <p className="mt-4 text-sm font-bold text-coral">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <LoadingButton className="flex items-center gap-2 rounded-md bg-moss px-5 py-3 text-sm font-black text-white" loading={saving} icon={mdiCheckboxMarkedCircleOutline}>
          {saving ? "Saving..." : published ? "Publish Course" : "Save Draft"}
        </LoadingButton>
      </div>
    </form>
  );
}
