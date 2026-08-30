import Link from "next/link";
import { Sprout } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-deep)] px-5 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-display text-lg font-semibold">
          <Sprout className="h-5 w-5 text-[var(--color-green)]" />
          Khet Club
        </Link>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-surface)] p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
