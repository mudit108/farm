"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/session";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeIndianMobile, PHONE_ERROR_TEXT } from "@/lib/phone";

export type ProfileState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const fullName = String(formData.get("fullName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const pincode = String(formData.get("pincode") || "").trim();

  if (!fullName) {
    return { status: "error", message: "Please enter your name." };
  }

  const normalizedPhone = normalizeIndianMobile(phone);
  if (!normalizedPhone) {
    return { status: "error", message: PHONE_ERROR_TEXT };
  }

  if (!city) {
    return { status: "error", message: "Please enter your delivery city." };
  }

  if (pincode && !/^\d{6}$/.test(pincode)) {
    return { status: "error", message: "Pincode should be 6 digits." };
  }

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName, phone: normalizedPhone, city, address: address || null, pincode: pincode || null },
  });

  if (error) {
    console.error("updateProfile failed:", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  // Plot rows hold a copy of the member's contact details (taken at claim
  // time) — that's what the admin screens, delivery planning and the
  // "Registered to" line read. Sync every field here, or edits made on
  // this page would never reach them.
  //
  // Uses the service client deliberately: `authenticated` is granted
  // UPDATE on `custom_name` only (verified against column_privileges),
  // so a session-client write here would fail silently. Scoped strictly
  // to this user's own rows.
  if (user) {
    const admin = createServiceClient();
    const { error: plotError } = await admin
      .from("khet_club_plots")
      .update({ full_name: fullName, phone: normalizedPhone, city, address: address || null, pincode: pincode || null })
      .eq("user_id", user.id);
    if (plotError) {
      console.error("updateProfile plot sync failed:", plotError);
    }
  }

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard/my-farm");
  revalidatePath("/dashboard");
  revalidatePath("/admin/members");

  return { status: "success" };
}

export type PasswordState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function updatePassword(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 8) {
    return { status: "error", message: "Please use at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { status: "error", message: "The two passwords don't match." };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error("updatePassword failed:", error);
    return {
      status: "error",
      message: error.message.toLowerCase().includes("same")
        ? "That's already your current password — please choose a different one."
        : "Something went wrong. Please try again.",
    };
  }

  return { status: "success" };
}
