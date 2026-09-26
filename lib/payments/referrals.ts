import "server-only";
import { randomInt } from "crypto";
import type { createServiceClient } from "@/lib/supabase/service";

type Admin = ReturnType<typeof createServiceClient>;

export type ReferralSettings = {
  enabled: boolean;
  friend_discount_inr: number;
  referrer_reward_inr: number;
};

export async function getReferralSettings(admin: Admin): Promise<ReferralSettings> {
  const { data } = await admin
    .from("khet_club_referral_settings")
    .select("enabled, friend_discount_inr, referrer_reward_inr")
    .eq("id", 1)
    .maybeSingle();
  return (data as ReferralSettings | null) ?? { enabled: false, friend_discount_inr: 0, referrer_reward_inr: 0 };
}

/** Referral codes look like "MUDIT4821": first name + 4 digits, easy to say on the phone. */
function makeCode(fullName: string | null | undefined): string {
  const base =
    (fullName ?? "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 6) || "KHET";
  return `${base}${randomInt(1000, 10000)}`;
}

/**
 * Returns the member's referral code, creating it the first time. Only
 * members who actually hold plots get one — the reward is for bringing in
 * a paying customer, so the referrer should be one too.
 */
export async function getOrCreateReferralCode(admin: Admin, userId: string, fullName: string | null): Promise<string | null> {
  const { data: existing } = await admin.from("khet_club_referral_codes").select("code").eq("user_id", userId).maybeSingle();
  if (existing?.code) return existing.code as string;

  const { count } = await admin
    .from("khet_club_plots")
    .select("plot_number", { count: "exact", head: true })
    .eq("user_id", userId);
  if (!count) return null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode(fullName);
    const { error } = await admin.from("khet_club_referral_codes").insert({ user_id: userId, code });
    if (!error) return code;
    if (error.code !== "23505") {
      console.error("getOrCreateReferralCode failed:", error);
      return null;
    }
    // 23505 = the code (or this user's row) already exists — re-read in
    // case a parallel request just created this user's code, else retry.
    const { data: again } = await admin.from("khet_club_referral_codes").select("code").eq("user_id", userId).maybeSingle();
    if (again?.code) return again.code as string;
  }
  return null;
}

export type ReferralCheck =
  | { kind: "not_referral" }
  | { kind: "invalid"; message: string }
  | { kind: "valid"; referrerUserId: string; discountInr: number; finalInr: number };

/**
 * Decides whether `code` is a referral code and, if so, whether this user
 * may use it on this purchase. Everything is checked on the server:
 * - the program must be switched on,
 * - you can't use your own code,
 * - only a first purchase qualifies (someone who has already paid is not
 *   a new customer being referred).
 * Returns "not_referral" when the code isn't a referral code at all, so
 * the caller can fall back to ordinary discount codes.
 */
export async function checkReferralCode(
  admin: Admin,
  args: { code: string; userId: string; priceInr: number }
): Promise<ReferralCheck> {
  const code = args.code.trim().toUpperCase();
  if (!code) return { kind: "not_referral" };

  const { data: row } = await admin.from("khet_club_referral_codes").select("user_id").eq("code", code).maybeSingle();
  if (!row) return { kind: "not_referral" };

  const settings = await getReferralSettings(admin);
  if (!settings.enabled || settings.friend_discount_inr <= 0) {
    return { kind: "invalid", message: "Referral codes aren't active right now." };
  }
  if (row.user_id === args.userId) {
    return { kind: "invalid", message: "That's your own referral code — share it with a friend instead." };
  }

  const { count } = await admin
    .from("khet_club_payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", args.userId)
    .eq("status", "paid");
  if ((count ?? 0) > 0) {
    return { kind: "invalid", message: "Referral codes are for a member's first purchase only." };
  }

  // Never discount a plan down to nothing.
  const discountInr = Math.min(settings.friend_discount_inr, Math.max(args.priceInr - 1, 0));
  return { kind: "valid", referrerUserId: row.user_id as string, discountInr, finalInr: args.priceInr - discountInr };
}

/**
 * After a referred customer's payment succeeds: record the referrer's
 * reward (once per referred customer — unique on referee). Never throws;
 * a reward problem must not affect the customer's purchase.
 */
export async function recordReferralReward(admin: Admin, paymentId: string): Promise<void> {
  try {
    const { data: payment } = await admin
      .from("khet_club_payments")
      .select("id, user_id, status, referrer_user_id")
      .eq("id", paymentId)
      .maybeSingle();
    if (!payment?.referrer_user_id || payment.status !== "paid") return;

    const settings = await getReferralSettings(admin);
    const { error } = await admin.from("khet_club_referral_rewards").insert({
      referrer_user_id: payment.referrer_user_id,
      referee_user_id: payment.user_id,
      payment_id: payment.id,
      reward_inr: settings.referrer_reward_inr,
    });
    if (error && error.code !== "23505") console.error("recordReferralReward failed:", error);
  } catch (err) {
    console.error("recordReferralReward threw:", err);
  }
}
