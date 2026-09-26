"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createSessionClient } from "@/lib/supabase/session";
import { generateCertificatePdf } from "@/lib/certificate";
import { sendCertificateEmail } from "@/lib/email";
import { sendWhatsAppDocument } from "@/lib/whatsapp/whatsapp-service";
import { membershipPlans } from "@/lib/demo-data";
import { ok, fail, type ActionResult } from "@/lib/action-result";

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
export async function adminApproveBatch(formData: FormData): Promise<ActionResult> {
  const claimBatchId = String(formData.get("claimBatchId") || "");
  if (!claimBatchId) return fail("Missing member reference.");

  const sessionSupabase = await createSessionClient();
  const {
    data: { user: admin },
  } = await sessionSupabase.auth.getUser();
  if (!admin) return fail("Your admin session expired — please log in again.");

  const supabase = createServiceClient();

  const { data: plots } = await supabase
    .from("khet_club_plots")
    .select("plot_number, user_id, plan_id, full_name")
    .eq("claim_batch_id", claimBatchId)
    .order("plot_number");

  if (!plots || plots.length === 0) return fail("No plots found for this member — they may have been freed.");
  const { user_id: userId, plan_id: planId, full_name: fullName } = plots[0];
  if (!userId) {
    return fail("This is an offline reservation with no member account, so there's no one to issue a certificate to.");
  }
  if (!planId) return fail("These plots have no plan attached, so a certificate can't be issued.");

  const plan = membershipPlans.find((p) => p.id === planId);
  if (!plan) return fail("That plan no longer exists.");

  const { data: existingCert } = await supabase
    .from("khet_club_certificates")
    .select("certificate_number")
    .eq("claim_batch_id", claimBatchId)
    .maybeSingle();
  if (existingCert) return fail(`Already approved — certificate ${existingCert.certificate_number} exists. Use Resend instead.`);

  const plotNumbers = plots.map((p) => p.plot_number as number);
  const areaSqFt = plotNumbers.length * plan.areaSqFt;

  // Read the live season label rather than hardcoding it, and store it on
  // the certificate so a later resend reprints the same season.
  const { data: seasonRow } = await supabase
    .from("khet_club_season")
    .select("season_label")
    .eq("id", 1)
    .maybeSingle();
  const seasonLabel = seasonRow?.season_label ?? "Current Season";

  // Number and record the certificate BEFORE marking the plots approved,
  // so a failure here never leaves a member "approved" with no certificate.
  const { data: certificateNumber, error: numberError } = await supabase.rpc(
    "khet_club_next_certificate_number"
  );
  if (numberError || !certificateNumber) {
    console.error("adminApproveBatch: certificate numbering failed:", numberError);
    return fail("Couldn't generate a certificate number. Nothing was approved — please try again.");
  }

  const issuedAt = new Date();
  const { error: certError } = await supabase.from("khet_club_certificates").insert({
    certificate_number: certificateNumber,
    user_id: userId,
    claim_batch_id: claimBatchId,
    plan_id: planId,
    plot_numbers: plotNumbers,
    full_name: fullName || "Mera Khet Member",
    area_sq_ft: areaSqFt,
    approved_by: admin.id,
    issued_at: issuedAt.toISOString(),
    season_label: seasonLabel,
  });

  if (certError) {
    console.error("adminApproveBatch: certificate insert failed:", certError);
    return fail("Couldn't save the certificate. Nothing was approved — please try again.");
  }

  await supabase
    .from("khet_club_plots")
    .update({ approved_at: issuedAt.toISOString(), approved_by: admin.id })
    .eq("claim_batch_id", claimBatchId);

  const pdfBuffer = await generateCertificatePdf({
    certificateNumber,
    fullName: fullName || "Mera Khet Member",
    planName: plan.name,
    planLabel: plan.label,
    plotNumbers,
    areaSqFt,
    season: seasonLabel,
    issuedDate: formatIssuedDate(issuedAt),
  });

  const { emailSent, whatsappSent } = await deliverCertificate(supabase, {
    userId,
    fullName: fullName || "Member",
    certificateNumber,
    plotNumbers,
    pdfBuffer,
    logMessage: `Certificate ${certificateNumber} (PDF document)`,
  });

  await supabase
    .from("khet_club_certificates")
    .update({ email_sent: emailSent, whatsapp_sent: whatsappSent })
    .eq("claim_batch_id", claimBatchId);

  revalidatePath("/admin/members");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/my-farm");
  revalidatePath("/dashboard/select-plot");

  const sentVia = [emailSent && "email", whatsappSent && "WhatsApp"].filter(Boolean);
  if (sentVia.length === 0) {
    return fail(
      `Approved — certificate ${certificateNumber} issued, but it couldn't be sent (check email/WhatsApp setup). Use Resend or Download.`
    );
  }
  return ok(`Approved — certificate ${certificateNumber} sent via ${sentVia.join(" and ")}.`);
}

function formatIssuedDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}

async function deliverCertificate(
  supabase: ReturnType<typeof createServiceClient>,
  args: { userId: string; fullName: string; certificateNumber: string; plotNumbers: number[]; pdfBuffer: Buffer; logMessage: string }
): Promise<{ emailSent: boolean; whatsappSent: boolean }> {
  const { data: userRes } = await supabase.auth.admin.getUserById(args.userId);
  const memberUser = userRes?.user;
  let emailSent = false;
  let whatsappSent = false;

  if (memberUser?.email) {
    const result = await sendCertificateEmail({
      to: memberUser.email,
      fullName: args.fullName,
      certificateNumber: args.certificateNumber,
      pdfBuffer: args.pdfBuffer,
    });
    emailSent = result.sent;
  }

  const phone = memberUser?.user_metadata?.phone as string | undefined;
  if (phone) {
    const plotList = args.plotNumbers.map((n) => `#${n}`).join(", ");
    const result = await sendWhatsAppDocument(
      phone,
      args.pdfBuffer,
      `Mera-Khet-Certificate-${args.certificateNumber}.pdf`,
      [args.fullName, plotList]
    );
    whatsappSent = result.success;

    await supabase.from("khet_club_whatsapp_messages").insert({
      user_id: args.userId,
      phone,
      message: args.logMessage,
      kind: "automated",
      status: result.success ? "sent" : "failed",
      error_message: result.success ? null : result.error,
    });
  }

  return { emailSent, whatsappSent };
}

/**
 * Re-sends an already-issued certificate (e.g. the first email/WhatsApp
 * attempt failed, or the member lost it) without re-approving or
 * re-generating a new certificate number.
 */
export async function adminResendCertificate(formData: FormData): Promise<ActionResult> {
  const claimBatchId = String(formData.get("claimBatchId") || "");
  if (!claimBatchId) return fail("Missing certificate reference.");

  const supabase = createServiceClient();

  const { data: cert } = await supabase
    .from("khet_club_certificates")
    .select("certificate_number, user_id, plan_id, plot_numbers, full_name, area_sq_ft, issued_at, season_label")
    .eq("claim_batch_id", claimBatchId)
    .maybeSingle();
  if (!cert) return fail("No certificate found for this member yet.");

  const plan = membershipPlans.find((p) => p.id === cert.plan_id);
  if (!plan) return fail("That plan no longer exists.");

  // Reprint exactly what was originally issued — the stored season and
  // issue date, not today's — so a resend after a season rollover still
  // matches the original certificate.
  let seasonLabel = cert.season_label as string | null;
  if (!seasonLabel) {
    const { data: seasonRow } = await supabase
      .from("khet_club_season")
      .select("season_label")
      .eq("id", 1)
      .maybeSingle();
    seasonLabel = seasonRow?.season_label ?? "Current Season";
  }

  const pdfBuffer = await generateCertificatePdf({
    certificateNumber: cert.certificate_number,
    fullName: cert.full_name,
    planName: plan.name,
    planLabel: plan.label,
    plotNumbers: cert.plot_numbers,
    areaSqFt: cert.area_sq_ft,
    season: seasonLabel ?? "Current Season",
    issuedDate: formatIssuedDate(cert.issued_at ? new Date(cert.issued_at) : new Date()),
  });

  const { emailSent, whatsappSent } = await deliverCertificate(supabase, {
    userId: cert.user_id,
    fullName: cert.full_name,
    certificateNumber: cert.certificate_number,
    plotNumbers: cert.plot_numbers as number[],
    pdfBuffer,
    logMessage: `Certificate ${cert.certificate_number} resent (PDF document)`,
  });

  await supabase
    .from("khet_club_certificates")
    .update({ email_sent: emailSent, whatsapp_sent: whatsappSent })
    .eq("claim_batch_id", claimBatchId);

  revalidatePath("/admin/members");

  // Report what actually happened rather than a blanket "sent" — email
  // and WhatsApp fail independently, and silently, when unconfigured.
  const sentVia = [emailSent && "email", whatsappSent && "WhatsApp"].filter(Boolean);
  if (sentVia.length === 0) {
    return fail(
      `Certificate ${cert.certificate_number} could not be sent — check that email and WhatsApp are configured.`
    );
  }
  return ok(`Certificate ${cert.certificate_number} sent via ${sentVia.join(" and ")}.`);
}
