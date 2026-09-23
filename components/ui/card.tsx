import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-surface)]",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "green",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "green" | "brown" | "live" | "gold";
}) {
  const tones: Record<string, string> = {
    green: "bg-[var(--color-green-soft)] text-[var(--color-green-deep)]",
    brown: "bg-[var(--color-brown-soft)] text-[var(--color-brown)]",
    live: "bg-[var(--color-live)]/10 text-[var(--color-live)]",
    gold: "bg-[var(--color-gold)]/15 text-[var(--color-brown)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill,9999px)] px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
