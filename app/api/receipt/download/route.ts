import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/session";
import { createServiceClient } from "@/lib/supabase/service";
import { generateReceiptPdf } from "@/lib/receipt";
import { isAllowedAdminEmail } from "@/lib/admin-auth";
import { buildReceiptPdfData, RECEIPT_COLUMNS, type ReceiptRow } from "@/lib/payments/receipts";

/**
 * Downloads one receipt. `?payment=<payment id>` picks the exact receipt
 * for that payment (a 50/50 purchase has two: deposit and balance).
 * `?batch=<claim batch id>` is kept for older links and returns the
 * purchase's first receipt.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get("payment");
  const claimBatchId = searchParams.get("batch");
  if (!paymentId && !claimBatchId) {
    return NextResponse.json({ error: "Missing payment or batch id" }, { status: 400 });
  }

  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createServiceClient();
  const query = admin.from("khet_club_receipts").select(RECEIPT_COLUMNS);
  const { data: receipt } = paymentId
    ? await query.eq("payment_id", paymentId).maybeSingle()
    : await query.eq("claim_batch_id", claimBatchId!).order("issued_at", { ascending: true }).limit(1).maybeSingle();

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  const isOwner = receipt.user_id === user.id;
  const isAdmin = isAllowedAdminEmail(user.email);
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email =
    isOwner && user.email ? user.email : (await admin.auth.admin.getUserById(receipt.user_id)).data.user?.email ?? "";

  const pdfData = await buildReceiptPdfData(admin, receipt as ReceiptRow, email);
  if (!pdfData) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 500 });
  }
  const pdfBuffer = await generateReceiptPdf(pdfData);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Mera-Khet-Receipt-${receipt.receipt_number}.pdf"`,
    },
  });
}
