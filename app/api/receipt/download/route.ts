import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/session";
import { createServiceClient } from "@/lib/supabase/service";
import { generateReceiptPdf } from "@/lib/receipt";
import { membershipPlans } from "@/lib/demo-data";
import { isAllowedAdminEmail } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const claimBatchId = searchParams.get("batch");
  if (!claimBatchId) {
    return NextResponse.json({ error: "Missing batch id" }, { status: 400 });
  }

  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createServiceClient();
  const { data: receipt } = await admin
    .from("khet_club_receipts")
    .select("receipt_number, user_id, payment_id, plan_id, plot_numbers, full_name, amount_paise, feeding_families_inr, issued_at")
    .eq("claim_batch_id", claimBatchId)
    .maybeSingle();

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  const isOwner = receipt.user_id === user.id;
  const isAdmin = isAllowedAdminEmail(user.email);
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const plan = membershipPlans.find((p) => p.id === receipt.plan_id);
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 500 });
  }

  const { data: payment } = await admin
    .from("khet_club_payments")
    .select("razorpay_order_id, razorpay_payment_id")
    .eq("id", receipt.payment_id)
    .maybeSingle();

  const memberUser =
    isOwner && user.email
      ? { email: user.email }
      : (await admin.auth.admin.getUserById(receipt.user_id)).data.user;

  const pdfBuffer = await generateReceiptPdf({
    receiptNumber: receipt.receipt_number,
    fullName: receipt.full_name,
    email: memberUser?.email ?? "",
    planName: plan.name,
    planLabel: plan.label,
    plotNumbers: receipt.plot_numbers,
    amountInr: receipt.amount_paise / 100,
    feedingFamiliesInr: receipt.feeding_families_inr,
    razorpayOrderId: payment?.razorpay_order_id ?? "",
    razorpayPaymentId: payment?.razorpay_payment_id ?? null,
    issuedDate: new Date(receipt.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Mera-Khet-Receipt-${receipt.receipt_number}.pdf"`,
    },
  });
}
