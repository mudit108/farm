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

/**
 * Sends the payment receipt as a PDF attachment, immediately after a
 * payment is verified and plots are claimed — unlike the certificate
 * email, this doesn't wait for admin approval. Fails soft, same as
 * every other email here.
 */
/**
 * Notifies admin when a paying member submits a support message from
 * their dashboard. Previously these were written to the database and
 * read by nothing at all — the same dead-end bug the public contact
 * form had, but affecting members who've actually paid.
 */
export async function sendSupportNotificationEmail(input: {
  memberName: string;
  memberEmail: string;
  subject: string;
  message: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!apiKey || adminEmails.length === 0) {
    console.warn("RESEND_API_KEY or ADMIN_EMAILS not set — skipping support notification email.");
    return { sent: false, reason: "not_configured" as const };
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "Mera Khet <onboarding@resend.dev>";

  try {
    const { error } = await resend.emails.send({
      from,
      to: adminEmails,
      replyTo: input.memberEmail,
      subject: `Member support: ${input.subject}`,
      html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #232920;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A5A34; margin: 0 0 16px;">Mera Khet — Member Support</p>
        <p style="font-size: 15px; margin: 0 0 4px;"><strong>${escapeHtml(input.memberName)}</strong></p>
        <p style="font-size: 13px; color: #5B6357; margin: 0 0 16px;">${escapeHtml(input.memberEmail)}</p>
        <p style="font-size: 14px; font-weight: 600; margin: 0 0 8px;">${escapeHtml(input.subject)}</p>
        <p style="font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(input.message)}</p>
        <p style="font-size: 12px; color: #5B6357; margin-top: 24px;">Reply directly to this email to reach the member, or manage at /admin/communications.</p>
      </div>`,
    });

    if (error) {
      console.error("Resend support notification failed:", error);
      return { sent: false, reason: "send_failed" as const };
    }
    return { sent: true as const };
  } catch (err) {
    console.error("Resend support notification threw:", err);
    return { sent: false, reason: "send_failed" as const };
  }
}

export async function sendReceiptEmail(input: {
  to: string;
  fullName: string;
  receiptNumber: string;
  pdfBuffer: Buffer;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set — skipping receipt email for", input.receiptNumber);
    return { sent: false, reason: "not_configured" as const };
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "Mera Khet <onboarding@resend.dev>";

  try {
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: `Your Mera Khet Payment Receipt (${input.receiptNumber})`,
      html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #232920;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A5A34; margin: 0 0 16px;">Mera Khet</p>
        <h1 style="font-size: 20px; margin: 0 0 16px;">Thank you, ${escapeHtml(input.fullName)}!</h1>
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          We've received your payment and your plot(s) have been assigned. Your receipt is attached to this email as a PDF.
        </p>
        <p style="font-size: 13px; line-height: 1.6; color: #5B6357; margin: 0;">
          Your Membership Certificate — a separate document confirming your allocation — will follow once our team reviews and approves it, and you'll be notified when it's ready.
        </p>
        <p style="font-size: 13px; color: #5B6357; margin-top: 32px;">— The Mera Khet Team, Sujangarh, Rajasthan</p>
      </div>`,
      attachments: [
        {
          filename: `Mera-Khet-Receipt-${input.receiptNumber}.pdf`,
          content: input.pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("Resend receipt send failed:", error);
      return { sent: false, reason: "send_failed" as const };
    }
    return { sent: true as const };
  } catch (err) {
    console.error("Resend receipt send threw:", err);
    return { sent: false, reason: "send_failed" as const };
  }
}

/**
 * Tells a member their farm visit request was approved or declined.
 * Previously the status changed in the database and nothing reached the
 * member at all — they'd only find out by opening their dashboard,
 * despite needing to physically travel to Sujangarh.
 */
export async function sendVisitStatusEmail(input: {
  to: string;
  fullName: string;
  status: "approved" | "declined" | "completed";
  preferredDate: string;
  visitors: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set — skipping visit status email.");
    return { sent: false, reason: "not_configured" as const };
  }

  // A "completed" visit is a bookkeeping status for admin, not news the
  // member needs emailed to them after the fact.
  if (input.status === "completed") {
    return { sent: false, reason: "not_applicable" as const };
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "Mera Khet <onboarding@resend.dev>";
  const approved = input.status === "approved";

  const body = approved
    ? `<p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
         Your farm visit is confirmed for <strong>${escapeHtml(input.preferredDate)}</strong>
         for ${input.visitors} visitor${input.visitors > 1 ? "s" : ""}.
       </p>
       <p style="font-size: 13px; line-height: 1.6; color: #5B6357; margin: 0;">
         We're at Sujangarh, Rajasthan. Please reply to this email if you need
         directions, want to change the date, or your plans change — a quick heads-up
         helps us have someone ready to show you around.
       </p>`
    : `<p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
         Unfortunately we aren't able to host your visit on
         <strong>${escapeHtml(input.preferredDate)}</strong>.
       </p>
       <p style="font-size: 13px; line-height: 1.6; color: #5B6357; margin: 0;">
         This is usually down to farm operations or scheduling on that particular day —
         not a problem with your request. Please reply to this email with another date
         that suits you and we'll do our best to accommodate it.
       </p>`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: approved
        ? `Your Mera Khet farm visit is confirmed — ${input.preferredDate}`
        : `About your Mera Khet farm visit request`,
      html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #232920;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A5A34; margin: 0 0 16px;">Mera Khet — Farm Visit</p>
        <h1 style="font-size: 20px; margin: 0 0 16px;">Hello ${escapeHtml(input.fullName)},</h1>
        ${body}
        <p style="font-size: 13px; color: #5B6357; margin-top: 32px;">— The Mera Khet Team, Sujangarh, Rajasthan</p>
      </div>`,
    });

    if (error) {
      console.error("Resend visit status send failed:", error);
      return { sent: false, reason: "send_failed" as const };
    }
    return { sent: true as const };
  } catch (err) {
    console.error("Resend visit status send threw:", err);
    return { sent: false, reason: "send_failed" as const };
  }
}

/**
 * Daily summary emailed to every address in ADMIN_EMAILS — new
 * signups, new paid orders, and anything currently waiting on you
 * (open visit requests, open support messages, unread contact
 * messages) — so admin doesn't have to open the dashboard to know
 * something happened. Triggered by a Vercel Cron hitting
 * /api/cron/admin-digest once a day.
 */
export async function sendAdminDigestEmail(input: {
  newSignups: { name: string; email: string }[];
  newPayments: { name: string; email: string; plan: string; amountInr: number }[];
  pendingVisits: number;
  openSupportMessages: number;
  newContactMessages: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!apiKey || adminEmails.length === 0) {
    console.warn("RESEND_API_KEY or ADMIN_EMAILS not set — skipping admin digest.");
    return { sent: false, reason: "not_configured" as const };
  }

  const hasAnythingToReport =
    input.newSignups.length > 0 ||
    input.newPayments.length > 0 ||
    input.pendingVisits > 0 ||
    input.openSupportMessages > 0 ||
    input.newContactMessages > 0;

  // A quiet day is fine — no need to email "nothing happened."
  if (!hasAnythingToReport) {
    return { sent: false, reason: "nothing_to_report" as const };
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "Mera Khet <onboarding@resend.dev>";

  const rows: string[] = [];
  if (input.newSignups.length > 0) {
    rows.push(`<p style="font-size:13px;font-weight:600;margin:20px 0 8px;">New signups (${input.newSignups.length})</p>`);
    for (const s of input.newSignups) {
      rows.push(`<p style="font-size:13px;margin:0 0 4px;color:#5B6357;">${escapeHtml(s.name)} — ${escapeHtml(s.email)}</p>`);
    }
  }
  if (input.newPayments.length > 0) {
    const total = input.newPayments.reduce((sum, p) => sum + p.amountInr, 0);
    rows.push(`<p style="font-size:13px;font-weight:600;margin:20px 0 8px;">New paid orders (${input.newPayments.length}, ₹${total.toLocaleString("en-IN")} total)</p>`);
    for (const p of input.newPayments) {
      rows.push(`<p style="font-size:13px;margin:0 0 4px;color:#5B6357;">${escapeHtml(p.name)} — ${escapeHtml(p.plan)} — ₹${p.amountInr.toLocaleString("en-IN")}</p>`);
    }
  }
  const waiting: string[] = [];
  if (input.pendingVisits > 0) waiting.push(`${input.pendingVisits} pending farm visit request${input.pendingVisits > 1 ? "s" : ""}`);
  if (input.openSupportMessages > 0) waiting.push(`${input.openSupportMessages} open support message${input.openSupportMessages > 1 ? "s" : ""}`);
  if (input.newContactMessages > 0) waiting.push(`${input.newContactMessages} unread contact message${input.newContactMessages > 1 ? "s" : ""}`);
  if (waiting.length > 0) {
    rows.push(`<p style="font-size:13px;font-weight:600;margin:20px 0 8px;">Waiting on you</p>`);
    rows.push(`<p style="font-size:13px;margin:0;color:#5B6357;">${waiting.map(escapeHtml).join(" · ")}</p>`);
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: adminEmails,
      subject: `Mera Khet daily summary — ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
      html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #232920;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A5A34; margin: 0 0 16px;">Mera Khet — Daily Summary</p>
        ${rows.join("\n")}
        <p style="font-size: 12px; color: #5B6357; margin-top: 28px;">Full details at your admin dashboard.</p>
      </div>`,
    });

    if (error) {
      console.error("Resend admin digest failed:", error);
      return { sent: false, reason: "send_failed" as const };
    }
    return { sent: true as const };
  } catch (err) {
    console.error("Resend admin digest threw:", err);
    return { sent: false, reason: "send_failed" as const };
  }
}
