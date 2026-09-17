import Link from "next/link";
import { Camera, CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

/**
 * Replaces three full homepage sections (FarmTransparency, FarmUpdates,
 * VisitAndLocation — roughly 300 lines of markup) with a single compact
 * strip that links to /the-farm.
 *
 * The point isn't to hide the proof: it's that five consecutive proof
 * sections sat between the founder story and the price, so nobody saw
 * what it cost until they'd scrolled past all of it. This keeps the
 * signal ("there's a camera, a live season, a real place you can
 * visit") on the homepage and moves the depth one click away.
 */
export function FarmProofStrip({
  currentStage,
  cropName,
}: {
  currentStage: string | null;
  cropName: string;
}) {
  const items = [
    {
      icon: Camera,
      title: "Live camera access",
      body: "Watch your plot once sowing begins — not a brochure photo.",
    },
    {
      icon: CalendarDays,
      title: currentStage ? `Currently: ${currentStage}` : "Season tracked live",
      body: `${cropName}, followed stage by stage from your dashboard.`,
    },
    {
      icon: MapPin,
      title: "Come and stand in it",
      body: "Real land in Sujangarh, Rajasthan. Members can request a visit.",
    },
  ];

  return (
    <section id="live" className="scroll-mt-20 border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal>
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
            The Farm
          </p>
          <h2 className="mt-3 max-w-lg font-display text-[1.75rem] leading-[1.15] tracking-tight sm:text-4xl sm:leading-tight">
            You don&apos;t have to take our word for it.
          </h2>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {items.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <Icon className="h-5 w-5 text-[var(--color-green-deep)]" />
                <p className="mt-3 text-sm font-medium text-[var(--color-ink)]">{title}</p>
                <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">{body}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <Link
            href="/the-farm"
            className="group mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-green-deep)] underline-offset-4 hover:underline"
          >
            See the live camera, updates and location
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
