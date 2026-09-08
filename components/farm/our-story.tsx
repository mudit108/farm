import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import storyPhoto from "@/public/images/farmer-hand-wheat-sunset.jpg";

export function OurStory() {
  return (
    <section id="story" className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-14 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
              Why Mera Khet
            </p>
            <h2 className="mt-3 font-display text-[1.75rem] leading-[1.15] tracking-tight sm:text-5xl sm:leading-tight">
              Food should never
              <br />
              be a mystery.
            </h2>

            <div className="mt-6 space-y-4 leading-relaxed text-[var(--color-ink-soft)]">
              <p>
                Today, we often don&apos;t know what goes into the food we
                eat. Where was it grown? Who grew it? What was added to
                it? What process did it go through before reaching our
                plate?
              </p>
              <p>
                Mera Khet exists to answer those questions. You should
                know exactly where your food comes from, how it is grown,
                and what it goes through before it reaches your home.
              </p>
              <p className="font-medium text-[var(--color-ink)]">
                Because even if food is expensive, if it isn&apos;t
                healthy and trustworthy, it still isn&apos;t good food.
              </p>
              <p>
                Food is one of the most important parts of our lives. When
                it affects our health, our families and our future, we
                deserve to know its complete journey — from soil to plate.
              </p>
            </div>

            <div className="mt-8 border-l-2 border-[var(--color-gold)] pl-5">
              <p className="leading-relaxed text-[var(--color-ink-soft)]">
                I come from a farmer family. Farming has always been part
                of my roots. But like many families, my generation slowly
                moved away from agriculture — and today there is almost
                nothing left of farming in our generation.
              </p>
              <p className="mt-3 font-display text-xl text-[var(--color-ink)]">
                So I decided to go back to my roots.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-ink)]/10">
              <Image
                src={storyPhoto}
                alt="A farmer's hand running through ripening wheat at sunset"
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>

            <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-surface)] p-6">
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
                More Than Better Food
              </p>
              <p className="mt-3 leading-relaxed text-[var(--color-ink-soft)]">
                We also want to reconnect the next generation with farming
                and the people behind our food — so children understand
                where their food actually comes from, how crops are grown,
                how much effort goes into farming, and why farmers matter
                so much to this country.
              </p>
              <p className="mt-3 leading-relaxed text-[var(--color-ink-soft)]">
                As our Hon&apos;ble Prime Minister Narendra Modi has often
                highlighted, farmers are an important backbone of our
                nation.
              </p>
              <p className="mt-4 leading-relaxed text-[var(--color-ink-soft)]">
                Mera Khet is a way of returning to farming, bringing
                transparency back to our food, creating a connection
                between people and the land, and keeping respect for
                farmers alive for the next generation.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <p className="mt-14 text-center font-display text-2xl tracking-tight text-[var(--color-ink)] sm:text-3xl">
            From our soil to your plate — you should know your food.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
