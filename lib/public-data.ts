import "server-only";
import { cache } from "react";
import { createAnonClient } from "@/lib/supabase/anon";
import { membershipPlans, todayInIndia } from "@/lib/demo-data";

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

export type PlanOfferRow = {
  plan_id: string;
  price_inr: number;
  strike_price_inr: number | null;
  offer_ends_at: string | null;
};

/**
 * Live limited-time "was ₹X, now ₹Y" marketing offer per plan, admin-editable
 * from /admin/crops. `offer_ends_at` is a plain YYYY-MM-DD date (IST, same
 * convention as todayInIndia()) — the offer is active through the end of
 * that day and simply stops appearing after, no cleanup job needed.
 */
export const getPlanOffers = cache(async (): Promise<Map<string, PlanOfferRow>> => {
  const supabase = createAnonClient();
  const { data } = await supabase
    .from("khet_club_plan_prices")
    .select("plan_id, price_inr, strike_price_inr, offer_ends_at");
  const rows = (data ?? []) as PlanOfferRow[];
  return new Map(rows.map((r) => [r.plan_id, r]));
});

export async function getLowestPrice(): Promise<number> {
  const prices = [...(await getPlanPrices()).values()].filter((n) => Number.isFinite(n));
  return prices.length > 0 ? Math.min(...prices) : membershipPlans[0].priceInr;
}

export async function getPlotCounts(): Promise<{ filled: number; total: number }> {
  const rows = await getPlotStatuses();
  return { filled: rows.filter((r) => r.status === "filled").length, total: rows.length };
}

// ---------------------------------------------------------------------
// Added for the 2026 multi-page redesign. Same cache() pattern as above:
// every page and component can ask for these freely, and each Supabase
// round trip still happens once per request.
// ---------------------------------------------------------------------

export type SeasonPublicInfo = {
  contact_email: string | null;
  contact_phone: string | null;
  fff_collected_inr: number;
  current_stage: string;
  progress: number;
  sowing_date: string | null;
  estimated_harvest: string | null;
  registration_deadline: string | null;
  total_plots: number;
  warehouse_capacity_tonnes: number;
  season_label: string;
  registrations_paused: boolean;
};

export const getSeason = cache(async (): Promise<SeasonPublicInfo | null> => {
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("khet_club_get_season");
  if (error) {
    console.error("Failed to load khet_club_get_season:", error.message);
    return null;
  }
  return (data as SeasonPublicInfo[] | null)?.[0] ?? null;
});

export type PlanCard = (typeof membershipPlans)[number] & {
  /** Live, admin-editable price (falls back to the static file only if the DB is unreachable). */
  priceInr: number;
  /** Saving versus buying the same number of single plots. */
  savings: number;
  perPlotInr: number;
  /** "Was ₹X" marketing price, only set while the offer is live. Admin-editable from /admin/crops. */
  strikePriceInr: number | null;
  /** YYYY-MM-DD (IST) the offer runs through, only set while the offer is live. */
  offerEndsAt: string | null;
};

/** The three plans with live prices — the single source for every price shown on the public site. */
export const getPlanCards = cache(async (): Promise<PlanCard[]> => {
  const [prices, offers] = await Promise.all([getPlanPrices(), getPlanOffers()]);
  const base = (prices.get("1-plot") ?? membershipPlans[0].priceInr) / membershipPlans[0].plots;
  const today = todayInIndia();
  return membershipPlans.map((plan) => {
    const priceInr = prices.get(plan.id) ?? plan.priceInr;
    const offer = offers.get(plan.id);
    const offerActive =
      !!offer?.strike_price_inr &&
      offer.strike_price_inr > priceInr &&
      !!offer.offer_ends_at &&
      offer.offer_ends_at >= today;
    return {
      ...plan,
      priceInr,
      savings: Math.max(Math.round(base * plan.plots - priceInr), 0),
      perPlotInr: Math.round(priceInr / plan.plots),
      strikePriceInr: offerActive ? offer!.strike_price_inr : null,
      offerEndsAt: offerActive ? offer!.offer_ends_at : null,
    };
  });
});

export type FarmUpdate = { id: string; title: string; description: string; created_at: string };

export const getFarmUpdates = cache(async (limit = 5): Promise<FarmUpdate[]> => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("khet_club_updates")
    .select("id, title, description, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Failed to load khet_club_updates:", error.message);
    return [];
  }
  return (data ?? []) as FarmUpdate[];
});
