import { Check, Heart } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { membershipPlans, planIncludes, FEEDING_FAMILIES_PER_PLOT } from "@/lib/demo-data";
import { createAnonClient } from "@/lib/supabase/anon";

async function getLivePrices(): Promise<Map<string, number>> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.from("khet_club_plan_prices").select("plan_id, price_inr");
  if (error || !data) {
    console.error("Failed to load live plan prices:", error?.message);
    return new Map(membershipPlans.map((p) => [p.id, p.priceInr]));
  }
  return new Map(data.map((row) => [row.plan_id as string, row.price_inr as number]));
}

export async function Pricing() {
  const pricesByPlan = await getLivePrices();
  const basePricePerPlot = (pricesByPlan.get("1-plot") ?? membershipPlans[0].priceInr) / membershipPlans[0].plots;

  const plans = membershipPlans.map((plan) => {
    const priceInr = pricesByPlan.get(plan.id) ?? plan.priceInr;
    const linearPrice = basePricePerPlot * plan.plots;
    const savings = Math.max(Math.round(linearPrice - priceInr), 0);
    return { ...plan, priceInr, savings };
  });

  return (
    <section id="pricing" className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg)] py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal>
          <div className="text-center">
            <h2 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Choose your plan.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[var(--color-ink-soft)]">
              Seasonal plans only — no annual commitment. This season:
              Gehu (wheat), sowing near Diwali.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 80}>
              <Card
                className={
                  "flex h-full flex-col p-6 " +
                  (plan.id === "3-plots" ? "border-[var(--color-green)] ring-1 ring-[var(--color-green)]" : "")
                }
              >
                <Badge tone={plan.id === "3-plots" ? "green" : "brown"}>{plan.tagline}</Badge>
                <p className="mt-4 font-display text-3xl">{plan.name}</p>
                <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{plan.label}</p>

                <ul className="mt-4 space-y-2 text-sm text-[var(--color-ink-soft)]">
                  <li>🌱 {plan.areaSqFt.toLocaleString()} sq ft{plan.id === "6-plots" ? " / 1 acre" : ` (${plan.approxAcre})`}</li>
                  <li>🌾 {plan.wheatMinKg}–{plan.wheatMaxKg.toLocaleString()} kg wheat</li>
                </ul>

                <p className="mt-5 font-display text-2xl">₹{plan.priceInr.toLocaleString("en-IN")}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">per season</p>
                {plan.savings > 0 && (
                  <p className="mt-1 text-xs font-medium text-[var(--color-green-deep)]">
                    Save ₹{plan.savings.toLocaleString("en-IN")} vs. the per-plot rate
                  </p>
                )}
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-brown)]">
                  <Heart className="h-3.5 w-3.5" />
                  Includes ₹{(plan.plots * FEEDING_FAMILIES_PER_PLOT).toLocaleString("en-IN")} for Feeding Families Fund
                </p>

                <Link href="/auth/signup" className="mt-auto pt-6">
                  <Button size="lg" className="w-full">
                    Choose {plan.name}
                  </Button>
                </Link>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <Card className="mt-10 overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] px-5 py-3">
              <p className="text-sm font-medium">Compare plans</p>
              <p className="text-xs text-[var(--color-ink-soft)]">6 plots = exactly 1 acre</p>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                <tr>
                  <th className="px-5 py-3 font-medium">Membership</th>
                  <th className="px-5 py-3 font-medium">Farm Area</th>
                  <th className="px-5 py-3 font-medium">Wheat Target</th>
                  <th className="px-5 py-3 font-medium">Approx. Farm Share</th>
                  <th className="px-5 py-3 font-medium">Price / Season</th>
                  <th className="px-5 py-3 font-medium">Feeding Families Fund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink)]/10">
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-5 py-3 font-medium">{plan.name} <span className="font-normal text-[var(--color-ink-soft)]">({plan.label})</span></td>
                    <td className="px-5 py-3">{plan.areaSqFt.toLocaleString()} sq ft</td>
                    <td className="px-5 py-3">{plan.wheatMinKg}–{plan.wheatMaxKg.toLocaleString()} kg</td>
                    <td className="px-5 py-3">{plan.approxAcre}</td>
                    <td className="px-5 py-3 font-medium">
                      ₹{plan.priceInr.toLocaleString("en-IN")}
                      {plan.savings > 0 && (
                        <span className="ml-1.5 text-xs font-normal text-[var(--color-green-deep)]">
                          (save ₹{plan.savings.toLocaleString("en-IN")})
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-brown)]">
                      ₹{(plan.plots * FEEDING_FAMILIES_PER_PLOT).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-10">
            <p className="text-center font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Every plan includes
            </p>
            <ul className="mx-auto mt-4 grid max-w-3xl gap-x-8 gap-y-2 sm:grid-cols-2">
              {planIncludes.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-ink-soft)]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-green)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <p className="mx-auto mt-8 max-w-lg text-center text-xs text-[var(--color-ink-soft)]">
          Wheat targets are estimates based on typical yields, not
          guarantees. *CCTV access depends on camera connectivity at your
          plots. Prices shown are per season and configurable from the
          admin dashboard — confirm final pricing at checkout. The
          Feeding Families Fund amount is earmarked from the price shown
          above, not charged in addition to it.
        </p>
      </div>
    </section>
  );
}
