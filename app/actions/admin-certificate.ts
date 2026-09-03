"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createSessionClient } from "@/lib/supabase/session";
import { generateCertificatePdf } from "@/lib/certificate";
import { sendCertificateEmail } from "@/lib/email";
import { sendWhatsAppDocument } from "@/lib/whatsapp/whatsapp-service";
import { membershipPlans } from "@/lib/demo-data";

/**
 * Approves an entire claim batch (one purchase, possibly several plots)
 * and issues its certificate: generates the PDF, records it in
 * khet_club_certificates, and sends it by email (PDF attachment) and
 * WhatsApp (document template — see README "Configure WhatsApp
 * certificates" for the separate template this requires).
 *
 * The plot assignment itself already happened at payment time and is
 * untouched here — this only gates the *certificate*, not the plot
 * reservation. A failed email/WhatsApp send never blocks approval from
 * completing; both outcomes are recorded on the certificate row so
 * admin can see and retry from the UI.
 */
export async function adminApproveBatch(formData: FormData): Promise<void> {
  const claimBatchId = String(formData.get("claimBatchId") || "");
  if (!claimBatchId) return;

  const sessionSupabase = await createSessionClient();
  const {
    data: { user: admin },
  } = await sessionSupabase.auth.getUser();
  if (!admin) return;

  const supabase = createServiceClient();

  const { data: plots } = await supabase
    .from("khet_club_plots")
    .select("plot_number, user_id, plan_id, full_name")
    .eq("claim_batch_id", claimBatchId)
    .order("plot_number");

  if (!plots || plots.length === 0) return;
  const { user_id: userId, plan_id: planId, full_name: fullName } = plots[0];
  if (!userId || !planId) return;

  const plan = membershipPlans.find((p) => p.id === planId);
  if (!plan) return;

  const plotNumbers = plots.map((p) => p.plot_number as number);
  const areaSqFt = plotNumbers.length * plan.areaSqFt;

  await supabase
    .from("khet_club_plots")
    .update({ approved_at: new Date().toISOString(), approved_by: admin.id })
    .eq("claim_batch_id", claimBatchId);

  const { data: certificateNumber, error: numberError } = await supabase.rpc(
    "khet_club_next_certificate_number"
  );
  if (numberError || !certificateNumber) {
    console.error("adminApproveBatch: certificate numbering failed:", numberError);
    return;
  }

  const { error: certError } = await supabase.from("khet_club_certificates").insert({
    certificate_number: certificateNumber,
    user_id: userId,
    claim_batch_id: claimBatchId,
    plan_id: planId,
    plot_numbers: plotNumbers,
    full_name: fullName || "Mera Khet Member",
    area_sq_ft: areaSqFt,
    approved_by: admin.id,
  });

  if (certError) {
    console.error("adminApproveBatch: certificate insert failed:", certError);
    return;
  }

  const pdfBuffer = await generateCertificatePdf({
    certificateNumber,
    fullName: fullName || "Mera Khet Member",
    planName: plan.name,
    planLabel: plan.label,
    plotNumbers,
    areaSqFt,
    season: "Wheat Season 2026–27",
    issuedDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
  });

  const { data: userRes } = await supabase.auth.admin.getUserById(userId);
  const memberUser = userRes?.user;
  let emailSent = false;
  let whatsappSent = false;

  if (memberUser?.email) {
    const result = await sendCertificateEmail({
      to: memberUser.email,
      fullName: fullName || "there",
      certificateNumber,
      pdfBuffer,
    });
    emailSent = result.sent;
  }

  const phone = memberUser?.user_metadata?.phone as string | undefined;
  if (phone) {
    const plotList = plotNumbers.map((n) => `#${n}`).join(", ");
    const result = await sendWhatsAppDocument(
      phone,
      pdfBuffer,
      `Mera-Khet-Certificate-${certificateNumber}.pdf`,
      [fullName || "Member", plotList]
    );
    whatsappSent = result.success;

    await supabase.from("khet_club_whatsapp_messages").insert({
      user_id: userId,
      phone,
      message: `Certificate ${certificateNumber} (PDF document)`,
      kind: "automated",
      status: result.success ? "sent" : "failed",
      error_message: result.success ? null : result.error,
    });
  }

  await supabase
    .from("khet_club_certificates")
    .update({ email_sent: emailSent, whatsapp_sent: whatsappSent })
    .eq("claim_batch_id", claimBatchId);

  revalidatePath("/admin/registrations");
  revalidatePath("/dashboard/my-farm");
  revalidatePath("/dashboard/membership");
  revalidatePath("/dashboard/select-plot");
}

/**
 * Re-sends an already-issued certificate (e.g. the first email/WhatsApp
 * attempt failed, or the member lost it) without re-approving or
 * re-generating a new certificate number.
 */
export async function adminResendCertificate(formData: FormData): Promise<void> {
  const claimBatchId = String(formData.get("claimBatchId") || "");
  if (!claimBatchId) return;

  const supabase = createServiceClient();

  const { data: cert } = await supabase
    .from("khet_club_certificates")
    .select("certificate_number, user_id, plan_id, plot_numbers, full_name, area_sq_ft")
    .eq("claim_batch_id", claimBatchId)
    .maybeSingle();
  if (!cert) return;

  const plan = membershipPlans.find((p) => p.id === cert.plan_id);
  if (!plan) return;

  const pdfBuffer = await generateCertificatePdf({
    certificateNumber: cert.certificate_number,
    fullName: cert.full_name,
    planName: plan.name,
    planLabel: plan.label,
    plotNumbers: cert.plot_numbers,
    areaSqFt: cert.area_sq_ft,
    season: "Wheat Season 2026–27",
    issuedDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
  });

  const { data: userRes } = await supabase.auth.admin.getUserById(cert.user_id);
  const memberUser = userRes?.user;
  let emailSent = false;
  let whatsappSent = false;

  if (memberUser?.email) {
    const result = await sendCertificateEmail({
      to: memberUser.email,
      fullName: cert.full_name,
      certificateNumber: cert.certificate_number,
      pdfBuffer,
    });
    emailSent = result.sent;
  }

  const phone = memberUser?.user_metadata?.phone as string | undefined;
  if (phone) {
    const plotList = (cert.plot_numbers as number[]).map((n) => `#${n}`).join(", ");
    const result = await sendWhatsAppDocument(
      phone,
      pdfBuffer,
      `Mera-Khet-Certificate-${cert.certificate_number}.pdf`,
      [cert.full_name, plotList]
    );
    whatsappSent = result.success;

    await supabase.from("khet_club_whatsapp_messages").insert({
      user_id: cert.user_id,
      phone,
      message: `Certificate ${cert.certificate_number} resent (PDF document)`,
      kind: "automated",
      status: result.success ? "sent" : "failed",
      error_message: result.success ? null : result.error,
    });
  }

  await supabase
    .from("khet_club_certificates")
    .update({ email_sent: emailSent, whatsapp_sent: whatsappSent })
    .eq("claim_batch_id", claimBatchId);

  revalidatePath("/admin/registrations");
}
