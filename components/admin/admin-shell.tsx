"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, ExternalLink, ShieldCheck } from "lucide-react";
import { ToastProvider } from "@/components/ui/toast";
import { WheatMark } from "@/components/site/marks";
import { adminNavGroups } from "@/components/admin/nav-config";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/**
 * Admin chrome (2026-09 refresh): the same deep-green sidebar as the
 * member dashboard, with the pages grouped (Money · People · Farm), who is
 * signed in, a link to the live site and log out. On phones: a top bar
 * with a slide-in menu.
 */
export function AdminShell({ children, adminEmail }: { children: React.ReactNode; adminEmail: string | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // A full page load (not router.push) so nothing from the admin session stays cached in the client.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/auth/admin-login";
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));
  const initial = (adminEmail?.charAt(0) || "A").toUpperCase();

  const brand = (
    <Link href="/admin" className="mk-side-brand" onClick={() => setMenuOpen(false)}>
      <WheatMark size={24} />
      Mera Khet
      <span className="mk-admin-pill">Admin</span>
    </Link>
  );

  const nav = (
    <nav className="mk-side-nav" aria-label="Admin">
      {adminNavGroups.map((group) => (
        <div key={group.label ?? "main"}>
          {group.label && <p className="mk-side-label">{group.label}</p>}
          <div className="mk-side-links">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
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
  );

  const foot = (
    <div className="mk-side-foot">
      <div className="mk-side-member">
        <span className="mk-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="min-w-0">
          <b className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#D9B96B]" aria-hidden="true" /> Admin
          </b>
          <small className="block truncate">{adminEmail ?? "Signed in"}</small>
        </span>
      </div>
      <a href="/" target="_blank" rel="noopener noreferrer" className="mk-side-link">
        <ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" /> View live site
      </a>
      <button type="button" onClick={handleLogout} className="mk-side-link">
        <LogOut className="h-[18px] w-[18px]" aria-hidden="true" /> Log out
      </button>
    </div>
  );

  return (
    <div className="mk-admin">
      <ToastProvider>
        <div className="mk-admin-frame">
          <a href="#admin-main" className="skip-link">
            Skip to content
          </a>

          {/* Desktop sidebar */}
          <aside className="mk-side">
            {brand}
            {nav}
            {foot}
          </aside>

          <div className="mk-admin-main">
            {/* Phone top bar — the only way to navigate or log out on a phone */}
            <header className="mk-topbar mk-admin-topbar">
              <Link href="/admin" className="mk-topbar-brand">
                <WheatMark size={20} />
                Mera Khet
                <span className="mk-admin-pill">Admin</span>
              </Link>
              <button type="button" onClick={() => setMenuOpen(true)} className="mk-icon-btn" aria-label="Open menu" aria-expanded={menuOpen}>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </header>

            <main id="admin-main" tabIndex={-1} className="mk-admin-content">
              {children}
            </main>
          </div>

          {/* Phone menu */}
          {menuOpen && (
            <div className="mk-drawer" role="dialog" aria-modal="true" aria-label="Admin navigation">
              <button type="button" className="mk-drawer-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
              <div className="mk-drawer-panel">
                <div className="flex items-center justify-between">
                  {brand}
                  <button type="button" onClick={() => setMenuOpen(false)} className="mk-drawer-close" aria-label="Close menu">
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                {nav}
                {foot}
              </div>
            </div>
          )}
        </div>
      </ToastProvider>
    </div>
  );
}
