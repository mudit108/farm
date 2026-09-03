import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createServiceClient } from "@/lib/supabase/service";
import { adminSetVisitStatus } from "@/app/actions/admin-content";

export const dynamic = "force-dynamic";

type Visit = {
  id: string;
  user_id: string;
  preferred_date: string;
  visitors: number;
  phone: string | null;
  notes: string | null;
  status: string;
};

export default async function VisitsPage() {
  const supabase = createServiceClient();
  const [{ data: visitsData }, { data: usersData }] = await Promise.all([
    supabase
      .from("khet_club_farm_visits")
      .select("id, user_id, preferred_date, visitors, phone, notes, status")
      .order("created_at", { ascending: false }),
    supabase.auth.admin.listUsers(),
  ]);

  const visits = (visitsData ?? []) as Visit[];
  const usersById = new Map((usersData?.users ?? []).map((u) => [u.id, u]));

  return (
    <div>
      <PageHeader title="Visit Requests" subtitle="Approve or decline customer farm-visit requests." />

      <div className="space-y-4 p-6 sm:px-10">
        {visits.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">No visit requests yet.</p>
        )}
        {visits.map((v) => {
          const user = usersById.get(v.user_id);
          return (
            <Card key={v.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-medium">
                  {(user?.user_metadata?.full_name as string) || user?.email || "Unknown"}
                </p>
                <p className="text-sm text-[var(--color-ink-soft)]">
                  {new Date(v.preferred_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
                  {v.visitors} visitor{v.visitors > 1 ? "s" : ""}
                  {v.phone ? ` · ${v.phone}` : ""}
                </p>
                {v.notes && <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{v.notes}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={v.status === "requested" ? "gold" : v.status === "declined" ? "brown" : "green"}>
                  {v.status}
                </Badge>
                {v.status === "requested" && (
                  <>
                    <form action={adminSetVisitStatus}>
                      <input type="hidden" name="id" value={v.id} />
                      <input type="hidden" name="status" value="declined" />
                      <Button size="sm" variant="outline" type="submit">Decline</Button>
                    </form>
                    <form action={adminSetVisitStatus}>
                      <input type="hidden" name="id" value={v.id} />
                      <input type="hidden" name="status" value="approved" />
                      <Button size="sm" type="submit">Approve</Button>
                    </form>
                  </>
                )}
                {v.status === "approved" && (
                  <form action={adminSetVisitStatus}>
                    <input type="hidden" name="id" value={v.id} />
                    <input type="hidden" name="status" value="completed" />
                    <Button size="sm" variant="outline" type="submit">Mark Completed</Button>
                  </form>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
