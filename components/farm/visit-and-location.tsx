import { MapPin } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

export function VisitAndLocation() {
  return (
    <section className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-2">
        <Reveal>
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
            Visit
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Your farm isn&apos;t just on a screen.
          </h2>
          <p className="mt-4 max-w-md text-[var(--color-ink-soft)]">
            Members can visit Khet Club and see their plot in person,
            subject to prior scheduling, farm conditions, safety
            requirements and operational availability.
          </p>
          <a href="/dashboard/farm-visit">
            <Button className="mt-6">Plan a Farm Visit</Button>
          </a>
        </Reveal>

        <Reveal delay={100}>
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
            Location
          </p>
          <div className="mt-3 flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-green-soft)] text-center">
            <MapPin className="h-8 w-8 text-[var(--color-green-deep)]" />
            <p className="font-display text-xl">Sandwa, Rajasthan</p>
            <p className="max-w-xs text-xs text-[var(--color-ink-soft)]">
              Exact plot coordinates are shared with members after
              allocation. We don&apos;t publish a private address.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
