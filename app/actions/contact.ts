"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { sendContactNotificationEmail } from "@/lib/email";

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MINUTES = 15;

/** Vercel sets x-forwarded-for correctly at the edge; take the first
 * address (the actual client) since the header can be a comma-separated
 * chain through intermediate proxies. */
async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip");
}

/**
 * The homepage "Talk to us" form. Previously this was entirely fake —
 * client-side only, showing a success message without sending the
 * message anywhere. This actually persists it (khet_club_contact_
 * messages, admin-only to read) and notifies the admin team by email.
 *
 * Uses service_role (not the anon client) so the same server action
 * can both check the rate limit (requires reading past submissions,
 * which anon can't do) and perform the insert — the anon-insert RLS
 * policy on the table stays in place regardless, as defense in depth
 * against any direct API call that bypasses this action entirely.
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

  const supabase = createServiceClient();
  const ip = await getClientIp();

  if (ip) {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("khet_club_contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", since);

    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return {
        status: "error",
        message: "You've sent a few messages recently — please wait a bit before sending another, or WhatsApp us directly.",
      };
    }
  }

  const { error } = await supabase.from("khet_club_contact_messages").insert({
    name,
    phone,
    email,
    message,
    ip_address: ip,
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
