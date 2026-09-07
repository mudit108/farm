import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { createServiceClient } from "@/lib/supabase/service";
import { membershipPlans, FEEDING_FAMILIES_PER_PLOT, EXPENSE_CATEGORIES } from "@/lib/demo-data";
import { adminAddExpense, adminDeleteExpense } from "@/app/actions/admin-expenses";
import { adminUpdateFFFAmount } from "@/app/actions/admin-content";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Payment = {
  id: string;
  user_id: string;
  plan_id: string;
  razorpay_order_id: string;
  amount: number;
  status: "created" | "paid" | "failed" | "refunded";
  created_at: string;
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
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const activeFilter = STATUS_FILTERS.includes(statusParam as (typeof STATUS_FILTERS)[number])
    ? (statusParam as (typeof STATUS_FILTERS)[number])
    : "all";

  const supabase = createServiceClient();

  const [{ data: allPayments }, { data: usersData }, { data: allExpenses }, { data: seasonData }] = await Promise.all([
    supabase.from("khet_club_payments").select("*").order("created_at", { ascending: false }),
    supabase.auth.admin.listUsers(),
    supabase.from("khet_club_expenses").select("*").order("expense_date", { ascending: false }),
    supabase.rpc("khet_club_get_season"),
  ]);

  const payments = (allPayments ?? []) as Payment[];
  const expenses = (allExpenses ?? []) as Expense[];
  const usersById = new Map((usersData?.users ?? []).map((u) => [u.id, u]));
  const publicFFFTotal = (seasonData as { fff_collected_inr: number }[] | null)?.[0]?.fff_collected_inr ?? 0;

  const paid = payments.filter((p) => p.status === "paid");
  const pending = payments.filter((p) => p.status === "created");
  const failed = payments.filter((p) => p.status === "failed");
  const refunded = payments.filter((p) => p.status === "refunded");

  const totalRevenue = paid.reduce((sum, p) => sum + p.amount, 0);
  const refundedTotal = refunded.reduce((sum, p) => sum + p.amount, 0);
  const netRevenue = totalRevenue - refundedTotal;
  const feedingFamiliesFund = paid.reduce((sum, p) => sum + planPlots(p.plan_id) * FEEDING_FAMILIES_PER_PLOT, 0);

  const now = new Date();
  const thisMonthRevenue = paid
    .filter((p) => {
      const d = new Date(p.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);
  const avgOrderValue = paid.length > 0 ? Math.round(totalRevenue / paid.length) : 0;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount_inr, 0) * 100; // normalize to paise for comparison
  const thisMonthExpenses = expenses
    .filter((e) => {
      const d = new Date(e.expense_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount_inr, 0);

  const netPosition = (netRevenue - totalExpenses) / 100;

  const expensesByCategory = new Map<string, number>();
  for (const e of expenses) {
    expensesByCategory.set(e.category, (expensesByCategory.get(e.category) ?? 0) + e.amount_inr);
  }

  const filtered = activeFilter === "all" ? payments : payments.filter((p) => p.status === activeFilter);

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
          { label: "Pending", value: String(pending.length) },
          { label: "Failed", value: String(failed.length) },
          { label: "Refunded", value: String(refunded.length) },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{s.label}</p>
            <p className="mt-2 font-display text-2xl">{s.value}</p>
          </Card>
        ))}
      </div>

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
        <form action={adminUpdateFFFAmount} className="mt-4 flex items-end gap-3">
          <label className="block flex-1">
            <span className="mb-1.5 block text-sm font-medium">Amount (₹)</span>
            <input name="fffCollectedInr" type="number" min={0} step={1} defaultValue={publicFFFTotal} className="input" />
          </label>
          <Button type="submit">Save</Button>
        </form>
        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
          ≈ {Math.round((publicFFFTotal / 1000) * 2)} families, at 2 families per ₹1,000 —
          shown on the homepage automatically from this amount.
        </p>
      </Card>

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
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="sticky top-0 border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Feeding Families</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Order ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ink)]/10">
              {filtered.map((p) => {
                const user = usersById.get(p.user_id);
                const name = (user?.user_metadata?.full_name as string) || user?.email || "Unknown";
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">
                      {new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-[var(--color-ink-soft)]">{user?.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-2.5">{planLabel(p.plan_id)}</td>
                    <td className="px-4 py-2.5 font-mono-data font-medium">₹{(p.amount / 100).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-xs text-[var(--color-brown)]">
                      {p.status === "paid" ? `₹${(planPlots(p.plan_id) * FEEDING_FAMILIES_PER_PLOT).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-4 py-2.5"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                    <td className="px-4 py-2.5 font-mono-data text-xs text-[var(--color-ink-soft)]">{p.razorpay_order_id}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">No transactions in this filter.</td></tr>
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
        <form action={adminAddExpense} className="mt-4 space-y-4">
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
        </form>
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

      <Card className="mt-6 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] px-5 py-3">
          <p className="text-sm font-medium">Expense Log ({expenses.length})</p>
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
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">
                    {new Date(e.expense_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-2.5"><Badge tone="brown">{categoryLabel(e.category)}</Badge></td>
                  <td className="px-4 py-2.5">{e.description}</td>
                  <td className="px-4 py-2.5 font-mono-data font-medium">₹{e.amount_inr.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5 text-right">
                    <form action={adminDeleteExpense}>
                      <input type="hidden" name="id" value={e.id} />
                      <button className="text-xs font-medium text-[var(--color-live)] hover:underline">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">No expenses recorded yet.</td></tr>
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
        tabs={[
          { id: "income", label: "Income", content: incomeContent },
          { id: "expenses", label: "Expenses", content: expensesContent },
        ]}
      />
    </div>
  );
}
