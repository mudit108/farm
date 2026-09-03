import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroPhoto from "@/public/images/farmer-hand-wheat-sunset.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-ink)]/10 bg-[var(--color-bg)]">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:py-24 lg:grid-cols-2 lg:py-28">
        <div>
          <p className="mb-5 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
            Sandwa, Rajasthan
          </p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-[var(--color-ink)] sm:text-6xl">
            Own a piece
            <br />
            of the farm.
          </h1>
          <p className="mt-6 max-w-md text-lg text-[var(--color-ink-soft)]">
            Choose 1, 3, or 6 organic farm plots in Rajasthan — from
            feeding your family to owning an entire acre. This season:
            Gehu (wheat), sowing near Diwali.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/auth/signup">
              <Button size="lg">
                Own Your Farm <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline">
                Explore How It Works
              </Button>
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--color-ink)]/10 pt-6 font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            <span>100% Organic</span>
            <span className="text-[var(--color-ink)]/20">•</span>
            <span>1, 3 or 6 Plots</span>
            <span className="text-[var(--color-ink)]/20">•</span>
            <span>Seasonal Only</span>
            <span className="text-[var(--color-ink)]/20">•</span>
            <span>24×7 CCTV</span>
            <span className="text-[var(--color-ink)]/20">•</span>
            <span>Farm Updates</span>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 sm:aspect-square">
            <Image
              src={heroPhoto}
              alt="A farmer's hand brushing through ripening wheat at golden hour"
              fill
              priority
              sizes="(min-width: 1024px) 560px, 90vw"
              className="object-cover"
            />
          </div>

          <div className="absolute -bottom-6 -left-4 w-64 rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-surface)] p-4 shadow-xl sm:-left-10">
            <div className="flex items-center justify-between">
              <p className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--color-ink-soft)]">
                Your Farm
              </p>
              <span className="flex items-center gap-1 font-mono-data text-[10px] font-semibold text-[var(--color-live)]">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-[var(--color-live)]" />
                LIVE
              </span>
            </div>
            <p className="mt-1 font-display text-xl">3 Plots</p>
            <p className="text-sm text-[var(--color-ink-soft)]">21,780 sq ft · ~0.5 acre</p>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--color-ink)]/10 pt-3 text-xs">
              <div>
                <p className="text-[var(--color-ink-soft)]">Crop</p>
                <p className="font-medium">Gehu (Wheat)</p>
              </div>
              <div>
                <p className="text-[var(--color-ink-soft)]">Status</p>
                <p className="font-medium">Upcoming 🌾</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded-full bg-[var(--color-green-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-green-deep)]">
              <Video className="h-3 w-3" /> Farm Camera
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
