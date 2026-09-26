import { getMyInstallmentPlans } from "@/app/actions/payment";
import Link from "next/link";
import { Wifi, ClipboardCheck, Heart, Package, Sprout, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { currentCrop, summarizePlotHoldings, FEEDING_FAMILIES_PER_PLOT } from "@/lib/demo-data";
import { createSessionClient } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

type MyPlot = {
  plot_number: number;
  status: "available" | "filled";
  plan_id: string | null;
  assigned_at: string | null;
  approved_at: string | null;
};
type Season = { current_stage: string; progress: number; sowing_date: string | null; estimated_harvest: string | null };
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
  let confirmedTotalKg: number | null = null;
  let deliveredKg = 0;
  let hasCertificate = false;
  let balances: Awaited<ReturnType<typeof getMyInstallmentPlans>> = [];
  if (user) {
    balances = await getMyInstallmentPlans();
    const [{ data }, { data: cameraData }, { data: prefData }, { data: deliveryData }, { count: certCount }] =
      await Promise.all([
        supabase
          .from("khet_club_plots")
          .select("plot_number, status, plan_id, assigned_at, approved_at")
          .eq("user_id", user.id)
          .order("plot_number"),
        supabase.rpc("khet_club_my_camera"),
        supabase
          .from("khet_club_harvest_preferences")
          .select("confirmed_total_kg")
          .eq("user_id", user.id)
          .maybeSingle(),
        // Voided deliveries must never count toward the member's total.
        supabase
          .from("khet_club_harvest_deliveries")
          .select("kg_delivered")
          .eq("user_id", user.id)
          .is("voided_at", null),
        supabase
          .from("khet_club_certificates")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);
    myPlots = (data ?? []) as MyPlot[];
    hasCamera = ((cameraData as { status: string }[] | null)?.length ?? 0) > 0;
    confirmedTotalKg = prefData?.confirmed_total_kg ?? null;
    deliveredKg = ((deliveryData ?? []) as { kg_delivered: number }[]).reduce((sum, d) => sum + d.kg_delivered, 0);
    hasCertificate = (certCount ?? 0) > 0;
  }

  // "Good morning" was hardcoded regardless of the actual time.
  const hour = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false });
  const greeting = Number(hour) < 12 ? "Good morning" : Number(hour) < 17 ? "Good afternoon" : "Good evening";
  const firstName = ((user?.user_metadata?.full_name as string | undefined) ?? "").trim().split(/\s+/)[0];

  const holdings = summarizePlotHoldings(myPlots);
  const plotList = myPlots.map((p) => `#${p.plot_number}`).join(", ");

  return (
    <div>
      <PageHeader
        title={firstName ? `${greeting}, ${firstName}` : greeting}
        subtitle={myPlots.length > 0 ? `${holdings.label} · ${plotList}` : "Sujangarh, Rajasthan"}
      />

      {balances.filter((b) => b.plots_still_held).length > 0 && (
        <div className="px-6 pt-6 sm:px-10">
          <Link
            href="/dashboard/my-farm"
            className="block rounded-[var(--radius-card)] border border-[var(--color-brown)]/30 bg-[var(--color-gold)]/10 p-4 text-sm hover:border-[var(--color-brown)]/60"
          >
            <span className="font-medium">
              Balance due: ₹
              {balances
                .filter((b) => b.plots_still_held)
                .reduce((s, b) => s + b.balance_due_inr, 0)
                .toLocaleString("en-IN")}
            </span>
            <span className="text-[var(--color-ink-soft)]">
              {" "}
              — due{" "}
              {new Date(`${balances[0].balance_due_date}T00:00:00+05:30`).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                timeZone: "Asia/Kolkata",
              })}
              . Pay from My Farm →
            </span>
          </Link>
        </div>
      )}

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
                <Stat label="Status" value={myPlots.every((p) => p.approved_at) ? "Confirmed" : "Awaiting approval"} />
                <Stat
                  label="Assigned"
                  value={myPlots[0].assigned_at ? new Date(myPlots[0].assigned_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}
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

      {myPlots.length > 0 && (
        <div className="grid gap-4 px-6 pb-2 sm:px-10 lg:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Sprout className="h-4 w-4 text-[var(--color-green-deep)]" />
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                Season Progress
              </p>
            </div>
            <p className="mt-2 font-display text-xl capitalize">{season?.current_stage ?? "Field Preparation"}</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-ink)]/10">
              <div
                className="h-full rounded-full bg-[var(--color-gold)]"
                style={{ width: `${season?.progress ?? 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
              {season?.estimated_harvest
                ? `Harvest expected ${new Date(season.estimated_harvest).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}`
                : "Harvest date to be confirmed"}
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[var(--color-green-deep)]" />
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                Your Harvest
              </p>
            </div>
            {confirmedTotalKg ? (
              <>
                <p className="mt-2 font-display text-xl">
                  {deliveredKg} of {confirmedTotalKg} kg
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-ink)]/10">
                  <div
                    className="h-full rounded-full bg-[var(--color-green)]"
                    style={{ width: `${Math.min(100, Math.round((deliveredKg / confirmedTotalKg) * 100))}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                  {deliveredKg >= confirmedTotalKg ? "Fully delivered" : `${confirmedTotalKg - deliveredKg} kg still to come`}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 font-display text-xl">Not yet weighed</p>
                <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                  Your total is confirmed after harvest, then deliveries begin.
                </p>
              </>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-[var(--color-brown)]" />
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                Your Impact
              </p>
            </div>
            <p className="mt-2 font-display text-xl">
              &#8377;{(myPlots.length * FEEDING_FAMILIES_PER_PLOT).toLocaleString("en-IN")}
            </p>
            <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
              Feeding roughly {Math.round((myPlots.length * FEEDING_FAMILIES_PER_PLOT) / 1000 * 2)} families,
              included in your membership.
            </p>
            <Link
              href="/dashboard/my-farm"
              className="mt-3 inline-block text-xs font-medium text-[var(--color-green-deep)] hover:underline"
            >
              {hasCertificate ? "View certificate & receipts" : "View my farm"} &rarr;
            </Link>
          </Card>
        </div>
      )}

      <div className="px-6 pb-10 sm:px-10">
        <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
          Latest Farm Update
        </p>
        {latestUpdate ? (
          <Card className="mt-3 p-5">
            <p className="text-xs text-[var(--color-ink-soft)]">
              {new Date(latestUpdate.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
            </p>
            <p className="mt-1 font-medium">{latestUpdate.title}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-[var(--color-ink-soft)]">{latestUpdate.description}</p>
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
