import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWhatsAppMessage } from "@/lib/whatsapp/whatsapp-service";
import { sendMemberNoticeEmail } from "@/lib/email";
import { membershipPlans, balanceStage, balanceLateFeeInr, todayInIndia } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

/**
 * Daily automated member reminders (Vercel Cron, see vercel.json):
 *
 * 1. 50/50 balance reminders — 7 days before the due date, on the due
 *    date, once it's late (late fee applies), and a final notice after the
 *    grace period while the member still holds the plots.
 * 2. Abandoned checkout nudge — someone opened the payment window in the
 *    last day but never paid (and hasn't paid since). Sent once per person,
 *    ever, so it never turns into nagging.
 *
 * Every reminder is recorded in khet_club_reminder_log (unique on kind +
 * reference) BEFORE sending, so a retry or a second run the same day can
 * never send the same reminder twice.
 *
 * Protected by CRON_SECRET the same way as /api/cron/admin-digest.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ?dryRun=1 lists what WOULD be sent without sending or logging anything.
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const wouldSend: { kind: string; ref: string; user: string }[] = [];

  const admin = createServiceClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.merakhet.in";
  const today = todayInIndia();
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "long", timeZone: "Asia/Kolkata" });
  const summary = { balance: 0, abandoned: 0, skipped: 0 };

  /** Claims the reminder slot first; returns false if it was already sent. */
  async function claim(kind: string, refId: string, userId: string): Promise<boolean> {
    const { error } = await admin.from("khet_club_reminder_log").insert({ kind, ref_id: refId, user_id: userId });
    if (error) {
      if (error.code !== "23505") console.error("reminder log insert failed:", error);
      return false;
    }
    return true;
  }

  async function send(
    kind: string,
    refId: string,
    userId: string,
    msg: { whatsapp: string; subject: string; label: string; paragraphs: string[]; cta: { text: string; url: string } }
  ) {
    if (dryRun) {
      const { data: existing } = await admin.from("khet_club_reminder_log").select("id").eq("kind", kind).eq("ref_id", refId).maybeSingle();
      if (existing) {
        summary.skipped++;
        return false;
      }
      wouldSend.push({ kind, ref: refId, user: userId });
      return true;
    }
    if (!(await claim(kind, refId, userId))) {
      summary.skipped++;
      return false;
    }
    const { data: userRes } = await admin.auth.admin.getUserById(userId);
    const member = userRes?.user;
    const fullName = ((member?.user_metadata?.full_name as string) || "there").trim();
    let emailSent = false;
    let whatsappSent = false;
    if (member?.email) {
      emailSent = (await sendMemberNoticeEmail({ to: member.email, fullName, ...msg })).sent;
    }
    const phone = member?.user_metadata?.phone as string | undefined;
    if (phone) {
      const result = await sendWhatsAppMessage(phone, msg.whatsapp);
      whatsappSent = result.success;
      await admin.from("khet_club_whatsapp_messages").insert({
        user_id: userId,
        phone,
        message: `Reminder: ${kind}`,
        kind: "automated",
        status: result.success ? "sent" : "failed",
        error_message: result.success ? null : result.error,
      });
    }
    await admin
      .from("khet_club_reminder_log")
      .update({ email_sent: emailSent, whatsapp_sent: whatsappSent })
      .eq("kind", kind)
      .eq("ref_id", refId);
    return true;
  }

  // --- 1. Balance reminders -------------------------------------------
  const { data: plans } = await admin
    .from("khet_club_installment_plans")
    .select("id, user_id, plan_id, claim_batch_id, balance_due_inr, balance_due_date")
    .eq("balance_paid", false);

  for (const p of (plans ?? []) as {
    id: string;
    user_id: string;
    plan_id: string;
    claim_batch_id: string;
    balance_due_inr: number;
    balance_due_date: string;
  }[]) {
    // Plots already freed by the team → nothing to remind about.
    const { count: held } = await admin
      .from("khet_club_plots")
      .select("plot_number", { count: "exact", head: true })
      .eq("claim_batch_id", p.claim_batch_id)
      .eq("user_id", p.user_id);
    if (!held) continue;

    const { stage, daysLeft, releaseDate } = balanceStage(p.balance_due_date, today);
    const planName = membershipPlans.find((m) => m.id === p.plan_id)?.name ?? "plan";
    const lateFee = balanceLateFeeInr(p.plan_id);
    const cta = { text: "Pay balance", url: `${site}/dashboard/my-farm` };

    let kind: string | null = null;
    let lines: string[] = [];
    let subject = "";
    if (stage === "due" && daysLeft > 0 && daysLeft <= 7) {
      kind = "balance_7d";
      subject = `Your Mera Khet balance is due on ${fmt(p.balance_due_date)}`;
      lines = [
        `A friendly reminder: the remaining ${inr(p.balance_due_inr)} for your ${planName} membership is due on ${fmt(p.balance_due_date)}.`,
        `You can pay it anytime from My Farm in your dashboard. After the due date a ${inr(lateFee)} late fee applies.`,
      ];
    } else if (stage === "due" && daysLeft === 0) {
      kind = "balance_due";
      subject = "Your Mera Khet balance is due today";
      lines = [
        `The remaining ${inr(p.balance_due_inr)} for your ${planName} membership is due today.`,
        `Paying today avoids the ${inr(lateFee)} late fee.`,
      ];
    } else if (stage === "late") {
      kind = "balance_late";
      subject = "Your Mera Khet balance is overdue";
      lines = [
        `Your balance of ${inr(p.balance_due_inr)} was due on ${fmt(p.balance_due_date)} and is now overdue, so a ${inr(lateFee)} late fee applies.`,
        `Please pay by ${fmt(releaseDate)} to keep your plots. If something's wrong, just reply and we'll help.`,
      ];
    } else if (stage === "released") {
      kind = "balance_final";
      subject = "Final notice: your Mera Khet plots may be released";
      lines = [
        `Your balance of ${inr(p.balance_due_inr)} (+ ${inr(lateFee)} late fee) is still unpaid and the grace period ended on ${fmt(releaseDate)}.`,
        "Your plots can now be released at any time. Please pay today to keep them, or contact us if you need help.",
      ];
    }
    if (!kind) continue;

    const whatsapp = `Namaste! Mera Khet reminder: ${lines.join(" ")} Pay here: ${site}/dashboard/my-farm`;
    if (await send(kind, p.id, p.user_id, { whatsapp, subject, label: "Balance reminder", paragraphs: lines, cta })) {
      summary.balance++;
    }
  }

  // --- 2. Abandoned checkout nudge -------------------------------------
  const { data: seasonRows } = await admin.rpc("khet_club_get_season");
  const season = (seasonRows as { registration_deadline: string | null; registrations_paused: boolean }[] | null)?.[0];
  const bookingsOpen = !season?.registrations_paused && !(season?.registration_deadline && today > season.registration_deadline);

  if (bookingsOpen) {
    const from = new Date(Date.now() - 26 * 3600 * 1000).toISOString();
    const to = new Date(Date.now() - 1 * 3600 * 1000).toISOString();
    const { data: abandoned } = await admin
      .from("khet_club_payments")
      .select("user_id, plan_id, created_at")
      .eq("status", "created")
      .neq("payment_kind", "balance")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false });

    const seen = new Set<string>();
    for (const a of (abandoned ?? []) as { user_id: string; plan_id: string; created_at: string }[]) {
      if (seen.has(a.user_id)) continue;
      seen.add(a.user_id);

      // They may have completed a purchase since — don't nudge buyers.
      const { count: paidSince } = await admin
        .from("khet_club_payments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", a.user_id)
        .eq("status", "paid")
        .gte("created_at", a.created_at);
      if (paidSince) continue;

      const planName = membershipPlans.find((m) => m.id === a.plan_id)?.name ?? "plot";
      const lines = [
        `We noticed you started booking a ${planName} plot but the payment didn't go through.`,
        "If something went wrong at checkout — a card or UPI issue, or a question about the plans — just reply and we'll help you finish.",
      ];
      const sent = await send("abandoned_checkout", a.user_id, a.user_id, {
        whatsapp: `Namaste! ${lines.join(" ")} Continue here: ${site}/dashboard/select-plot`,
        subject: "Need a hand finishing your Mera Khet booking?",
        label: "Your booking",
        paragraphs: lines,
        cta: { text: "Continue booking", url: `${site}/dashboard/select-plot` },
      });
      if (sent) summary.abandoned++;
    }
  }

  return NextResponse.json({ ok: true, dryRun, ...summary, ...(dryRun ? { wouldSend } : {}) });
}
