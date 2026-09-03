import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWhatsAppMessage } from "@/lib/whatsapp/whatsapp-service";

export type BroadcastSummary = { total: number; sent: number; failed: number };

/**
 * Sends a WhatsApp message to every "current season member" — anyone
 * holding at least one filled plot — and logs each attempt. Used by both
 * the admin broadcast composer and automated triggers (e.g. publishing a
 * farm update).
 *
 * Sends sequentially, one member at a time. Fine at the current member
 * count; if this ever needs to scale to hundreds of members, move it to
 * a background job/queue instead of running inline in a Server Action
 * (which has a request time limit on most hosts, including Vercel).
 */
export async function broadcastWhatsAppToCurrentMembers(
  message: string,
  kind: "broadcast" | "automated" = "broadcast"
): Promise<BroadcastSummary> {
  const admin = createServiceClient();

  const { data: plots } = await admin
    .from("khet_club_plots")
    .select("user_id")
    .eq("status", "filled")
    .not("user_id", "is", null);

  const userIds = Array.from(new Set((plots ?? []).map((p) => p.user_id as string)));

  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    const { data: userRes } = await admin.auth.admin.getUserById(userId);
    const phone = userRes?.user?.user_metadata?.phone as string | undefined;

    if (!phone) {
      failed++;
      await admin.from("khet_club_whatsapp_messages").insert({
        user_id: userId,
        phone: "",
        message,
        kind,
        status: "failed",
        error_message: "no_phone_on_file",
      });
      continue;
    }

    const result = await sendWhatsAppMessage(phone, message);

    await admin.from("khet_club_whatsapp_messages").insert({
      user_id: userId,
      phone,
      message,
      kind,
      status: result.success ? "sent" : "failed",
      error_message: result.success ? null : result.error,
    });

    result.success ? sent++ : failed++;
  }

  return { total: userIds.length, sent, failed };
}
