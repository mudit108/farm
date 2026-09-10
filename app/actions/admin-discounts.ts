"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createSessionClient } from "@/lib/supabase/session";

/**
 * Discount codes are validated and priced entirely server-side (see
 * khet_club_validate_discount). Nothing here is ever exposed to a
 * customer — the codes table is service_role only, so codes can't be
 * enumerated from the client.
 */
export async function adminCreateDiscountCode(formData: FormData): Promise<void> {
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const discountType = String(formData.get("discountType") || "");
  const discountValue = Number(formData.get("discountValue"));
  const maxUsesRaw = String(formData.get("maxUses") || "").trim();
  const expiresRaw = String(formData.get("expiresAt") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!code || !/^[A-Z0-9-]{3,24}$/.test(code)) return;
  if (!["percent", "fixed"].includes(discountType)) return;
  if (!Number.isFinite(discountValue) || discountValue <= 0) return;
  if (discountType === "percent" && discountValue > 100) return;

  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) return;

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
    return;
  }

  revalidatePath("/admin/crops");
}

/**
 * Deactivates rather than deletes — a code that has been redeemed is
 * referenced by redemption records, and those are the audit trail for
 * money that was discounted.
 */
export async function adminToggleDiscountCode(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const makeActive = String(formData.get("makeActive") || "") === "true";
  if (!id) return;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("khet_club_discount_codes")
    .update({ is_active: makeActive })
    .eq("id", id);

  if (error) {
    console.error("adminToggleDiscountCode failed:", error);
    return;
  }

  revalidatePath("/admin/crops");
}
