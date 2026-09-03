import Link from "next/link";
import { Wifi, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { currentCrop, summarizePlotHoldings } from "@/lib/demo-data";
import { createSessionClient } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

type MyPlot = {
  plot_number: number;
  status: "available" | "filled";
  plan_id: string | null;
  assigned_at: string | null;
};
type Season = { current_stage: string; progress: number };
type Update = { id: string; title: string; description: string; created_at: string };

export default async function DashboardOverview() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: seasonData }, { data: updatesData }] = await Promise.all([
    supabase.rpc("khet_club_get_season"),
    supabase.from("khet_club_updates").select("id, title, description, created_at").order("created_at", { ascending: false }).limit(1),
  ]);
  const season = (seasonData as Season[] | null)?.[0] ?? null;
  const latestUpdate = (updatesData as Update[] | null)?.[0] ?? null;

  let myPlots: MyPlot[] = [];
  let hasCamera = false;
  if (user) {
    const [{ data }, { data: cameraData }] = await Promise.all([
      supabase
        .from("khet_club_plots")
        .select("plot_number, status, plan_id, assigned_at")
        .eq("user_id", user.id)
        .order("plot_number"),
      supabase.rpc("khet_club_my_camera"),
    ]);
    myPlots = (data ?? []) as MyPlot[];
    hasCamera = ((cameraData as { status: string }[] | null)?.length ?? 0) > 0;
  }

  const holdings = summarizePlotHoldings(myPlots);
  const plotList = myPlots.map((p) => `#${p.plot_number}`).join(", ");

  return (
    <div>
      <PageHeader
        title="Good morning 👋"
        subtitle={myPlots.length > 0 ? `${holdings.label} · ${plotList}` : "Sandwa, Rajasthan"}
      />

      <div className="grid gap-6 p-6 sm:px-10 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Your Farm
            </p>
            {myPlots.length > 0 && hasCamera && (
              <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-green-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-green-deep)]">
                <Wifi className="h-3.5 w-3.5" /> Camera Assigned
              </span>
            )}
          </div>

          {myPlots.length > 0 ? (
            <>
              <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
                <Stat label="Plan" value={holdings.label ?? "—"} />
                <Stat label="Plots" value={plotList} />
                <Stat label="Status" value={myPlots[0].status} />
                <Stat
                  label="Assigned"
                  value={myPlots[0].assigned_at ? new Date(myPlots[0].assigned_at).toLocaleDateString("en-IN") : "—"}
                />
              </div>

              <div className="mt-6 flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--color-green-soft)] px-4 py-3 text-sm">
                <span className="text-[var(--color-green-deep)]">Season</span>
                <span className="font-semibold text-[var(--color-green-deep)]">
                  {currentCrop.name} ({currentCrop.localName}) — {season?.current_stage ?? "—"}
                  {season ? ` (${season.progress}%)` : ""}
                </span>
              </div>
            </>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-ink)]/15 py-10 text-center">
              <ClipboardCheck className="h-8 w-8 text-[var(--color-brown)]" />
              <p className="font-display text-lg">You haven&apos;t selected a plan yet</p>
              <p className="max-w-xs text-sm text-[var(--color-ink-soft)]">
                Choose a plan to claim your plot(s) and see your farm details here.
              </p>
              <Link href="/dashboard/select-plot">
                <Button className="mt-2">Select Your Plan</Button>
              </Link>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Membership
          </p>
          <div className="mt-4">
            {myPlots.length > 0 ? (
              <>
                <Badge tone="green">Plots Confirmed</Badge>
                <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
                  Your {holdings.label ?? "plot"} is reserved for the
                  upcoming wheat season.
                </p>
                <Link href="/dashboard/select-plot" className="mt-3 inline-block text-xs font-medium text-[var(--color-green)]">
                  Add more plots →
                </Link>
              </>
            ) : (
              <>
                <Badge tone="brown">No Plan Yet</Badge>
                <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
                  Select a plan to activate your membership.
                </p>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="px-6 pb-10 sm:px-10">
        <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
          Latest Farm Update
        </p>
        {latestUpdate ? (
          <Card className="mt-3 p-5">
            <p className="text-xs text-[var(--color-ink-soft)]">
              {new Date(latestUpdate.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
            <p className="mt-1 font-medium">{latestUpdate.title}</p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{latestUpdate.description}</p>
          </Card>
        ) : (
          <Card className="mt-3 p-5">
            <p className="text-sm text-[var(--color-ink-soft)]">No updates published yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</p>
      <p className="mt-1 font-display text-lg capitalize">{value}</p>
    </div>
  );
}
