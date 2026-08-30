"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout, LogOut, ShieldCheck } from "lucide-react";
import { adminNav } from "@/components/admin/nav-config";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--color-ink)]/10 bg-[var(--color-ink)] p-6 text-white/80 md:flex">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <Sprout className="h-5 w-5 text-[var(--color-gold)]" />
            Khet Club Admin
          </Link>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-white/40">
            <ShieldCheck className="h-3 w-3" /> Admin-only area
          </span>

          <nav className="mt-10 flex flex-1 flex-col gap-1">
            {adminNav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
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

          <Link href="/" className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium hover:bg-white/5">
            <LogOut className="h-4 w-4" /> Log out
          </Link>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
