import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const supabase = createServiceClient();

  const [
    { data: plots },
    { data: usersData },
    { count: camerasOnline },
    { count: pendingVisits },
    { data: pendingVisitRows },
  ] = await Promise.all([
    supabase.from("khet_club_plots").select("status, user_id"),
    supabase.auth.admin.listUsers(),
    supabase.from("khet_club_cameras").select("id", { count: "exact", head: true }).eq("status", "online"),
    supabase.from("khet_club_farm_visits").select("id", { count: "exact", head: true }).eq("status", "requested"),
    supabase
      .from("khet_club_farm_visits")
      .select("id, user_id, preferred_date, visitors")
      .eq("status", "requested")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const totalPlots = plots?.length ?? 0;
  const filledPlots = plots?.filter((p) => p.status === "filled").length ?? 0;
  const activeMemberships = new Set(plots?.filter((p) => p.user_id).map((p) => p.user_id)).size;

  const usersById = new Map((usersData?.users ?? []).map((u) => [u.id, u]));

  const stats = [
    { label: "Total Customers", value: String(usersData?.users?.length ?? 0) },
    { label: "Active Memberships", value: String(activeMemberships) },
    { label: "Allocated Plots", value: `${filledPlots} / ${totalPlots}` },
    { label: "Available Plots", value: String(totalPlots - filledPlots) },
    { label: "Active Crops", value: "1 (Wheat)" },
    { label: "Cameras Online", value: String(camerasOnline ?? 0) },
    { label: "Season Starts", value: "Near Diwali" },
    { label: "Pending Visit Requests", value: String(pendingVisits ?? 0) },
  ];

  return (
    <div>
      <PageHeader title="Overview" subtitle="Mera Khet · Sandwa, Rajasthan" />

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
                  Requested for {new Date(v.preferred_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · {v.visitors} visitor{v.visitors > 1 ? "s" : ""}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
