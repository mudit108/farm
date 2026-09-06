import { CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { PlanSelectionForm } from "@/components/dashboard/plan-selection-form";
import { PlotNicknameForm } from "@/components/dashboard/plot-nickname-form";
import { createSessionClient } from "@/lib/supabase/session";
import { summarizePlotHoldings } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

type MyPlot = {
  plot_number: number;
  status: "available" | "filled";
  plan_id: string | null;
  assigned_at: string | null;
  custom_name: string | null;
};
type GridPlot = { plot_number: number; status: "available" | "filled" };
type Season = { registration_deadline: string | null };
type PlanPrice = { plan_id: string; price_inr: number };

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
    supabase.from("khet_club_plan_prices").select("plan_id, price_inr"),
  ]);

  const myPlots = (plotsResult.data ?? []) as MyPlot[];
  const grid = (gridData ?? []) as GridPlot[];
  const prices = (pricesData ?? []) as PlanPrice[];
  const season = (seasonData as Season[] | null)?.[0] ?? null;
  const deadline = season?.registration_deadline ? new Date(season.registration_deadline) : null;
  const isOpen = !deadline || new Date() <= new Date(`${season!.registration_deadline}T23:59:59`);
  const holdings = summarizePlotHoldings(myPlots);

  return (
    <div>
      <PageHeader title="Select Plan" subtitle="Choose your plan and claim your plot(s) at Mera Khet." />

      <div className="p-6 sm:px-10">
        {myPlots.length > 0 && (
          <Card className="mb-8 max-w-lg p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--color-green-deep)]" />
            {myPlots[0].custom_name && (
              <p className="mt-3 font-display text-xl text-[var(--color-brown)]">{myPlots[0].custom_name}</p>
            )}
            <p className="mt-1 font-display text-2xl">
              {myPlots.length > 1 ? "Plots " : "Plot "}
              {myPlots.map((p) => `#${p.plot_number}`).join(", ")}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Badge tone="green">{myPlots[0].status}</Badge>
              {holdings.label && <Badge tone="brown">{holdings.label}</Badge>}
              {holdings.isMixedPlans && <Badge tone="gold">Multiple Purchases</Badge>}
            </div>
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
              {holdings.totalPlots} plot{holdings.totalPlots > 1 ? "s" : ""} total ·{" "}
              {holdings.areaSqFt.toLocaleString()} sq ft · {holdings.wheatMinKg}–{holdings.wheatMaxKg} kg wheat target
            </p>

            <div className="mt-5 border-t border-[var(--color-ink)]/10 pt-5 text-left">
              <PlotNicknameForm initialName={myPlots[0].custom_name ?? ""} />
            </div>
          </Card>
        )}

        {isOpen ? (
          <>
            <p className="mb-6 max-w-lg text-sm text-[var(--color-ink-soft)]">
              {myPlots.length > 0
                ? "Want more? You can add another plan before the registration deadline."
                : "Pick the plan that fits — you'll be assigned the next available plots automatically, or choose exactly which ones you want."}
            </p>
            {deadline && (
              <p className="mb-4 flex items-center gap-1.5 text-xs text-[var(--color-brown)]">
                <Clock className="h-3.5 w-3.5" />
                Registration closes {deadline.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            )}
            <PlanSelectionForm grid={grid} prices={prices} />
          </>
        ) : (
          <Card className="max-w-lg p-6 text-center">
            <p className="font-display text-lg">Registration closed</p>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              Registration for this season closed on{" "}
              {deadline?.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}.
              Contact us if you have questions.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
