import { Wifi } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { PlotMap } from "@/components/farm/plot-map";
import { demoPlot, demoUpdates } from "@/lib/demo-data";

export default function DashboardOverview() {
  return (
    <div>
      <PageHeader title="Good morning 👋" subtitle={`Plots ${demoPlot.plotIds.join(", ")} · ${demoPlot.location}`} />

      <div className="grid gap-6 p-6 sm:px-10 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Your Farm
            </p>
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-green-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-green-deep)]">
              <Wifi className="h-3.5 w-3.5" /> Camera Online
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat label="Allocation" value={`${demoPlot.plotsCount} Plots`} sub={`${demoPlot.areaSqFt.toLocaleString()} sq ft`} />
            <Stat label="Current Crop" value={demoPlot.crop} sub="Upcoming" />
            <Stat label="Sown" value={demoPlot.sowingDate} />
            <Stat label="Est. Harvest" value={demoPlot.estimatedHarvest} />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-ink-soft)]">Season progress</span>
              <span className="font-mono-data">{demoPlot.progress}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-green-soft)]">
              <div className="h-full rounded-full bg-[var(--color-green)]" style={{ width: `${demoPlot.progress}%` }} />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--color-green-soft)] px-4 py-3 text-sm">
            <span className="text-[var(--color-green-deep)]">Farm Health</span>
            <span className="font-semibold text-[var(--color-green-deep)]">{demoPlot.health}</span>
          </div>
        </Card>

        <Card className="p-6">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Plot Map
          </p>
          <div className="mt-4">
            <PlotMap compact />
          </div>
        </Card>
      </div>

      <div className="px-6 pb-10 sm:px-10">
        <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
          Latest Update
        </p>
        <Card className="mt-3 p-5">
          <p className="text-xs text-[var(--color-ink-soft)]">{demoUpdates[demoUpdates.length - 1].date}</p>
          <p className="mt-1 font-medium">{demoUpdates[demoUpdates.length - 1].title}</p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {demoUpdates[demoUpdates.length - 1].description}
          </p>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</p>
      <p className="mt-1 font-display text-lg">{value}</p>
      {sub && <p className="text-xs text-[var(--color-green)]">{sub}</p>}
    </div>
  );
}
