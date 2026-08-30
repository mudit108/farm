import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { demoFarm } from "@/lib/demo-data";

const stats = [
  { label: "Total Customers", value: "8" },
  { label: "Active Memberships", value: "8" },
  { label: "Allocated Plots", value: `${demoFarm.totalPlots - demoFarm.availablePlots} / ${demoFarm.totalPlots}` },
  { label: "Available Plots", value: `${demoFarm.availablePlots}` },
  { label: "Active Crops", value: "1 (Wheat)" },
  { label: "Cameras Online", value: `${demoFarm.camerasOnline}` },
  { label: "Season Starts", value: "Near Diwali" },
  { label: "Visit Requests", value: "1" },
];

export default function AdminOverview() {
  return (
    <div>
      <PageHeader title="Overview" subtitle={`${demoFarm.name} · ${demoFarm.location}`} />

      <div className="grid gap-4 p-6 sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              {s.label}
            </p>
            <p className="mt-2 font-display text-2xl">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="px-6 pb-10 sm:px-10">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="font-medium">Farm visit request — Priya Sharma</p>
            <Badge tone="gold">Pending</Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Requested for 5 Sep 2026 · 2 visitors
          </p>
        </Card>
      </div>
    </div>
  );
}
