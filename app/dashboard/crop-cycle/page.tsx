import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { demoCrops, demoPlot } from "@/lib/demo-data";

export default function CropCyclePage() {
  const crop = demoCrops.find((c) => demoPlot.crop.includes(c.name)) ?? demoCrops[0];
  const currentIndex = crop.stages.indexOf(demoPlot.currentStage);

  return (
    <div>
      <PageHeader title="Crop Cycle" subtitle={`${crop.name} (${crop.localName}) — Plots ${demoPlot.plotIds.join(", ")}`} />

      <div className="grid gap-6 p-6 sm:px-10 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <ol>
            {crop.stages.map((stage, i) => {
              const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
              return (
                <li key={stage} className="relative flex gap-4 pb-8 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono-data text-[11px] font-semibold ${
                        state === "done"
                          ? "bg-[var(--color-green)] text-white"
                          : state === "current"
                          ? "bg-[var(--color-brown)] text-white"
                          : "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)]"
                      }`}
                    >
                      {i + 1}
                    </span>
                    {i < crop.stages.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-[var(--color-ink)]/10" />
                    )}
                  </div>
                  <div className="pt-0.5">
                    <p className="font-medium">{stage}</p>
                    {state === "current" && (
                      <p className="text-xs text-[var(--color-brown)]">Current stage</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Timeline
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-soft)]">Sowing date</dt>
                <dd className="font-medium">{demoPlot.sowingDate}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-soft)]">Expected harvest</dt>
                <dd className="font-medium">{demoPlot.estimatedHarvest}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-soft)]">Progress</dt>
                <dd className="font-medium">{demoPlot.progress}%</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Weather
            </p>
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
              Local weather data will appear here once a weather provider is
              configured.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
