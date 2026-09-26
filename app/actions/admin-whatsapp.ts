"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWhatsAppMessage } from "@/lib/whatsapp/whatsapp-service";
import { broadcastWhatsAppToCurrentMembers } from "@/lib/whatsapp/broadcast";
import { ok, fail, type ActionResult } from "@/lib/action-result";

export async function adminSendWhatsAppIndividual(formData: FormData): Promise<ActionResult> {
  const userId = String(formData.get("userId") || "");
  const message = String(formData.get("message") || "").trim();
  if (!userId) return fail("Choose a member first.");
  if (!message) return fail("Type a message first.");

  const admin = createServiceClient();
  const { data: userRes } = await admin.auth.admin.getUserById(userId);
  const phone = userRes?.user?.user_metadata?.phone as string | undefined;

  if (!phone) {
    await admin.from("khet_club_whatsapp_messages").insert({
      user_id: userId,
      phone: "",
      message,
      kind: "individual",
      status: "failed",
      error_message: "no_phone_on_file",
    });
    revalidatePath("/admin/communications");
    return fail("This member has no phone number on file, so nothing was sent.");
  }

  const result = await sendWhatsAppMessage(phone, message);

  await admin.from("khet_club_whatsapp_messages").insert({
    user_id: userId,
    phone,
    message,
    kind: "individual",
    status: result.success ? "sent" : "failed",
    error_message: result.success ? null : result.error,
  });

  revalidatePath("/admin/communications");
  return result.success ? ok("WhatsApp message sent.") : fail(`WhatsApp didn't send: ${result.error ?? "unknown error"}.`);
}

export async function adminBroadcastWhatsApp(formData: FormData): Promise<ActionResult> {
  const message = String(formData.get("message") || "").trim();
  if (!message) return fail("Type a message first.");

  const summary = await broadcastWhatsAppToCurrentMembers(message, "broadcast");

  revalidatePath("/admin/communications");
  if (summary.sent === 0 && summary.failed > 0) {
    return fail(`Broadcast failed for all ${summary.failed} members — check WhatsApp setup.`);
  }
  return ok(
    `Sent to ${summary.sent} member${summary.sent === 1 ? "" : "s"}${summary.failed > 0 ? `, ${summary.failed} failed` : ""}.`
  );
}
