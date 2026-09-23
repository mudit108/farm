import { Nav } from "@/components/farm/nav";
import { Hero } from "@/components/farm/hero";
import { OurStory } from "@/components/farm/our-story";
import { HowItWorks } from "@/components/farm/how-it-works";
import { SeasonalCrops } from "@/components/farm/seasonal-crops";
import { FeedingFamiliesImpact } from "@/components/farm/feeding-families-impact";
import { FarmProofStrip } from "@/components/farm/farm-proof-strip";
import { Pricing } from "@/components/farm/pricing";
import { PlotRegistration } from "@/components/farm/plot-registration";
import { LegalTrust } from "@/components/farm/legal-trust";
import { Faq } from "@/components/farm/faq";
import { FinalCta } from "@/components/farm/final-cta";
import { Contact, Footer } from "@/components/farm/contact-and-footer";
import { createAnonClient } from "@/lib/supabase/anon";
import { getCurrentMember } from "@/lib/current-member";
import { getPlotCounts, getLowestPrice } from "@/lib/public-data";
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
  registrations_paused: boolean;
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

export default async function Home() {
  const [season, plotCounts, fromPriceInr, member] = await Promise.all([
    getSeasonPublicInfo(),
    getPlotCounts(),
    getLowestPrice(),
    getCurrentMember(),
  ]);

  const warehouseTonnes = season?.warehouse_capacity_tonnes ?? 30;


  return (
    <main>
      <Nav isLoggedIn={member.isLoggedIn} firstName={member.firstName} />
      {season?.registrations_paused && (
        <div className="border-b border-[var(--color-live)]/20 bg-[var(--color-live)]/10 px-5 py-2.5 text-center text-sm text-[var(--color-ink)]">
          New plot bookings are temporarily paused. Existing members are unaffected — check back shortly.
        </div>
      )}
      <Hero filledPlots={plotCounts.filled} totalPlots={plotCounts.total} />
      <OurStory />
      <HowItWorks />
      <SeasonalCrops />
      <FarmProofStrip
        currentStage={season?.current_stage ?? null}
        cropName={`${currentCrop.name} (${currentCrop.localName})`}
      />
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


