"use client";

import { useState } from "react";
import { Camera, Maximize, Radio } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const cameras = [
  { id: "cam-01", label: "Camera 01", area: "Main Field" },
  { id: "cam-02", label: "Camera 02", area: "Farm Entrance" },
  { id: "cam-03", label: "Camera 03", area: "Crop Area" },
];

/**
 * streamUrl comes from the camera record assigned to this customer's plot
 * once a backend is wired up. Left undefined here in demo mode.
 */
export default function LiveCameraPage({ streamUrl }: { streamUrl?: string }) {
  const [selected, setSelected] = useState(cameras[0].id);
  const cam = cameras.find((c) => c.id === selected)!;

  return (
    <div>
      <PageHeader title="Live Camera" subtitle="24×7 view of your plot, when connected." />

      <div className="p-6 sm:px-10">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--color-ink)]/10 px-5 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className={cn("h-2 w-2 rounded-full", streamUrl ? "live-dot bg-[var(--color-live)]" : "bg-[var(--color-ink)]/30")} />
              {streamUrl ? "LIVE" : "Not Connected"} · {cam.label} — {cam.area}
            </div>
            <button aria-label="Fullscreen" className="rounded-full p-1.5 hover:bg-[var(--color-ink)]/5">
              <Maximize className="h-4 w-4" />
            </button>
          </div>

          <div className="flex aspect-video items-center justify-center bg-[var(--color-ink)]">
            {streamUrl ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={streamUrl} autoPlay muted playsInline className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-3 px-8 text-center text-white/50">
                <Radio className="h-8 w-8" />
                <p className="max-w-xs text-sm">
                  Live camera connection will appear here once your farm
                  camera is connected.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-ink)]/10 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {cameras.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    selected === c.id
                      ? "bg-[var(--color-green)] text-white"
                      : "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)] hover:bg-[var(--color-ink)]/10"
                  )}
                >
                  <Camera className="h-3.5 w-3.5" />
                  {c.label}
                </button>
              ))}
            </div>
            <ClientTimestamp />
          </div>
        </Card>
      </div>
    </div>
  );
}

function ClientTimestamp() {
  const now = new Date();
  const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return (
    <span className="font-mono-data text-xs text-[var(--color-ink-soft)]">
      {time} · {date}
    </span>
  );
}
