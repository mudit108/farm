import Link from "next/link";
import { ClipboardCheck, Download, Clock, Heart, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlotNicknameForm } from "@/components/dashboard/plot-nickname-form";
import { HarvestPreference } from "@/components/dashboard/harvest-preference";
import { BalancePaymentCard } from "@/components/dashboard/balance-payment-card";
import { createSessionClient } from "@/lib/supabase/session";
import { getMyInstallmentPlan } from "@/app/actions/payment";
import {
  membershipPlans,
  summarizePlotHoldings,
  FEEDING_FAMILIES_PER_PLOT,
  balanceLateFeeInr,
  balanceStage,
  todayInIndia,
} from "@/lib/demo-data";

export const dynamic = "force-dynamic";

type MyPlot = {
  plot_number: number;
  status: "available" | "filled";
  full_name: string | null;
  plan_id: string | null;
  assigned_at: string | null;
  custom_name: string | null;
  claim_batch_id: string | null;
  approved_at: string | null;
};
type Cert = { claim_batch_id: string; certificate_number: string };
type Payment = { id: string; plan_id: string; amount: number; status: string; created_at: string; claim_batch_id: string | null };
type Receipt = { claim_batch_id: string; receipt_number: string };
type Delivery = { id: string; kg_delivered: number; delivered_at: string; notes: string | null };

export default async function MyFarmPage() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Season label and sowing date are admin-editable (season rollover,
  // /admin/crops) — reading them live avoids repeating the hardcoded
  // "Wheat Season 2026-27" / "Near Diwali 2026" strings this page used
  // to have, which would have gone stale after the first rollover.
  const { data: seasonRow } = await supabase.rpc("khet_club_get_season");
  const season = (seasonRow as { season_label: string; sowing_date: string | null }[] | null)?.[0];
  const seasonLabel = season?.season_label ?? "Current Season";
  const sowingLabel = season?.sowing_date
    ? new Date(season.sowing_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "Near Diwali";

  let myPlots: MyPlot[] = [];
  let certsByBatch = new Map<string, Cert>();
  let payments: Payment[] = [];
  let receiptsByBatch = new Map<string, Receipt>();
  let confirmedTotalKg: number | null = null;
  let deliveries: Delivery[] = [];
  let installmentPlan: Awaited<ReturnType<typeof getMyInstallmentPlan>> = null;

  if (user) {
    const [{ data }, { data: certData }, { data: paymentsData }, { data: receiptsData }, { data: prefData }, { data: deliveriesData }] =
      await Promise.all([
        supabase
          .from("khet_club_plots")
          .select("plot_number, status, full_name, plan_id, assigned_at, custom_name, claim_batch_id, approved_at")
          .eq("user_id", user.id)
          .order("plot_number"),
        supabase.from("khet_club_certificates").select("claim_batch_id, certificate_number").eq("user_id", user.id),
        supabase
          .from("khet_club_payments")
          .select("id, plan_id, amount, status, created_at, claim_batch_id")
          .order("created_at", { ascending: false }),
        supabase.from("khet_club_receipts").select("claim_batch_id, receipt_number").eq("user_id", user.id),
        supabase
          .from("khet_club_harvest_preferences")
          .select("confirmed_total_kg")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("khet_club_harvest_deliveries")
          .select("id, kg_delivered, delivered_at, notes")
          .eq("user_id", user.id)
          .is("voided_at", null)
          .order("delivered_at", { ascending: false }),
      ]);
    myPlots = (data ?? []) as MyPlot[];
    certsByBatch = new Map((certData ?? []).map((c) => [c.claim_batch_id, c as Cert]));
    payments = (paymentsData ?? []) as Payment[];
    receiptsByBatch = new Map((receiptsData ?? []).map((r) => [r.claim_batch_id, r as Receipt]));
    confirmedTotalKg = prefData?.confirmed_total_kg ?? null;
    deliveries = (deliveriesData ?? []) as Delivery[];
    // Own read, RLS-scoped — safe to call directly rather than fold
    // into the Promise.all above, since it does its own session lookup.
    installmentPlan = await getMyInstallmentPlan();
  }

  const holdings = summarizePlotHoldings(myPlots);
  const batchIds = Array.from(new Set(myPlots.map((p) => p.claim_batch_id).filter(Boolean))) as string[];
  const plotList = myPlots.map((p) => `#${p.plot_number}`).join(", ");
  const totalPaidPaise = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const totalDelivered = deliveries.reduce((sum, d) => sum + d.kg_delivered, 0);
  const deliveryProgressPct = confirmedTotalKg ? Math.min((totalDelivered / confirmedTotalKg) * 100, 100) : 0;

  if (myPlots.length === 0) {
    return (
      <div>
        <PageHeader title="My Farm" subtitle="Your plot, plan, and everything that comes with it." />
        <div className="p-6 sm:px-10">
          <Card className="max-w-lg p-6">
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <ClipboardCheck className="h-8 w-8 text-[var(--color-brown)]" />
              <p className="font-display text-lg">No plan selected yet</p>
              <p className="max-w-xs text-sm text-[var(--color-ink-soft)]">
                Choose a plan to see your plot, certificate, and everything else here.
              </p>
              <Link href="/dashboard/select-plot">
                <Button className="mt-2">Select Your Plan</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const now = new Date();

  return (
    <div>
      <PageHeader title="My Farm" subtitle="Your plot, plan, and everything that comes with it." />

      {installmentPlan && (
        <div className="px-6 pt-6 sm:px-10">
          <BalancePaymentCard
            plan={installmentPlan}
            status={balanceStage(installmentPlan.balance_due_date, todayInIndia(now))}
            lateFeeInr={balanceLateFeeInr(installmentPlan.plan_id)}
          />
        </div>
      )}

      <div className="grid gap-6 p-6 sm:px-10 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              {myPlots[0].custom_name && (
                <p className="font-display text-lg text-[var(--color-brown)]">{myPlots[0].custom_name}</p>
              )}
              <p className="font-display text-2xl">{plotList}</p>
              <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">
                {holdings.label}
                {holdings.isMixedPlans ? " (multiple purchases)" : ""} — {seasonLabel}
              </p>
            </div>
            <Badge tone="green">{myPlots[0].status}</Badge>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Registered to</dt>
              <dd className="font-medium">{myPlots[0].full_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Area</dt>
              <dd className="font-medium">{holdings.areaSqFt.toLocaleString()} sq ft</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Wheat target</dt>
              <dd className="font-medium">{holdings.wheatMinKg}–{holdings.wheatMaxKg} kg</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Total paid</dt>
              <dd className="font-medium">₹{(totalPaidPaise / 100).toLocaleString("en-IN")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Crop</dt>
              <dd className="font-medium">Gehu (Wheat)</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Season starts</dt>
              <dd className="font-medium">{sowingLabel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">First assigned</dt>
              <dd className="font-medium">
                {myPlots[0].assigned_at ? new Date(myPlots[0].assigned_at).toLocaleDateString("en-IN") : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded-[var(--radius-sm)] border border-[var(--color-green)]/20 bg-[var(--color-green-soft)]/40 p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--color-green-deep)]" />
              <p className="text-sm font-medium text-[var(--color-green-deep)]">
                Everyone shares the season fairly
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-soft)]">
              {plotList} {myPlots.length === 1 ? "is yours" : "are yours"} to
              follow, visit and watch through the season. When harvest comes,
              the whole farm&apos;s wheat is brought together and divided
              equally across every plot — so your share never depends on
              whether your particular corner of the field did better or worse
              than the rest. No farmer among us carries a bad patch alone, and
              nobody quietly gains from someone else&apos;s. One farm, one
              season, shared honestly.
            </p>
          </div>

          <p className="mt-4 text-xs text-[var(--color-ink-soft)]">
            Only seasonal plans are offered — this membership covers the
            upcoming wheat season only. Wheat target is an estimate, not a
            guarantee.
          </p>
          <Link href="/dashboard/select-plot">
            <Button variant="outline" className="mt-4 w-full">Add More Plots</Button>
          </Link>

          <div className="mt-6 border-t border-[var(--color-ink)]/10 pt-5">
            <PlotNicknameForm initialName={myPlots[0].custom_name ?? ""} />
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-[var(--color-brown)]" />
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                Your Feeding Families Impact
              </p>
            </div>
            <div className="mt-3 flex items-baseline gap-6">
              <div>
                <p className="font-display text-2xl">
                  ₹{(myPlots.length * FEEDING_FAMILIES_PER_PLOT).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-[var(--color-ink-soft)]">Contributed by you</p>
              </div>
              <div>
                <p className="font-display text-2xl">
                  {Math.round((myPlots.length * FEEDING_FAMILIES_PER_PLOT) / 1000 * 2)}
                </p>
                <p className="text-xs text-[var(--color-ink-soft)]">Families fed</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--color-ink-soft)]">
              ₹1,000 from each of your {myPlots.length} plot{myPlots.length === 1 ? "" : "s"} — included in
              your membership price, not an extra charge.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-[var(--color-brown)]" />
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                Share Your Story
              </p>
            </div>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              A shareable card with your name, plot, and impact — ready for WhatsApp
              Status or Instagram Stories.
            </p>
            <a href="/api/story-card" download>
              <Button variant="outline" className="mt-4 w-full">
                Download Your Story Card
              </Button>
            </a>
            <p className="mt-2 text-center text-xs text-[var(--color-ink-soft)]">#MyMeraKhet</p>
          </Card>

          <Card className="p-6">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Membership Certificate{batchIds.length > 1 ? "s" : ""}
            </p>
            <div className="mt-3 space-y-2">
              {batchIds.map((batchId) => {
                const cert = certsByBatch.get(batchId);
                const batchPlots = myPlots.filter((p) => p.claim_batch_id === batchId);
                const batchPlotList = batchPlots.map((p) => `#${p.plot_number}`).join(", ");
                return (
                  <div key={batchId} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-ink-soft)]">{batchPlotList}</span>
                    {cert ? (
                      <a
                        href={`/api/certificate/download?batch=${batchId}`}
                        className="flex items-center gap-1.5 font-medium text-[var(--color-green)] hover:underline"
                      >
                        <Download className="h-3.5 w-3.5" /> Download ({cert.certificate_number})
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-[var(--color-brown)]">
                        <Clock className="h-3.5 w-3.5" /> Pending admin approval
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="flex-1 p-6">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Payment History
            </p>
            <div className="mt-4 divide-y divide-[var(--color-ink)]/10">
              {payments.length > 0 ? (
                payments.map((pmt) => {
                  const pmtPlan = membershipPlans.find((p) => p.id === pmt.plan_id);
                  const receipt = pmt.claim_batch_id ? receiptsByBatch.get(pmt.claim_batch_id) : undefined;
                  return (
                    <div key={pmt.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <p className="font-medium">{pmtPlan ? `${pmtPlan.name} (${pmtPlan.label})` : pmt.plan_id}</p>
                        <p className="text-xs text-[var(--color-ink-soft)]">
                          {new Date(pmt.created_at).toLocaleDateString("en-IN")} · ₹
                          {(pmt.amount / 100).toLocaleString("en-IN")}
                        </p>
                        {receipt && (
                          <a
                            href={`/api/receipt/download?batch=${pmt.claim_batch_id}`}
                            className="mt-0.5 inline-block text-xs font-medium text-[var(--color-green)] hover:underline"
                          >
                            Download Receipt ({receipt.receipt_number})
                          </a>
                        )}
                      </div>
                      <Badge tone={pmt.status === "paid" ? "green" : pmt.status === "refunded" ? "brown" : "gold"}>
                        {pmt.status}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <p className="py-3 text-sm text-[var(--color-ink-soft)]">No payments yet.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Harvest Delivery Progress
            </p>
            {confirmedTotalKg ? (
              <>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-[var(--color-ink-soft)]">
                    {totalDelivered} kg delivered of {confirmedTotalKg} kg total
                  </span>
                  <span className="font-medium">{Math.max(confirmedTotalKg - totalDelivered, 0)} kg remaining</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-green-soft)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-green)]"
                    style={{ width: `${deliveryProgressPct}%` }}
                  />
                </div>
                {deliveries.length > 0 && (
                  <div className="mt-4 divide-y divide-[var(--color-ink)]/10">
                    {deliveries.map((d) => (
                      <div key={d.id} className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-4 py-2 text-sm">
                        <span>{new Date(d.delivered_at).toLocaleDateString("en-IN")}</span>
                        <span className="order-last col-span-3 text-xs text-[var(--color-ink-soft)] empty:hidden sm:order-none sm:col-span-1 sm:text-sm">{d.notes ?? ""}</span>
                        <span className="whitespace-nowrap text-right font-mono-data font-medium">{d.kg_delivered} kg</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                Your harvest hasn&apos;t been weighed yet — delivery tracking
                will begin once it&apos;s confirmed after harvest.
              </p>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <HarvestPreference />
        </div>
      </div>
    </div>
  );
}
