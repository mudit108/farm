import Link from "next/link";
import { FileText } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const legalLinks = [
  { label: "Membership Agreement", href: "/membership-agreement" },
  { label: "Refund & Cancellation Policy", href: "/refund-policy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Disclaimer", href: "/disclaimer" },
];

export function LegalTrust() {
  return (
    <section className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal>
          <h2 className="font-display text-2xl">
            What does a &ldquo;plot allocation&rdquo; mean?
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            <p>
              Your Mera Khet membership gives you a contractual allocation
              of, and participation in, a designated area of farm plots
              (1, 3, or 6 plots — each plot 7,260 sq ft), according to the
              terms of your membership agreement.
            </p>
            <p>We do not claim, promise, or imply:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Guaranteed returns</li>
              <li>Guaranteed crop yield or wheat quantity</li>
              <li>Guaranteed profits</li>
              <li>Legal ownership of agricultural land</li>
            </ul>
            <p>
              unless those rights are explicitly provided under your final
              signed legal agreement. Wheat quantities shown for each plan
              (250–300 / 750–900 / 1,500–1,800 kg) are typical-yield estimates, not
              commitments.
            </p>
            <p className="font-medium text-[var(--color-ink)]">
              Agriculture is seasonal and subject to weather, soil
              conditions, pests, water availability and other natural
              factors.
            </p>
            <p>
              Every plot at Mera Khet is fertilized based on soil
              testing and each crop&apos;s actual needs — not
              indiscriminate use. This is our first season, and
              we&apos;re actively working toward certified organic
              farming, which we&apos;re aiming to reach next season.
              We&apos;ll update this the moment certification is
              obtained.
            </p>
          </div>

          <div className="mt-8 rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-bg)] p-6">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
              Who Runs Mera Khet
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              Mera Khet is operated by <strong className="text-[var(--color-ink)]">MK Farms</strong>, based
              in Sujangarh, Rajasthan. Every membership is governed by the
              real, readable documents below — not just this summary.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {legalLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-green)] hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" /> {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 p-6">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
              This Is Our First Season
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              We won&apos;t show you photos of a previous harvest, because
              there isn&apos;t one yet. What we can offer instead is full
              operational transparency from day one — camera access, farm
              updates, and a real dashboard tracking your specific
              plots — so you see this season unfold as it actually
              happens, rather than take our word for a past one. Early
              members are effectively founding members of Mera Khet.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
