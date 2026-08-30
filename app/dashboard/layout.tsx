"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout, LogOut } from "lucide-react";
import { dashboardNav, bottomNav } from "@/components/dashboard/nav-config";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto flex max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] p-6 md:flex">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sprout className="h-5 w-5 text-[var(--color-green)]" />
            Khet Club
          </Link>

          <nav className="mt-10 flex flex-1 flex-col gap-1">
            {dashboardNav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
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
          </nav>

          <Link
            href="/"
            className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-ink)]/5"
          >
            <LogOut className="h-4 w-4" /> Log out
          </Link>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 pb-24 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-[var(--color-ink)]/10 bg-[var(--color-surface)]/95 backdrop-blur md:hidden">
        {bottomNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium",
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
