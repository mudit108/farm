"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { createSessionClient } from "@/lib/supabase/session";
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

  // Read the plot first — needed both to decide whether this is a real
  // member's allocation and to archive what's about to be wiped.
  const { data: plot } = await supabase
    .from("khet_club_plots")
    .select("plot_number, user_id, full_name, phone, email, city, plan_id, claim_batch_id, assigned_at")
    .eq("plot_number", plotNumber)
    .maybeSingle();

  if (!plot) return;

  const wasMemberHeld = Boolean(plot.user_id);

  // Guard: a plot held by a real account is someone's paid allocation.
  // Clearing it requires the admin to type the plot number back, so a
  // stray click in a long table can't destroy a membership. Offline
  // reservations (no linked account) stay one-click, since there's no
  // member to harm.
  if (wasMemberHeld) {
    const confirmValue = String(formData.get("confirmPlotNumber") || "").trim();
    if (confirmValue !== String(plotNumber)) {
      console.warn(
        `adminMarkPlotAvailable blocked: plot ${plotNumber} is member-held and confirmation did not match.`
      );
      return;
    }
  }

  const session = await createSessionClient();
  const {
    data: { user: admin },
  } = await session.auth.getUser();

  // Archive before wiping — this is the only record of who held it.
  const { error: logError } = await supabase.from("khet_club_plot_clear_log").insert({
    plot_number: plot.plot_number,
    previous_user_id: plot.user_id,
    previous_full_name: plot.full_name,
    previous_phone: plot.phone,
    previous_email: plot.email,
    previous_city: plot.city,
    previous_plan_id: plot.plan_id,
    previous_claim_batch_id: plot.claim_batch_id,
    previous_assigned_at: plot.assigned_at,
    was_member_held: wasMemberHeld,
    cleared_by: admin?.id ?? null,
  });

  // If the archive fails, do NOT proceed — clearing without a record is
  // exactly the situation this is meant to prevent.
  if (logError) {
    console.error("adminMarkPlotAvailable aborted — could not archive plot:", logError);
    return;
  }

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

  // This removes an entire membership (up to 6 plots) at once, so it
  // always requires deliberate confirmation — there is no "safe" case
  // here the way there is for a single offline-reserved plot.
  const confirmValue = String(formData.get("confirmRemove") || "").trim().toUpperCase();
  if (confirmValue !== "REMOVE") {
    console.warn("adminFreeBatch blocked: confirmation text did not match.");
    return;
  }

  const supabase = createServiceClient();

  const { data: plots } = await supabase
    .from("khet_club_plots")
    .select("plot_number, user_id, full_name, phone, email, city, plan_id, claim_batch_id, assigned_at")
    .eq("claim_batch_id", claimBatchId);

  if (!plots || plots.length === 0) return;

  const session = await createSessionClient();
  const {
    data: { user: admin },
  } = await session.auth.getUser();

  // Archive every plot in the batch before wiping any of them.
  const { error: logError } = await supabase.from("khet_club_plot_clear_log").insert(
    plots.map((p) => ({
      plot_number: p.plot_number,
      previous_user_id: p.user_id,
      previous_full_name: p.full_name,
      previous_phone: p.phone,
      previous_email: p.email,
      previous_city: p.city,
      previous_plan_id: p.plan_id,
      previous_claim_batch_id: p.claim_batch_id,
      previous_assigned_at: p.assigned_at,
      was_member_held: Boolean(p.user_id),
      cleared_by: admin?.id ?? null,
    }))
  );

  if (logError) {
    console.error("adminFreeBatch aborted — could not archive plots:", logError);
    return;
  }

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
  const address = String(formData.get("address") || "").trim() || null;
  const pincode = String(formData.get("pincode") || "").trim() || null;

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
      address,
      pincode,
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

/**
 * Edit a member's contact/address details after the fact — corrects what
 * was captured at signup/assignment, and is the only way to backfill
 * address + pincode for members who registered before those fields
 * existed. Updates every plot row in the batch (a member with multiple
 * plots has one row per plot, all sharing the same contact fields, same
 * pattern as adminAssignPlan/khet_club_claim_my_plan above) so the record
 * stays consistent across all of a member's plots.
 */
export async function adminUpdateMemberContact(formData: FormData): Promise<void> {
  const claimBatchId = String(formData.get("claimBatchId") || "").trim();
  if (!claimBatchId) return;

  const fullName = String(formData.get("fullName") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const pincode = String(formData.get("pincode") || "").trim() || null;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_plots")
    .update({ full_name: fullName ?? "Mera Khet Member", phone, email, city, address, pincode })
    .eq("claim_batch_id", claimBatchId);

  if (error) {
    console.error("adminUpdateMemberContact failed:", error);
    return;
  }

  revalidateAll();
}
