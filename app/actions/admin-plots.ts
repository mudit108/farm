"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { membershipPlans } from "@/lib/demo-data";

/**
 * These actions are only reachable through pages under /admin, which
 * proxy.ts gates behind a real Supabase Auth session + the ADMIN_EMAILS
 * allowlist. Server Actions submit back to their originating page's URL,
 * so that protection covers these requests too.
 */

function revalidateAll() {
  revalidatePath("/admin/members");
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/select-plot");
  revalidatePath("/dashboard/my-farm");
  revalidatePath("/dashboard/my-farm");
}

// Frees a single plot (per-row "Free Up" button in the table).
export async function adminMarkPlotAvailable(formData: FormData): Promise<void> {
  const plotNumber = Number(formData.get("plotNumber"));
  if (!Number.isInteger(plotNumber)) return;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_plots")
    .update({
      status: "available",
      user_id: null,
      full_name: null,
      phone: null,
      email: null,
      city: null,
      plan_id: null,
      claim_batch_id: null,
      assigned_at: null,
    })
    .eq("plot_number", plotNumber);

  if (error) {
    console.error("adminMarkPlotAvailable failed:", error);
    return;
  }

  revalidateAll();
}

// Quick, single-plot fill for an individual row (no plan attached — an
// ad-hoc offline reservation, distinct from a proper plan assignment).
export async function adminMarkPlotFilled(formData: FormData): Promise<void> {
  const plotNumber = Number(formData.get("plotNumber"));
  if (!Number.isInteger(plotNumber)) return;

  const fullName = String(formData.get("fullName") || "").trim() || "Reserved by Admin";
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || null;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_plots")
    .update({
      status: "filled",
      full_name: fullName,
      phone,
      email,
      city,
      plan_id: null,
      claim_batch_id: null,
      assigned_at: new Date().toISOString(),
    })
    .eq("plot_number", plotNumber);

  if (error) {
    console.error("adminMarkPlotFilled failed:", error);
    return;
  }

  revalidateAll();
}

// Frees an entire batch (e.g. all 3 plots from one "3 Plots" plan claim)
// in one action, for the grouped members view.
export async function adminFreeBatch(formData: FormData): Promise<void> {
  const claimBatchId = String(formData.get("claimBatchId") || "");
  if (!claimBatchId) return;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_plots")
    .update({
      status: "available",
      user_id: null,
      full_name: null,
      phone: null,
      email: null,
      city: null,
      plan_id: null,
      claim_batch_id: null,
      assigned_at: null,
    })
    .eq("claim_batch_id", claimBatchId);

  if (error) {
    console.error("adminFreeBatch failed:", error);
    return;
  }

  revalidateAll();
}

// Manually assign a full PLAN (1/3/6 plots) to an offline reservation —
// the admin-side equivalent of a customer picking a plan themselves.
export async function adminAssignPlan(formData: FormData): Promise<void> {
  const planId = String(formData.get("planId") || "");
  const plan = membershipPlans.find((p) => p.id === planId);
  if (!plan) return;

  const fullName = String(formData.get("fullName") || "").trim() || "Reserved by Admin";
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || null;

  const supabase = createServiceClient();

  const { data: available, error: fetchError } = await supabase
    .from("khet_club_plots")
    .select("plot_number")
    .eq("status", "available")
    .order("plot_number")
    .limit(plan.plots);

  if (fetchError) {
    console.error("adminAssignPlan lookup failed:", fetchError);
    return;
  }
  if (!available || available.length < plan.plots) {
    console.error("adminAssignPlan: not enough available plots for", planId);
    return;
  }

  const plotNumbers = available.map((p) => p.plot_number as number);
  const batchId = randomUUID();

  const { error } = await supabase
    .from("khet_club_plots")
    .update({
      status: "filled",
      full_name: fullName,
      phone,
      email,
      city,
      plan_id: planId,
      claim_batch_id: batchId,
      assigned_at: new Date().toISOString(),
    })
    .in("plot_number", plotNumbers);

  if (error) {
    console.error("adminAssignPlan update failed:", error);
    return;
  }

  revalidateAll();
}
