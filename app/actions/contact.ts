"use server";

import { createAnonClient } from "@/lib/supabase/anon";
import { sendContactNotificationEmail } from "@/lib/email";

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

/**
 * The homepage "Talk to us" form. Previously this was entirely fake —
 * client-side only, showing a success message without sending the
 * message anywhere. This actually persists it (khet_club_contact_
 * messages, admin-only to read) and notifies the admin team by email.
 */
export async function submitContactMessage(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!name || !phone || !email || !message) {
    return { status: "error", message: "Please fill in every field." };
  }

  const supabase = createAnonClient();
  const { error } = await supabase.from("khet_club_contact_messages").insert({
    name,
    phone,
    email,
    message,
  });

  if (error) {
    console.error("submitContactMessage failed:", error);
    return { status: "error", message: "Something went wrong. Please try again, or WhatsApp us directly." };
  }

  // Best-effort — a failed notification email never blocks the message
  // itself from being saved and visible to admin at /admin/communications.
  await sendContactNotificationEmail({ name, phone, email, message });

  return { status: "success" };
}
