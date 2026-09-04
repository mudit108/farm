"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWhatsAppMessage } from "@/lib/whatsapp/whatsapp-service";
import { broadcastWhatsAppToCurrentMembers } from "@/lib/whatsapp/broadcast";

export async function adminSendWhatsAppIndividual(formData: FormData): Promise<void> {
  const userId = String(formData.get("userId") || "");
  const message = String(formData.get("message") || "").trim();
  if (!userId || !message) return;

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
    return;
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
}

export async function adminBroadcastWhatsApp(formData: FormData): Promise<void> {
  const message = String(formData.get("message") || "").trim();
  if (!message) return;

  await broadcastWhatsAppToCurrentMembers(message, "broadcast");

  revalidatePath("/admin/communications");
}
