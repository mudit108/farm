"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createSessionClient } from "@/lib/supabase/session";
import { sendWhatsAppMessage } from "@/lib/whatsapp/whatsapp-service";

export async function adminSetHarvestTotal(formData: FormData): Promise<void> {
  const userId = String(formData.get("userId") || "");
  const totalKgRaw = String(formData.get("totalKg") || "").trim();
  if (!userId) return;

  const totalKg = totalKgRaw ? Math.round(Number(totalKgRaw)) : null;
  if (totalKgRaw && (!Number.isFinite(totalKg) || (totalKg ?? 0) <= 0)) return;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_harvest_preferences")
    .update({ confirmed_total_kg: totalKg })
    .eq("user_id", userId);

  if (error) {
    console.error("adminSetHarvestTotal failed:", error);
    return;
  }

  revalidatePath("/admin/members");
  revalidatePath("/dashboard/my-farm");
}

export async function adminRecordDelivery(formData: FormData): Promise<void> {
  const userId = String(formData.get("userId") || "");
  const kgRaw = String(formData.get("kgDelivered") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const deliveredAt = String(formData.get("deliveredAt") || "") || undefined;

  const kgDelivered = Math.round(Number(kgRaw));
  if (!userId || !Number.isFinite(kgDelivered) || kgDelivered <= 0) return;

  const supabase = createServiceClient();

  const { error } = await supabase.from("khet_club_harvest_deliveries").insert({
    user_id: userId,
    kg_delivered: kgDelivered,
    delivered_at: deliveredAt,
    notes: notes || null,
  });

  if (error) {
    console.error("adminRecordDelivery failed:", error);
    return;
  }

  revalidatePath("/admin/members");
  revalidatePath("/dashboard/my-farm");

  // Best-effort WhatsApp update — never blocks the delivery record itself.
  const [{ data: pref }, { data: deliveries }, { data: userRes }] = await Promise.all([
    supabase.from("khet_club_harvest_preferences").select("confirmed_total_kg").eq("user_id", userId).maybeSingle(),
    supabase.from("khet_club_harvest_deliveries").select("kg_delivered").eq("user_id", userId),
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
}

export async function adminDeleteDelivery(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = createServiceClient();
  const { error } = await supabase.from("khet_club_harvest_deliveries").delete().eq("id", id);
  if (error) {
    console.error("adminDeleteDelivery failed:", error);
    return;
  }

  revalidatePath("/admin/members");
  revalidatePath("/dashboard/my-farm");
}

/**
 * Approves a pending harvest preference change request — applies the
 * requested values to khet_club_harvest_preferences (the member's real,
 * active preference) and marks the request approved. Both writes happen
 * as service_role; the admin's own id (from their session) is recorded
 * as the reviewer.
 */
export async function adminApproveHarvestChange(formData: FormData): Promise<void> {
  const requestId = String(formData.get("requestId") || "");
  if (!requestId) return;

  const sessionSupabase = await createSessionClient();
  const {
    data: { user: admin },
  } = await sessionSupabase.auth.getUser();
  if (!admin) return;

  const supabase = createServiceClient();

  const { data: req } = await supabase
    .from("khet_club_harvest_preference_requests")
    .select("user_id, requested_method, requested_schedule, requested_installment_kg, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!req || req.status !== "pending") return;

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
    return;
  }

  await supabase
    .from("khet_club_harvest_preference_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: admin.id })
    .eq("id", requestId);

  revalidatePath("/admin/members");
  revalidatePath("/dashboard/my-farm");
}

export async function adminRejectHarvestChange(formData: FormData): Promise<void> {
  const requestId = String(formData.get("requestId") || "");
  if (!requestId) return;

  const sessionSupabase = await createSessionClient();
  const {
    data: { user: admin },
  } = await sessionSupabase.auth.getUser();
  if (!admin) return;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_harvest_preference_requests")
    .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: admin.id })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) {
    console.error("adminRejectHarvestChange failed:", error);
    return;
  }

  revalidatePath("/admin/members");
  revalidatePath("/dashboard/my-farm");
}
