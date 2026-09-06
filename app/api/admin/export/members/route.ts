import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/session";
import { createServiceClient } from "@/lib/supabase/service";
import { isAllowedAdminEmail } from "@/lib/admin-auth";
import { toCsv } from "@/lib/csv";
import { harvestOptions } from "@/lib/demo-data";

export async function GET() {
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user || !isAllowedAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const admin = createServiceClient();
  const [{ data: usersData }, { data: plots }, { data: prefs }] = await Promise.all([
    admin.auth.admin.listUsers(),
    admin
      .from("khet_club_plots")
      .select("plot_number, user_id, plan_id, phone, city")
      .eq("status", "filled")
      .not("user_id", "is", null),
    admin.from("khet_club_harvest_preferences").select("user_id, method, schedule, installment_kg"),
  ]);

  const plotsByUser = new Map<string, { numbers: number[]; planId: string | null; phone: string | null; city: string | null }>();
  for (const p of plots ?? []) {
    if (!p.user_id) continue;
    if (!plotsByUser.has(p.user_id)) {
      plotsByUser.set(p.user_id, { numbers: [], planId: p.plan_id, phone: p.phone, city: p.city });
    }
    plotsByUser.get(p.user_id)!.numbers.push(p.plot_number);
  }
  const prefsByUser = new Map((prefs ?? []).map((pr) => [pr.user_id, pr]));

  const rows = (usersData?.users ?? []).map((u) => {
    const holding = plotsByUser.get(u.id);
    const pref = prefsByUser.get(u.id);
    const prefOption = pref ? harvestOptions.find((o) => o.id === pref.method) : null;
    return {
      name: (u.user_metadata?.full_name as string) || "",
      email: u.email || "",
      phone: (u.user_metadata?.phone as string) || holding?.phone || "",
      city: holding?.city || "",
      email_confirmed: u.email_confirmed_at ? "yes" : "no",
      plots: holding ? holding.numbers.sort((a, b) => a - b).join("; ") : "",
      plot_count: holding?.numbers.length ?? 0,
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
    { key: "email_confirmed", label: "Email Confirmed" },
    { key: "plots", label: "Plot Numbers" },
    { key: "plot_count", label: "Plot Count" },
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
