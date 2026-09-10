"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#story", label: "Our Story" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#crops", label: "Crops" },
  { href: "#harvest", label: "Your Harvest" },
  { href: "#live", label: "Live Farm" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Nav({
  isLoggedIn = false,
  firstName = "",
}: {
  isLoggedIn?: boolean;
  firstName?: string;
} = {}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-ink)]/10 bg-[var(--color-bg)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <Sprout className="h-5 w-5 text-[var(--color-green)]" />
          Mera Khet
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <>
              <span className="text-sm text-[var(--color-ink-soft)]">
                Hi, {firstName}
              </span>
              <Link href="/dashboard">
                <Button size="sm">My Dashboard</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                Login
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Reserve Your Plot</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--color-ink)]/10 bg-[var(--color-bg)] px-5 pb-6 pt-2 md:hidden">
          <nav className="flex flex-col pt-2">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="-mx-2 rounded-[var(--radius-sm)] px-2 py-3 text-sm active:bg-[var(--color-ink)]/5" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-3 border-t border-[var(--color-ink)]/10 pt-4">
              {isLoggedIn ? (
                <>
                  <span className="px-2 text-sm text-[var(--color-ink-soft)]">Signed in as {firstName}</span>
                  <Link href="/dashboard">
                    <Button size="sm" className="w-full">My Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="-mx-2 rounded-[var(--radius-sm)] px-2 py-3 text-sm font-medium active:bg-[var(--color-ink)]/5">Login</Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="w-full">Reserve Your Plot</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
