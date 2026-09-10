import Link from "next/link";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-green-soft)]">
        <Sprout className="h-6 w-6 text-[var(--color-green-deep)]" />
      </div>

      <p className="mt-6 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
        Page not found
      </p>
      <h1 className="mt-3 max-w-md font-display text-[1.75rem] leading-[1.15] tracking-tight text-[var(--color-ink)] sm:text-4xl">
        This patch of land doesn&apos;t exist.
      </h1>
      <p className="mt-4 max-w-sm text-[var(--color-ink-soft)]">
        The page you were looking for isn&apos;t here — it may have been
        moved, or the link may be out of date.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/">
          <Button>Back to Mera Khet</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">My Dashboard</Button>
        </Link>
      </div>

      <p className="mt-8 text-xs text-[var(--color-ink-soft)]">
        Looking for something specific?{" "}
        <Link href="/#contact" className="font-medium text-[var(--color-green-deep)] underline-offset-4 hover:underline">
          Get in touch
        </Link>
        .
      </p>
    </main>
  );
}
