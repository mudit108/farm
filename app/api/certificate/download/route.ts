import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/session";
import { createServiceClient } from "@/lib/supabase/service";
import { generateCertificatePdf } from "@/lib/certificate";
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
  const { data: cert } = await admin
    .from("khet_club_certificates")
    .select("certificate_number, user_id, plan_id, plot_numbers, full_name, area_sq_ft, issued_at")
    .eq("claim_batch_id", claimBatchId)
    .maybeSingle();

  if (!cert) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  // Only the certificate's own member, or an allowlisted admin, may
  // download it — checked here explicitly rather than relying solely on
  // RLS, since this route uses the service client to read (needed for
  // the admin case) and generates the PDF itself.
  const isOwner = cert.user_id === user.id;
  const isAdmin = isAllowedAdminEmail(user.email);
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const plan = membershipPlans.find((p) => p.id === cert.plan_id);
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 500 });
  }

  const pdfBuffer = await generateCertificatePdf({
    certificateNumber: cert.certificate_number,
    fullName: cert.full_name,
    planName: plan.name,
    planLabel: plan.label,
    plotNumbers: cert.plot_numbers,
    areaSqFt: cert.area_sq_ft,
    season: "Wheat Season 2026–27",
    issuedDate: new Date(cert.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }),
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Mera-Khet-Certificate-${cert.certificate_number}.pdf"`,
    },
  });
}
