"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/session";
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

  if (!fullName) {
    return { status: "error", message: "Please enter your name." };
  }

  const normalizedPhone = normalizeIndianMobile(phone);
  if (!normalizedPhone) {
    return { status: "error", message: PHONE_ERROR_TEXT };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName, phone: normalizedPhone },
  });

  if (error) {
    console.error("updateProfile failed:", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  revalidatePath("/dashboard/account");

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
