"use client";

import { useState } from "react";
import { Truck, Droplets, TrendingUp, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { harvestOptions } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const icons = { "home-delivery": Truck, processed: Droplets, "sell-to-market": TrendingUp };

export function HarvestPreference() {
  const [selected, setSelected] = useState("home-delivery");

  return (
    <Card className="p-6">
      <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
        Harvest Preference
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Choose how you&apos;d like to receive your next harvest.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {harvestOptions.map((opt) => {
          const Icon = icons[opt.id as keyof typeof icons];
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-[var(--radius-sm)] border p-4 text-left transition-colors",
                active
                  ? "border-[var(--color-green)] bg-[var(--color-green-soft)]"
                  : "border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/25"
              )}
            >
              {active && (
                <Check className="absolute right-3 top-3 h-4 w-4 text-[var(--color-green-deep)]" />
              )}
              <Icon className="h-5 w-5 text-[var(--color-green-deep)]" />
              <p className="text-sm font-medium">{opt.title}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">{opt.tagline}</p>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-[var(--color-ink-soft)]">
        {harvestOptions.find((o) => o.id === selected)?.note}
      </p>
    </Card>
  );
}
