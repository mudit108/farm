"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { createSessionClient } from "@/lib/supabase/session";
import { membershipPlans } from "@/lib/demo-data";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { listAllUsers } from "@/lib/supabase/list-all-users";

/**
 * These actions are only reachable through pages under /admin, which
 * proxy.ts gates behind a real Supabase Auth session + the ADMIN_EMAILS
 * allowlist. Server Actions submit back to their originating page's URL,
 * so that protection covers these requests too.
 */

function revalidateAll() {
  revalidatePath("/admin/members");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/select-plot");
  revalidatePath("/dashboard/my-farm");
}

/** Everything a freed plot must forget, so the next occupant starts clean. */
const CLEARED_PLOT = {
  status: "available",
  user_id: null,
  full_name: null,
  phone: null,
  email: null,
  city: null,
  address: null,
  pincode: null,
  plan_id: null,
  claim_batch_id: null,
  assigned_at: null,
  approved_at: null,
  approved_by: null,
  custom_name: null,
} as const;

const PLOT_ARCHIVE_COLUMNS =
  "plot_number, user_id, full_name, phone, email, city, address, pincode, plan_id, claim_batch_id, assigned_at";

type ArchivablePlot = {
  plot_number: number;
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
};

function archiveRow(p: ArchivablePlot, adminId: string | null) {
  return {
    plot_number: p.plot_number,
    previous_user_id: p.user_id,
    previous_full_name: p.full_name,
    previous_phone: p.phone,
    previous_email: p.email,
    previous_city: p.city,
    previous_address: p.address,
    previous_pincode: p.pincode,
    previous_plan_id: p.plan_id,
    previous_claim_batch_id: p.claim_batch_id,
    previous_assigned_at: p.assigned_at,
    was_member_held: Boolean(p.user_id),
    cleared_by: adminId,
  };
}

async function currentAdminId(): Promise<string | null> {
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  return user?.id ?? null;
}

// Frees a single plot (per-row "Free Up" button in the table).
export async function adminMarkPlotAvailable(formData: FormData): Promise<ActionResult> {
  const plotNumber = Number(formData.get("plotNumber"));
  if (!Number.isInteger(plotNumber)) return fail("Invalid plot number.");

  const supabase = createServiceClient();

  // Read the plot first — needed both to decide whether this is a real
  // member's allocation and to archive what's about to be wiped.
  const { data: plot } = await supabase
    .from("khet_club_plots")
    .select(PLOT_ARCHIVE_COLUMNS)
    .eq("plot_number", plotNumber)
    .maybeSingle();

  if (!plot) return fail(`Plot #${plotNumber} not found.`);

  // Guard: a plot held by a real account is someone's paid allocation.
  // Clearing it requires the admin to type the plot number back, so a
  // stray click in a long table can't destroy a membership. Offline
  // reservations (no linked account) stay one-click.
  if (plot.user_id) {
    const confirmValue = String(formData.get("confirmPlotNumber") || "").trim();
    if (confirmValue !== String(plotNumber)) {
      return fail(`This plot belongs to a member. Type ${plotNumber} in the box to confirm.`);
    }
  }

  // Archive before wiping — this is the only record of who held it.
  const { error: logError } = await supabase
    .from("khet_club_plot_clear_log")
    .insert(archiveRow(plot as ArchivablePlot, await currentAdminId()));
  if (logError) {
    console.error("adminMarkPlotAvailable aborted — could not archive plot:", logError);
    return fail("Couldn't archive the plot's details, so nothing was changed.");
  }

  const { error } = await supabase.from("khet_club_plots").update(CLEARED_PLOT).eq("plot_number", plotNumber);
  if (error) {
    console.error("adminMarkPlotAvailable failed:", error);
    return fail("Couldn't free the plot. Please try again.");
  }

  revalidateAll();
  return ok(`Plot #${plotNumber} is available again.`);
}

// Quick, single-plot fill for an individual row (no plan attached — an
// ad-hoc offline reservation, distinct from a proper plan assignment).
export async function adminMarkPlotFilled(formData: FormData): Promise<ActionResult> {
  const plotNumber = Number(formData.get("plotNumber"));
  if (!Number.isInteger(plotNumber)) return fail("Invalid plot number.");

  const fullName = String(formData.get("fullName") || "").trim() || "Reserved by Admin";
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || null;

  const supabase = createServiceClient();
  // Only fill it if it's still available — the table may be stale, and a
  // customer could have paid for this plot since the page loaded.
  const { data, error } = await supabase
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
    .eq("plot_number", plotNumber)
    .eq("status", "available")
    .select("plot_number");

  if (error) {
    console.error("adminMarkPlotFilled failed:", error);
    return fail("Couldn't reserve the plot. Please try again.");
  }
  if (!data || data.length === 0) {
    revalidateAll();
    return fail(`Plot #${plotNumber} was already taken — the page has been refreshed.`);
  }

  revalidateAll();
  return ok(`Plot #${plotNumber} reserved.`);
}

// Frees an entire batch (e.g. all 3 plots from one "3 Plots" plan claim)
// in one action, for the grouped members view.
export async function adminFreeBatch(formData: FormData): Promise<ActionResult> {
  const claimBatchId = String(formData.get("claimBatchId") || "");
  if (!claimBatchId) return fail("Missing member reference.");

  // This removes an entire membership (up to 6 plots) at once, so it
  // always requires deliberate confirmation.
  const confirmValue = String(formData.get("confirmRemove") || "").trim().toUpperCase();
  if (confirmValue !== "REMOVE") {
    return fail('Type REMOVE in the box to confirm freeing these plots.');
  }

  const supabase = createServiceClient();
  const { data: plots } = await supabase
    .from("khet_club_plots")
    .select(PLOT_ARCHIVE_COLUMNS)
    .eq("claim_batch_id", claimBatchId);

  if (!plots || plots.length === 0) return fail("No plots found for this member — it may already be freed.");

  const adminId = await currentAdminId();
  const { error: logError } = await supabase
    .from("khet_club_plot_clear_log")
    .insert((plots as ArchivablePlot[]).map((p) => archiveRow(p, adminId)));
  if (logError) {
    console.error("adminFreeBatch aborted — could not archive plots:", logError);
    return fail("Couldn't archive the plots' details, so nothing was changed.");
  }

  const { error } = await supabase.from("khet_club_plots").update(CLEARED_PLOT).eq("claim_batch_id", claimBatchId);
  if (error) {
    console.error("adminFreeBatch failed:", error);
    return fail("Couldn't free the plots. Please try again.");
  }

  revalidateAll();
  return ok(`Freed ${plots.length} plot${plots.length > 1 ? "s" : ""}.`);
}

// Manually assign a full PLAN (1/3/6 plots) to an offline reservation —
// the admin-side equivalent of a customer picking a plan themselves.
export async function adminAssignPlan(formData: FormData): Promise<ActionResult> {
  const planId = String(formData.get("planId") || "");
  const plan = membershipPlans.find((p) => p.id === planId);
  if (!plan) return fail("Choose a plan first.");

  const fullName = String(formData.get("fullName") || "").trim() || "Reserved by Admin";
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const pincode = String(formData.get("pincode") || "").trim() || null;

  const supabase = createServiceClient();

  // If the email belongs to someone who already has an account (e.g. they
  // signed up but paid you by cash/UPI), link the plots to that account so
  // it shows in their dashboard and they can get a certificate + receipt.
  let userId: string | null = null;
  if (email) {
    const { data: all } = await listAllUsers(supabase);
    userId = all.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
  }

  const { data: available, error: fetchError } = await supabase
    .from("khet_club_plots")
    .select("plot_number")
    .eq("status", "available")
    .order("plot_number")
    .limit(plan.plots);

  if (fetchError) {
    console.error("adminAssignPlan lookup failed:", fetchError);
    return fail("Couldn't check plot availability. Please try again.");
  }
  if (!available || available.length < plan.plots) {
    return fail(`Not enough free plots — ${plan.name} needs ${plan.plots}, only ${available?.length ?? 0} available.`);
  }

  const plotNumbers = available.map((p) => p.plot_number as number);
  const batchId = randomUUID();

  // The status guard makes this safe against a customer paying for one of
  // these plots in the moment between the lookup above and this write.
  const { data: updated, error } = await supabase
    .from("khet_club_plots")
    .update({
      status: "filled",
      user_id: userId,
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
    .in("plot_number", plotNumbers)
    .eq("status", "available")
    .select("plot_number");

  if (error) {
    console.error("adminAssignPlan update failed:", error);
    return fail("Couldn't assign the plan. Please try again.");
  }

  if (!updated || updated.length < plan.plots) {
    // Someone else took a plot mid-way — undo the partial assignment
    // rather than leave a half-filled plan.
    if (updated && updated.length > 0) {
      await supabase.from("khet_club_plots").update(CLEARED_PLOT).eq("claim_batch_id", batchId);
    }
    revalidateAll();
    return fail("A plot was taken while assigning — nothing was changed. Please try again.");
  }

  revalidateAll();
  return ok(
    `${plan.name} assigned to ${fullName} — plots ${plotNumbers.map((n) => `#${n}`).join(", ")}.` +
      (userId ? " Linked to their account — record their payment on the member card." : "")
  );
}

/**
 * Edit a member's contact/address details after the fact — corrects what
 * was captured at signup/assignment, and backfills address + pincode for
 * members who registered before those fields existed.
 *
 * For a registered member, every plot they hold (across all purchases) is
 * updated, and their account profile too — certificates, receipts and
 * WhatsApp messages read name/phone from the account, so editing only the
 * plot rows would change the admin view but not where messages go. The
 * login email is deliberately NOT changed here (that's the member's
 * sign-in identity); the email field only updates the plot record.
 */
export async function adminUpdateMemberContact(formData: FormData): Promise<ActionResult> {
  const claimBatchId = String(formData.get("claimBatchId") || "").trim();
  if (!claimBatchId) return fail("Missing member reference.");

  const fullName = String(formData.get("fullName") || "").trim();
  if (!fullName) return fail("Name can't be empty.");
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const pincode = String(formData.get("pincode") || "").trim() || null;
  if (pincode && !/^\d{6}$/.test(pincode)) return fail("Pincode should be 6 digits.");

  const supabase = createServiceClient();

  const { data: batchRow } = await supabase
    .from("khet_club_plots")
    .select("user_id")
    .eq("claim_batch_id", claimBatchId)
    .limit(1)
    .maybeSingle();
  if (!batchRow) return fail("Member not found — the plots may have been freed.");

  const userId = (batchRow as { user_id: string | null }).user_id;
  const fields = { full_name: fullName, phone, email, city, address, pincode };

  const { error } = userId
    ? await supabase.from("khet_club_plots").update(fields).eq("user_id", userId)
    : await supabase.from("khet_club_plots").update(fields).eq("claim_batch_id", claimBatchId);
  if (error) {
    console.error("adminUpdateMemberContact failed:", error);
    return fail("Couldn't save the details. Please try again.");
  }

  if (userId) {
    const { data: existing } = await supabase.auth.admin.getUserById(userId);
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { ...(existing?.user?.user_metadata ?? {}), full_name: fullName, phone, city, address, pincode },
    });
    if (authError) {
      console.error("adminUpdateMemberContact: auth metadata sync failed:", authError);
      revalidateAll();
      return fail("Saved on the plots, but couldn't update the member's account profile. Try again.");
    }
  }

  revalidateAll();
  return ok("Member details saved.");
}
