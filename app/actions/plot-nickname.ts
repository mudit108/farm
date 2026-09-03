"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/session";

export type NicknameState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function updatePlotNickname(
  _prev: NicknameState,
  formData: FormData
): Promise<NicknameState> {
  const nickname = String(formData.get("nickname") || "").trim().slice(0, 60);

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Please log in first." };
  }

  // Column-scoped grant: this update can only ever touch custom_name on
  // rows already owned by the caller — see the privilege hardening
  // migration for why that's enforced at the database level, not just
  // trusted here.
  const { error } = await supabase
    .from("khet_club_plots")
    .update({ custom_name: nickname || null })
    .eq("user_id", user.id);

  if (error) {
    console.error("updatePlotNickname failed:", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  revalidatePath("/dashboard/select-plot");
  revalidatePath("/dashboard/my-farm");
  revalidatePath("/dashboard");
  revalidatePath("/admin/customers");

  return { status: "success" };
}
