import { listAllUsers } from "@/lib/supabase/list-all-users";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendAdminDigestEmail } from "@/lib/email";
import { membershipPlans } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

function planLabel(planId: string) {
  const plan = membershipPlans.find((p) => p.id === planId);
  return plan ? `${plan.name} (${plan.label})` : planId;
}

/**
 * Triggered once a day by a Vercel Cron job (see vercel.json). Vercel
 * automatically sends an `Authorization: Bearer $CRON_SECRET` header on
 * cron-triggered requests when CRON_SECRET is set as an env var — this
 * is what stops anyone else from hitting the route and spamming admin.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ data: usersData }, { data: payments }, { count: pendingVisits }, { count: openSupport }, { count: newContact }] =
    await Promise.all([
      listAllUsers(supabase),
      supabase
        .from("khet_club_payments")
        .select("user_id, plan_id, amount, status, created_at")
        .eq("status", "paid")
        .gte("created_at", since),
      supabase.from("khet_club_farm_visits").select("id", { count: "exact", head: true }).eq("status", "requested"),
      supabase.from("khet_club_support_messages").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("khet_club_contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]);

  const usersById = new Map((usersData?.users ?? []).map((u) => [u.id, u]));

  const newSignups = (usersData?.users ?? [])
    .filter((u) => new Date(u.created_at) >= new Date(since))
    .map((u) => ({
      name: (u.user_metadata?.full_name as string) || "Unnamed",
      email: u.email ?? "",
    }));

  const newPayments = (payments ?? []).map((p) => {
    const u = usersById.get(p.user_id);
    return {
      name: (u?.user_metadata?.full_name as string) || u?.email || "Unknown",
      email: u?.email ?? "",
      plan: planLabel(p.plan_id),
      amountInr: p.amount / 100,
    };
  });

  const result = await sendAdminDigestEmail({
    newSignups,
    newPayments,
    pendingVisits: pendingVisits ?? 0,
    openSupportMessages: openSupport ?? 0,
    newContactMessages: newContact ?? 0,
  });

  return NextResponse.json({ ok: true, ...result });
}
