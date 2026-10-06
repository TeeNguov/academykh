import { AppShell } from "@/components/AppShell";
import { TeacherOnly } from "@/components/TeacherOnly";
import { StudentGroupManager } from "@/components/students/StudentGroupManager";
import { getServerStudentGroups } from "@/lib/server-api";

export default async function AdminStudentsPage() {
  const groups = await getServerStudentGroups().catch(() => []);

  return (
    <AppShell>
      <TeacherOnly>
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Teacher Admin</p>
          <h1 className="mt-2 text-3xl font-black">Student Groups</h1>

          <div className="mt-7">
            <StudentGroupManager groups={groups} />
          </div>
        </section>
      </TeacherOnly>
    </AppShell>
  );
}
