import { Truck, Droplets, TrendingUp } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Card } from "@/components/ui/card";
import { harvestOptions } from "@/lib/demo-data";

const icons = { "home-delivery": Truck, processed: Droplets, "sell-to-market": TrendingUp };

export function HarvestOptions() {
  return (
    <section id="harvest" className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
            Your Harvest
          </p>
          <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Your harvest, your choice.
          </h2>
          <p className="mt-4 max-w-md text-[var(--color-ink-soft)]">
            When your crop is ready, choose how you&apos;d like to receive
            it — every crop grown 100% organic.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {harvestOptions.map((opt, i) => {
            const Icon = icons[opt.id as keyof typeof icons];
            return (
              <Reveal key={opt.id} delay={i * 80}>
                <Card className="flex h-full flex-col p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-green-soft)]">
                    <Icon className="h-5 w-5 text-[var(--color-green-deep)]" />
                  </div>
                  <p className="mt-4 font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
                    {opt.tagline}
                  </p>
                  <h3 className="mt-1 font-display text-xl">{opt.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {opt.description}
                  </p>
                  <p className="mt-4 border-t border-[var(--color-ink)]/10 pt-3 text-xs text-[var(--color-ink-soft)]">
                    {opt.note}
                  </p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
