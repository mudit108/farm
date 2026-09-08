import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export type HarvestDistribution = {
  model: "pooled" | "per_plot";
  deductionPercent: number;
  totalPlots: number;
};

/**
 * Read by the Terms of Service and Membership Agreement so their
 * description of how the harvest is divided always matches what's
 * actually configured at /admin/crops. Hardcoding this would risk the
 * legal documents describing a model the farm no longer uses.
 */
export async function getHarvestDistribution(): Promise<HarvestDistribution> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("khet_club_season")
    .select("harvest_distribution_model, harvest_deduction_percent, total_plots")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    console.error("getHarvestDistribution failed:", error?.message);
    return { model: "pooled", deductionPercent: 0, totalPlots: 0 };
  }

  return {
    model: (data.harvest_distribution_model as "pooled" | "per_plot") ?? "pooled",
    deductionPercent: Number(data.harvest_deduction_percent ?? 0),
    totalPlots: Number(data.total_plots ?? 0),
  };
}
