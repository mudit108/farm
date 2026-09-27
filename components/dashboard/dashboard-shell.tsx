"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { WheatMark } from "@/components/site/marks";
import { dashboardNav, dashboardNavGroups } from "@/components/dashboard/nav-config";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/** What the shell shows about the signed-in member (read on the server in app/dashboard/layout.tsx). */
export type ShellMember = {
  firstName: string | null;
  initial: string;
  /** "Plot #32", "Plots #4, #5" — or null while they hold none. */
  plotLabel: string | null;
};

/**
 * Member dashboard chrome: a deep-green sidebar on desktop; on phones a
 * slim top bar (brand, member initial, log out) and a bottom tab bar.
 */
export function DashboardShell({ member, children }: { member: ShellMember; children: React.ReactNode }) {
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // A full page load (not router.push) so nothing from the signed-in session stays cached in the client.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/auth/login";
  }

  return (
    <div className="mk-member mk-dash">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="mk-side">
        <Link href="/" className="mk-side-brand">
          <WheatMark size={24} />
          Mera Khet
        </Link>

        <nav className="mk-side-nav" aria-label="Dashboard">
          {dashboardNavGroups.map((group) => (
            <div key={group.label}>
              <p className="mk-side-label">{group.label}</p>
              <div className="mk-side-links">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn("mk-side-link", active && "is-active")}
                    >
                      <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mk-side-foot">
          <div className="mk-side-member">
            <span className="mk-avatar" aria-hidden="true">
              {member.initial}
            </span>
            <span className="min-w-0">
              <b className="block truncate">{member.firstName ?? "Member"}</b>
              <small className="block truncate">{member.plotLabel ?? "No plot yet"}</small>
            </span>
          </div>
          <button type="button" onClick={handleLogout} className="mk-side-link">
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" /> Log out
          </button>
        </div>
      </aside>

      <div className="mk-dash-main">
        {/* Phone top bar */}
        <header className="mk-topbar">
          <Link href="/" className="mk-topbar-brand">
            <WheatMark size={20} />
            Mera Khet
          </Link>
          <div className="mk-topbar-actions">
            <Link href="/dashboard/account" className="mk-avatar" aria-label={`Account — ${member.firstName ?? "member"}`}>
              {member.initial}
            </Link>
            <button type="button" onClick={handleLogout} className="mk-icon-btn" aria-label="Log out">
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="mk-dash-content">
          {/* Keyed by path so each page eases in on navigation (member.css). */}
          <div key={pathname} className="mk-member-page">
            {children}
          </div>
        </main>
      </div>

      {/* Phone bottom bar — all six pages, short labels */}
      <nav className="mk-bottomnav" aria-label="Dashboard">
        {dashboardNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={cn(active && "is-active")}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.short}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
