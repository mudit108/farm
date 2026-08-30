import { Reveal } from "@/components/ui/reveal";
import { PlotMap } from "@/components/farm/plot-map";
import { demoPlot } from "@/lib/demo-data";

export function HalfAcre() {
  return (
    <section className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg)] py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-2">
        <Reveal>
          <PlotMap />
        </Reveal>

        <Reveal delay={100}>
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
            Your Farm
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Your plots, marked on the map.
          </h2>
          <p className="mt-4 max-w-md text-[var(--color-ink-soft)]">
            Every membership — 1, 3, or 6 plots — maps to real, specific
            plots within Khet Club, not a share of an abstract pool.
            Shown here: a 3-plot example.
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-[var(--color-ink)]/10 pt-6">
            <div>
              <dt className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Plots</dt>
              <dd className="mt-1 font-display text-lg">{demoPlot.plotIds.join(", ")}</dd>
            </div>
            <div>
              <dt className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Area</dt>
              <dd className="mt-1 font-display text-lg">{demoPlot.areaSqFt.toLocaleString()} sq ft</dd>
            </div>
            <div>
              <dt className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Location</dt>
              <dd className="mt-1 font-display text-lg">{demoPlot.location}</dd>
            </div>
            <div>
              <dt className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Current Crop</dt>
              <dd className="mt-1 font-display text-lg">{demoPlot.crop}</dd>
            </div>
          </dl>

          <p className="mt-8 rounded-[var(--radius-sm)] bg-[var(--color-brown-soft)] p-4 text-xs leading-relaxed text-[var(--color-ink-soft)]">
            Your allocation (1, 3, or 6 plots) represents your contractual
            farm participation and use rights within Khet Club, under the
            terms of your membership agreement — it does not constitute
            legal ownership of agricultural land unless explicitly
            transferred under that agreement.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
