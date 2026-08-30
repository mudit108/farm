import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HarvestPreference } from "@/components/dashboard/harvest-preference";
import { demoPlot } from "@/lib/demo-data";

export default function MembershipPage() {
  return (
    <div>
      <PageHeader title="Membership" subtitle="Your seasonal plan, status, and payment history." />

      <div className="grid gap-6 p-6 sm:px-10 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg">3 Plots — Wheat Season 2026–27</p>
            <Badge tone="gold">Upcoming</Badge>
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Plan</dt>
              <dd className="font-medium">Seasonal — 3 Plots (Stock Up for the Year)</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Area</dt>
              <dd className="font-medium">{demoPlot.areaSqFt.toLocaleString()} sq ft ({demoPlot.approxAcre})</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Wheat target</dt>
              <dd className="font-medium">{demoPlot.wheatMinKg}–{demoPlot.wheatMaxKg} kg</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Price</dt>
              <dd className="font-medium">₹{demoPlot.priceInr.toLocaleString("en-IN")} / season</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Crop</dt>
              <dd className="font-medium">Gehu (Wheat)</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Season starts</dt>
              <dd className="font-medium">Near Diwali 2026</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Expected harvest</dt>
              <dd className="font-medium">Mar–Apr 2027</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">Plots</dt>
              <dd className="font-medium">{demoPlot.plotIds.join(", ")}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-[var(--color-ink-soft)]">
            Only seasonal plans are offered — this membership covers the
            upcoming wheat season only. Renew each season to continue.
            Wheat target is an estimate, not a guarantee.
          </p>
          <Button variant="outline" className="mt-4 w-full">Upgrade to 6 Plots (1 Acre)</Button>
        </Card>

        <Card className="p-6">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Payment History
          </p>
          <div className="mt-4 divide-y divide-[var(--color-ink)]/10">
            <div className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium">Wheat Season 2026–27 — 3 Plots</p>
                <p className="text-xs text-[var(--color-ink-soft)]">10 Aug 2026 · ₹{demoPlot.priceInr.toLocaleString("en-IN")}</p>
              </div>
              <Badge tone="green">Paid</Badge>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <HarvestPreference />
        </div>
      </div>
    </div>
  );
}
