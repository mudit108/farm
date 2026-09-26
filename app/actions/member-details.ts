"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/session";
import { createServiceClient } from "@/lib/supabase/service";

export type MemberDetailsState = { status: "idle" } | { status: "success" } | { status: "error"; message: string };

const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").trim().slice(0, max) || null;

/**
 * Saves the member's own delivery preferences and payout details. Written
 * with the service client (members have no direct write access to this
 * table) but strictly scoped to the signed-in member's own row.
 */
export async function saveMemberDetails(_prev: MemberDetailsState, formData: FormData): Promise<MemberDetailsState> {
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return { status: "error", message: "Please log in first." };

  const timePref = String(formData.get("deliveryTimePref") || "any");
  if (!["any", "morning", "afternoon", "evening"].includes(timePref)) {
    return { status: "error", message: "Choose a valid delivery time." };
  }

  const upi = clean(formData.get("payoutUpi"), 80);
  if (upi && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upi)) {
    return { status: "error", message: "That UPI ID doesn't look right — it should look like name@bank." };
  }
  const accountNumber = clean(formData.get("payoutAccountNumber"), 30)?.replace(/\s/g, "") ?? null;
  if (accountNumber && !/^\d{6,20}$/.test(accountNumber)) {
    return { status: "error", message: "Bank account number should be 6–20 digits." };
  }
  const ifsc = clean(formData.get("payoutIfsc"), 11)?.toUpperCase() ?? null;
  if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    return { status: "error", message: "IFSC should look like SBIN0001234." };
  }
  if ((accountNumber && !ifsc) || (ifsc && !accountNumber)) {
    return { status: "error", message: "For a bank payout, enter both the account number and IFSC." };
  }

  const admin = createServiceClient();
  const { error } = await admin.from("khet_club_member_details").upsert({
    user_id: user.id,
    delivery_time_pref: timePref,
    delivery_days_note: clean(formData.get("deliveryDaysNote"), 120),
    delivery_instructions: clean(formData.get("deliveryInstructions"), 300),
    payout_upi: upi,
    payout_account_name: clean(formData.get("payoutAccountName"), 100),
    payout_account_number: accountNumber,
    payout_ifsc: ifsc,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("saveMemberDetails failed:", error);
    return { status: "error", message: "Couldn't save. Please try again." };
  }

  revalidatePath("/dashboard/my-farm");
  revalidatePath("/admin/members");
  return { status: "success" };
}
