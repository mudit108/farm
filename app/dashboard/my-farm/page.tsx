import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, Download, Clock, Heart, Users, MapPin, Award, Share2, Receipt, Truck, PenLine, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlotNicknameForm } from "@/components/dashboard/plot-nickname-form";
import { HarvestPreference } from "@/components/dashboard/harvest-preference";
import { BalancePaymentCard } from "@/components/dashboard/balance-payment-card";
import { ReferralCard } from "@/components/dashboard/referral-card";
import { MemberDetailsForm, type MemberDetails } from "@/components/dashboard/member-details-form";
import { Panel, PlotMap, PlotMapLegend, ProgressBar } from "@/components/dashboard/ui";
import { createSessionClient } from "@/lib/supabase/session";
import { getMyInstallmentPlans } from "@/app/actions/payment";
import {
  membershipPlans,
  summarizePlotHoldings,
  FEEDING_FAMILIES_PER_PLOT,
  balanceLateFeeInr,
  balanceStage,
  todayInIndia,
} from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Farm | Mera Khet", robots: { index: false } };

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
type Payment = {
  id: string;
  plan_id: string;
  amount: number;
  status: string;
  created_at: string;
  claim_batch_id: string | null;
  payment_kind: "full" | "deposit" | "balance";
};
type Receipt = { payment_id: string; receipt_number: string };
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
    ? new Date(season.sowing_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })
    : "Near Diwali";

  let myPlots: MyPlot[] = [];
  let certsByBatch = new Map<string, Cert>();
  let payments: Payment[] = [];
  let receiptsByPayment = new Map<string, Receipt>();
  let confirmedTotalKg: number | null = null;
  let deliveries: Delivery[] = [];
  let memberDetails: MemberDetails | null = null;
  let harvestMethod: string | null = null;
  let farmGrid: { plot_number: number; status: "available" | "filled" }[] = [];
  let installmentPlans: Awaited<ReturnType<typeof getMyInstallmentPlans>> = [];

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
          .select("id, plan_id, amount, status, created_at, claim_batch_id, payment_kind")
          // Only completed money movements — a checkout window closed
          // without paying leaves a "created" row that isn't a payment.
          .in("status", ["paid", "refunded"])
          .order("created_at", { ascending: false }),
        supabase.from("khet_club_receipts").select("payment_id, receipt_number").eq("user_id", user.id),
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
    receiptsByPayment = new Map((receiptsData ?? []).map((r) => [r.payment_id, r as Receipt]));
    confirmedTotalKg = prefData?.confirmed_total_kg ?? null;
    deliveries = (deliveriesData ?? []) as Delivery[];
    // Own read, RLS-scoped — safe to call directly rather than fold
    // into the Promise.all above, since it does its own session lookup.
    installmentPlans = await getMyInstallmentPlans();
    const [{ data: detailsRow }, { data: methodRow }] = await Promise.all([
      supabase
        .from("khet_club_member_details")
        .select("delivery_time_pref, delivery_days_note, delivery_instructions, payout_upi, payout_account_name, payout_account_number, payout_ifsc")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("khet_club_harvest_preferences").select("method").eq("user_id", user.id).maybeSingle(),
    ]);
    memberDetails = (detailsRow as MemberDetails | null) ?? null;
    harvestMethod = (methodRow?.method as string | undefined) ?? null;
    const { data: gridData } = await supabase.rpc("khet_club_all_plot_statuses");
    farmGrid = (gridData ?? []) as typeof farmGrid;
  }

  const holdings = summarizePlotHoldings(myPlots);
  const batchIds = Array.from(new Set(myPlots.map((p) => p.claim_batch_id).filter(Boolean))) as string[];
  const plotList = myPlots.map((p) => `#${p.plot_number}`).join(", ");
  const myPlotNumbers = new Set(myPlots.map((p) => p.plot_number));
  const totalPaidPaise = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const totalDelivered = deliveries.reduce((sum, d) => sum + d.kg_delivered, 0);
  const deliveryProgressPct = confirmedTotalKg ? Math.min((totalDelivered / confirmedTotalKg) * 100, 100) : 0;

  if (myPlots.length === 0) {
    return (
      <div>
        <PageHeader eyebrow={seasonLabel} title="My Farm" subtitle="Your plot, plan, and everything that comes with it." />
        <div className="mk-page-pad">
          <div className="mk-empty">
            <span className="mk-empty-icon" aria-hidden="true">
              <ClipboardCheck className="h-6 w-6" />
            </span>
            <h2>No plan selected yet</h2>
            <p>Choose a plan to see your plot, certificate, receipts and harvest details here.</p>
            <Link href="/dashboard/select-plot" className="mk-btn mk-btn-green">
              Select your plan <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  const allConfirmed = myPlots.every((p) => p.approved_at);
  const inrPaise = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div>
      <PageHeader eyebrow={seasonLabel} title="My Farm" subtitle="Your plot, plan, and everything that comes with it." />

      <div className="mk-page-pad space-y-6">
        {installmentPlans.length > 0 && (
          <div className="space-y-4">
            {installmentPlans.map((ip) => (
              <BalancePaymentCard
                key={ip.id}
                plan={ip}
                status={balanceStage(ip.balance_due_date, todayInIndia(now))}
                lateFeeInr={balanceLateFeeInr(ip.plan_id)}
              />
            ))}
          </div>
        )}

        {/* The plot, certificate-style */}
        <section className="mk-plot-hero">
          <div className="mk-plot-hero-main">
            <p className="mk-plot-k">{myPlots.length > 1 ? "Your plots" : "Your plot"}</p>
            {myPlots[0].custom_name && <p className="mk-plot-name">“{myPlots[0].custom_name}”</p>}
            <p className="mk-plot-nums">{plotList}</p>
            <p className="mk-plot-meta">
              {holdings.label}
              {holdings.isMixedPlans ? " (multiple purchases)" : ""} · {seasonLabel}
            </p>
            <span className={allConfirmed ? "mk-plot-status is-ok" : "mk-plot-status"}>
              {allConfirmed ? "Confirmed" : "Awaiting approval"}
            </span>
          </div>
          <dl className="mk-plot-facts">
            <div>
              <dt>Registered to</dt>
              <dd>{myPlots[0].full_name ?? "—"}</dd>
            </div>
            <div>
              <dt>Area</dt>
              <dd>{holdings.areaSqFt.toLocaleString("en-IN")} sq ft</dd>
            </div>
            <div>
              <dt>Wheat target</dt>
              <dd>
                {holdings.wheatMinKg}–{holdings.wheatMaxKg} kg
              </dd>
            </div>
            <div>
              <dt>Total paid</dt>
              <dd>{inrPaise(totalPaidPaise)}</dd>
            </div>
            <div>
              <dt>Crop</dt>
              <dd>Gehu (Wheat)</dd>
            </div>
            <div>
              <dt>Season starts</dt>
              <dd>{sowingLabel}</dd>
            </div>
            <div>
              <dt>First assigned</dt>
              <dd>{myPlots[0].assigned_at ? new Date(myPlots[0].assigned_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</dd>
            </div>
          </dl>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex min-w-0 flex-col gap-6">
            {farmGrid.length > 0 && (
              <Panel icon={MapPin} label="Where your plots are">
                <PlotMap grid={farmGrid} mine={Array.from(myPlotNumbers)} size="lg" />
                <PlotMapLegend />
              </Panel>
            )}

            <Panel icon={Users} label="Everyone shares the season fairly">
              <p className="mk-quote">
                {plotList} {myPlots.length === 1 ? "is yours" : "are yours"} to follow, visit and watch through the season. When harvest comes, the whole
                farm&apos;s wheat is brought together and divided equally across every plot — so your share never depends on whether your particular corner
                of the field did better or worse than the rest. No farmer among us carries a bad patch alone, and nobody quietly gains from someone
                else&apos;s. One farm, one season, shared honestly.
              </p>
            </Panel>

            <Panel icon={PenLine} label="Name your plot">
              <PlotNicknameForm initialName={myPlots[0].custom_name ?? ""} />
              <p className="mk-muted mt-5">
                Only seasonal plans are offered — this membership covers the upcoming wheat season only. Wheat target is an estimate, not a guarantee.
              </p>
              <Link href="/dashboard/select-plot">
                <Button variant="outline" className="mt-4 w-full">
                  Add More Plots
                </Button>
              </Link>
            </Panel>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <Panel icon={Heart} label="Your Feeding Families impact" className="mk-panel-warm">
              <div className="mk-stat-pair">
                <div>
                  <p className="mk-big">₹{(myPlots.length * FEEDING_FAMILIES_PER_PLOT).toLocaleString("en-IN")}</p>
                  <p className="mk-muted">Contributed by you</p>
                </div>
                <div>
                  <p className="mk-big">{Math.round(((myPlots.length * FEEDING_FAMILIES_PER_PLOT) / 1000) * 2)}</p>
                  <p className="mk-muted">Families fed</p>
                </div>
              </div>
              <p className="mk-muted mt-3">
                ₹1,000 from each of your {myPlots.length} plot{myPlots.length === 1 ? "" : "s"} — included in your membership price, not an extra charge.
              </p>
            </Panel>

            <Panel icon={Award} label={`Membership certificate${batchIds.length > 1 ? "s" : ""}`}>
              <div className="mk-rows">
                {batchIds.map((batchId) => {
                  const cert = certsByBatch.get(batchId);
                  const batchPlots = myPlots.filter((p) => p.claim_batch_id === batchId);
                  const batchPlotList = batchPlots.map((p) => `#${p.plot_number}`).join(", ");
                  return (
                    <div key={batchId} className="mk-row">
                      <span className="mk-row-main">{batchPlotList}</span>
                      {cert ? (
                        <a href={`/api/certificate/download?batch=${batchId}`} className="mk-download">
                          <Download className="h-4 w-4" aria-hidden="true" /> {cert.certificate_number}
                        </a>
                      ) : (
                        <span className="mk-pending">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Pending approval
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel icon={Share2} label="Share your story">
              <p className="mk-muted">A shareable card with your name, plot, and impact — ready for WhatsApp Status or Instagram Stories.</p>
              <a href="/api/story-card" download>
                <Button variant="outline" className="mt-4 w-full">
                  <Download className="h-4 w-4" aria-hidden="true" /> Download your story card
                </Button>
              </a>
              <p className="mk-muted mt-2 text-center">#MyMeraKhet</p>
            </Panel>

            {user && <ReferralCard userId={user.id} fullName={(user.user_metadata?.full_name as string) ?? null} />}

            <Panel icon={Receipt} label="Payment history">
              <div className="mk-rows">
                {payments.length > 0 ? (
                  payments.map((pmt) => {
                    const pmtPlan = membershipPlans.find((p) => p.id === pmt.plan_id);
                    const receipt = receiptsByPayment.get(pmt.id);
                    return (
                      <div key={pmt.id} className="mk-row">
                        <div className="mk-row-main">
                          <p className="font-semibold text-[var(--color-ink)]">
                            {pmtPlan ? `${pmtPlan.name} (${pmtPlan.label})` : pmt.plan_id}
                            {pmt.payment_kind === "deposit" && <span className="font-normal text-[var(--color-ink-soft)]"> · 50% deposit</span>}
                            {pmt.payment_kind === "balance" && <span className="font-normal text-[var(--color-ink-soft)]"> · balance</span>}
                          </p>
                          <p className="mk-muted">
                            {new Date(pmt.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })} ·{" "}
                            {inrPaise(pmt.amount)}
                          </p>
                          {receipt && (
                            <a href={`/api/receipt/download?payment=${pmt.id}`} className="mk-download mt-1">
                              <Download className="h-3.5 w-3.5" aria-hidden="true" /> Receipt {receipt.receipt_number}
                            </a>
                          )}
                        </div>
                        <Badge tone={pmt.status === "paid" ? "green" : pmt.status === "refunded" ? "brown" : "gold"}>{pmt.status}</Badge>
                      </div>
                    );
                  })
                ) : (
                  <p className="mk-muted">No payments yet.</p>
                )}
              </div>
            </Panel>
          </div>
        </div>

        <Panel icon={Truck} label="Harvest delivery progress" id="harvest">
          {confirmedTotalKg ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="mk-big">
                  {totalDelivered.toLocaleString("en-IN")} <small>of {confirmedTotalKg.toLocaleString("en-IN")} kg delivered</small>
                </p>
                <p className="text-sm font-semibold">{Math.max(confirmedTotalKg - totalDelivered, 0).toLocaleString("en-IN")} kg remaining</p>
              </div>
              <ProgressBar value={deliveryProgressPct} tone="green" label="Harvest delivered" />
              {deliveries.length > 0 && (
                <div className="mk-rows mt-4">
                  {deliveries.map((d) => (
                    <div key={d.id} className="mk-row">
                      <div className="mk-row-main">
                        <p className="font-semibold text-[var(--color-ink)]">
                          {new Date(d.delivered_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
                        </p>
                        {d.notes && <p className="mk-muted">{d.notes}</p>}
                      </div>
                      <span className="whitespace-nowrap font-semibold tabular-nums">{d.kg_delivered} kg</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="mk-muted">
              Your harvest hasn&apos;t been weighed yet — delivery tracking will begin once it&apos;s confirmed after harvest.
            </p>
          )}
        </Panel>

        <HarvestPreference />

        {user && (
          <Panel icon={Truck} label={harvestMethod === "sell-to-market" ? "Payout details" : "Delivery details"}>
            <p className="mk-muted mb-4">
              {harvestMethod === "sell-to-market"
                ? "You chose to sell your harvest — tell us where to send the money."
                : "Help us deliver your harvest at a time that suits you. You can change these anytime."}
            </p>
            <MemberDetailsForm details={memberDetails} method={harvestMethod} />
          </Panel>
        )}
      </div>
    </div>
  );
}
