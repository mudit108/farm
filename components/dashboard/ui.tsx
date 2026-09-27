import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Building blocks for the member dashboard (2026-09 refresh). Presentation
 * only — no data access — so any member page can use them. Styles live in
 * app/member.css under "dashboard pieces".
 */

/** A paper card with an optional gold label (with icon) and a right-hand action. */
export function Panel({
  icon: Icon,
  label,
  action,
  className,
  children,
  id,
}: {
  icon?: LucideIcon;
  label?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn("mk-panel", className)}>
      {(label || action) && (
        <header className="mk-panel-head">
          {label && (
            <h2 className="mk-panel-label">
              {Icon && (
                <span className="mk-panel-icon" aria-hidden="true">
                  <Icon className="h-4 w-4" />
                </span>
              )}
              {label}
            </h2>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function ProgressBar({ value, tone = "gold", label }: { value: number; tone?: "gold" | "green"; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="mk-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-label={label}>
      <span className={`is-${tone}`} style={{ width: `${v}%` }} />
    </div>
  );
}

/** Label / value rows, e.g. plot facts. */
export function Facts({ items, className }: { items: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("mk-facts", className)}>
      {items.map((f) => (
        <div key={f.label}>
          <dt>{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The seven crop stages as a horizontal track: done stages are ticked, the
 * current one is ringed in gold, and a gold line fills up to it. On phones
 * the stage names collapse (they stay readable to screen readers) and the
 * page shows the current stage in words underneath.
 */
export function SeasonJourney({ stages, current, when }: { stages: readonly string[]; current: number; when: (string | null)[] }) {
  const n = stages.length;
  const fill = n > 1 && current > 0 ? (Math.min(current, n - 1) / (n - 1)) * ((n - 1) / n) * 100 : 0;
  return (
    <div className="mk-journey" style={{ "--n": n } as CSSProperties}>
      <span className="mk-journey-line" aria-hidden="true" />
      <span className="mk-journey-fill" style={{ width: `${fill}%` }} aria-hidden="true" />
      <ol>
        {stages.map((stage, i) => {
          const state = i < current ? "done" : i === current ? "current" : "upcoming";
          return (
            <li key={stage} className={`is-${state}`} aria-current={state === "current" ? "step" : undefined}>
              <span className="mk-journey-dot" aria-hidden="true">
                {state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="mk-journey-name">
                {stage}
                {state === "done" && <span className="sr-only"> (done)</span>}
                {state === "current" && <span className="sr-only"> (current stage)</span>}
              </span>
              {when[i] && <span className="mk-journey-when">{when[i]}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

type GridPlot = { plot_number: number; status: "available" | "filled" };

/** The 80-plot farm grid with the member's own plots in gold. */
export function PlotMap({ grid, mine, size = "sm" }: { grid: GridPlot[]; mine: number[]; size?: "sm" | "lg" }) {
  const own = new Set(mine);
  return (
    <div
      className={`mk-map mk-map-${size}`}
      role="img"
      aria-label={mine.length ? `Farm map — your plots: ${mine.map((n) => `#${n}`).join(", ")}` : "Farm map"}
    >
      {grid.map((p) => {
        const isMine = own.has(p.plot_number);
        return (
          <span
            key={p.plot_number}
            className={isMine ? "is-mine" : p.status === "filled" ? "is-taken" : undefined}
            title={`Plot #${p.plot_number}${isMine ? " — yours" : p.status === "filled" ? " — reserved" : " — available"}`}
          >
            {size === "lg" || isMine ? p.plot_number : null}
          </span>
        );
      })}
    </div>
  );
}

export function PlotMapLegend() {
  return (
    <p className="mk-map-legend">
      <span>
        <i className="is-mine" /> Yours
      </span>
      <span>
        <i className="is-taken" /> Other members
      </span>
      <span>
        <i /> Available
      </span>
    </p>
  );
}
