import Link from "next/link";
import { ClipboardCheck, Download, Clock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSessionClient } from "@/lib/supabase/session";
import { summarizePlotHoldings } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

type MyPlot = {
  plot_number: number;
  status: "available" | "filled";
  full_name: string | null;
  plan_id: string | null;
  assigned_at: string | null;
  custom_name: string | null;
  claim_batch_id: string | null;
  approved_at: string | null;
};

type Cert = { claim_batch_id: string; certificate_number: string };

export default async function MyFarmPage() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myPlots: MyPlot[] = [];
  let certsByBatch = new Map<string, Cert>();
  if (user) {
    const [{ data }, { data: certData }] = await Promise.all([
      supabase
        .from("khet_club_plots")
        .select("plot_number, status, full_name, plan_id, assigned_at, custom_name, claim_batch_id, approved_at")
        .eq("user_id", user.id)
        .order("plot_number"),
      supabase.from("khet_club_certificates").select("claim_batch_id, certificate_number").eq("user_id", user.id),
    ]);
    myPlots = (data ?? []) as MyPlot[];
    certsByBatch = new Map((certData ?? []).map((c) => [c.claim_batch_id, c as Cert]));
  }

  const holdings = summarizePlotHoldings(myPlots);
  const batchIds = Array.from(new Set(myPlots.map((p) => p.claim_batch_id).filter(Boolean))) as string[];

  return (
    <div>
      <PageHeader title="My Farm" subtitle="Everything about your allocated plot(s)." />

      <div className="p-6 sm:px-10">
        <Card className="max-w-lg p-6">
          {myPlots.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                    {holdings.label ?? "Plots"}
                  </p>
                  {myPlots[0].custom_name && (
                    <p className="mt-0.5 font-display text-lg text-[var(--color-brown)]">{myPlots[0].custom_name}</p>
                  )}
                  <p className="font-display text-2xl">
                    {myPlots.map((p) => `#${p.plot_number}`).join(", ")}
                  </p>
                </div>
                <Badge tone="green">{myPlots[0].status}</Badge>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-5">
                <Info label="Registered To" value={myPlots[0].full_name ?? "—"} />
                <Info label="Plot Count" value={String(myPlots.length)} />
                <Info label="Farm" value="Mera Khet, Sandwa, Rajasthan" />
                <Info
                  label="Assigned"
                  value={myPlots[0].assigned_at ? new Date(myPlots[0].assigned_at).toLocaleDateString("en-IN") : "—"}
                />
              </dl>

              <p className="mt-6 rounded-[var(--radius-sm)] bg-[var(--color-brown-soft)] p-4 text-xs leading-relaxed text-[var(--color-ink-soft)]">
                This allocation reflects your contractual farm participation and
                use rights under your membership agreement.
              </p>

              <div className="mt-6 space-y-2 border-t border-[var(--color-ink)]/10 pt-5">
                <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                  Membership Certificate{batchIds.length > 1 ? "s" : ""}
                </p>
                {batchIds.map((batchId) => {
                  const cert = certsByBatch.get(batchId);
                  const batchPlots = myPlots.filter((p) => p.claim_batch_id === batchId);
                  const plotList = batchPlots.map((p) => `#${p.plot_number}`).join(", ");
                  return (
                    <div key={batchId} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-ink-soft)]">{plotList}</span>
                      {cert ? (
                        <a
                          href={`/api/certificate/download?batch=${batchId}`}
                          className="flex items-center gap-1.5 font-medium text-[var(--color-green)] hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" /> Download ({cert.certificate_number})
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-[var(--color-brown)]">
                          <Clock className="h-3.5 w-3.5" /> Pending admin approval
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <ClipboardCheck className="h-8 w-8 text-[var(--color-brown)]" />
              <p className="font-display text-lg">No plot selected yet</p>
              <p className="max-w-xs text-sm text-[var(--color-ink-soft)]">
                Choose a plan to see your plot details here.
              </p>
              <Link href="/dashboard/select-plot">
                <Button className="mt-2">Select Your Plan</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
