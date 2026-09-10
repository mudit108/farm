"use client";

import { useState } from "react";
import { ToastProvider } from "@/components/ui/toast";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout, LogOut, ShieldCheck, Menu, X } from "lucide-react";
import { adminNav } from "@/components/admin/nav-config";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function AdminShell({
  children,
  adminEmail,
}: {
  children: React.ReactNode;
  adminEmail: string | null;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/admin-login";
  }

  const navContent = (onNavigate?: () => void) => (
    <>
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {adminNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-white/10 text-white" : "hover:bg-white/5"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium hover:bg-white/5"
      >
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </>
  );

  return (
    <ToastProvider>
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Mobile top bar — the sidebar below is desktop-only, so this is
          the ONLY way to navigate or log out on mobile. */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[var(--color-ink)] px-4 py-3 text-white md:hidden">
        <Link href="/" className="flex items-center gap-2 font-display text-base font-semibold">
          <Sprout className="h-5 w-5 text-[var(--color-gold)]" />
          Mera Khet Admin
        </Link>
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="mx-auto flex max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--color-ink)]/10 bg-[var(--color-ink)] p-6 text-white/80 md:flex">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <Sprout className="h-5 w-5 text-[var(--color-gold)]" />
            Mera Khet Admin
          </Link>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-white/40">
            <ShieldCheck className="h-3 w-3" /> Admin-only area
          </span>
          {adminEmail && (
            <span className="mt-3 truncate rounded-[var(--radius-sm)] bg-white/5 px-2.5 py-1.5 text-[11px] text-white/60">
              {adminEmail}
            </span>
          )}

          {navContent()}
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Mobile drawer nav */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-[var(--color-ink)] p-6 text-white/80 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-display text-base font-semibold text-white">
                <Sprout className="h-5 w-5 text-[var(--color-gold)]" />
                Mera Khet Admin
              </span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {adminEmail && (
              <span className="mt-3 truncate rounded-[var(--radius-sm)] bg-white/5 px-2.5 py-1.5 text-[11px] text-white/60">
                {adminEmail}
              </span>
            )}
            {navContent(() => setMenuOpen(false))}
          </div>
        </div>
      )}
    </div>
    </ToastProvider>
  );
}
