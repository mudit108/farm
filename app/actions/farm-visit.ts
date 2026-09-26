"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/session";
import { todayInIndia } from "@/lib/demo-data";
import { normalizeIndianMobile, PHONE_ERROR_TEXT } from "@/lib/phone";

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

  if (!preferredDate || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    return { status: "error", message: "Please choose a preferred date." };
  }
  if (preferredDate <= todayInIndia()) {
    return { status: "error", message: "Please choose a date from tomorrow onwards." };
  }
  if (!Number.isInteger(visitors) || visitors < 1 || visitors > 20) {
    return { status: "error", message: "Number of visitors should be between 1 and 20." };
  }
  const normalizedPhone = normalizeIndianMobile(phone);
  if (!normalizedPhone) {
    return { status: "error", message: PHONE_ERROR_TEXT };
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
    phone: normalizedPhone,
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
