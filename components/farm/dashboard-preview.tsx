import { Reveal } from "@/components/ui/reveal";
import { Card } from "@/components/ui/card";
import { currentCrop } from "@/lib/demo-data";
import { createAnonClient } from "@/lib/supabase/anon";

type Season = {
  current_stage: string;
  progress: number;
  sowing_date: string | null;
  estimated_harvest: string | null;
};

async function getSeason(): Promise<Season | null> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("khet_club_get_season");
  if (error) {
    console.error("Failed to load khet_club_get_season:", error.message);
    return null;
  }
  return (data as Season[] | null)?.[0] ?? null;
}

export async function DashboardPreview() {
  const season = await getSeason();

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
                <p className="font-display text-xl">Your Farm</p>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
              <Stat label="Current Crop" value={`${currentCrop.name} (${currentCrop.localName})`} />
              <Stat label="Sowing" value={season?.sowing_date ? new Date(season.sowing_date).toLocaleDateString("en-IN") : "Near Diwali"} />
              <Stat label="Est. Harvest" value={season?.estimated_harvest ? new Date(season.estimated_harvest).toLocaleDateString("en-IN") : "Spring"} />
            </div>

            <div className="border-t border-[var(--color-ink)]/10 px-6 py-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-ink-soft)]">Season progress — {season?.current_stage ?? "Field Preparation"}</span>
                <span className="font-mono-data">{season?.progress ?? 0}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-green-soft)]">
                <div
                  className="h-full rounded-full bg-[var(--color-green)]"
                  style={{ width: `${season?.progress ?? 0}%` }}
                />
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
        {label}
      </p>
      <p className="mt-1 font-display text-xl">{value}</p>
    </div>
  );
}
