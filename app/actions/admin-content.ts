"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { broadcastWhatsAppToCurrentMembers } from "@/lib/whatsapp/broadcast";

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
  const { error } = await supabase
    .from("khet_club_farm_visits")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("adminSetVisitStatus failed:", error);
    return;
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
