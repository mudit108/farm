import { PageHeader } from "@/components/dashboard/page-header";
import { ActionForm } from "@/components/admin/action-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { currentCrop, membershipPlans } from "@/lib/demo-data";
import { createServiceClient } from "@/lib/supabase/service";
import { adminUpdateSeason, adminUpdateContactInfo, adminUpdatePlanPrices, adminUpdateWarehouseCapacity, adminUpdateHarvestDistribution, adminSetRegistrationsPaused } from "@/app/actions/admin-content";
import { adminCreateDiscountCode, adminToggleDiscountCode } from "@/app/actions/admin-discounts";
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
  registrations_paused: boolean;
};
type PlanPrice = {
  plan_id: string;
  price_inr: number;
  strike_price_inr: number | null;
  offer_ends_at: string | null;
};
type DiscountCode = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  is_active: boolean;
  note: string | null;
};
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
  const [{ data }, { count: filledCount }, { data: pricesData }, { data: labelRow }, { data: codesData }, { data: archiveData }] =
    await Promise.all([
      supabase.rpc("khet_club_get_season"),
      supabase.from("khet_club_plots").select("plot_number", { count: "exact", head: true }).eq("status", "filled"),
      supabase.from("khet_club_plan_prices").select("plan_id, price_inr, strike_price_inr, offer_ends_at"),
      // season_label isn't part of khet_club_get_season()'s return shape,
      // so it's read directly here rather than widening the public RPC.
      supabase.from("khet_club_season").select("season_label, harvest_distribution_model, harvest_deduction_percent").eq("id", 1).maybeSingle(),
      supabase
        .from("khet_club_discount_codes")
        .select("id, code, discount_type, discount_value, max_uses, times_used, expires_at, is_active, note")
        .order("created_at", { ascending: false }),
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
  const discountCodes = (codesData ?? []) as DiscountCode[];
  const planPriceRows = new Map(((pricesData ?? []) as PlanPrice[]).map((p) => [p.plan_id, p]));
  const pricesByPlan = new Map(Array.from(planPriceRows, ([id, p]) => [id, p.price_inr] as const));
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
          <ActionForm action={adminUpdatePlanPrices} className="mt-4 space-y-5">
            {membershipPlans.map((plan) => {
              const currentPrice = pricesByPlan.get(plan.id) ?? plan.priceInr;
              const linearPrice = basePricePerPlot * plan.plots;
              const savings = Math.max(Math.round(linearPrice - currentPrice), 0);
              const offerRow = planPriceRows.get(plan.id);
              return (
                <div key={plan.id} className="border-b border-[var(--color-ink)]/10 pb-4 last:border-0 last:pb-0">
                  <label className="block">
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

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">
                        Was-price (strike-through, optional)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-[var(--color-ink-soft)]">₹</span>
                        <input
                          name={`strike_${plan.id}`}
                          type="number"
                          min={1}
                          step={1}
                          placeholder="e.g. 30000"
                          defaultValue={offerRow?.strike_price_inr ?? ""}
                          className="input"
                        />
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Offer valid till</span>
                      <input
                        name={`offerEnds_${plan.id}`}
                        type="date"
                        defaultValue={offerRow?.offer_ends_at ?? ""}
                        className="input"
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--color-ink-soft)]">
                    Leave the was-price blank to remove the offer. It only shows on the
                    site while today is on or before the date above — no need to come
                    back and clear it.
                  </p>
                </div>
              );
            })}
            <Button type="submit" className="w-full">Save Prices</Button>
          </ActionForm>
        </Card>

        <Card className="mt-6 max-w-lg p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Discount Codes
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Codes are checked and priced on the server — the amount charged
            can&apos;t be altered from the browser. A code only counts as
            used once a payment actually succeeds, so abandoned checkouts
            don&apos;t burn uses.
          </p>

          <ActionForm action={adminCreateDiscountCode} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Code</span>
                <input name="code" required placeholder="FRIEND50" className="input uppercase" autoComplete="off" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Type</span>
                <select name="discountType" className="input" defaultValue="percent">
                  <option value="percent">Percent off (%)</option>
                  <option value="fixed">Fixed amount off (₹)</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Value</span>
                <input name="discountValue" required type="number" min={1} step={1} placeholder="50" className="input" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Max uses</span>
                <input name="maxUses" type="number" min={1} step={1} placeholder="Unlimited" className="input" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Expires (optional)</span>
                <input name="expiresAt" type="date" className="input" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Note</span>
                <input name="note" placeholder="e.g. for Rahul" className="input" />
              </label>
            </div>
            <Button type="submit" className="w-full">Create Code</Button>
          </ActionForm>

          {discountCodes.length > 0 && (
            <div className="mt-5 space-y-2 border-t border-[var(--color-ink)]/10 pt-4">
              {discountCodes.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <span className="font-mono-data font-medium">{c.code}</span>
                    <span className="ml-2 text-xs text-[var(--color-ink-soft)]">
                      {c.discount_type === "percent" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                      {" · "}
                      {c.times_used}
                      {c.max_uses ? `/${c.max_uses}` : ""} used
                      {c.expires_at && ` · expires ${new Date(c.expires_at).toLocaleDateString("en-IN")}`}
                      {c.note && ` · ${c.note}`}
                    </span>
                  </div>
                  <ActionForm action={adminToggleDiscountCode}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="makeActive" value={c.is_active ? "false" : "true"} />
                    <button className={`text-xs font-medium hover:underline ${c.is_active ? "text-[var(--color-live)]" : "text-[var(--color-green)]"}`}>
                      {c.is_active ? "Deactivate" : "Reactivate"}
                    </button>
                  </ActionForm>
                </div>
              ))}
            </div>
          )}
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
          <ActionForm action={adminUpdateHarvestDistribution} className="mt-4 space-y-4">
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
          </ActionForm>
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
          <ActionForm action={adminUpdateWarehouseCapacity} className="mt-4 flex items-end gap-3">
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
          </ActionForm>
        </Card>

        <Card className="mt-6 max-w-lg p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Public Contact Info
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Shown in the site footer and used for the WhatsApp Us button —
            change it here any time, no redeploy needed.
          </p>
          <ActionForm action={adminUpdateContactInfo} className="mt-4 space-y-4">
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
          </ActionForm>
        </Card>

        <Card className="mt-6 max-w-lg p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                New Bookings
              </p>
              <p className="mt-2 text-sm">
                {season?.registrations_paused ? (
                  <span className="font-medium text-[var(--color-live)]">
                    Paused — nobody can reserve a plot right now.
                  </span>
                ) : (
                  <span className="font-medium text-[var(--color-green-deep)]">
                    Open — customers can reserve plots normally.
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                Existing members and their dashboards are never affected — this
                only blocks new plot reservations.
              </p>
            </div>
            <ActionForm action={adminSetRegistrationsPaused}>
              <input type="hidden" name="paused" value={season?.registrations_paused ? "false" : "true"} />
              <Button
                type="submit"
                variant={season?.registrations_paused ? "primary" : "outline"}
                size="sm"
              >
                {season?.registrations_paused ? "Resume Bookings" : "Pause Bookings"}
              </Button>
            </ActionForm>
          </div>
        </Card>

        <Card className="mt-6 max-w-lg p-6">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Season State — shown to every customer
          </p>
          <ActionForm action={adminUpdateSeason} className="mt-4 space-y-4">
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
          </ActionForm>
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
