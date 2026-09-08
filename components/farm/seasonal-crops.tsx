"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Calendar, Check, X } from "lucide-react";
import { currentCrop, wheatComparisonRows } from "@/lib/demo-data";
import { Reveal } from "@/components/ui/reveal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { CropCycleModal } from "@/components/farm/crop-cycle-modal";
import { WheatIcon } from "@/components/farm/illustrations/wheat-icon";
import cropPhoto from "@/public/images/wheat-field-golden.jpg";

export function SeasonalCrops() {
  const [open, setOpen] = useState(false);

  return (
    <section id="crops" className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-14 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
            This Season
          </p>
          <h2 className="mt-3 max-w-lg font-display text-[1.75rem] leading-[1.15] tracking-tight sm:text-5xl sm:leading-tight">
            Right now, we grow one crop — and grow it well.
          </h2>
          <p className="mt-4 max-w-md text-[var(--color-ink-soft)]">
            Mera Khet is focused on a single seasonal crop at a time,
            so our team can give it full attention from field prep to
            harvest.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <Card className="mt-12 overflow-hidden">
            <div className="relative aspect-[16/7]">
              <Image
                src={cropPhoto}
                alt="Golden wheat ears ready for harvest"
                fill
                sizes="(min-width: 1024px) 1100px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)]/60 via-transparent to-transparent" />
              <Badge tone="gold" className="absolute bottom-4 left-4">
                <Calendar className="h-3 w-3" /> {currentCrop.season}
              </Badge>
            </div>

            <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <h3 className="font-display text-3xl uppercase tracking-tight">
                  {currentCrop.name}
                </h3>
                <p className="text-sm text-[var(--color-ink-soft)]">{currentCrop.localName}</p>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {currentCrop.description}
                </p>

                <div className="mt-6 rounded-[var(--radius-sm)] border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 p-4">
                  <Badge tone="gold">Seed Variety — {currentCrop.variety}</Badge>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {currentCrop.varietyDescription}
                  </p>
                  <dl className="mt-4 space-y-3">
                    {currentCrop.varietyBenefits.map((b) => (
                      <div key={b.title} className="text-sm">
                        <dt className="font-medium text-[var(--color-ink)]">{b.title}</dt>
                        <dd className="text-[var(--color-ink-soft)]">{b.description}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <button
                  onClick={() => setOpen(true)}
                  className="group mt-6 flex items-center gap-1 text-sm font-semibold text-[var(--color-green)] transition-colors hover:text-[var(--color-green-deep)]"
                >
                  View Crop Cycle
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>

              <div className="relative overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-green-soft)] p-6">
                <WheatIcon
                  color="var(--color-green)"
                  className="pointer-events-none absolute -right-3 -top-3 h-28 w-28 opacity-15"
                />
                <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-green-deep)]">
                  At a Glance
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-ink-soft)]">Seed variety</dt>
                    <dd className="font-medium text-[var(--color-green-deep)]">{currentCrop.variety}</dd>
                  </div>
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
            </div>
          </Card>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-10">
            <p className="text-center font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
              Food Should Never Be a Mystery
            </p>
            <h3 className="mt-2 text-center font-display text-xl text-[var(--color-ink)] sm:text-2xl">
              What you know, versus what you usually don&apos;t.
            </h3>

            <div className="mt-8 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-surface)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
                    <tr>
                      <th className="px-5 py-3 font-medium">&nbsp;</th>
                      <th className="px-5 py-3 font-medium">Most wheat &amp; atta you buy</th>
                      <th className="px-5 py-3 font-medium text-[var(--color-green-deep)]">Mera Khet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-ink)]/10">
                    {wheatComparisonRows.map((row) => (
                      <tr key={row.label}>
                        <td className="px-5 py-3 font-medium text-[var(--color-ink)]">{row.label}</td>
                        <td className="px-5 py-3 text-[var(--color-ink-soft)]">
                          <span className="flex items-center gap-1.5">
                            <X className="h-3.5 w-3.5 shrink-0 text-[var(--color-live)]/70" />
                            {row.unknown}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-[var(--color-green-deep)]">
                          <span className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 shrink-0 text-[var(--color-green)]" />
                            {row.known}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mx-auto mt-4 max-w-lg text-center text-xs text-[var(--color-ink-soft)]">
              This isn&apos;t about any farmer or seller doing anything wrong —
              most food changes hands too many times for anyone to trace it
              back. Mera Khet just skips that: it&apos;s your plot, so
              there&apos;s nothing to trace.
            </p>
          </div>
        </Reveal>
      </div>

      <CropCycleModal crop={open ? currentCrop : null} onClose={() => setOpen(false)} />
    </section>
  );
}
