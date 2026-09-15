import "server-only";
import { cache } from "react";
import { createAnonClient } from "@/lib/supabase/anon";
import { membershipPlans } from "@/lib/demo-data";

/**
 * Shared fetchers for public homepage data, wrapped in React's cache().
 *
 * WHY THIS EXISTS: the homepage and several of its child server
 * components were independently fetching the SAME data on every render.
 * `khet_club_all_plot_statuses` was fetched twice (page + plot grid),
 * `khet_club_plan_prices` twice (page + pricing section), and
 * getCurrentMember twice (page nav + plot grid) — and the child
 * components' fetches don't start until the page's own await resolves,
 * so the duplicates added latency on top rather than running alongside.
 *
 * cache() dedupes identical calls within a single server render pass:
 * the first caller does the round trip, every other caller gets the
 * same promise. Components keep fetching what they need locally (no
 * prop-drilling through five layers) without paying for it twice.
 *
 * IMPORTANT: this is per-request memoization, not caching across
 * requests. Every visitor still gets fresh live data — plot counts and
 * prices never go stale.
 */

export type PlotRow = { plot_number: number; status: "available" | "filled" };

export const getPlotStatuses = cache(async (): Promise<PlotRow[]> => {
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("khet_club_all_plot_statuses");
  if (error) {
    console.error("Failed to load khet_club_all_plot_statuses:", error.message);
    return [];
  }
  return (data ?? []) as PlotRow[];
});

export const getPlanPrices = cache(async (): Promise<Map<string, number>> => {
  const supabase = createAnonClient();
  const { data } = await supabase.from("khet_club_plan_prices").select("plan_id, price_inr");
  const rows = (data ?? []) as { plan_id: string; price_inr: number }[];
  return new Map(rows.map((r) => [r.plan_id, r.price_inr]));
});

export async function getLowestPrice(): Promise<number> {
  const prices = [...(await getPlanPrices()).values()].filter((n) => Number.isFinite(n));
  return prices.length > 0 ? Math.min(...prices) : membershipPlans[0].priceInr;
}

export async function getPlotCounts(): Promise<{ filled: number; total: number }> {
  const rows = await getPlotStatuses();
  return { filled: rows.filter((r) => r.status === "filled").length, total: rows.length };
}
