"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import type { demoCrops } from "@/lib/demo-data";

type Crop = (typeof demoCrops)[number];

export function CropCycleModal({
  crop,
  onClose,
}: {
  crop: Crop | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!crop) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--color-ink)]/40 p-0 sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-[var(--radius-card)] bg-[var(--color-surface)] p-6 sm:rounded-[var(--radius-card)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${crop.name} crop cycle`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
              {crop.season}
            </p>
            <h3 className="mt-1 font-display text-2xl uppercase tracking-tight">
              {crop.name}
            </h3>
            <p className="text-sm text-[var(--color-ink-soft)]">{crop.localName}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-[var(--color-ink)]/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <ol className="mt-6 space-y-0">
          {crop.stages.map((stage, i) => (
            <li key={stage} className="relative flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono-data text-[10px] font-semibold ${
                    i === 0
                      ? "bg-[var(--color-green)] text-white"
                      : "bg-[var(--color-green-soft)] text-[var(--color-green-deep)]"
                  }`}
                >
                  {i + 1}
                </span>
                {i < crop.stages.length - 1 && (
                  <span className="mt-1 w-px flex-1 bg-[var(--color-ink)]/10" />
                )}
              </div>
              <p className="pt-0.5 text-sm font-medium">{stage}</p>
            </li>
          ))}
        </ol>

        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
          Typical cycle length: ~{crop.durationDays} days, weather and field
          conditions permitting.
        </p>
        {crop.processedProduct && (
          <p className="mt-3 rounded-[var(--radius-sm)] bg-[var(--color-green-soft)] px-3 py-2 text-xs text-[var(--color-green-deep)]">
            Can be processed into <strong>{crop.processedProduct}</strong> as a harvest option.
          </p>
        )}
      </div>
    </div>
  );
}
