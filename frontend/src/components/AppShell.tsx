import Link from "next/link";
import { mdiBookOpenVariant, mdiClipboardTextClock, mdiHomeVariant, mdiShieldCrown, mdiTrophyVariant } from "@mdi/js";
import { AuthActions } from "@/components/AuthActions";
import { Icon } from "@/components/Icon";
import { getCurrentUser } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: mdiHomeVariant },
  { href: "/courses", label: "Courses", icon: mdiBookOpenVariant },
  { href: "/tests", label: "Tests", icon: mdiClipboardTextClock },
  { href: "/scores", label: "Scores", icon: mdiTrophyVariant },
  { href: "/admin", label: "Content Studio", icon: mdiShieldCrown }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const visibleNavItems = user ? navItems.filter((item) => {
    if (item.href === "/admin") {
      return user?.role === "TEACHER";
    }
    return true;
  }) : [];

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-cloud/88 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-moss text-mint">
              <Icon path={mdiBookOpenVariant} size={1.05} />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold">Academy KH</span>
              <span className="hidden text-xs font-medium text-ink/60 sm:block">Study Platform</span>
            </span>
          </Link>
          {visibleNavItems.length > 0 ? (
            <nav className="hidden items-center gap-1 md:flex">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-ink/68 transition hover:bg-mint hover:text-ink"
                >
                  <Icon path={item.icon} size={0.78} />
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
          {user ? (
            <AuthActions name={user.name} />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/register" className="hidden rounded-md border border-line bg-white px-4 py-2 text-sm font-bold text-ink shadow-soft transition hover:border-moss sm:inline-flex">
                Register
              </Link>
              <Link href="/login" className="rounded-md bg-moss px-3 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-moss sm:px-4">
                Sign In
              </Link>
            </div>
          )}
        </div>
        {visibleNavItems.length > 0 ? (
          <nav className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 pb-3 sm:grid-cols-3 sm:px-6 md:hidden lg:px-8">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-center text-sm font-black text-ink shadow-soft transition hover:border-moss"
              >
                <span className="shrink-0">
                  <Icon path={item.icon} size={0.78} />
                </span>
                <span className="min-w-0 truncate">{item.label}</span>
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
      <main className="page-enter">{children}</main>
    </div>
  );
}
