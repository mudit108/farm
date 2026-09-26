import "server-only";
import type { createServiceClient } from "@/lib/supabase/service";
import { generateReceiptPdf, type ReceiptData } from "@/lib/receipt";
import { sendReceiptEmail } from "@/lib/email";
import { membershipPlans, FEEDING_FAMILIES_PER_PLOT } from "@/lib/demo-data";

type Admin = ReturnType<typeof createServiceClient>;

type ReceiptRow = {
  receipt_number: string;
  user_id: string;
  payment_id: string;
  claim_batch_id: string;
  plan_id: string;
  plot_numbers: number[];
  full_name: string;
  amount_paise: number;
  feeding_families_inr: number;
  issued_at: string;
};

const RECEIPT_COLUMNS =
  "receipt_number, user_id, payment_id, claim_batch_id, plan_id, plot_numbers, full_name, amount_paise, feeding_families_inr, issued_at";

function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Everything a receipt PDF needs, including what kind of payment it was.
 * A 50/50 deposit receipt must say a balance is still due, and a balance
 * receipt must say it settles an earlier deposit — otherwise a deposit
 * receipt reads like full payment.
 */
export async function buildReceiptPdfData(admin: Admin, receipt: ReceiptRow, email: string): Promise<ReceiptData | null> {
  const plan = membershipPlans.find((p) => p.id === receipt.plan_id);
  if (!plan) return null;

  const { data: payment } = await admin
    .from("khet_club_payments")
    .select("razorpay_order_id, razorpay_payment_id, payment_kind, installment_fee_inr, balance_due_inr")
    .eq("id", receipt.payment_id)
    .maybeSingle();

  const kind = (payment?.payment_kind ?? "full") as "full" | "deposit" | "balance";
  let paymentNote: string | undefined;
  if (kind === "deposit") {
    const { data: installment } = await admin
      .from("khet_club_installment_plans")
      .select("balance_due_inr, balance_due_date, balance_paid")
      .eq("claim_batch_id", receipt.claim_batch_id)
      .maybeSingle();
    const dueInr = installment?.balance_due_inr ?? payment?.balance_due_inr ?? 0;
    paymentNote = installment?.balance_paid
      ? "This was the 50% deposit. The balance has since been paid — see the separate balance receipt."
      : `This is the 50% deposit. Balance of ₹${dueInr.toLocaleString("en-IN")} is due${
          installment?.balance_due_date ? ` by ${formatDate(`${installment.balance_due_date}T00:00:00+05:30`)}` : ""
        }.`;
  } else if (kind === "balance") {
    paymentNote = "This is the balance payment completing your 50/50 split purchase. Your membership is now fully paid.";
  }

  return {
    receiptNumber: receipt.receipt_number,
    fullName: receipt.full_name,
    email,
    planName: plan.name,
    planLabel: plan.label,
    plotNumbers: receipt.plot_numbers,
    amountInr: receipt.amount_paise / 100,
    feedingFamiliesInr: receipt.feeding_families_inr,
    razorpayOrderId: payment?.razorpay_order_id ?? "",
    razorpayPaymentId: payment?.razorpay_payment_id ?? null,
    issuedDate: formatDate(receipt.issued_at),
    paymentKind: kind,
    installmentFeeInr: kind === "deposit" ? payment?.installment_fee_inr ?? 0 : 0,
    paymentNote,
  };
}

/**
 * Issues (once) the receipt for one paid payment row and emails it.
 * Idempotent per payment: the browser callback and the Razorpay webhook
 * can both call this for the same payment without creating two receipts.
 * Never throws — a receipt problem must not undo a successful payment.
 */
export async function issueReceiptForPayment(
  admin: Admin,
  args: { paymentId: string; email: string | null; fullName: string }
): Promise<void> {
  try {
    const { data: existing } = await admin
      .from("khet_club_receipts")
      .select("receipt_number")
      .eq("payment_id", args.paymentId)
      .maybeSingle();
    if (existing) return;

    const { data: payment } = await admin
      .from("khet_club_payments")
      .select("id, user_id, plan_id, amount, claim_batch_id, payment_kind, status")
      .eq("id", args.paymentId)
      .maybeSingle();
    if (!payment || payment.status !== "paid" || !payment.claim_batch_id) return;

    const { data: plots } = await admin
      .from("khet_club_plots")
      .select("plot_number")
      .eq("claim_batch_id", payment.claim_batch_id)
      .order("plot_number");
    const plotNumbers = ((plots ?? []) as { plot_number: number }[]).map((p) => p.plot_number);

    const { data: receiptNumber, error: numberError } = await admin.rpc("khet_club_next_receipt_number");
    if (numberError || !receiptNumber) {
      console.error("Receipt numbering failed:", numberError);
      return;
    }

    // The Feeding Families contribution is part of the purchase, which a
    // balance payment doesn't repeat — it was already on the deposit.
    const feedingFamiliesInr = payment.payment_kind === "balance" ? 0 : plotNumbers.length * FEEDING_FAMILIES_PER_PLOT;

    const row = {
      receipt_number: receiptNumber as string,
      user_id: payment.user_id,
      payment_id: payment.id,
      claim_batch_id: payment.claim_batch_id,
      plan_id: payment.plan_id,
      plot_numbers: plotNumbers,
      full_name: args.fullName || "Mera Khet Member",
      amount_paise: payment.amount,
      feeding_families_inr: feedingFamiliesInr,
      issued_at: new Date().toISOString(),
    };
    const { error: insertError } = await admin.from("khet_club_receipts").insert(row);
    if (insertError) {
      console.error("Receipt insert failed:", insertError);
      return;
    }

    if (!args.email) return;
    const pdfData = await buildReceiptPdfData(admin, row, args.email);
    if (!pdfData) return;
    const pdfBuffer = await generateReceiptPdf(pdfData);
    const emailResult = await sendReceiptEmail({
      to: args.email,
      fullName: row.full_name,
      receiptNumber: row.receipt_number,
      pdfBuffer,
    });
    await admin.from("khet_club_receipts").update({ email_sent: emailResult.sent }).eq("receipt_number", row.receipt_number);
  } catch (err) {
    console.error("Receipt generation threw (payment itself unaffected):", err);
  }
}

export { RECEIPT_COLUMNS, type ReceiptRow };
