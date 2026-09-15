"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { ok, fail, type ActionResult } from "@/lib/action-result";

/**
 * Updates the percentage split across budget categories.
 *
 * Deliberately validates that the total is 100% before saving anything:
 * a budget that silently sums to 94% or 108% would quietly
 * under-allocate or over-commit real money for a whole season, and the
 * error would be invisible on a page full of plausible-looking numbers.
 */
export async function adminUpdateBudgetPercents(formData: FormData): Promise<ActionResult> {
  const supabase = createServiceClient();

  const { data: rows } = await supabase.from("khet_club_budget").select("category");
  if (!rows) return fail("Couldn't load budget categories.");

  const updates: { category: string; percent: number }[] = [];
  for (const r of rows) {
    const raw = formData.get(`percent_${r.category}`);
    if (raw === null) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return fail(`"${r.category}" has an invalid percentage.`);
    }
    updates.push({ category: r.category, percent: value });
  }

  const total = updates.reduce((sum, u) => sum + u.percent, 0);
  // Tolerance for floating-point display values like 37.5 + 8.5 + 6.5.
  if (Math.abs(total - 100) > 0.01) {
    return fail(`Percentages must total 100% — they currently total ${total.toFixed(2)}%.`);
  }

  for (const u of updates) {
    const { error } = await supabase
      .from("khet_club_budget")
      .update({ percent: u.percent, updated_at: new Date().toISOString() })
      .eq("category", u.category);
    if (error) {
      console.error("adminUpdateBudgetPercents failed:", error);
      return fail("Something went wrong saving the budget.");
    }
  }

  revalidatePath("/admin/budget");
  return ok("Budget percentages updated.");
}

/**
 * Sets or clears a fixed rupee override for one category. An override
 * wins over the percentage — for commitments that shouldn't scale with
 * revenue (a signed contract, a machine already bought).
 */
export async function adminSetBudgetOverride(formData: FormData): Promise<ActionResult> {
  const category = String(formData.get("category") || "");
  const raw = String(formData.get("amount") || "").trim();
  if (!category) return fail("Missing category.");

  const supabase = createServiceClient();

  if (raw === "") {
    const { error } = await supabase
      .from("khet_club_budget")
      .update({ manual_amount_inr: null, updated_at: new Date().toISOString() })
      .eq("category", category);
    if (error) {
      console.error("adminSetBudgetOverride clear failed:", error);
      return fail("Couldn't clear the override.");
    }
    revalidatePath("/admin/budget");
    return ok("Override cleared — back to percentage-based.");
  }

  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) return fail("Enter a valid amount.");

  const { error } = await supabase
    .from("khet_club_budget")
    .update({ manual_amount_inr: Math.round(amount), updated_at: new Date().toISOString() })
    .eq("category", category);
  if (error) {
    console.error("adminSetBudgetOverride failed:", error);
    return fail("Couldn't save the override.");
  }

  revalidatePath("/admin/budget");
  return ok("Fixed amount set for this category.");
}
