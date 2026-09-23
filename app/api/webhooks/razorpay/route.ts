import { NextResponse } from "next/server";
import { PaymentService } from "@/lib/payments/payment-service";
import { createServiceClient } from "@/lib/supabase/service";
import { sendPlotConfirmationEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp/whatsapp-service";
import { membershipPlans, INSTALLMENT_DUE_DAYS } from "@/lib/demo-data";

/**
 * Configure this URL in the Razorpay Dashboard → Settings → Webhooks,
 * subscribed to the "payment.captured" event, with RAZORPAY_WEBHOOK_SECRET
 * set to the same secret shown there.
 *
 * Safety net for the client-side checkout handler in app/actions/
 * payment.ts: if the browser closes or the network drops right after a
 * successful payment, this webhook still confirms it and claims the plan.
 *
 * Idempotent via each payment row's own claim_batch_id (not "does this
 * user have any plot" — that stopped being a valid signal once customers
 * were allowed to buy more than one plan). Also refunds automatically if
 * the claim fails after payment succeeds, same as the client-side path.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !PaymentService.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  if (event.event !== "payment.captured") {
    return NextResponse.json({ received: true });
  }

  const payment = event.payload?.payment?.entity;
  const orderId: string | undefined = payment?.order_id;
  const paymentId: string | undefined = payment?.id;
  if (!orderId || !paymentId) {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const admin = createServiceClient();

  const { data: record } = await admin
    .from("khet_club_payments")
    .select("id, user_id, plan_id, status, claim_batch_id, start_plot, payment_kind, installment_fee_inr, balance_due_inr, amount")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (!record) {
    return NextResponse.json({ received: true });
  }

  if (record.claim_batch_id) {
    return NextResponse.json({ received: true });
  }

  if (record.status !== "paid") {
    await admin
      .from("khet_club_payments")
      .update({ status: "paid", razorpay_payment_id: paymentId })
      .eq("id", record.id);
  }

  const { data: plotNumbersRaw, error } = await admin.rpc("khet_club_claim_my_plan_as", {
    p_user_id: record.user_id,
    p_plan_id: record.plan_id,
    p_start_plot: record.start_plot,
  });

  if (error) {
    console.error("Webhook claim failed, refunding:", error);
    try {
      const Razorpay = (await import("razorpay")).default;
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });
      await razorpay.payments.refund(paymentId, {});
      await admin.from("khet_club_payments").update({ status: "refunded" }).eq("id", record.id);
    } catch (refundErr) {
      console.error("Automatic refund also failed — needs manual review:", refundErr);
    }
    return NextResponse.json({ received: true });
  }

  const plotNumbers = (plotNumbersRaw as number[]).slice().sort((a, b) => a - b);

  const { data: batchRow } = await admin
    .from("khet_club_plots")
    .select("claim_batch_id")
    .eq("plot_number", plotNumbers[0])
    .maybeSingle();
  if (batchRow?.claim_batch_id) {
    await admin
      .from("khet_club_payments")
      .update({ claim_batch_id: batchRow.claim_batch_id })
      .eq("id", record.id);
  }

  // Mirrors the same step in verifyPaymentAndClaim (app/actions/payment.ts).
  // This webhook is the safety net for when the browser closes right
  // after a successful payment — if the client-side handler already ran,
  // claim_batch_id is set above and this route returns early before
  // reaching here, so there's no risk of creating this row twice via
  // both paths for the same deposit.
  if (record.payment_kind === "deposit" && batchRow?.claim_batch_id) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + INSTALLMENT_DUE_DAYS);
    const { error: planError } = await admin.from("khet_club_installment_plans").insert({
      claim_batch_id: batchRow.claim_batch_id,
      user_id: record.user_id,
      plan_id: record.plan_id,
      deposit_paid_inr: record.amount / 100,
      installment_fee_inr: record.installment_fee_inr,
      balance_due_inr: record.balance_due_inr,
      balance_due_date: dueDate.toISOString().slice(0, 10),
    });
    if (planError) {
      console.error("Webhook: failed to create installment plan record:", planError);
    }
  }

  const { data: userRes } = await admin.auth.admin.getUserById(record.user_id);
  const user = userRes?.user;
  if (user?.email) {
    const plan = membershipPlans.find((p) => p.id === record.plan_id);
    await sendPlotConfirmationEmail({
      to: user.email,
      fullName: (user.user_metadata?.full_name as string) || "there",
      plotNumber: plotNumbers[0],
      allPlotNumbers: plotNumbers,
      planLabel: plan?.name,
    });
  }

  const phone = user?.user_metadata?.phone as string | undefined;
  if (phone) {
    const plan = membershipPlans.find((p) => p.id === record.plan_id);
    const plotList = plotNumbers.map((n) => `#${n}`).join(", ");
    const whatsappResult = await sendWhatsAppMessage(
      phone,
      `🎉 You're confirmed! Plot${plotNumbers.length > 1 ? "s" : ""} ${plotList} assigned for your ${plan?.name ?? "plan"} membership. Welcome to Mera Khet!`
    );
    await admin.from("khet_club_whatsapp_messages").insert({
      user_id: record.user_id,
      phone,
      message: `Plot confirmation: ${plotList}`,
      kind: "automated",
      status: whatsappResult.success ? "sent" : "failed",
      error_message: whatsappResult.success ? null : whatsappResult.error,
    });
  }

  return NextResponse.json({ received: true });
}
