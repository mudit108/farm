"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/session";

export type HarvestPrefState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

const VALID_METHODS = ["home-delivery", "processed", "sell-to-market"];

function validateInput(formData: FormData):
  | { ok: true; method: string; schedule: string; installmentKg: number | null }
  | { ok: false; message: string } {
  const method = String(formData.get("method") || "");
  const schedule = String(formData.get("schedule") || "one-time");
  const installmentKgRaw = String(formData.get("installmentKg") || "").trim();

  if (!VALID_METHODS.includes(method)) {
    return { ok: false, message: "Please choose a valid option." };
  }
  if (!["one-time", "monthly"].includes(schedule)) {
    return { ok: false, message: "Please choose a valid delivery schedule." };
  }
  const canSchedule = method === "home-delivery" || method === "processed";
  const effectiveSchedule = canSchedule ? schedule : "one-time";

  let installmentKg: number | null = null;
  if (canSchedule && effectiveSchedule === "monthly") {
    const parsed = Number(installmentKgRaw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return { ok: false, message: "Please enter a valid monthly amount in kg." };
    }
    installmentKg = Math.round(parsed);
  }

  return { ok: true, method, schedule: effectiveSchedule, installmentKg };
}

/**
 * First-time save only. khet_club_harvest_preferences.user_id is the
 * primary key, so a second direct insert attempt fails at the database
 * level (not just hidden by the UI) — that's the actual "only once"
 * enforcement. Any change after the first save must go through
 * requestHarvestPreferenceChange instead.
 */
export async function saveHarvestPreference(
  _prev: HarvestPrefState,
  formData: FormData
): Promise<HarvestPrefState> {
  const parsed = validateInput(formData);
  if (!parsed.ok) {
    return { status: "error", message: parsed.message };
  }

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Please log in first." };
  }

  const { error } = await supabase.from("khet_club_harvest_preferences").insert({
    user_id: user.id,
    method: parsed.method,
    schedule: parsed.schedule,
    installment_kg: parsed.installmentKg,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: "You've already set your harvest preference — request a change instead.",
      };
    }
    console.error("saveHarvestPreference failed:", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  revalidatePath("/dashboard/membership");
  revalidatePath("/admin/customers");

  return { status: "success" };
}

/**
 * Submits a change request instead of editing the preference directly.
 * Only takes effect once an admin approves it (see
 * app/actions/admin-harvest.ts). A partial unique index on the requests
 * table (status = 'pending') blocks a second request while one is still
 * outstanding — the duplicate-key error is what maps to the friendly
 * message below, not an application-level check.
 */
export async function requestHarvestPreferenceChange(
  _prev: HarvestPrefState,
  formData: FormData
): Promise<HarvestPrefState> {
  const parsed = validateInput(formData);
  if (!parsed.ok) {
    return { status: "error", message: parsed.message };
  }

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Please log in first." };
  }

  const { error } = await supabase.from("khet_club_harvest_preference_requests").insert({
    user_id: user.id,
    requested_method: parsed.method,
    requested_schedule: parsed.schedule,
    requested_installment_kg: parsed.installmentKg,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: "You already have a change request pending admin approval.",
      };
    }
    console.error("requestHarvestPreferenceChange failed:", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  revalidatePath("/dashboard/membership");
  revalidatePath("/admin/harvest");

  return { status: "success" };
}
