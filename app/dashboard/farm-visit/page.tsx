import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { FarmVisitForm } from "@/components/dashboard/farm-visit-form";
import { createSessionClient } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

type Visit = {
  id: string;
  preferred_date: string;
  visitors: number;
  status: string;
  created_at: string;
};

export default async function FarmVisitPage() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let visits: Visit[] = [];
  if (user) {
    const { data } = await supabase
      .from("khet_club_farm_visits")
      .select("id, preferred_date, visitors, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    visits = (data ?? []) as Visit[];
  }

  return (
    <div>
      <PageHeader title="Farm Visit" subtitle="Request to visit your plot, subject to scheduling and farm conditions." />

      <div className="grid gap-6 p-6 sm:px-10 lg:grid-cols-2">
        <Card className="p-6">
          <FarmVisitForm />
        </Card>

        {visits.length > 0 && (
          <Card className="p-6">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Your Requests
            </p>
            <div className="mt-4 space-y-3">
              {visits.map((v) => (
                <div key={v.id} className="flex items-center justify-between border-b border-[var(--color-ink)]/10 pb-3 text-sm last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">
                      {new Date(v.preferred_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-xs text-[var(--color-ink-soft)]">{v.visitors} visitor{v.visitors > 1 ? "s" : ""}</p>
                  </div>
                  <Badge tone={v.status === "requested" ? "gold" : v.status === "approved" || v.status === "completed" ? "green" : "brown"}>
                    {v.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
