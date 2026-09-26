"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { ok, fail, type ActionResult } from "@/lib/action-result";

function revalidateReferrals() {
  revalidatePath("/admin/crops");
  revalidatePath("/dashboard/my-farm");
  revalidatePath("/dashboard/select-plot");
}

/**
 * Turns the referral program on/off and sets both amounts. Changing the
 * amounts affects new referrals only — rewards already earned keep the
 * amount that applied when the friend paid.
 */
export async function adminUpdateReferralSettings(formData: FormData): Promise<ActionResult> {
  const enabled = String(formData.get("enabled") || "") === "on";
  const friend = Math.round(Number(formData.get("friendDiscountInr")));
  const reward = Math.round(Number(formData.get("referrerRewardInr")));
  if (!Number.isFinite(friend) || friend < 0) return fail("Enter the friend's discount (₹0 or more).");
  if (!Number.isFinite(reward) || reward < 0) return fail("Enter the referrer's reward (₹0 or more).");
  if (enabled && friend === 0 && reward === 0) return fail("Set at least one amount above ₹0, or switch the program off.");

  const supabase = createServiceClient();
  const { data: prices } = await supabase.from("khet_club_plan_prices").select("price_inr");
  const cheapest = Math.min(...((prices ?? []) as { price_inr: number }[]).map((p) => p.price_inr));
  if (Number.isFinite(cheapest) && friend >= cheapest) {
    return fail(`The friend's discount must be less than the cheapest plan (₹${cheapest.toLocaleString("en-IN")}).`);
  }

  const { error } = await supabase
    .from("khet_club_referral_settings")
    .update({ enabled, friend_discount_inr: friend, referrer_reward_inr: reward, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) {
    console.error("adminUpdateReferralSettings failed:", error);
    return fail("Couldn't save referral settings.");
  }
  revalidateReferrals();
  return ok(
    enabled
      ? `Referrals on — friend gets ₹${friend.toLocaleString("en-IN")} off, referrer earns ₹${reward.toLocaleString("en-IN")}.`
      : "Referral program switched off. Existing codes stop working at checkout."
  );
}

/** Marks a referral reward as paid out (UPI/cash) or cancels it (e.g. the friend was refunded). */
export async function adminSetReferralRewardStatus(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const note = String(formData.get("note") || "").trim();
  if (!id) return fail("Missing reward reference.");
  if (!["paid", "cancelled", "pending"].includes(status)) return fail("Invalid status.");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_referral_rewards")
    .update({
      status,
      paid_note: note || null,
      paid_at: status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) {
    console.error("adminSetReferralRewardStatus failed:", error);
    return fail("Couldn't update the reward.");
  }
  revalidateReferrals();
  return ok(status === "paid" ? "Reward marked paid." : status === "cancelled" ? "Reward cancelled." : "Reward set back to pending.");
}
