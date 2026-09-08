import Image from "next/image";
import { Heart, Users } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import wheatPhoto from "@/public/images/wheat-field-golden.jpg";

export function FeedingFamiliesImpact({ collectedInr }: { collectedInr: number }) {
  const families = Math.round((collectedInr / 1000) * 2);

  return (
    <section className="border-b border-[var(--color-ink)]/10 bg-[var(--color-brown-soft)] py-14 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brown)]/15">
              <Heart className="h-5 w-5 text-[var(--color-brown)]" />
            </div>
            <p className="mt-5 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
              Feeding Families Fund
            </p>
            <h2 className="mt-3 font-display text-[1.75rem] leading-[1.15] tracking-tight sm:text-5xl sm:leading-tight">
              Your plot feeds
              <br />
              more than your family.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-[var(--color-ink-soft)]">
              ₹1,000 from every plot goes toward donating wheat to families
              who need it. It&apos;s included in the price you see — not an
              extra charge, not an optional tick-box at checkout. Every
              membership does this automatically.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-5 border-t border-[var(--color-brown)]/20 pt-6">
              <div>
                <p className="font-display text-4xl tracking-tight text-[var(--color-ink)]">
                  ₹{collectedInr.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                  Contributed so far
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 font-display text-4xl tracking-tight text-[var(--color-ink)]">
                  <Users className="h-6 w-6 text-[var(--color-brown)]" />
                  {families.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                  Families fed
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-ink)]/10">
              <Image
                src={wheatPhoto}
                alt="Ripe golden wheat ready for harvest at the farm"
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
