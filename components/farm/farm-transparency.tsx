"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { Camera, MapPin, Sprout, Calendar, Activity, Image as ImageIcon, Video, Radio, PackageCheck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import mainFieldPhoto from "@/public/images/cctv/cam-main-field.jpg";
import farmEntrancePhoto from "@/public/images/cctv/cam-farm-entrance.jpg";
import cropAreaPhoto from "@/public/images/cctv/cam-crop-area.jpg";

const cameras: { id: string; label: string; area: string; photo: StaticImageData }[] = [
  { id: "cam-01", label: "Camera 01", area: "Main Field", photo: mainFieldPhoto },
  { id: "cam-02", label: "Camera 02", area: "Farm Entrance", photo: farmEntrancePhoto },
  { id: "cam-03", label: "Camera 03", area: "Crop Area", photo: cropAreaPhoto },
];

const trackedItems = [
  { icon: MapPin, label: "Where your farm is" },
  { icon: Sprout, label: "What crop is planted" },
  { icon: Calendar, label: "When it was planted" },
  { icon: Activity, label: "Current crop stage" },
  { icon: PackageCheck, label: "Farm activities" },
  { icon: ImageIcon, label: "Photos" },
  { icon: Video, label: "Videos" },
  { icon: Radio, label: "24×7 CCTV" },
];

export type SeasonSnapshot = {
  current_stage: string;
  progress: number;
  sowing_date: string | null;
  estimated_harvest: string | null;
};

/**
 * Merged from four previously separate sections (LiveFarm,
 * DashboardPreview, FarmUpdates intro, Transparency) that all said
 * variations of "you can watch your farm" back-to-back — a wall of
 * repetition sitting between the visitor and the pricing. One section,
 * one idea, one scroll.
 *
 * streamUrl is intentionally undefined in demo mode. The photos below are
 * real recent snapshots from the farm's cameras — not a fabricated live
 * feed — labeled "DEMO CAMERA" rather than "LIVE" so nobody mistakes a
 * still photo for real-time video.
 */
export function FarmTransparency({
  season,
  cropName,
  streamUrl,
}: {
  season: SeasonSnapshot | null;
  cropName: string;
  streamUrl?: string;
}) {
  const [selected, setSelected] = useState(cameras[0].id);
  const activeCamera = cameras.find((c) => c.id === selected)!;

  return (
    <section id="live" className="border-b border-[var(--color-ink)]/10 bg-[var(--color-ink)] py-20 text-[var(--color-bg)] sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-gold)]">
            See Everything
          </p>
          <h2 className="mt-3 max-w-xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            You don&apos;t have to take our word for it.
          </h2>
          <p className="mt-4 max-w-md text-[var(--color-bg)]/70">
            Cameras on the field, live crop stage, and regular updates —
            so you can watch your season happen instead of wondering
            about it.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-12 overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-black/30">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <span className="font-mono-data text-xs uppercase tracking-wide text-white/70">
                Farm Camera — {activeCamera.area}
              </span>
              <span className="flex items-center gap-1.5 font-mono-data text-xs font-semibold text-[var(--color-live)]">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-[var(--color-live)]" />
                DEMO CAMERA
              </span>
            </div>

            <div className="relative aspect-video">
              {streamUrl ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={streamUrl} autoPlay muted playsInline className="h-full w-full object-cover" />
              ) : (
                <Image
                  src={activeCamera.photo}
                  alt={`Recent snapshot from ${activeCamera.label} — ${activeCamera.area}`}
                  fill
                  sizes="(min-width: 1024px) 1100px, 100vw"
                  className="object-cover"
                />
              )}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-white/10 p-4">
              {cameras.map((cam) => (
                <button
                  key={cam.id}
                  onClick={() => setSelected(cam.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    selected === cam.id
                      ? "bg-white text-[var(--color-ink)]"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  )}
                >
                  <Camera className="h-3.5 w-3.5" />
                  {cam.label} — {cam.area}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <p className="mt-4 text-xs text-white/40">
          Shown here: real recent snapshots from the farm, not a live video
          feed. 24×7 live streaming is being rolled out; camera feeds shown
          to members will be scoped to their own plot only.
        </p>

        <Reveal delay={150}>
          <div className="mt-12 rounded-[var(--radius-card)] border border-white/10 bg-white/5 p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="font-mono-data text-xs uppercase tracking-wide text-white/50">Current Crop</p>
                <p className="mt-1 font-display text-xl">{cropName}</p>
              </div>
              <div>
                <p className="font-mono-data text-xs uppercase tracking-wide text-white/50">Sowing</p>
                <p className="mt-1 font-display text-xl">
                  {season?.sowing_date ? new Date(season.sowing_date).toLocaleDateString("en-IN") : "Near Diwali"}
                </p>
              </div>
              <div>
                <p className="font-mono-data text-xs uppercase tracking-wide text-white/50">Est. Harvest</p>
                <p className="mt-1 font-display text-xl">
                  {season?.estimated_harvest ? new Date(season.estimated_harvest).toLocaleDateString("en-IN") : "Spring"}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Season progress — {season?.current_stage ?? "Field Preparation"}</span>
                <span className="font-mono-data">{season?.progress ?? 0}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--color-gold)]"
                  style={{ width: `${season?.progress ?? 0}%` }}
                />
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-12 font-mono-data text-xs uppercase tracking-wide text-white/50">
            Tracked on your dashboard
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {trackedItems.map((it) => (
              <div key={it.label} className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-white/10 px-4 py-3">
                <it.icon className="h-4 w-4 shrink-0 text-[var(--color-gold)]" />
                <p className="text-xs font-medium text-white/80">{it.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
