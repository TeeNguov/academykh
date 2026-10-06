import Link from "next/link";
import { mdiAccountCircleOutline, mdiEmailOutline, mdiIdentifier, mdiShieldAccountOutline } from "@mdi/js";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { getCurrentUser } from "@/lib/auth";
import { titleCase } from "@/lib/format";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">User Profile</p>
            <h1 className="mt-2 text-2xl font-black">Sign In To View Your Profile</h1>
            <Link href="/login" className="mt-5 inline-flex rounded-md bg-moss px-4 py-2 text-sm font-black text-white">
              Sign In
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  const details = [
    { label: "Name", value: user.name, icon: mdiAccountCircleOutline },
    { label: "Email", value: user.email, icon: mdiEmailOutline },
    { label: "Role", value: titleCase(user.role), icon: mdiShieldAccountOutline },
    { label: "Account Id", value: String(user.id), icon: mdiIdentifier }
  ];

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">User Profile</p>
          <h1 className="mt-2 text-3xl font-black">{user.name}</h1>
          {user.createdAt ? (
            <p className="mt-2 text-sm font-semibold text-ink/58">
              Joined {new Date(user.createdAt).toISOString().slice(0, 10)}
            </p>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {details.map((detail) => (
            <article key={detail.label} className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
                  <Icon path={detail.icon} size={1} />
                </span>
                <div>
                  <p className="text-sm font-black text-ink/58">{detail.label}</p>
                  <p className="mt-1 font-black">{detail.value}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
