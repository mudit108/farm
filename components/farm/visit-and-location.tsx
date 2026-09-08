import Image from "next/image";
import { MapPin } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import aerialPhoto from "@/public/images/aerial-harvest.jpg";

export function VisitAndLocation() {
  return (
    <section className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-14 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-2">
        <Reveal>
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
            Visit
          </p>
          <h2 className="mt-3 font-display text-[1.75rem] leading-[1.15] tracking-tight sm:text-5xl sm:leading-tight">
            Your farm isn&apos;t just on a screen.
          </h2>
          <p className="mt-4 max-w-md text-[var(--color-ink-soft)]">
            Members can visit Mera Khet and see their plot in person,
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
          <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-ink)]/10">
            <Image
              src={aerialPhoto}
              alt="Aerial view of combine harvesters working a wheat field"
              fill
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 bg-gradient-to-t from-[var(--color-ink)]/70 to-transparent px-6 pb-5 pt-14 text-center">
              <MapPin className="h-6 w-6 text-white" />
              <p className="font-display text-xl text-white">Sujangarh, Rajasthan</p>
              <p className="max-w-xs text-xs text-white/80">
                Exact plot coordinates are shared with members after
                allocation. We don&apos;t publish a private address.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
