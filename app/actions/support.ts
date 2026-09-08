"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/session";
import { sendSupportNotificationEmail } from "@/lib/email";

export type SupportState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_HOURS = 1;

export async function submitSupportMessage(
  _prev: SupportState,
  formData: FormData
): Promise<SupportState> {
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!subject || !message) {
    return { status: "error", message: "Please fill in both fields." };
  }

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please log in first." };
  }

  // Members can already read their own messages (RLS-scoped), so this
  // count only ever sees their own submissions, never anyone else's.
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("khet_club_support_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return {
      status: "error",
      message: "You've sent several messages in the last hour — we've received them and will get back to you. Please wait before sending more.",
    };
  }

  const { error } = await supabase.from("khet_club_support_messages").insert({
    user_id: user.id,
    subject,
    message,
  });

  if (error) {
    console.error("submitSupportMessage failed:", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  // Best-effort — a failed notification never blocks the message from
  // being saved and visible to admin at /admin/communications.
  await sendSupportNotificationEmail({
    memberName: (user.user_metadata?.full_name as string) || "A member",
    memberEmail: user.email || "",
    subject,
    message,
  });

  revalidatePath("/dashboard/farm-visit");
  revalidatePath("/admin/communications");

  return { status: "success" };
}
