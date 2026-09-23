"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { WheatMark } from "@/components/site/marks";
import { dashboardNav, dashboardNavGroups } from "@/components/dashboard/nav-config";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <div className="mk-member min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto flex max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] p-6 md:flex">
          <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-semibold">
            <WheatMark size={24} />
            Mera Khet
          </Link>

          <nav className="mt-10 flex flex-1 flex-col gap-6">
            {dashboardNavGroups.map((group) => (
              <div key={group.label}>
                <p className="mk-dash-nav-label mb-2 px-3 font-mono-data text-[10px] font-semibold uppercase">
                  {group.label}
                </p>
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "mk-dash-link flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
                          active && "is-active",
                          active
                            ? "bg-[var(--color-green)] text-white"
                            : "text-[var(--color-ink-soft)] hover:bg-[var(--color-ink)]/5"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-ink)]/5"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 pb-20 md:pb-0">
          {/* Keyed by path so each page eases in on navigation (member.css). */}
          <div key={pathname} className="mk-member-page">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav — down to 6 total pages after merging Membership
          into My Farm, Live Camera/Farm Updates into Farm Activity, and
          Profile/Documents into Account, and Support into Help. Small
          enough now to show every page directly, no "More" overflow needed. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[var(--color-ink)]/10 bg-[var(--color-surface)]/95 backdrop-blur md:hidden">
        {dashboardNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-center text-[9px] font-medium leading-tight",
                active ? "text-[var(--color-green)]" : "text-[var(--color-ink-soft)]"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
