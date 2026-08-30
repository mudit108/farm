import { MapPin, Sprout, Calendar, Activity, Image, Video, Radio, PackageCheck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const items = [
  { icon: MapPin, label: "Where your farm is" },
  { icon: Sprout, label: "What crop is planted" },
  { icon: Calendar, label: "When it was planted" },
  { icon: Activity, label: "Current crop stage" },
  { icon: PackageCheck, label: "Farm activities" },
  { icon: Image, label: "Photos" },
  { icon: Video, label: "Videos" },
  { icon: Radio, label: "24×7 CCTV" },
];

export function Transparency() {
  return (
    <section className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
            Transparency
          </p>
          <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Know what&apos;s happening on your farm.
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={it.label} delay={i * 40}>
              <div className="flex h-full flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 p-5">
                <it.icon className="h-5 w-5 text-[var(--color-green)]" />
                <p className="text-sm font-medium">{it.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
