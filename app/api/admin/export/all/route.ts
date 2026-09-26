import { listAllUsers } from "@/lib/supabase/list-all-users";
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { createSessionClient } from "@/lib/supabase/session";
import { createServiceClient } from "@/lib/supabase/service";
import { isAllowedAdminEmail } from "@/lib/admin-auth";
import { toCsv } from "@/lib/csv";
import { membershipPlans, harvestOptions, EXPENSE_CATEGORIES } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

function planLabel(planId: string | null) {
  if (!planId) return "";
  const plan = membershipPlans.find((p) => p.id === planId);
  return plan ? `${plan.name} (${plan.label})` : planId;
}

function d(value: string | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

/**
 * Complete data export: every member-related table as a separate CSV
 * inside one ZIP. This is the "take my data with me" download — useful
 * for accounting, for a backup independent of Supabase, and for
 * answering questions months later without writing SQL.
 *
 * Admin-only, checked explicitly here: this route lives under /api, not
 * /admin, so proxy.ts's path-prefix matching does not cover it.
 */
export async function GET() {
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user || !isAllowedAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const admin = createServiceClient();

  const [
    { data: usersData },
    { data: plots },
    { data: payments },
    { data: receipts },
    { data: certificates },
    { data: prefs },
    { data: deliveries },
    { data: visits },
    { data: support },
    { data: contact },
    { data: expenses },
    { data: redemptions },
  ] = await Promise.all([
    listAllUsers(admin),
    admin.from("khet_club_plots").select("*").order("plot_number"),
    admin.from("khet_club_payments").select("*").order("created_at", { ascending: false }),
    admin.from("khet_club_receipts").select("*").order("issued_at", { ascending: false }),
    admin.from("khet_club_certificates").select("*"),
    admin.from("khet_club_harvest_preferences").select("*"),
    admin.from("khet_club_harvest_deliveries").select("*").order("delivered_at", { ascending: false }),
    admin.from("khet_club_farm_visits").select("*").order("created_at", { ascending: false }),
    admin.from("khet_club_support_messages").select("*").order("created_at", { ascending: false }),
    admin.from("khet_club_contact_messages").select("*").order("created_at", { ascending: false }),
    admin.from("khet_club_expenses").select("*").order("expense_date", { ascending: false }),
    admin.from("khet_club_discount_redemptions").select("*").order("redeemed_at", { ascending: false }),
  ]);

  const users = usersData?.users ?? [];
  const usersById = new Map(users.map((u) => [u.id, u]));
  const nameOf = (id: string | null) => {
    if (!id) return "";
    const u = usersById.get(id);
    return (u?.user_metadata?.full_name as string) || u?.email || "";
  };
  const emailOf = (id: string | null) => (id ? usersById.get(id)?.email ?? "" : "");

  const zip = new JSZip();
  const stamp = new Date().toISOString().slice(0, 10);

  const plotsByUser = new Map<string, number[]>();
  for (const p of plots ?? []) {
    if (!p.user_id) continue;
    plotsByUser.set(p.user_id, [...(plotsByUser.get(p.user_id) ?? []), p.plot_number]);
  }
  const prefsByUser = new Map((prefs ?? []).map((pr) => [pr.user_id, pr]));

  zip.file(
    "01-members.csv",
    toCsv(
      users.map((u) => {
        const held = plotsByUser.get(u.id) ?? [];
        const pref = prefsByUser.get(u.id);
        const prefOption = pref ? harvestOptions.find((o) => o.id === pref.method) : null;
        return {
          name: (u.user_metadata?.full_name as string) || "",
          email: u.email ?? "",
          phone: (u.user_metadata?.phone as string) || "",
          city: (u.user_metadata?.city as string) || "",
          email_confirmed: u.email_confirmed_at ? "yes" : "no",
          plots: held.sort((a, b) => a - b).join("; "),
          plot_count: held.length,
          harvest_method: prefOption?.title ?? "",
          harvest_schedule: pref?.schedule ?? "",
          confirmed_total_kg: pref?.confirmed_total_kg ?? "",
          signed_up: d(u.created_at),
          last_sign_in: d(u.last_sign_in_at),
        };
      }),
      [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "city", label: "Delivery City" },
        { key: "email_confirmed", label: "Email Confirmed" },
        { key: "plots", label: "Plot Numbers" },
        { key: "plot_count", label: "Plot Count" },
        { key: "harvest_method", label: "Harvest Method" },
        { key: "harvest_schedule", label: "Harvest Schedule" },
        { key: "confirmed_total_kg", label: "Confirmed Total (kg)" },
        { key: "signed_up", label: "Signed Up" },
        { key: "last_sign_in", label: "Last Sign In" },
      ]
    )
  );

  zip.file(
    "02-plots.csv",
    toCsv(
      (plots ?? []).map((p) => ({
        plot_number: p.plot_number,
        status: p.status,
        holder: p.full_name ?? "",
        email: p.email ?? "",
        phone: p.phone ?? "",
        city: p.city ?? "",
        plan: planLabel(p.plan_id),
        assigned: d(p.assigned_at),
        approved: d(p.approved_at),
        nickname: p.custom_name ?? "",
      })),
      [
        { key: "plot_number", label: "Plot" },
        { key: "status", label: "Status" },
        { key: "holder", label: "Held By" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "city", label: "Delivery City" },
        { key: "plan", label: "Plan" },
        { key: "assigned", label: "Assigned" },
        { key: "approved", label: "Approved" },
        { key: "nickname", label: "Nickname" },
      ]
    )
  );

  zip.file(
    "03-payments.csv",
    toCsv(
      (payments ?? []).map((p) => ({
        date: d(p.created_at),
        member: nameOf(p.user_id),
        email: emailOf(p.user_id),
        plan: planLabel(p.plan_id),
        amount_inr: p.amount / 100,
        discount_inr: p.discount_inr ?? 0,
        status: p.status,
        order_id: p.razorpay_order_id ?? "",
        payment_id: p.razorpay_payment_id ?? "",
      })),
      [
        { key: "date", label: "Date" },
        { key: "member", label: "Member" },
        { key: "email", label: "Email" },
        { key: "plan", label: "Plan" },
        { key: "amount_inr", label: "Amount Paid (INR)" },
        { key: "discount_inr", label: "Discount (INR)" },
        { key: "status", label: "Status" },
        { key: "order_id", label: "Razorpay Order ID" },
        { key: "payment_id", label: "Razorpay Payment ID" },
      ]
    )
  );

  zip.file(
    "04-receipts.csv",
    toCsv(
      (receipts ?? []).map((r) => ({
        receipt_number: r.receipt_number,
        date: d(r.issued_at),
        member: r.full_name,
        email: emailOf(r.user_id),
        plan: planLabel(r.plan_id),
        plots: (r.plot_numbers ?? []).join("; "),
        amount_inr: r.amount_paise / 100,
        fff_inr: r.feeding_families_inr,
        emailed: r.email_sent ? "yes" : "no",
      })),
      [
        { key: "receipt_number", label: "Receipt No." },
        { key: "date", label: "Date" },
        { key: "member", label: "Member" },
        { key: "email", label: "Email" },
        { key: "plan", label: "Plan" },
        { key: "plots", label: "Plots" },
        { key: "amount_inr", label: "Amount (INR)" },
        { key: "fff_inr", label: "Feeding Families (INR)" },
        { key: "emailed", label: "Emailed" },
      ]
    )
  );

  zip.file(
    "05-certificates.csv",
    toCsv(
      (certificates ?? []).map((c) => ({
        certificate_number: c.certificate_number,
        member: c.full_name,
        email: emailOf(c.user_id),
        plan: planLabel(c.plan_id),
        plots: (c.plot_numbers ?? []).join("; "),
        area_sq_ft: c.area_sq_ft,
        issued: d(c.issued_at),
      })),
      [
        { key: "certificate_number", label: "Certificate No." },
        { key: "member", label: "Member" },
        { key: "email", label: "Email" },
        { key: "plan", label: "Plan" },
        { key: "plots", label: "Plots" },
        { key: "area_sq_ft", label: "Area (sq ft)" },
        { key: "issued", label: "Issued" },
      ]
    )
  );

  zip.file(
    "06-harvest-deliveries.csv",
    toCsv(
      (deliveries ?? []).map((dv) => ({
        date: d(dv.delivered_at),
        member: nameOf(dv.user_id),
        email: emailOf(dv.user_id),
        kg: dv.kg_delivered,
        notes: dv.notes ?? "",
        voided: dv.voided_at ? "VOIDED" : "",
        void_reason: dv.void_reason ?? "",
      })),
      [
        { key: "date", label: "Delivered" },
        { key: "member", label: "Member" },
        { key: "email", label: "Email" },
        { key: "kg", label: "Kg Delivered" },
        { key: "notes", label: "Notes" },
        { key: "voided", label: "Voided" },
        { key: "void_reason", label: "Void Reason" },
      ]
    )
  );

  zip.file(
    "07-farm-visits.csv",
    toCsv(
      (visits ?? []).map((v) => ({
        requested: d(v.created_at),
        member: nameOf(v.user_id),
        email: emailOf(v.user_id),
        preferred_date: d(v.preferred_date),
        visitors: v.visitors,
        status: v.status,
      })),
      [
        { key: "requested", label: "Requested" },
        { key: "member", label: "Member" },
        { key: "email", label: "Email" },
        { key: "preferred_date", label: "Preferred Date" },
        { key: "visitors", label: "Visitors" },
        { key: "status", label: "Status" },
      ]
    )
  );

  zip.file(
    "08-support-messages.csv",
    toCsv(
      (support ?? []).map((m) => ({
        date: d(m.created_at),
        member: nameOf(m.user_id),
        email: emailOf(m.user_id),
        subject: m.subject,
        message: m.message,
        status: m.status,
      })),
      [
        { key: "date", label: "Date" },
        { key: "member", label: "Member" },
        { key: "email", label: "Email" },
        { key: "subject", label: "Subject" },
        { key: "message", label: "Message" },
        { key: "status", label: "Status" },
      ]
    )
  );

  zip.file(
    "09-contact-messages.csv",
    toCsv(
      (contact ?? []).map((m) => ({
        date: d(m.created_at),
        name: m.name,
        email: m.email,
        phone: m.phone,
        message: m.message,
        status: m.status,
      })),
      [
        { key: "date", label: "Date" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "message", label: "Message" },
        { key: "status", label: "Status" },
      ]
    )
  );

  const categoryLabels = new Map(EXPENSE_CATEGORIES.map((c) => [c.value, c.label]));
  zip.file(
    "10-expenses.csv",
    toCsv(
      (expenses ?? []).map((e) => ({
        date: e.expense_date,
        category: categoryLabels.get(e.category) ?? e.category,
        description: e.description,
        amount_inr: e.amount_inr,
      })),
      [
        { key: "date", label: "Date" },
        { key: "category", label: "Category" },
        { key: "description", label: "Description" },
        { key: "amount_inr", label: "Amount (INR)" },
      ]
    )
  );

  zip.file(
    "11-discount-redemptions.csv",
    toCsv(
      (redemptions ?? []).map((r) => ({
        date: d(r.redeemed_at),
        member: nameOf(r.user_id),
        email: emailOf(r.user_id),
        plan: planLabel(r.plan_id),
        original_inr: r.original_inr,
        discount_inr: r.discount_inr,
        final_inr: r.final_inr,
        order_id: r.razorpay_order_id,
      })),
      [
        { key: "date", label: "Date" },
        { key: "member", label: "Member" },
        { key: "email", label: "Email" },
        { key: "plan", label: "Plan" },
        { key: "original_inr", label: "Original (INR)" },
        { key: "discount_inr", label: "Discount (INR)" },
        { key: "final_inr", label: "Paid (INR)" },
        { key: "order_id", label: "Razorpay Order ID" },
      ]
    )
  );

  zip.file(
    "README.txt",
    [
      `Mera Khet - complete data export`,
      `Generated: ${new Date().toISOString()}`,
      ``,
      `Files:`,
      `  01-members.csv              every account, with plots and harvest preference`,
      `  02-plots.csv                all ${plots?.length ?? 0} plots and who holds them`,
      `  03-payments.csv             every payment attempt, paid or not`,
      `  04-receipts.csv             issued payment receipts`,
      `  05-certificates.csv         issued membership certificates`,
      `  06-harvest-deliveries.csv   deliveries; VOIDED rows are flagged and`,
      `                              should be excluded from delivered totals`,
      `  07-farm-visits.csv          visit requests and their status`,
      `  08-support-messages.csv     member support messages`,
      `  09-contact-messages.csv     public contact form messages`,
      `  10-expenses.csv             manually logged farm expenses`,
      `  11-discount-redemptions.csv discount codes actually used`,
      ``,
      `This export contains personal data (names, emails, phone numbers,`,
      `delivery cities). Store it securely and delete copies you no`,
      `longer need.`,
    ].join("\n")
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="mera-khet-full-export-${stamp}.zip"`,
    },
  });
}
