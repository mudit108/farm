import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WheatMark } from "@/components/site/marks";

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mk-member min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <WheatMark size={22} />
            Mera Khet
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
          Last updated: {lastUpdated}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{title}</h1>

        <div className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-[var(--color-ink-soft)] [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-[var(--color-ink)] [&_strong]:text-[var(--color-ink)] [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </main>
    </div>
  );
}
