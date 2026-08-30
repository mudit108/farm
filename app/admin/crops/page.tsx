import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { demoCrops } from "@/lib/demo-data";

export default function CropsManagementPage() {
  return (
    <div>
      <PageHeader title="Crops" subtitle="Khet Club currently grows one crop per season." />

      <div className="p-6 sm:px-10">
        <div className="mb-4 flex justify-end">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Crop
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demoCrops.map((crop) => (
            <Card key={crop.id} className="p-5">
              <p className="font-display text-lg uppercase">{crop.name}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">{crop.localName} · {crop.season}</p>
              <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                {crop.stages.length} stages · ~{crop.durationDays} days
              </p>
              <button className="mt-3 text-xs font-medium text-[var(--color-green)]">Edit stages</button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
