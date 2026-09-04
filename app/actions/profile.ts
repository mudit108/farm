"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/session";

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

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName, phone },
  });

  if (error) {
    console.error("updateProfile failed:", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  revalidatePath("/dashboard/account");

  return { status: "success" };
}
