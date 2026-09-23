"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/session";
import { createServiceClient } from "@/lib/supabase/service";
import { PaymentService } from "@/lib/payments/payment-service";
import { sendPlotConfirmationEmail, sendReceiptEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp/whatsapp-service";
import { generateReceiptPdf } from "@/lib/receipt";
import {
  membershipPlans,
  FEEDING_FAMILIES_PER_PLOT,
  installmentFeeInr,
  INSTALLMENT_DUE_DAYS,
  balanceLateFeeInr,
  balanceStage,
  todayInIndia,
} from "@/lib/demo-data";

export type CreateOrderResult =
  | { status: "error"; message: string }
  | {
      status: "ready";
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      planId: string;
    };

type Season = { registration_deadline: string | null; total_plots: number; registrations_paused: boolean };

/**
 * Step 1: create a Razorpay order for the chosen plan. Amount comes from
 * the server's own membershipPlans lookup — never from client input.
 * Customers may buy more than one plan (upgrade/stack) as long as
 * today is on/before the season's registration_deadline; the RPC in
 * verifyPaymentAndClaim enforces this again server-side regardless of
 * what's checked here.
 *
 * startPlot is optional: if provided, the member is choosing exactly
 * where their plots start (must end up a contiguous, available block —
 * re-validated authoritatively by the RPC at claim time, not just here).
 * Left undefined, the next available plots are auto-assigned as before.
 */
export async function createPlanOrder(
  planId: string,
  startPlot?: number,
  discountCode?: string,
  paymentMode: "full" | "installment" = "full"
): Promise<CreateOrderResult> {
  const plan = membershipPlans.find((p) => p.id === planId);
  if (!plan) {
    return { status: "error", message: "Please choose a valid plan." };
  }

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Please log in first." };
  }

  // Live, admin-editable price — never the static file's priceInr. This
  // is what actually gets charged, so it must reflect whatever's
  // currently set in khet_club_plan_prices, not a stale build-time value.
  const { data: priceRow, error: priceError } = await supabase
    .from("khet_club_plan_prices")
    .select("price_inr")
    .eq("plan_id", planId)
    .single();
  if (priceError || !priceRow) {
    console.error("createPlanOrder: failed to load live price:", priceError);
    return { status: "error", message: "Something went wrong loading pricing. Please try again." };
  }
  const basePriceInr = priceRow.price_inr;

  // Discount is validated and priced entirely server-side against the
  // live price — nothing the client sends can influence the amount.
  let priceInr = basePriceInr;
  let discountCodeId: string | null = null;
  let discountInr = 0;

  if (discountCode && discountCode.trim()) {
    const admin0 = createServiceClient();
    const { data: discountData, error: discountError } = await admin0.rpc("khet_club_validate_discount", {
      p_code: discountCode.trim(),
      p_plan_id: planId,
    });
    const result = (discountData as {
      valid: boolean;
      reason: string | null;
      code_id: string | null;
      original_inr: number;
      discount_inr: number;
      final_inr: number;
    }[] | null)?.[0];

    if (discountError) {
      console.error("createPlanOrder: discount validation failed:", discountError);
      return { status: "error", message: "Couldn't check that code. Please try again." };
    }
    if (!result?.valid) {
      return { status: "error", message: result?.reason ?? "That code isn't valid." };
    }

    priceInr = result.final_inr;
    discountInr = result.discount_inr;
    discountCodeId = result.code_id;
  }

  const { data: seasonData } = await supabase.rpc("khet_club_get_season");
  const season = (seasonData as Season[] | null)?.[0];

  // Checked here too, not just in the claim RPC below — this stops a
  // Razorpay order from being created at all while paused, rather than
  // letting someone pay and then fail at the claim step afterward.
  // Still not the authoritative gate on its own: the RPC re-checks
  // under lock at claim time, same reasoning as the deadline check.
  if (season?.registrations_paused) {
    return {
      status: "error",
      message: "New bookings are temporarily paused. Please try again shortly.",
    };
  }

  if (season?.registration_deadline && new Date() > new Date(`${season.registration_deadline}T23:59:59`)) {
    return {
      status: "error",
      message: `Registration closed on ${new Date(season.registration_deadline).toLocaleDateString("en-IN")}.`,
    };
  }

  // Preliminary check only (nice UX — avoid charging for a range that's
  // obviously already gone). Not authoritative: the RPC re-checks with
  // real row locks at claim time, which is what actually prevents races.
  if (startPlot !== undefined) {
    const endPlot = startPlot + plan.plots - 1;
    const totalPlots = season?.total_plots ?? 80;
    if (startPlot < 1 || endPlot > totalPlots) {
      return { status: "error", message: "That plot range is out of bounds." };
    }
    // MUST use the service client, not the session client.
    //
    // RLS on khet_club_plots is "users can read own plot"
    // (user_id = auth.uid()). Available plots have user_id = NULL, so
    // that predicate is never true for them — a customer's own session
    // sees ZERO available plots. Running this count through the session
    // client therefore always returned 0, which made this check fail
    // 100% of the time and made "Choose my own plots" completely
    // unusable, no matter how free the plots actually were.
    //
    // Reading plot availability server-side to validate a purchase is
    // not user-scoped data access, so service_role is correct here. The
    // public plot grid gets the same information through the
    // khet_club_all_plot_statuses() security-definer RPC.
    const availabilityClient = createServiceClient();
    const { count } = await availabilityClient
      .from("khet_club_plots")
      .select("plot_number", { count: "exact", head: true })
      .gte("plot_number", startPlot)
      .lte("plot_number", endPlot)
      .eq("status", "available");
    if ((count ?? 0) < plan.plots) {
      return { status: "error", message: "That plot range isn't fully available. Please pick another." };
    }
  }

  // Installment math: fee is charged ON the deposit, not split across
  // both payments — it's a fee for offering the option, paid upfront,
  // same as a loan processing fee. balanceDueInr is stored directly on
  // the payment row so the claim step below never has to back-compute
  // it from a rounded deposit amount.
  const fee = paymentMode === "installment" ? installmentFeeInr(planId) : 0;
  const half = Math.round(priceInr / 2);
  const balanceDueInr = paymentMode === "installment" ? priceInr - half : 0;
  const chargeNowInr = paymentMode === "installment" ? half + fee : priceInr;

  try {
    const order = await PaymentService.createOrder({
      amount: chargeNowInr * 100,
      currency: "INR",
      receipt: `${planId}-${user.id.slice(0, 8)}-${Date.now()}`,
      notes: { userId: user.id, planId, startPlot: startPlot ? String(startPlot) : "auto", paymentMode },
    });

    const admin = createServiceClient();
    const { error } = await admin.from("khet_club_payments").insert({
      user_id: user.id,
      plan_id: planId,
      razorpay_order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      status: "created",
      start_plot: startPlot ?? null,
      discount_code_id: discountCodeId,
      discount_inr: discountInr,
      payment_kind: paymentMode === "installment" ? "deposit" : "full",
      installment_fee_inr: fee,
      balance_due_inr: balanceDueInr,
    });
    if (error) {
      console.error("Failed to record payment order:", error);
      return { status: "error", message: "Something went wrong. Please try again." };
    }

    return {
      status: "ready",
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: order.keyId,
      planId,
    };
  } catch (err) {
    console.error("createPlanOrder failed:", err);
    return {
      status: "error",
      message: "Payments aren't configured yet — please contact us to complete your registration.",
    };
  }
}

export type VerifyPaymentResult =
  | { status: "success"; plotNumbers: number[] }
  | { status: "error"; message: string };

function claimErrorMessage(error: { message: string }): string {
  if (error.message.includes("REGISTRATIONS_PAUSED")) {
    return "Bookings were paused just as you completed payment — you have been refunded automatically. Please try again shortly.";
  }
  if (error.message.includes("REGISTRATION_CLOSED")) {
    return "Registration has just closed for this season — you have been refunded automatically.";
  }
  if (error.message.includes("PLOTS_NOT_AVAILABLE")) {
    return "Someone else just claimed one of your chosen plots — you have been refunded automatically. Please pick a different range.";
  }
  if (error.message.includes("NOT_ENOUGH_PLOTS_AVAILABLE")) {
    return "All plots for this plan just sold out — you have been refunded automatically.";
  }
  return "Something went wrong completing your registration — you have been refunded automatically.";
}

/**
 * Step 2: called from the Razorpay checkout success handler. Verifies the
 * signature server-side, marks the payment paid, then claims the plan.
 * If the claim fails after a verified payment, the payment is refunded
 * automatically rather than leaving the customer charged with nothing to
 * show for it.
 *
 * Idempotent per payment row via claim_batch_id: if this exact order was
 * already claimed (e.g. the webhook beat this callback to it), returns
 * the same plot numbers instead of attempting a second claim.
 */
export async function verifyPaymentAndClaim(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<VerifyPaymentResult> {
  const valid = await PaymentService.verifyPayment(input);
  if (!valid) {
    return { status: "error", message: "Payment verification failed. Please contact support." };
  }

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Please log in first." };
  }

  const admin = createServiceClient();

  const { data: payment } = await admin
    .from("khet_club_payments")
    .select("id, plan_id, status, user_id, claim_batch_id, start_plot, amount, razorpay_order_id, discount_code_id, discount_inr, payment_kind, installment_fee_inr, balance_due_inr")
    .eq("razorpay_order_id", input.orderId)
    .maybeSingle();

  if (!payment || payment.user_id !== user.id) {
    return { status: "error", message: "Payment record not found." };
  }

  if (payment.claim_batch_id) {
    const { data: plots } = await supabase
      .from("khet_club_plots")
      .select("plot_number")
      .eq("claim_batch_id", payment.claim_batch_id)
      .order("plot_number");
    const plotNumbers = ((plots ?? []) as { plot_number: number }[]).map((p) => p.plot_number);
    return { status: "success", plotNumbers };
  }

  if (payment.status !== "paid") {
    await admin
      .from("khet_club_payments")
      .update({ status: "paid", razorpay_payment_id: input.paymentId })
      .eq("id", payment.id);
  }

  // Count the discount code's use only now that the payment has
  // genuinely succeeded — an abandoned checkout never burns a use.
  // The RPC is idempotent on razorpay_order_id, so a retry or double
  // verification can't double-count.
  if (payment.discount_code_id) {
    const { error: redeemError } = await admin.rpc("khet_club_redeem_discount", {
      p_code_id: payment.discount_code_id,
      p_user_id: payment.user_id,
      p_razorpay_order_id: payment.razorpay_order_id,
      p_plan_id: payment.plan_id,
      p_original_inr: payment.amount / 100 + (payment.discount_inr ?? 0),
      p_discount_inr: payment.discount_inr ?? 0,
      p_final_inr: payment.amount / 100,
    });
    if (redeemError) {
      // Never block the claim — the member has paid.
      console.error("Discount redemption record failed:", redeemError);
    }
  }

  const { data, error } = await supabase.rpc("khet_club_claim_my_plan", {
    p_plan_id: payment.plan_id,
    p_start_plot: payment.start_plot,
  });

  if (error) {
    console.error("Post-payment claim failed, refunding:", error);
    try {
      const Razorpay = (await import("razorpay")).default;
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });
      await razorpay.payments.refund(input.paymentId, {});
      await admin.from("khet_club_payments").update({ status: "refunded" }).eq("id", payment.id);
    } catch (refundErr) {
      console.error("Automatic refund also failed — needs manual review:", refundErr);
    }
    return { status: "error", message: claimErrorMessage(error) };
  }

  const plotNumbers = (data as number[]).slice().sort((a, b) => a - b);

  const { data: batchRow } = await admin
    .from("khet_club_plots")
    .select("claim_batch_id")
    .eq("plot_number", plotNumbers[0])
    .maybeSingle();
  if (batchRow?.claim_batch_id) {
    await admin
      .from("khet_club_payments")
      .update({ claim_batch_id: batchRow.claim_batch_id })
      .eq("id", payment.id);
  }

  // 50-50 split: the deposit just claimed the plot exactly like a full
  // payment would (same RPC, same row above). This is the ONE extra
  // step a deposit needs beyond that — a record of what's still owed
  // and by when, which is what makes "follow up manually" on an unpaid
  // balance an actual, findable thing rather than a hope.
  if (payment.payment_kind === "deposit" && batchRow?.claim_batch_id) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + INSTALLMENT_DUE_DAYS);
    const { error: planError } = await admin.from("khet_club_installment_plans").insert({
      claim_batch_id: batchRow.claim_batch_id,
      user_id: payment.user_id,
      plan_id: payment.plan_id,
      deposit_paid_inr: payment.amount / 100,
      installment_fee_inr: payment.installment_fee_inr,
      balance_due_inr: payment.balance_due_inr,
      balance_due_date: dueDate.toISOString().slice(0, 10),
    });
    if (planError) {
      // The plot claim has already succeeded and is not undone for
      // this — but this must not fail silently, since it's the only
      // record that a balance is owed at all.
      console.error("Failed to create installment plan record after deposit:", planError);
    }
  }

  // Receipt generation is immediate — proof of payment, unlike the
  // certificate, which stays gated behind admin approval. A failed
  // receipt (email or otherwise) never blocks the plot claim itself,
  // which has already succeeded by this point.
  if (batchRow?.claim_batch_id) {
    try {
      const plan = membershipPlans.find((p) => p.id === payment.plan_id);
      const { data: receiptNumber, error: numberError } = await admin.rpc("khet_club_next_receipt_number");
      if (numberError || !receiptNumber) {
        console.error("Receipt numbering failed:", numberError);
      } else {
        const fullName = (user.user_metadata?.full_name as string) || "Mera Khet Member";
        const feedingFamiliesInr = plotNumbers.length * FEEDING_FAMILIES_PER_PLOT;
        const amountInr = payment.amount / 100;

        const { error: receiptInsertError } = await admin.from("khet_club_receipts").insert({
          receipt_number: receiptNumber,
          user_id: user.id,
          payment_id: payment.id,
          claim_batch_id: batchRow.claim_batch_id,
          plan_id: payment.plan_id,
          plot_numbers: plotNumbers,
          full_name: fullName,
          amount_paise: payment.amount,
          feeding_families_inr: feedingFamiliesInr,
        });

        if (receiptInsertError) {
          console.error("Receipt insert failed:", receiptInsertError);
        } else if (plan && user.email) {
          const pdfBuffer = await generateReceiptPdf({
            receiptNumber,
            fullName,
            email: user.email,
            planName: plan.name,
            planLabel: plan.label,
            plotNumbers,
            amountInr,
            feedingFamiliesInr,
            razorpayOrderId: payment.razorpay_order_id,
            razorpayPaymentId: input.paymentId,
            issuedDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
          });

          const emailResult = await sendReceiptEmail({
            to: user.email,
            fullName,
            receiptNumber,
            pdfBuffer,
          });

          await admin
            .from("khet_club_receipts")
            .update({ email_sent: emailResult.sent })
            .eq("receipt_number", receiptNumber);
        }
      }
    } catch (receiptErr) {
      console.error("Receipt generation threw (plot claim already succeeded, unaffected):", receiptErr);
    }
  }

  if (user.email) {
    const plan = membershipPlans.find((p) => p.id === payment.plan_id);
    await sendPlotConfirmationEmail({
      to: user.email,
      fullName: (user.user_metadata?.full_name as string) || "there",
      plotNumber: plotNumbers[0],
      allPlotNumbers: plotNumbers,
      planLabel: plan?.name,
    });
  }

  const phone = user.user_metadata?.phone as string | undefined;
  if (phone) {
    const plan = membershipPlans.find((p) => p.id === payment.plan_id);
    const plotList = plotNumbers.map((n) => `#${n}`).join(", ");
    const whatsappResult = await sendWhatsAppMessage(
      phone,
      `🎉 You're confirmed! Plot${plotNumbers.length > 1 ? "s" : ""} ${plotList} assigned for your ${plan?.name ?? "plan"} membership. Welcome to Mera Khet!`
    );
    await admin.from("khet_club_whatsapp_messages").insert({
      user_id: user.id,
      phone,
      message: `Plot confirmation: ${plotList}`,
      kind: "automated",
      status: whatsappResult.success ? "sent" : "failed",
      error_message: whatsappResult.success ? null : whatsappResult.error,
    });
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/select-plot");
  revalidatePath("/dashboard/my-farm");

  return { status: "success", plotNumbers };
}

export type DiscountPreview =
  | { status: "idle" }
  | { status: "invalid"; message: string }
  | { status: "valid"; originalInr: number; discountInr: number; finalInr: number; code: string };

const DISCOUNT_ATTEMPT_MAX = 10;
const DISCOUNT_ATTEMPT_WINDOW_MINUTES = 60;

/**
 * Checks a code and returns the real discounted total so the member can
 * see it BEFORE the payment window opens — paying without knowing the
 * final amount is a bad experience and erodes trust.
 *
 * This is a read-only preview: it never creates an order and never
 * consumes a use of the code. createPlanOrder re-validates
 * independently at order time, so a stale or tampered preview can't
 * affect what's actually charged.
 *
 * Rate-limited on FAILED attempts only, since exposing a validator
 * without committing to payment would otherwise let someone guess
 * codes indefinitely.
 */
export async function previewDiscountCode(planId: string, code: string): Promise<DiscountPreview> {
  const trimmed = (code || "").trim();
  if (!trimmed) return { status: "idle" };

  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return { status: "invalid", message: "Please log in first." };

  const admin = createServiceClient();

  const since = new Date(Date.now() - DISCOUNT_ATTEMPT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await admin
    .from("khet_club_discount_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("succeeded", false)
    .gte("attempted_at", since);

  if ((count ?? 0) >= DISCOUNT_ATTEMPT_MAX) {
    return {
      status: "invalid",
      message: "Too many code attempts. Please wait a while before trying again.",
    };
  }

  const { data, error } = await admin.rpc("khet_club_validate_discount", {
    p_code: trimmed,
    p_plan_id: planId,
  });

  if (error) {
    console.error("previewDiscountCode failed:", error);
    return { status: "invalid", message: "Couldn't check that code. Please try again." };
  }

  const result = (data as {
    valid: boolean;
    reason: string | null;
    original_inr: number;
    discount_inr: number;
    final_inr: number;
  }[] | null)?.[0];

  await admin.from("khet_club_discount_attempts").insert({
    user_id: user.id,
    attempted_code: trimmed.toUpperCase().slice(0, 32),
    succeeded: Boolean(result?.valid),
  });

  if (!result?.valid) {
    return { status: "invalid", message: result?.reason ?? "That code isn't valid." };
  }

  return {
    status: "valid",
    originalInr: result.original_inr,
    discountInr: result.discount_inr,
    finalInr: result.final_inr,
    code: trimmed.toUpperCase(),
  };
}

export type InstallmentPlan = {
  id: string;
  plan_id: string;
  balance_due_inr: number;
  balance_due_date: string;
  balance_paid: boolean;
};

/**
 * Reads the current member's own outstanding balance, if any. RLS
 * already scopes this to the caller (users can read own installment
 * plan), so this is a thin, safe wrapper for the dashboard to call.
 */
export async function getMyInstallmentPlan(): Promise<InstallmentPlan | null> {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("khet_club_installment_plans")
    .select("id, plan_id, balance_due_inr, balance_due_date, balance_paid")
    .eq("balance_paid", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as InstallmentPlan | null) ?? null;
}

/**
 * Step 1 of paying off a 50-50 balance. installmentPlanId is checked
 * against the CALLER's own session user — never trusted as-is, the
 * same discipline as every other id a client can send here. The amount
 * charged comes from the stored balance_due_inr, not from anything the
 * client provides.
 */
export async function createBalanceOrder(installmentPlanId: string): Promise<CreateOrderResult> {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Please log in first." };
  }

  const admin = createServiceClient();
  const { data: plan } = await admin
    .from("khet_club_installment_plans")
    .select("id, user_id, plan_id, claim_batch_id, balance_due_inr, balance_due_date, balance_paid")
    .eq("id", installmentPlanId)
    .maybeSingle();

  if (!plan || plan.user_id !== user.id) {
    return { status: "error", message: "Balance record not found." };
  }
  if (plan.balance_paid) {
    return { status: "error", message: "This balance has already been paid." };
  }

  // Late rule (lib/demo-data.ts): fee from day 46, plots released after
  // day 55. Worked out here on the server from the stored due date, so
  // the amount can't be influenced by the browser.
  const { stage } = balanceStage(plan.balance_due_date, todayInIndia());
  if (stage === "released") {
    return {
      status: "error",
      message:
        "This balance wasn't paid within 55 days, so these plots have been released. Please contact us about your deposit under the Refund & Cancellation policy.",
    };
  }
  const lateFeeInr = stage === "late" ? balanceLateFeeInr(plan.plan_id) : 0;

  try {
    const order = await PaymentService.createOrder({
      amount: (plan.balance_due_inr + lateFeeInr) * 100,
      currency: "INR",
      receipt: `balance-${plan.plan_id}-${user.id.slice(0, 8)}-${Date.now()}`,
      notes: { userId: user.id, installmentPlanId: plan.id, kind: "balance", lateFeeInr: String(lateFeeInr) },
    });

    const { error } = await admin.from("khet_club_payments").insert({
      user_id: user.id,
      plan_id: plan.plan_id,
      razorpay_order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      status: "created",
      claim_batch_id: plan.claim_batch_id,
      payment_kind: "balance",
    });
    if (error) {
      console.error("Failed to record balance payment order:", error);
      return { status: "error", message: "Something went wrong. Please try again." };
    }

    return {
      status: "ready",
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: order.keyId,
      planId: plan.plan_id,
    };
  } catch (err) {
    console.error("createBalanceOrder failed:", err);
    return { status: "error", message: "Payments aren't configured yet — please contact us." };
  }
}

/**
 * Step 2: verify the balance payment and mark the installment plan
 * settled. Unlike verifyPaymentAndClaim, there's no plot-claim step
 * here and therefore no refund-on-failure path to mirror — the plot
 * was already claimed at deposit time, so a balance payment only ever
 * needs to be recorded, never undone.
 */
export async function verifyBalancePayment(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<VerifyPaymentResult> {
  const valid = await PaymentService.verifyPayment(input);
  if (!valid) {
    return { status: "error", message: "Payment verification failed. Please contact support." };
  }

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Please log in first." };
  }

  const admin = createServiceClient();
  const { data: payment } = await admin
    .from("khet_club_payments")
    .select("id, user_id, status, claim_batch_id, payment_kind")
    .eq("razorpay_order_id", input.orderId)
    .maybeSingle();

  if (!payment || payment.user_id !== user.id || payment.payment_kind !== "balance") {
    return { status: "error", message: "Payment record not found." };
  }

  if (payment.status !== "paid") {
    await admin
      .from("khet_club_payments")
      .update({ status: "paid", razorpay_payment_id: input.paymentId })
      .eq("id", payment.id);

    const { error: settleError } = await admin
      .from("khet_club_installment_plans")
      .update({
        balance_paid: true,
        balance_paid_at: new Date().toISOString(),
        balance_razorpay_order_id: input.orderId,
        balance_razorpay_payment_id: input.paymentId,
      })
      .eq("claim_batch_id", payment.claim_batch_id)
      .eq("balance_paid", false);

    if (settleError) {
      console.error("Failed to mark installment plan settled after paid balance:", settleError);
    }
  }

  const { data: plots } = await supabase
    .from("khet_club_plots")
    .select("plot_number")
    .eq("claim_batch_id", payment.claim_batch_id)
    .order("plot_number");
  const plotNumbers = ((plots ?? []) as { plot_number: number }[]).map((p) => p.plot_number);

  return { status: "success", plotNumbers };
}
