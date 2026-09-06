import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/session";
import { createServiceClient } from "@/lib/supabase/service";
import { isAllowedAdminEmail } from "@/lib/admin-auth";
import { toCsv } from "@/lib/csv";
import { membershipPlans, FEEDING_FAMILIES_PER_PLOT } from "@/lib/demo-data";

function planLabel(planId: string) {
  const plan = membershipPlans.find((p) => p.id === planId);
  return plan ? `${plan.name} (${plan.label})` : planId;
}
function planPlots(planId: string) {
  return membershipPlans.find((p) => p.id === planId)?.plots ?? 0;
}

export async function GET() {
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user || !isAllowedAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const admin = createServiceClient();
  const [{ data: payments }, { data: usersData }] = await Promise.all([
    admin.from("khet_club_payments").select("*").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers(),
  ]);

  const usersById = new Map((usersData?.users ?? []).map((u) => [u.id, u]));

  const rows = (payments ?? []).map((p) => {
    const memberUser = usersById.get(p.user_id);
    return {
      date: new Date(p.created_at).toISOString().slice(0, 10),
      member_name: (memberUser?.user_metadata?.full_name as string) || "",
      email: memberUser?.email || "",
      plan: planLabel(p.plan_id),
      amount_inr: p.amount / 100,
      feeding_families_inr: p.status === "paid" ? planPlots(p.plan_id) * FEEDING_FAMILIES_PER_PLOT : 0,
      status: p.status,
      razorpay_order_id: p.razorpay_order_id,
      razorpay_payment_id: p.razorpay_payment_id ?? "",
    };
  });

  const csv = toCsv(rows, [
    { key: "date", label: "Date" },
    { key: "member_name", label: "Member Name" },
    { key: "email", label: "Email" },
    { key: "plan", label: "Plan" },
    { key: "amount_inr", label: "Amount (INR)" },
    { key: "feeding_families_inr", label: "Feeding Families Fund (INR)" },
    { key: "status", label: "Status" },
    { key: "razorpay_order_id", label: "Razorpay Order ID" },
    { key: "razorpay_payment_id", label: "Razorpay Payment ID" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mera-khet-income-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
