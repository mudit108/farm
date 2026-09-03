"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/session";

export type FarmVisitState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function submitFarmVisit(
  _prev: FarmVisitState,
  formData: FormData
): Promise<FarmVisitState> {
  const preferredDate = String(formData.get("preferredDate") || "");
  const visitors = Number(formData.get("visitors") || 1);
  const phone = String(formData.get("phone") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!preferredDate) {
    return { status: "error", message: "Please choose a preferred date." };
  }

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please log in first." };
  }

  const { error } = await supabase.from("khet_club_farm_visits").insert({
    user_id: user.id,
    preferred_date: preferredDate,
    visitors,
    phone: phone || null,
    notes: notes || null,
  });

  if (error) {
    console.error("submitFarmVisit failed:", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  revalidatePath("/dashboard/farm-visit");
  revalidatePath("/admin/visits");

  return { status: "success" };
}
