"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/session";
import { sendSupportNotificationEmail } from "@/lib/email";

export type SupportState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

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
