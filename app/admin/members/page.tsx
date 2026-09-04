import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { createServiceClient } from "@/lib/supabase/service";
import {
  adminMarkPlotAvailable,
  adminMarkPlotFilled,
  adminAssignPlan,
  adminFreeBatch,
} from "@/app/actions/admin-plots";
import { adminApproveBatch, adminResendCertificate } from "@/app/actions/admin-certificate";
import { adminAddDocument, adminDeleteDocument } from "@/app/actions/admin-content";
import {
  adminSetHarvestTotal,
  adminRecordDelivery,
  adminDeleteDelivery,
  adminApproveHarvestChange,
  adminRejectHarvestChange,
} from "@/app/actions/admin-harvest";
import { membershipPlans, harvestOptions } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

type PlotRow = {
  plot_number: number;
  status: "available" | "filled";
  user_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  plan_id: string | null;
  claim_batch_id: string | null;
  assigned_at: string | null;
  approved_at: string | null;
};
type CertRow = { claim_batch_id: string; certificate_number: string; email_sent: boolean; whatsapp_sent: boolean };
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
type Doc = { id: string; name: string; file_url: string; user_id: string | null };

function planLabel(planId: string | null) {
  const plan = membershipPlans.find((p) => p.id === planId);
  return plan ? `${plan.name} (${plan.label})` : null;
}
function methodTitle(id: string) {
  return harvestOptions.find((o) => o.id === id)?.title ?? id;
}

export default async function MembersPage() {
  const supabase = createServiceClient();

  const [
    { data: usersData },
    { data: plotsData },
    { data: certsData },
    { data: prefsData },
    { data: deliveriesData },
    { data: requestsData },
    { data: docsData },
  ] = await Promise.all([
    supabase.auth.admin.listUsers(),
    supabase
      .from("khet_club_plots")
      .select("plot_number, status, user_id, full_name, phone, email, city, plan_id, claim_batch_id, assigned_at, approved_at")
      .order("plot_number"),
    supabase.from("khet_club_certificates").select("claim_batch_id, certificate_number, email_sent, whatsapp_sent"),
    supabase.from("khet_club_harvest_preferences").select("user_id, method, schedule, installment_kg, confirmed_total_kg"),
    supabase.from("khet_club_harvest_deliveries").select("id, user_id, kg_delivered, delivered_at, notes").order("delivered_at", { ascending: false }),
    supabase
      .from("khet_club_harvest_preference_requests")
      .select("id, user_id, requested_method, requested_schedule, requested_installment_kg, requested_at")
      .eq("status", "pending")
      .order("requested_at"),
    supabase.from("khet_club_documents").select("id, name, file_url, user_id").order("created_at", { ascending: false }),
  ]);

  const users = usersData?.users ?? [];
  const usersById = new Map(users.map((u) => [u.id, u]));
  const plots = (plotsData ?? []) as PlotRow[];
  const certificatesByBatch = new Map((certsData ?? []).map((c) => [c.claim_batch_id, c as CertRow]));
  const prefs = (prefsData ?? []) as Pref[];
  const prefsByUser = new Map(prefs.map((p) => [p.user_id, p]));
  const deliveries = (deliveriesData ?? []) as Delivery[];
  const changeRequests = (requestsData ?? []) as ChangeRequest[];
  const docs = (docsData ?? []) as Doc[];

  const filled = plots.filter((p) => p.status === "filled").length;
  const available = plots.length - filled;

  const batches = new Map<string, PlotRow[]>();
  for (const p of plots) {
    if (p.status !== "filled" || !p.claim_batch_id) continue;
    const list = batches.get(p.claim_batch_id) ?? [];
    list.push(p);
    batches.set(p.claim_batch_id, list);
  }

  const deliveredByUser = new Map<string, number>();
  for (const d of deliveries) {
    deliveredByUser.set(d.user_id, (deliveredByUser.get(d.user_id) ?? 0) + d.kg_delivered);
  }

  // --- Tab 1: Members ---------------------------------------------------
  const membersContent = (
    <div className="p-6 sm:px-10">
      <Card className="p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Overall availability</span>
          <span className="font-mono-data text-[var(--color-ink-soft)]">{filled} / {plots.length} filled</span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-green-soft)]">
          <div className="h-full rounded-full bg-[var(--color-green)]" style={{ width: `${plots.length ? (filled / plots.length) * 100 : 0}%` }} />
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Manually Assign a Plan</p>
        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
          For offline reservations — phone/walk-in signups you want reflected here.
          Currently {available} plot{available === 1 ? "" : "s"} available.
        </p>
        <form action={adminAssignPlan} className="mt-4 grid gap-3 sm:grid-cols-6">
          <select name="planId" required className="input sm:col-span-1" defaultValue="">
            <option value="" disabled>Plan</option>
            {membershipPlans.map((plan) => (
              <option key={plan.id} value={plan.id} disabled={available < plan.plots}>
                {plan.name} — {plan.label}
              </option>
            ))}
          </select>
          <input name="fullName" placeholder="Full name" className="input sm:col-span-1" />
          <input name="phone" placeholder="Phone" className="input sm:col-span-1" />
          <input name="email" placeholder="Email" className="input sm:col-span-1" />
          <input name="city" placeholder="City" className="input sm:col-span-1" />
          <Button type="submit" size="sm" className="sm:col-span-1">Assign</Button>
        </form>
      </Card>

      {batches.size > 0 && (
        <div className="mt-6">
          <p className="mb-3 font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Members ({batches.size})
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from(batches.entries()).map(([batchId, rows]) => {
              const first = rows[0];
              const plotNumbers = rows.map((r) => r.plot_number).sort((a, b) => a - b);
              const cert = certificatesByBatch.get(batchId);
              const pref = first.user_id ? prefsByUser.get(first.user_id) : undefined;
              const prefOption = pref ? harvestOptions.find((o) => o.id === pref.method) : null;
              return (
                <Card key={batchId} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{first.full_name ?? "—"}</p>
                      <p className="text-xs text-[var(--color-ink-soft)]">{first.email ?? "—"}</p>
                    </div>
                    <Badge tone="brown">{planLabel(first.plan_id) ?? `${rows.length} Plots`}</Badge>
                  </div>
                  <p className="mt-2 font-mono-data text-xs text-[var(--color-ink-soft)]">
                    Plots: {plotNumbers.map((n) => `#${n}`).join(", ")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-ink-soft)]">
                    <span>{first.phone ?? "—"}</span>
                    <span>{first.city ?? "—"}</span>
                    <span>{first.assigned_at ? new Date(first.assigned_at).toLocaleDateString("en-IN") : "—"}</span>
                  </div>
                  {prefOption && (
                    <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                      Harvest: {prefOption.title}
                      {pref!.schedule === "monthly" ? ` (~${pref!.installment_kg} kg/mo)` : ""}
                    </p>
                  )}

                  {cert ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--color-ink)]/10 pt-3">
                      <Badge tone="green">Certificate {cert.certificate_number}</Badge>
                      <span className="text-[10px] text-[var(--color-ink-soft)]">
                        Email {cert.email_sent ? "✓" : "✗"} · WhatsApp {cert.whatsapp_sent ? "✓" : "✗"}
                      </span>
                      <a href={`/api/certificate/download?batch=${batchId}`} className="text-xs font-medium text-[var(--color-green)] hover:underline">
                        Download
                      </a>
                      <form action={adminResendCertificate}>
                        <input type="hidden" name="claimBatchId" value={batchId} />
                        <button className="text-xs font-medium text-[var(--color-brown)] hover:underline">Resend</button>
                      </form>
                    </div>
                  ) : (
                    <form action={adminApproveBatch} className="mt-3 border-t border-[var(--color-ink)]/10 pt-3">
                      <input type="hidden" name="claimBatchId" value={batchId} />
                      <Button type="submit" size="sm" className="w-full">Approve & Issue Certificate</Button>
                    </form>
                  )}

                  <form action={adminFreeBatch} className="mt-2">
                    <input type="hidden" name="claimBatchId" value={batchId} />
                    <button className="text-xs font-medium text-[var(--color-live)] hover:underline">
                      Free Up All {rows.length} Plot{rows.length > 1 ? "s" : ""}
                    </button>
                  </form>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // --- Tab 2: All Accounts ------------------------------------------------
  const accountsContent = (
    <div className="p-6 sm:px-10">
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Confirmed</th>
                <th className="px-5 py-3 font-medium">Harvest Preference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ink)]/10">
              {users.map((u) => {
                const pref = prefsByUser.get(u.id);
                const prefOption = pref ? harvestOptions.find((o) => o.id === pref.method) : null;
                return (
                  <tr key={u.id}>
                    <td className="px-5 py-3 font-medium">{(u.user_metadata?.full_name as string) || "—"}</td>
                    <td className="px-5 py-3 text-[var(--color-ink-soft)]">{u.email}</td>
                    <td className="px-5 py-3">
                      <Badge tone={u.email_confirmed_at ? "green" : "brown"}>
                        {u.email_confirmed_at ? "confirmed" : "pending"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {prefOption ? (
                        <>
                          {prefOption.title}
                          {pref!.schedule === "monthly" && (
                            <span className="ml-1 text-xs text-[var(--color-brown)]">(~{pref!.installment_kg} kg/mo)</span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-[var(--color-ink-soft)]">No customers yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Documents</p>
        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
          Add a document link for a specific customer (by email), or leave email blank for a shared document everyone can see.
        </p>
        <form action={adminAddDocument} className="mt-4 grid gap-3 sm:grid-cols-4">
          <input name="name" required placeholder="Document name" className="input sm:col-span-1" />
          <input name="fileUrl" required placeholder="File URL" className="input sm:col-span-1" />
          <input name="email" placeholder="Customer email (optional)" className="input sm:col-span-1" />
          <Button type="submit" size="sm" className="sm:col-span-1">Add Document</Button>
        </form>
        {docs.length > 0 && (
          <div className="mt-4 divide-y divide-[var(--color-ink)]/10">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {d.user_id ? "Customer-specific" : "Shared"} ·{" "}
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="underline">{d.file_url}</a>
                  </p>
                </div>
                <form action={adminDeleteDocument}>
                  <input type="hidden" name="id" value={d.id} />
                  <button className="text-xs font-medium text-[var(--color-live)] hover:underline">Remove</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  // --- Tab 3: All Plots -----------------------------------------------
  const plotsContent = (
    <div className="p-6 sm:px-10">
      <Card className="overflow-hidden p-0">
        <div className="max-h-[640px] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="sticky top-0 border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-4 py-3 font-medium">Plot</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Assigned</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ink)]/10">
              {plots.map((p) => (
                <tr key={p.plot_number}>
                  <td className="px-4 py-2.5 font-mono-data">#{p.plot_number}</td>
                  <td className="px-4 py-2.5"><Badge tone={p.status === "filled" ? "brown" : "green"}>{p.status}</Badge></td>
                  <td className="px-4 py-2.5">{planLabel(p.plan_id) ?? "—"}</td>
                  <td className="px-4 py-2.5">{p.full_name ?? "—"}</td>
                  <td className="px-4 py-2.5">{p.phone ?? "—"}</td>
                  <td className="px-4 py-2.5">{p.email ?? "—"}</td>
                  <td className="px-4 py-2.5">{p.city ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">
                    {p.assigned_at ? new Date(p.assigned_at).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {p.status === "filled" ? (
                      <form action={adminMarkPlotAvailable}>
                        <input type="hidden" name="plotNumber" value={p.plot_number} />
                        <button className="text-xs font-medium text-[var(--color-brown)] hover:underline">Free Up</button>
                      </form>
                    ) : (
                      <form action={adminMarkPlotFilled}>
                        <input type="hidden" name="plotNumber" value={p.plot_number} />
                        <button className="text-xs font-medium text-[var(--color-green)] hover:underline">Quick Fill</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  // --- Tab 4: Harvest ---------------------------------------------------
  const harvestContent = (
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
        <p className="text-sm text-[var(--color-ink-soft)]">No members have set a harvest preference yet.</p>
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
                  {method}{pref.schedule === "monthly" ? ` · ~${pref.installment_kg} kg/month` : " · one-time"}
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
                <input name="totalKg" type="number" min={1} placeholder="Confirmed total (kg)" defaultValue={total ?? ""} className="input flex-1" />
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
        <div className="max-h-[400px] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
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
                    <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">{new Date(d.delivered_at).toLocaleDateString("en-IN")}</td>
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
                  <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">No deliveries recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div>
      <PageHeader title="Members" subtitle={`${filled} filled · ${available} available · ${plots.length} total plots`} />
      <Tabs
        tabs={[
          { id: "members", label: "Members", content: membersContent },
          { id: "accounts", label: "All Accounts", content: accountsContent },
          { id: "plots", label: "All Plots", content: plotsContent },
          { id: "harvest", label: "Harvest", content: harvestContent },
        ]}
      />
    </div>
  );
}
