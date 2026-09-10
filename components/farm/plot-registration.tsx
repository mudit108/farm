import Link from "next/link";
import { CheckCircle2, Heart, Ruler, Sprout } from "lucide-react";
import { createAnonClient } from "@/lib/supabase/anon";
import { Reveal } from "@/components/ui/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentMember } from "@/lib/current-member";
import { membershipPlans, FEEDING_FAMILIES_PER_PLOT, currentCrop } from "@/lib/demo-data";

type PlotRow = { plot_number: number; status: "available" | "filled" };

async function getPlots(): Promise<PlotRow[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("khet_club_all_plot_statuses");

  if (error) {
    console.error("Failed to load khet_club_all_plot_statuses:", error.message);
    return [];
  }
  return (data ?? []) as PlotRow[];
}


export async function PlotRegistration({ seasonLabel = "" }: { seasonLabel?: string } = {}) {
  const [plots, member] = await Promise.all([getPlots(), getCurrentMember()]);
  const myPlotNumbers = member.plotNumbers;
  const myPlan = membershipPlans.find((p) => p.id === member.planId);
  const filled = plots.filter((p) => p.status === "filled").length;
  const available = plots.length - filled;
  const myPlotSet = new Set(myPlotNumbers);

  return (
    <section id="register" className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-14 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
            Plot Registration
          </p>
          <h2 className="mt-3 max-w-lg font-display text-[1.75rem] leading-[1.15] tracking-tight sm:text-5xl sm:leading-tight">
            {plots.length > 0 ? `${plots.length} plots.` : "Limited plots."} Reserve yours.
          </h2>
          <p className="mt-4 max-w-md text-[var(--color-ink-soft)]">
            {plots.length > 0 ? (
              <>
                <span className="font-semibold text-[var(--color-ink)]">{filled} filled</span>,{" "}
                <span className="font-semibold text-[var(--color-ink)]">{available} available</span>{" "}
                out of {plots.length} total plots — updated live.
              </>
            ) : (
              "Plot data is temporarily unavailable — please check back shortly."
            )}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <Reveal delay={80}>
            <Card className="p-6 sm:p-8">
              <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 md:grid-cols-10">
                {plots.map((p) => (
                  <div
                    key={p.plot_number}
                    title={`Plot #${p.plot_number} — ${p.status}`}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md font-mono-data text-[9px] font-semibold sm:text-[10px]",
                      myPlotSet.has(p.plot_number)
                        ? "bg-[var(--color-brown)] text-white"
                        : p.status === "filled"
                        ? "bg-[var(--color-ink)]/15 text-[var(--color-ink-soft)]"
                        : "bg-[var(--color-green)] text-white"
                    )}
                  >
                    {p.plot_number}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-[var(--color-ink-soft)]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-green)]" /> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-ink)]/15" /> Filled
                </span>
                {myPlotNumbers.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-brown)]" /> Yours
                  </span>
                )}
              </div>
            </Card>
          </Reveal>

          <Reveal delay={140}>
            <Card className="p-6 sm:p-8">
              {myPlotNumbers.length > 0 ? (
                <div>
                  <div className="text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--color-green-deep)]" />
                    <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
                      {member.firstName ? `Welcome back, ${member.firstName}` : "Welcome back"}
                    </p>
                    <p className="mt-1 font-display text-2xl">
                      {myPlotNumbers.length > 1 ? "Plots " : "Plot "}
                      {myPlotNumbers.map((n) => `#${n}`).join(", ")}
                    </p>
                    {myPlan && (
                      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                        {myPlan.name} ({myPlan.label}) &middot; {seasonLabel}
                      </p>
                    )}
                  </div>

                  <dl className="mt-5 space-y-2.5 border-t border-[var(--color-ink)]/10 pt-4 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-2 text-[var(--color-ink-soft)]">
                        <Sprout className="h-4 w-4" /> Growing
                      </dt>
                      <dd className="font-medium">{currentCrop.name} ({currentCrop.localName})</dd>
                    </div>
                    {myPlan && (
                      <div className="flex items-center justify-between">
                        <dt className="flex items-center gap-2 text-[var(--color-ink-soft)]">
                          <Ruler className="h-4 w-4" /> Your area
                        </dt>
                        <dd className="font-medium">{myPlan.areaSqFt.toLocaleString("en-IN")} sq ft</dd>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-2 text-[var(--color-ink-soft)]">
                        <Heart className="h-4 w-4" /> You&apos;ve contributed
                      </dt>
                      <dd className="font-medium">
                        &#8377;{(myPlotNumbers.length * FEEDING_FAMILIES_PER_PLOT).toLocaleString("en-IN")}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <Link href="/dashboard/my-farm">
                      <Button className="w-full">My Farm</Button>
                    </Link>
                    <Link href="/dashboard/select-plot">
                      <Button variant="outline" className="w-full">Add More Plots</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-display text-xl">Reserve your plot</p>
                  <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                    Create an account, confirm your email, then choose your
                    plan (1, 3, or 6 plots) from your dashboard.
                  </p>
                  <Link href="/auth/signup">
                    <Button size="lg" className="mt-6 w-full">
                      Create Account
                    </Button>
                  </Link>
                  <p className="mt-3 text-center text-xs text-[var(--color-ink-soft)]">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="font-medium text-[var(--color-green)]">
                      Log in
                    </Link>{" "}
                    to select your plan.
                  </p>
                </>
              )}
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
