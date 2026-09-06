import { Nav } from "@/components/farm/nav";
import { Hero } from "@/components/farm/hero";
import { HowItWorks } from "@/components/farm/how-it-works";
import { SeasonalCrops } from "@/components/farm/seasonal-crops";
import { HarvestOptions } from "@/components/farm/harvest-options";
import { LiveFarm } from "@/components/farm/live-farm";
import { DashboardPreview } from "@/components/farm/dashboard-preview";
import { FarmUpdates } from "@/components/farm/farm-updates";
import { Transparency } from "@/components/farm/transparency";
import { VisitAndLocation } from "@/components/farm/visit-and-location";
import { Pricing } from "@/components/farm/pricing";
import { PlotRegistration } from "@/components/farm/plot-registration";
import { LegalTrust } from "@/components/farm/legal-trust";
import { Faq } from "@/components/farm/faq";
import { FinalCta } from "@/components/farm/final-cta";
import { Contact, Footer } from "@/components/farm/contact-and-footer";
import { createAnonClient } from "@/lib/supabase/anon";

export const dynamic = "force-dynamic";

type ContactInfo = { contact_email: string | null; contact_phone: string | null };

async function getContactInfo(): Promise<ContactInfo> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("khet_club_get_season");
  if (error) {
    console.error("Failed to load contact info:", error.message);
    return { contact_email: null, contact_phone: null };
  }
  const season = (data as ContactInfo[] | null)?.[0];
  return { contact_email: season?.contact_email ?? null, contact_phone: season?.contact_phone ?? null };
}

export default async function Home() {
  const { contact_email, contact_phone } = await getContactInfo();

  return (
    <main>
      <Nav />
      <Hero />
      <HowItWorks />
      <SeasonalCrops />
      <HarvestOptions />
      <LiveFarm />
      <DashboardPreview />
      <FarmUpdates />
      <Transparency />
      <VisitAndLocation />
      <Pricing />
      <PlotRegistration />
      <LegalTrust />
      <Faq />
      <FinalCta />
      <Contact contactEmail={contact_email} contactPhone={contact_phone} />
      <Footer contactEmail={contact_email} contactPhone={contact_phone} />
    </main>
  );
}
