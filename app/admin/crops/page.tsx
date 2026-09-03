import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { currentCrop } from "@/lib/demo-data";
import { createServiceClient } from "@/lib/supabase/service";
import { adminUpdateSeason } from "@/app/actions/admin-content";
import { ResizeFarmForm } from "@/components/admin/resize-farm-form";

export const dynamic = "force-dynamic";

type Season = {
  current_stage: string;
  progress: number;
  health: string;
  sowing_date: string | null;
  estimated_harvest: string | null;
  registration_deadline: string | null;
  total_plots: number;
};

export default async function CropsManagementPage() {
  const supabase = createServiceClient();
  const [{ data }, { count: filledCount }] = await Promise.all([
    supabase.rpc("khet_club_get_season"),
    supabase.from("khet_club_plots").select("plot_number", { count: "exact", head: true }).eq("status", "filled"),
  ]);
  const season = (data as Season[] | null)?.[0] ?? null;

  return (
    <div>
      <PageHeader title="Crops & Season" subtitle="Mera Khet currently grows one crop per season." />

      <div className="p-6 sm:px-10">
        <Card className="max-w-md p-5">
          <p className="font-display text-lg uppercase">{currentCrop.name}</p>
          <p className="text-xs text-[var(--color-ink-soft)]">{currentCrop.localName} · {currentCrop.season}</p>
          <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
            {currentCrop.stages.length} stages · ~{currentCrop.durationDays} days
          </p>
        </Card>

        <Card className="mt-6 max-w-lg p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Farm Size
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Total plots across the whole farm — changes here update the
            grid everywhere: the homepage, plot selection, and every
            admin page.
          </p>
          <div className="mt-3">
            <ResizeFarmForm currentTotal={season?.total_plots ?? 80} filledCount={filledCount ?? 0} />
          </div>
        </Card>

        <Card className="mt-6 max-w-lg p-6">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Season State — shown to every customer
          </p>
          <form action={adminUpdateSeason} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Current stage</span>
              <select name="currentStage" defaultValue={season?.current_stage} className="input">
                {currentCrop.stages.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Progress (%)</span>
              <input name="progress" type="number" min={0} max={100} defaultValue={season?.progress ?? 0} className="input" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Farm health</span>
              <input name="health" defaultValue={season?.health ?? ""} className="input" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Sowing date</span>
              <input name="sowingDate" type="date" defaultValue={season?.sowing_date ?? ""} className="input" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Estimated harvest</span>
              <input name="estimatedHarvest" type="date" defaultValue={season?.estimated_harvest ?? ""} className="input" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Registration deadline</span>
              <input name="registrationDeadline" type="date" defaultValue={season?.registration_deadline ?? ""} className="input" />
              <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">
                Last day customers can buy a plan or add more plots. Leave blank for no deadline.
              </span>
            </label>
            <Button type="submit" className="w-full">Update Season</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
