import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createServiceClient } from "@/lib/supabase/service";
import {
  adminMarkPlotAvailable,
  adminMarkPlotFilled,
  adminAssignPlan,
  adminFreeBatch,
} from "@/app/actions/admin-plots";
import { adminApproveBatch, adminResendCertificate } from "@/app/actions/admin-certificate";
import { membershipPlans } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

type PlotRow = {
  plot_number: number;
  status: "available" | "filled";
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

async function getAllPlots(): Promise<PlotRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("khet_club_plots")
    .select("plot_number, status, full_name, phone, email, city, plan_id, claim_batch_id, assigned_at, approved_at")
    .order("plot_number");

  if (error) {
    console.error("Failed to load khet_club_plots:", error);
    return [];
  }
  return data as PlotRow[];
}

async function getCertificates(): Promise<Map<string, CertRow>> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("khet_club_certificates")
    .select("claim_batch_id, certificate_number, email_sent, whatsapp_sent");
  return new Map((data ?? []).map((c) => [c.claim_batch_id, c as CertRow]));
}

function planLabel(planId: string | null) {
  const plan = membershipPlans.find((p) => p.id === planId);
  return plan ? `${plan.name} (${plan.label})` : null;
}

export default async function RegistrationsPage() {
  const [plots, certificatesByBatch] = await Promise.all([getAllPlots(), getCertificates()]);
  const filled = plots.filter((p) => p.status === "filled").length;
  const available = plots.length - filled;
  const availableCount = plots.filter((p) => p.status === "available").length;

  // Group filled plots by claim_batch_id (a "membership") for the summary
  // cards below. Filled plots without a batch id (older single-plot or
  // manual reservations) still show individually in the full table.
  const batches = new Map<string, PlotRow[]>();
  for (const p of plots) {
    if (p.status !== "filled" || !p.claim_batch_id) continue;
    const list = batches.get(p.claim_batch_id) ?? [];
    list.push(p);
    batches.set(p.claim_batch_id, list);
  }

  return (
    <div>
      <PageHeader
        title="Plot Registrations"
        subtitle={`${filled} filled · ${available} available · ${plots.length} total plots`}
      />

      <div className="p-6 sm:px-10">
        {/* Live availability bar */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall availability</span>
            <span className="font-mono-data text-[var(--color-ink-soft)]">
              {filled} / {plots.length} filled
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-green-soft)]">
            <div
              className="h-full rounded-full bg-[var(--color-green)]"
              style={{ width: `${plots.length ? (filled / plots.length) * 100 : 0}%` }}
            />
          </div>
        </Card>

        {/* Manual plan assignment */}
        <Card className="mt-6 p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Manually Assign a Plan
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            For offline reservations — phone/walk-in signups you want reflected here.
            Currently {availableCount} plot{availableCount === 1 ? "" : "s"} available.
          </p>
          <form action={adminAssignPlan} className="mt-4 grid gap-3 sm:grid-cols-6">
            <select name="planId" required className="input sm:col-span-1" defaultValue="">
              <option value="" disabled>
                Plan
              </option>
              {membershipPlans.map((plan) => (
                <option key={plan.id} value={plan.id} disabled={availableCount < plan.plots}>
                  {plan.name} — {plan.label}
                </option>
              ))}
            </select>
            <input name="fullName" placeholder="Full name" className="input sm:col-span-1" />
            <input name="phone" placeholder="Phone" className="input sm:col-span-1" />
            <input name="email" placeholder="Email" className="input sm:col-span-1" />
            <input name="city" placeholder="City" className="input sm:col-span-1" />
            <Button type="submit" size="sm" className="sm:col-span-1">
              Assign
            </Button>
          </form>
        </Card>

        {/* Grouped members (plan-based claims) */}
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
                      <span>
                        {first.assigned_at ? new Date(first.assigned_at).toLocaleDateString("en-IN") : "—"}
                      </span>
                    </div>

                    {cert ? (
                      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--color-ink)]/10 pt-3">
                        <Badge tone="green">Certificate {cert.certificate_number}</Badge>
                        <span className="text-[10px] text-[var(--color-ink-soft)]">
                          Email {cert.email_sent ? "✓" : "✗"} · WhatsApp {cert.whatsapp_sent ? "✓" : "✗"}
                        </span>
                        <a
                          href={`/api/certificate/download?batch=${batchId}`}
                          className="text-xs font-medium text-[var(--color-green)] hover:underline"
                        >
                          Download
                        </a>
                        <form action={adminResendCertificate}>
                          <input type="hidden" name="claimBatchId" value={batchId} />
                          <button className="text-xs font-medium text-[var(--color-brown)] hover:underline">
                            Resend
                          </button>
                        </form>
                      </div>
                    ) : (
                      <form action={adminApproveBatch} className="mt-3 border-t border-[var(--color-ink)]/10 pt-3">
                        <input type="hidden" name="claimBatchId" value={batchId} />
                        <Button type="submit" size="sm" className="w-full">
                          Approve & Issue Certificate
                        </Button>
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

        {/* Full table — every plot individually */}
        <Card className="mt-6 overflow-hidden p-0">
          <div className="max-h-[640px] overflow-y-auto">
            <table className="w-full text-left text-sm">
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
                    <td className="px-4 py-2.5">
                      <Badge tone={p.status === "filled" ? "brown" : "green"}>{p.status}</Badge>
                    </td>
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
                          <button className="text-xs font-medium text-[var(--color-brown)] hover:underline">
                            Free Up
                          </button>
                        </form>
                      ) : (
                        <form action={adminMarkPlotFilled}>
                          <input type="hidden" name="plotNumber" value={p.plot_number} />
                          <button className="text-xs font-medium text-[var(--color-green)] hover:underline">
                            Quick Fill
                          </button>
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
    </div>
  );
}
