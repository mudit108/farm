"use server";

import { ok, fail, type ActionResult } from "@/lib/action-result";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createSessionClient } from "@/lib/supabase/session";
import { sendWhatsAppMessage } from "@/lib/whatsapp/whatsapp-service";

export async function adminSetHarvestTotal(formData: FormData): Promise<ActionResult> {
  const userId = String(formData.get("userId") || "");
  const totalKgRaw = String(formData.get("totalKg") || "").trim();
  if (!userId) return fail("Enter a total in kg.");

  const totalKg = totalKgRaw ? Math.round(Number(totalKgRaw)) : null;
  if (totalKgRaw && (!Number.isFinite(totalKg) || (totalKg ?? 0) <= 0)) return fail("Enter a total in kg.");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_harvest_preferences")
    .update({ confirmed_total_kg: totalKg })
    .eq("user_id", userId);

  if (error) {
    console.error("adminSetHarvestTotal failed:", error);
    return fail("Couldn't save the total.");
  }

  revalidatePath("/admin/members");
  revalidatePath("/dashboard/my-farm");
  return ok("Harvest total saved.");
}

export async function adminRecordDelivery(formData: FormData): Promise<ActionResult> {
  const userId = String(formData.get("userId") || "");
  const kgRaw = String(formData.get("kgDelivered") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const deliveredAt = String(formData.get("deliveredAt") || "") || undefined;

  const kgDelivered = Math.round(Number(kgRaw));
  if (!userId || !Number.isFinite(kgDelivered) || kgDelivered <= 0) return fail("Enter the kg delivered.");

  const supabase = createServiceClient();

  const { error } = await supabase.from("khet_club_harvest_deliveries").insert({
    user_id: userId,
    kg_delivered: kgDelivered,
    delivered_at: deliveredAt,
    notes: notes || null,
  });

  if (error) {
    console.error("adminRecordDelivery failed:", error);
    return fail("Couldn't record the delivery.");
  }

  revalidatePath("/admin/members");
  revalidatePath("/dashboard/my-farm");

  // Best-effort WhatsApp update — never blocks the delivery record itself.
  const [{ data: pref }, { data: deliveries }, { data: userRes }] = await Promise.all([
    supabase.from("khet_club_harvest_preferences").select("confirmed_total_kg").eq("user_id", userId).maybeSingle(),
    supabase.from("khet_club_harvest_deliveries").select("kg_delivered").eq("user_id", userId).is("voided_at", null),
    supabase.auth.admin.getUserById(userId),
  ]);

  const totalDelivered = (deliveries ?? []).reduce((sum, d) => sum + (d.kg_delivered as number), 0);
  const total = pref?.confirmed_total_kg ?? null;
  const phone = userRes?.user?.user_metadata?.phone as string | undefined;

  if (phone) {
    const progressText = total
      ? `You've now received ${totalDelivered} kg of your ${total} kg total (${Math.max(total - totalDelivered, 0)} kg remaining).`
      : `You've now received ${totalDelivered} kg total so far.`;
    const message = `🌾 Delivery update: ${kgDelivered} kg delivered${deliveredAt ? ` on ${deliveredAt}` : ""}. ${progressText}`;

    const result = await sendWhatsAppMessage(phone, message);
    await supabase.from("khet_club_whatsapp_messages").insert({
      user_id: userId,
      phone,
      message,
      kind: "automated",
      status: result.success ? "sent" : "failed",
      error_message: result.success ? null : result.error,
    });
  }
  return ok("Delivery recorded.");
}

/**
 * Voids a delivery record rather than deleting it. A delivery is the
 * record that a member physically received wheat — if one is removed by
 * mistake, their delivered total silently changes and there's no
 * evidence of the handover left to check against in a dispute.
 *
 * The row is kept and flagged instead, so it stays in the history and
 * can be restored with a single update. Requires a reason, so the log
 * explains itself months later.
 */
export async function adminVoidDelivery(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") || "");
  const reason = String(formData.get("voidReason") || "").trim();
  if (!id) return fail("Enter a reason for voiding.");

  if (!reason) {
    console.warn("adminVoidDelivery blocked: a reason is required.");
    return fail("Enter a reason for voiding.");
  }

  const session = await createSessionClient();
  const {
    data: { user: admin },
  } = await session.auth.getUser();

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_harvest_deliveries")
    .update({
      voided_at: new Date().toISOString(),
      voided_by: admin?.id ?? null,
      void_reason: reason,
    })
    .eq("id", id)
    .is("voided_at", null);

  if (error) {
    console.error("adminVoidDelivery failed:", error);
    return fail("Couldn't void the delivery.");
  }

  revalidatePath("/admin/members");
  revalidatePath("/dashboard/my-farm");
  return ok("Delivery voided.");
}

/** Undoes a void — the reason it's worth keeping the row at all. */
export async function adminRestoreDelivery(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") || "");
  if (!id) return fail("Missing delivery reference.");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_harvest_deliveries")
    .update({ voided_at: null, voided_by: null, void_reason: null })
    .eq("id", id);

  if (error) {
    console.error("adminRestoreDelivery failed:", error);
    return fail("Couldn't restore the delivery.");
  }

  revalidatePath("/admin/members");
  revalidatePath("/dashboard/my-farm");
  return ok("Delivery restored.");
}

/**
 * Approves a pending harvest preference change request — applies the
 * requested values to khet_club_harvest_preferences (the member's real,
 * active preference) and marks the request approved. Both writes happen
 * as service_role; the admin's own id (from their session) is recorded
 * as the reviewer.
 */
export async function adminApproveHarvestChange(formData: FormData): Promise<ActionResult> {
  const requestId = String(formData.get("requestId") || "");
  if (!requestId) return fail("Request not found or already handled.");

  const sessionSupabase = await createSessionClient();
  const {
    data: { user: admin },
  } = await sessionSupabase.auth.getUser();
  if (!admin) return fail("Request not found or already handled.");

  const supabase = createServiceClient();

  const { data: req } = await supabase
    .from("khet_club_harvest_preference_requests")
    .select("user_id, requested_method, requested_schedule, requested_installment_kg, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!req || req.status !== "pending") return fail("Request not found or already handled.");

  const { error: updateError } = await supabase
    .from("khet_club_harvest_preferences")
    .update({
      method: req.requested_method,
      schedule: req.requested_schedule,
      installment_kg: req.requested_installment_kg,
    })
    .eq("user_id", req.user_id);

  if (updateError) {
    console.error("adminApproveHarvestChange: preference update failed:", updateError);
    return fail("Couldn't approve the change.");
  }

  await supabase
    .from("khet_club_harvest_preference_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: admin.id })
    .eq("id", requestId);

  revalidatePath("/admin/members");
  revalidatePath("/dashboard/my-farm");
  return ok("Change approved and applied.");
}

export async function adminRejectHarvestChange(formData: FormData): Promise<ActionResult> {
  const requestId = String(formData.get("requestId") || "");
  if (!requestId) return fail("Request not found or already handled.");

  const sessionSupabase = await createSessionClient();
  const {
    data: { user: admin },
  } = await sessionSupabase.auth.getUser();
  if (!admin) return fail("Request not found or already handled.");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_harvest_preference_requests")
    .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: admin.id })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) {
    console.error("adminRejectHarvestChange failed:", error);
    return fail("Couldn't reject the request.");
  }

  revalidatePath("/admin/members");
  revalidatePath("/dashboard/my-farm");
  return ok("Change request rejected.");
}
