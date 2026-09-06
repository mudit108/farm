import "server-only";
import { Resend } from "resend";

/**
 * Sends the plot-assignment confirmation email. Fails soft: if RESEND_API_KEY
 * isn't configured, or the send fails, we log and return rather than
 * throwing — a missing/failed email should never roll back a successful
 * plot assignment the database already committed.
 */
export async function sendPlotConfirmationEmail(input: {
  to: string;
  fullName: string;
  plotNumber: number;
  allPlotNumbers?: number[];
  planLabel?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "RESEND_API_KEY is not set — skipping confirmation email for plot",
      input.plotNumber
    );
    return { sent: false, reason: "not_configured" as const };
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "Mera Khet <onboarding@resend.dev>";
  const plots = input.allPlotNumbers?.length ? input.allPlotNumbers : [input.plotNumber];
  const subject =
    plots.length > 1
      ? `You're confirmed — Plots ${plots.map((p) => `#${p}`).join(", ")} are yours`
      : `You're confirmed — Plot #${input.plotNumber} is yours`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject,
      html: renderConfirmationEmailHtml({ ...input, allPlotNumbers: plots }),
    });

    if (error) {
      console.error("Resend send failed:", error);
      return { sent: false, reason: "send_failed" as const };
    }
    return { sent: true as const };
  } catch (err) {
    console.error("Resend send threw:", err);
    return { sent: false, reason: "send_failed" as const };
  }
}

function renderConfirmationEmailHtml({
  fullName,
  allPlotNumbers,
  planLabel,
}: {
  fullName: string;
  allPlotNumbers?: number[];
  planLabel?: string;
}) {
  const plots = allPlotNumbers ?? [];
  const plotDisplay = plots.map((p) => `#${p}`).join(", ");
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #232920;">
    <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A5A34; margin: 0 0 16px;">Mera Khet</p>
    <h1 style="font-size: 22px; margin: 0 0 16px;">You're confirmed, ${escapeHtml(fullName)}!</h1>
    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
      Thanks for registering with Mera Khet${planLabel ? ` on the ${escapeHtml(planLabel)} plan` : ""}. Your plot${plots.length > 1 ? "s have" : " has"} been reserved:
    </p>
    <div style="background: #E4E9DD; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #5B6357; margin: 0 0 4px;">
        Your Plot${plots.length > 1 ? " Numbers" : " Number"}
      </p>
      <p style="font-size: 32px; font-weight: 700; color: #263422; margin: 0;">${plotDisplay}</p>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #5B6357; margin: 0 0 8px;">
      We'll be in touch with next steps — including plot location, and how to track your farm once the season starts.
    </p>
    <p style="font-size: 13px; color: #5B6357; margin-top: 32px;">— The Mera Khet Team, Sujangarh, Rajasthan</p>
  </div>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends the membership certificate as a PDF attachment, once an admin
 * has approved the batch. Fails soft, same as the confirmation email —
 * a failed send is logged and recorded (see the approval action), never
 * thrown, since it should never block the approval itself from
 * completing.
 */
export async function sendCertificateEmail(input: {
  to: string;
  fullName: string;
  certificateNumber: string;
  pdfBuffer: Buffer;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "RESEND_API_KEY is not set — skipping certificate email for",
      input.certificateNumber
    );
    return { sent: false, reason: "not_configured" as const };
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "Mera Khet <onboarding@resend.dev>";

  try {
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: `Your Mera Khet Membership Certificate (${input.certificateNumber})`,
      html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #232920;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A5A34; margin: 0 0 16px;">Mera Khet</p>
        <h1 style="font-size: 22px; margin: 0 0 16px;">Congratulations, ${escapeHtml(input.fullName)}!</h1>
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
          Your plot allocation has been reviewed and approved. Your official membership certificate is attached to this email as a PDF.
        </p>
        <p style="font-size: 13px; color: #5B6357; margin-top: 32px;">— The Mera Khet Team, Sujangarh, Rajasthan</p>
      </div>`,
      attachments: [
        {
          filename: `Mera-Khet-Certificate-${input.certificateNumber}.pdf`,
          content: input.pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("Resend certificate send failed:", error);
      return { sent: false, reason: "send_failed" as const };
    }
    return { sent: true as const };
  } catch (err) {
    console.error("Resend certificate send threw:", err);
    return { sent: false, reason: "send_failed" as const };
  }
}

/**
 * Notifies every address in ADMIN_EMAILS when a new homepage contact
 * form message arrives. Fails soft, same as every other email in this
 * file — a missing/failed notification never blocks the message from
 * being saved (it's always visible at /admin/communications regardless).
 */
export async function sendContactNotificationEmail(input: {
  name: string;
  phone: string;
  email: string;
  message: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!apiKey || adminEmails.length === 0) {
    console.warn("RESEND_API_KEY or ADMIN_EMAILS not set — skipping contact notification email.");
    return { sent: false, reason: "not_configured" as const };
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "Mera Khet <onboarding@resend.dev>";

  try {
    const { error } = await resend.emails.send({
      from,
      to: adminEmails,
      subject: `New contact form message from ${input.name}`,
      html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #232920;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A5A34; margin: 0 0 16px;">Mera Khet — Contact Form</p>
        <p style="font-size: 15px; margin: 0 0 4px;"><strong>${escapeHtml(input.name)}</strong></p>
        <p style="font-size: 13px; color: #5B6357; margin: 0 0 16px;">${escapeHtml(input.phone)} · ${escapeHtml(input.email)}</p>
        <p style="font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(input.message)}</p>
        <p style="font-size: 12px; color: #5B6357; margin-top: 24px;">Reply directly to this sender, or view all messages at /admin/communications.</p>
      </div>`,
    });

    if (error) {
      console.error("Resend contact notification failed:", error);
      return { sent: false, reason: "send_failed" as const };
    }
    return { sent: true as const };
  } catch (err) {
    console.error("Resend contact notification threw:", err);
    return { sent: false, reason: "send_failed" as const };
  }
}
