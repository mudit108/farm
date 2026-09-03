"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#crops", label: "Crops" },
  { href: "#harvest", label: "Your Harvest" },
  { href: "#live", label: "Live Farm" },
  { href: "#pricing", label: "Pricing" },
  { href: "#register", label: "Register" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
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
          <Link href="/auth/login" className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            Login
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">Own Your Farm</Button>
          </Link>
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
          <nav className="flex flex-col gap-4 pt-4">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-sm" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-3">
              <Link href="/auth/login" className="text-sm font-medium">Login</Link>
              <Link href="/auth/signup">
                <Button size="sm" className="w-full">Own Your Farm</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
