"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { mdiAccountGroupOutline, mdiPlus } from "@mdi/js";
import { ApiStudentGroup, createStudentGroup } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { LoadingButton } from "@/components/LoadingButton";
import { useToast } from "@/components/ToastProvider";

export function StudentGroupManager({ groups }: { groups: ApiStudentGroup[] }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [emails, setEmails] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await createStudentGroup({ name, emails });
      setName("");
      setEmails("");
      toast.success("Student group created.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create group.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.75fr_1fr]">
      <form onSubmit={onSubmit} className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
            <Icon path={mdiAccountGroupOutline} size={1} />
          </span>
          <div>
            <h2 className="text-xl font-black">Create Student Group</h2>
            <p className="text-sm font-semibold text-ink/58">Add students by email, one per line or comma separated.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          <label className="grid gap-2">
            <span className="text-sm font-black">Group Name</span>
            <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black">Student Emails</span>
            <textarea required className="min-h-32 rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={emails} onChange={(event) => setEmails(event.target.value)} placeholder="student1@email.com&#10;student2@email.com" />
          </label>
        </div>
        <LoadingButton className="mt-5 flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white" loading={saving} icon={mdiPlus}>
          {saving ? "Creating..." : "Create Group"}
        </LoadingButton>
      </form>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-xl font-black">Student Groups</h2>
        <div className="mt-4 grid gap-3">
          {groups.length > 0 ? groups.map((group) => (
            <article key={group.id} className="rounded-lg border border-line bg-cloud p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-black">{group.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-ink/58">{group.studentCount} students</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.emails.map((email) => (
                  <span key={email} className="rounded-md border border-line bg-white px-3 py-1 text-xs font-black text-ink/68">{email}</span>
                ))}
              </div>
            </article>
          )) : (
            <p className="rounded-lg border border-dashed border-line bg-cloud p-5 text-sm font-black text-ink/58">No Student Groups Yet</p>
          )}
        </div>
      </section>
    </div>
  );
}
