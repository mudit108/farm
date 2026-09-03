"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { Camera } from "lucide-react";
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

/**
 * streamUrl is intentionally undefined in demo mode. The photos below are
 * real recent snapshots from Sandwa Farm's cameras — not a fabricated
 * live feed — labeled "DEMO CAMERA" rather than "LIVE" so nobody mistakes
 * a still photo for real-time video. Wire streamUrl up to a real
 * RTSP → HLS/WebRTC gateway URL from the `cameras` table when ready.
 */
export function LiveFarm({ streamUrl }: { streamUrl?: string }) {
  const [selected, setSelected] = useState(cameras[0].id);
  const activeCamera = cameras.find((c) => c.id === selected)!;

  return (
    <section id="live" className="border-b border-[var(--color-ink)]/10 bg-[var(--color-ink)] py-20 text-[var(--color-bg)] sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-gold)]">
            24×7 Live Farm
          </p>
          <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Your farm. Live.
          </h2>
          <p className="mt-4 max-w-md text-[var(--color-bg)]/70">
            You&apos;re not just receiving updates — you can see what&apos;s
            happening on the farm.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-12 overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-black/30">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <span className="font-mono-data text-xs uppercase tracking-wide text-white/70">
                Farm Camera — Plot A · {activeCamera.area}
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
          Shown here: real recent snapshots from Sandwa Farm, not a live
          video feed. 24×7 live streaming is being rolled out; camera
          feeds shown to customers will be scoped to their own plot only.
        </p>
      </div>
    </section>
  );
}
