import { Sun, Cloud, CloudRain, CloudFog, CloudLightning, Droplets, Wind } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { currentCrop } from "@/lib/demo-data";
import { createSessionClient } from "@/lib/supabase/session";
import { getFarmWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

type Season = {
  current_stage: string;
  progress: number;
  health: string;
  sowing_date: string | null;
  estimated_harvest: string | null;
};

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  if (code === 0 || code === 1) return <Sun className={className} />;
  if (code === 2 || code === 3) return <Cloud className={className} />;
  if (code === 45 || code === 48) return <CloudFog className={className} />;
  if (code >= 51 && code <= 82) return <CloudRain className={className} />;
  if (code >= 95) return <CloudLightning className={className} />;
  return <Cloud className={className} />;
}

export default async function CropCyclePage() {
  const supabase = await createSessionClient();

  const [{ data: seasonData }, { data: userData }, weather] = await Promise.all([
    supabase.rpc("khet_club_get_season"),
    supabase.auth.getUser(),
    getFarmWeather(),
  ]);
  const season = (seasonData as Season[] | null)?.[0] ?? null;

  let plotNumbers: number[] = [];
  if (userData.user) {
    const { data } = await supabase
      .from("khet_club_plots")
      .select("plot_number")
      .eq("user_id", userData.user.id)
      .order("plot_number");
    plotNumbers = ((data ?? []) as { plot_number: number }[]).map((p) => p.plot_number);
  }

  const currentIndex = season ? currentCrop.stages.indexOf(season.current_stage) : -1;

  return (
    <div>
      <PageHeader
        title="Crop Cycle"
        subtitle={`${currentCrop.name} (${currentCrop.localName})${plotNumbers.length ? ` — Plots ${plotNumbers.map((n) => `#${n}`).join(", ")}` : ""}`}
      />

      <div className="grid gap-6 p-6 sm:px-10 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <ol>
            {currentCrop.stages.map((stage, i) => {
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
                    {i < currentCrop.stages.length - 1 && (
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
                <dd className="font-medium">
                  {season?.sowing_date ? new Date(season.sowing_date).toLocaleDateString("en-IN") : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-soft)]">Expected harvest</dt>
                <dd className="font-medium">
                  {season?.estimated_harvest ? new Date(season.estimated_harvest).toLocaleDateString("en-IN") : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-soft)]">Progress</dt>
                <dd className="font-medium">{season?.progress ?? 0}%</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                Weather — Sandwa, Rajasthan
              </p>
              {weather && <span className="text-[10px] text-[var(--color-ink-soft)]">Live</span>}
            </div>

            {weather ? (
              <>
                <div className="mt-3 flex items-center gap-4">
                  <WeatherIcon code={weather.current.weatherCode} className="h-10 w-10 text-[var(--color-brown)]" />
                  <div>
                    <p className="font-display text-3xl">{Math.round(weather.current.temperatureC)}°C</p>
                    <p className="text-xs text-[var(--color-ink-soft)]">{weather.current.condition}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-4 text-xs text-[var(--color-ink-soft)]">
                  <span className="flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5" /> {weather.current.humidity}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="h-3.5 w-3.5" /> {Math.round(weather.current.windKph)} km/h
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-5 gap-1 border-t border-[var(--color-ink)]/10 pt-4">
                  {weather.daily.map((d) => (
                    <div key={d.date} className="flex flex-col items-center gap-1 text-center">
                      <span className="text-[10px] text-[var(--color-ink-soft)]">
                        {new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" })}
                      </span>
                      <WeatherIcon code={d.weatherCode} className="h-4 w-4 text-[var(--color-brown)]" />
                      <span className="text-[10px] font-medium">
                        {Math.round(d.maxC)}°/{Math.round(d.minC)}°
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[10px] text-[var(--color-ink-soft)]">
                  Data via Open-Meteo, updated every 30 minutes.
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
                Weather data is temporarily unavailable — please check back shortly.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
