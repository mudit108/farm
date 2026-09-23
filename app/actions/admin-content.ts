"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createSessionClient } from "@/lib/supabase/session";
import { broadcastWhatsAppToCurrentMembers } from "@/lib/whatsapp/broadcast";
import { sendWhatsAppMessage } from "@/lib/whatsapp/whatsapp-service";
import { sendVisitStatusEmail } from "@/lib/email";
import { ok, fail, type ActionResult } from "@/lib/action-result";

function revalidateCustomerFacing() {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/crop-cycle");
  revalidatePath("/dashboard/crop-cycle");
  revalidatePath("/dashboard/crop-cycle");
  revalidatePath("/dashboard/account");
}

// --- Farm updates ---------------------------------------------------

export async function adminPublishUpdate(formData: FormData): Promise<void> {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!title) return;

  const supabase = createServiceClient();
  const { error } = await supabase.from("khet_club_updates").insert({
    title,
    description,
  });

  if (error) {
    console.error("adminPublishUpdate failed:", error);
    return;
  }
  revalidatePath("/admin/communications");
  revalidateCustomerFacing();

  // Also notify every current-season member on WhatsApp. Best-effort —
  // a WhatsApp failure never blocks the update itself from publishing.
  const whatsappBody = description ? `📢 ${title}\n\n${description}` : `📢 ${title}`;
  await broadcastWhatsAppToCurrentMembers(whatsappBody, "automated");
}

export async function adminDeleteUpdate(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = createServiceClient();
  const { error } = await supabase.from("khet_club_updates").delete().eq("id", id);
  if (error) {
    console.error("adminDeleteUpdate failed:", error);
    return;
  }
  revalidatePath("/admin/communications");
  revalidateCustomerFacing();
}

// --- Season state -----------------------------------------------------

export async function adminUpdateSeason(formData: FormData): Promise<void> {
  const currentStage = String(formData.get("currentStage") || "").trim();
  const progress = Number(formData.get("progress") || 0);
  const health = String(formData.get("health") || "").trim();
  const sowingDate = String(formData.get("sowingDate") || "") || null;
  const estimatedHarvest = String(formData.get("estimatedHarvest") || "") || null;
  const registrationDeadline = String(formData.get("registrationDeadline") || "") || null;

  if (!currentStage || !health) return;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_season")
    .update({
      current_stage: currentStage,
      progress: Math.max(0, Math.min(100, progress)),
      health,
      sowing_date: sowingDate,
      estimated_harvest: estimatedHarvest,
      registration_deadline: registrationDeadline,
    })
    .eq("id", 1);

  if (error) {
    console.error("adminUpdateSeason failed:", error);
    return;
  }
  revalidatePath("/admin/crops");
  revalidatePath("/dashboard/select-plot");
  revalidateCustomerFacing();
}

// --- Farm visits ------------------------------------------------------

export async function adminSetVisitStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["approved", "declined", "completed"].includes(status)) return;

  const supabase = createServiceClient();

  // Read the visit first — we need the member and date to notify them,
  // and after the update we'd have no reason to re-query.
  const { data: visit } = await supabase
    .from("khet_club_farm_visits")
    .select("user_id, preferred_date, visitors")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("khet_club_farm_visits")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("adminSetVisitStatus failed:", error);
    return;
  }

  // Notify the member — previously nothing at all reached them, despite
  // a farm visit requiring real travel to Sujangarh. Best-effort: a
  // failed notification never undoes the status change.
  if (visit && (status === "approved" || status === "declined")) {
    const { data: userRes } = await supabase.auth.admin.getUserById(visit.user_id);
    const member = userRes?.user;
    const fullName = (member?.user_metadata?.full_name as string) || "there";
    const prettyDate = new Date(visit.preferred_date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    if (member?.email) {
      await sendVisitStatusEmail({
        to: member.email,
        fullName,
        status: status as "approved" | "declined",
        preferredDate: prettyDate,
        visitors: visit.visitors,
      });
    }

    const phone = member?.user_metadata?.phone as string | undefined;
    if (phone) {
      const message =
        status === "approved"
          ? `Namaste ${fullName}, your Mera Khet farm visit on ${prettyDate} is confirmed for ${visit.visitors} visitor(s). Reply here if you need directions or your plans change.`
          : `Namaste ${fullName}, unfortunately we can't host your Mera Khet farm visit on ${prettyDate}. Please reply with another date that suits you and we'll try to accommodate it.`;
      const whatsappResult = await sendWhatsAppMessage(phone, message);
      await supabase.from("khet_club_whatsapp_messages").insert({
        user_id: visit.user_id,
        phone,
        message: `Visit ${status}: ${prettyDate}`,
        kind: "automated",
        status: whatsappResult.success ? "sent" : "failed",
        error_message: whatsappResult.success ? null : whatsappResult.error,
      });
    }
  }

  revalidatePath("/admin/visits");
  revalidatePath("/dashboard/farm-visit");
}

// --- Cameras ------------------------------------------------------------

export async function adminUpsertCamera(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const plotNumberRaw = String(formData.get("plotNumber") || "");
  const streamUrl = String(formData.get("streamUrl") || "").trim();
  const status = String(formData.get("status") || "not_configured");

  if (!name) return;

  const plotNumber = plotNumberRaw ? Number(plotNumberRaw) : null;
  const supabase = createServiceClient();

  const payload = {
    name,
    plot_number: plotNumber,
    stream_url: streamUrl || null,
    status,
  };

  const { error } = id
    ? await supabase.from("khet_club_cameras").update(payload).eq("id", id)
    : await supabase.from("khet_club_cameras").insert(payload);

  if (error) {
    console.error("adminUpsertCamera failed:", error);
    return;
  }
  revalidatePath("/admin/cctv");
  revalidateCustomerFacing();
}

export async function adminDeleteCamera(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = createServiceClient();
  const { error } = await supabase.from("khet_club_cameras").delete().eq("id", id);
  if (error) {
    console.error("adminDeleteCamera failed:", error);
    return;
  }
  revalidatePath("/admin/cctv");
  revalidateCustomerFacing();
}

// --- Documents ----------------------------------------------------------

export async function adminAddDocument(formData: FormData): Promise<void> {
  const name = String(formData.get("name") || "").trim();
  const fileUrl = String(formData.get("fileUrl") || "").trim();
  const email = String(formData.get("email") || "").trim();

  if (!name || !fileUrl) return;

  const supabase = createServiceClient();

  let userId: string | null = null;
  if (email) {
    const { data } = await supabase
      .from("khet_club_plots")
      .select("user_id")
      .eq("email", email)
      .not("user_id", "is", null)
      .limit(1)
      .maybeSingle();
    userId = (data as { user_id: string } | null)?.user_id ?? null;
  }

  const { error } = await supabase.from("khet_club_documents").insert({
    name,
    file_url: fileUrl,
    user_id: userId,
  });

  if (error) {
    console.error("adminAddDocument failed:", error);
    return;
  }
  revalidatePath("/admin/members");
  revalidatePath("/dashboard/account");
}

export async function adminDeleteDocument(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = createServiceClient();
  const { error } = await supabase.from("khet_club_documents").delete().eq("id", id);
  if (error) {
    console.error("adminDeleteDocument failed:", error);
    return;
  }
  revalidatePath("/dashboard/account");
}

export type ResizeFarmResult =
  | { status: "idle" }
  | { status: "success"; previousTotal: number; newTotal: number; plotsAdded: number; plotsRemoved: number }
  | { status: "error"; message: string };

/**
 * Grows or shrinks the total number of plots. Growing just adds new
 * available rows. Shrinking is refused by the database function itself
 * if any plot above the new total is already claimed — this action
 * surfaces that as a clear error rather than silently failing or (worse)
 * deleting a real member's plot.
 */
export async function adminResizeFarm(
  _prev: ResizeFarmResult,
  formData: FormData
): Promise<ResizeFarmResult> {
  const newTotalRaw = String(formData.get("newTotal") || "").trim();
  const newTotal = Number(newTotalRaw);

  if (!Number.isFinite(newTotal) || newTotal <= 0 || !Number.isInteger(newTotal)) {
    return { status: "error", message: "Please enter a valid whole number of plots." };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .rpc("khet_club_resize_farm", { p_new_total: newTotal })
    .single<{ previous_total: number; new_total: number; plots_added: number; plots_removed: number }>();

  if (error) {
    if (error.message.includes("PLOTS_ALREADY_CLAIMED")) {
      const match = error.message.match(/(\d+) plot\(s\) above #(\d+)/);
      return {
        status: "error",
        message: match
          ? `Can't shrink to ${newTotal} — ${match[1]} plot(s) above #${match[2]} are already claimed. Free them up first or choose a higher number.`
          : "Can't shrink — some plots above that number are already claimed.",
      };
    }
    console.error("adminResizeFarm failed:", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  revalidatePath("/admin/crops");
  revalidatePath("/admin/members");
  revalidatePath("/admin/cctv");
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/select-plot");

  return {
    status: "success",
    previousTotal: data!.previous_total,
    newTotal: data!.new_total,
    plotsAdded: data!.plots_added,
    plotsRemoved: data!.plots_removed,
  };
}

export async function adminMarkContactMessage(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["read", "replied"].includes(status)) return;

  const supabase = createServiceClient();
  const { error } = await supabase.from("khet_club_contact_messages").update({ status }).eq("id", id);
  if (error) {
    console.error("adminMarkContactMessage failed:", error);
    return;
  }

  revalidatePath("/admin/communications");
}

/**
 * Lets the site's public contact email/phone (footer, WhatsApp button)
 * be changed from the admin panel instead of requiring a redeploy —
 * stored on khet_club_season, the general farm-settings singleton.
 */
export async function adminUpdateContactInfo(formData: FormData): Promise<void> {
  const contactEmail = String(formData.get("contactEmail") || "").trim();
  const contactPhone = String(formData.get("contactPhone") || "").trim();

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_season")
    .update({
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
    })
    .eq("id", 1);

  if (error) {
    console.error("adminUpdateContactInfo failed:", error);
    return;
  }

  revalidatePath("/");
  revalidatePath("/admin/crops");
}

/**
 * Updates one or more plan prices from the admin panel. This is what
 * createPlanOrder actually charges — not a display-only setting — so a
 * change here takes effect on the very next checkout.
 */
export async function adminUpdatePlanPrices(formData: FormData): Promise<void> {
  const supabase = createServiceClient();

  const updates: { plan_id: string; price_inr: number }[] = [];
  for (const planId of ["1-plot", "3-plots", "6-plots"]) {
    const raw = formData.get(`price_${planId}`);
    if (raw === null) continue;
    const price = Number(raw);
    if (!Number.isFinite(price) || price <= 0) continue;
    updates.push({ plan_id: planId, price_inr: Math.round(price) });
  }
  if (updates.length === 0) return;

  const { error } = await supabase.from("khet_club_plan_prices").upsert(updates);
  if (error) {
    console.error("adminUpdatePlanPrices failed:", error);
    return;
  }

  revalidatePath("/");
  revalidatePath("/admin/crops");
  revalidatePath("/dashboard/select-plot");
}

/**
 * The publicly-shown Feeding Families Fund total is admin-controlled,
 * separate from the auto-computed "earmarked from paid orders" figure
 * on /admin — admin may have real reasons the two differ (offline
 * contributions, timing of actual wheat purchases).
 */
export async function adminUpdateFFFAmount(formData: FormData): Promise<void> {
  const raw = String(formData.get("fffCollectedInr") || "");
  const amount = Math.round(Number(raw));
  if (!Number.isFinite(amount) || amount < 0) return;

  const supabase = createServiceClient();
  const { error } = await supabase.from("khet_club_season").update({ fff_collected_inr: amount }).eq("id", 1);
  if (error) {
    console.error("adminUpdateFFFAmount failed:", error);
    return;
  }

  revalidatePath("/");
  revalidatePath("/admin/income");
}

/**
 * Marks a member's dashboard support message resolved. These were
 * previously written to the database and read by nothing at all.
 */
export async function adminResolveSupportMessage(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_support_messages")
    .update({ status: "resolved" })
    .eq("id", id);

  if (error) {
    console.error("adminResolveSupportMessage failed:", error);
    return;
  }

  revalidatePath("/admin/communications");
}

export type CloseSeasonResult =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; plotsFreed: number; membersArchived: number; newLabel: string };

/**
 * Closes the current season and opens the next one. Archives a snapshot
 * first and stamps existing plots/certificates with it — nothing is
 * ever deleted, so members' certificates and receipts keep resolving.
 *
 * Requires the admin to type the current season label exactly, so a
 * stray click can't wipe a live season.
 */
export async function adminCloseSeason(
  _prev: CloseSeasonResult,
  formData: FormData
): Promise<CloseSeasonResult> {
  const confirmLabel = String(formData.get("confirmLabel") || "").trim();
  const newLabel = String(formData.get("newSeasonLabel") || "").trim();

  if (!confirmLabel || !newLabel) {
    return { status: "error", message: "Both the confirmation and the new season name are required." };
  }

  const session = await createSessionClient();
  const {
    data: { user: admin },
  } = await session.auth.getUser();

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("khet_club_close_season", {
    p_confirm_label: confirmLabel,
    p_new_season_label: newLabel,
    p_new_crop: "Gehu (Wheat)",
    p_closed_by: admin?.id ?? null,
  });

  if (error) {
    console.error("adminCloseSeason failed:", error);
    return {
      status: "error",
      message: error.message.includes("Confirmation label")
        ? "That doesn't match the current season name exactly. Nothing was changed."
        : "Couldn't close the season. Nothing was changed.",
    };
  }

  const row = (data as { plots_freed: number; members_archived: number }[] | null)?.[0];

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/crops");
  revalidatePath("/admin/members");
  revalidatePath("/dashboard");

  return {
    status: "success",
    plotsFreed: row?.plots_freed ?? 0,
    membersArchived: row?.members_archived ?? 0,
    newLabel,
  };
}

/**
 * Warehouse capacity is stated publicly on the homepage (harvest
 * process, FAQ, plan inclusions), so it's editable rather than
 * hardcoded — if the real facility changes, a hardcoded figure would
 * quietly become a false claim.
 */
export async function adminUpdateWarehouseCapacity(formData: FormData): Promise<void> {
  const raw = String(formData.get("warehouseCapacityTonnes") || "");
  const tonnes = Math.round(Number(raw));
  if (!Number.isFinite(tonnes) || tonnes <= 0) return;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_season")
    .update({ warehouse_capacity_tonnes: tonnes })
    .eq("id", 1);

  if (error) {
    console.error("adminUpdateWarehouseCapacity failed:", error);
    return;
  }

  revalidatePath("/");
  revalidatePath("/admin/crops");
}

/**
 * How the harvest is divided among members. Described in the Terms of
 * Service and Membership Agreement, so it's configurable rather than
 * hardcoded — if the model changes between seasons, the legal text
 * must be able to follow it rather than silently describing something
 * that is no longer true.
 */
export async function adminUpdateHarvestDistribution(formData: FormData): Promise<void> {
  const model = String(formData.get("harvestDistributionModel") || "");
  const deductionRaw = String(formData.get("harvestDeductionPercent") || "0");
  const deduction = Number(deductionRaw);

  if (!["pooled", "per_plot"].includes(model)) return;
  if (!Number.isFinite(deduction) || deduction < 0 || deduction > 100) return;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_season")
    .update({
      harvest_distribution_model: model,
      harvest_deduction_percent: deduction,
    })
    .eq("id", 1);

  if (error) {
    console.error("adminUpdateHarvestDistribution failed:", error);
    return;
  }

  revalidatePath("/admin/crops");
  revalidatePath("/terms");
  revalidatePath("/membership-agreement");
}

/**
 * Pauses or resumes new plot bookings — a dedicated toggle rather than
 * a field on the general season-state form, so it's a single unambiguous
 * click with its own clear feedback, not one field among several behind
 * one shared "Save" button.
 *
 * Enforced server-side in khet_club_claim_my_plan (the security-definer
 * RPC a client cannot route around) and pre-checked in createPlanOrder
 * so a Razorpay order isn't even created while paused. This action only
 * flips the flag those two already read.
 */
export async function adminSetRegistrationsPaused(formData: FormData): Promise<ActionResult> {
  const paused = String(formData.get("paused") || "") === "true";

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_season")
    .update({ registrations_paused: paused })
    .eq("id", 1);

  if (error) {
    console.error("adminSetRegistrationsPaused failed:", error);
    return fail("Couldn't update — please try again.");
  }

  revalidateCustomerFacing();
  revalidatePath("/dashboard/select-plot");
  revalidatePath("/admin/crops");
  return ok(
    paused
      ? "New bookings are now paused. Existing members are unaffected."
      : "Bookings resumed — the site is accepting new plots again."
  );
}
