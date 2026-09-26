import { listAllUsers } from "@/lib/supabase/list-all-users";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { createServiceClient } from "@/lib/supabase/service";
import { membershipPlans, FEEDING_FAMILIES_PER_PLOT } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const supabase = createServiceClient();

  const [
    { data: plots },
    { data: usersData },
    { count: camerasOnline },
    { count: pendingVisits },
    { data: pendingVisitRows },
    { data: paidPayments },
    { data: seasonRows },
  ] = await Promise.all([
    supabase.from("khet_club_plots").select("status, user_id"),
    listAllUsers(supabase),
    supabase.from("khet_club_cameras").select("id", { count: "exact", head: true }).eq("status", "online"),
    supabase.from("khet_club_farm_visits").select("id", { count: "exact", head: true }).eq("status", "requested"),
    supabase
      .from("khet_club_farm_visits")
      .select("id, user_id, preferred_date, visitors")
      .eq("status", "requested")
      .order("created_at", { ascending: false })
      .limit(3),
    // A 50/50 balance payment is the same purchase as its deposit, so it must
    // not be counted again toward the Feeding Families Fund.
    supabase.from("khet_club_payments").select("plan_id").eq("status", "paid").neq("payment_kind", "balance").is("archived_season_id", null),
    supabase.rpc("khet_club_get_season"),
  ]);

  const totalPlots = plots?.length ?? 0;
  const filledPlots = plots?.filter((p) => p.status === "filled").length ?? 0;
  const activeMemberships = new Set(plots?.filter((p) => p.user_id).map((p) => p.user_id)).size;

  const usersById = new Map((usersData?.users ?? []).map((u) => [u.id, u]));

  const plotsByPlanId = new Map(membershipPlans.map((p) => [p.id, p.plots]));
  const feedingFamiliesFund = (paidPayments ?? []).reduce((sum, pmt) => {
    const plotsInPlan = plotsByPlanId.get(pmt.plan_id) ?? 0;
    return sum + plotsInPlan * FEEDING_FAMILIES_PER_PLOT;
  }, 0);

  const season = (seasonRows as { season_label: string; sowing_date: string | null }[] | null)?.[0] ?? null;
  const stats = [
    { label: "Total Customers", value: String(usersData?.users?.length ?? 0) },
    { label: "Active Memberships", value: String(activeMemberships) },
    { label: "Allocated Plots", value: `${filledPlots} / ${totalPlots}` },
    { label: "Available Plots", value: String(totalPlots - filledPlots) },
    { label: "Season", value: season?.season_label ?? "—" },
    { label: "Cameras Online", value: String(camerasOnline ?? 0) },
    {
      label: "Sowing Date",
      value: season?.sowing_date
        ? new Date(`${season.sowing_date}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })
        : "Not set",
    },
    { label: "Pending Visit Requests", value: String(pendingVisits ?? 0) },
    { label: "Feeding Families Fund", value: `₹${feedingFamiliesFund.toLocaleString("en-IN")}` },
  ];

  return (
    <div>
      <PageHeader title="Overview" subtitle="Mera Khet · Sujangarh, Rajasthan" />

      <div className="px-6 pt-4 sm:px-10">
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-medium">Download all data</p>
            <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
              Every member, plot, payment, receipt, certificate, delivery,
              message and expense — as CSVs in one ZIP. Contains personal
              data; store it securely.
            </p>
          </div>
          <a
            href="/api/admin/export/all"
            className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--color-ink)]/15 px-4 py-2 text-sm font-medium hover:border-[var(--color-green)] hover:text-[var(--color-green-deep)]"
          >
            <Download className="h-4 w-4" /> Export Everything
          </a>
        </Card>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              {s.label}
            </p>
            <p className="mt-2 font-display text-2xl">{s.value}</p>
          </Card>
        ))}
      </div>

      {(pendingVisitRows?.length ?? 0) > 0 && (
        <div className="space-y-3 px-6 pb-10 sm:px-10">
          {pendingVisitRows!.map((v) => {
            const user = usersById.get(v.user_id);
            return (
              <Card key={v.id} className="p-5">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    Farm visit request — {(user?.user_metadata?.full_name as string) || user?.email || "Unknown"}
                  </p>
                  <Badge tone="gold">Pending</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                  Requested for {new Date(v.preferred_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })} · {v.visitors} visitor{v.visitors > 1 ? "s" : ""}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
