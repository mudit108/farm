import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { demoPlots, demoFarm } from "@/lib/demo-data";

export default function FarmManagementPage() {
  return (
    <div>
      <PageHeader title="Farm & Plots" subtitle={`${demoFarm.name} · ${demoFarm.totalAcres} acres · ${demoFarm.totalPlots} plots total`} />

      <div className="p-6 sm:px-10">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[var(--color-ink-soft)]">
            {demoPlots.length} plots (7,260 sq ft each) · {demoPlots.filter((p) => p.status === "active").length} assigned
          </p>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Plot
          </Button>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="max-h-[520px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                <tr>
                  <th className="px-5 py-3 font-medium">Plot ID</th>
                  <th className="px-5 py-3 font-medium">Area</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Crop</th>
                  <th className="px-5 py-3 font-medium">Camera</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink)]/10">
                {demoPlots.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 font-mono-data">{p.id}</td>
                    <td className="px-5 py-3">{p.areaSqFt.toLocaleString()} sq ft</td>
                    <td className="px-5 py-3">
                      <Badge tone={p.status === "active" ? "green" : "brown"}>{p.status}</Badge>
                    </td>
                    <td className="px-5 py-3">{p.crop ?? "—"}</td>
                    <td className="px-5 py-3">{p.status === "active" ? "Assigned" : "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <button className="text-xs font-medium text-[var(--color-green)]">Manage</button>
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
