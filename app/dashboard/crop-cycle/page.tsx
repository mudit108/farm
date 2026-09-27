import type { Metadata } from "next";
import Image from "next/image";
import { Sun, Cloud, CloudRain, CloudFog, CloudLightning, Droplets, Wind, Radio, Check, CalendarDays, CloudSun, Sprout } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Tabs } from "@/components/ui/tabs";
import { Panel, ProgressBar } from "@/components/dashboard/ui";
import { currentCrop } from "@/lib/demo-data";
import { stageDetails } from "@/lib/site-content";
import { formatDay, stageWhenLabels } from "@/lib/season-timeline";
import { createSessionClient } from "@/lib/supabase/session";
import { getFarmWeather } from "@/lib/weather";
import { CameraPlayer } from "@/components/dashboard/camera-player";
import { cn } from "@/lib/utils";
import samplePhoto from "@/public/images/cctv/cam-main-field.jpg";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Farm Activity | Mera Khet", robots: { index: false } };

type Season = {
  current_stage: string;
  progress: number;
  health: string;
  sowing_date: string | null;
  estimated_harvest: string | null;
};
type CameraStatus = { camera_name: string; status: string; stream_url: string | null };
type Update = { id: string; title: string; description: string; created_at: string; photo_url: string | null };

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  if (code === 0 || code === 1) return <Sun className={className} />;
  if (code === 2 || code === 3) return <Cloud className={className} />;
  if (code === 45 || code === 48) return <CloudFog className={className} />;
  if (code >= 51 && code <= 82) return <CloudRain className={className} />;
  if (code >= 95) return <CloudLightning className={className} />;
  return <Cloud className={className} />;
}

export default async function FarmActivityPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const supabase = await createSessionClient();

  const [{ data: seasonData }, { data: userData }, weather, { data: cameraData }, { data: updatesData }] =
    await Promise.all([
      supabase.rpc("khet_club_get_season"),
      supabase.auth.getUser(),
      getFarmWeather(),
      supabase.rpc("khet_club_my_camera"),
      supabase.from("khet_club_updates").select("id, title, description, created_at, photo_url").order("created_at", { ascending: false }),
    ]);
  const season = (seasonData as Season[] | null)?.[0] ?? null;
  const camera = (cameraData as CameraStatus[] | null)?.[0] ?? null;
  const isOnline = camera?.status === "online";
  const updates = (updatesData ?? []) as Update[];

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
  // "Field Preparation" is stage 0 — camera access is a member benefit
  // that starts once sowing actually begins, not before. There's
  // nothing to watch during field prep, so it stays gated even if a
  // camera has already been technically assigned to the plot.
  const farmingHasBegun = currentIndex >= 1;
  const when = stageWhenLabels(currentCrop.stages, season?.sowing_date ?? null, season?.estimated_harvest ?? null);

  const cropCycleContent = (
    <div className="mk-page-pad grid gap-6 lg:grid-cols-3">
      <Panel icon={Sprout} label="Crop cycle · RAJ 1482 wheat" className="lg:col-span-2">
        <ol className="mk-stages">
          {currentCrop.stages.map((stage, i) => {
            const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
            const copy = stageDetails[stage];
            return (
              <li key={stage} className={`is-${state}`} aria-current={state === "current" ? "step" : undefined}>
                <span className="mk-stage-dot" aria-hidden="true">
                  {state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <div className="mk-stage-body">
                  <div className="mk-stage-head">
                    <p className="mk-stage-name">
                      {stage}
                      {state === "current" && <span className="mk-stage-now">Now</span>}
                      {state === "done" && <span className="sr-only"> (done)</span>}
                    </p>
                    {when[i] && <p className="mk-stage-when">{when[i]}</p>}
                  </div>
                  {state === "current" && copy && (
                    <div className="mk-stage-detail">
                      <p>{copy.desc}</p>
                      <p>
                        <span>What you&apos;ll see</span> {copy.see}
                      </p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Panel>

      <div className="flex min-w-0 flex-col gap-6">
        <Panel icon={CalendarDays} label="Timeline">
          <dl className="mk-facts mk-facts-rows">
            <div>
              <dt>Sowing date</dt>
              <dd>{season?.sowing_date ? formatDay(season.sowing_date, "long") : "—"}</dd>
            </div>
            <div>
              <dt>Expected harvest</dt>
              <dd>{season?.estimated_harvest ? formatDay(season.estimated_harvest, "long") : "—"}</dd>
            </div>
            <div>
              <dt>Progress</dt>
              <dd>{season?.progress ?? 0}%</dd>
            </div>
          </dl>
          <div className="mt-4">
            <ProgressBar value={season?.progress ?? 0} label="Season progress" />
          </div>
        </Panel>

        <Panel icon={CloudSun} label="Weather at the farm" className="mk-weather" action={weather ? <span className="mk-chip">Live</span> : undefined}>
          {weather ? (
            <>
              <div className="mk-weather-now">
                <WeatherIcon code={weather.current.weatherCode} className="h-11 w-11 text-[var(--color-brown)]" />
                <div>
                  <p className="mk-weather-temp">{Math.round(weather.current.temperatureC)}°C</p>
                  <p className="mk-muted">{weather.current.condition} · Sujangarh</p>
                </div>
              </div>

              <div className="mk-weather-meta">
                <span>
                  <Droplets className="h-3.5 w-3.5" aria-hidden="true" /> {weather.current.humidity}% humidity
                </span>
                <span>
                  <Wind className="h-3.5 w-3.5" aria-hidden="true" /> {Math.round(weather.current.windKph)} km/h
                </span>
              </div>

              <div className="mk-weather-days">
                {weather.daily.map((d) => (
                  <div key={d.date}>
                    <span>{new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" })}</span>
                    <WeatherIcon code={d.weatherCode} className="h-4 w-4 text-[var(--color-brown)]" />
                    <b>
                      {Math.round(d.maxC)}°<small>/{Math.round(d.minC)}°</small>
                    </b>
                  </div>
                ))}
              </div>
              <p className="mk-fine">Data via Open-Meteo, updated every 30 minutes.</p>
            </>
          ) : (
            <p className="mk-muted">Weather data is temporarily unavailable — please check back shortly.</p>
          )}
        </Panel>
      </div>
    </div>
  );

  const liveCameraContent = (
    <div className="mk-page-pad">
      <div className="mk-camframe">
        <div className="mk-camframe-bar">
          <span className="flex items-center gap-2">
            <span className={cn("mk-live-dot", isOnline && farmingHasBegun && "is-on")} aria-hidden="true" />
            {!farmingHasBegun
              ? "Camera access starts once sowing begins"
              : camera
                ? `${camera.camera_name} — ${camera.status}`
                : "No camera assigned yet"}
          </span>
          <span className="hidden sm:inline">Sujangarh, Rajasthan</span>
        </div>

        {camera && farmingHasBegun && camera.status === "online" && camera.stream_url ? (
          <CameraPlayer streamUrl={camera.stream_url} title={`Live view — ${camera.camera_name}`} />
        ) : camera && farmingHasBegun ? (
          <div className="mk-camframe-view">
            <Image
              src={samplePhoto}
              alt={`Recent sample view from ${camera.camera_name}`}
              fill
              sizes="(min-width: 1024px) 900px, 100vw"
              className="object-cover opacity-90"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
              <p className="text-xs text-white/80">
                Sample view — live video streaming for your camera isn&apos;t connected yet. This is a recent photo, not your real-time feed.
              </p>
            </div>
          </div>
        ) : (
          <div className="mk-camframe-view mk-camframe-empty">
            <Image src={samplePhoto} alt="" fill sizes="(min-width: 1024px) 900px, 100vw" className="object-cover" aria-hidden="true" />
            <div className="mk-camframe-msg">
              <Radio className="h-8 w-8" aria-hidden="true" />
              <p>
                {!farmingHasBegun
                  ? `Camera access begins once sowing starts${season?.sowing_date ? ` on ${formatDay(season.sowing_date, "long")}` : ""} — there's nothing to watch during field preparation yet.`
                  : "A camera hasn't been assigned to your plot yet. Check back once our team sets one up."}
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mk-fine mt-3 text-center">
        Live video depends on the weather and the network at the farm — if it drops, you&apos;ll see the latest photo, clearly labelled as a photo.
      </p>
    </div>
  );

  const updatesContent = (
    <div className="mk-page-pad">
      {updates.length === 0 && <p className="mk-muted">No updates published yet.</p>}
      <ol className="mk-feed">
        {updates.map((u) => (
          <li key={u.id}>
            <p className="mk-feed-date">
              {new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
            </p>
            <article className="mk-feed-card">
              <h3>{u.title}</h3>
              <p>{u.description}</p>
              {u.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element -- admin-supplied URL from any host
                <img src={u.photo_url} alt="" loading="lazy" />
              )}
            </article>
          </li>
        ))}
      </ol>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Farm Activity"
        title={season?.current_stage ? `Now: ${season.current_stage}` : "Farm Activity"}
        subtitle={`${currentCrop.name} (${currentCrop.localName})${plotNumbers.length ? ` — ${plotNumbers.length > 1 ? "Plots" : "Plot"} ${plotNumbers.map((n) => `#${n}`).join(", ")}` : ""}`}
      />

      <Tabs
        defaultTab={tab}
        tabs={[
          { id: "crop-cycle", label: "Crop Cycle", content: cropCycleContent },
          { id: "live-camera", label: "Live Camera", content: liveCameraContent },
          { id: "updates", label: "Farm Updates", content: updatesContent },
        ]}
      />
    </div>
  );
}
