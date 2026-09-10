import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroPhoto from "@/public/images/farmer-hand-wheat-sunset.jpg";

export function Hero({ filledPlots, totalPlots }: { filledPlots: number; totalPlots: number }) {
  const remaining = Math.max(totalPlots - filledPlots, 0);
  const pctFilled = totalPlots > 0 ? Math.round((filledPlots / totalPlots) * 100) : 0;

  return (
    <section className="relative overflow-hidden border-b border-[var(--color-ink)]/10 bg-[var(--color-bg)]">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:py-24 lg:grid-cols-2 lg:py-28">
        <div>
          <p className="mb-5 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
            Sujangarh, Rajasthan
          </p>
          <h1 className="font-display text-[2.5rem] leading-[1.08] tracking-tight text-[var(--color-ink)] sm:text-6xl sm:leading-[1.05]">
            Your own wheat,
            <br />
            grown for you.
          </h1>
          <p className="mt-6 max-w-md text-lg text-[var(--color-ink-soft)]">
            A plot of real farmland in Rajasthan, farmed for you by
            our team for one season — and the harvest comes home to
            you. From our soil to your plate, you know your food.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg">
                Reserve Your Plot <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-[var(--color-ink-soft)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline"
            >
              See how it works
            </a>
          </div>

          <div className="mt-10 border-t border-[var(--color-ink)]/10 pt-6">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium text-[var(--color-ink)]">
                {filledPlots} of {totalPlots} plots reserved
              </p>
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
                {remaining} left this season
              </p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-ink)]/10">
              <div
                className="h-full rounded-full bg-[var(--color-green)]"
                style={{ width: `${pctFilled}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <span>Responsibly Farmed</span>
              <span className="text-[var(--color-ink)]/20">•</span>
              <span>Seasonal Only</span>
              <span className="text-[var(--color-ink)]/20">•</span>
              <span>24×7 CCTV</span>
              <span className="text-[var(--color-ink)]/20">•</span>
              <span>Farm Updates</span>
            </div>
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
                Member Dashboard
              </p>
              <span className="font-mono-data text-[10px] font-semibold text-[var(--color-ink-soft)]">
                PREVIEW
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
