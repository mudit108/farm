"use client";

import { useState } from "react";
import { ArrowUpRight, Calendar } from "lucide-react";
import { currentCrop } from "@/lib/demo-data";
import { Reveal } from "@/components/ui/reveal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { CropCycleModal } from "@/components/farm/crop-cycle-modal";

export function SeasonalCrops() {
  const [open, setOpen] = useState(false);

  return (
    <section id="crops" className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
            This Season
          </p>
          <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Right now, we grow one crop — and grow it well.
          </h2>
          <p className="mt-4 max-w-md text-[var(--color-ink-soft)]">
            Khet Club is focused on a single seasonal crop at a time,
            so our team can give it full attention from field prep to
            harvest.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <Card className="mt-12 grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="gold">
                  <Calendar className="h-3 w-3" /> {currentCrop.season}
                </Badge>
              </div>
              <h3 className="mt-4 font-display text-3xl uppercase tracking-tight">
                {currentCrop.name}
              </h3>
              <p className="text-sm text-[var(--color-ink-soft)]">{currentCrop.localName}</p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {currentCrop.description}
              </p>

              <button
                onClick={() => setOpen(true)}
                className="group mt-6 flex items-center gap-1 text-sm font-semibold text-[var(--color-green)] transition-colors hover:text-[var(--color-green-deep)]"
              >
                View Crop Cycle
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>

            <div className="rounded-[var(--radius-sm)] bg-[var(--color-green-soft)] p-6">
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-green-deep)]">
                At a Glance
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-soft)]">Sowing</dt>
                  <dd className="font-medium text-[var(--color-green-deep)]">Near Diwali</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-soft)]">Cycle length</dt>
                  <dd className="font-medium text-[var(--color-green-deep)]">~{currentCrop.durationDays} days</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-soft)]">Processed into</dt>
                  <dd className="font-medium text-[var(--color-green-deep)]">{currentCrop.processedProduct}</dd>
                </div>
              </dl>
            </div>
          </Card>
        </Reveal>
      </div>

      <CropCycleModal crop={open ? currentCrop : null} onClose={() => setOpen(false)} />
    </section>
  );
}
