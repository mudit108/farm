import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPin, PauseCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PlanSelectionForm } from "@/components/dashboard/plan-selection-form";
import { PlotNicknameForm } from "@/components/dashboard/plot-nickname-form";
import { createSessionClient } from "@/lib/supabase/session";
import { summarizePlotHoldings, todayInIndia } from "@/lib/demo-data";
import { isDeliverableCity, DELIVERY_ZONES_SENTENCE } from "@/lib/delivery-zones";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Select Plan | Mera Khet", robots: { index: false } };

type MyPlot = {
  plot_number: number;
  status: "available" | "filled";
  plan_id: string | null;
  assigned_at: string | null;
  custom_name: string | null;
};
type GridPlot = { plot_number: number; status: "available" | "filled" };
type Season = { registration_deadline: string | null; season_label: string; registrations_paused: boolean };
type PlanPrice = {
  plan_id: string;
  price_inr: number;
  strike_price_inr: number | null;
  offer_ends_at: string | null;
};

export default async function SelectPlotPage() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: seasonData }, plotsResult, { data: gridData }, { data: pricesData }] = await Promise.all([
    supabase.rpc("khet_club_get_season"),
    user
      ? supabase
          .from("khet_club_plots")
          .select("plot_number, status, plan_id, assigned_at, custom_name")
          .eq("user_id", user.id)
          .order("plot_number")
      : Promise.resolve({ data: [] as MyPlot[] }),
    supabase.rpc("khet_club_all_plot_statuses"),
    supabase.from("khet_club_plan_prices").select("plan_id, price_inr, strike_price_inr, offer_ends_at"),
  ]);

  const myPlots = (plotsResult.data ?? []) as MyPlot[];
  const grid = (gridData ?? []) as GridPlot[];
  const prices = (pricesData ?? []) as PlanPrice[];
  const season = (seasonData as Season[] | null)?.[0] ?? null;
  const deadline = season?.registration_deadline ? new Date(season.registration_deadline) : null;
  const paused = Boolean(season?.registrations_paused);
  const deadlinePassed = Boolean(season?.registration_deadline && todayInIndia() > season.registration_deadline);
  const isOpen = !paused && !deadlinePassed;
  const holdings = summarizePlotHoldings(myPlots);
  const userCity = (user?.user_metadata?.city as string | undefined) ?? "";
  const waitlisted = !isDeliverableCity(userCity);

  return (
    <div>
      <PageHeader
        eyebrow={season?.season_label ?? "Current Season"}
        title={myPlots.length > 0 ? "Add more plots" : "Select your plan"}
        subtitle="Choose your plan and claim your plot(s) at Mera Khet."
      />

      <div className="mk-page-pad">
        {myPlots.length > 0 && (
          <section className="mk-plot-hero mk-plot-hero-compact mb-8">
            <div className="mk-plot-hero-main">
              <p className="mk-plot-k">You hold</p>
              {myPlots[0].custom_name && <p className="mk-plot-name">“{myPlots[0].custom_name}”</p>}
              <p className="mk-plot-nums">
                {myPlots.length > 1 ? "Plots " : "Plot "}
                {myPlots.map((p) => `#${p.plot_number}`).join(", ")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="mk-plot-tag">{myPlots[0].status === "filled" ? "Reserved" : myPlots[0].status}</span>
                {holdings.label && <span className="mk-plot-tag">{holdings.label}</span>}
                {holdings.isMixedPlans && <span className="mk-plot-tag">Multiple purchases</span>}
              </div>
              <p className="mk-plot-meta mt-3">
                {holdings.totalPlots} plot{holdings.totalPlots > 1 ? "s" : ""} total · {holdings.areaSqFt.toLocaleString("en-IN")} sq ft ·{" "}
                {holdings.wheatMinKg}–{holdings.wheatMaxKg} kg wheat target
              </p>
            </div>
            <div className="mk-plot-hero-side">
              <PlotNicknameForm initialName={myPlots[0].custom_name ?? ""} />
            </div>
          </section>
        )}

        {waitlisted ? (
          <div className="mk-empty">
            <span className="mk-empty-icon" aria-hidden="true">
              <MapPin className="h-6 w-6" />
            </span>
            <h2>You&apos;re on the waitlist{userCity ? ` for ${userCity}` : ""}</h2>
            <p>
              This season we deliver in {DELIVERY_ZONES_SENTENCE}. We&apos;re growing and coming soon to more cities — your account is
              ready, and we&apos;ll tell you as soon as we open in yours.
            </p>
            <p>
              If your harvest should go to an address in one of these cities (for example, family there), change your delivery city on the{" "}
              <Link href="/dashboard/account" className="underline">Account page</Link>.
            </p>
          </div>
        ) : isOpen ? (
          <>
            <p className="mb-6 max-w-lg text-sm text-[var(--color-ink-soft)]">
              {myPlots.length > 0
                ? "Want more? You can add another plan before the registration deadline."
                : "Pick the plan that fits — you'll be assigned the next available plots automatically, or choose exactly which ones you want."}
            </p>
            {deadline && (
              <p className="mk-deadline">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Registration closes {deadline.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}
              </p>
            )}
            <PlanSelectionForm
              grid={grid}
              prices={prices}
              seasonLabel={season?.season_label ?? "Current Season"}
              initialCode={myPlots.length === 0 ? ((user?.user_metadata?.referred_by_code as string) ?? "") : ""}
            />
          </>
        ) : (
          <div className="mk-empty">
            <span className="mk-empty-icon" aria-hidden="true">
              <PauseCircle className="h-6 w-6" />
            </span>
            <h2>{paused ? "Bookings are paused" : "Registration closed"}</h2>
            <p>
              {paused ? (
                <>New bookings are paused for a short while. Please check back soon, or contact us if you have questions.</>
              ) : (
                <>
                  Registration for this season closed on{" "}
                  {deadline?.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}.
                  Contact us if you have questions.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
