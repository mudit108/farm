import { demoPlots, demoPlot } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function PlotMap({
  highlight = demoPlot.plotIds,
  compact = false,
}: {
  highlight?: string[];
  compact?: boolean;
}) {
  const lastHighlighted = highlight[highlight.length - 1];

  return (
    <div>
      <div
        className={cn(
          "field-rows rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-green-soft)] p-4",
          "grid grid-cols-6 gap-2",
          !compact && "sm:p-6"
        )}
        role="img"
        aria-label={`Farm plot map, ${highlight.length} plot${highlight.length > 1 ? "s" : ""} highlighted`}
      >
        {demoPlots.map((p) => {
          const isMine = highlight.includes(p.id);
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-lg text-[9px] font-mono-data transition-transform",
                isMine
                  ? "scale-105 bg-[var(--color-green)] text-white shadow-md"
                  : p.status === "active"
                  ? "bg-white/70 text-[var(--color-ink-soft)]"
                  : "bg-white/30 text-[var(--color-ink-soft)]/60 border border-dashed border-[var(--color-ink)]/15"
              )}
            >
              {isMine && p.id === lastHighlighted && (
                <span className="live-dot absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[var(--color-live)]" />
              )}
              <span className="font-semibold">{p.id}</span>
            </div>
          );
        })}
      </div>
      {!compact && (
        <p className="mt-3 text-center text-xs text-[var(--color-ink-soft)]">
          {highlight.length} plot{highlight.length > 1 ? "s" : ""} highlighted
          · 1 plot = 7,260 sq ft (⅙ acre)
        </p>
      )}
    </div>
  );
}
