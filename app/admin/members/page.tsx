import { listAllUsers } from "@/lib/supabase/list-all-users";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { createServiceClient } from "@/lib/supabase/service";
import {
  adminMarkPlotAvailable,
  adminMarkPlotFilled,
  adminAssignPlan,
  adminFreeBatch,
  adminUpdateMemberContact,
} from "@/app/actions/admin-plots";
import { adminRecordOfflinePurchase } from "@/app/actions/admin-payments";
import { adminApproveBatch, adminResendCertificate } from "@/app/actions/admin-certificate";
import { adminAddDocument, adminDeleteDocument } from "@/app/actions/admin-content";
import {
  adminSetHarvestTotal,
  adminRecordDelivery,
  adminVoidDelivery,
  adminRestoreDelivery,
  adminApproveHarvestChange,
  adminRejectHarvestChange,
} from "@/app/actions/admin-harvest";
import { membershipPlans, harvestOptions } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

type PlotRow = {
  plot_number: number;
  status: "available" | "filled";
  user_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  pincode: string | null;
  plan_id: string | null;
  claim_batch_id: string | null;
  assigned_at: string | null;
  approved_at: string | null;
};
type PaymentRow = {
  user_id: string;
  claim_batch_id: string | null;
  amount: number;
  status: string;
  payment_kind: string;
  created_at: string;
};
type InstallmentPlan = {
  user_id: string;
  balance_due_inr: number;
  balance_due_date: string;
  balance_paid: boolean;
};
type CertRow = { claim_batch_id: string; certificate_number: string; email_sent: boolean; whatsapp_sent: boolean };
type Pref = { user_id: string; method: string; schedule: string; installment_kg: number | null; confirmed_total_kg: number | null };
type Delivery = { id: string; user_id: string; kg_delivered: number; delivered_at: string; notes: string | null; voided_at: string | null; void_reason: string | null };
type ChangeRequest = {
  id: string;
  user_id: string;
  requested_method: string;
  requested_schedule: string;
  requested_installment_kg: number | null;
  requested_at: string;
};
type Doc = { id: string; name: string; file_url: string; user_id: string | null };

function planLabel(planId: string | null) {
  const plan = membershipPlans.find((p) => p.id === planId);
  return plan ? `${plan.name} (${plan.label})` : null;
}
function methodTitle(id: string) {
  return harvestOptions.find((o) => o.id === id)?.title ?? id;
}
function paymentSummaryText(
  summary: { paidInr: number; balanceDueInr: number | null; balanceDueDate: string | null } | undefined
): string {
  if (!summary) return "—";
  const paid = `₹${summary.paidInr.toLocaleString("en-IN")} paid`;
  if (!summary.balanceDueInr) return paid;
  const due = new Date(summary.balanceDueDate!).toLocaleDateString("en-IN", { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" });
  return `${paid} · ₹${summary.balanceDueInr.toLocaleString("en-IN")} due ${due}`;
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const { q, tab } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  const supabase = createServiceClient();

  const [
    { data: usersData },
    { data: plotsData },
    { data: certsData },
    { data: prefsData },
    { data: deliveriesData },
    { data: requestsData },
    { data: docsData },
    { data: paymentsData },
    { data: installmentData },
    { data: clearLogData },
  ] = await Promise.all([
    listAllUsers(supabase),
    supabase
      .from("khet_club_plots")
      .select("plot_number, status, user_id, full_name, phone, email, city, address, pincode, plan_id, claim_batch_id, assigned_at, approved_at")
      .order("plot_number"),
    supabase.from("khet_club_certificates").select("claim_batch_id, certificate_number, email_sent, whatsapp_sent"),
    supabase.from("khet_club_harvest_preferences").select("user_id, method, schedule, installment_kg, confirmed_total_kg"),
    supabase.from("khet_club_harvest_deliveries").select("id, user_id, kg_delivered, delivered_at, notes, voided_at, void_reason").order("delivered_at", { ascending: false }),
    supabase
      .from("khet_club_harvest_preference_requests")
      .select("id, user_id, requested_method, requested_schedule, requested_installment_kg, requested_at")
      .eq("status", "pending")
      .order("requested_at"),
    supabase.from("khet_club_documents").select("id, name, file_url, user_id").order("created_at", { ascending: false }),
    supabase
      .from("khet_club_payments")
      .select("user_id, claim_batch_id, amount, status, payment_kind, created_at")
      .eq("status", "paid")
      .order("created_at", { ascending: false }),
    supabase.from("khet_club_installment_plans").select("user_id, balance_due_inr, balance_due_date, balance_paid"),
    supabase
      .from("khet_club_plot_clear_log")
      .select("id, plot_number, previous_full_name, previous_phone, previous_email, previous_plan_id, was_member_held, cleared_at")
      .order("cleared_at", { ascending: false })
      .limit(30),
  ]);
  type ClearLog = {
    id: string;
    plot_number: number;
    previous_full_name: string | null;
    previous_phone: string | null;
    previous_email: string | null;
    previous_plan_id: string | null;
    was_member_held: boolean;
    cleared_at: string;
  };
  const clearLog = (clearLogData ?? []) as ClearLog[];

  const users = usersData?.users ?? [];
  const usersById = new Map(users.map((u) => [u.id, u]));
  const plots = (plotsData ?? []) as PlotRow[];
  const certificatesByBatch = new Map((certsData ?? []).map((c) => [c.claim_batch_id, c as CertRow]));
  const prefs = (prefsData ?? []) as Pref[];
  const prefsByUser = new Map(prefs.map((p) => [p.user_id, p]));
  const deliveries = (deliveriesData ?? []) as Delivery[];
  const changeRequests = (requestsData ?? []) as ChangeRequest[];
  const docs = (docsData ?? []) as Doc[];
  const payments = (paymentsData ?? []) as PaymentRow[];
  const paidBatches = new Set(payments.map((p) => p.claim_batch_id).filter(Boolean));
  const installmentPlans = (installmentData ?? []) as InstallmentPlan[];

  // One payment summary per member — total actually paid so far, plus any
  // installment balance still owing. A member can have more than one paid
  // row (e.g. a deposit + a later balance payment), so amounts are summed.
  type PaymentSummary = { paidInr: number; kind: string; balanceDueInr: number | null; balanceDueDate: string | null; balancePaid: boolean };
  const paymentSummaryByUser = new Map<string, PaymentSummary>();
  for (const p of payments) {
    const existing = paymentSummaryByUser.get(p.user_id);
    if (existing) {
      existing.paidInr += p.amount / 100;
    } else {
      paymentSummaryByUser.set(p.user_id, {
        paidInr: p.amount / 100,
        kind: p.payment_kind,
        balanceDueInr: null,
        balanceDueDate: null,
        balancePaid: true,
      });
    }
  }
  for (const plan of installmentPlans) {
    const summary = paymentSummaryByUser.get(plan.user_id);
    if (!summary) continue;
    if (!plan.balance_paid) {
      summary.balanceDueInr = plan.balance_due_inr;
      summary.balanceDueDate = plan.balance_due_date;
    }
    summary.balancePaid = plan.balance_paid;
  }

  const filled = plots.filter((p) => p.status === "filled").length;
  const available = plots.length - filled;

  const batches = new Map<string, PlotRow[]>();
  for (const p of plots) {
    if (p.status !== "filled" || !p.claim_batch_id) continue;
    const list = batches.get(p.claim_batch_id) ?? [];
    list.push(p);
    batches.set(p.claim_batch_id, list);
  }

  // Same plot data, grouped by user_id instead of batch — for the "All
  // Accounts" tab, which lists every signed-up account (not just those
  // with a completed allocation).
  const plotsByUserId = new Map<string, PlotRow[]>();
  for (const p of plots) {
    if (!p.user_id) continue;
    const list = plotsByUserId.get(p.user_id) ?? [];
    list.push(p);
    plotsByUserId.set(p.user_id, list);
  }

  // Filter by the search box. Matches name, email, phone, city, or a
  // plot number — the things you'd actually have on hand when a member
  // contacts you.
  const matchesQuery = (rows: PlotRow[]) => {
    if (!query) return true;
    const user = rows[0]?.user_id ? usersById.get(rows[0].user_id) : null;
    const haystack = [
      rows[0]?.full_name,
      rows[0]?.email,
      rows[0]?.phone,
      rows[0]?.city,
      rows[0]?.address,
      rows[0]?.pincode,
      user?.email,
      user?.user_metadata?.full_name as string | undefined,
      ...rows.map((r) => String(r.plot_number)),
      ...rows.map((r) => `#${r.plot_number}`),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  };

  const visibleBatches = new Map(
    Array.from(batches.entries()).filter(([, rows]) => matchesQuery(rows))
  );

  // Voided deliveries are still fetched (so admin can see and restore
  // them) but must never count toward a member's delivered total.
  const deliveredByUser = new Map<string, number>();
  for (const d of deliveries) {
    if (d.voided_at) continue;
    deliveredByUser.set(d.user_id, (deliveredByUser.get(d.user_id) ?? 0) + d.kg_delivered);
  }

  // --- Tab 1: Members ---------------------------------------------------
  const membersContent = (
    <div className="p-6 sm:px-10">
      <Card className="p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Overall availability</span>
          <span className="font-mono-data text-[var(--color-ink-soft)]">{filled} / {plots.length} filled</span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-green-soft)]">
          <div className="h-full rounded-full bg-[var(--color-green)]" style={{ width: `${plots.length ? (filled / plots.length) * 100 : 0}%` }} />
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Manually Assign a Plan</p>
        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
          For offline reservations — phone/walk-in signups you want reflected here. If the email matches a member&apos;s
          account, the plots are linked to it so they see them in their dashboard.
          Currently {available} plot{available === 1 ? "" : "s"} available.
        </p>
        <ActionForm action={adminAssignPlan} className="mt-4 grid gap-3 sm:grid-cols-6">
          <select name="planId" required className="input sm:col-span-1" defaultValue="">
            <option value="" disabled>Plan</option>
            {membershipPlans.map((plan) => (
              <option key={plan.id} value={plan.id} disabled={available < plan.plots}>
                {plan.name} — {plan.label}
              </option>
            ))}
          </select>
          <input name="fullName" placeholder="Full name" className="input sm:col-span-1" />
          <input name="phone" placeholder="Phone" className="input sm:col-span-1" />
          <input name="email" placeholder="Email" className="input sm:col-span-1" />
          <input name="city" placeholder="City" className="input sm:col-span-1" />
          <input name="address" placeholder="Address (optional)" className="input sm:col-span-1" />
          <input name="pincode" placeholder="Pincode (optional)" className="input sm:col-span-1" />
          <Button type="submit" size="sm" className="sm:col-span-1">Assign</Button>
        </ActionForm>
      </Card>

      <form method="GET" className="mt-6 flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, email, phone, city, address, pincode or plot…"
          className="input max-w-md flex-1"
        />
        <Button type="submit" variant="outline">Search</Button>
        {query && (
          <Link href="/admin/members" className="text-xs font-medium text-[var(--color-ink-soft)] hover:underline">
            Clear
          </Link>
        )}
      </form>

      {batches.size === 0 && (
        <p className="mt-6 text-sm text-[var(--color-ink-soft)]">
          No members yet. Once someone buys a plan (or you assign one above), they&apos;ll appear here.
        </p>
      )}

      {batches.size > 0 && (
        <div className="mt-6">
          <p className="mb-3 font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Members ({visibleBatches.size}{query ? ` of ${batches.size}` : ""})
          </p>
          {visibleBatches.size === 0 && (
            <p className="text-sm text-[var(--color-ink-soft)]">
              No members match &ldquo;{q}&rdquo;.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from(visibleBatches.entries()).map(([batchId, rows]) => {
              const first = rows[0];
              const plotNumbers = rows.map((r) => r.plot_number).sort((a, b) => a - b);
              const cert = certificatesByBatch.get(batchId);
              const pref = first.user_id ? prefsByUser.get(first.user_id) : undefined;
              const prefOption = pref ? harvestOptions.find((o) => o.id === pref.method) : null;
              const account = first.user_id ? usersById.get(first.user_id) : undefined;
              const registeredAt = account?.created_at ? new Date(account.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : null;
              const payment = first.user_id ? paymentSummaryByUser.get(first.user_id) : undefined;
              return (
                <Card key={batchId} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{first.full_name ?? "—"}</p>
                      <p className="text-xs text-[var(--color-ink-soft)]">{first.email ?? "—"}</p>
                    </div>
                    <Badge tone="brown">{planLabel(first.plan_id) ?? `${rows.length} Plots`}</Badge>
                  </div>
                  <p className="mt-2 font-mono-data text-xs text-[var(--color-ink-soft)]">
                    Plots: {plotNumbers.map((n) => `#${n}`).join(", ")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-ink-soft)]">
                    <span>{first.phone ?? "—"}</span>
                    <span>{first.city ?? "—"}</span>
                    <span title="Plot assigned">{first.assigned_at ? new Date(first.assigned_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</span>
                  </div>
                  {(first.address || first.pincode) && (
                    <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                      {[first.address, first.pincode].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-ink-soft)]">
                    {registeredAt && <span>Registered {registeredAt}</span>}
                    <span>{paymentSummaryText(payment)}</span>
                  </div>
                  {prefOption && (
                    <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                      Harvest: {prefOption.title}
                      {pref!.schedule === "monthly" ? ` (~${pref!.installment_kg} kg/mo)` : ""}
                    </p>
                  )}

                  {first.user_id && !paidBatches.has(batchId) && !payment && (
                    <details className="mt-3 border-t border-[var(--color-ink)]/10 pt-3">
                      <summary className="cursor-pointer text-xs font-medium text-[var(--color-brown)] hover:text-[var(--color-green-deep)]">
                        No payment recorded — record an offline payment
                      </summary>
                      <ActionForm action={adminRecordOfflinePurchase} className="mt-3 grid gap-2 sm:grid-cols-2">
                        <input type="hidden" name="claimBatchId" value={batchId} />
                        <input name="amountInr" type="number" min={1} required placeholder="Amount received (₹)" className="input" />
                        <select name="method" required defaultValue="" className="input">
                          <option value="" disabled>Paid by…</option>
                          <option value="cash">Cash</option>
                          <option value="upi">UPI</option>
                          <option value="bank_transfer">Bank transfer</option>
                          <option value="cheque">Cheque</option>
                          <option value="other">Other</option>
                        </select>
                        <input name="reference" placeholder="UPI/UTR reference (optional)" className="input sm:col-span-2" />
                        <Button type="submit" size="sm" variant="outline">Record Payment & Send Receipt</Button>
                      </ActionForm>
                    </details>
                  )}

                  <details className="mt-3 border-t border-[var(--color-ink)]/10 pt-3">
                    <summary className="cursor-pointer text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]">
                      Edit contact &amp; address
                    </summary>
                    <ActionForm action={adminUpdateMemberContact} className="mt-3 grid gap-2 sm:grid-cols-2">
                      <input type="hidden" name="claimBatchId" value={batchId} />
                      <input name="fullName" placeholder="Full name" defaultValue={first.full_name ?? ""} className="input" />
                      <input name="phone" placeholder="Phone" defaultValue={first.phone ?? ""} className="input" />
                      <input name="email" placeholder="Email" defaultValue={first.email ?? ""} className="input" />
                      <input name="city" placeholder="City" defaultValue={first.city ?? ""} className="input" />
                      <input name="address" placeholder="Address" defaultValue={first.address ?? ""} className="input sm:col-span-2" />
                      <input name="pincode" placeholder="Pincode" defaultValue={first.pincode ?? ""} className="input" />
                      <Button type="submit" size="sm" variant="outline">Save</Button>
                      <p className="text-[11px] text-[var(--color-ink-soft)] sm:col-span-2">
                        Also updates the member&apos;s account, so certificates and WhatsApp use the new name and phone.
                        Their login email stays the same.
                      </p>
                    </ActionForm>
                  </details>

                  {cert ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--color-ink)]/10 pt-3">
                      <Badge tone="green">Certificate {cert.certificate_number}</Badge>
                      <span className="text-[10px] text-[var(--color-ink-soft)]">
                        Email {cert.email_sent ? "✓" : "✗"} · WhatsApp {cert.whatsapp_sent ? "✓" : "✗"}
                      </span>
                      <a href={`/api/certificate/download?batch=${batchId}`} className="text-xs font-medium text-[var(--color-green)] hover:underline">
                        Download
                      </a>
                      <ActionForm action={adminResendCertificate}>
                        <input type="hidden" name="claimBatchId" value={batchId} />
                        <button className="text-xs font-medium text-[var(--color-brown)] hover:underline">Resend</button>
                      </ActionForm>
                    </div>
                  ) : !first.user_id ? (
                    <p className="mt-3 border-t border-[var(--color-ink)]/10 pt-3 text-xs text-[var(--color-ink-soft)]">
                      Offline reservation — no member account, so no certificate is issued.
                    </p>
                  ) : (
                    <ActionForm action={adminApproveBatch} className="mt-3 border-t border-[var(--color-ink)]/10 pt-3">
                      <input type="hidden" name="claimBatchId" value={batchId} />
                      {payment?.balanceDueInr ? (
                        <p className="mb-2 text-xs text-[var(--color-brown)]">
                          Heads up: ₹{payment.balanceDueInr.toLocaleString("en-IN")} balance still unpaid.
                        </p>
                      ) : null}
                      <Button type="submit" size="sm" className="w-full">Approve & Issue Certificate</Button>
                    </ActionForm>
                  )}

                  <ActionForm action={adminFreeBatch} className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-ink)]/10 pt-3">
                    <input type="hidden" name="claimBatchId" value={batchId} />
                    <input
                      name="confirmRemove"
                      placeholder="Type REMOVE"
                      className="w-28 rounded-[var(--radius-sm)] border border-[var(--color-live)]/30 bg-[var(--color-surface)] px-2 py-1 text-xs"
                      autoComplete="off"
                    />
                    <button className="text-xs font-medium text-[var(--color-live)] hover:underline">
                      Free Up All {rows.length} Plot{rows.length > 1 ? "s" : ""}
                    </button>
                    <span className="w-full text-xs text-[var(--color-ink-soft)]">
                      Removes this member&apos;s entire allocation. Archived to the clear log, but they&apos;d need to purchase again.
                    </span>
                  </ActionForm>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // --- Tab 2: All Accounts ------------------------------------------------
  const accountsContent = (
    <div className="p-6 sm:px-10">
      <div className="mb-3 flex justify-end">
        <a
          href="/api/admin/export/members"
          className="flex items-center gap-1.5 rounded-full border border-[var(--color-ink)]/15 px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-green)] hover:text-[var(--color-green-deep)]"
        >
          <Download className="h-3 w-3" /> Export CSV
        </a>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">City</th>
                <th className="px-5 py-3 font-medium">Address</th>
                <th className="px-5 py-3 font-medium">Registered</th>
                <th className="px-5 py-3 font-medium">Confirmed</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Plot(s)</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Harvest Preference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ink)]/10">
              {users.map((u) => {
                const pref = prefsByUser.get(u.id);
                const prefOption = pref ? harvestOptions.find((o) => o.id === pref.method) : null;
                const holding = plotsByUserId.get(u.id) ?? [];
                const holdingFirst = holding[0];
                const plotNumbers = holding.map((r) => r.plot_number).sort((a, b) => a - b);
                const payment = paymentSummaryByUser.get(u.id);
                return (
                  <tr key={u.id}>
                    <td className="px-5 py-3 font-medium">{(u.user_metadata?.full_name as string) || holdingFirst?.full_name || "—"}</td>
                    <td className="px-5 py-3 text-[var(--color-ink-soft)]">{u.email}</td>
                    <td className="px-5 py-3 text-[var(--color-ink-soft)]">{holdingFirst?.phone || (u.user_metadata?.phone as string) || "—"}</td>
                    <td className="px-5 py-3 text-[var(--color-ink-soft)]">{holdingFirst?.city || "—"}</td>
                    <td className="px-5 py-3 text-[var(--color-ink-soft)]">
                      {[holdingFirst?.address, holdingFirst?.pincode].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--color-ink-soft)]">
                      {new Date(u.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={u.email_confirmed_at ? "green" : "brown"}>
                        {u.email_confirmed_at ? "confirmed" : "pending"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">{planLabel(holdingFirst?.plan_id ?? null) ?? "—"}</td>
                    <td className="px-5 py-3 font-mono-data text-xs">
                      {plotNumbers.length > 0 ? plotNumbers.map((n) => `#${n}`).join(", ") : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--color-ink-soft)]">{paymentSummaryText(payment)}</td>
                    <td className="px-5 py-3">
                      {prefOption ? (
                        <>
                          {prefOption.title}
                          {pref!.schedule === "monthly" && (
                            <span className="ml-1 text-xs text-[var(--color-brown)]">(~{pref!.installment_kg} kg/mo)</span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-6 text-center text-[var(--color-ink-soft)]">No customers yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Documents</p>
        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
          Add a document link for a specific customer (by email), or leave email blank for a shared document everyone can see.
        </p>
        <ActionForm action={adminAddDocument} className="mt-4 grid gap-3 sm:grid-cols-4">
          <input name="name" required placeholder="Document name" className="input sm:col-span-1" />
          <input name="fileUrl" required placeholder="File URL" className="input sm:col-span-1" />
          <input name="email" placeholder="Customer email (optional)" className="input sm:col-span-1" />
          <Button type="submit" size="sm" className="sm:col-span-1">Add Document</Button>
        </ActionForm>
        {docs.length > 0 && (
          <div className="mt-4 divide-y divide-[var(--color-ink)]/10">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {d.user_id ? "Customer-specific" : "Shared"} ·{" "}
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="underline">{d.file_url}</a>
                  </p>
                </div>
                <ActionForm action={adminDeleteDocument} confirmMessage="Remove this document?">
                  <input type="hidden" name="id" value={d.id} />
                  <button className="text-xs font-medium text-[var(--color-live)] hover:underline">Remove</button>
                </ActionForm>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  // --- Tab 3: All Plots -----------------------------------------------
  const plotsContent = (
    <div className="p-6 sm:px-10">
      <Card className="overflow-hidden p-0">
        <div className="max-h-[640px] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="sticky top-0 border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-4 py-3 font-medium">Plot</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Assigned</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ink)]/10">
              {plots.map((p) => (
                <tr key={p.plot_number}>
                  <td className="px-4 py-2.5 font-mono-data">#{p.plot_number}</td>
                  <td className="px-4 py-2.5"><Badge tone={p.status === "filled" ? "brown" : "green"}>{p.status}</Badge></td>
                  <td className="px-4 py-2.5">{planLabel(p.plan_id) ?? "—"}</td>
                  <td className="px-4 py-2.5">{p.full_name ?? "—"}</td>
                  <td className="px-4 py-2.5">{p.phone ?? "—"}</td>
                  <td className="px-4 py-2.5">{p.email ?? "—"}</td>
                  <td className="px-4 py-2.5">{p.city ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">
                    {[p.address, p.pincode].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">
                    {p.assigned_at ? new Date(p.assigned_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {p.status === "filled" ? (
                      <ActionForm action={adminMarkPlotAvailable} className="flex items-center justify-end gap-1.5">
                        <input type="hidden" name="plotNumber" value={p.plot_number} />
                        {p.user_id ? (
                          <>
                            <input
                              name="confirmPlotNumber"
                              placeholder={`Type ${p.plot_number}`}
                              className="w-20 rounded-[var(--radius-sm)] border border-[var(--color-live)]/30 bg-[var(--color-surface)] px-2 py-1 text-xs"
                              autoComplete="off"
                              title="This plot belongs to a registered member — type the plot number to confirm."
                            />
                            <button className="text-xs font-medium text-[var(--color-live)] hover:underline">Free Up</button>
                          </>
                        ) : (
                          <button className="text-xs font-medium text-[var(--color-brown)] hover:underline">Free Up</button>
                        )}
                      </ActionForm>
                    ) : (
                      <ActionForm action={adminMarkPlotFilled}>
                        <input type="hidden" name="plotNumber" value={p.plot_number} />
                        <button className="text-xs font-medium text-[var(--color-green)] hover:underline">Quick Fill</button>
                      </ActionForm>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {clearLog.length > 0 && (
        <Card className="mt-6 p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Recently freed plots
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Who held each plot before it was freed — the record to check if a member says their plot went missing.
          </p>
          <div className="mt-3 divide-y divide-[var(--color-ink)]/10 text-sm">
            {clearLog.map((c) => (
              <div key={c.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  <span className="font-mono-data">#{c.plot_number}</span>{" "}
                  <span className="font-medium">{c.previous_full_name ?? "—"}</span>
                  <span className="text-xs text-[var(--color-ink-soft)]">
                    {" "}
                    · {[c.previous_phone, c.previous_email].filter(Boolean).join(" · ") || "no contact"} ·{" "}
                    {planLabel(c.previous_plan_id) ?? "no plan"}
                    {c.was_member_held ? " · member account" : " · offline"}
                  </span>
                </span>
                <span className="text-xs text-[var(--color-ink-soft)]">
                  {new Date(c.cleared_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  // --- Tab 4: Harvest ---------------------------------------------------
  const harvestContent = (
    <div className="space-y-4 p-6 sm:px-10">
      {changeRequests.length > 0 && (
        <Card className="border-[var(--color-brown)]/30 bg-[var(--color-brown-soft)] p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
            Pending Preference Change Requests ({changeRequests.length})
          </p>
          <div className="mt-3 space-y-3">
            {changeRequests.map((req) => {
              const user = usersById.get(req.user_id);
              const name = (user?.user_metadata?.full_name as string) || user?.email || "Unknown";
              const current = prefsByUser.get(req.user_id);
              return (
                <div key={req.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-white/60 p-3">
                  <div className="text-sm">
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      Current: {current ? methodTitle(current.method) : "—"}
                      {current?.schedule === "monthly" ? ` (~${current.installment_kg} kg/mo)` : ""}
                      {" → "}
                      Requested: {methodTitle(req.requested_method)}
                      {req.requested_schedule === "monthly" ? ` (~${req.requested_installment_kg} kg/mo)` : " (one-time)"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <ActionForm action={adminRejectHarvestChange}>
                      <input type="hidden" name="requestId" value={req.id} />
                      <Button type="submit" size="sm" variant="outline">Reject</Button>
                    </ActionForm>
                    <ActionForm action={adminApproveHarvestChange}>
                      <input type="hidden" name="requestId" value={req.id} />
                      <Button type="submit" size="sm">Approve</Button>
                    </ActionForm>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {prefs.length === 0 && (
        <p className="text-sm text-[var(--color-ink-soft)]">No members have set a harvest preference yet.</p>
      )}

      {prefs.map((pref) => {
        const user = usersById.get(pref.user_id);
        const name = (user?.user_metadata?.full_name as string) || user?.email || "Unknown";
        const method = harvestOptions.find((o) => o.id === pref.method)?.title ?? pref.method;
        const delivered = deliveredByUser.get(pref.user_id) ?? 0;
        const total = pref.confirmed_total_kg;
        const remaining = total !== null ? Math.max(total - delivered, 0) : null;
        const progressPct = total ? Math.min((delivered / total) * 100, 100) : 0;

        return (
          <Card key={pref.user_id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  {method}{pref.schedule === "monthly" ? ` · ~${pref.installment_kg} kg/month` : " · one-time"}
                </p>
              </div>
              <Badge tone={total ? "green" : "brown"}>{total ? `${total} kg total` : "Total not set"}</Badge>
            </div>

            {total !== null && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-[var(--color-ink-soft)]">
                  <span>{delivered} kg delivered</span>
                  <span>{remaining} kg remaining</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-green-soft)]">
                  <div className="h-full rounded-full bg-[var(--color-green)]" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ActionForm action={adminSetHarvestTotal} className="flex gap-2">
                <input type="hidden" name="userId" value={pref.user_id} />
                <input name="totalKg" type="number" min={1} placeholder="Confirmed total (kg)" defaultValue={total ?? ""} className="input flex-1" />
                <Button type="submit" size="sm" variant="outline">Set Total</Button>
              </ActionForm>
              <ActionForm action={adminRecordDelivery} className="flex flex-wrap gap-2">
                <input type="hidden" name="userId" value={pref.user_id} />
                <input name="kgDelivered" type="number" min={1} required placeholder="kg" className="input w-20" />
                <input name="deliveredAt" type="date" className="input flex-1" />
                <Button type="submit" size="sm">Record Delivery</Button>
              </ActionForm>
            </div>
          </Card>
        );
      })}

      <Card className="mt-2 overflow-hidden p-0">
        <div className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] px-5 py-3">
          <p className="text-sm font-medium">Delivery Log</p>
        </div>
        <div className="max-h-[400px] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">kg</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ink)]/10">
              {deliveries.map((d) => {
                const user = usersById.get(d.user_id);
                const isVoided = Boolean(d.voided_at);
                return (
                  <tr key={d.id} className={isVoided ? "opacity-55" : ""}>
                    <td className="px-4 py-2.5">{(user?.user_metadata?.full_name as string) || user?.email || "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">{new Date(d.delivered_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                    <td className={`px-4 py-2.5 font-mono-data ${isVoided ? "line-through" : ""}`}>{d.kg_delivered} kg</td>
                    <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">
                      {isVoided ? (
                        <span className="text-xs">Voided — {d.void_reason}</span>
                      ) : (
                        d.notes ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isVoided ? (
                        <ActionForm action={adminRestoreDelivery}>
                          <input type="hidden" name="id" value={d.id} />
                          <button className="text-xs font-medium text-[var(--color-green)] hover:underline">Restore</button>
                        </ActionForm>
                      ) : (
                        <ActionForm action={adminVoidDelivery} className="flex items-center justify-end gap-1.5">
                          <input type="hidden" name="id" value={d.id} />
                          <input
                            name="voidReason"
                            placeholder="Reason"
                            className="w-28 rounded-[var(--radius-sm)] border border-[var(--color-ink)]/15 bg-[var(--color-surface)] px-2 py-1 text-xs"
                            autoComplete="off"
                          />
                          <button className="text-xs font-medium text-[var(--color-live)] hover:underline">Void</button>
                        </ActionForm>
                      )}
                    </td>
                  </tr>
                );
              })}
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">No deliveries recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div>
      <PageHeader title="Members" subtitle={`${filled} filled · ${available} available · ${plots.length} total plots`} />
      <Tabs
        defaultTab={tab}
        tabs={[
          { id: "members", label: "Members", content: membersContent },
          { id: "accounts", label: "All Accounts", content: accountsContent },
          { id: "plots", label: "All Plots", content: plotsContent },
          { id: "harvest", label: "Harvest", content: harvestContent },
        ]}
      />
    </div>
  );
}
