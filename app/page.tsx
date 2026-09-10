import { Nav } from "@/components/farm/nav";
import { Hero } from "@/components/farm/hero";
import { OurStory } from "@/components/farm/our-story";
import { HowItWorks } from "@/components/farm/how-it-works";
import { SeasonalCrops } from "@/components/farm/seasonal-crops";
import { HarvestOptions } from "@/components/farm/harvest-options";
import { FarmTransparency, type SeasonSnapshot } from "@/components/farm/farm-transparency";
import { FarmUpdates } from "@/components/farm/farm-updates";
import { VisitAndLocation } from "@/components/farm/visit-and-location";
import { FeedingFamiliesImpact } from "@/components/farm/feeding-families-impact";
import { Pricing } from "@/components/farm/pricing";
import { PlotRegistration } from "@/components/farm/plot-registration";
import { LegalTrust } from "@/components/farm/legal-trust";
import { Faq } from "@/components/farm/faq";
import { FinalCta } from "@/components/farm/final-cta";
import { Contact, Footer } from "@/components/farm/contact-and-footer";
import { createAnonClient } from "@/lib/supabase/anon";
import { getCurrentMember } from "@/lib/current-member";
import { currentCrop, membershipPlans } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

type SeasonPublicInfo = {
  contact_email: string | null;
  contact_phone: string | null;
  fff_collected_inr: number;
  current_stage: string;
  progress: number;
  sowing_date: string | null;
  estimated_harvest: string | null;
  registration_deadline: string | null;
  total_plots: number;
  warehouse_capacity_tonnes: number;
  season_label: string;
};

async function getSeasonPublicInfo(): Promise<SeasonPublicInfo | null> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("khet_club_get_season");
  if (error) {
    console.error("Failed to load season public info:", error.message);
    return null;
  }
  return (data as SeasonPublicInfo[] | null)?.[0] ?? null;
}

/** Live plot counts drive the hero's scarcity bar and the closing CTA. */
async function getPlotCounts(): Promise<{ filled: number; total: number }> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("khet_club_all_plot_statuses");
  if (error || !data) {
    console.error("Failed to load plot counts:", error?.message);
    return { filled: 0, total: 0 };
  }
  const rows = data as { plot_number: number; status: string }[];
  return { filled: rows.filter((r) => r.status === "filled").length, total: rows.length };
}

async function getLowestPrice(): Promise<number> {
  const supabase = createAnonClient();
  const { data } = await supabase.from("khet_club_plan_prices").select("price_inr");
  const prices = (data ?? []).map((r) => r.price_inr as number).filter((n) => Number.isFinite(n));
  return prices.length > 0 ? Math.min(...prices) : membershipPlans[0].priceInr;
}

export default async function Home() {
  const [season, plotCounts, fromPriceInr, member] = await Promise.all([
    getSeasonPublicInfo(),
    getPlotCounts(),
    getLowestPrice(),
    getCurrentMember(),
  ]);

  const warehouseTonnes = season?.warehouse_capacity_tonnes ?? 30;

  const seasonSnapshot: SeasonSnapshot | null = season
    ? {
        current_stage: season.current_stage,
        progress: season.progress,
        sowing_date: season.sowing_date,
        estimated_harvest: season.estimated_harvest,
      }
    : null;

  return (
    <main>
      <Nav isLoggedIn={member.isLoggedIn} firstName={member.firstName} />
      <Hero filledPlots={plotCounts.filled} totalPlots={plotCounts.total} />
      <OurStory />
      <HowItWorks />
      <SeasonalCrops />
      <HarvestOptions warehouseTonnes={warehouseTonnes} />
      <FarmTransparency
        season={seasonSnapshot}
        cropName={`${currentCrop.name} (${currentCrop.localName})`}
      />
      <FarmUpdates />
      <VisitAndLocation />
      <FeedingFamiliesImpact
        collectedInr={season?.fff_collected_inr ?? 0}
        remaining={Math.max(plotCounts.total - plotCounts.filled, 0)}
        totalPlots={plotCounts.total}
      />
      <Pricing />
      <PlotRegistration seasonLabel={season?.season_label ?? ""} />
      <LegalTrust />
      <Faq warehouseTonnes={warehouseTonnes} />
      <FinalCta
        fromPriceInr={fromPriceInr}
        remaining={Math.max(plotCounts.total - plotCounts.filled, 0)}
        deadline={season?.registration_deadline ?? null}
      />
      <Contact contactEmail={season?.contact_email ?? null} contactPhone={season?.contact_phone ?? null} />
      <Footer contactEmail={season?.contact_email ?? null} contactPhone={season?.contact_phone ?? null} />
    </main>
  );
}


