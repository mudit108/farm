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
  membershipPlans,
  FEEDING_FAMILIES_PER_PLOT,
  EXPENSE_CATEGORIES,
  balanceLateFeeInr,
  balanceStage,
  todayInIndia,
} from "@/lib/demo-data";
import { adminAddExpense, adminDeleteExpense } from "@/app/actions/admin-expenses";
import { adminMarkBalancePaidOffline, adminMarkPaymentRefunded } from "@/app/actions/admin-payments";
import { adminUpdateFFFAmount } from "@/app/actions/admin-content";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Payment = {
  id: string;
  user_id: string;
  plan_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  status: "created" | "paid" | "failed" | "refunded";
  created_at: string;
  discount_inr: number;
  payment_kind: "full" | "deposit" | "balance";
  claim_batch_id: string | null;
};
type Expense = {
  id: string;
  category: string;
  description: string;
  amount_inr: number;
  expense_date: string;
  created_at: string;
};

const STATUS_FILTERS = ["all", "paid", "created", "failed", "refunded"] as const;
const STATUS_LABELS: Record<(typeof STATUS_FILTERS)[number], string> = {
  all: "All",
  paid: "Paid",
  created: "Pending",
  failed: "Failed",
  refunded: "Refunded",
};
const EXPENSE_CATEGORY_LABELS = new Map<string, string>(EXPENSE_CATEGORIES.map((c) => [c.value, c.label]));
function categoryLabel(value: string) {
  return EXPENSE_CATEGORY_LABELS.get(value) ?? value;
}

function planLabel(planId: string) {
  const plan = membershipPlans.find((p) => p.id === planId);
  return plan ? `${plan.name} (${plan.label})` : planId;
}
function planPlots(planId: string) {
  return membershipPlans.find((p) => p.id === planId)?.plots ?? 0;
}
function statusTone(status: string): "green" | "gold" | "brown" {
  if (status === "paid") return "green";
  if (status === "created") return "gold";
  return "brown";
}

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; tab?: string }>;
}) {
  const { status: statusParam, q, tab } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const activeFilter = STATUS_FILTERS.includes(statusParam as (typeof STATUS_FILTERS)[number])
    ? (statusParam as (typeof STATUS_FILTERS)[number])
    : "all";

  const supabase = createServiceClient();

  const [
    { data: plotOwners },
    { data: allPayments },
    { data: usersData },
    { data: allExpenses },
    { data: seasonData },
    { data: installmentData },
    { data: receiptsData },
  ] =
    await Promise.all([
      supabase.from("khet_club_plots").select("user_id").not("user_id", "is", null),
      // Current season only — closing a season stamps its payments/expenses
      // with archived_season_id, so totals here never mix seasons.
      supabase.from("khet_club_payments").select("*").is("archived_season_id", null).order("created_at", { ascending: false }),
      listAllUsers(supabase),
      supabase.from("khet_club_expenses").select("*").is("archived_season_id", null).order("expense_date", { ascending: false }),
      supabase.rpc("khet_club_get_season"),
      // Oldest-due first, so the most overdue balance surfaces at the
      // top rather than getting lost under recent ones — the whole
      // point of this table is making "follow up manually" findable.
      supabase
        .from("khet_club_installment_plans")
        .select("id, user_id, plan_id, balance_due_inr, balance_due_date")
        .eq("balance_paid", false)
        .order("balance_due_date", { ascending: true }),
      supabase.from("khet_club_receipts").select("payment_id, receipt_number"),
    ]);

  const payments = (allPayments ?? []) as Payment[];
  const usersWithPlots = new Set(((plotOwners ?? []) as { user_id: string }[]).map((r) => r.user_id));
  const receiptByPayment = new Map(
    ((receiptsData ?? []) as { payment_id: string; receipt_number: string }[]).map((r) => [r.payment_id, r.receipt_number])
  );
  // Paid for a plan but no plots attached — the automatic refund after a
  // failed claim didn't go through. Needs a manual look.
  const needsReview = payments.filter((p) => p.status === "paid" && p.payment_kind !== "balance" && !p.claim_batch_id);
  const expenses = (allExpenses ?? []) as Expense[];
  const filteredExpenses = query
    ? expenses.filter((e) =>
        [categoryLabel(e.category), e.description].join(" ").toLowerCase().includes(query)
      )
    : expenses;
  const usersById = new Map((usersData?.users ?? []).map((u) => [u.id, u]));
  const installmentPlans = (installmentData ?? []) as {
    id: string;
    user_id: string;
    plan_id: string;
    balance_due_inr: number;
    balance_due_date: string;
  }[];
  const totalBalanceOwed = installmentPlans.reduce((sum, ip) => sum + ip.balance_due_inr, 0);
  const publicFFFTotal = (seasonData as { fff_collected_inr: number }[] | null)?.[0]?.fff_collected_inr ?? 0;

  const paid = payments.filter((p) => p.status === "paid");
  const pending = payments.filter((p) => p.status === "created");
  const failed = payments.filter((p) => p.status === "failed");
  const refunded = payments.filter((p) => p.status === "refunded");

  const totalRevenue = paid.reduce((sum, p) => sum + p.amount, 0);
  // Refunded payments are already status "refunded", not "paid", so they're
  // already excluded from totalRevenue — subtracting them again would
  // under-report income.
  const netRevenue = totalRevenue;
  // One purchase = one order. A 50/50 balance payment belongs to the same
  // purchase as its deposit, so it's excluded from order counts and the
  // Feeding Families Fund (otherwise both would be double-counted).
  const orders = paid.filter((p) => p.payment_kind !== "balance");
  const feedingFamiliesFund = orders.reduce((sum, p) => sum + planPlots(p.plan_id) * FEEDING_FAMILIES_PER_PLOT, 0);

  const now = new Date();
  // "This month" in India time, not the server's UTC clock.
  const thisMonth = todayInIndia().slice(0, 7);
  const monthOf = (iso: string) => todayInIndia(new Date(iso)).slice(0, 7);
  const thisMonthRevenue = paid
    .filter((p) => monthOf(p.created_at) === thisMonth)
    .reduce((sum, p) => sum + p.amount, 0);
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount_inr, 0) * 100; // normalize to paise for comparison
  const thisMonthExpenses = expenses
    .filter((e) => e.expense_date.slice(0, 7) === thisMonth)
    .reduce((sum, e) => sum + e.amount_inr, 0);

  const netPosition = (netRevenue - totalExpenses) / 100;

  const expensesByCategory = new Map<string, number>();
  for (const e of expenses) {
    expensesByCategory.set(e.category, (expensesByCategory.get(e.category) ?? 0) + e.amount_inr);
  }

  // --- Checkout funnel --------------------------------------------------
  // A payment row is created the moment someone opens the Razorpay
  // window, and only flips to 'paid' on success — so rows stuck at
  // 'created' are people who started buying and didn't finish.
  //
  // Age matters: an order from five minutes ago is genuinely still in
  // progress, while one from three days ago is abandoned. Labelling
  // both "Pending" (as this page used to) hides the difference and makes
  // the abandoned ones invisible. One hour is a generous cutoff — no
  // real checkout takes that long.
  const ABANDON_AFTER_MINUTES = 60;
  // One timestamp for the whole render — calling Date.now() inside the
  // JSX would be an impure call during render (React flags it), and
  // would also let different rows compute their age against slightly
  // different "now" values.
  const nowMs = now.getTime();
  const abandonCutoff = new Date(nowMs - ABANDON_AFTER_MINUTES * 60 * 1000);
  const inProgress = pending.filter((p) => new Date(p.created_at) > abandonCutoff);
  const abandoned = pending
    .filter((p) => new Date(p.created_at) <= abandonCutoff)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((p) => ({
      ...p,
      daysAgo: Math.floor((nowMs - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    }));

  const abandonedValue = abandoned.reduce((sum, p) => sum + p.amount, 0);
  // Conversion is measured against settled attempts only — orders still
  // legitimately in progress haven't had a chance to convert yet, so
  // counting them would understate the real rate.
  const settledAttempts = paid.length + abandoned.length + failed.length;
  const conversionRate = settledAttempts > 0 ? Math.round((paid.length / settledAttempts) * 100) : 0;

  const byStatus = activeFilter === "all" ? payments : payments.filter((p) => p.status === activeFilter);  const filtered = query
    ? byStatus.filter((p) => {
        const u = usersById.get(p.user_id);
        const haystack = [
          u?.user_metadata?.full_name as string | undefined,
          u?.email,
          p.razorpay_order_id,
          p.razorpay_payment_id,
          planLabel(p.plan_id),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
    : byStatus;

  const netSummary = (
    <Card className={cn("mb-6 p-5", netPosition >= 0 ? "bg-[var(--color-green-soft)]" : "bg-[var(--color-live)]/10")}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Net Position</p>
          <p className={cn("font-display text-3xl", netPosition >= 0 ? "text-[var(--color-green-deep)]" : "text-[var(--color-live)]")}>
            ₹{netPosition.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="flex gap-8 text-sm">
          <div>
            <p className="text-xs text-[var(--color-ink-soft)]">Net Income</p>
            <p className="font-medium">₹{(netRevenue / 100).toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-soft)]">Total Expenses</p>
            <p className="font-medium">₹{(totalExpenses / 100).toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>
    </Card>
  );

  const incomeContent = (
    <div className="p-6 sm:px-10">
      {netSummary}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Revenue (Paid)", value: `₹${(totalRevenue / 100).toLocaleString("en-IN")}` },
          { label: "This Month", value: `₹${(thisMonthRevenue / 100).toLocaleString("en-IN")}` },
          { label: "FFF Earmarked (Auto, from Paid Orders)", value: `₹${feedingFamiliesFund.toLocaleString("en-IN")}` },
          { label: "Avg. Order Value", value: `₹${(avgOrderValue / 100).toLocaleString("en-IN")}` },
          { label: "Paid Transactions", value: String(paid.length) },
          { label: "In Progress (<1hr)", value: String(inProgress.length) },
          { label: "Failed", value: String(failed.length) },
          { label: "Refunded", value: String(refunded.length) },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{s.label}</p>
            <p className="mt-2 font-display text-2xl">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Checkout Funnel
          </p>
          <p className="text-xs text-[var(--color-ink-soft)]">
            A payment record is created the moment someone opens the payment
            window — anything still unpaid after an hour is treated as abandoned.
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div>
            <p className="font-display text-2xl">{settledAttempts}</p>
            <p className="text-xs text-[var(--color-ink-soft)]">Checkouts started</p>
          </div>
          <div>
            <p className="font-display text-2xl text-[var(--color-green-deep)]">{paid.length}</p>
            <p className="text-xs text-[var(--color-ink-soft)]">Completed</p>
          </div>
          <div>
            <p className="font-display text-2xl">{conversionRate}%</p>
            <p className="text-xs text-[var(--color-ink-soft)]">Conversion rate</p>
          </div>
          <div>
            <p className="font-display text-2xl text-[var(--color-live)]">
              ₹{(abandonedValue / 100).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              Abandoned value ({abandoned.length})
            </p>
          </div>
        </div>

        {abandoned.length > 0 && (
          <div className="mt-5 border-t border-[var(--color-ink)]/10 pt-4">
            <p className="text-sm font-medium">
              People who started but didn&apos;t finish
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
              These are real, contactable people who wanted a plot. A short
              WhatsApp or call asking whether they hit a problem is usually
              worth more than any amount of new advertising.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-[var(--color-ink)]/10 text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                  <tr>
                    <th className="px-2 py-2 font-medium">Member</th>
                    <th className="px-2 py-2 font-medium">Contact</th>
                    <th className="px-2 py-2 font-medium">Plan</th>
                    <th className="px-2 py-2 font-medium">Amount</th>
                    <th className="px-2 py-2 font-medium">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-ink)]/10">
                  {abandoned.map((p) => {
                    const u = usersById.get(p.user_id);
                    const name = (u?.user_metadata?.full_name as string) || "—";
                    const phone = (u?.user_metadata?.phone as string) || "";
                    const email = u?.email ?? "";
                    return (
                      <tr key={p.id}>
                        <td className="px-2 py-2.5 font-medium">{name}</td>
                        <td className="px-2 py-2.5 text-xs text-[var(--color-ink-soft)]">
                          {phone && (
                            <a
                              href={`https://wa.me/91${phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-[var(--color-green-deep)] hover:underline"
                            >
                              {phone}
                            </a>
                          )}
                          {phone && email && " · "}
                          {email}
                        </td>
                        <td className="px-2 py-2.5">{planLabel(p.plan_id)}</td>
                        <td className="px-2 py-2.5 font-mono-data">
                          ₹{(p.amount / 100).toLocaleString("en-IN")}
                          {p.discount_inr > 0 && (
                            <span className="ml-1 text-xs text-[var(--color-brown)]">
                              (had discount)
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-xs text-[var(--color-ink-soft)]">
                          {p.daysAgo === 0 ? "Today" : `${p.daysAgo}d ago`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {needsReview.length > 0 && (
        <Card className="mt-6 border-[var(--color-live)]/40 bg-[var(--color-live)]/5 p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-live)]">
            Needs review — payments not linked to any plots ({needsReview.length})
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            These payments succeeded but no plots were assigned for them (e.g. the plot claim failed and the automatic refund
            didn&apos;t go through, or a test payment). Check each one: refund it in Razorpay and mark it refunded below, or
            assign plots by hand in Members.
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {needsReview.map((p) => {
              const u = usersById.get(p.user_id);
              return (
                <div key={p.id} className="flex flex-wrap justify-between gap-2">
                  <span>
                    <span className="font-medium">{(u?.user_metadata?.full_name as string) || u?.email || "Unknown"}</span>{" "}
                    <span className="text-[var(--color-ink-soft)]">
                      · {u?.email ?? "—"} · {planLabel(p.plan_id)} ·{" "}
                      {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
                      {usersWithPlots.has(p.user_id) ? " · holds other plots" : " · holds no plots"}
                    </span>
                  </span>
                  <span className="font-mono-data">₹{(p.amount / 100).toLocaleString("en-IN")} · {p.razorpay_payment_id ?? p.razorpay_order_id}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {installmentPlans.length > 0 && (
        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Balance Due — 50-50 Plans
            </p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              {installmentPlans.length} unpaid · ₹{totalBalanceOwed.toLocaleString("en-IN")} total ·
              oldest due first
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-[var(--color-ink)]/10 text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                <tr>
                  <th className="px-2 py-2 font-medium">Member</th>
                  <th className="px-2 py-2 font-medium">Contact</th>
                  <th className="px-2 py-2 font-medium">Plan</th>
                  <th className="px-2 py-2 font-medium">Amount owed</th>
                  <th className="px-2 py-2 font-medium">Due</th>
                  <th className="px-2 py-2 font-medium">Paid offline?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink)]/10">
                {installmentPlans.map((ip) => {
                  const u = usersById.get(ip.user_id);
                  const name = (u?.user_metadata?.full_name as string) || "—";
                  const phone = (u?.user_metadata?.phone as string) || "";
                  const email = u?.email ?? "";
                  const due = new Date(ip.balance_due_date);
                  const daysLeft = Math.ceil((due.getTime() - nowMs) / (1000 * 60 * 60 * 24));
                  const overdue = daysLeft < 0;
                  return (
                    <tr key={ip.id}>
                      <td className="px-2 py-2.5 font-medium">{name}</td>
                      <td className="px-2 py-2.5 text-xs text-[var(--color-ink-soft)]">
                        {phone && (
                          <a
                            href={`https://wa.me/91${phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-[var(--color-green-deep)] hover:underline"
                          >
                            {phone}
                          </a>
                        )}
                        {phone && email && " · "}
                        {email}
                      </td>
                      <td className="px-2 py-2.5">{planLabel(ip.plan_id)}</td>
                      <td className="px-2 py-2.5 font-mono-data">
                        ₹{ip.balance_due_inr.toLocaleString("en-IN")}
                      </td>
                      <td className={`px-2 py-2.5 text-xs ${overdue ? "font-medium text-[var(--color-live)]" : "text-[var(--color-ink-soft)]"}`}>
                        {due.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
                        {overdue ? ` — ${Math.abs(daysLeft)}d overdue` : ` — ${daysLeft}d left`}
                        {(() => {
                          // Same late rule the member sees (lib/demo-data.ts).
                          const st = balanceStage(ip.balance_due_date, todayInIndia(new Date(nowMs)));
                          if (st.stage === "late")
                            return <span className="block">+ ₹{balanceLateFeeInr(ip.plan_id).toLocaleString("en-IN")} late fee now applies</span>;
                          if (st.stage === "released")
                            return <span className="block font-semibold">Past 55 days — release these plots & handle deposit per refund policy</span>;
                          return null;
                        })()}
                      </td>
                      <td className="px-2 py-2.5">
                        <details>
                          <summary className="cursor-pointer text-xs font-medium text-[var(--color-green)] hover:underline">Mark paid</summary>
                          <ActionForm action={adminMarkBalancePaidOffline} className="mt-2 flex flex-col gap-1.5">
                            <input type="hidden" name="installmentPlanId" value={ip.id} />
                            <select name="method" required defaultValue="" className="input py-1 text-xs">
                              <option value="" disabled>Paid by…</option>
                              <option value="cash">Cash</option>
                              <option value="upi">UPI</option>
                              <option value="bank_transfer">Bank transfer</option>
                              <option value="cheque">Cheque</option>
                              <option value="other">Other</option>
                            </select>
                            <input name="reference" placeholder="Reference (optional)" className="input py-1 text-xs" />
                            <Button type="submit" size="sm" variant="outline">Confirm</Button>
                          </ActionForm>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="mt-6 max-w-lg p-5">
        <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
          Public Feeding Families Fund Total
        </p>
        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
          This is the number shown on the homepage — set it directly here.
          It doesn&apos;t have to match the auto-earmarked figure above exactly
          (e.g. it can reflect what&apos;s actually been spent on wheat
          donations, or include offline contributions the payment system
          never saw).
        </p>
        <ActionForm action={adminUpdateFFFAmount} className="mt-4 flex items-end gap-3">
          <label className="block flex-1">
            <span className="mb-1.5 block text-sm font-medium">Amount (₹)</span>
            <input name="fffCollectedInr" type="number" min={0} step={1} defaultValue={publicFFFTotal} className="input" />
          </label>
          <Button type="submit">Save</Button>
        </ActionForm>
        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
          ≈ {Math.round((publicFFFTotal / 1000) * 2)} families, at 2 families per ₹1,000 —
          shown on the homepage automatically from this amount.
        </p>
      </Card>

      <form method="GET" className="mt-6 flex flex-wrap items-center gap-2">
        {activeFilter !== "all" && <input type="hidden" name="status" value={activeFilter} />}
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by member, email, order ID, or plan…"
          className="input max-w-md flex-1"
        />
        <Button type="submit" variant="outline">Search</Button>
        {query && (
          <Link href={activeFilter !== "all" ? `/admin/income?status=${activeFilter}` : "/admin/income"} className="text-xs font-medium text-[var(--color-ink-soft)] hover:underline">
            Clear
          </Link>
        )}
      </form>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] px-5 py-3">
          <p className="text-sm font-medium">Transactions ({filtered.length})</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <Link
                key={f}
                href={f === "all" ? "/admin/income" : `/admin/income?status=${f}`}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activeFilter === f
                    ? "bg-[var(--color-green)] text-white"
                    : "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)] hover:bg-[var(--color-ink)]/10"
                )}
              >
                {STATUS_LABELS[f]}
              </Link>
            ))}
            <a
              href="/api/admin/export/income"
              className="ml-2 flex items-center gap-1.5 rounded-full border border-[var(--color-ink)]/15 px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-green)] hover:text-[var(--color-green-deep)]"
            >
              <Download className="h-3 w-3" /> Export CSV
            </a>
          </div>
        </div>

        <div className="max-h-[560px] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="sticky top-0 border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Feeding Families</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ink)]/10">
              {filtered.map((p) => {
                const user = usersById.get(p.user_id);
                const name = (user?.user_metadata?.full_name as string) || user?.email || "Unknown";
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">
                      {new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-[var(--color-ink-soft)]">{user?.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-2.5">{planLabel(p.plan_id)}</td>
                    <td className="px-4 py-2.5 font-mono-data font-medium">₹{(p.amount / 100).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-xs text-[var(--color-brown)]">
                      {p.status === "paid" && p.payment_kind !== "balance" ? `₹${(planPlots(p.plan_id) * FEEDING_FAMILIES_PER_PLOT).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-4 py-2.5"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                    <td className="px-4 py-2.5 font-mono-data text-xs text-[var(--color-ink-soft)]">
                      {p.razorpay_order_id}
                      {receiptByPayment.has(p.id) && (
                        <a href={`/api/receipt/download?payment=${p.id}`} className="mt-0.5 block font-sans font-medium text-[var(--color-green)] hover:underline">
                          Receipt {receiptByPayment.get(p.id)}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {p.status === "paid" && (
                        <details className="inline-block text-left">
                          <summary className="cursor-pointer text-xs text-[var(--color-ink-soft)] hover:underline">Refunded?</summary>
                          <ActionForm action={adminMarkPaymentRefunded} className="mt-2 flex w-48 flex-col gap-1.5">
                            <input type="hidden" name="paymentId" value={p.id} />
                            <p className="text-[11px] text-[var(--color-ink-soft)]">
                              Only records it. Do the actual refund in your Razorpay dashboard.
                            </p>
                            <input name="confirm" placeholder="Type REFUNDED" autoComplete="off" className="input py-1 text-xs" />
                            <Button type="submit" size="sm" variant="outline">Mark refunded</Button>
                          </ActionForm>
                        </details>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">No transactions in this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 max-w-2xl text-xs text-[var(--color-ink-soft)]">
        Amounts shown are what Razorpay actually recorded for each order.
        &ldquo;Pending&rdquo; orders were created but never completed by
        the customer — no plot was assigned for these. Feeding Families
        Fund is earmarked from paid orders only, at ₹1,000 per plot.
      </p>
    </div>
  );

  const expensesContent = (
    <div className="p-6 sm:px-10">
      {netSummary}

      <Card className="max-w-lg p-5">
        <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Record an Expense</p>
        <ActionForm action={adminAddExpense} className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Category</span>
            <select name="category" required defaultValue="" className="input">
              <option value="" disabled>Choose a category</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Description</span>
            <input name="description" required className="input" placeholder="e.g. RAJ 1482 seed purchase, 40 quintals" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Amount (₹)</span>
              <input name="amount" type="number" min={1} step={1} required className="input" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Date</span>
              <input name="expenseDate" type="date" required className="input" />
            </label>
          </div>
          <Button type="submit" className="w-full">Add Expense</Button>
        </ActionForm>
      </Card>

      {expensesByCategory.size > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(expensesByCategory.entries()).map(([category, total]) => (
            <Card key={category} className="p-4">
              <p className="text-xs text-[var(--color-ink-soft)]">{categoryLabel(category)}</p>
              <p className="mt-1 font-display text-xl">₹{total.toLocaleString("en-IN")}</p>
            </Card>
          ))}
        </div>
      )}

      <form method="GET" className="mt-6 flex flex-wrap items-center gap-2">
        <input type="hidden" name="tab" value="expenses" />
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by category or description…"
          className="input max-w-md flex-1"
        />
        <Button type="submit" variant="outline">Search</Button>
        {query && (
          <Link href="/admin/income?tab=expenses" className="text-xs font-medium text-[var(--color-ink-soft)] hover:underline">
            Clear
          </Link>
        )}
      </form>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] px-5 py-3">
          <p className="text-sm font-medium">Expense Log ({filteredExpenses.length}{query ? ` of ${expenses.length}` : ""})</p>
          <div className="flex items-center gap-3">
            <p className="text-xs text-[var(--color-ink-soft)]">This month: ₹{thisMonthExpenses.toLocaleString("en-IN")}</p>
            <a
              href="/api/admin/export/expenses"
              className="flex items-center gap-1.5 rounded-full border border-[var(--color-ink)]/15 px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-green)] hover:text-[var(--color-green-deep)]"
            >
              <Download className="h-3 w-3" /> Export CSV
            </a>
          </div>
        </div>
        <div className="max-h-[480px] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ink)]/10">
              {filteredExpenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">
                    {new Date(e.expense_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
                  </td>
                  <td className="px-4 py-2.5"><Badge tone="brown">{categoryLabel(e.category)}</Badge></td>
                  <td className="px-4 py-2.5">{e.description}</td>
                  <td className="px-4 py-2.5 font-mono-data font-medium">₹{e.amount_inr.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5 text-right">
                    <ActionForm action={adminDeleteExpense} confirmMessage="Delete this expense?">
                      <input type="hidden" name="id" value={e.id} />
                      <button className="text-xs font-medium text-[var(--color-live)] hover:underline">Delete</button>
                    </ActionForm>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">
                  {query ? `No expenses match "${q}".` : "No expenses recorded yet."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div>
      <PageHeader title="Finance" subtitle="Real income and expenses — not projections." />
      <Tabs
        defaultTab={tab}
        tabs={[
          { id: "income", label: "Income", content: incomeContent },
          { id: "expenses", label: "Expenses", content: expensesContent },
        ]}
      />
    </div>
  );
}
