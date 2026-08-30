import { Wifi } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Card } from "@/components/ui/card";
import { demoPlot } from "@/lib/demo-data";

export function DashboardPreview() {
  return (
    <section className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
            Your Dashboard
          </p>
          <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Everything about your farm, in one place.
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <Card className="mt-12 overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] px-6 py-5">
              <div>
                <p className="text-sm text-[var(--color-ink-soft)]">Good morning 👋</p>
                <p className="font-display text-xl">Your Farm — {demoPlot.plotsCount} Plots</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-green-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-green-deep)]">
                <Wifi className="h-3.5 w-3.5" /> Camera Online
              </span>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Allocation" value={`${demoPlot.areaSqFt.toLocaleString()} sq ft`} />
              <Stat label="Current Crop" value={demoPlot.crop} sub="Upcoming" />
              <Stat label="Sown" value={demoPlot.sowingDate} />
              <Stat label="Est. Harvest" value={demoPlot.estimatedHarvest} />
            </div>

            <div className="border-t border-[var(--color-ink)]/10 px-6 py-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-ink-soft)]">Season progress</span>
                <span className="font-mono-data">{demoPlot.progress}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-green-soft)]">
                <div
                  className="h-full rounded-full bg-[var(--color-green)]"
                  style={{ width: `${demoPlot.progress}%` }}
                />
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
        {label}
      </p>
      <p className="mt-1 font-display text-xl">{value}</p>
      {sub && <p className="text-xs text-[var(--color-green)]">{sub}</p>}
    </div>
  );
}
