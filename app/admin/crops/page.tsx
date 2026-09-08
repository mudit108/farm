import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { currentCrop, membershipPlans } from "@/lib/demo-data";
import { createServiceClient } from "@/lib/supabase/service";
import { adminUpdateSeason, adminUpdateContactInfo, adminUpdatePlanPrices, adminUpdateWarehouseCapacity, adminUpdateHarvestDistribution } from "@/app/actions/admin-content";
import { ResizeFarmForm } from "@/components/admin/resize-farm-form";
import { CloseSeasonForm } from "@/components/admin/close-season-form";

export const dynamic = "force-dynamic";

type Season = {
  current_stage: string;
  progress: number;
  health: string;
  sowing_date: string | null;
  estimated_harvest: string | null;
  registration_deadline: string | null;
  total_plots: number;
  contact_email: string | null;
  contact_phone: string | null;
  warehouse_capacity_tonnes: number;
};
type PlanPrice = { plan_id: string; price_inr: number };
type ArchivedSeason = {
  id: string;
  season_label: string;
  crop_name: string;
  plots_filled: number;
  members_count: number;
  revenue_inr: number;
  fff_collected_inr: number;
  closed_at: string;
};

export default async function CropsManagementPage() {
  const supabase = createServiceClient();
  const [{ data }, { count: filledCount }, { data: pricesData }, { data: labelRow }, { data: archiveData }] =
    await Promise.all([
      supabase.rpc("khet_club_get_season"),
      supabase.from("khet_club_plots").select("plot_number", { count: "exact", head: true }).eq("status", "filled"),
      supabase.from("khet_club_plan_prices").select("plan_id, price_inr"),
      // season_label isn't part of khet_club_get_season()'s return shape,
      // so it's read directly here rather than widening the public RPC.
      supabase.from("khet_club_season").select("season_label, harvest_distribution_model, harvest_deduction_percent").eq("id", 1).maybeSingle(),
      supabase
        .from("khet_club_season_archive")
        .select("id, season_label, crop_name, plots_filled, members_count, revenue_inr, fff_collected_inr, closed_at")
        .order("closed_at", { ascending: false }),
    ]);
  const season = (data as Season[] | null)?.[0] ?? null;
  const currentSeasonLabel = labelRow?.season_label ?? "Current Season";
  const distributionModel = labelRow?.harvest_distribution_model ?? "pooled";
  const deductionPercent = Number(labelRow?.harvest_deduction_percent ?? 0);
  const pastSeasons = (archiveData ?? []) as ArchivedSeason[];
  const pricesByPlan = new Map(((pricesData ?? []) as PlanPrice[]).map((p) => [p.plan_id, p.price_inr]));
  const basePricePerPlot = (pricesByPlan.get("1-plot") ?? membershipPlans[0].priceInr) / membershipPlans[0].plots;

  return (
    <div>
      <PageHeader title="Crops & Season" subtitle="Mera Khet currently grows one crop per season." />

      <div className="p-6 sm:px-10">
        <Card className="max-w-md p-5">
          <p className="font-display text-lg uppercase">{currentCrop.name}</p>
          <p className="text-xs text-[var(--color-ink-soft)]">{currentCrop.localName} · {currentCrop.season}</p>
          <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
            {currentCrop.stages.length} stages · ~{currentCrop.durationDays} days
          </p>
        </Card>

        <Card className="mt-6 max-w-lg p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Farm Size
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Total plots across the whole farm — changes here update the
            grid everywhere: the homepage, plot selection, and every
            admin page.
          </p>
          <div className="mt-3">
            <ResizeFarmForm currentTotal={season?.total_plots ?? 80} filledCount={filledCount ?? 0} />
          </div>
        </Card>

        <Card className="mt-6 max-w-lg p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Plan Pricing
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            This is the actual price charged at checkout — not just a
            display number. Changes apply to the very next purchase,
            everywhere prices are shown.
          </p>
          <form action={adminUpdatePlanPrices} className="mt-4 space-y-4">
            {membershipPlans.map((plan) => {
              const currentPrice = pricesByPlan.get(plan.id) ?? plan.priceInr;
              const linearPrice = basePricePerPlot * plan.plots;
              const savings = Math.max(Math.round(linearPrice - currentPrice), 0);
              return (
                <label key={plan.id} className="block">
                  <span className="mb-1.5 flex items-center justify-between text-sm font-medium">
                    <span>{plan.name} ({plan.label})</span>
                    {plan.id !== "1-plot" && savings > 0 && (
                      <span className="text-xs font-normal text-[var(--color-green-deep)]">
                        Saves ₹{savings.toLocaleString("en-IN")} vs. per-plot rate
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--color-ink-soft)]">₹</span>
                    <input
                      name={`price_${plan.id}`}
                      type="number"
                      min={1}
                      step={1}
                      defaultValue={currentPrice}
                      className="input"
                    />
                  </div>
                </label>
              );
            })}
            <Button type="submit" className="w-full">Save Prices</Button>
          </form>
        </Card>

        <Card className="mt-6 max-w-lg p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Harvest Distribution
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            How the harvest is divided among members. This is described in
            the Terms of Service and Membership Agreement — those pages
            update automatically to match whatever you set here, so the
            legal text never describes a model you&apos;re not actually
            using.
          </p>
          <form action={adminUpdateHarvestDistribution} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Distribution model</span>
              <select name="harvestDistributionModel" defaultValue={distributionModel} className="input">
                <option value="pooled">Pooled — total farm harvest ÷ total plots, equal share per plot</option>
                <option value="per_plot">Per-plot — each member receives their own plots&apos; actual output</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Deduction before distribution (%)</span>
              <input
                name="harvestDeductionPercent"
                type="number"
                min={0}
                max={100}
                step={0.01}
                defaultValue={deductionPercent}
                className="input"
              />
              <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">
                Any portion retained before dividing (e.g. seed stock for
                next season, wastage allowance). Leave at 0 if the full
                harvest is distributed. This figure appears in the legal
                documents.
              </span>
            </label>
            <Button type="submit" className="w-full">Save Distribution Settings</Button>
          </form>
        </Card>

        <Card className="mt-6 max-w-lg p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Warehouse Capacity
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Stated publicly on the homepage (harvest process, FAQ, and plan
            inclusions). Update this if the real facility changes, so the
            site never claims a capacity you don&apos;t have.
          </p>
          <form action={adminUpdateWarehouseCapacity} className="mt-4 flex items-end gap-3">
            <label className="block flex-1">
              <span className="mb-1.5 block text-sm font-medium">Capacity (tonnes)</span>
              <input
                name="warehouseCapacityTonnes"
                type="number"
                min={1}
                step={1}
                defaultValue={season?.warehouse_capacity_tonnes ?? 30}
                className="input"
              />
            </label>
            <Button type="submit">Save</Button>
          </form>
        </Card>

        <Card className="mt-6 max-w-lg p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Public Contact Info
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Shown in the site footer and used for the WhatsApp Us button —
            change it here any time, no redeploy needed.
          </p>
          <form action={adminUpdateContactInfo} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Contact email</span>
              <input name="contactEmail" type="email" defaultValue={season?.contact_email ?? ""} className="input" placeholder="hello@example.com" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Contact phone / WhatsApp</span>
              <input name="contactPhone" type="tel" defaultValue={season?.contact_phone ?? ""} className="input" placeholder="10-digit number" />
              <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">
                Used to build the WhatsApp link too — a plain 10-digit Indian number works fine.
              </span>
            </label>
            <Button type="submit" className="w-full">Save Contact Info</Button>
          </form>
        </Card>

        <Card className="mt-6 max-w-lg p-6">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Season State — shown to every customer
          </p>
          <form action={adminUpdateSeason} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Current stage</span>
              <select name="currentStage" defaultValue={season?.current_stage} className="input">
                {currentCrop.stages.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Progress (%)</span>
              <input name="progress" type="number" min={0} max={100} defaultValue={season?.progress ?? 0} className="input" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Farm health</span>
              <input name="health" defaultValue={season?.health ?? ""} className="input" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Sowing date</span>
              <input name="sowingDate" type="date" defaultValue={season?.sowing_date ?? ""} className="input" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Estimated harvest</span>
              <input name="estimatedHarvest" type="date" defaultValue={season?.estimated_harvest ?? ""} className="input" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Registration deadline</span>
              <input name="registrationDeadline" type="date" defaultValue={season?.registration_deadline ?? ""} className="input" />
              <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">
                Last day customers can buy a plan or add more plots. Leave blank for no deadline.
              </span>
            </label>
            <Button type="submit" className="w-full">Update Season</Button>
          </form>
        </Card>

        <Card className="mt-6 max-w-lg p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Season Rollover
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Currently running: <strong className="text-[var(--color-ink)]">{currentSeasonLabel}</strong>.
            Close it when the harvest is complete and you&apos;re ready to sell the next season.
          </p>
          <div className="mt-4">
            <CloseSeasonForm currentLabel={currentSeasonLabel} filledPlots={filledCount ?? 0} />
          </div>
        </Card>

        {pastSeasons.length > 0 && (
          <Card className="mt-6 max-w-lg p-5">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Past Seasons
            </p>
            <div className="mt-3 space-y-3">
              {pastSeasons.map((s) => (
                <div key={s.id} className="border-t border-[var(--color-ink)]/10 pt-3 text-sm first:border-t-0 first:pt-0">
                  <p className="font-medium">{s.season_label}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
                    {s.crop_name} · {s.plots_filled} plots · {s.members_count} member
                    {s.members_count === 1 ? "" : "s"} · ₹{s.revenue_inr.toLocaleString("en-IN")} revenue
                    {s.fff_collected_inr > 0 && ` · ₹${s.fff_collected_inr.toLocaleString("en-IN")} to Feeding Families`}
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    Closed {new Date(s.closed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
