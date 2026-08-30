import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { PlotMap } from "@/components/farm/plot-map";
import { demoPlot } from "@/lib/demo-data";

export default function MyFarmPage() {
  return (
    <div>
      <PageHeader title="My Farm" subtitle="Everything about your allocated plots." />

      <div className="grid gap-6 p-6 sm:px-10 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                Plots
              </p>
              <p className="font-display text-2xl">{demoPlot.plotIds.join(", ")}</p>
            </div>
            <Badge tone="gold">{demoPlot.health}</Badge>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-5">
            <Info label="Plan" value={`${demoPlot.plotsCount} Plots`} />
            <Info label="Area" value={`${demoPlot.areaSqFt.toLocaleString()} sq ft`} />
            <Info label="Location" value={demoPlot.location} />
            <Info label="Wheat Target" value={`${demoPlot.wheatMinKg}–${demoPlot.wheatMaxKg} kg`} />
            <Info label="Current Crop" value={demoPlot.crop} />
            <Info label="Sowing Date" value={demoPlot.sowingDate} />
            <Info label="Current Stage" value={demoPlot.currentStage} />
            <Info label="Farm Status" value={demoPlot.health} />
          </dl>

          <p className="mt-6 rounded-[var(--radius-sm)] bg-[var(--color-brown-soft)] p-4 text-xs leading-relaxed text-[var(--color-ink-soft)]">
            This allocation reflects your contractual farm participation and
            use rights under your membership agreement.
          </p>
        </Card>

        <Card className="p-6">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Farm Map
          </p>
          <div className="mt-4">
            <PlotMap />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
