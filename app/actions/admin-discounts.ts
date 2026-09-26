"use server";

import { ok, fail, type ActionResult } from "@/lib/action-result";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createSessionClient } from "@/lib/supabase/session";

/**
 * Discount codes are validated and priced entirely server-side (see
 * khet_club_validate_discount). Nothing here is ever exposed to a
 * customer — the codes table is service_role only, so codes can't be
 * enumerated from the client.
 */
export async function adminCreateDiscountCode(formData: FormData): Promise<ActionResult> {
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const discountType = String(formData.get("discountType") || "");
  const discountValue = Number(formData.get("discountValue"));
  const maxUsesRaw = String(formData.get("maxUses") || "").trim();
  const expiresRaw = String(formData.get("expiresAt") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!code || !/^[A-Z0-9-]{3,24}$/.test(code)) return fail("Code must be 3–24 letters, numbers or dashes.");
  if (!["percent", "fixed"].includes(discountType)) return fail("Choose percent or fixed amount.");
  if (!Number.isFinite(discountValue) || discountValue <= 0) return fail("Enter a discount value greater than 0.");
  if (discountType === "percent" && discountValue > 100) return fail("A percent discount can't be more than 100.");

  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) return fail("Max uses must be a whole number greater than 0.");

  const session = await createSessionClient();
  const {
    data: { user: admin },
  } = await session.auth.getUser();

  const supabase = createServiceClient();
  const { error } = await supabase.from("khet_club_discount_codes").insert({
    code,
    discount_type: discountType,
    discount_value: discountValue,
    max_uses: maxUses,
    expires_at: expiresRaw || null,
    note: note || null,
    created_by: admin?.id ?? null,
  });

  if (error) {
    console.error("adminCreateDiscountCode failed:", error);
    return fail(error.code === "23505" ? `The code ${code} already exists.` : "Couldn't create the code. Please try again.");
  }

  revalidatePath("/admin/crops");
  return ok(`Discount code ${code} created.`);
}

/**
 * Deactivates rather than deletes — a code that has been redeemed is
 * referenced by redemption records, and those are the audit trail for
 * money that was discounted.
 */
export async function adminToggleDiscountCode(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") || "");
  const makeActive = String(formData.get("makeActive") || "") === "true";
  if (!id) return fail("Missing code reference.");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_discount_codes")
    .update({ is_active: makeActive })
    .eq("id", id);

  if (error) {
    console.error("adminToggleDiscountCode failed:", error);
    return fail("Couldn't update the code.");
  }

  revalidatePath("/admin/crops");
  return ok(makeActive ? "Code activated." : "Code deactivated.");
}
