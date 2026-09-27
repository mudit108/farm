/**
 * Date helpers for the member dashboard's season views (Overview journey,
 * Farm Activity crop cycle). All dates are plain YYYY-MM-DD strings in
 * India time, as stored in khet_club_season.
 */

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** "5 Nov" / "5 November 2026" for a YYYY-MM-DD date, without a timezone-dependent parse. */
export function formatDay(isoDate: string, style: "short" | "long" = "short"): string {
  return new Date(`${isoDate}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: style === "short" ? "short" : "long",
    ...(style === "long" ? { year: "numeric" } : {}),
    timeZone: "Asia/Kolkata",
  });
}

// Where each stage roughly begins, as a share of the sowing → harvest span.
// Matches the stage copy in lib/site-content.ts: germination in the first
// one to two weeks, tillering from about week three, flowering around the
// middle, grain filling in the final weeks, harvest around day 140.
const STAGE_START: Record<string, number> = {
  Sowing: 0,
  Germination: 0.05,
  Tillering: 0.15,
  Flowering: 0.5,
  "Grain Filling": 0.71,
  Harvest: 1,
};

/**
 * A short "when" label per stage: "until 5 Nov" for field preparation, the
 * real sowing date, "~" approximations in between, and "~15 Mar" for the
 * estimated harvest. Nulls when the season dates aren't set yet.
 */
export function stageWhenLabels(stages: readonly string[], sowing: string | null, harvest: string | null): (string | null)[] {
  if (!sowing) return stages.map(() => null);
  const start = Date.parse(`${sowing}T00:00:00+05:30`);
  const end = harvest ? Date.parse(`${harvest}T00:00:00+05:30`) : null;
  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  return stages.map((stage) => {
    if (stage === "Field Preparation") return `until ${fmt(start)}`;
    if (stage === "Sowing") return fmt(start);
    const share = STAGE_START[stage];
    if (share === undefined || end === null) return null;
    return `~${fmt(start + (end - start) * share)}`;
  });
}
