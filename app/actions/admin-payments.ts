"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { issueReceiptForPayment } from "@/lib/payments/receipts";

/**
 * Money that arrives outside Razorpay (cash, UPI to the farm's number,
 * bank transfer) and refunds done from the Razorpay dashboard. These only
 * RECORD what already happened, so Finance, receipts and the member's
 * dashboard stay truthful — nothing here moves money.
 */

const METHODS = ["cash", "upi", "bank_transfer", "cheque", "other"] as const;

function revalidateMoney() {
  revalidatePath("/admin");
  revalidatePath("/admin/income");
  revalidatePath("/admin/budget");
  revalidatePath("/admin/members");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/my-farm");
}

/** A 50/50 member paid their balance offline — settle it and issue a receipt. */
export async function adminMarkBalancePaidOffline(formData: FormData): Promise<ActionResult> {
  const installmentPlanId = String(formData.get("installmentPlanId") || "");
  const method = String(formData.get("method") || "");
  const reference = String(formData.get("reference") || "").trim();
  if (!installmentPlanId) return fail("Missing balance reference.");
  if (!METHODS.includes(method as (typeof METHODS)[number])) return fail("Choose how it was paid.");

  const supabase = createServiceClient();
  const { data: plan } = await supabase
    .from("khet_club_installment_plans")
    .select("id, user_id, plan_id, claim_batch_id, balance_due_inr, balance_paid")
    .eq("id", installmentPlanId)
    .maybeSingle();
  if (!plan) return fail("Balance record not found.");
  if (plan.balance_paid) return fail("This balance is already marked paid.");

  const orderRef = `offline-${method}-${randomUUID().slice(0, 8)}`;
  const { data: payment, error: payError } = await supabase
    .from("khet_club_payments")
    .insert({
      user_id: plan.user_id,
      plan_id: plan.plan_id,
      razorpay_order_id: orderRef,
      razorpay_payment_id: reference || null,
      amount: plan.balance_due_inr * 100,
      currency: "INR",
      status: "paid",
      claim_batch_id: plan.claim_batch_id,
      payment_kind: "balance",
    })
    .select("id")
    .single();
  if (payError || !payment) {
    console.error("adminMarkBalancePaidOffline payment insert failed:", payError);
    return fail("Couldn't record the payment. Nothing was changed.");
  }

  const { error: settleError } = await supabase
    .from("khet_club_installment_plans")
    .update({
      balance_paid: true,
      balance_paid_at: new Date().toISOString(),
      balance_razorpay_order_id: orderRef,
      balance_razorpay_payment_id: reference || null,
    })
    .eq("id", plan.id)
    .eq("balance_paid", false);
  if (settleError) {
    console.error("adminMarkBalancePaidOffline settle failed:", settleError);
    return fail("Payment recorded, but couldn't mark the balance settled — try again.");
  }

  const { data: userRes } = await supabase.auth.admin.getUserById(plan.user_id);
  await issueReceiptForPayment(supabase, {
    paymentId: payment.id,
    email: userRes?.user?.email ?? null,
    fullName: (userRes?.user?.user_metadata?.full_name as string) || "Mera Khet Member",
  });

  revalidateMoney();
  return ok(`Balance of ₹${plan.balance_due_inr.toLocaleString("en-IN")} marked paid — receipt emailed to the member.`);
}

/**
 * Records that a Razorpay payment was refunded (done in the Razorpay
 * dashboard). Only changes the status here so totals stop counting it;
 * it does NOT free the member's plots — do that separately if needed.
 */
export async function adminMarkPaymentRefunded(formData: FormData): Promise<ActionResult> {
  const paymentId = String(formData.get("paymentId") || "");
  const confirm = String(formData.get("confirm") || "").trim().toUpperCase();
  if (!paymentId) return fail("Missing payment reference.");
  if (confirm !== "REFUNDED") return fail("Type REFUNDED to confirm.");

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("khet_club_payments")
    .update({ status: "refunded" })
    .eq("id", paymentId)
    .eq("status", "paid")
    .select("amount");
  if (error) {
    console.error("adminMarkPaymentRefunded failed:", error);
    return fail("Couldn't update the payment.");
  }
  if (!data || data.length === 0) return fail("Only a paid payment can be marked refunded.");

  revalidateMoney();
  return ok(
    `Marked ₹${(data[0].amount / 100).toLocaleString("en-IN")} as refunded. If they shouldn't keep their plots, free them from Members.`
  );
}

/**
 * Records a full purchase paid offline for a member who has an account
 * but whose plots were assigned by hand (Members → Manually Assign a
 * Plan with their email). Issues a receipt so it shows in their
 * dashboard and in Finance.
 */
export async function adminRecordOfflinePurchase(formData: FormData): Promise<ActionResult> {
  const claimBatchId = String(formData.get("claimBatchId") || "");
  const method = String(formData.get("method") || "");
  const reference = String(formData.get("reference") || "").trim();
  const amountInr = Math.round(Number(formData.get("amountInr")));
  if (!claimBatchId) return fail("Missing member reference.");
  if (!METHODS.includes(method as (typeof METHODS)[number])) return fail("Choose how it was paid.");
  if (!Number.isFinite(amountInr) || amountInr <= 0) return fail("Enter the amount received.");

  const supabase = createServiceClient();
  const { data: plot } = await supabase
    .from("khet_club_plots")
    .select("user_id, plan_id")
    .eq("claim_batch_id", claimBatchId)
    .limit(1)
    .maybeSingle();
  if (!plot) return fail("Member not found.");
  if (!plot.user_id) {
    return fail("This reservation isn't linked to a member account, so a payment can't be recorded against it.");
  }
  if (!plot.plan_id) return fail("These plots have no plan attached.");

  const { count } = await supabase
    .from("khet_club_payments")
    .select("id", { count: "exact", head: true })
    .eq("claim_batch_id", claimBatchId)
    .eq("status", "paid");
  if ((count ?? 0) > 0) return fail("A payment is already recorded for this purchase.");

  const { data: payment, error } = await supabase
    .from("khet_club_payments")
    .insert({
      user_id: plot.user_id,
      plan_id: plot.plan_id,
      razorpay_order_id: `offline-${method}-${randomUUID().slice(0, 8)}`,
      razorpay_payment_id: reference || null,
      amount: amountInr * 100,
      currency: "INR",
      status: "paid",
      claim_batch_id: claimBatchId,
      payment_kind: "full",
    })
    .select("id")
    .single();
  if (error || !payment) {
    console.error("adminRecordOfflinePurchase failed:", error);
    return fail("Couldn't record the payment.");
  }

  const { data: userRes } = await supabase.auth.admin.getUserById(plot.user_id);
  await issueReceiptForPayment(supabase, {
    paymentId: payment.id,
    email: userRes?.user?.email ?? null,
    fullName: (userRes?.user?.user_metadata?.full_name as string) || "Mera Khet Member",
  });

  revalidateMoney();
  return ok(`₹${amountInr.toLocaleString("en-IN")} recorded — receipt emailed to the member.`);
}
