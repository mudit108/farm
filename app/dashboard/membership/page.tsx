import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HarvestPreference } from "@/components/dashboard/harvest-preference";
import { createSessionClient } from "@/lib/supabase/session";
import { membershipPlans, summarizePlotHoldings } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

type MyPlot = {
  plot_number: number;
  status: "available" | "filled";
  plan_id: string | null;
  assigned_at: string | null;
};
type Payment = {
  id: string;
  plan_id: string;
  amount: number;
  status: string;
  created_at: string;
};
type Delivery = { id: string; kg_delivered: number; delivered_at: string; notes: string | null };

export default async function MembershipPage() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myPlots: MyPlot[] = [];
  let payments: Payment[] = [];
  let confirmedTotalKg: number | null = null;
  let deliveries: Delivery[] = [];
  if (user) {
    const [{ data: plotsData }, { data: paymentsData }, { data: prefData }, { data: deliveriesData }] = await Promise.all([
      supabase
        .from("khet_club_plots")
        .select("plot_number, status, plan_id, assigned_at")
        .eq("user_id", user.id)
        .order("plot_number"),
      supabase
        .from("khet_club_payments")
        .select("id, plan_id, amount, status, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("khet_club_harvest_preferences")
        .select("confirmed_total_kg")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("khet_club_harvest_deliveries")
        .select("id, kg_delivered, delivered_at, notes")
        .eq("user_id", user.id)
        .order("delivered_at", { ascending: false }),
    ]);
    myPlots = (plotsData ?? []) as MyPlot[];
    payments = (paymentsData ?? []) as Payment[];
    confirmedTotalKg = prefData?.confirmed_total_kg ?? null;
    deliveries = (deliveriesData ?? []) as Delivery[];
  }

  const totalDelivered = deliveries.reduce((sum, d) => sum + d.kg_delivered, 0);
  const deliveryProgressPct = confirmedTotalKg ? Math.min((totalDelivered / confirmedTotalKg) * 100, 100) : 0;

  const holdings = summarizePlotHoldings(myPlots);
  const plotList = myPlots.map((p) => `#${p.plot_number}`).join(", ");
  const totalPaidPaise = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <PageHeader title="Membership" subtitle="Your plan, plots, and payment history." />

      <div className="grid gap-6 p-6 sm:px-10 lg:grid-cols-2">
        <Card className="p-6">
          {myPlots.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="font-display text-lg">
                  {holdings.label} — Wheat Season 2026–27
                </p>
                <Badge tone="green">{myPlots[0].status}</Badge>
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-soft)]">Plan{holdings.isMixedPlans ? "s" : ""}</dt>
                  <dd className="font-medium">{holdings.label}{holdings.isMixedPlans ? " (multiple purchases)" : ""}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-soft)]">Plots</dt>
                  <dd className="font-medium">{plotList}</dd>
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
                  <dd className="font-medium">Near Diwali 2026</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-soft)]">First assigned</dt>
                  <dd className="font-medium">
                    {myPlots[0].assigned_at ? new Date(myPlots[0].assigned_at).toLocaleDateString("en-IN") : "—"}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-[var(--color-ink-soft)]">
                Only seasonal plans are offered — this membership covers the
                upcoming wheat season only. Wheat target is an estimate,
                not a guarantee.
              </p>
              <Link href="/dashboard/select-plot">
                <Button variant="outline" className="mt-4 w-full">Add More Plots</Button>
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <ClipboardCheck className="h-8 w-8 text-[var(--color-brown)]" />
              <p className="font-display text-lg">No plan selected yet</p>
              <p className="max-w-xs text-sm text-[var(--color-ink-soft)]">
                Choose a plan to activate your membership.
              </p>
              <Link href="/dashboard/select-plot">
                <Button className="mt-2">Select Your Plan</Button>
              </Link>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Payment History
          </p>
          <div className="mt-4 divide-y divide-[var(--color-ink)]/10">
            {payments.length > 0 ? (
              payments.map((pmt) => {
                const pmtPlan = membershipPlans.find((p) => p.id === pmt.plan_id);
                return (
                  <div key={pmt.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium">{pmtPlan ? `${pmtPlan.name} (${pmtPlan.label})` : pmt.plan_id}</p>
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        {new Date(pmt.created_at).toLocaleDateString("en-IN")} · ₹{(pmt.amount / 100).toLocaleString("en-IN")}
                      </p>
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

        {myPlots.length > 0 && (
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
                        <div key={d.id} className="flex items-center justify-between py-2 text-sm">
                          <span>{new Date(d.delivered_at).toLocaleDateString("en-IN")}</span>
                          <span className="text-[var(--color-ink-soft)]">{d.notes ?? ""}</span>
                          <span className="font-mono-data font-medium">{d.kg_delivered} kg</span>
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
        )}

        <div className="lg:col-span-2">
          <HarvestPreference />
        </div>
      </div>
    </div>
  );
}
