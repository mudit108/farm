import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createServiceClient } from "@/lib/supabase/service";
import { harvestOptions } from "@/lib/demo-data";
import {
  adminSetHarvestTotal,
  adminRecordDelivery,
  adminDeleteDelivery,
  adminApproveHarvestChange,
  adminRejectHarvestChange,
} from "@/app/actions/admin-harvest";

export const dynamic = "force-dynamic";

type Pref = { user_id: string; method: string; schedule: string; installment_kg: number | null; confirmed_total_kg: number | null };
type Delivery = { id: string; user_id: string; kg_delivered: number; delivered_at: string; notes: string | null };
type ChangeRequest = {
  id: string;
  user_id: string;
  requested_method: string;
  requested_schedule: string;
  requested_installment_kg: number | null;
  requested_at: string;
};

function methodTitle(id: string) {
  return harvestOptions.find((o) => o.id === id)?.title ?? id;
}

export default async function AdminHarvestPage() {
  const supabase = createServiceClient();

  const [{ data: usersData }, { data: prefsData }, { data: deliveriesData }, { data: requestsData }] = await Promise.all([
    supabase.auth.admin.listUsers(),
    supabase.from("khet_club_harvest_preferences").select("user_id, method, schedule, installment_kg, confirmed_total_kg"),
    supabase.from("khet_club_harvest_deliveries").select("id, user_id, kg_delivered, delivered_at, notes").order("delivered_at", { ascending: false }),
    supabase
      .from("khet_club_harvest_preference_requests")
      .select("id, user_id, requested_method, requested_schedule, requested_installment_kg, requested_at")
      .eq("status", "pending")
      .order("requested_at"),
  ]);

  const usersById = new Map((usersData?.users ?? []).map((u) => [u.id, u]));
  const prefs = (prefsData ?? []) as Pref[];
  const deliveries = (deliveriesData ?? []) as Delivery[];
  const changeRequests = (requestsData ?? []) as ChangeRequest[];
  const prefsByUser = new Map(prefs.map((p) => [p.user_id, p]));

  const deliveredByUser = new Map<string, number>();
  for (const d of deliveries) {
    deliveredByUser.set(d.user_id, (deliveredByUser.get(d.user_id) ?? 0) + d.kg_delivered);
  }

  return (
    <div>
      <PageHeader title="Harvest Deliveries" subtitle="Track each member's harvest delivery against their confirmed total." />

      <div className="space-y-4 p-6 sm:px-10">
        {changeRequests.length > 0 && (
          <Card className="border-[var(--color-brown)]/30 bg-[var(--color-brown-soft)] p-5">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
              Pending Preference Change Requests ({changeRequests.length})
            </p>
            <div className="mt-3 space-y-3">
              {changeRequests.map((req) => {
                const user = usersById.get(req.user_id);
                const name = (user?.user_metadata?.full_name as string) || user?.email || "Unknown";
                const current = prefsByUser.get(req.user_id);
                return (
                  <div key={req.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-white/60 p-3">
                    <div className="text-sm">
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        Current: {current ? methodTitle(current.method) : "—"}
                        {current?.schedule === "monthly" ? ` (~${current.installment_kg} kg/mo)` : ""}
                        {" → "}
                        Requested: {methodTitle(req.requested_method)}
                        {req.requested_schedule === "monthly" ? ` (~${req.requested_installment_kg} kg/mo)` : " (one-time)"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <form action={adminRejectHarvestChange}>
                        <input type="hidden" name="requestId" value={req.id} />
                        <Button type="submit" size="sm" variant="outline">Reject</Button>
                      </form>
                      <form action={adminApproveHarvestChange}>
                        <input type="hidden" name="requestId" value={req.id} />
                        <Button type="submit" size="sm">Approve</Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {prefs.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">
            No members have set a harvest preference yet.
          </p>
        )}

        {prefs.map((pref) => {
          const user = usersById.get(pref.user_id);
          const name = (user?.user_metadata?.full_name as string) || user?.email || "Unknown";
          const method = harvestOptions.find((o) => o.id === pref.method)?.title ?? pref.method;
          const delivered = deliveredByUser.get(pref.user_id) ?? 0;
          const total = pref.confirmed_total_kg;
          const remaining = total !== null ? Math.max(total - delivered, 0) : null;
          const progressPct = total ? Math.min((delivered / total) * 100, 100) : 0;

          return (
            <Card key={pref.user_id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {method}
                    {pref.schedule === "monthly" ? ` · ~${pref.installment_kg} kg/month` : " · one-time"}
                  </p>
                </div>
                <Badge tone={total ? "green" : "brown"}>{total ? `${total} kg total` : "Total not set"}</Badge>
              </div>

              {total !== null && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-[var(--color-ink-soft)]">
                    <span>{delivered} kg delivered</span>
                    <span>{remaining} kg remaining</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-green-soft)]">
                    <div className="h-full rounded-full bg-[var(--color-green)]" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <form action={adminSetHarvestTotal} className="flex gap-2">
                  <input type="hidden" name="userId" value={pref.user_id} />
                  <input
                    name="totalKg"
                    type="number"
                    min={1}
                    placeholder="Confirmed total (kg)"
                    defaultValue={total ?? ""}
                    className="input flex-1"
                  />
                  <Button type="submit" size="sm" variant="outline">Set Total</Button>
                </form>

                <form action={adminRecordDelivery} className="flex flex-wrap gap-2">
                  <input type="hidden" name="userId" value={pref.user_id} />
                  <input name="kgDelivered" type="number" min={1} required placeholder="kg" className="input w-20" />
                  <input name="deliveredAt" type="date" className="input flex-1" />
                  <Button type="submit" size="sm">Record Delivery</Button>
                </form>
              </div>
            </Card>
          );
        })}

        <Card className="mt-2 overflow-hidden p-0">
          <div className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] px-5 py-3">
            <p className="text-sm font-medium">Delivery Log</p>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">kg</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink)]/10">
                {deliveries.map((d) => {
                  const user = usersById.get(d.user_id);
                  return (
                    <tr key={d.id}>
                      <td className="px-4 py-2.5">{(user?.user_metadata?.full_name as string) || user?.email || "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">
                        {new Date(d.delivered_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-2.5 font-mono-data">{d.kg_delivered} kg</td>
                      <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">{d.notes ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right">
                        <form action={adminDeleteDelivery}>
                          <input type="hidden" name="id" value={d.id} />
                          <button className="text-xs font-medium text-[var(--color-live)] hover:underline">Delete</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {deliveries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">
                      No deliveries recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
