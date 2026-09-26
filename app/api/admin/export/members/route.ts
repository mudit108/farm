import { listAllUsers } from "@/lib/supabase/list-all-users";
import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/session";
import { createServiceClient } from "@/lib/supabase/service";
import { isAllowedAdminEmail } from "@/lib/admin-auth";
import { toCsv } from "@/lib/csv";
import { harvestOptions, membershipPlans } from "@/lib/demo-data";

export async function GET() {
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user || !isAllowedAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const admin = createServiceClient();
  const [{ data: usersData }, { data: plots }, { data: prefs }, { data: payments }] = await Promise.all([
    listAllUsers(admin),
    admin
      .from("khet_club_plots")
      .select("plot_number, user_id, plan_id, phone, city, address, pincode")
      .eq("status", "filled")
      .not("user_id", "is", null),
    admin.from("khet_club_harvest_preferences").select("user_id, method, schedule, installment_kg"),
    admin.from("khet_club_payments").select("user_id, amount").eq("status", "paid"),
  ]);

  const plotsByUser = new Map<
    string,
    { numbers: number[]; planId: string | null; phone: string | null; city: string | null; address: string | null; pincode: string | null }
  >();
  for (const p of plots ?? []) {
    if (!p.user_id) continue;
    if (!plotsByUser.has(p.user_id)) {
      plotsByUser.set(p.user_id, { numbers: [], planId: p.plan_id, phone: p.phone, city: p.city, address: p.address, pincode: p.pincode });
    }
    plotsByUser.get(p.user_id)!.numbers.push(p.plot_number);
  }
  const prefsByUser = new Map((prefs ?? []).map((pr) => [pr.user_id, pr]));
  const paidByUser = new Map<string, number>();
  for (const pay of payments ?? []) {
    paidByUser.set(pay.user_id, (paidByUser.get(pay.user_id) ?? 0) + pay.amount / 100);
  }

  const rows = (usersData?.users ?? []).map((u) => {
    const holding = plotsByUser.get(u.id);
    const pref = prefsByUser.get(u.id);
    const prefOption = pref ? harvestOptions.find((o) => o.id === pref.method) : null;
    const plan = holding?.planId ? membershipPlans.find((p) => p.id === holding.planId) : null;
    return {
      name: (u.user_metadata?.full_name as string) || "",
      email: u.email || "",
      phone: (u.user_metadata?.phone as string) || holding?.phone || "",
      city: holding?.city || "",
      address: holding?.address || "",
      pincode: holding?.pincode || "",
      email_confirmed: u.email_confirmed_at ? "yes" : "no",
      plan: plan ? `${plan.name} (${plan.label})` : "",
      plots: holding ? holding.numbers.sort((a, b) => a - b).join("; ") : "",
      plot_count: holding?.numbers.length ?? 0,
      amount_paid_inr: paidByUser.get(u.id) ?? 0,
      harvest_preference: prefOption
        ? `${prefOption.title}${pref!.schedule === "monthly" ? ` (~${pref!.installment_kg} kg/mo)` : " (one-time)"}`
        : "",
      signed_up: new Date(u.created_at).toISOString().slice(0, 10),
    };
  });

  const csv = toCsv(rows, [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "city", label: "City" },
    { key: "address", label: "Address" },
    { key: "pincode", label: "Pincode" },
    { key: "email_confirmed", label: "Email Confirmed" },
    { key: "plan", label: "Plan" },
    { key: "plots", label: "Plot Numbers" },
    { key: "plot_count", label: "Plot Count" },
    { key: "amount_paid_inr", label: "Amount Paid (INR)" },
    { key: "harvest_preference", label: "Harvest Preference" },
    { key: "signed_up", label: "Signed Up" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mera-khet-members-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
