"use server";

import { ok, fail, type ActionResult } from "@/lib/action-result";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createSessionClient } from "@/lib/supabase/session";
import { EXPENSE_CATEGORIES } from "@/lib/demo-data";

const VALID_CATEGORY_VALUES = EXPENSE_CATEGORIES.map((c) => c.value);

export async function adminAddExpense(formData: FormData): Promise<ActionResult> {
  const category = String(formData.get("category") || "");
  const description = String(formData.get("description") || "").trim();
  const amountRaw = String(formData.get("amount") || "");
  const expenseDate = String(formData.get("expenseDate") || "");

  if (!VALID_CATEGORY_VALUES.includes(category as (typeof VALID_CATEGORY_VALUES)[number]) || !description || !expenseDate) return fail("Fill in the amount, category and description.");
  const amount = Math.round(Number(amountRaw));
  if (!Number.isFinite(amount) || amount <= 0) return fail("Fill in the amount, category and description.");

  const sessionSupabase = await createSessionClient();
  const {
    data: { user: admin },
  } = await sessionSupabase.auth.getUser();

  const supabase = createServiceClient();
  const { error } = await supabase.from("khet_club_expenses").insert({
    category,
    description,
    amount_inr: amount,
    expense_date: expenseDate,
    created_by: admin?.id ?? null,
  });

  if (error) {
    console.error("adminAddExpense failed:", error);
    return fail("Couldn't save the expense.");
  }

  revalidatePath("/admin/income");
  return ok("Expense added.");
}

export async function adminDeleteExpense(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") || "");
  if (!id) return fail("Missing expense reference.");

  const supabase = createServiceClient();
  const { error } = await supabase.from("khet_club_expenses").delete().eq("id", id);
  if (error) {
    console.error("adminDeleteExpense failed:", error);
    return fail("Couldn't delete the expense.");
  }

  revalidatePath("/admin/income");
  return ok("Expense deleted.");
}
