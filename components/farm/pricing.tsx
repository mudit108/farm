import { Check } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { membershipPlans, planIncludes } from "@/lib/demo-data";

export function Pricing() {
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
          {membershipPlans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 80}>
              <Card
                className={
                  "flex h-full flex-col p-6 " +
                  (plan.id === "3-plots" ? "border-[var(--color-green)] ring-1 ring-[var(--color-green)]" : "")
                }
              >
                <Badge tone={plan.id === "3-plots" ? "green" : "brown"}>{plan.tagline}</Badge>
                <p className="mt-4 font-display text-2xl">{plan.label}</p>

                <ul className="mt-4 space-y-2 text-sm text-[var(--color-ink-soft)]">
                  <li>🌱 {plan.areaSqFt.toLocaleString()} sq ft{plan.id === "6-plots" ? " / 1 acre" : ` (${plan.approxAcre})`}</li>
                  <li>🌾 {plan.wheatMinKg}–{plan.wheatMaxKg.toLocaleString()} kg wheat</li>
                </ul>

                <p className="mt-5 font-display text-2xl">₹{plan.priceInr.toLocaleString("en-IN")}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">per season</p>

                <Link href="/auth/signup" className="mt-auto pt-6">
                  <Button size="lg" className="w-full">
                    Own {plan.label}
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
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                <tr>
                  <th className="px-5 py-3 font-medium">Membership</th>
                  <th className="px-5 py-3 font-medium">Farm Area</th>
                  <th className="px-5 py-3 font-medium">Wheat Target</th>
                  <th className="px-5 py-3 font-medium">Approx. Farm Share</th>
                  <th className="px-5 py-3 font-medium">Price / Season</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink)]/10">
                {membershipPlans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-5 py-3 font-medium">{plan.label}</td>
                    <td className="px-5 py-3">{plan.areaSqFt.toLocaleString()} sq ft</td>
                    <td className="px-5 py-3">{plan.wheatMinKg}–{plan.wheatMaxKg.toLocaleString()} kg</td>
                    <td className="px-5 py-3">{plan.approxAcre}</td>
                    <td className="px-5 py-3 font-medium">₹{plan.priceInr.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          admin dashboard — confirm final pricing at checkout.
        </p>
      </div>
    </section>
  );
}
