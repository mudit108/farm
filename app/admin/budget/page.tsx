import { AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { ActionForm } from "@/components/admin/action-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createServiceClient } from "@/lib/supabase/service";
import { FEEDING_FAMILIES_PER_PLOT, EXPENSE_TO_BUDGET, membershipPlans } from "@/lib/demo-data";
import { adminUpdateBudgetPercents, adminSetBudgetOverride } from "@/app/actions/admin-budget";

export const dynamic = "force-dynamic";

type BudgetRow = {
  category: string;
  label: string;
  percent: number;
  manual_amount_inr: number | null;
  sort_order: number;
  note: string | null;
};

function planPlots(planId: string | null) {
  return membershipPlans.find((p) => p.id === planId)?.plots ?? 0;
}

export default async function AdminBudgetPage() {
  const supabase = createServiceClient();

  const [{ data: budgetData }, { data: paymentsData }, { data: expensesData }] = await Promise.all([
    supabase.from("khet_club_budget").select("*").order("sort_order"),
    supabase.from("khet_club_payments").select("plan_id, amount, status, payment_kind").eq("status", "paid").is("archived_season_id", null),
    supabase.from("khet_club_expenses").select("category, amount_inr").is("archived_season_id", null),
  ]);

  const budget = (budgetData ?? []) as BudgetRow[];
  const payments = (paymentsData ?? []) as { plan_id: string; amount: number; payment_kind: string }[];
  const expenses = (expensesData ?? []) as { category: string; amount_inr: number }[];

  // Revenue in rupees (payments are stored in paise).
  const grossRevenue = payments.reduce((sum, p) => sum + p.amount, 0) / 100;

  // The Feeding Families Fund is committed out of every membership
  // BEFORE anything is allocated — it's already promised to wheat
  // donations, so it isn't available to spend on farming or marketing.
  // Allocating percentages against gross revenue would silently
  // over-commit by this amount.
  // Counted once per purchase — a 50/50 balance payment is the same
  // membership as its deposit, not a second one.
  const fffCommitted = payments
    .filter((p) => p.payment_kind !== "balance")
    .reduce((sum, p) => sum + planPlots(p.plan_id) * FEEDING_FAMILIES_PER_PLOT, 0);
  const allocatable = Math.max(grossRevenue - fffCommitted, 0);

  // Actual spend, rolled up from granular expense categories into
  // budget buckets. Feeding Families donations are excluded — they're
  // funded by the earmark above, not by a budget line.
  const spentByBucket = new Map<string, number>();
  let fffSpent = 0;
  for (const e of expenses) {
    if (e.category === "feeding_families") {
      fffSpent += e.amount_inr;
      continue;
    }
    const bucket = EXPENSE_TO_BUDGET[e.category] ?? "operations";
    spentByBucket.set(bucket, (spentByBucket.get(bucket) ?? 0) + e.amount_inr);
  }

  // Fixed-amount lines are taken off the top first; percentage lines share
  // what's left. Otherwise fixed + percentage lines together could promise
  // more money than actually exists.
  const fixedTotal = budget.reduce((s, b) => s + (b.manual_amount_inr ?? 0), 0);
  const percentPool = Math.max(allocatable - fixedTotal, 0);
  const rows = budget.map((b) => {
    const allocated = b.manual_amount_inr ?? Math.round((percentPool * b.percent) / 100);
    const spent = spentByBucket.get(b.category) ?? 0;
    const remaining = allocated - spent;
    const usedPct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
    return { ...b, allocated, spent, remaining, usedPct, isOverride: b.manual_amount_inr !== null };
  });

  const totalAllocated = rows.reduce((s, r) => s + r.allocated, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const percentTotal = budget.reduce((s, b) => s + Number(b.percent), 0);
  const overBudget = rows.filter((r) => r.spent > r.allocated && r.allocated > 0);
  const nearLimit = rows.filter((r) => r.usedPct >= 80 && r.spent <= r.allocated && r.allocated > 0);

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  return (
    <>
      <PageHeader title="Budget" subtitle="Allocation, spend, and what's left" />

      <div className="p-6 sm:px-10">
        {/* Revenue basis — stated explicitly so the numbers below are
            traceable rather than appearing from nowhere. */}
        <Card className="p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            What the budget is calculated from
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="font-display text-2xl">{fmt(grossRevenue)}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">Revenue received (paid orders)</p>
            </div>
            <div>
              <p className="font-display text-2xl text-[var(--color-brown)]">−{fmt(fffCommitted)}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                Feeding Families Fund (₹{FEEDING_FAMILIES_PER_PLOT.toLocaleString("en-IN")}/plot, already committed)
              </p>
            </div>
            <div>
              <p className="font-display text-2xl text-[var(--color-green-deep)]">{fmt(allocatable)}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">Allocatable across the budget</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-[var(--color-ink-soft)]">
            The Feeding Families Fund is deducted before allocation because it&apos;s
            already promised to wheat donations — it isn&apos;t money available to
            spend on farming or marketing. Allocating against gross revenue instead
            would over-commit by {fmt(fffCommitted)}.
            {fffSpent > 0 && ` So far ${fmt(fffSpent)} has actually been donated.`}
          </p>
        </Card>

        {/* Alerts */}
        {(overBudget.length > 0 || nearLimit.length > 0) && (
          <div className="mt-4 space-y-2">
            {overBudget.map((r) => (
              <div
                key={r.category}
                className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-live)]/30 bg-[var(--color-live)]/10 px-4 py-3 text-sm"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-live)]" />
                <span>
                  <strong>{r.label}</strong> is over budget by {fmt(r.spent - r.allocated)} —
                  spent {fmt(r.spent)} of {fmt(r.allocated)}.
                </span>
              </div>
            ))}
            {nearLimit.map((r) => (
              <div
                key={r.category}
                className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-4 py-3 text-sm"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brown)]" />
                <span>
                  <strong>{r.label}</strong> is at {r.usedPct}% of budget — {fmt(r.remaining)} left.
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Allocation table */}
        <Card className="mt-4 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Allocation &amp; Spend
            </p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              Allocated {fmt(totalAllocated)} · Spent {fmt(totalSpent)} · Left{" "}
              {fmt(totalAllocated - totalSpent)}
            </p>
          </div>

          <ActionForm action={adminUpdateBudgetPercents} className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-[var(--color-ink)]/10 text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                  <tr>
                    <th className="px-2 py-2 font-medium">Category</th>
                    <th className="px-2 py-2 font-medium">%</th>
                    <th className="px-2 py-2 font-medium">Allocated</th>
                    <th className="px-2 py-2 font-medium">Spent</th>
                    <th className="px-2 py-2 font-medium">Remaining</th>
                    <th className="px-2 py-2 font-medium">Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-ink)]/10">
                  {rows.map((r) => (
                    <tr key={r.category}>
                      <td className="px-2 py-3">
                        <p className="font-medium">{r.label}</p>
                        {r.note && (
                          <p className="mt-0.5 max-w-sm text-xs text-[var(--color-ink-soft)]">{r.note}</p>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <input
                          name={`percent_${r.category}`}
                          defaultValue={Number(r.percent)}
                          type="number"
                          step="0.5"
                          min={0}
                          max={100}
                          className="w-20 rounded-[var(--radius-sm)] border border-[var(--color-ink)]/15 bg-[var(--color-surface)] px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-2 py-3 font-mono-data">
                        {fmt(r.allocated)}
                        {r.isOverride && (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-[var(--color-brown)]">
                            <Lock className="h-3 w-3" /> fixed
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 font-mono-data">{fmt(r.spent)}</td>
                      <td
                        className={`px-2 py-3 font-mono-data ${r.remaining < 0 ? "text-[var(--color-live)]" : ""}`}
                      >
                        {fmt(r.remaining)}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--color-ink)]/10">
                            <div
                              className={`h-full rounded-full ${
                                r.usedPct > 100
                                  ? "bg-[var(--color-live)]"
                                  : r.usedPct >= 80
                                    ? "bg-[var(--color-gold)]"
                                    : "bg-[var(--color-green)]"
                              }`}
                              style={{ width: `${Math.min(r.usedPct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--color-ink-soft)]">{r.usedPct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="submit" size="sm">Save Percentages</Button>
              <span
                className={`flex items-center gap-1.5 text-xs ${
                  Math.abs(percentTotal - 100) < 0.01
                    ? "text-[var(--color-green-deep)]"
                    : "text-[var(--color-live)]"
                }`}
              >
                {Math.abs(percentTotal - 100) < 0.01 ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Totals 100%
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" /> Currently totals {percentTotal.toFixed(2)}% — must be 100%
                  </>
                )}
              </span>
            </div>
          </ActionForm>
        </Card>

        {/* Fixed-amount overrides */}
        <Card className="mt-4 p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Fixed Amounts (Override)
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Set a fixed rupee amount for a category when it shouldn&apos;t scale with
            revenue — a signed contract, or equipment already paid for. A fixed
            amount ignores the percentage. Leave blank and save to go back to
            percentage-based.
          </p>
          <div className="mt-4 space-y-2">
            {rows.map((r) => (
              <ActionForm
                key={r.category}
                action={adminSetBudgetOverride}
                className="flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="category" value={r.category} />
                <span className="w-56 text-sm">{r.label}</span>
                <input
                  name="amount"
                  defaultValue={r.manual_amount_inr ?? ""}
                  type="number"
                  min={0}
                  placeholder={`${Math.round((allocatable * Number(r.percent)) / 100)} (auto)`}
                  className="w-40 rounded-[var(--radius-sm)] border border-[var(--color-ink)]/15 bg-[var(--color-surface)] px-2 py-1 text-sm"
                />
                <button className="text-xs font-medium text-[var(--color-green-deep)] hover:underline">
                  Save
                </button>
              </ActionForm>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
